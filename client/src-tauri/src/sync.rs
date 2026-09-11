use std::path::PathBuf;

use sha2::{Digest, Sha256};

use crate::api::SyncFontApi;
use crate::installer::install_font;
use crate::models::{ClientConfig, FontManifestEntry, LocalFontState};
use crate::state::{push_activity, save_config, upsert_font_state};

pub async fn connect_and_sync(
    api_base_url: String,
    sync_code: String,
) -> Result<ClientConfig, String> {
    let api = SyncFontApi::new(api_base_url.clone(), sync_code.clone());
    let library = api.resolve_library_by_code().await?;
    let device_name = hostname::get()
        .ok()
        .and_then(|value| value.into_string().ok())
        .unwrap_or_else(|| "syncFont Device".to_string());
    let platform = current_platform();
    let device = api
        .register_device(&library.id, &device_name, platform)
        .await?;

    let mut config = ClientConfig {
        api_base_url: api_base_url.trim_end_matches('/').to_string(),
        sync_code: library.sync_code,
        library_id: library.id,
        library_name: library.name,
        device_id: Some(device.id),
        last_etag: None,
        last_sync_at: None,
        fonts: Vec::new(),
        activity: Vec::new(),
    };

    push_activity(
        &mut config,
        "info",
        &format!("Connected to library \"{}\".", config.library_name),
    );

    run_sync(&mut config).await?;
    save_config(&config)?;
    Ok(config)
}

pub async fn run_sync(config: &mut ClientConfig) -> Result<(), String> {
    let api = SyncFontApi::new(config.api_base_url.clone(), config.sync_code.clone());
    let manifest = api.fetch_manifest(&config.library_id).await?;

    if config.last_etag.as_deref() == Some(manifest.etag.as_str()) {
        push_activity(&mut config, "info", "Library is already up to date.");
        return Ok(());
    }

    let download_dir = download_dir()?;
    std::fs::create_dir_all(&download_dir).map_err(|error| error.to_string())?;

    let mut installed_ids: Vec<String> = Vec::new();

    for font in &manifest.fonts {
        match sync_font(&api, config, &manifest.library_id, font, &download_dir).await {
            Ok(state) => {
                if state.status == "installed" {
                    installed_ids.push(state.id.clone());
                }
                upsert_font_state(config, state);
            }
            Err(error) => {
                push_activity(
                    config,
                    "error",
                    &format!("Failed to sync {}: {error}", font.original_name),
                );
            }
        }
    }

    let now = chrono::Utc::now().to_rfc3339();
    config.last_etag = Some(manifest.etag.clone());
    config.last_sync_at = Some(now.clone());

    if let Some(device_id) = config.device_id.clone() {
        let _ = api
            .report_device_status(
                &config.library_id,
                &device_id,
                &now,
                &installed_ids,
            )
            .await;
    }

    push_activity(
        config,
        "success",
        &format!("Synced {} font(s).", manifest.fonts.len()),
    );

    Ok(())
}

async fn sync_font(
    api: &SyncFontApi,
    config: &ClientConfig,
    library_id: &str,
    font: &FontManifestEntry,
    download_dir: &PathBuf,
) -> Result<LocalFontState, String> {
    if let Some(existing) = config.fonts.iter().find(|item| item.id == font.id) {
        if existing.sha256 == font.sha256 && existing.status == "installed" {
            return Ok(existing.clone());
        }
    }

    let temp_path = download_dir.join(format!("{}{}", font.id, font.extension));
    api.download_font(library_id, font, &temp_path).await?;

    let hash = file_sha256(&temp_path)?;
    if hash != font.sha256 {
        return Err("Downloaded font hash does not match manifest.".to_string());
    }

    let installed_path = install_font(&temp_path, &font.original_name)?;
    let _ = std::fs::remove_file(&temp_path);

    Ok(LocalFontState {
        id: font.id.clone(),
        sha256: font.sha256.clone(),
        original_name: font.original_name.clone(),
        installed_path: Some(installed_path.to_string_lossy().to_string()),
        status: "installed".to_string(),
    })
}

fn file_sha256(path: &PathBuf) -> Result<String, String> {
    let bytes = std::fs::read(path).map_err(|error| error.to_string())?;
    let digest = Sha256::digest(bytes);
    Ok(hex::encode(digest))
}

fn download_dir() -> Result<PathBuf, String> {
    let base = dirs::cache_dir().ok_or("Could not resolve cache directory.")?;
    Ok(base.join("syncFont").join("downloads"))
}

fn current_platform() -> &'static str {
    #[cfg(target_os = "macos")]
    {
        "macos"
    }
    #[cfg(target_os = "windows")]
    {
        "windows"
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        "linux"
    }
}

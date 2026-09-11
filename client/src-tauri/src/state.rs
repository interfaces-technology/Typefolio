use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use serde::{Deserialize, Serialize};

use crate::models::{ActivityEntry, ClientConfig, ClientStatus, LocalFontState};

pub struct AppState {
    pub config: Mutex<Option<ClientConfig>>,
    pub polling: Mutex<bool>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            config: Mutex::new(load_config()),
            polling: Mutex::new(false),
        }
    }
}

fn config_path() -> PathBuf {
    let base = dirs::data_local_dir().unwrap_or_else(std::env::temp_dir);
    base.join("syncFont").join("client-config.json")
}

fn load_config() -> Option<ClientConfig> {
    let path = config_path();
    let raw = fs::read_to_string(path).ok()?;
    serde_json::from_str(&raw).ok()
}

pub fn save_config(config: &ClientConfig) -> Result<(), String> {
    let path = config_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let raw = serde_json::to_string_pretty(config).map_err(|error| error.to_string())?;
    fs::write(path, raw).map_err(|error| error.to_string())
}

pub fn push_activity(config: &mut ClientConfig, level: &str, message: &str) {
    config.activity.insert(
        0,
        ActivityEntry {
            timestamp: chrono::Utc::now().to_rfc3339(),
            message: message.to_string(),
            level: level.to_string(),
        },
    );
    config.activity.truncate(50);
}

pub fn upsert_font_state(config: &mut ClientConfig, font: LocalFontState) {
    if let Some(existing) = config.fonts.iter_mut().find(|item| item.id == font.id) {
        *existing = font;
        return;
    }
    config.fonts.push(font);
}

pub fn build_status(config: Option<&ClientConfig>, polling: bool) -> ClientStatus {
    match config {
        Some(config) => {
            let installed_count = config
                .fonts
                .iter()
                .filter(|font| font.status == "installed")
                .count();
            ClientStatus {
                connected: true,
                api_base_url: Some(config.api_base_url.clone()),
                library_name: Some(config.library_name.clone()),
                sync_code: Some(config.sync_code.clone()),
                device_id: config.device_id.clone(),
                installed_count,
                pending_count: config.fonts.len().saturating_sub(installed_count),
                last_sync_at: config.last_sync_at.clone(),
                last_etag: config.last_etag.clone(),
                polling,
            }
        }
        None => ClientStatus {
            connected: false,
            api_base_url: None,
            library_name: None,
            sync_code: None,
            device_id: None,
            installed_count: 0,
            pending_count: 0,
            last_sync_at: None,
            last_etag: None,
            polling,
        },
    }
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectInput {
    pub api_base_url: String,
    pub sync_code: String,
}

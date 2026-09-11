use std::path::{Path, PathBuf};

pub fn install_font(source_path: &Path, filename: &str) -> Result<PathBuf, String> {
    #[cfg(target_os = "macos")]
    {
        install_macos(source_path, filename)
    }

    #[cfg(not(target_os = "macos"))]
    {
        let _ = (source_path, filename);
        Err("Auto-install is supported on macOS only in v1.".to_string())
    }
}

#[cfg(target_os = "macos")]
fn install_macos(source_path: &Path, filename: &str) -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not resolve home directory.")?;
    let fonts_dir = home.join("Library").join("Fonts");
    std::fs::create_dir_all(&fonts_dir).map_err(|error| error.to_string())?;

    let safe_name = sanitize_filename(filename);
    let destination = fonts_dir.join(&safe_name);
    std::fs::copy(source_path, &destination).map_err(|error| error.to_string())?;
    Ok(destination)
}

fn sanitize_filename(name: &str) -> String {
    Path::new(name)
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("font.ttf")
        .replace(['/', '\\', ':'], "-")
}

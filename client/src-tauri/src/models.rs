use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FontManifestEntry {
    pub id: String,
    pub original_name: String,
    pub sha256: String,
    pub size: u64,
    pub extension: String,
    pub uploaded_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryManifest {
    pub library_id: String,
    pub updated_at: String,
    pub etag: String,
    pub fonts: Vec<FontManifestEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibrarySummary {
    pub id: String,
    pub name: String,
    pub sync_code: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceRecord {
    pub id: String,
    pub name: String,
    pub platform: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocalFontState {
    pub id: String,
    pub sha256: String,
    pub original_name: String,
    pub installed_path: Option<String>,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ActivityEntry {
    pub timestamp: String,
    pub message: String,
    pub level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientConfig {
    pub api_base_url: String,
    pub sync_code: String,
    pub library_id: String,
    pub library_name: String,
    pub device_id: Option<String>,
    pub last_etag: Option<String>,
    pub last_sync_at: Option<String>,
    pub fonts: Vec<LocalFontState>,
    pub activity: Vec<ActivityEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ClientStatus {
    pub connected: bool,
    pub api_base_url: Option<String>,
    pub library_name: Option<String>,
    pub sync_code: Option<String>,
    pub device_id: Option<String>,
    pub installed_count: usize,
    pub pending_count: usize,
    pub last_sync_at: Option<String>,
    pub last_etag: Option<String>,
    pub polling: bool,
}

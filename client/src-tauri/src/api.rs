use crate::models::{DeviceRecord, FontManifestEntry, LibraryManifest, LibrarySummary};

pub struct SyncFontApi {
    base_url: String,
    sync_code: String,
    client: reqwest::Client,
}

impl SyncFontApi {
    pub fn new(base_url: String, sync_code: String) -> Self {
        Self {
            base_url: base_url.trim_end_matches('/').to_string(),
            sync_code: sync_code.trim().to_uppercase(),
            client: reqwest::Client::new(),
        }
    }

    fn sync_code_header(&self) -> (&'static str, String) {
        ("X-Sync-Code", self.sync_code.clone())
    }

    pub async fn resolve_library_by_code(&self) -> Result<LibrarySummary, String> {
        let url = format!(
            "{}/api/libraries/by-code/{}",
            self.base_url, self.sync_code
        );
        let response = self
            .client
            .get(url)
            .send()
            .await
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(extract_error(response).await);
        }

        #[derive(serde::Deserialize)]
        struct Payload {
            library: LibraryResponse,
        }

        #[derive(serde::Deserialize)]
        #[serde(rename_all = "camelCase")]
        struct LibraryResponse {
            id: String,
            name: String,
            sync_code: String,
        }

        let payload: Payload = response.json().await.map_err(|error| error.to_string())?;
        Ok(LibrarySummary {
            id: payload.library.id,
            name: payload.library.name,
            sync_code: payload.library.sync_code,
        })
    }

    pub async fn register_device(
        &self,
        library_id: &str,
        name: &str,
        platform: &str,
    ) -> Result<DeviceRecord, String> {
        let url = format!("{}/api/libraries/{}/devices", self.base_url, library_id);
        let response = self
            .client
            .post(url)
            .header(self.sync_code_header().0, self.sync_code_header().1)
            .json(&serde_json::json!({
                "name": name,
                "platform": platform,
            }))
            .send()
            .await
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(extract_error(response).await);
        }

        #[derive(serde::Deserialize)]
        struct Payload {
            device: DeviceRecord,
        }

        let payload: Payload = response.json().await.map_err(|error| error.to_string())?;
        Ok(payload.device)
    }

    pub async fn fetch_manifest(&self, library_id: &str) -> Result<LibraryManifest, String> {
        let url = format!("{}/api/libraries/{}/manifest", self.base_url, library_id);
        let response = self
            .client
            .get(url)
            .header(self.sync_code_header().0, self.sync_code_header().1)
            .send()
            .await
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(extract_error(response).await);
        }

        #[derive(serde::Deserialize)]
        struct Payload {
            manifest: LibraryManifest,
        }

        let payload: Payload = response.json().await.map_err(|error| error.to_string())?;
        Ok(payload.manifest)
    }

    pub async fn download_font(
        &self,
        library_id: &str,
        font: &FontManifestEntry,
        destination: &std::path::Path,
    ) -> Result<(), String> {
        let url = format!(
            "{}/api/libraries/{}/fonts/{}",
            self.base_url, library_id, font.id
        );
        let response = self
            .client
            .get(url)
            .header(self.sync_code_header().0, self.sync_code_header().1)
            .send()
            .await
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(extract_error(response).await);
        }

        let bytes = response.bytes().await.map_err(|error| error.to_string())?;
        std::fs::write(destination, bytes).map_err(|error| error.to_string())?;
        Ok(())
    }

    pub async fn report_device_status(
        &self,
        library_id: &str,
        device_id: &str,
        last_sync_at: &str,
        installed_font_ids: &[String],
    ) -> Result<(), String> {
        let url = format!(
            "{}/api/libraries/{}/devices/{}",
            self.base_url, library_id, device_id
        );
        let response = self
            .client
            .patch(url)
            .header(self.sync_code_header().0, self.sync_code_header().1)
            .json(&serde_json::json!({
                "lastSyncAt": last_sync_at,
                "installedFontIds": installed_font_ids,
            }))
            .send()
            .await
            .map_err(|error| error.to_string())?;

        if !response.status().is_success() {
            return Err(extract_error(response).await);
        }

        Ok(())
    }
}

async fn extract_error(response: reqwest::Response) -> String {
    let status = response.status();
    let body = response.text().await.unwrap_or_default();
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(&body) {
        if let Some(error) = json.get("error").and_then(|value| value.as_str()) {
            return format!("{} ({status})", error);
        }
    }
    format!("Request failed ({status})")
}

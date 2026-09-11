mod api;
mod installer;
mod models;
mod state;
mod sync;

use std::time::Duration;

use tauri::{AppHandle, Emitter, State};
use tokio::time::sleep;

use crate::models::{ActivityEntry, ClientStatus};
use crate::state::{build_status, save_config, AppState, ConnectInput};
use crate::sync::{connect_and_sync, run_sync};

#[tauri::command]
fn get_status(state: State<'_, AppState>) -> ClientStatus {
    let config = state.config.lock().expect("config lock poisoned");
    let polling = *state.polling.lock().expect("polling lock poisoned");
    build_status(config.as_ref(), polling)
}

#[tauri::command]
fn get_activity(state: State<'_, AppState>) -> Vec<ActivityEntry> {
    let config = state.config.lock().expect("config lock poisoned");
    config
        .as_ref()
        .map(|value| value.activity.clone())
        .unwrap_or_default()
}

#[tauri::command]
async fn connect_library(
    app: AppHandle,
    state: State<'_, AppState>,
    input: ConnectInput,
) -> Result<ClientStatus, String> {
    let config = connect_and_sync(input.api_base_url, input.sync_code).await?;
    {
        let mut stored = state.config.lock().expect("config lock poisoned");
        *stored = Some(config);
    }

    start_polling(app, state.clone()).await?;

    let config = state.config.lock().expect("config lock poisoned");
    let polling = *state.polling.lock().expect("polling lock poisoned");
    Ok(build_status(config.as_ref(), polling))
}

#[tauri::command]
async fn sync_now(state: State<'_, AppState>) -> Result<ClientStatus, String> {
    let mut config = {
        let stored = state.config.lock().expect("config lock poisoned");
        stored
            .clone()
            .ok_or("Connect to a library before syncing.".to_string())?
    };

    run_sync(&mut config).await?;
    save_config(&config)?;

    {
        let mut stored = state.config.lock().expect("config lock poisoned");
        *stored = Some(config);
    }

    let polling = *state.polling.lock().expect("polling lock poisoned");
    let stored = state.config.lock().expect("config lock poisoned");
    Ok(build_status(stored.as_ref(), polling))
}

#[tauri::command]
async fn start_polling(app: AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    {
        let mut polling = state.polling.lock().expect("polling lock poisoned");
        if *polling {
            return Ok(());
        }
        *polling = true;
    }

    tauri::async_runtime::spawn(async move {
        loop {
            sleep(Duration::from_secs(30)).await;

            let should_continue = {
                let polling = state.polling.lock().expect("polling lock poisoned");
                *polling
            };

            if !should_continue {
                break;
            }

            let mut config = {
                let stored = state.config.lock().expect("config lock poisoned");
                match stored.clone() {
                    Some(value) => value,
                    None => continue,
                }
            };

            if run_sync(&mut config).await.is_ok() {
                let _ = save_config(&config);
                let mut stored = state.config.lock().expect("config lock poisoned");
                *stored = Some(config);
            }

            let _ = app.emit("syncfont://tick", ());
        }
    });

    Ok(())
}

#[tauri::command]
fn disconnect(state: State<'_, AppState>) -> Result<ClientStatus, String> {
    {
        let mut polling = state.polling.lock().expect("polling lock poisoned");
        *polling = false;
    }
    {
        let mut stored = state.config.lock().expect("config lock poisoned");
        *stored = None;
    }
    Ok(build_status(None, false))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            connect_library,
            disconnect,
            get_activity,
            get_status,
            start_polling,
            sync_now
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

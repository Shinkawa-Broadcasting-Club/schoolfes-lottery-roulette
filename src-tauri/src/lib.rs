use std::fs;
use tauri::Manager;

fn storage_path(app: &tauri::AppHandle, filename: &str) -> Result<std::path::PathBuf, String> {
    if filename.contains(std::path::MAIN_SEPARATOR)
        || filename.contains('/')
        || filename.contains('\\')
    {
        return Err("Invalid storage filename".into());
    }

    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(filename))
}

#[tauri::command]
fn read_app_storage(app: tauri::AppHandle, filename: String) -> Result<Option<String>, String> {
    let path = storage_path(&app, &filename)?;
    if !path.exists() {
        return Ok(None);
    }

    fs::read_to_string(path)
        .map(Some)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn write_app_storage(
    app: tauri::AppHandle,
    filename: String,
    content: String,
) -> Result<(), String> {
    let path = storage_path(&app, &filename)?;
    fs::write(path, content).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_app_storage,
            write_app_storage
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

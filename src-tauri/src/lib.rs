mod storage;

use storage::{
    delete_project_dir, read_app_storage, read_project_storage, write_app_storage,
    write_project_storage,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_app_storage,
            write_app_storage,
            read_project_storage,
            write_project_storage,
            delete_project_dir
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

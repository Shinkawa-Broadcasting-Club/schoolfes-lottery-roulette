const ALLOWED_GLOBAL_FILES: &[&str] = &["projects.json", "settings.json", "results.json"];
const ALLOWED_PROJECT_FILES: &[&str] = &["settings.json", "results.json"];

use tauri::Manager;

#[derive(Debug)]
pub enum StorageError {
    InvalidFilename(String),
    InvalidProjectId(String),
    Io(String),
    Path(String),
}

impl From<StorageError> for String {
    fn from(error: StorageError) -> Self {
        match error {
            StorageError::InvalidFilename(message) => message,
            StorageError::InvalidProjectId(message) => message,
            StorageError::Io(message) => message,
            StorageError::Path(message) => message,
        }
    }
}

fn validate_filename(name: &str) -> Result<(), StorageError> {
    if name.is_empty()
        || name.contains(std::path::MAIN_SEPARATOR)
        || name.contains('/')
        || name.contains('\\')
    {
        return Err(StorageError::InvalidFilename("Invalid storage filename".into()));
    }
    Ok(())
}

fn validate_allowed_filename(name: &str, allowlist: &[&str]) -> Result<(), StorageError> {
    validate_filename(name)?;
    if !allowlist.contains(&name) {
        return Err(StorageError::InvalidFilename(format!(
            "Filename not allowed: {name}"
        )));
    }
    Ok(())
}

fn validate_project_id(id: &str) -> Result<(), StorageError> {
    if id.is_empty() || id.len() > 32 {
        return Err(StorageError::InvalidProjectId("Invalid project ID".into()));
    }
    if !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-') {
        return Err(StorageError::InvalidProjectId(
            "Invalid project ID characters".into(),
        ));
    }
    Ok(())
}

fn app_data_dir(app: &tauri::AppHandle) -> Result<std::path::PathBuf, StorageError> {
    app.path()
        .app_data_dir()
        .map_err(|error| StorageError::Path(error.to_string()))
}

fn storage_path(app: &tauri::AppHandle, filename: &str) -> Result<std::path::PathBuf, StorageError> {
    validate_allowed_filename(filename, ALLOWED_GLOBAL_FILES)?;
    let dir = app_data_dir(app)?;
    std::fs::create_dir_all(&dir).map_err(|error| StorageError::Io(error.to_string()))?;
    Ok(dir.join(filename))
}

fn project_storage_path(
    app: &tauri::AppHandle,
    project_id: &str,
    filename: &str,
) -> Result<std::path::PathBuf, StorageError> {
    validate_project_id(project_id)?;
    validate_allowed_filename(filename, ALLOWED_PROJECT_FILES)?;
    let dir = app_data_dir(app)?
        .join("projects")
        .join(project_id);
    std::fs::create_dir_all(&dir).map_err(|error| StorageError::Io(error.to_string()))?;
    Ok(dir.join(filename))
}

fn atomic_write(path: &std::path::Path, content: &str) -> Result<(), StorageError> {
    let parent = path
        .parent()
        .ok_or_else(|| StorageError::Path("Missing parent directory".into()))?;
    std::fs::create_dir_all(parent).map_err(|error| StorageError::Io(error.to_string()))?;

    let temp_path = path.with_extension("tmp");
    std::fs::write(&temp_path, content).map_err(|error| StorageError::Io(error.to_string()))?;
    std::fs::rename(&temp_path, path).map_err(|error| StorageError::Io(error.to_string()))?;
    Ok(())
}

pub fn read_app_storage_file(app: &tauri::AppHandle, filename: &str) -> Result<Option<String>, String> {
    let path = storage_path(app, filename).map_err(String::from)?;
    if !path.exists() {
        return Ok(None);
    }
    std::fs::read_to_string(path)
        .map(Some)
        .map_err(|error| StorageError::Io(error.to_string()).into())
}

pub fn write_app_storage_file(
    app: &tauri::AppHandle,
    filename: &str,
    content: &str,
) -> Result<(), String> {
    let path = storage_path(app, filename).map_err(String::from)?;
    atomic_write(&path, content).map_err(String::from)
}

pub fn read_project_storage_file(
    app: &tauri::AppHandle,
    project_id: &str,
    filename: &str,
) -> Result<Option<String>, String> {
    let path = project_storage_path(app, project_id, filename).map_err(String::from)?;
    if !path.exists() {
        return Ok(None);
    }
    std::fs::read_to_string(path)
        .map(Some)
        .map_err(|error| StorageError::Io(error.to_string()).into())
}

pub fn write_project_storage_file(
    app: &tauri::AppHandle,
    project_id: &str,
    filename: &str,
    content: &str,
) -> Result<(), String> {
    let path = project_storage_path(app, project_id, filename).map_err(String::from)?;
    atomic_write(&path, content).map_err(String::from)
}

pub fn delete_project_storage_dir(app: &tauri::AppHandle, project_id: &str) -> Result<(), String> {
    validate_project_id(project_id).map_err(String::from)?;
    let dir = app_data_dir(app)
        .map_err(String::from)?
        .join("projects")
        .join(project_id);
    if dir.exists() {
        std::fs::remove_dir_all(&dir).map_err(|error| String::from(StorageError::Io(error.to_string())))?;
    }
    Ok(())
}

#[tauri::command]
pub fn read_app_storage(app: tauri::AppHandle, filename: String) -> Result<Option<String>, String> {
    read_app_storage_file(&app, &filename)
}

#[tauri::command]
pub fn write_app_storage(
    app: tauri::AppHandle,
    filename: String,
    content: String,
) -> Result<(), String> {
    write_app_storage_file(&app, &filename, &content)
}

#[tauri::command]
pub fn read_project_storage(
    app: tauri::AppHandle,
    project_id: String,
    filename: String,
) -> Result<Option<String>, String> {
    read_project_storage_file(&app, &project_id, &filename)
}

#[tauri::command]
pub fn write_project_storage(
    app: tauri::AppHandle,
    project_id: String,
    filename: String,
    content: String,
) -> Result<(), String> {
    write_project_storage_file(&app, &project_id, &filename, &content)
}

#[tauri::command]
pub fn delete_project_dir(app: tauri::AppHandle, project_id: String) -> Result<(), String> {
    delete_project_storage_dir(&app, &project_id)
}

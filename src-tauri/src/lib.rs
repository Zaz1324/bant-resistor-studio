#[tauri::command]
fn save_png(path: String, bytes: Vec<u8>) -> Result<(), String> {
    if !path.to_ascii_lowercase().ends_with(".png") {
        return Err("Dosya uzantısı PNG olmalı.".into());
    }
    std::fs::write(path, bytes).map_err(|error| error.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![save_png])
        .run(tauri::generate_context!())
        .expect("Bant uygulaması başlatılamadı");
}

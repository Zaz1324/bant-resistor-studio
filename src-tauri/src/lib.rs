#[tauri::command]
fn save_png(path: String, bytes: Vec<u8>) -> Result<(), String> {
    const MAX_PNG_SIZE: usize = 10 * 1024 * 1024;
    let output_path = std::path::Path::new(&path);

    if output_path
        .extension()
        .and_then(|extension| extension.to_str())
        .map(|extension| extension.eq_ignore_ascii_case("png"))
        != Some(true)
    {
        return Err("Dosya uzantısı PNG olmalı.".into());
    }
    if bytes.len() > MAX_PNG_SIZE {
        return Err("PNG dosyası en fazla 10 MB olabilir.".into());
    }
    if !output_path.parent().is_some_and(std::path::Path::is_dir) {
        return Err("Geçerli bir kayıt klasörü seçin.".into());
    }

    std::fs::write(output_path, bytes).map_err(|error| error.to_string())
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

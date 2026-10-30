use calculations::{calculate_domestic_diet, DomesticDietBreakdown};

#[tauri::command]
fn domestic_diet(
    duration_hours: f64,
    full_diet_pln: String,
    breakfast: u32,
    lunch: u32,
    dinner: u32,
    disabled: bool,
) -> Result<DomesticDietBreakdown, String> {
    calculate_domestic_diet(duration_hours, &full_diet_pln, breakfast, lunch, dinner, disabled)
}

#[tauri::command]
fn app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "Delegacje PP",
        "version": env!("CARGO_PKG_VERSION"),
        "storage": "SQLite (frontend sql.js + future native rusqlite)",
        "platforms": ["windows-10+", "macos-configurable"],
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![domestic_diet, app_info])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

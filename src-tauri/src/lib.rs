mod commands;
mod db;
mod discord;
mod process_manager;
mod scraper;
mod retroachievements;

use std::sync::Arc;
use tauri::Manager;

use commands::*;
use db::DbState;
use discord::DiscordState;
use process_manager::ProcessManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Resolve database path in app data directory or local fallback
            let app_data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| std::path::PathBuf::from("./data"));
            
            let db_path = app_data_dir.join("recomp_launcher.db");
            let db_state = Arc::new(DbState::new(db_path).expect("Failed to initialize SQLite database"));
            let discord_state = Some(DiscordState::new());
            let process_mgr = ProcessManager::new(db_state.clone(), discord_state.clone());

            app.manage(AppServices {
                db: db_state,
                process_mgr,
                discord: discord_state,
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_platforms,
            add_platform,
            toggle_platform,
            delete_platform,
            get_games,
            get_analytics,
            get_game_details,
            add_game,
            update_game,
            batch_import_roms,
            delete_game,
            launch_game,
            stop_game,
            get_running_games,
            pick_executable_file,
            pick_rom_file,
            pick_directory,
            pick_image_file,
            scrape_game_assets,
            set_discord_enabled,
            open_folder,
            set_fullscreen,
            ra_get_user_profile,
            ra_get_user_recent_games,
            ra_get_game_achievements,
            toggle_game_favorite,
            update_game_play_status,
            update_game_save_path,
            create_save_backup,
            list_save_backups,
            restore_save_backup,
            delete_save_backup,
            pick_save_path,
            pick_manual_file,
            test_igdb_connection,
            search_igdb_games
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

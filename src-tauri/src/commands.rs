use std::path::Path;
use std::sync::Arc;
use tauri::{AppHandle, State};
use serde::{Deserialize, Serialize};

use crate::db::{DbState, Game, Platform, PlaySession};
use crate::discord::DiscordState;
use crate::process_manager::{ProcessManager, RunningGameInfo};

pub struct AppServices {
    pub db: Arc<DbState>,
    pub process_mgr: ProcessManager,
    pub discord: Option<DiscordState>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GameDetailsResponse {
    pub game: Game,
    pub sessions: Vec<PlaySession>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PickFileResponse {
    pub file_path: String,
    pub suggested_title: String,
    pub working_dir: String,
}

#[tauri::command]
pub fn get_platforms(state: State<'_, AppServices>, all: Option<bool>) -> Result<Vec<Platform>, String> {
    state.db.get_platforms(all.unwrap_or(false)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn add_platform(
    state: State<'_, AppServices>,
    name: String,
    short_name: String,
    brand_color: String,
    icon_name: String,
    description: String,
) -> Result<String, String> {
    let badge_bg = format!("{}33", brand_color);
    state
        .db
        .add_platform(&name, &short_name, &brand_color, &badge_bg, &icon_name, &description)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_platform(
    state: State<'_, AppServices>,
    id: String,
    is_enabled: bool,
) -> Result<(), String> {
    state.db.toggle_platform(&id, is_enabled).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_platform(
    state: State<'_, AppServices>,
    id: String,
    name: String,
    short_name: String,
    brand_color: String,
    icon_name: String,
    description: String,
) -> Result<(), String> {
    let badge_bg = format!("{}33", brand_color);
    state
        .db
        .update_platform(&id, &name, &short_name, &brand_color, &badge_bg, &icon_name, &description)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_platform(
    state: State<'_, AppServices>,
    id: String,
    reassign_games: Option<bool>,
) -> Result<(), String> {
    state.db.delete_platform(&id, reassign_games.unwrap_or(false))
}

#[tauri::command]
pub fn get_games(state: State<'_, AppServices>) -> Result<Vec<Game>, String> {
    let running = state.process_mgr.get_running_game_ids();
    let mut games = state.db.get_games(&running).map_err(|e| e.to_string())?;
    for g in games.iter_mut() {
        resolve_game_asset_urls(g);
    }
    Ok(games)
}

#[tauri::command]
pub fn get_analytics(
    state: State<'_, AppServices>,
    year: Option<i32>,
) -> Result<crate::db::ReplayAnalytics, String> {
    state.db.get_analytics(year).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_game_details(
    state: State<'_, AppServices>,
    game_id: String,
) -> Result<Option<GameDetailsResponse>, String> {
    let is_running = state.process_mgr.is_running(&game_id);
    let game = state
        .db
        .get_game_by_id(&game_id, is_running)
        .map_err(|e| e.to_string())?;

    if let Some(mut game) = game {
        resolve_game_asset_urls(&mut game);
        let sessions = state
            .db
            .get_sessions_for_game(&game_id)
            .map_err(|e| e.to_string())?;

        Ok(Some(GameDetailsResponse { game, sessions }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn add_game(
    state: State<'_, AppServices>,
    title: String,
    original_platform_id: String,
    executable_path: String,
    working_dir: String,
    launch_arguments: String,
    cover_url: Option<String>,
    banner_url: Option<String>,
    notes: Option<String>,
    is_emulator: Option<bool>,
    emulator_path: Option<String>,
    rom_path: Option<String>,
    is_favorite: Option<bool>,
    play_status: Option<String>,
    save_path: Option<String>,
) -> Result<String, String> {
    state
        .db
        .add_game(
            &title,
            &original_platform_id,
            &executable_path,
            &working_dir,
            &launch_arguments,
            cover_url.as_deref(),
            banner_url.as_deref(),
            notes.as_deref(),
            is_emulator.unwrap_or(false),
            emulator_path.as_deref(),
            rom_path.as_deref(),
            is_favorite,
            play_status.as_deref(),
            save_path.as_deref(),
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_game(
    state: State<'_, AppServices>,
    id: String,
    title: String,
    original_platform_id: String,
    executable_path: String,
    working_dir: String,
    launch_arguments: String,
    cover_url: Option<String>,
    banner_url: Option<String>,
    notes: Option<String>,
    is_emulator: Option<bool>,
    emulator_path: Option<String>,
    rom_path: Option<String>,
    is_favorite: Option<bool>,
    play_status: Option<String>,
    save_path: Option<String>,
) -> Result<(), String> {
    state
        .db
        .update_game(
            &id,
            &title,
            &original_platform_id,
            &executable_path,
            &working_dir,
            &launch_arguments,
            cover_url.as_deref(),
            banner_url.as_deref(),
            notes.as_deref(),
            is_emulator.unwrap_or(false),
            emulator_path.as_deref(),
            rom_path.as_deref(),
            is_favorite,
            play_status.as_deref(),
            save_path.as_deref(),
        )
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn batch_import_roms(
    state: State<'_, AppServices>,
    platform_id: String,
    emulator_path: String,
    roms_folder: String,
    extensions: Vec<String>,
    custom_args: Option<String>,
    scrape_igdb: Option<bool>,
    igdb_api_key: Option<String>,
    igdb_client_secret: Option<String>,
) -> Result<Vec<String>, String> {
    state
        .db
        .batch_import_roms(
            &platform_id,
            &emulator_path,
            &roms_folder,
            &extensions,
            custom_args.as_deref().unwrap_or("{rom}"),
            scrape_igdb.unwrap_or(false),
            igdb_api_key.as_deref(),
            igdb_client_secret.as_deref(),
        )
}

#[tauri::command]
pub fn delete_game(state: State<'_, AppServices>, id: String) -> Result<(), String> {
    if state.process_mgr.is_running(&id) {
        return Err("Não é possível remover o jogo enquanto ele estiver em execução.".to_string());
    }
    state.db.delete_game(&id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn launch_game(
    app: AppHandle,
    state: State<'_, AppServices>,
    game_id: String,
) -> Result<String, String> {
    state.process_mgr.launch(app, &game_id)
}

#[tauri::command]
pub fn stop_game(
    app: AppHandle,
    state: State<'_, AppServices>,
    game_id: String,
) -> Result<(), String> {
    state.process_mgr.kill_game(app, &game_id)
}

#[tauri::command]
pub fn get_running_games(state: State<'_, AppServices>) -> Result<Vec<RunningGameInfo>, String> {
    Ok(state.process_mgr.get_running_games_info())
}

#[tauri::command]
pub fn pick_executable_file() -> Result<Option<PickFileResponse>, String> {
    let file = rfd::FileDialog::new()
        .set_title("Selecione o Executável (Jogo ou Emulador)")
        .add_filter("Executáveis (*.exe, *.bat, *.cmd)", &["exe", "bat", "cmd"])
        .add_filter("Todos os Arquivos", &["*"])
        .pick_file();

    if let Some(path) = file {
        let file_path = path.to_string_lossy().to_string();
        let parent = path
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        let stem = path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();

        let suggested_title = crate::db::clean_rom_title(&stem);

        Ok(Some(PickFileResponse {
            file_path,
            suggested_title,
            working_dir: parent,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn pick_rom_file() -> Result<Option<PickFileResponse>, String> {
    let file = rfd::FileDialog::new()
        .set_title("Selecione o Arquivo de ROM / Imagem do Jogo")
        .add_filter(
            "Imagens de Jogos / ROMs (*.iso, *.chd, *.cso, *.z64, *.n64, *.bin, *.cue, *.rvz, *.gcm, *.zip, *.pkg)",
            &["iso", "chd", "cso", "z64", "n64", "bin", "cue", "rvz", "gcm", "pkg", "zip", "xbe", "rom"],
        )
        .add_filter("Todos os Arquivos", &["*"])
        .pick_file();

    if let Some(path) = file {
        let file_path = path.to_string_lossy().to_string();
        let parent = path
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        let stem = path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();

        let suggested_title = crate::db::clean_rom_title(&stem);

        Ok(Some(PickFileResponse {
            file_path,
            suggested_title,
            working_dir: parent,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn pick_directory() -> Result<Option<String>, String> {
    let folder = rfd::FileDialog::new()
        .set_title("Selecione a Pasta de ROMs")
        .pick_folder();

    Ok(folder.map(|p| p.to_string_lossy().to_string()))
}

pub fn image_path_to_data_url(path_str: &str) -> Option<String> {
    let path = std::path::Path::new(path_str);
    if !path.is_file() {
        return None;
    }
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        "ico" => "image/x-icon",
        "gif" => "image/gif",
        _ => "image/png",
    };
    if let Ok(bytes) = std::fs::read(path) {
        use base64::Engine;
        let b64 = base64::engine::general_purpose::STANDARD.encode(&bytes);
        return Some(format!("data:{};base64,{}", mime, b64));
    }
    None
}

fn resolve_game_asset_urls(game: &mut Game) {
    if let Some(ref cover) = game.cover_url {
        let is_special = cover.starts_with("http://")
            || cover.starts_with("https://")
            || cover.starts_with("data:")
            || cover.starts_with("asset:");
        if !is_special {
            if let Some(data_url) = image_path_to_data_url(cover) {
                game.cover_url = Some(data_url);
            }
        }
    }
    if let Some(ref banner) = game.banner_url {
        let is_special = banner.starts_with("http://")
            || banner.starts_with("https://")
            || banner.starts_with("data:")
            || banner.starts_with("asset:");
        if !is_special {
            if let Some(data_url) = image_path_to_data_url(banner) {
                game.banner_url = Some(data_url);
            }
        }
    }
}

#[tauri::command]
pub fn pick_image_file() -> Result<Option<String>, String> {
    let file = rfd::FileDialog::new()
        .set_title("Selecione a Imagem ou Ícone")
        .add_filter(
            "Imagens & Ícones (*.png, *.jpg, *.jpeg, *.webp, *.ico, *.svg)",
            &["png", "jpg", "jpeg", "webp", "ico", "svg"],
        )
        .pick_file();

    match file {
        Some(p) => {
            let path_str = p.to_string_lossy().to_string();
            if let Some(data_url) = image_path_to_data_url(&path_str) {
                Ok(Some(data_url))
            } else {
                Ok(Some(path_str))
            }
        }
        None => Ok(None),
    }
}

#[tauri::command]
pub fn read_image_as_data_url(path: String) -> Result<String, String> {
    image_path_to_data_url(&path).ok_or_else(|| "Não foi possível carregar o arquivo de imagem".to_string())
}

#[tauri::command]
pub fn scrape_game_assets(
    query: String,
    steamgriddb_key: Option<String>,
    igdb_client_id: Option<String>,
    igdb_client_secret: Option<String>,
) -> Result<crate::scraper::ScrapeResult, String> {
    Ok(crate::scraper::search_game_assets(
        &query,
        steamgriddb_key.as_deref(),
        igdb_client_id.as_deref(),
        igdb_client_secret.as_deref(),
    ))
}

#[tauri::command]
pub fn test_igdb_connection(
    api_key: String,
    client_secret: Option<String>,
) -> Result<String, String> {
    crate::scraper::test_igdb_connection(&api_key, client_secret.as_deref())
}

#[tauri::command]
pub fn search_igdb_games(
    query: String,
    api_key: String,
    client_secret: Option<String>,
) -> Result<Vec<crate::scraper::IgdbGameMetadata>, String> {
    crate::scraper::query_igdb_games(&query, &api_key, client_secret.as_deref())
}

#[tauri::command]
pub fn set_discord_enabled(
    state: State<'_, AppServices>,
    enabled: bool,
    client_id: Option<String>,
) -> Result<(), String> {
    if let Some(discord) = &state.discord {
        discord.set_enabled(enabled);
        if let Some(cid) = client_id {
            discord.set_custom_client_id(Some(cid));
        }
    }
    Ok(())
}

#[tauri::command]
pub fn test_discord_connection(
    state: State<'_, AppServices>,
    client_id: Option<String>,
) -> Result<String, String> {
    if let Some(discord) = &state.discord {
        if let Some(cid) = client_id {
            discord.set_custom_client_id(Some(cid));
        }
        discord.test_connection()
    } else {
        Err("Serviço Discord RPC não disponível.".to_string())
    }
}

#[tauri::command]
pub fn open_folder(path: String) -> Result<(), String> {
    let target = Path::new(&path);
    if target.exists() {
        #[cfg(target_os = "windows")]
        {
            let _ = std::process::Command::new("explorer").arg(target).spawn();
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = std::process::Command::new("xdg-open").arg(target).spawn();
        }
        Ok(())
    } else {
        Err("Caminho não encontrado.".to_string())
    }
}

#[tauri::command]
pub fn set_fullscreen(window: tauri::WebviewWindow, fullscreen: bool) -> Result<(), String> {
    window.set_fullscreen(fullscreen).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn ra_get_user_profile(
    username: String,
    api_key: String,
) -> Result<crate::retroachievements::RaUserProfile, String> {
    crate::retroachievements::get_user_profile(&username, &api_key)
}

#[tauri::command]
pub fn ra_get_user_recent_games(
    username: String,
    api_key: String,
) -> Result<Vec<crate::retroachievements::RaUserGame>, String> {
    crate::retroachievements::get_user_recent_games(&username, &api_key)
}

#[tauri::command]
pub fn ra_get_game_achievements(
    title: String,
    platform_id: String,
    username: Option<String>,
    api_key: Option<String>,
    explicit_game_id: Option<u32>,
) -> Result<crate::retroachievements::RaGameProgress, String> {
    crate::retroachievements::get_game_achievements(
        &title,
        &platform_id,
        username.as_deref(),
        api_key.as_deref(),
        explicit_game_id,
    )
}

#[tauri::command]
pub fn toggle_game_favorite(
    state: State<'_, AppServices>,
    game_id: String,
) -> Result<bool, String> {
    state.db.toggle_favorite(&game_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_game_play_status(
    state: State<'_, AppServices>,
    game_id: String,
    status: String,
) -> Result<(), String> {
    state.db.update_play_status(&game_id, &status).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_game_save_path(
    state: State<'_, AppServices>,
    game_id: String,
    save_path: Option<String>,
) -> Result<(), String> {
    state.db.update_save_path(&game_id, save_path.as_deref()).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_save_backup(
    state: State<'_, AppServices>,
    game_id: String,
    note: Option<String>,
) -> Result<crate::db::SaveBackup, String> {
    state.db.create_save_backup(&game_id, note.as_deref())
}

#[tauri::command]
pub fn list_save_backups(
    state: State<'_, AppServices>,
    game_id: String,
) -> Result<Vec<crate::db::SaveBackup>, String> {
    state.db.list_save_backups(&game_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn restore_save_backup(
    state: State<'_, AppServices>,
    backup_id: String,
) -> Result<(), String> {
    state.db.restore_save_backup(&backup_id)
}

#[tauri::command]
pub fn delete_save_backup(
    state: State<'_, AppServices>,
    backup_id: String,
) -> Result<(), String> {
    state.db.delete_save_backup(&backup_id)
}

#[tauri::command]
pub fn pick_save_path() -> Result<Option<String>, String> {
    let res = rfd::FileDialog::new()
        .set_title("Selecione o Arquivo de Save ou Memcard (.sav, .srm, .mcd, .ps2, .raw)")
        .add_filter("Arquivos de Save / Memcards", &["sav", "srm", "mcd", "ps2", "raw", "bin", "state", "dat"])
        .add_filter("Todos os Arquivos", &["*"])
        .pick_file();

    if let Some(path) = res {
        Ok(Some(path.to_string_lossy().to_string()))
    } else {
        let folder = rfd::FileDialog::new()
            .set_title("Ou selecione a Pasta de Saves do Jogo")
            .pick_folder();
        Ok(folder.map(|p| p.to_string_lossy().to_string()))
    }
}

#[tauri::command]
pub fn pick_manual_file() -> Result<Option<String>, String> {
    let file = rfd::FileDialog::new()
        .set_title("Selecione o Manual ou Guia do Jogo (PDF, TXT, MD, HTML)")
        .add_filter("Documentos de Manual", &["pdf", "txt", "md", "html", "htm"])
        .add_filter("Todos os Arquivos", &["*"])
        .pick_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}


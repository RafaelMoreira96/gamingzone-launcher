use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Platform {
    pub id: String,
    pub name: String,
    pub short_name: String,
    pub brand_color: String,
    pub badge_bg: String,
    pub icon_name: String,
    pub description: String,
    pub is_enabled: bool,
    pub is_custom: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Game {
    pub id: String,
    pub title: String,
    pub original_platform_id: String,
    pub platform_name: Option<String>,
    pub platform_brand_color: Option<String>,
    pub executable_path: String,
    pub working_dir: String,
    pub launch_arguments: String,
    pub cover_url: Option<String>,
    pub banner_url: Option<String>,
    pub total_playtime_seconds: i64,
    pub last_played_at: Option<String>,
    pub created_at: String,
    pub notes: Option<String>,
    pub is_running: bool,
    pub is_emulator: bool,
    pub emulator_path: Option<String>,
    pub rom_path: Option<String>,
    pub is_favorite: bool,
    pub play_status: String,
    pub save_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SaveBackup {
    pub id: String,
    pub game_id: String,
    pub backup_path: String,
    pub file_count: i64,
    pub size_bytes: i64,
    pub created_at: String,
    pub note: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaySession {
    pub id: String,
    pub game_id: String,
    pub started_at: String,
    pub ended_at: Option<String>,
    pub duration_seconds: i64,
}

pub struct DbState {
    pub conn: Arc<Mutex<Connection>>,
    pub data_dir: PathBuf,
}

impl DbState {
    pub fn new(db_path: PathBuf) -> Result<Self> {
        let data_dir = db_path
            .parent()
            .unwrap_or_else(|| std::path::Path::new("./data"))
            .to_path_buf();

        if let Some(parent) = db_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }

        let conn = Connection::open(&db_path)?;
        let state = DbState {
            conn: Arc::new(Mutex::new(conn)),
            data_dir,
        };

        state.init_tables()?;
        state.seed_platforms()?;
        state.seed_default_games()?;
        Ok(state)
    }

    fn init_tables(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute(
            "CREATE TABLE IF NOT EXISTS platforms (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                short_name TEXT NOT NULL,
                brand_color TEXT NOT NULL,
                badge_bg TEXT NOT NULL,
                icon_name TEXT NOT NULL,
                description TEXT,
                is_enabled INTEGER DEFAULT 1,
                is_custom INTEGER DEFAULT 0
            )",
            [],
        )?;

        // Safe migrations for existing databases
        let _ = conn.execute("ALTER TABLE platforms ADD COLUMN is_enabled INTEGER DEFAULT 1", []);
        let _ = conn.execute("ALTER TABLE platforms ADD COLUMN is_custom INTEGER DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE games ADD COLUMN is_emulator INTEGER DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE games ADD COLUMN emulator_path TEXT DEFAULT ''", []);
        let _ = conn.execute("ALTER TABLE games ADD COLUMN rom_path TEXT DEFAULT ''", []);
        let _ = conn.execute("ALTER TABLE games ADD COLUMN is_favorite INTEGER DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE games ADD COLUMN play_status TEXT DEFAULT 'backlog'", []);
        let _ = conn.execute("ALTER TABLE games ADD COLUMN save_path TEXT DEFAULT ''", []);

        conn.execute(
            "CREATE TABLE IF NOT EXISTS games (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                original_platform_id TEXT NOT NULL,
                executable_path TEXT NOT NULL,
                working_dir TEXT NOT NULL,
                launch_arguments TEXT DEFAULT '',
                cover_url TEXT,
                banner_url TEXT,
                total_playtime_seconds INTEGER DEFAULT 0,
                last_played_at TEXT,
                created_at TEXT NOT NULL,
                notes TEXT,
                is_emulator INTEGER DEFAULT 0,
                emulator_path TEXT DEFAULT '',
                rom_path TEXT DEFAULT '',
                is_favorite INTEGER DEFAULT 0,
                play_status TEXT DEFAULT 'backlog',
                save_path TEXT DEFAULT '',
                FOREIGN KEY (original_platform_id) REFERENCES platforms(id)
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS save_backups (
                id TEXT PRIMARY KEY,
                game_id TEXT NOT NULL,
                backup_path TEXT NOT NULL,
                file_count INTEGER DEFAULT 1,
                size_bytes INTEGER DEFAULT 0,
                created_at TEXT NOT NULL,
                note TEXT DEFAULT '',
                FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS play_sessions (
                id TEXT PRIMARY KEY,
                game_id TEXT NOT NULL,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                duration_seconds INTEGER DEFAULT 0,
                FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE
            )",
            [],
        )?;

        Ok(())
    }

    fn seed_platforms(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        let initial_platforms = vec![
            (
                "n64",
                "Nintendo 64",
                "N64",
                "#E52521",
                "rgba(229, 37, 33, 0.2)",
                "gamepad",
                "Recompilações clássicas de N64 (Zelda OoT, Majora's Mask, Super Mario 64, Perfect Dark)",
            ),
            (
                "ps1",
                "PlayStation 1",
                "PS1",
                "#003791",
                "rgba(0, 55, 145, 0.2)",
                "disc",
                "Ports e recomps da era 32-bit da Sony (Wipeout, Driver 2)",
            ),
            (
                "ps2",
                "PlayStation 2",
                "PS2",
                "#006FCD",
                "rgba(0, 111, 205, 0.2)",
                "cpu",
                "Projetos nativos para PC como OpenGOAL (Jak & Daxter, Jak II)",
            ),
            (
                "xbox",
                "Original Xbox",
                "Xbox",
                "#107C10",
                "rgba(16, 124, 16, 0.2)",
                "box",
                "Recompilações estáticas de jogos do primeiro console da Microsoft",
            ),
            (
                "psp",
                "PlayStation Portable",
                "PSP",
                "#5B6770",
                "rgba(91, 103, 112, 0.2)",
                "smartphone",
                "Ports nativos x86 de títulos portáteis da Sony",
            ),
            (
                "gamecube",
                "Nintendo GameCube",
                "GC",
                "#6A5ACD",
                "rgba(106, 90, 205, 0.2)",
                "cube",
                "Recompilações de jogos da geração 128-bit da Nintendo",
            ),
            (
                "saturn",
                "Sega Saturn",
                "Saturn",
                "#F39C12",
                "rgba(243, 156, 18, 0.2)",
                "circle-dot",
                "Recompilações de clássicos da Sega",
            ),
            (
                "dreamcast",
                "Sega Dreamcast",
                "Dreamcast",
                "#FF6600",
                "rgba(255, 102, 0, 0.2)",
                "swatch-book",
                "Ports nativos de arcade e Dreamcast",
            ),
            (
                "snes",
                "Super Nintendo",
                "SNES",
                "#7B52AB",
                "rgba(123, 82, 171, 0.2)",
                "snes",
                "Emulação e recomps de clássicos 16-bit (Super Mario World, Chrono Trigger, DKC)",
            ),
            (
                "nes",
                "Nintendo Entertainment System",
                "NES",
                "#D32F2F",
                "rgba(211, 47, 47, 0.2)",
                "nes",
                "Clássicos 8-bit da era Famicom/NES (Super Mario Bros, Zelda, Metroid)",
            ),
            (
                "gba",
                "Game Boy Advance",
                "GBA",
                "#5B32A3",
                "rgba(91, 50, 163, 0.2)",
                "gba",
                "Portátil 32-bit da Nintendo (Pokémon Emerald, Minish Cap, Metroid Fusion)",
            ),
            (
                "nds",
                "Nintendo DS",
                "NDS",
                "#4A90E2",
                "rgba(74, 144, 226, 0.2)",
                "nds",
                "Portátil de duas telas da Nintendo (Pokémon Platinum, Mario Kart DS)",
            ),
            (
                "switch",
                "Nintendo Switch",
                "Switch",
                "#E60012",
                "rgba(230, 0, 18, 0.2)",
                "switch",
                "Emulação e ports da geração híbrida da Nintendo",
            ),
            (
                "ps3",
                "PlayStation 3",
                "PS3",
                "#1A5276",
                "rgba(26, 82, 118, 0.2)",
                "ps3",
                "Emulação HD da Sony com RPCS3",
            ),
            (
                "genesis",
                "Sega Genesis / Mega Drive",
                "Genesis",
                "#1E824C",
                "rgba(30, 130, 76, 0.2)",
                "genesis",
                "Clássicos 16-bit da Sega (Sonic the Hedgehog, Streets of Rage)",
            ),
            (
                "wii",
                "Nintendo Wii",
                "Wii",
                "#00B0FF",
                "rgba(0, 176, 255, 0.2)",
                "wii",
                "Jogos por movimento e clássicos do Wii",
            ),
            (
                "other",
                "Outra Plataforma",
                "Custom",
                "#9C27B0",
                "rgba(156, 39, 176, 0.2)",
                "wrench",
                "Recompilação customizada ou arcade",
            ),
        ];

        for (id, name, short_name, brand_color, badge_bg, icon_name, desc) in initial_platforms {
            conn.execute(
                "INSERT OR IGNORE INTO platforms (id, name, short_name, brand_color, badge_bg, icon_name, description)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![id, name, short_name, brand_color, badge_bg, icon_name, desc],
            )?;
        }

        Ok(())
    }

    fn seed_default_games(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();

        let count: i64 = conn.query_row("SELECT COUNT(*) FROM games", [], |r| r.get(0))?;
        if count > 0 {
            return Ok(());
        }

        let now = Utc::now().to_rfc3339();

        // Initial default games demonstrating BOTH Recompilações PC and Jogos Emulados
        let default_games = vec![
            // 1. RECOMP NATIVO: Zelda OoT (Ship of Harkinian)
            (
                "zelda-soh",
                "Zelda: Ocarina of Time (Ship of Harkinian)",
                "n64",
                "C:\\Games\\ShipOfHarkinian\\soh.exe",
                "C:\\Games\\ShipOfHarkinian",
                "--fullscreen",
                Some("https://images.igdb.com/igdb/image/upload/t_cover_big/co5vmg.png"),
                Some("https://images.igdb.com/igdb/image/upload/t_1080p/sc7375.jpg"),
                45200i64,
                Some("2026-10-18T18:30:00Z"),
                Some("DirectX 12 / 60 FPS interpolation / Gyro Aiming ativado"),
                0i32,
                "",
                "",
                1i32,
                "playing",
                "C:\\Games\\ShipOfHarkinian\\saves",
            ),
            // 2. RECOMP NATIVO: Jak & Daxter (OpenGOAL)
            (
                "jak-opengoal",
                "Jak & Daxter: The Precursor Legacy (OpenGOAL)",
                "ps2",
                "C:\\Games\\OpenGOAL\\jak1.exe",
                "C:\\Games\\OpenGOAL",
                "",
                Some("https://images.igdb.com/igdb/image/upload/t_cover_big/co2044.png"),
                Some("https://images.igdb.com/igdb/image/upload/t_1080p/sc86m7.jpg"),
                28400i64,
                Some("2026-10-17T20:15:00Z"),
                Some("Port nativo em GOAL recompilado para x86 com suporte a Widescreen 4K"),
                0i32,
                "",
                "",
                1i32,
                "playing",
                "C:\\Games\\OpenGOAL\\saves",
            ),
            // 3. RECOMP NATIVO: Super Mario 64
            (
                "sm64-port",
                "Super Mario 64 (Render96 Recomp)",
                "n64",
                "C:\\Games\\sm64pc\\sm64.us.f3dex2e.exe",
                "C:\\Games\\sm64pc",
                "--savepath saves/",
                Some("https://images.igdb.com/igdb/image/upload/t_cover_big/co282a.png"),
                Some("https://images.igdb.com/igdb/image/upload/t_1080p/co1t9u.jpg"),
                14200i64,
                Some("2026-10-16T22:00:00Z"),
                Some("Texturas Render96 HD e modelo moderno do Mario"),
                0i32,
                "",
                "",
                0i32,
                "completed",
                "C:\\Games\\sm64pc\\saves",
            ),
            // 4. RECOMP NATIVO: WipEout Rewrite
            (
                "wipeout-rewrite",
                "WipEout (Rewrite PC Port)",
                "ps1",
                "C:\\Games\\WipeoutRewrite\\wipeout.exe",
                "C:\\Games\\WipeoutRewrite",
                "",
                Some("https://images.igdb.com/igdb/image/upload/t_cover_big/co2k03.png"),
                Some("https://images.igdb.com/igdb/image/upload/t_1080p/sc82gq.jpg"),
                7800i64,
                Some("2026-10-15T19:40:00Z"),
                Some("Descompilação completa de PS1 para C rodando em OpenGL moderno"),
                0i32,
                "",
                "",
                0i32,
                "backlog",
                "",
            ),
            // 5. JOGO EMULADO: God of War II (PCSX2)
            (
                "gow2-ps2",
                "God of War II",
                "ps2",
                "C:\\Emuladores\\PCSX2\\pcsx2-qtx64.exe",
                "D:\\Jogos\\PS2",
                "-batch -fullscreen \"{rom}\"",
                Some("https://images.igdb.com/igdb/image/upload/t_cover_big/co1t98.webp"),
                Some("https://images.alphacoders.com/600/600528.jpg"),
                32400i64,
                Some("2026-10-18T16:20:00Z"),
                Some("PCSX2 v2.2.0 • Vulkan 4K 60FPS • Widescreen Patch Ativo"),
                1i32,
                "C:\\Emuladores\\PCSX2\\pcsx2-qtx64.exe",
                "D:\\Jogos\\PS2\\God of War II.iso",
                1i32,
                "playing",
                "C:\\Emuladores\\PCSX2\\memcards\\Mcd001.ps2",
            ),
            // 6. JOGO EMULADO: Metroid Prime (Dolphin)
            (
                "metroid-prime-gc",
                "Metroid Prime",
                "gamecube",
                "C:\\Emuladores\\Dolphin\\Dolphin.exe",
                "D:\\Jogos\\GameCube",
                "-b -e \"{rom}\"",
                Some("https://images.igdb.com/igdb/image/upload/t_cover_big/co1nck.png"),
                Some("https://images.alphacoders.com/113/1135248.jpg"),
                21600i64,
                Some("2026-10-17T15:10:00Z"),
                Some("Dolphin 2407 • Resolução Interna 3x (1440p) • Dual Stick Mod"),
                1i32,
                "C:\\Emuladores\\Dolphin\\Dolphin.exe",
                "D:\\Jogos\\GameCube\\Metroid Prime.rvz",
                0i32,
                "completed",
                "C:\\Emuladores\\Dolphin\\User\\GC\\MemoryCardA.USA.raw",
            ),
            // 7. JOGO EMULADO: Castlevania: Symphony of the Night (DuckStation)
            (
                "sotn-ps1",
                "Castlevania: Symphony of the Night",
                "ps1",
                "C:\\Emuladores\\DuckStation\\duckstation.exe",
                "D:\\Jogos\\PS1",
                "-batch -fullscreen \"{rom}\"",
                Some("https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8p.png"),
                Some("https://images.alphacoders.com/830/830917.jpg"),
                18900i64,
                Some("2026-10-16T21:00:00Z"),
                Some("DuckStation • PGXP Geometry Correction • CRT Filter"),
                1i32,
                "C:\\Emuladores\\DuckStation\\duckstation.exe",
                "D:\\Jogos\\PS1\\Castlevania Symphony of the Night.chd",
                0i32,
                "paused",
                "C:\\Emuladores\\DuckStation\\memcards\\shared_card_1.mcd",
            ),
        ];

        for (id, title, plat_id, exec, wdir, args, cover, banner, playtime, last_played, notes, is_emu, emu_path, rom_path, is_fav, status, save_p) in default_games {
            conn.execute(
                "INSERT INTO games (
                    id, title, original_platform_id, executable_path, working_dir,
                    launch_arguments, cover_url, banner_url, total_playtime_seconds,
                    last_played_at, created_at, notes, is_emulator, emulator_path, rom_path,
                    is_favorite, play_status, save_path
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)",
                params![
                    id, title, plat_id, exec, wdir, args, cover, banner,
                    playtime, last_played, now, notes, is_emu, emu_path, rom_path,
                    is_fav, status, save_p
                ],
            )?;

            // Seed sample play session for analytics
            if let Some(lp) = last_played {
                let sess_id = format!("sess_{}", id);
                let _ = conn.execute(
                    "INSERT INTO play_sessions (id, game_id, started_at, ended_at, duration_seconds)
                     VALUES (?1, ?2, ?3, ?4, ?5)",
                    params![sess_id, id, lp, lp, 5400i64],
                );
            }
        }

        Ok(())
    }

    pub fn get_platforms(&self, include_disabled: bool) -> Result<Vec<Platform>> {
        let conn = self.conn.lock().unwrap();
        let query = if include_disabled {
            "SELECT id, name, short_name, brand_color, badge_bg, icon_name, description, is_enabled, is_custom FROM platforms ORDER BY name ASC"
        } else {
            "SELECT id, name, short_name, brand_color, badge_bg, icon_name, description, is_enabled, is_custom FROM platforms WHERE is_enabled = 1 ORDER BY name ASC"
        };
        let mut stmt = conn.prepare(query)?;

        let platforms = stmt
            .query_map([], |row| {
                let is_enabled: i32 = row.get(7).unwrap_or(1);
                let is_custom: i32 = row.get(8).unwrap_or(0);
                Ok(Platform {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    short_name: row.get(2)?,
                    brand_color: row.get(3)?,
                    badge_bg: row.get(4)?,
                    icon_name: row.get(5)?,
                    description: row.get(6)?,
                    is_enabled: is_enabled != 0,
                    is_custom: is_custom != 0,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(platforms)
    }

    pub fn add_platform(
        &self,
        name: &str,
        short_name: &str,
        brand_color: &str,
        badge_bg: &str,
        icon_name: &str,
        description: &str,
    ) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let id = format!("custom_{}", Uuid::new_v4().simple());
        conn.execute(
            "INSERT INTO platforms (id, name, short_name, brand_color, badge_bg, icon_name, description, is_enabled, is_custom)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, 1, 1)",
            params![id, name, short_name, brand_color, badge_bg, icon_name, description],
        )?;
        Ok(id)
    }

    pub fn toggle_platform(&self, id: &str, is_enabled: bool) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE platforms SET is_enabled = ?1 WHERE id = ?2",
            params![if is_enabled { 1 } else { 0 }, id],
        )?;
        Ok(())
    }

    pub fn update_platform(
        &self,
        id: &str,
        name: &str,
        short_name: &str,
        brand_color: &str,
        badge_bg: &str,
        icon_name: &str,
        description: &str,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE platforms SET name = ?1, short_name = ?2, brand_color = ?3, badge_bg = ?4, icon_name = ?5, description = ?6 WHERE id = ?7",
            params![name, short_name, brand_color, badge_bg, icon_name, description, id],
        )?;
        Ok(())
    }

    pub fn delete_platform(&self, id: &str, reassign_games: bool) -> std::result::Result<(), String> {
        let conn = self.conn.lock().unwrap();
        let mut check_stmt = conn
            .prepare("SELECT COUNT(*) FROM games WHERE original_platform_id = ?1")
            .map_err(|e| e.to_string())?;
        let count: i64 = check_stmt
            .query_row(params![id], |r| r.get(0))
            .map_err(|e| e.to_string())?;

        if count > 0 {
            if reassign_games && id != "other" {
                // Ensure "other" platform exists so FK constraint is satisfied
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO platforms (id, name, short_name, brand_color, badge_bg, icon_name, description, is_enabled, is_custom)
                     VALUES ('other', 'Outra Plataforma', 'Custom', '#9C27B0', 'rgba(156, 39, 176, 0.2)', 'wrench', 'Recompilação customizada ou arcade', 1, 0)",
                    [],
                );
                conn.execute(
                    "UPDATE games SET original_platform_id = 'other' WHERE original_platform_id = ?1",
                    params![id],
                ).map_err(|e| e.to_string())?;
            } else {
                return Err(format!(
                    "Esta plataforma possui {} jogo(s) vinculado(s). Remova os jogos ou confirme a transferência deles para 'Outra Plataforma'.",
                    count
                ));
            }
        }

        conn.execute("DELETE FROM platforms WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn get_games(&self, running_ids: &[String]) -> Result<Vec<Game>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT g.id, g.title, g.original_platform_id, p.name, p.brand_color,
                    g.executable_path, g.working_dir, g.launch_arguments,
                    g.cover_url, g.banner_url, g.total_playtime_seconds,
                    g.last_played_at, g.created_at, g.notes,
                    coalesce(g.is_emulator, 0), g.emulator_path, g.rom_path,
                    coalesce(g.is_favorite, 0), coalesce(g.play_status, 'backlog'), g.save_path
             FROM games g
             LEFT JOIN platforms p ON g.original_platform_id = p.id
             ORDER BY coalesce(g.is_favorite, 0) DESC, g.last_played_at DESC, g.title ASC",
        )?;

        let games = stmt
            .query_map([], |row| {
                let id: String = row.get(0)?;
                let is_running = running_ids.contains(&id);
                let is_emu_int: i32 = row.get(14).unwrap_or(0);
                let emu_path: Option<String> = row.get(15).ok();
                let rom_path: Option<String> = row.get(16).ok();
                let is_fav_int: i32 = row.get(17).unwrap_or(0);
                let play_status: String = row.get(18).unwrap_or_else(|_| "backlog".to_string());
                let save_path: Option<String> = row.get(19).ok().filter(|s: &String| !s.trim().is_empty());

                Ok(Game {
                    id,
                    title: row.get(1)?,
                    original_platform_id: row.get(2)?,
                    platform_name: row.get(3)?,
                    platform_brand_color: row.get(4)?,
                    executable_path: row.get(5)?,
                    working_dir: row.get(6)?,
                    launch_arguments: row.get(7)?,
                    cover_url: row.get(8)?,
                    banner_url: row.get(9)?,
                    total_playtime_seconds: row.get(10)?,
                    last_played_at: row.get(11)?,
                    created_at: row.get(12)?,
                    notes: row.get(13)?,
                    is_running,
                    is_emulator: is_emu_int != 0,
                    emulator_path: emu_path.filter(|s| !s.trim().is_empty()),
                    rom_path: rom_path.filter(|s| !s.trim().is_empty()),
                    is_favorite: is_fav_int != 0,
                    play_status,
                    save_path,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(games)
    }

    pub fn get_game_by_id(&self, game_id: &str, is_running: bool) -> Result<Option<Game>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT g.id, g.title, g.original_platform_id, p.name, p.brand_color,
                    g.executable_path, g.working_dir, g.launch_arguments,
                    g.cover_url, g.banner_url, g.total_playtime_seconds,
                    g.last_played_at, g.created_at, g.notes,
                    coalesce(g.is_emulator, 0), g.emulator_path, g.rom_path,
                    coalesce(g.is_favorite, 0), coalesce(g.play_status, 'backlog'), g.save_path
             FROM games g
             LEFT JOIN platforms p ON g.original_platform_id = p.id
             WHERE g.id = ?1",
        )?;

        let mut rows = stmt.query(params![game_id])?;
        if let Some(row) = rows.next()? {
            let is_emu_int: i32 = row.get(14).unwrap_or(0);
            let emu_path: Option<String> = row.get(15).ok();
            let rom_path: Option<String> = row.get(16).ok();
            let is_fav_int: i32 = row.get(17).unwrap_or(0);
            let play_status: String = row.get(18).unwrap_or_else(|_| "backlog".to_string());
            let save_path: Option<String> = row.get(19).ok().filter(|s: &String| !s.trim().is_empty());

            Ok(Some(Game {
                id: row.get(0)?,
                title: row.get(1)?,
                original_platform_id: row.get(2)?,
                platform_name: row.get(3)?,
                platform_brand_color: row.get(4)?,
                executable_path: row.get(5)?,
                working_dir: row.get(6)?,
                launch_arguments: row.get(7)?,
                cover_url: row.get(8)?,
                banner_url: row.get(9)?,
                total_playtime_seconds: row.get(10)?,
                last_played_at: row.get(11)?,
                created_at: row.get(12)?,
                notes: row.get(13)?,
                is_running,
                is_emulator: is_emu_int != 0,
                emulator_path: emu_path.filter(|s| !s.trim().is_empty()),
                rom_path: rom_path.filter(|s| !s.trim().is_empty()),
                is_favorite: is_fav_int != 0,
                play_status,
                save_path,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn add_game(
        &self,
        title: &str,
        original_platform_id: &str,
        executable_path: &str,
        working_dir: &str,
        launch_arguments: &str,
        cover_url: Option<&str>,
        banner_url: Option<&str>,
        notes: Option<&str>,
        is_emulator: bool,
        emulator_path: Option<&str>,
        rom_path: Option<&str>,
        is_favorite: Option<bool>,
        play_status: Option<&str>,
        save_path: Option<&str>,
    ) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        let resolved_working_dir = if working_dir.trim().is_empty() {
            std::path::Path::new(executable_path)
                .parent()
                .map(|p| p.to_string_lossy().to_string())
                .unwrap_or_default()
        } else {
            working_dir.to_string()
        };

        conn.execute(
            "INSERT INTO games (
                id, title, original_platform_id, executable_path, working_dir,
                launch_arguments, cover_url, banner_url, total_playtime_seconds,
                last_played_at, created_at, notes, is_emulator, emulator_path, rom_path,
                is_favorite, play_status, save_path
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, NULL, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
            params![
                id,
                title,
                original_platform_id,
                executable_path,
                resolved_working_dir,
                launch_arguments,
                cover_url,
                banner_url,
                now,
                notes,
                if is_emulator { 1 } else { 0 },
                emulator_path.unwrap_or(""),
                rom_path.unwrap_or(""),
                if is_favorite.unwrap_or(false) { 1 } else { 0 },
                play_status.unwrap_or("backlog"),
                save_path.unwrap_or(""),
            ],
        )?;

        Ok(id)
    }

    pub fn update_game(
        &self,
        id: &str,
        title: &str,
        original_platform_id: &str,
        executable_path: &str,
        working_dir: &str,
        launch_arguments: &str,
        cover_url: Option<&str>,
        banner_url: Option<&str>,
        notes: Option<&str>,
        is_emulator: bool,
        emulator_path: Option<&str>,
        rom_path: Option<&str>,
        is_favorite: Option<bool>,
        play_status: Option<&str>,
        save_path: Option<&str>,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE games SET
                title = ?1,
                original_platform_id = ?2,
                executable_path = ?3,
                working_dir = ?4,
                launch_arguments = ?5,
                cover_url = ?6,
                banner_url = ?7,
                notes = ?8,
                is_emulator = ?9,
                emulator_path = ?10,
                rom_path = ?11,
                is_favorite = coalesce(?12, is_favorite),
                play_status = coalesce(?13, play_status),
                save_path = coalesce(?14, save_path)
             WHERE id = ?15",
            params![
                title,
                original_platform_id,
                executable_path,
                working_dir,
                launch_arguments,
                cover_url,
                banner_url,
                notes,
                if is_emulator { 1 } else { 0 },
                emulator_path.unwrap_or(""),
                rom_path.unwrap_or(""),
                is_favorite.map(|f| if f { 1 } else { 0 }),
                play_status,
                save_path,
                id
            ],
        )?;
        Ok(())
    }

    pub fn toggle_favorite(&self, game_id: &str) -> Result<bool> {
        let conn = self.conn.lock().unwrap();
        let current: i32 = conn.query_row(
            "SELECT coalesce(is_favorite, 0) FROM games WHERE id = ?1",
            params![game_id],
            |r| r.get(0),
        )?;
        let next_val = if current == 0 { 1 } else { 0 };
        conn.execute(
            "UPDATE games SET is_favorite = ?1 WHERE id = ?2",
            params![next_val, game_id],
        )?;
        Ok(next_val == 1)
    }

    pub fn update_play_status(&self, game_id: &str, status: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE games SET play_status = ?1 WHERE id = ?2",
            params![status, game_id],
        )?;
        Ok(())
    }

    pub fn update_save_path(&self, game_id: &str, save_path: Option<&str>) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE games SET save_path = ?1 WHERE id = ?2",
            params![save_path.unwrap_or(""), game_id],
        )?;
        Ok(())
    }

    pub fn list_save_backups(&self, game_id: &str) -> Result<Vec<SaveBackup>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, game_id, backup_path, file_count, size_bytes, created_at, coalesce(note, '')
             FROM save_backups
             WHERE game_id = ?1
             ORDER BY created_at DESC",
        )?;

        let backups = stmt
            .query_map(params![game_id], |row| {
                Ok(SaveBackup {
                    id: row.get(0)?,
                    game_id: row.get(1)?,
                    backup_path: row.get(2)?,
                    file_count: row.get(3)?,
                    size_bytes: row.get(4)?,
                    created_at: row.get(5)?,
                    note: row.get(6)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(backups)
    }

    pub fn create_save_backup(&self, game_id: &str, note: Option<&str>) -> std::result::Result<SaveBackup, String> {
        let conn = self.conn.lock().unwrap();
        let save_path: Option<String> = conn
            .query_row(
                "SELECT save_path FROM games WHERE id = ?1",
                params![game_id],
                |r| r.get(0),
            )
            .map_err(|e| format!("Jogo não encontrado: {}", e))?;

        let save_path_str = save_path.unwrap_or_default();
        if save_path_str.trim().is_empty() {
            return Err("Nenhum caminho de save configurado para este jogo. Configure o caminho nas propriedades do jogo.".to_string());
        }

        let src = std::path::Path::new(&save_path_str);
        if !src.exists() {
            return Err(format!(
                "O arquivo ou pasta de save informado não existe no disco: {}",
                save_path_str
            ));
        }

        let backup_id = format!("bk_{}", Uuid::new_v4().simple());
        let backup_dir = self.data_dir.join("saves_backup").join(game_id).join(&backup_id);
        std::fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

        let (file_count, size_bytes) = if src.is_dir() {
            copy_dir_recursive(src, &backup_dir).map_err(|e| format!("Erro ao copiar pasta de save: {}", e))?
        } else {
            let filename = src.file_name().ok_or("Nome de arquivo inválido")?;
            let dest_file = backup_dir.join(filename);
            std::fs::copy(src, &dest_file).map_err(|e| format!("Erro ao copiar arquivo de save: {}", e))?;
            let size = src.metadata().map(|m| m.len() as i64).unwrap_or(0);
            (1i64, size)
        };

        let now = Utc::now().to_rfc3339();
        let backup_note = note.unwrap_or("Backup Manual");

        conn.execute(
            "INSERT INTO save_backups (id, game_id, backup_path, file_count, size_bytes, created_at, note)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                backup_id,
                game_id,
                backup_dir.to_string_lossy().to_string(),
                file_count,
                size_bytes,
                now,
                backup_note
            ],
        ).map_err(|e| e.to_string())?;

        Ok(SaveBackup {
            id: backup_id,
            game_id: game_id.to_string(),
            backup_path: backup_dir.to_string_lossy().to_string(),
            file_count,
            size_bytes,
            created_at: now,
            note: backup_note.to_string(),
        })
    }

    pub fn restore_save_backup(&self, backup_id: &str) -> std::result::Result<(), String> {
        let conn = self.conn.lock().unwrap();
        let (game_id, backup_path_str): (String, String) = conn
            .query_row(
                "SELECT game_id, backup_path FROM save_backups WHERE id = ?1",
                params![backup_id],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .map_err(|_| "Backup não encontrado no banco de dados.".to_string())?;

        let save_path_str: String = conn
            .query_row(
                "SELECT coalesce(save_path, '') FROM games WHERE id = ?1",
                params![game_id],
                |r| r.get(0),
            )
            .map_err(|_| "Jogo vinculado ao backup não foi encontrado.".to_string())?;

        if save_path_str.trim().is_empty() {
            return Err("O jogo não possui um caminho de save configurado para onde restaurar.".to_string());
        }

        let backup_dir = std::path::Path::new(&backup_path_str);
        if !backup_dir.exists() {
            return Err("A pasta deste backup não foi encontrada no disco.".to_string());
        }

        let target = std::path::Path::new(&save_path_str);

        if target.is_dir() {
            copy_dir_recursive(backup_dir, target).map_err(|e| format!("Erro ao restaurar pasta de save: {}", e))?;
        } else {
            let mut entries = std::fs::read_dir(backup_dir).map_err(|e| e.to_string())?;
            if let Some(entry) = entries.next() {
                let entry = entry.map_err(|e| e.to_string())?;
                if let Some(parent) = target.parent() {
                    let _ = std::fs::create_dir_all(parent);
                }
                std::fs::copy(entry.path(), target).map_err(|e| format!("Erro ao restaurar arquivo de save: {}", e))?;
            } else {
                return Err("Backup está vazio.".to_string());
            }
        }

        Ok(())
    }

    pub fn delete_save_backup(&self, backup_id: &str) -> std::result::Result<(), String> {
        let conn = self.conn.lock().unwrap();
        let backup_path: Option<String> = conn
            .query_row(
                "SELECT backup_path FROM save_backups WHERE id = ?1",
                params![backup_id],
                |r| r.get(0),
            )
            .ok();

        if let Some(p) = backup_path {
            let path = std::path::Path::new(&p);
            if path.exists() {
                let _ = std::fs::remove_dir_all(path);
            }
        }

        conn.execute("DELETE FROM save_backups WHERE id = ?1", params![backup_id])
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    pub fn batch_import_roms(
        &self,
        platform_id: &str,
        emulator_path: &str,
        roms_folder: &str,
        extensions: &[String],
        custom_args: &str,
        scrape_igdb: bool,
        igdb_api_key: Option<&str>,
        igdb_client_secret: Option<&str>,
    ) -> std::result::Result<Vec<String>, String> {
        let dir = std::path::Path::new(roms_folder);
        if !dir.is_dir() {
            return Err("A pasta informada não é um diretório válido.".to_string());
        }

        let mut imported_titles = Vec::new();
        let entries = std::fs::read_dir(dir).map_err(|e| e.to_string())?;

        let exts_lower: Vec<String> = extensions
            .iter()
            .map(|e| e.trim().trim_start_matches('.').to_lowercase())
            .collect();

        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    if exts_lower.contains(&ext.to_lowercase()) {
                        let file_stem = path
                            .file_stem()
                            .and_then(|s| s.to_str())
                            .unwrap_or("Novo Jogo");

                        let cleaned_title = clean_rom_title(file_stem);
                        let rom_path_str = path.to_string_lossy().to_string();

                        let args = if custom_args.trim().is_empty() {
                            "{rom}".to_string()
                        } else {
                            custom_args.to_string()
                        };

                        let (cover_url, banner_url, notes) = if scrape_igdb && igdb_api_key.is_some() {
                            if let Ok(igdb_res) = crate::scraper::query_igdb_games(
                                &cleaned_title,
                                igdb_api_key.unwrap(),
                                igdb_client_secret,
                            ) {
                                if let Some(first) = igdb_res.first() {
                                    (first.cover_url.clone(), first.banner_url.clone(), first.summary.clone())
                                } else {
                                    (None, None, None)
                                }
                            } else {
                                (None, None, None)
                            }
                        } else {
                            (None, None, None)
                        };

                        let default_notes = notes.unwrap_or_else(|| "Jogo importado via Scanner de ROMs".to_string());

                        if let Ok(_) = self.add_game(
                            &cleaned_title,
                            platform_id,
                            emulator_path,
                            "",
                            &args,
                            cover_url.as_deref(),
                            banner_url.as_deref(),
                            Some(&default_notes),
                            true,
                            Some(emulator_path),
                            Some(&rom_path_str),
                            None,
                            Some("backlog"),
                            None,
                        ) {
                            imported_titles.push(cleaned_title);
                        }
                    }
                }
            }
        }

        Ok(imported_titles)
    }

    pub fn delete_game(&self, id: &str) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM play_sessions WHERE game_id = ?1", params![id])?;
        conn.execute("DELETE FROM save_backups WHERE game_id = ?1", params![id])?;
        conn.execute("DELETE FROM games WHERE id = ?1", params![id])?;

        let backup_folder = self.data_dir.join("saves_backup").join(id);
        if backup_folder.exists() {
            let _ = std::fs::remove_dir_all(backup_folder);
        }

        Ok(())
    }

    pub fn create_session(&self, game_id: &str) -> Result<String> {
        let conn = self.conn.lock().unwrap();
        let session_id = Uuid::new_v4().to_string();
        let now = Utc::now().to_rfc3339();

        conn.execute(
            "INSERT INTO play_sessions (id, game_id, started_at, ended_at, duration_seconds)
             VALUES (?1, ?2, ?3, NULL, 0)",
            params![session_id, game_id, now],
        )?;

        conn.execute(
            "UPDATE games SET last_played_at = ?1 WHERE id = ?2",
            params![now, game_id],
        )?;

        Ok(session_id)
    }

    pub fn finish_session(&self, session_id: &str, duration_seconds: i64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let now = Utc::now().to_rfc3339();

        let mut stmt = conn.prepare("SELECT game_id FROM play_sessions WHERE id = ?1")?;
        let game_id: String = stmt.query_row(params![session_id], |row| row.get(0))?;

        conn.execute(
            "UPDATE play_sessions SET ended_at = ?1, duration_seconds = ?2 WHERE id = ?3",
            params![now, duration_seconds, session_id],
        )?;

        conn.execute(
            "UPDATE games SET
                total_playtime_seconds = total_playtime_seconds + ?1,
                last_played_at = ?2
             WHERE id = ?3",
            params![duration_seconds, now, game_id],
        )?;

        Ok(())
    }

    pub fn get_sessions_for_game(&self, game_id: &str) -> Result<Vec<PlaySession>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, game_id, started_at, ended_at, duration_seconds
             FROM play_sessions
             WHERE game_id = ?1
             ORDER BY started_at DESC
             LIMIT 50",
        )?;

        let sessions = stmt
            .query_map(params![game_id], |row| {
                Ok(PlaySession {
                    id: row.get(0)?,
                    game_id: row.get(1)?,
                    started_at: row.get(2)?,
                    ended_at: row.get(3)?,
                    duration_seconds: row.get(4)?,
                })
            })?
            .filter_map(|r| r.ok())
            .collect();

        Ok(sessions)
    }

    pub fn get_analytics(&self, target_year: Option<i32>) -> Result<ReplayAnalytics> {
        let conn = self.conn.lock().unwrap();
        let current_year = Utc::now().format("%Y").to_string().parse::<i32>().unwrap_or(2026);
        let selected_year = target_year.unwrap_or(current_year);

        // Fetch available years from play_sessions
        let mut years_stmt = conn.prepare(
            "SELECT DISTINCT CAST(substr(started_at, 1, 4) AS INTEGER) as yr
             FROM play_sessions
             WHERE started_at IS NOT NULL AND length(started_at) >= 4
             ORDER BY yr DESC",
        )?;
        let mut available_years: Vec<i32> = years_stmt
            .query_map([], |r| r.get(0))?
            .filter_map(|r| r.ok())
            .collect();

        if !available_years.contains(&current_year) {
            available_years.insert(0, current_year);
        }

        let year_str = if selected_year == 0 {
            String::new()
        } else {
            selected_year.to_string()
        };

        let (where_clause, params_vec): (&str, Vec<String>) = if selected_year == 0 {
            ("", vec![])
        } else {
            ("WHERE substr(s.started_at, 1, 4) = ?1", vec![year_str.clone()])
        };

        let query = format!(
            "SELECT s.id, s.game_id, g.title, g.cover_url, p.id, coalesce(p.name, 'Outro'), coalesce(p.brand_color, '#00E5FF'), s.started_at, s.duration_seconds
             FROM play_sessions s
             JOIN games g ON s.game_id = g.id
             LEFT JOIN platforms p ON g.original_platform_id = p.id
             {}
             ORDER BY s.started_at DESC",
            where_clause
        );

        let mut stmt = conn.prepare(&query)?;
        let mut recent_sessions = Vec::new();
        let mut game_time_map: std::collections::HashMap<String, (String, Option<String>, String, String, String, i64, i64)> = std::collections::HashMap::new();
        let mut platform_time_map: std::collections::HashMap<String, (String, String, i64, std::collections::HashSet<String>)> = std::collections::HashMap::new();
        let mut monthly_seconds = [0i64; 12];
        let mut total_playtime_seconds = 0i64;
        let mut longest_session_seconds = 0i64;
        let mut longest_session_game: Option<String> = None;

        let session_rows = stmt.query_map(rusqlite::params_from_iter(params_vec.iter()), |row| {
            let session_id: String = row.get(0)?;
            let game_id: String = row.get(1)?;
            let title: String = row.get(2)?;
            let cover_url: Option<String> = row.get(3)?;
            let platform_id: Option<String> = row.get(4)?;
            let platform_name: String = row.get(5)?;
            let platform_color: String = row.get(6)?;
            let started_at: String = row.get(7)?;
            let duration_seconds: i64 = row.get(8)?;

            Ok((
                session_id,
                game_id,
                title,
                cover_url,
                platform_id.unwrap_or_else(|| "other".to_string()),
                platform_name,
                platform_color,
                started_at,
                duration_seconds,
            ))
        })?;

        let mut session_count = 0i64;

        for res in session_rows {
            if let Ok((sess_id, g_id, title, cover_url, plat_id, plat_name, plat_color, started_at, duration)) = res {
                session_count += 1;
                total_playtime_seconds += duration;

                if duration > longest_session_seconds {
                    longest_session_seconds = duration;
                    longest_session_game = Some(title.clone());
                }

                if started_at.len() >= 7 {
                    if let Ok(m) = started_at[5..7].parse::<usize>() {
                        if (1..=12).contains(&m) {
                            monthly_seconds[m - 1] += duration;
                        }
                    }
                }

                let entry = game_time_map.entry(g_id.clone()).or_insert_with(|| {
                    (title.clone(), cover_url.clone(), plat_name.clone(), plat_color.clone(), plat_id.clone(), 0, 0)
                });
                entry.5 += duration;
                entry.6 += 1;

                let p_entry = platform_time_map.entry(plat_id.clone()).or_insert_with(|| {
                    (plat_name.clone(), plat_color.clone(), 0, std::collections::HashSet::new())
                });
                p_entry.2 += duration;
                p_entry.3.insert(g_id.clone());

                if recent_sessions.len() < 25 {
                    recent_sessions.push(SessionDetail {
                        id: sess_id,
                        game_id: g_id,
                        game_title: title,
                        platform_name: plat_name,
                        platform_color: plat_color,
                        started_at,
                        duration_seconds: duration,
                    });
                }
            }
        }

        // Fallback for games with total_playtime_seconds when play_sessions is empty
        if total_playtime_seconds == 0 {
            let mut g_stmt = conn.prepare(
                "SELECT g.id, g.title, g.cover_url, p.id, coalesce(p.name, 'Outro'), coalesce(p.brand_color, '#00E5FF'), g.total_playtime_seconds, g.last_played_at
                 FROM games g
                 LEFT JOIN platforms p ON g.original_platform_id = p.id
                 WHERE g.total_playtime_seconds > 0"
            )?;

            let g_rows = g_stmt.query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, Option<String>>(2)?,
                    row.get::<_, Option<String>>(3)?.unwrap_or_else(|| "other".to_string()),
                    row.get::<_, String>(4)?,
                    row.get::<_, String>(5)?,
                    row.get::<_, i64>(6)?,
                    row.get::<_, Option<String>>(7)?,
                ))
            })?;

            for res in g_rows {
                if let Ok((g_id, title, cover_url, plat_id, plat_name, plat_color, playtime, last_played)) = res {
                    total_playtime_seconds += playtime;
                    session_count += 1;

                    if playtime > longest_session_seconds {
                        longest_session_seconds = playtime;
                        longest_session_game = Some(title.clone());
                    }

                    let entry = game_time_map.entry(g_id.clone()).or_insert_with(|| {
                        (title.clone(), cover_url.clone(), plat_name.clone(), plat_color.clone(), plat_id.clone(), 0, 0)
                    });
                    entry.5 += playtime;
                    entry.6 += 1;

                    let p_entry = platform_time_map.entry(plat_id.clone()).or_insert_with(|| {
                        (plat_name.clone(), plat_color.clone(), 0, std::collections::HashSet::new())
                    });
                    p_entry.2 += playtime;
                    p_entry.3.insert(g_id.clone());

                    if let Some(lp) = last_played {
                        if recent_sessions.len() < 25 {
                            recent_sessions.push(SessionDetail {
                                id: format!("mock-sess-{}", g_id),
                                game_id: g_id,
                                game_title: title,
                                platform_name: plat_name,
                                platform_color: plat_color,
                                started_at: lp,
                                duration_seconds: playtime,
                            });
                        }
                    }
                }
            }
        }

        let mut top_games = Vec::new();
        for (game_id, (title, cover_url, platform_name, platform_color, original_platform_id, total_seconds, s_count)) in game_time_map {
            let percentage = if total_playtime_seconds > 0 {
                (total_seconds as f64 / total_playtime_seconds as f64) * 100.0
            } else {
                0.0
            };
            top_games.push(GameAnalyticsItem {
                game_id,
                title,
                cover_url,
                platform_name,
                platform_color,
                original_platform_id,
                total_seconds,
                session_count: s_count,
                percentage,
            });
        }
        top_games.sort_by(|a, b| b.total_seconds.cmp(&a.total_seconds));

        let mut platform_distribution = Vec::new();
        for (platform_id, (name, color, total_seconds, games_set)) in platform_time_map {
            let percentage = if total_playtime_seconds > 0 {
                (total_seconds as f64 / total_playtime_seconds as f64) * 100.0
            } else {
                0.0
            };
            platform_distribution.push(PlatformAnalyticsItem {
                platform_id,
                name,
                color,
                total_seconds,
                game_count: games_set.len() as i64,
                percentage,
            });
        }
        platform_distribution.sort_by(|a, b| b.total_seconds.cmp(&a.total_seconds));

        let month_names = [
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez",
        ];
        let mut monthly_breakdown = Vec::new();
        for m in 1..=12 {
            monthly_breakdown.push(MonthlyPlaytime {
                month: m as u32,
                month_name: month_names[m - 1].to_string(),
                total_seconds: monthly_seconds[m - 1],
            });
        }

        let total_games_played = top_games.len() as i64;

        Ok(ReplayAnalytics {
            year: selected_year,
            available_years,
            total_playtime_seconds,
            total_sessions_count: session_count,
            total_games_played,
            longest_session_seconds,
            longest_session_game,
            top_games,
            platform_distribution,
            monthly_breakdown,
            recent_sessions,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameAnalyticsItem {
    pub game_id: String,
    pub title: String,
    pub cover_url: Option<String>,
    pub platform_name: String,
    pub platform_color: String,
    pub original_platform_id: String,
    pub total_seconds: i64,
    pub session_count: i64,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformAnalyticsItem {
    pub platform_id: String,
    pub name: String,
    pub color: String,
    pub total_seconds: i64,
    pub game_count: i64,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonthlyPlaytime {
    pub month: u32,
    pub month_name: String,
    pub total_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionDetail {
    pub id: String,
    pub game_id: String,
    pub game_title: String,
    pub platform_name: String,
    pub platform_color: String,
    pub started_at: String,
    pub duration_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReplayAnalytics {
    pub year: i32,
    pub available_years: Vec<i32>,
    pub total_playtime_seconds: i64,
    pub total_sessions_count: i64,
    pub total_games_played: i64,
    pub longest_session_seconds: i64,
    pub longest_session_game: Option<String>,
    pub top_games: Vec<GameAnalyticsItem>,
    pub platform_distribution: Vec<PlatformAnalyticsItem>,
    pub monthly_breakdown: Vec<MonthlyPlaytime>,
    pub recent_sessions: Vec<SessionDetail>,
}

pub fn clean_rom_title(raw: &str) -> String {
    let mut cleaned = String::new();
    let mut in_paren = 0;
    let mut in_bracket = 0;

    for ch in raw.chars() {
        if ch == '(' {
            in_paren += 1;
        } else if ch == ')' {
            if in_paren > 0 {
                in_paren -= 1;
            }
        } else if ch == '[' {
            in_bracket += 1;
        } else if ch == ']' {
            if in_bracket > 0 {
                in_bracket -= 1;
            }
        } else if in_paren == 0 && in_bracket == 0 {
            if ch == '_' || ch == '-' {
                cleaned.push(' ');
            } else {
                cleaned.push(ch);
            }
        }
    }

    let result = cleaned
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_string();

    if result.is_empty() {
        raw.trim().to_string()
    } else {
        result
    }
}

pub fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<(i64, i64)> {
    std::fs::create_dir_all(dst)?;
    let mut file_count = 0i64;
    let mut total_size = 0i64;

    for entry in std::fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let dest_child = dst.join(entry.file_name());
        if ty.is_dir() {
            let (c, s) = copy_dir_recursive(&entry.path(), &dest_child)?;
            file_count += c;
            total_size += s;
        } else {
            std::fs::copy(entry.path(), &dest_child)?;
            let meta = entry.metadata()?;
            file_count += 1;
            total_size += meta.len() as i64;
        }
    }
    Ok((file_count, total_size))
}


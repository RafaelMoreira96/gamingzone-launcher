use std::collections::HashMap;
use std::path::Path;
use std::process::{Child, Command};
use std::sync::{Arc, Mutex};
use std::time::Instant;
use tauri::{AppHandle, Emitter};
use serde::{Deserialize, Serialize};

use crate::db::DbState;
use crate::discord::DiscordState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RunningGameInfo {
    pub game_id: String,
    pub session_id: String,
    pub elapsed_seconds: u64,
}

struct ActiveGameProcess {
    session_id: String,
    start_instant: Instant,
    child: Child,
}

#[derive(Clone)]
pub struct ProcessManager {
    running_games: Arc<Mutex<HashMap<String, ActiveGameProcess>>>,
    db: Arc<DbState>,
    pub discord: Option<DiscordState>,
}

impl ProcessManager {
    pub fn new(db: Arc<DbState>, discord: Option<DiscordState>) -> Self {
        Self {
            running_games: Arc::new(Mutex::new(HashMap::new())),
            db,
            discord,
        }
    }

    pub fn is_running(&self, game_id: &str) -> bool {
        let lock = self.running_games.lock().unwrap();
        lock.contains_key(game_id)
    }

    pub fn get_running_game_ids(&self) -> Vec<String> {
        let lock = self.running_games.lock().unwrap();
        lock.keys().cloned().collect()
    }

    pub fn get_running_games_info(&self) -> Vec<RunningGameInfo> {
        let lock = self.running_games.lock().unwrap();
        lock.iter()
            .map(|(game_id, active)| RunningGameInfo {
                game_id: game_id.clone(),
                session_id: active.session_id.clone(),
                elapsed_seconds: active.start_instant.elapsed().as_secs(),
            })
            .collect()
    }

    pub fn launch(
        &self,
        app_handle: AppHandle,
        game_id: &str,
    ) -> Result<String, String> {
        if self.is_running(game_id) {
            return Err("Este jogo já está em execução!".to_string());
        }

        let game = self
            .db
            .get_game_by_id(game_id, false)
            .map_err(|e| format!("Erro ao buscar jogo no banco: {}", e))?
            .ok_or_else(|| "Jogo não encontrado.".to_string())?;

        let actual_exe = if game.is_emulator && game.emulator_path.as_ref().map(|s| !s.trim().is_empty()).unwrap_or(false) {
            game.emulator_path.as_ref().unwrap()
        } else {
            &game.executable_path
        };

        let exe_path = Path::new(actual_exe);
        if !exe_path.exists() {
            return Err(format!(
                "Executável não encontrado no caminho: {}",
                actual_exe
            ));
        }

        let working_dir = if !game.working_dir.trim().is_empty() {
            Path::new(&game.working_dir)
        } else {
            exe_path.parent().unwrap_or(Path::new("."))
        };

        // Parse launch arguments
        let mut final_args = Vec::new();
        let raw_args = game.launch_arguments.trim();

        if game.is_emulator {
            if let Some(rom) = &game.rom_path {
                if !rom.trim().is_empty() {
                    if raw_args.contains("{rom}") || raw_args.contains("%ROM%") {
                        let replaced = raw_args.replace("{rom}", rom).replace("%ROM%", rom);
                        final_args.extend(replaced.split_whitespace().map(|s| s.to_string()));
                    } else if !raw_args.is_empty() {
                        final_args.extend(raw_args.split_whitespace().map(|s| s.to_string()));
                        final_args.push(rom.clone());
                    } else {
                        final_args.push(rom.clone());
                    }
                }
            } else if !raw_args.is_empty() {
                final_args.extend(raw_args.split_whitespace().map(|s| s.to_string()));
            }
        } else if !raw_args.is_empty() {
            final_args.extend(raw_args.split_whitespace().map(|s| s.to_string()));
        }

        let mut cmd = Command::new(actual_exe);
        cmd.current_dir(working_dir);
        if !final_args.is_empty() {
            cmd.args(&final_args);
        }

        let child = cmd
            .spawn()
            .map_err(|e| format!("Falha ao iniciar processo '{}': {}", game.title, e))?;

        // Create session in SQLite
        let session_id = self
            .db
            .create_session(game_id)
            .map_err(|e| format!("Erro ao registrar início de sessão: {}", e))?;

        let start_instant = Instant::now();

        // Update Discord Rich Presence
        if let Some(discord) = &self.discord {
            let now_unix = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs() as i64)
                .unwrap_or(0);
            let p_name = game.platform_name.as_deref().unwrap_or("Retro");
            discord.set_playing_game(&game.title, p_name, game.is_emulator, now_unix);
        }

        // Save active process
        {
            let mut lock = self.running_games.lock().unwrap();
            lock.insert(
                game_id.to_string(),
                ActiveGameProcess {
                    session_id: session_id.clone(),
                    start_instant,
                    child,
                },
            );
        }

        // Notify frontend that game started
        let _ = app_handle.emit(
            "game-status-changed",
            serde_json::json!({
                "game_id": game_id,
                "is_running": true,
                "session_id": session_id,
            }),
        );

        // Spawn watcher thread to monitor process termination
        let manager_clone = self.clone();
        let app_clone = app_handle.clone();
        let g_id = game_id.to_string();
        let s_id = session_id.clone();

        std::thread::spawn(move || {
            loop {
                std::thread::sleep(std::time::Duration::from_millis(1000));

                let mut finished = false;
                let mut elapsed_secs = 0;

                {
                    let mut lock = manager_clone.running_games.lock().unwrap();
                    if let Some(active) = lock.get_mut(&g_id) {
                        match active.child.try_wait() {
                            Ok(Some(_status)) => {
                                elapsed_secs = active.start_instant.elapsed().as_secs();
                                finished = true;
                            }
                            Ok(None) => {
                                // Still running
                            }
                            Err(_) => {
                                elapsed_secs = active.start_instant.elapsed().as_secs();
                                finished = true;
                            }
                        }
                    } else {
                        // Game was stopped manually or removed
                        break;
                    }

                    if finished {
                        lock.remove(&g_id);
                    }
                }

                if finished {
                    let _ = manager_clone
                        .db
                        .finish_session(&s_id, elapsed_secs as i64);

                    if let Some(discord) = &manager_clone.discord {
                        let count = manager_clone.db.get_games(&[]).map(|g| g.len()).unwrap_or(0);
                        discord.set_idle(count);
                    }

                    let _ = app_clone.emit(
                        "game-status-changed",
                        serde_json::json!({
                            "game_id": g_id,
                            "is_running": false,
                            "session_id": s_id,
                            "duration_seconds": elapsed_secs,
                        }),
                    );
                    break;
                }
            }
        });

        Ok(session_id)
    }

    pub fn kill_game(&self, app_handle: AppHandle, game_id: &str) -> Result<(), String> {
        let mut lock = self.running_games.lock().unwrap();
        if let Some(mut active) = lock.remove(game_id) {
            let _ = active.child.kill();
            let elapsed_secs = active.start_instant.elapsed().as_secs();

            let _ = self
                .db
                .finish_session(&active.session_id, elapsed_secs as i64);

            if let Some(discord) = &self.discord {
                let count = self.db.get_games(&[]).map(|g| g.len()).unwrap_or(0);
                discord.set_idle(count);
            }

            let _ = app_handle.emit(
                "game-status-changed",
                serde_json::json!({
                    "game_id": game_id,
                    "is_running": false,
                    "session_id": active.session_id,
                    "duration_seconds": elapsed_secs,
                }),
            );
            Ok(())
        } else {
            Err("O jogo especificado não está em execução.".to_string())
        }
    }
}

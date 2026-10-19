use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use std::sync::{Arc, Mutex};

// A public/active Discord Application ID registered with verified Rich Presence assets
pub const DEFAULT_DISCORD_APP_ID: &str = "475456035851599874";

fn map_platform_asset(platform_id: &str) -> &'static str {
    let lower = platform_id.to_lowercase();
    if lower.contains("n64") || lower.contains("nintendo 64") {
        "nintendo_64"
    } else if lower.contains("ps2") || lower.contains("playstation 2") {
        "playstation"
    } else if lower.contains("ps1") || lower.contains("playstation") || lower.contains("psx") {
        "playstation"
    } else if lower.contains("gamecube") || lower.contains("gc") {
        "gamecube"
    } else if lower.contains("snes") || lower.contains("super nintendo") {
        "super_nes"
    } else if lower.contains("gba") || lower.contains("game boy advance") {
        "game_boy_advance"
    } else if lower.contains("genesis") || lower.contains("megadrive") || lower.contains("mega drive") {
        "mega_drive"
    } else if lower.contains("psp") || lower.contains("portable") {
        "playstation_portable"
    } else if lower.contains("saturn") {
        "sega_saturn"
    } else if lower.contains("dreamcast") {
        "dreamcast"
    } else {
        "playing"
    }
}

#[derive(Clone)]
pub struct DiscordState {
    client: Arc<Mutex<Option<DiscordIpcClient>>>,
    enabled: Arc<Mutex<bool>>,
    custom_client_id: Arc<Mutex<Option<String>>>,
    current_connected_id: Arc<Mutex<Option<String>>>,
}

impl DiscordState {
    pub fn new() -> Self {
        DiscordState {
            client: Arc::new(Mutex::new(None)),
            enabled: Arc::new(Mutex::new(true)),
            custom_client_id: Arc::new(Mutex::new(None)),
            current_connected_id: Arc::new(Mutex::new(None)),
        }
    }

    pub fn set_enabled(&self, enabled: bool) {
        let mut en = self.enabled.lock().unwrap();
        *en = enabled;
        if !enabled {
            self.clear_activity();
        }
    }

    pub fn set_custom_client_id(&self, client_id: Option<String>) {
        let clean = client_id.and_then(|s| {
            let t = s.trim().to_string();
            if t.is_empty() { None } else { Some(t) }
        });

        let mut lock = self.custom_client_id.lock().unwrap();
        if *lock != clean {
            *lock = clean;
            // Force reconnect on next activity call
            let mut client_lock = self.client.lock().unwrap();
            if let Some(mut old) = client_lock.take() {
                let _ = old.close();
            }
            let mut curr_id = self.current_connected_id.lock().unwrap();
            *curr_id = None;
        }
    }

    pub fn is_enabled(&self) -> bool {
        *self.enabled.lock().unwrap()
    }

    fn get_effective_client_id(&self) -> String {
        let lock = self.custom_client_id.lock().unwrap();
        lock.as_ref()
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| DEFAULT_DISCORD_APP_ID.to_string())
    }

    fn ensure_connected(&self) -> bool {
        let target_id = self.get_effective_client_id();
        let mut client_lock = self.client.lock().unwrap();
        let mut curr_id_lock = self.current_connected_id.lock().unwrap();

        if client_lock.is_some() && curr_id_lock.as_deref() != Some(&target_id) {
            if let Some(mut old) = client_lock.take() {
                let _ = old.close();
            }
            *curr_id_lock = None;
        }

        if client_lock.is_none() {
            println!("[Discord RPC] Connecting to Discord IPC with client ID: {}", target_id);
            let mut c = DiscordIpcClient::new(&target_id);
            match c.connect() {
                Ok(_) => {
                    println!("[Discord RPC] Connected successfully to Discord Desktop IPC pipe!");
                    *client_lock = Some(c);
                    *curr_id_lock = Some(target_id);
                    return true;
                }
                Err(e) => {
                    eprintln!("[Discord RPC] Connection to Discord Desktop failed: {}", e);
                    return false;
                }
            }
        }
        true
    }

    pub fn test_connection(&self) -> Result<String, String> {
        if !self.ensure_connected() {
            return Err("Não foi possível conectar ao Discord. Verifique se o aplicativo Desktop do Discord está aberto no Windows.".to_string());
        }

        let mut client_lock = self.client.lock().unwrap();
        if let Some(client) = client_lock.as_mut() {
            let now_unix = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .map(|d| d.as_secs() as i64)
                .unwrap_or(0);

            let act = activity::Activity::new()
                .state("Gamingzone Launcher")
                .details("Testando Conexão...")
                .timestamps(activity::Timestamps::new().start(now_unix));

            if let Err(e) = client.set_activity(act) {
                *client_lock = None;
                return Err(format!("Erro ao definir status no Discord: {}", e));
            }

            Ok("Conexão com o Discord estabelecida com sucesso! Seu status foi atualizado.".to_string())
        } else {
            Err("Cliente Discord indisponível.".to_string())
        }
    }

    pub fn set_playing_game(
        &self,
        title: &str,
        platform_name: &str,
        platform_id: &str,
        is_emulator: bool,
        start_timestamp: i64,
    ) {
        if !self.is_enabled() {
            return;
        }
        if !self.ensure_connected() {
            eprintln!("[Discord RPC] Cannot set activity because Discord is not connected.");
            return;
        }

        let mut client_lock = self.client.lock().unwrap();
        if let Some(client) = client_lock.as_mut() {
            let state_str = if is_emulator {
                format!("Emulado ({})", platform_name)
            } else {
                format!("Recomp: {} → PC", platform_name)
            };

            let details_str = format!("Jogando {}", title);
            let asset_name = map_platform_asset(platform_id);

            let act = activity::Activity::new()
                .state(&state_str)
                .details(&details_str)
                .timestamps(activity::Timestamps::new().start(start_timestamp))
                .assets(
                    activity::Assets::new()
                        .large_image(asset_name)
                        .large_text("GAMINGZONE LAUNCHER")
                        .small_image("base")
                        .small_text(platform_name),
                );

            if let Err(e) = client.set_activity(act) {
                eprintln!("[Discord RPC] set_activity with assets failed: {}. Retrying basic activity...", e);
                // Fallback to basic activity without asset images
                let act_basic = activity::Activity::new()
                    .state(&state_str)
                    .details(&details_str)
                    .timestamps(activity::Timestamps::new().start(start_timestamp));

                if let Err(e2) = client.set_activity(act_basic) {
                    eprintln!("[Discord RPC] set_activity basic failed: {}", e2);
                    *client_lock = None;
                } else {
                    println!("[Discord RPC] Basic activity set: {} - {}", title, state_str);
                }
            } else {
                println!("[Discord RPC] Activity set: {} - {}", title, state_str);
            }
        }
    }

    pub fn set_idle(&self, games_count: usize) {
        if !self.is_enabled() {
            return;
        }
        if !self.ensure_connected() {
            return;
        }

        let mut client_lock = self.client.lock().unwrap();
        if let Some(client) = client_lock.as_mut() {
            let details_str = format!("Coleção: {} jogos", games_count);
            let act = activity::Activity::new()
                .state("Navegando na Biblioteca")
                .details(&details_str)
                .assets(
                    activity::Assets::new()
                        .large_image("playing")
                        .large_text("GAMINGZONE LAUNCHER"),
                );

            if client.set_activity(act).is_err() {
                let act_basic = activity::Activity::new()
                    .state("Navegando na Biblioteca")
                    .details(&details_str);
                if client.set_activity(act_basic).is_err() {
                    *client_lock = None;
                }
            }
        }
    }

    pub fn clear_activity(&self) {
        let mut client_lock = self.client.lock().unwrap();
        if let Some(client) = client_lock.as_mut() {
            let _ = client.clear_activity();
        }
    }
}

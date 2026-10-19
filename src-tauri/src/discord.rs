use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use std::sync::{Arc, Mutex};

// A public/open client ID registered for retro/recomp gaming, or user-customizable
const DEFAULT_DISCORD_APP_ID: &str = "1215682829285097562";

#[derive(Clone)]
pub struct DiscordState {
    client: Arc<Mutex<Option<DiscordIpcClient>>>,
    enabled: Arc<Mutex<bool>>,
}

impl DiscordState {
    pub fn new() -> Self {
        DiscordState {
            client: Arc::new(Mutex::new(None)),
            enabled: Arc::new(Mutex::new(true)),
        }
    }

    pub fn set_enabled(&self, enabled: bool) {
        let mut en = self.enabled.lock().unwrap();
        *en = enabled;
        if !enabled {
            self.clear_activity();
        }
    }

    pub fn is_enabled(&self) -> bool {
        *self.enabled.lock().unwrap()
    }

    fn ensure_connected(&self) -> bool {
        let mut client_lock = self.client.lock().unwrap();
        if client_lock.is_none() {
            let mut c = DiscordIpcClient::new(DEFAULT_DISCORD_APP_ID);
            if c.connect().is_ok() {
                *client_lock = Some(c);
                return true;
            }
            return false;
        }
        true
    }

    pub fn set_playing_game(
        &self,
        title: &str,
        platform_name: &str,
        is_emulator: bool,
        start_timestamp: i64,
    ) {
        if !self.is_enabled() {
            return;
        }
        if !self.ensure_connected() {
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

            let act = activity::Activity::new()
                .state(&state_str)
                .details(&details_str)
                .timestamps(activity::Timestamps::new().start(start_timestamp))
                .assets(
                    activity::Assets::new()
                        .large_image("app_logo")
                        .large_text("GAMINGZONE LAUNCHER")
                        .small_image("gamepad")
                        .small_text(platform_name),
                );

            if client.set_activity(act).is_err() {
                *client_lock = None;
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
                        .large_image("app_logo")
                        .large_text("GAMINGZONE LAUNCHER"),
                );

            if client.set_activity(act).is_err() {
                *client_lock = None;
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

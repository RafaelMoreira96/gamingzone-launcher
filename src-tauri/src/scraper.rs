use chrono::Datelike;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapedAsset {
    pub title: String,
    pub cover_url: Option<String>,
    pub banner_url: Option<String>,
    pub source: String,
    pub platform_hint: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScrapeResult {
    pub query: String,
    pub assets: Vec<ScrapedAsset>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IgdbGameMetadata {
    pub id: i64,
    pub name: String,
    pub summary: Option<String>,
    pub storyline: Option<String>,
    pub release_year: Option<i32>,
    pub cover_url: Option<String>,
    pub banner_url: Option<String>,
    pub platforms: Vec<String>,
    pub genres: Vec<String>,
    pub rating: Option<f64>,
}

// Curated high-res catalog for iconic recompilations and popular retro games
struct CuratedEntry {
    keywords: &'static [&'static str],
    title: &'static str,
    cover: &'static str,
    banner: &'static str,
    platform: &'static str,
}

const CURATED_GAMES: &[CuratedEntry] = &[
    CuratedEntry {
        keywords: &["zelda", "ocarina", "harkinian", "oot", "soh"],
        title: "The Legend of Zelda: Ocarina of Time (Ship of Harkinian)",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5vmg.webp",
        banner: "https://images.alphacoders.com/269/269824.jpg",
        platform: "Nintendo 64",
    },
    CuratedEntry {
        keywords: &["majora", "2ship", "mask", "mm"],
        title: "The Legend of Zelda: Majora's Mask (2Ship2Harkinian)",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co5z89.webp",
        banner: "https://images.alphacoders.com/588/588836.jpg",
        platform: "Nintendo 64",
    },
    CuratedEntry {
        keywords: &["mario 64", "sm64", "super mario 64"],
        title: "Super Mario 64 (sm64pc Recomp)",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2047.webp",
        banner: "https://images.alphacoders.com/112/1125299.jpg",
        platform: "Nintendo 64",
    },
    CuratedEntry {
        keywords: &["jak", "daxter", "opengoal", "precursor"],
        title: "Jak and Daxter: The Precursor Legacy (OpenGOAL)",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8v.webp",
        banner: "https://images.alphacoders.com/131/1315830.jpeg",
        platform: "PlayStation 2",
    },
    CuratedEntry {
        keywords: &["jak ii", "jak 2"],
        title: "Jak II (OpenGOAL PC Port)",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8u.webp",
        banner: "https://images.alphacoders.com/116/1169736.jpg",
        platform: "PlayStation 2",
    },
    CuratedEntry {
        keywords: &["wipeout", "wipeout rewrite", "phantom"],
        title: "WipEout (Rewrite PC Port)",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1x49.webp",
        banner: "https://images.alphacoders.com/712/712076.jpg",
        platform: "PlayStation 1",
    },
    CuratedEntry {
        keywords: &["perfect dark", "joanna"],
        title: "Perfect Dark (PC Port Recompiled)",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkx.webp",
        banner: "https://images.alphacoders.com/776/776510.jpg",
        platform: "Nintendo 64",
    },
    CuratedEntry {
        keywords: &["driver 2", "opendriver2"],
        title: "Driver 2: The Wheelman is Back (OpenDriver2)",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7z.webp",
        banner: "https://images.alphacoders.com/134/1347629.png",
        platform: "PlayStation 1",
    },
    CuratedEntry {
        keywords: &["god of war", "gow", "kratos"],
        title: "God of War",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1t98.webp",
        banner: "https://images.alphacoders.com/600/600528.jpg",
        platform: "PlayStation 2",
    },
    CuratedEntry {
        keywords: &["god of war 2", "god of war ii"],
        title: "God of War II",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1t99.webp",
        banner: "https://images.alphacoders.com/113/1135248.jpg",
        platform: "PlayStation 2",
    },
    CuratedEntry {
        keywords: &["shadow of the colossus", "colossus"],
        title: "Shadow of the Colossus",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r8c.webp",
        banner: "https://images.alphacoders.com/605/605727.jpg",
        platform: "PlayStation 2",
    },
    CuratedEntry {
        keywords: &["silent hill 2"],
        title: "Silent Hill 2 (Enhanced Edition)",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co2kbf.webp",
        banner: "https://images.alphacoders.com/117/1171805.jpg",
        platform: "PlayStation 2",
    },
    CuratedEntry {
        keywords: &["resident evil 4", "re4"],
        title: "Resident Evil 4",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1vce.webp",
        banner: "https://images.alphacoders.com/130/1304567.jpeg",
        platform: "GameCube",
    },
    CuratedEntry {
        keywords: &["metroid prime"],
        title: "Metroid Prime",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkv.webp",
        banner: "https://images.alphacoders.com/130/1304574.jpeg",
        platform: "GameCube",
    },
    CuratedEntry {
        keywords: &["halo", "combat evolved", "master chief"],
        title: "Halo: Combat Evolved",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r82.webp",
        banner: "https://images.alphacoders.com/598/598811.jpg",
        platform: "Xbox",
    },
    CuratedEntry {
        keywords: &["castlevania", "symphony of the night", "sotn", "alucard"],
        title: "Castlevania: Symphony of the Night",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7w.webp",
        banner: "https://images.alphacoders.com/695/695847.jpg",
        platform: "PlayStation 1",
    },
    CuratedEntry {
        keywords: &["metal gear solid", "mgs", "snake"],
        title: "Metal Gear Solid",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7v.webp",
        banner: "https://images.alphacoders.com/605/605781.jpg",
        platform: "PlayStation 1",
    },
    CuratedEntry {
        keywords: &["crash bandicoot"],
        title: "Crash Bandicoot",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1r83.webp",
        banner: "https://images.alphacoders.com/844/844053.jpg",
        platform: "PlayStation 1",
    },
    CuratedEntry {
        keywords: &["mario kart 64", "mk64"],
        title: "Mario Kart 64 (Recompiled)",
        cover: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1wkz.webp",
        banner: "https://images.alphacoders.com/112/1125301.jpg",
        platform: "Nintendo 64",
    },
];

pub fn search_game_assets(
    query: &str,
    steamgriddb_key: Option<&str>,
    igdb_client_id: Option<&str>,
    igdb_client_secret: Option<&str>,
) -> ScrapeResult {
    let q_lower = query.trim().to_lowercase();
    let mut results = Vec::new();

    // 1. Check curated catalog
    for entry in CURATED_GAMES {
        let matches = entry.keywords.iter().any(|k| q_lower.contains(k))
            || entry.title.to_lowercase().contains(&q_lower);

        if matches {
            results.push(ScrapedAsset {
                title: entry.title.to_string(),
                cover_url: Some(entry.cover.to_string()),
                banner_url: Some(entry.banner.to_string()),
                source: "Catálogo Curado Recomp".to_string(),
                platform_hint: Some(entry.platform.to_string()),
            });
        }
    }

    // 2. Query IGDB if credentials provided (supports single API key or client_id + client_secret)
    let igdb_key = igdb_client_id.unwrap_or("").trim();
    let igdb_sec = igdb_client_secret.unwrap_or("").trim();
    if !igdb_key.is_empty() || !igdb_sec.is_empty() {
        let primary_key = if !igdb_key.is_empty() { igdb_key } else { igdb_sec };
        let opt_sec = if !igdb_sec.is_empty() && igdb_sec != primary_key {
            Some(igdb_sec)
        } else {
            None
        };
        if let Ok(igdb_games) = query_igdb_games(&q_lower, primary_key, opt_sec) {
            for g in igdb_games {
                let plat_hint = g.platforms.first().cloned();
                results.push(ScrapedAsset {
                    title: g.name,
                    cover_url: g.cover_url,
                    banner_url: g.banner_url,
                    source: "IGDB".to_string(),
                    platform_hint: plat_hint,
                });
            }
        }
    }

    // 3. Query SteamGridDB if API key provided
    if let Some(key) = steamgriddb_key {
        if !key.trim().is_empty() {
            if let Ok(sgdb_results) = query_steamgriddb(&q_lower, key.trim()) {
                results.extend(sgdb_results);
            }
        }
    }

    // 4. Query Steam Public Storefront Search API (No key required)
    if let Ok(steam_results) = query_steam_public_store(&q_lower) {
        results.extend(steam_results);
    }

    ScrapeResult {
        query: query.to_string(),
        assets: results,
    }
}

fn query_steam_public_store(query: &str) -> Result<Vec<ScrapedAsset>, String> {
    let url = format!(
        "https://store.steampowered.com/api/storesearch/?term={}&l=portuguese&cc=US",
        urlencoding_simple(query)
    );

    let resp = ureq::get(&url)
        .timeout(std::time::Duration::from_secs(5))
        .call()
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = resp.into_json().map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    if let Some(items) = json.get("items").and_then(|v| v.as_array()) {
        for item in items.iter().take(4) {
            let app_id = item.get("id").and_then(|v| v.as_i64());
            let name = item.get("name").and_then(|v| v.as_str());

            if let (Some(id), Some(title)) = (app_id, name) {
                let cover = format!(
                    "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{}/library_600x900.jpg",
                    id
                );
                let banner = format!(
                    "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{}/library_hero.jpg",
                    id
                );

                list.push(ScrapedAsset {
                    title: title.to_string(),
                    cover_url: Some(cover),
                    banner_url: Some(banner),
                    source: "Steam CDN".to_string(),
                    platform_hint: None,
                });
            }
        }
    }

    Ok(list)
}

fn query_steamgriddb(query: &str, api_key: &str) -> Result<Vec<ScrapedAsset>, String> {
    let search_url = format!(
        "https://www.steamgriddb.com/api/v2/search/autocomplete/{}",
        urlencoding_simple(query)
    );

    let resp = ureq::get(&search_url)
        .set("Authorization", &format!("Bearer {}", api_key))
        .timeout(std::time::Duration::from_secs(5))
        .call()
        .map_err(|e| e.to_string())?;

    let json: serde_json::Value = resp.into_json().map_err(|e| e.to_string())?;
    let mut list = Vec::new();

    if let Some(data) = json.get("data").and_then(|v| v.as_array()) {
        for game in data.iter().take(3) {
            let game_id = game.get("id").and_then(|v| v.as_i64());
            let name = game.get("name").and_then(|v| v.as_str()).unwrap_or(query);

            if let Some(gid) = game_id {
                let grids_url = format!(
                    "https://www.steamgriddb.com/api/v2/grids/game/{}?dimensions=600x900",
                    gid
                );
                let heroes_url = format!("https://www.steamgriddb.com/api/v2/heroes/game/{}", gid);

                let mut cover: Option<String> = None;
                let mut banner: Option<String> = None;

                if let Ok(g_resp) = ureq::get(&grids_url)
                    .set("Authorization", &format!("Bearer {}", api_key))
                    .call()
                {
                    if let Ok(g_json) = g_resp.into_json::<serde_json::Value>() {
                        if let Some(items) = g_json.get("data").and_then(|v| v.as_array()) {
                            if let Some(first) = items.first() {
                                cover = first.get("url").and_then(|v| v.as_str()).map(|s| s.to_string());
                            }
                        }
                    }
                }

                if let Ok(h_resp) = ureq::get(&heroes_url)
                    .set("Authorization", &format!("Bearer {}", api_key))
                    .call()
                {
                    if let Ok(h_json) = h_resp.into_json::<serde_json::Value>() {
                        if let Some(items) = h_json.get("data").and_then(|v| v.as_array()) {
                            if let Some(first) = items.first() {
                                banner = first.get("url").and_then(|v| v.as_str()).map(|s| s.to_string());
                            }
                        }
                    }
                }

                if cover.is_some() || banner.is_some() {
                    list.push(ScrapedAsset {
                        title: name.to_string(),
                        cover_url: cover,
                        banner_url: banner,
                        source: "SteamGridDB".to_string(),
                        platform_hint: None,
                    });
                }
            }
        }
    }

    Ok(list)
}

fn urlencoding_simple(s: &str) -> String {
    let mut encoded = String::new();
    for b in s.bytes() {
        match b {
            b'a'..=b'z' | b'A'..=b'Z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                encoded.push(b as char);
            }
            b' ' => encoded.push('+'),
            _ => encoded.push_str(&format!("%{:02X}", b)),
        }
    }
    encoded
}

pub fn resolve_igdb_auth(
    api_key_or_id: &str,
    optional_secret: Option<&str>,
) -> Result<(String, String), String> {
    let key1 = api_key_or_id.trim();
    let key2 = optional_secret.unwrap_or("").trim();

    if key1.is_empty() && key2.is_empty() {
        return Err("Nenhuma chave de API ou credencial do IGDB foi fornecida.".to_string());
    }

    // Case 1: user entered "client_id:client_secret" or "client_id|client_secret" in a single field
    if key1.contains(':') || key1.contains('|') {
        let delimiter = if key1.contains(':') { ':' } else { '|' };
        let parts: Vec<&str> = key1.splitn(2, delimiter).collect();
        let cid = parts[0].trim();
        let csec = parts[1].trim();
        let token = get_igdb_oauth_token(cid, csec)?;
        return Ok((cid.to_string(), token));
    }

    // Case 2: user entered separate client_id and client_secret
    if !key1.is_empty() && !key2.is_empty() {
        // Test if key2 is already an access token or if we need to request OAuth token
        if let Ok(token) = get_igdb_oauth_token(key1, key2) {
            return Ok((key1.to_string(), token));
        } else {
            let direct_token = key2.trim_start_matches("Bearer ").trim();
            return Ok((key1.to_string(), direct_token.to_string()));
        }
    }

    // Case 3: user entered ONLY a single API key / Token (in key1 or key2)
    let single_key = if !key1.is_empty() { key1 } else { key2 };
    let clean_token = single_key.trim_start_matches("Bearer ").trim();

    // Query Twitch validate endpoint to retrieve the client_id associated with this token
    let validate_url = "https://id.twitch.tv/oauth2/validate";
    let resp = ureq::get(validate_url)
        .set("Authorization", &format!("OAuth {}", clean_token))
        .timeout(std::time::Duration::from_secs(8))
        .call();

    match resp {
        Ok(r) => {
            if let Ok(json) = r.into_json::<serde_json::Value>() {
                if let Some(cid) = json.get("client_id").and_then(|v| v.as_str()) {
                    return Ok((cid.to_string(), clean_token.to_string()));
                }
            }
            Err("Chave do IGDB validada, mas não foi possível extrair o Client ID da Twitch.".to_string())
        }
        Err(e) => {
            Err(format!(
                "Não foi possível validar a chave de API do IGDB/Twitch: {}. Se tiver Client ID e Secret, forneça-os ou use o formato 'CLIENT_ID:CLIENT_SECRET'.",
                e
            ))
        }
    }
}

pub fn get_igdb_oauth_token(client_id: &str, client_secret: &str) -> Result<String, String> {
    let secret = client_secret.trim().trim_start_matches("Bearer ").trim();
    let id = client_id.trim();
    if id.is_empty() || secret.is_empty() {
        return Err("Client ID e Client Secret não podem estar vazios".to_string());
    }

    let token_url = format!(
        "https://id.twitch.tv/oauth2/token?client_id={}&client_secret={}&grant_type=client_credentials",
        urlencoding_simple(id),
        urlencoding_simple(secret)
    );

    let resp = ureq::post(&token_url)
        .timeout(std::time::Duration::from_secs(8))
        .call()
        .map_err(|e| format!("Falha de autenticação com Twitch/IGDB: {}", e))?;

    let json: serde_json::Value = resp
        .into_json()
        .map_err(|e| format!("Resposta inválida da Twitch: {}", e))?;

    if let Some(token) = json.get("access_token").and_then(|t| t.as_str()) {
        Ok(token.to_string())
    } else if let Some(msg) = json.get("message").and_then(|m| m.as_str()) {
        Err(format!("Twitch recusou credenciais: {}", msg))
    } else {
        Err("Não foi possível obter access_token da Twitch".to_string())
    }
}

pub fn test_igdb_connection(api_key_or_id: &str, client_secret: Option<&str>) -> Result<String, String> {
    let (client_id, token) = resolve_igdb_auth(api_key_or_id, client_secret)?;

    let test_body = "fields id; limit 1;";
    let resp = ureq::post("https://api.igdb.com/v4/games")
        .set("Client-ID", &client_id)
        .set("Authorization", &format!("Bearer {}", token))
        .timeout(std::time::Duration::from_secs(8))
        .send_string(test_body)
        .map_err(|e| format!("Falha ao conectar à API do IGDB: {}", e))?;

    if resp.status() == 200 {
        Ok("Chave de API do IGDB validada com sucesso! Conexão autorizada.".to_string())
    } else {
        Err(format!("IGDB retornou status HTTP {}", resp.status()))
    }
}

pub fn query_igdb_games(
    query: &str,
    api_key_or_id: &str,
    client_secret: Option<&str>,
) -> Result<Vec<IgdbGameMetadata>, String> {
    let (client_id, token) = resolve_igdb_auth(api_key_or_id, client_secret)?;
    let clean_query = query.replace('"', "").trim().to_string();
    if clean_query.is_empty() {
        return Ok(Vec::new());
    }

    let body = format!(
        "search \"{}\"; fields id, name, summary, storyline, first_release_date, platforms.name, cover.image_id, artworks.image_id, screenshots.image_id, genres.name, total_rating; limit 12;",
        clean_query
    );

    let resp = ureq::post("https://api.igdb.com/v4/games")
        .set("Client-ID", &client_id)
        .set("Authorization", &format!("Bearer {}", token))
        .timeout(std::time::Duration::from_secs(8))
        .send_string(&body)
        .map_err(|e| format!("Erro na requisição IGDB: {}", e))?;

    let json: serde_json::Value = resp
        .into_json()
        .map_err(|e| format!("Erro ao processar JSON do IGDB: {}", e))?;

    let mut list = Vec::new();
    if let Some(games) = json.as_array() {
        for g in games {
            let id = g.get("id").and_then(|v| v.as_i64()).unwrap_or(0);
            let name = g.get("name").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let summary = g.get("summary").and_then(|v| v.as_str()).map(|s| s.to_string());
            let storyline = g.get("storyline").and_then(|v| v.as_str()).map(|s| s.to_string());

            let release_year = g
                .get("first_release_date")
                .and_then(|v| v.as_i64())
                .and_then(|ts| chrono::DateTime::from_timestamp(ts, 0))
                .map(|dt| dt.year());

            let cover_url = g
                .get("cover")
                .and_then(|c| c.get("image_id"))
                .and_then(|v| v.as_str())
                .map(|img_id| format!("https://images.igdb.com/igdb/image/upload/t_cover_big/{}.jpg", img_id));

            let banner_url = g
                .get("artworks")
                .and_then(|a| a.as_array())
                .and_then(|arr| arr.first())
                .and_then(|item| item.get("image_id"))
                .and_then(|v| v.as_str())
                .or_else(|| {
                    g.get("screenshots")
                        .and_then(|s| s.as_array())
                        .and_then(|arr| arr.first())
                        .and_then(|item| item.get("image_id"))
                        .and_then(|v| v.as_str())
                })
                .map(|img_id| format!("https://images.igdb.com/igdb/image/upload/t_1080p/{}.jpg", img_id));

            let mut platforms = Vec::new();
            if let Some(plats) = g.get("platforms").and_then(|p| p.as_array()) {
                for p in plats {
                    if let Some(pname) = p.get("name").and_then(|n| n.as_str()) {
                        platforms.push(pname.to_string());
                    }
                }
            }

            let mut genres = Vec::new();
            if let Some(gen_arr) = g.get("genres").and_then(|g| g.as_array()) {
                for gen in gen_arr {
                    if let Some(gname) = gen.get("name").and_then(|n| n.as_str()) {
                        genres.push(gname.to_string());
                    }
                }
            }

            let rating = g.get("total_rating").and_then(|r| r.as_f64());

            list.push(IgdbGameMetadata {
                id,
                name,
                summary,
                storyline,
                release_year,
                cover_url,
                banner_url,
                platforms,
                genres,
                rating,
            });
        }
    }

    Ok(list)
}

import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  RotateCw,
  Award,
  Settings,
  Gamepad2,
  Sparkles,
  ChevronRight,
  Star,
  Calendar,
  X,
  ArrowUpDown,
} from "lucide-react";
import { Game, RaGameProgress, RaUserProfile, RaUserGame } from "../types";
import { api, formatRaDate } from "../services/api";

interface RetroAchievementsViewProps {
  games: Game[];
  initialGame?: Game | null;
  raUsername?: string;
  raApiKey?: string;
  onBackToLibrary: () => void;
  onOpenSettings?: () => void;
}

export const RetroAchievementsView: React.FC<RetroAchievementsViewProps> = ({
  games,
  initialGame,
  raUsername,
  raApiKey,
  onBackToLibrary,
  onOpenSettings,
}) => {
  // Navigation: "account_games" (Aba Conquistas) or "game_details" (Visualizar Conquistas do Jogo)
  const [activeTab, setActiveTab] = useState<"account_games" | "game_details">(
    initialGame ? "game_details" : "account_games"
  );

  const [accountGames, setAccountGames] = useState<RaUserGame[]>([]);
  const [isLoadingAccountGames, setIsLoadingAccountGames] = useState(false);
  const [selectedAccountGame, setSelectedAccountGame] = useState<RaUserGame | null>(null);

  const [selectedGame, setSelectedGame] = useState<Game | null>(initialGame || games[0] || null);
  const [manualGameId, setManualGameId] = useState<string>("");
  const [userProfile, setUserProfile] = useState<RaUserProfile | null>(null);
  const [raProgress, setRaProgress] = useState<RaGameProgress | null>(null);
  const [raLoading, setRaLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters for Account Games tab
  const [accountSearchQuery, setAccountSearchQuery] = useState("");
  const [accountConsoleFilter, setAccountConsoleFilter] = useState<string>("all");
  const [accountModeFilter, setAccountModeFilter] = useState<"all" | "hardcore" | "softcore">("all");
  const [accountStatusFilter, setAccountStatusFilter] = useState<"all" | "beaten" | "mastered" | "in_progress">("all");
  const [accountSortBy, setAccountSortBy] = useState<"recent" | "progress_desc" | "achievements_desc" | "name_asc">("recent");

  // Filters & Search for Achievements within a Game
  const [filterType, setFilterType] = useState<"all" | "unlocked" | "locked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "points_desc" | "points_asc" | "unlocked_first">("default");

  useEffect(() => {
    loadUserProfile();
    loadAccountGames();
  }, [raUsername, raApiKey]);

  useEffect(() => {
    if (initialGame) {
      setSelectedGame(initialGame);
      setActiveTab("game_details");
      loadAchievementsForGame(initialGame);
    }
  }, [initialGame]);

  const loadUserProfile = async () => {
    if (!raUsername?.trim()) {
      setUserProfile(null);
      return;
    }
    try {
      const prof = await api.getRaProfile(raUsername.trim(), raApiKey?.trim() || "");
      setUserProfile(prof);
    } catch (err) {
      console.warn("Não foi possível carregar perfil do RetroAchievements:", err);
      setUserProfile(null);
    }
  };

  const loadAccountGames = async () => {
    setIsLoadingAccountGames(true);
    try {
      const list = await api.getRaUserGames({
        username: raUsername,
        api_key: raApiKey,
      });
      setAccountGames(list);
      if (list.length > 0 && !selectedAccountGame) {
        setSelectedAccountGame(list[0]);
      }
    } catch (err) {
      console.error("Erro ao carregar jogos da conta do RetroAchievements:", err);
    } finally {
      setIsLoadingAccountGames(false);
    }
  };

  const loadAchievementsForGame = async (game: Game | { title: string; original_platform_id: string }, customId?: number) => {
    setRaLoading(true);
    setErrorMsg(null);
    try {
      const progress = await api.getRaGameProgress({
        title: game.title,
        platform_id: game.original_platform_id,
        username: raUsername,
        api_key: raApiKey,
        explicit_game_id: customId,
      });
      setRaProgress(progress);
      setManualGameId(progress.game_id.toString());
    } catch (err: any) {
      console.error("Erro ao carregar conquistas:", err);
      setErrorMsg(err.toString());
    } finally {
      setRaLoading(false);
    }
  };

  const handleSelectAccountGame = (accGame: RaUserGame) => {
    setSelectedAccountGame(accGame);
    setActiveTab("game_details");

    const matchingLocal = games.find(
      (g) =>
        g.title.toLowerCase().includes(accGame.title.toLowerCase()) ||
        accGame.title.toLowerCase().includes(g.title.toLowerCase())
    );

    if (matchingLocal) {
      setSelectedGame(matchingLocal);
      loadAchievementsForGame(matchingLocal, accGame.game_id);
    } else {
      const virtualGame: Game = {
        id: `ra-${accGame.game_id}`,
        title: accGame.title,
        original_platform_id: accGame.console_name.toLowerCase().includes("playstation 2")
          ? "ps2"
          : accGame.console_name.toLowerCase().includes("nintendo 64")
          ? "n64"
          : accGame.console_name.toLowerCase().includes("gamecube")
          ? "gamecube"
          : accGame.console_name.toLowerCase().includes("playstation")
          ? "ps1"
          : "other",
        platform_name: accGame.console_name,
        executable_path: "",
        working_dir: "",
        launch_arguments: "",
        total_playtime_seconds: 0,
        created_at: new Date().toISOString(),
        is_running: false,
        is_emulator: true,
        is_favorite: false,
        play_status: "playing",
        cover_url: accGame.image_box_art || accGame.image_icon,
      };
      setSelectedGame(virtualGame);
      loadAchievementsForGame(virtualGame, accGame.game_id);
    }
  };

  const handleManualIdSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedId = parseInt(manualGameId.trim(), 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      setErrorMsg("Insira um ID numérico válido do jogo no RetroAchievements (ex: 9989 para Zelda, 2276 para Mario 64, 11206 para God of War II).");
      return;
    }
    const target = selectedGame || { title: `Jogo RA #${parsedId}`, original_platform_id: "other" };
    loadAchievementsForGame(target, parsedId);
    setActiveTab("game_details");
  };

  // Distinct console names from account games with counts (sorted by most games first)
  const accountConsolesWithCount = useMemo(() => {
    const map = new Map<string, number>();
    accountGames.forEach((g) => {
      if (g.console_name) {
        map.set(g.console_name, (map.get(g.console_name) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [accountGames]);

  // Pre-calculated counts
  const beatenGamesCount = useMemo(
    () => accountGames.filter((g) => g.is_beaten || (g.num_possible_achievements > 0 && g.num_achieved >= g.num_possible_achievements)).length,
    [accountGames]
  );
  const masteredGamesCount = useMemo(
    () => accountGames.filter((g) => g.is_mastered || (g.num_possible_achievements > 0 && g.num_achieved >= g.num_possible_achievements)).length,
    [accountGames]
  );
  const inProgressGamesCount = useMemo(
    () => accountGames.filter((g) => !g.is_beaten && !g.is_mastered && !(g.num_possible_achievements > 0 && g.num_achieved >= g.num_possible_achievements)).length,
    [accountGames]
  );
  const hardcoreGamesCount = useMemo(
    () => accountGames.filter((g) => g.is_hardcore ?? (g.award_mode === "hardcore" || (g.num_achieved_hardcore ?? 0) > 0)).length,
    [accountGames]
  );
  const softcoreGamesCount = useMemo(
    () => accountGames.filter((g) => !(g.is_hardcore ?? (g.award_mode === "hardcore" || (g.num_achieved_hardcore ?? 0) > 0))).length,
    [accountGames]
  );

  // Filtered & Sorted account games
  const filteredAccountGames = useMemo(() => {
    let list = accountGames.filter((g) => {
      if (accountConsoleFilter !== "all" && g.console_name !== accountConsoleFilter) return false;
      const isMastered = g.is_mastered || (g.num_possible_achievements > 0 && g.num_achieved >= g.num_possible_achievements);
      const isBeaten = g.is_beaten || isMastered;

      if (accountStatusFilter === "beaten" && !isBeaten) return false;
      if (accountStatusFilter === "mastered" && !isMastered) return false;
      if (accountStatusFilter === "in_progress" && (isBeaten || isMastered)) return false;

      const isHardcore = g.is_hardcore ?? (g.award_mode === "hardcore" || (g.num_achieved_hardcore ?? 0) > 0);
      if (accountModeFilter === "hardcore" && !isHardcore) return false;
      if (accountModeFilter === "softcore" && isHardcore) return false;

      if (accountSearchQuery.trim()) {
        const q = accountSearchQuery.toLowerCase();
        const matchTitle = g.title.toLowerCase().includes(q);
        const matchConsole = g.console_name.toLowerCase().includes(q);
        if (!matchTitle && !matchConsole) return false;
      }
      return true;
    });

    switch (accountSortBy) {
      case "progress_desc":
        return list.sort((a, b) => {
          const pA = a.num_possible_achievements > 0 ? a.num_achieved / a.num_possible_achievements : 0;
          const pB = b.num_possible_achievements > 0 ? b.num_achieved / b.num_possible_achievements : 0;
          return pB - pA;
        });
      case "achievements_desc":
        return list.sort((a, b) => b.num_achieved - a.num_achieved);
      case "name_asc":
        return list.sort((a, b) => a.title.localeCompare(b.title));
      case "recent":
      default:
        return list;
    }
  }, [accountGames, accountConsoleFilter, accountModeFilter, accountStatusFilter, accountSearchQuery, accountSortBy]);

  // Filtered & Sorted Achievements for Selected Game
  const filteredAchievements = useMemo(() => {
    if (!raProgress?.achievements) return [];

    let list = raProgress.achievements.filter((ach) => {
      if (filterType === "unlocked" && !ach.is_unlocked) return false;
      if (filterType === "locked" && ach.is_unlocked) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ach.title.toLowerCase().includes(q);
        const matchesDesc = ach.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }
      return true;
    });

    switch (sortBy) {
      case "points_desc":
        return list.sort((a, b) => b.points - a.points);
      case "points_asc":
        return list.sort((a, b) => a.points - b.points);
      case "unlocked_first":
        return list.sort((a, b) => (b.is_unlocked ? 1 : 0) - (a.is_unlocked ? 1 : 0));
      case "default":
      default:
        return list;
    }
  }, [raProgress, filterType, searchQuery, sortBy]);

  return (
    <div
      className="retroachievements-page"
      style={{
        padding: "24px 36px 60px 36px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        height: "calc(100vh - 74px)",
        overflowY: "auto",
      }}
    >
      {/* TOP NAVIGATION & CONTROLS */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "14px",
          paddingBottom: "16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onBackToLibrary}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <ArrowLeft size={16} />
            <span>Voltar para Biblioteca</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #FF9900 0%, #FF5500 100%)",
                padding: "8px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 16px rgba(255, 153, 0, 0.4)",
              }}
            >
              <Trophy size={20} color="#080a0f" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h1 style={{ fontSize: "1.35rem", margin: 0, fontWeight: 800 }}>Central de Conquistas</h1>
                <span
                  style={{
                    fontSize: "0.7rem",
                    background: "rgba(255, 153, 0, 0.15)",
                    color: "#FFB84D",
                    border: "1px solid rgba(255, 153, 0, 0.35)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontWeight: 700,
                  }}
                >
                  RetroAchievements
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: 0 }}>
                Acompanhe os jogos da sua conta e veja todas as conquistas desbloqueadas
              </p>
            </div>
          </div>
        </div>

        {onOpenSettings && (
          <button
            type="button"
            className="btn-secondary"
            onClick={onOpenSettings}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Settings size={15} />
            <span>Configurações RA</span>
          </button>
        )}
      </div>

      {/* USER PROFILE CARD */}
      {userProfile ? (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255, 153, 0, 0.12) 0%, rgba(13, 17, 26, 0.75) 100%)",
            border: "1px solid rgba(255, 153, 0, 0.35)",
            borderRadius: "var(--radius-lg)",
            padding: "18px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.35)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ position: "relative" }}>
              <img
                src={userProfile.user_pic}
                alt={userProfile.user}
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #FF9900",
                  boxShadow: "0 0 16px rgba(255, 153, 0, 0.4)",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    `https://media.retroachievements.org/UserPic/${userProfile.user}.png`;
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: "-2px",
                  right: "-2px",
                  background: "#FF9900",
                  borderRadius: "50%",
                  padding: "3px",
                  display: "flex",
                }}
              >
                <ShieldCheck size={13} color="#000" />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontWeight: 800, fontSize: "1.15rem", color: "#fff" }}>
                  {userProfile.user}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    color: "#FFB84D",
                    background: "rgba(255, 153, 0, 0.2)",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    fontWeight: 700,
                  }}
                >
                  Rank #{userProfile.rank.toLocaleString("pt-BR")}
                </span>
                {userProfile.total_ranked > 0 && (
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    de {userProfile.total_ranked.toLocaleString("pt-BR")} jogadores
                  </span>
                )}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                {userProfile.motto || "Conquistando clássicos no GAMINGZONE LAUNCHER!"}
              </div>
            </div>
          </div>

          {/* STATS PILLS */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                Jogos na Conta
              </span>
              <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#fff" }}>
                {accountGames.length}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                Pontos Hardcore
              </span>
              <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#FFB84D" }}>
                {userProfile.points.toLocaleString("pt-BR")} pts
              </span>
            </div>
            {userProfile.softcore_points > 0 && (
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                  Pontos Softcore
                </span>
                <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#38bdf8" }}>
                  {userProfile.softcore_points.toLocaleString("pt-BR")} pts
                </span>
              </div>
            )}
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                True Points (Raridade)
              </span>
              <span style={{ fontSize: "1.25rem", fontWeight: 900, color: "#00E5FF" }}>
                {userProfile.total_true_points.toLocaleString("pt-BR")} pts
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "rgba(255, 153, 0, 0.08)",
            border: "1px dashed rgba(255, 153, 0, 0.35)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Award size={24} color="#FF9900" />
            <div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#FFB84D" }}>
                Conta do RetroAchievements (Modo Demonstração Ativo)
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Mostrando os jogos registrados e conquistas sincronizadas. Para conectar sua própria conta ao vivo, insira seu usuário e Web API Key nas Configurações.
              </div>
            </div>
          </div>
          {onOpenSettings && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onOpenSettings}
              style={{
                fontSize: "0.8rem",
                padding: "8px 14px",
                borderColor: "rgba(255, 153, 0, 0.4)",
                color: "#FFB84D",
              }}
            >
              <Settings size={15} />
              <span>Inserir Minha Chave</span>
            </button>
          )}
        </div>
      )}

      {/* PRIMARY TAB SELECTOR: CONQUISTAS (JOGOS DA CONTA) vs DETALHES DO JOGO */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "4px",
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("account_games")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "var(--radius-md) var(--radius-md) 0 0",
            background: activeTab === "account_games" ? "rgba(255, 153, 0, 0.18)" : "transparent",
            color: activeTab === "account_games" ? "#FFB84D" : "var(--text-muted)",
            border: "none",
            borderBottom: activeTab === "account_games" ? "3px solid #FF9900" : "3px solid transparent",
            fontWeight: 800,
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <Trophy size={18} />
          <span>Conquistas ({accountGames.length} Jogos na Conta)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (selectedAccountGame) {
              handleSelectAccountGame(selectedAccountGame);
            } else if (selectedGame) {
              setActiveTab("game_details");
            }
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            borderRadius: "var(--radius-md) var(--radius-md) 0 0",
            background: activeTab === "game_details" ? "rgba(255, 153, 0, 0.18)" : "transparent",
            color: activeTab === "game_details" ? "#FFB84D" : "var(--text-muted)",
            border: "none",
            borderBottom: activeTab === "game_details" ? "3px solid #FF9900" : "3px solid transparent",
            fontWeight: 800,
            fontSize: "0.95rem",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <Sparkles size={18} />
          <span>
            {raProgress ? `Conquistas: ${raProgress.game_title}` : "Detalhes do Jogo Selecionado"}
          </span>
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            background: "rgba(255, 51, 75, 0.12)",
            border: "1px solid var(--accent-red)",
            color: "#ff6b7e",
            padding: "10px 14px",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.85rem",
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {/* TAB 1: CONQUISTAS (JOGOS DA CONTA) */}
      {activeTab === "account_games" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* FILTER AND SEARCH TOOLBAR FOR ACCOUNT GAMES */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-lg)",
              padding: "16px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
            }}
          >
            {/* ROW 1: SEARCH BAR + CONSOLE SELECTOR + SORT + CLEAR */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {/* SEARCH INPUT */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flex: 1,
                  minWidth: "260px",
                  background: "rgba(0, 0, 0, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "var(--radius-md)",
                  padding: "8px 14px",
                }}
              >
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Buscar por nome do jogo ou console..."
                  value={accountSearchQuery}
                  onChange={(e) => setAccountSearchQuery(e.target.value)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#fff",
                    fontSize: "0.88rem",
                    outline: "none",
                    width: "100%",
                  }}
                />
                {accountSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setAccountSearchQuery("")}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                    }}
                    title="Limpar busca"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              {/* CONSOLE SELECTOR (Dropdown limpo e organizado) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(0, 0, 0, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "var(--radius-md)",
                  padding: "6px 12px",
                  minWidth: "220px",
                }}
              >
                <Gamepad2 size={16} color="#FF9900" style={{ flexShrink: 0 }} />
                <select
                  className="form-input"
                  value={accountConsoleFilter}
                  onChange={(e) => setAccountConsoleFilter(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "2px 0",
                    width: "100%",
                    outline: "none",
                  }}
                >
                  <option value="all" style={{ background: "#0d131f", color: "#fff" }}>
                    Todos os Consoles ({accountGames.length})
                  </option>
                  {accountConsolesWithCount.map((c) => (
                    <option key={c.name} value={c.name} style={{ background: "#0d131f", color: "#fff" }}>
                      {c.name} ({c.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* MODE SELECTOR */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(0, 0, 0, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "var(--radius-md)",
                  padding: "6px 12px",
                }}
              >
                <span style={{ fontSize: "14px" }}>
                  {accountModeFilter === "hardcore" ? "🔥" : accountModeFilter === "softcore" ? "🛡️" : "🎮"}
                </span>
                <select
                  className="form-input"
                  value={accountModeFilter}
                  onChange={(e) => setAccountModeFilter(e.target.value as any)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: accountModeFilter === "hardcore" ? "#FFB84D" : accountModeFilter === "softcore" ? "#38bdf8" : "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    padding: "2px 0",
                    outline: "none",
                  }}
                >
                  <option value="all" style={{ background: "#0d131f", color: "#fff" }}>
                    Todos os Modos ({accountGames.length})
                  </option>
                  <option value="hardcore" style={{ background: "#0d131f", color: "#FFB84D" }}>
                    🔥 Hardcore ({hardcoreGamesCount})
                  </option>
                  <option value="softcore" style={{ background: "#0d131f", color: "#38bdf8" }}>
                    🛡️ Softcore ({softcoreGamesCount})
                  </option>
                </select>
              </div>

              {/* SORT SELECTOR */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "rgba(0, 0, 0, 0.35)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "var(--radius-md)",
                  padding: "6px 12px",
                }}
              >
                <ArrowUpDown size={15} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
                <select
                  className="form-input"
                  value={accountSortBy}
                  onChange={(e) => setAccountSortBy(e.target.value as any)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: "2px 0",
                    outline: "none",
                  }}
                >
                  <option value="recent" style={{ background: "#0d131f", color: "#fff" }}>Recentes / Padrão</option>
                  <option value="progress_desc" style={{ background: "#0d131f", color: "#fff" }}>Maior Progresso (%)</option>
                  <option value="achievements_desc" style={{ background: "#0d131f", color: "#fff" }}>Mais Conquistas</option>
                  <option value="name_asc" style={{ background: "#0d131f", color: "#fff" }}>Nome (A - Z)</option>
                </select>
              </div>

              {/* CLEAR FILTERS BUTTON (se filtros ativos) */}
              {(accountSearchQuery || accountConsoleFilter !== "all" || accountModeFilter !== "all" || accountStatusFilter !== "all" || accountSortBy !== "recent") && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setAccountSearchQuery("");
                    setAccountConsoleFilter("all");
                    setAccountModeFilter("all");
                    setAccountStatusFilter("all");
                    setAccountSortBy("recent");
                  }}
                  style={{
                    fontSize: "0.78rem",
                    padding: "7px 12px",
                    color: "var(--accent-red)",
                    borderColor: "rgba(255, 51, 75, 0.35)",
                    background: "rgba(255, 51, 75, 0.08)",
                  }}
                  title="Limpar todos os filtros"
                >
                  <X size={13} style={{ marginRight: "4px" }} />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            {/* ROW 2: STATUS FILTER BUTTONS + SUMMARY COUNT */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                flexWrap: "wrap",
                borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                paddingTop: "12px",
              }}
            >
              {/* SEGMENTED STATUS PILLS */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`details-filter-btn ${accountStatusFilter === "all" ? "active" : ""}`}
                  onClick={() => setAccountStatusFilter("all")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                  }}
                >
                  <span>Todos</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      background: accountStatusFilter === "all" ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.08)",
                      padding: "1px 6px",
                      borderRadius: "999px",
                    }}
                  >
                    {accountGames.length}
                  </span>
                </button>

                <button
                  type="button"
                  className={`details-filter-btn ${accountStatusFilter === "beaten" ? "active" : ""}`}
                  onClick={() => setAccountStatusFilter("beaten")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    borderColor: accountStatusFilter === "beaten" ? "#4ade80" : undefined,
                    color: accountStatusFilter === "beaten" ? "#4ade80" : undefined,
                    background: accountStatusFilter === "beaten" ? "rgba(74, 222, 128, 0.15)" : undefined,
                  }}
                >
                  <Trophy size={13} color={accountStatusFilter === "beaten" ? "#4ade80" : "var(--text-muted)"} />
                  <span>Zerados</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      background: accountStatusFilter === "beaten" ? "rgba(74, 222, 128, 0.25)" : "rgba(255, 255, 255, 0.08)",
                      color: accountStatusFilter === "beaten" ? "#4ade80" : undefined,
                      padding: "1px 6px",
                      borderRadius: "999px",
                    }}
                  >
                    {beatenGamesCount}
                  </span>
                </button>

                <button
                  type="button"
                  className={`details-filter-btn ${accountStatusFilter === "mastered" ? "active" : ""}`}
                  onClick={() => setAccountStatusFilter("mastered")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                    borderColor: accountStatusFilter === "mastered" ? "#FFD54F" : undefined,
                    color: accountStatusFilter === "mastered" ? "#FFD54F" : undefined,
                    background: accountStatusFilter === "mastered" ? "rgba(255, 213, 79, 0.15)" : undefined,
                  }}
                >
                  <Star size={13} color={accountStatusFilter === "mastered" ? "#FFD54F" : "var(--text-muted)"} />
                  <span>100% Mastered</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      background: accountStatusFilter === "mastered" ? "rgba(255, 213, 79, 0.25)" : "rgba(255, 255, 255, 0.08)",
                      color: accountStatusFilter === "mastered" ? "#FFD54F" : undefined,
                      padding: "1px 6px",
                      borderRadius: "999px",
                    }}
                  >
                    {masteredGamesCount}
                  </span>
                </button>

                <button
                  type="button"
                  className={`details-filter-btn ${accountStatusFilter === "in_progress" ? "active" : ""}`}
                  onClick={() => setAccountStatusFilter("in_progress")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontWeight: 700,
                  }}
                >
                  <span>Em Progresso</span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      background: accountStatusFilter === "in_progress" ? "rgba(0, 229, 255, 0.2)" : "rgba(255, 255, 255, 0.08)",
                      color: accountStatusFilter === "in_progress" ? "var(--accent-cyan)" : undefined,
                      padding: "1px 6px",
                      borderRadius: "999px",
                    }}
                  >
                    {inProgressGamesCount}
                  </span>
                </button>
              </div>

              {/* RESULT COUNT INDICATOR */}
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                Mostrando <strong style={{ color: "#fff" }}>{filteredAccountGames.length}</strong> de{" "}
                <strong style={{ color: "var(--text-secondary)" }}>{accountGames.length}</strong> jogos
                {accountConsoleFilter !== "all" && (
                  <span style={{ color: "#FFB84D", marginLeft: "6px" }}>
                    • {accountConsoleFilter}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* GAMES GRID */}
          {isLoadingAccountGames ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              <RotateCw size={36} color="#FF9900" className="spin" style={{ margin: "0 auto" }} />
              <p style={{ marginTop: "14px", fontSize: "0.95rem" }}>
                Carregando jogos e conquistas sincronizadas na sua conta...
              </p>
            </div>
          ) : filteredAccountGames.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "var(--bg-card)",
                borderRadius: "var(--radius-lg)",
                border: "1px dashed var(--border-subtle)",
              }}
            >
              <Trophy size={42} color="var(--text-muted)" style={{ margin: "0 auto" }} />
              <h3 style={{ marginTop: "14px", fontSize: "1.1rem" }}>Nenhum jogo encontrado nesta categoria</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Jogue seus títulos com emuladores compatíveis com RetroAchievements ou ajuste os filtros acima.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                gap: "16px",
              }}
            >
              {filteredAccountGames.map((game) => {
                const percent =
                  game.num_possible_achievements > 0
                    ? Math.round((game.num_achieved / game.num_possible_achievements) * 100)
                    : 0;
                const isMastered = game.is_mastered || (game.num_possible_achievements > 0 && game.num_achieved >= game.num_possible_achievements);
                const isBeaten = game.is_beaten || isMastered;
                const beatenDate = game.beaten_date || game.highest_award_date;
                const isGameHardcore = game.is_hardcore ?? (game.award_mode === "hardcore" || (game.num_achieved_hardcore ?? 0) > 0);

                const cardBorder = isMastered
                  ? isGameHardcore
                    ? "1px solid rgba(255, 184, 0, 0.55)"
                    : "1px solid rgba(203, 213, 225, 0.55)"
                  : isBeaten
                  ? "1px solid rgba(74, 222, 128, 0.45)"
                  : "1px solid rgba(255, 255, 255, 0.08)";

                const cardShadow = isMastered
                  ? isGameHardcore
                    ? "0 4px 20px rgba(255, 184, 0, 0.15)"
                    : "0 4px 20px rgba(148, 163, 184, 0.15)"
                  : isBeaten
                  ? "0 4px 20px rgba(74, 222, 128, 0.12)"
                  : "0 4px 14px rgba(0,0,0,0.3)";

                return (
                  <div
                    key={game.game_id}
                    onClick={() => handleSelectAccountGame(game)}
                    style={{
                      background: "linear-gradient(145deg, rgba(18, 24, 38, 0.85) 0%, rgba(10, 14, 22, 0.95) 100%)",
                      border: cardBorder,
                      borderRadius: "var(--radius-lg)",
                      padding: "16px",
                      display: "flex",
                      gap: "16px",
                      cursor: "pointer",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      position: "relative",
                      boxShadow: cardShadow,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = isMastered
                        ? isGameHardcore ? "#FFB800" : "#e2e8f0"
                        : isBeaten
                        ? "#4ade80"
                        : isGameHardcore ? "#FF9900" : "#38bdf8";
                      e.currentTarget.style.boxShadow = isMastered
                        ? isGameHardcore ? "0 8px 25px rgba(255, 184, 0, 0.25)" : "0 8px 25px rgba(203, 213, 225, 0.25)"
                        : isBeaten
                        ? "0 8px 25px rgba(74, 222, 128, 0.25)"
                        : isGameHardcore ? "0 8px 25px rgba(255, 153, 0, 0.2)" : "0 8px 25px rgba(56, 189, 248, 0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.borderColor = isMastered
                        ? isGameHardcore ? "rgba(255, 184, 0, 0.55)" : "rgba(203, 213, 225, 0.55)"
                        : isBeaten
                        ? "rgba(74, 222, 128, 0.45)"
                        : "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.boxShadow = cardShadow;
                    }}
                  >
                    {/* GAME COVER / ICON */}
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <img
                        src={game.image_box_art || game.image_icon || "https://media.retroachievements.org/Images/000001.png"}
                        alt={game.title}
                        style={{
                          width: "80px",
                          height: "106px",
                          objectFit: "cover",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          background: "#080a0f",
                        }}
                        onError={(e) => {
                          if (game.image_icon) {
                            (e.target as HTMLImageElement).src = game.image_icon;
                          }
                        }}
                      />
                      {isMastered ? (
                        <div
                          style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            background: isGameHardcore
                              ? "linear-gradient(135deg, #FFB800 0%, #FF8800 100%)"
                              : "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: isGameHardcore
                              ? "0 0 10px rgba(255, 184, 0, 0.6)"
                              : "0 0 10px rgba(203, 213, 225, 0.6)",
                            color: "#080a0f",
                          }}
                          title={isGameHardcore ? "100% Mastered (Hardcore)" : "100% Completed (Softcore)"}
                        >
                          <Star size={14} fill="#080a0f" />
                        </div>
                      ) : isBeaten ? (
                        <div
                          style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            background: "linear-gradient(135deg, #4ade80 0%, #22c55e 100%)",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 0 10px rgba(74, 222, 128, 0.6)",
                            color: "#080a0f",
                          }}
                          title={isGameHardcore ? "Jogo Zerado (Hardcore)" : "Jogo Zerado (Softcore)"}
                        >
                          <Trophy size={13} fill="#080a0f" />
                        </div>
                      ) : null}
                    </div>

                    {/* GAME INFO */}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 800,
                              color: "#FFB84D",
                              background: "rgba(255, 153, 0, 0.15)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              textTransform: "uppercase",
                            }}
                          >
                            {game.console_name}
                          </span>

                          {/* HARDCORE vs SOFTCORE BADGE */}
                          <span
                            style={{
                              fontSize: "0.65rem",
                              fontWeight: 800,
                              color: isGameHardcore ? "#FFB84D" : "#38bdf8",
                              background: isGameHardcore ? "rgba(255, 153, 0, 0.18)" : "rgba(56, 189, 248, 0.15)",
                              border: isGameHardcore ? "1px solid rgba(255, 153, 0, 0.4)" : "1px solid rgba(56, 189, 248, 0.4)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "3px",
                            }}
                          >
                            {isGameHardcore ? "🔥 HARDCORE" : "🛡️ SOFTCORE"}
                          </span>

                          {/* MASTERED (GOLD) vs COMPLETED (SILVER) vs BEATEN */}
                          {isMastered ? (
                            <span
                              style={{
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                color: "#080a0f",
                                background: isGameHardcore
                                  ? "linear-gradient(135deg, #FFD54F 0%, #FFB800 100%)"
                                  : "linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                boxShadow: isGameHardcore
                                  ? "0 0 8px rgba(255, 184, 0, 0.35)"
                                  : "0 0 8px rgba(203, 213, 225, 0.35)",
                              }}
                            >
                              {isGameHardcore ? "👑 100% MASTERED" : "🥈 100% COMPLETED"}
                            </span>
                          ) : isBeaten ? (
                            <span
                              style={{
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                color: "#080a0f",
                                background: "#4ade80",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              🏆 ZERADO ({isGameHardcore ? "HC" : "SC"})
                            </span>
                          ) : null}
                        </div>

                        <h3
                          style={{
                            fontSize: "1rem",
                            fontWeight: 700,
                            margin: 0,
                            color: "#fff",
                            lineHeight: 1.25,
                          }}
                        >
                          {game.title}
                        </h3>

                        {/* ZERADO / BEATEN DATE & REQUIREMENTS STATUS */}
                        {isBeaten ? (
                          <div
                            style={{
                              marginTop: "6px",
                              padding: "5px 8px",
                              background: isMastered
                                ? isGameHardcore ? "rgba(255, 184, 0, 0.1)" : "rgba(203, 213, 225, 0.1)"
                                : "rgba(74, 222, 128, 0.1)",
                              border: isMastered
                                ? isGameHardcore ? "1px solid rgba(255, 184, 0, 0.35)" : "1px solid rgba(203, 213, 225, 0.35)"
                                : "1px solid rgba(74, 222, 128, 0.3)",
                              borderRadius: "6px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                                fontSize: "0.74rem",
                                fontWeight: 700,
                                color: isMastered ? (isGameHardcore ? "#FFD54F" : "#cbd5e1") : "#4ade80",
                              }}
                            >
                              <Trophy size={13} />
                              <span>
                                {isMastered
                                  ? isGameHardcore ? "Masterizado (Hardcore)" : "Concluído (Softcore)"
                                  : isGameHardcore ? "Zerado (Hardcore)" : "Zerado (Softcore)"} em: {formatRaDate(beatenDate || game.last_played)}
                              </span>
                            </div>
                            <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>
                              {isMastered
                                ? `✓ Requisito cumprido: 100% das conquistas (${isGameHardcore ? "Modo Hardcore" : "Modo Softcore"})`
                                : `✓ Requisito cumprido: Condição de vitória conquistada (${isGameHardcore ? "Modo Hardcore" : "Modo Softcore"})`}
                            </span>
                          </div>
                        ) : (
                          <div
                            style={{
                              marginTop: "6px",
                              fontSize: "0.70rem",
                              color: "var(--text-muted)",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <span>Modo {isGameHardcore ? "Hardcore" : "Softcore"}:</span>
                            <span style={{ color: "#94a3b8" }}>Metas de vitória ou 100%</span>
                          </div>
                        )}
                      </div>

                      {/* PROGRESS BAR & STATS */}
                      <div style={{ marginTop: "10px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.78rem",
                            marginBottom: "4px",
                            color: "var(--text-muted)",
                          }}
                        >
                          <span>
                            <strong style={{ color: "#fff" }}>{game.num_achieved}</strong> de {game.num_possible_achievements} Conquistas
                          </span>
                          <span style={{ color: isMastered ? (isGameHardcore ? "#FFB84D" : "#cbd5e1") : "var(--accent-cyan)", fontWeight: 700 }}>
                            {percent}%
                          </span>
                        </div>

                        <div
                          style={{
                            height: "6px",
                            background: "rgba(255, 255, 255, 0.08)",
                            borderRadius: "999px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${percent}%`,
                              background: isMastered
                                ? isGameHardcore
                                  ? "linear-gradient(90deg, #FFB800 0%, #FF8800 100%)"
                                  : "linear-gradient(90deg, #f1f5f9 0%, #94a3b8 100%)"
                                : "linear-gradient(90deg, #00E5FF 0%, #0077FF 100%)",
                              borderRadius: "999px",
                              boxShadow: isMastered
                                ? isGameHardcore
                                  ? "0 0 10px rgba(255, 184, 0, 0.5)"
                                  : "0 0 10px rgba(203, 213, 225, 0.5)"
                                : "0 0 8px rgba(0, 229, 255, 0.4)",
                            }}
                          />
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "8px",
                            fontSize: "0.75rem",
                          }}
                        >
                          <span style={{ color: isGameHardcore ? "#FFB84D" : "#38bdf8", fontWeight: 700 }}>
                            {game.score_achieved} / {game.possible_score} pts {isGameHardcore ? "🔥 HC" : "🛡️ SC"}
                          </span>

                          <span
                            style={{
                              color: "var(--accent-cyan)",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                            }}
                          >
                            <span>Acessar Conquistas</span>
                            <ChevronRight size={14} />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DETALHES DO JOGO SELECIONADO & CONQUISTAS */}
      {activeTab === "game_details" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* BACK TO ACCOUNT GAMES BUTTON & QUICK SWITCHER */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "14px",
              flexWrap: "wrap",
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              padding: "12px 18px",
              borderRadius: "var(--radius-md)",
            }}
          >
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setActiveTab("account_games")}
              style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}
            >
              <ArrowLeft size={16} />
              <span>← Voltar para Lista de Jogos da Conta</span>
            </button>

            {/* QUICK SWITCH LOCAL OR ACCOUNT GAME */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                Trocar Jogo:
              </label>
              <select
                className="form-input"
                value={raProgress?.game_id || selectedAccountGame?.game_id || selectedGame?.id || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  const acc = accountGames.find((g) => g.game_id.toString() === val);
                  if (acc) {
                    handleSelectAccountGame(acc);
                    return;
                  }
                  const loc = games.find((g) => g.id === val);
                  if (loc) {
                    setSelectedGame(loc);
                    loadAchievementsForGame(loc);
                  }
                }}
                style={{ cursor: "pointer", fontSize: "0.85rem", fontWeight: 600, minWidth: "240px" }}
              >
                <optgroup label="Jogos da Conta RetroAchievements">
                  {accountGames.map((g) => (
                    <option key={`ra-${g.game_id}`} value={g.game_id}>
                      {g.title} ({g.console_name}) - {g.num_achieved}/{g.num_possible_achievements}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Jogos Emulados da Biblioteca">
                  {games
                    .filter((g) => Boolean(g.is_emulator))
                    .map((g) => (
                      <option key={`local-${g.id}`} value={g.id}>
                        {g.title} ({g.platform_name || g.original_platform_id.toUpperCase()})
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* MANUAL ID SEARCH */}
            <form onSubmit={handleManualIdSearch} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                className="form-input"
                placeholder="ID no RA (ex: 9989)"
                value={manualGameId}
                onChange={(e) => setManualGameId(e.target.value)}
                style={{ width: "160px", fontSize: "0.85rem", height: "36px" }}
              />
              <button
                type="submit"
                className="btn-secondary"
                disabled={raLoading || !manualGameId.trim()}
                style={{ padding: "6px 12px", height: "36px" }}
              >
                <RotateCw size={14} className={raLoading ? "spin" : ""} />
                <span>Buscar ID</span>
              </button>
            </form>
          </div>

          {raLoading ? (
            <div style={{ textAlign: "center", padding: "64px 0", color: "var(--text-muted)" }}>
              <Trophy size={42} color="#FF9900" style={{ animation: "pulse 1.2s infinite", margin: "0 auto" }} />
              <h3 style={{ marginTop: "16px", color: "#fff", fontSize: "1.1rem" }}>
                Consultando conquistas no RetroAchievements...
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Obtendo badges, descrições e status de desbloqueio em alta definição
              </p>
            </div>
          ) : raProgress ? (
            <>
              {/* HERO SUMMARY CARD */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(255, 153, 0, 0.14) 0%, rgba(13, 17, 26, 0.85) 100%)",
                  border: "1px solid rgba(255, 153, 0, 0.35)",
                  borderRadius: "var(--radius-lg)",
                  padding: "22px 28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "20px",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "12px",
                      overflow: "hidden",
                      background: "#080a0f",
                      border: "2px solid rgba(255, 153, 0, 0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {selectedAccountGame?.image_icon || selectedAccountGame?.image_box_art || selectedGame?.cover_url ? (
                      <img
                        src={
                          selectedAccountGame?.image_icon ||
                          selectedAccountGame?.image_box_art ||
                          selectedGame?.cover_url
                        }
                        alt={raProgress.game_title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <Gamepad2 size={32} color="#FF9900" />
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#FFB84D",
                          background: "rgba(255, 153, 0, 0.2)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontWeight: 700,
                        }}
                      >
                        {raProgress.console_name}
                      </span>
                      {(() => {
                        const isHc = raProgress.is_hardcore ?? (raProgress.award_mode === "hardcore" || (raProgress.unlocked_hardcore_count ?? 0) > 0);
                        return (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              color: isHc ? "#FFB84D" : "#38bdf8",
                              background: isHc ? "rgba(255, 153, 0, 0.2)" : "rgba(56, 189, 248, 0.2)",
                              border: isHc ? "1px solid rgba(255, 153, 0, 0.4)" : "1px solid rgba(56, 189, 248, 0.4)",
                              padding: "2px 8px",
                              borderRadius: "4px",
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            {isHc ? "🔥 MODO HARDCORE" : "🛡️ MODO SOFTCORE"}
                          </span>
                        );
                      })()}
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        ID #{raProgress.game_id}
                      </span>
                    </div>
                    <h2 style={{ fontSize: "1.45rem", fontWeight: 800, margin: "4px 0", color: "#fff" }}>
                      {raProgress.game_title}
                    </h2>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "0.85rem" }}>
                      <span>
                        <strong style={{ color: "#FFB84D" }}>{raProgress.unlocked_achievements}</strong> de{" "}
                        {raProgress.total_achievements} Conquistas Desbloqueadas
                      </span>
                      <span style={{ color: "var(--text-muted)" }}>•</span>
                      <span>
                        <strong style={{ color: "#00E5FF" }}>{raProgress.unlocked_points}</strong> de{" "}
                        {raProgress.total_points} Pontos
                      </span>
                    </div>
                  </div>
                </div>

                {/* PROGRESS WHEEL / BAR */}
                <div style={{ minWidth: "220px", textAlign: "right" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#FFB84D" }}>
                    {Math.round(raProgress.completion_percentage)}%
                  </div>
                  <div
                    style={{
                      height: "8px",
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "999px",
                      overflow: "hidden",
                      marginTop: "4px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${raProgress.completion_percentage}%`,
                        background: "linear-gradient(90deg, #FF9900 0%, #00E5FF 100%)",
                        borderRadius: "999px",
                        boxShadow: "0 0 10px rgba(255, 153, 0, 0.6)",
                      }}
                    />
                  </div>
                  <a
                    href={`https://retroachievements.org/game/${raProgress.game_id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--accent-cyan)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      marginTop: "8px",
                      textDecoration: "none",
                    }}
                  >
                    <span>Ver no site RetroAchievements</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
              </div>

              {/* STATUS DE CONCLUSÃO & REQUISITOS PARA ZERAR */}
              {(() => {
                const isMastered =
                  raProgress.is_mastered ||
                  (raProgress.total_achievements > 0 &&
                    raProgress.unlocked_achievements >= raProgress.total_achievements);
                const isBeaten = raProgress.is_beaten || isMastered;
                const hasWinConditions = (raProgress.win_conditions_total || 0) > 0;
                const beatenDate = raProgress.beaten_date || raProgress.highest_award_date;
                const isHc = raProgress.is_hardcore ?? (raProgress.award_mode === "hardcore" || (raProgress.unlocked_hardcore_count ?? 0) > 0);

                return (
                  <div
                    style={{
                      background: isMastered
                        ? isHc
                          ? "linear-gradient(135deg, rgba(255, 184, 0, 0.18) 0%, rgba(20, 20, 10, 0.9) 100%)"
                          : "linear-gradient(135deg, rgba(226, 232, 240, 0.14) 0%, rgba(15, 23, 42, 0.9) 100%)"
                        : isBeaten
                        ? "linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(10, 25, 18, 0.9) 100%)"
                        : "linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)",
                      border: isMastered
                        ? isHc
                          ? "1px solid rgba(255, 184, 0, 0.5)"
                          : "1px solid rgba(203, 213, 225, 0.5)"
                        : isBeaten
                        ? "1px solid rgba(74, 222, 128, 0.45)"
                        : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "var(--radius-lg)",
                      padding: "18px 24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "18px",
                      flexWrap: "wrap",
                      boxShadow: isMastered
                        ? isHc
                          ? "0 4px 20px rgba(255, 184, 0, 0.18)"
                          : "0 4px 20px rgba(203, 213, 225, 0.15)"
                        : isBeaten
                        ? "0 4px 20px rgba(74, 222, 128, 0.15)"
                        : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <div
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "14px",
                          background: isMastered
                            ? isHc ? "rgba(255, 184, 0, 0.2)" : "rgba(226, 232, 240, 0.15)"
                            : isBeaten
                            ? "rgba(74, 222, 128, 0.2)"
                            : "rgba(255, 255, 255, 0.05)",
                          border: isMastered
                            ? isHc ? "1px solid #FFB800" : "1px solid #cbd5e1"
                            : isBeaten
                            ? "1px solid #4ade80"
                            : "1px solid rgba(255, 255, 255, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isMastered ? (isHc ? "#FFB800" : "#e2e8f0") : isBeaten ? "#4ade80" : "var(--text-muted)",
                          flexShrink: 0,
                        }}
                      >
                        {isMastered ? <Star size={28} /> : isBeaten ? <Trophy size={28} /> : <Award size={28} />}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: "1rem",
                              fontWeight: 800,
                              color: isMastered ? (isHc ? "#FFD54F" : "#f1f5f9") : isBeaten ? "#4ade80" : "#fff",
                              letterSpacing: "0.3px",
                            }}
                          >
                            {isMastered
                              ? isHc
                                ? "👑 JOGO 100% MASTERIZADO (MODO HARDCORE)"
                                : "🥈 JOGO 100% CONCLUÍDO (MODO SOFTCORE)"
                              : isBeaten
                              ? isHc
                                ? "🏆 JOGO ZERADO (MODO HARDCORE)"
                                : "🏆 JOGO ZERADO (MODO SOFTCORE)"
                              : `PROGRESSO PARA ZERAR (${isHc ? "MODO HARDCORE" : "MODO SOFTCORE"})`}
                          </span>
                          {beatenDate && (
                            <span
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 800,
                                color: "#080a0f",
                                background: isMastered ? (isHc ? "#FFD54F" : "#cbd5e1") : "#4ade80",
                                padding: "3px 10px",
                                borderRadius: "999px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <Calendar size={13} />
                              {isMastered
                                ? isHc ? "Masterizado em: " : "Concluído em: "
                                : "Zerado em: "}
                              {formatRaDate(beatenDate)}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: "5px 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.45 }}>
                          {isMastered ? (
                            <span>
                              Parabéns! Todas as <strong>{raProgress.total_achievements}</strong> conquistas foram desbloqueadas. O jogo foi 100% dominado no{" "}
                              <strong style={{ color: isHc ? "#FFB84D" : "#38bdf8" }}>{isHc ? "Modo Hardcore" : "Modo Softcore"}</strong> oficial!
                            </span>
                          ) : isBeaten ? (
                            <span>
                              ✓ Requisitos de desbloqueio cumpridos ({isHc ? "Modo Hardcore" : "Modo Softcore"}):{" "}
                              {hasWinConditions
                                ? `Todas as condições de vitória foram concluídas (${raProgress.win_conditions_unlocked}/${raProgress.win_conditions_total} metas de vitória desbloqueadas).`
                                : "Todas as conquistas principais foram alcançadas e o encerramento do jogo foi reconhecido oficialmente."}
                            </span>
                          ) : (
                            <span>
                              Requisitos para zerar ({isHc ? "Modo Hardcore" : "Modo Softcore"}):{" "}
                              {hasWinConditions ? (
                                <>
                                  Desbloqueie todas as <strong>{raProgress.win_conditions_total}</strong> conquistas marcadas com o selo <em>🏆 Condição de Vitória (Requisito para Zerar)</em>. Progresso atual: <strong>{raProgress.win_conditions_unlocked || 0}/{raProgress.win_conditions_total}</strong>.
                                </>
                              ) : (
                                <>
                                  Desbloqueie as conquistas principais do jogo ou alcance 100% das conquistas para registrar o encerramento oficial.
                                </>
                              )}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", minWidth: "160px" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px" }}>
                        Metas de Vitória
                      </div>
                      <div
                        style={{
                          fontSize: "1.15rem",
                          fontWeight: 800,
                          color: isBeaten ? "#4ade80" : "var(--accent-cyan)",
                        }}
                      >
                        {hasWinConditions
                          ? `${raProgress.win_conditions_unlocked || 0} / ${raProgress.win_conditions_total} Condições`
                          : `${raProgress.unlocked_achievements} / ${raProgress.total_achievements} Conquistas`}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ACHIEVEMENTS FILTERS, SEARCH AND SORT */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  padding: "12px 18px",
                  borderRadius: "var(--radius-md)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    className={`details-filter-btn ${filterType === "all" ? "active" : ""}`}
                    onClick={() => setFilterType("all")}
                  >
                    Todas ({raProgress.total_achievements})
                  </button>
                  <button
                    type="button"
                    className={`details-filter-btn ${filterType === "unlocked" ? "active" : ""}`}
                    onClick={() => setFilterType("unlocked")}
                  >
                    <CheckCircle2 size={13} style={{ marginRight: "4px", color: "var(--accent-green)" }} />
                    Desbloqueadas ({raProgress.unlocked_achievements})
                  </button>
                  <button
                    type="button"
                    className={`details-filter-btn ${filterType === "locked" ? "active" : ""}`}
                    onClick={() => setFilterType("locked")}
                  >
                    <Lock size={13} style={{ marginRight: "4px", color: "var(--text-muted)" }} />
                    Bloqueadas ({raProgress.total_achievements - raProgress.unlocked_achievements})
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, maxWidth: "340px" }}>
                  <Search size={15} color="var(--text-muted)" />
                  <input
                    type="text"
                    placeholder="Buscar conquista..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#fff",
                      fontSize: "0.85rem",
                      outline: "none",
                      width: "100%",
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Ordenar por:</span>
                  <select
                    className="form-input"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    style={{ fontSize: "0.82rem", padding: "4px 8px", height: "32px", cursor: "pointer" }}
                  >
                    <option value="default">Ordem Padrão do Jogo</option>
                    <option value="unlocked_first">Desbloqueadas Primeiro</option>
                    <option value="points_desc">Mais Pontos</option>
                    <option value="points_asc">Menos Pontos</option>
                  </select>
                </div>
              </div>

              {/* ACHIEVEMENTS GRID */}
              {filteredAchievements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
                  <Award size={36} color="var(--text-muted)" style={{ margin: "0 auto" }} />
                  <p style={{ marginTop: "12px", fontSize: "0.9rem" }}>
                    Nenhuma conquista corresponde aos filtros atuais.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
                    gap: "14px",
                  }}
                >
                  {filteredAchievements.map((ach) => {
                    const isWinCond =
                      ach.achievement_type === "win_condition" ||
                      ach.achievement_type?.toLowerCase().includes("win");

                    return (
                      <div
                        key={ach.id}
                        className="achievement-card"
                        style={{
                          background: ach.is_unlocked
                            ? isWinCond
                              ? "linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(13, 17, 26, 0.9) 100%)"
                              : "linear-gradient(135deg, rgba(255, 153, 0, 0.08) 0%, rgba(13, 17, 26, 0.9) 100%)"
                            : "rgba(10, 14, 22, 0.6)",
                          border: ach.is_unlocked
                            ? isWinCond
                              ? "1px solid rgba(74, 222, 128, 0.45)"
                              : "1px solid rgba(255, 153, 0, 0.35)"
                            : isWinCond
                            ? "1px dashed rgba(74, 222, 128, 0.35)"
                            : "1px solid rgba(255, 255, 255, 0.06)",
                          borderRadius: "var(--radius-md)",
                          padding: "14px",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "14px",
                          opacity: ach.is_unlocked ? 1 : 0.7,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {/* BADGE ICON */}
                        <div
                          style={{
                            width: "56px",
                            height: "56px",
                            borderRadius: "10px",
                            overflow: "hidden",
                            flexShrink: 0,
                            position: "relative",
                            border: ach.is_unlocked
                              ? isWinCond
                                ? "2px solid #4ade80"
                                : "2px solid #FF9900"
                              : "2px solid rgba(255, 255, 255, 0.1)",
                            boxShadow: ach.is_unlocked
                              ? isWinCond
                                ? "0 0 12px rgba(74, 222, 128, 0.35)"
                                : "0 0 12px rgba(255, 153, 0, 0.35)"
                              : "none",
                            filter: ach.is_unlocked ? "none" : "grayscale(0.9) brightness(0.6)",
                          }}
                        >
                          <img
                            src={ach.badge_url}
                            alt={ach.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://media.retroachievements.org/Badge/00001.png";
                            }}
                          />
                        </div>

                        {/* DETAILS */}
                        <div style={{ flex: 1 }}>
                          {/* WIN CONDITION / PROGRESSION / MISSABLE BADGE */}
                          {isWinCond ? (
                            <div style={{ marginBottom: "6px" }}>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 800,
                                  color: ach.is_unlocked ? "#4ade80" : "#86efac",
                                  background: ach.is_unlocked ? "rgba(74, 222, 128, 0.18)" : "rgba(74, 222, 128, 0.08)",
                                  border: "1px solid rgba(74, 222, 128, 0.4)",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                                title="Requisito de Desbloqueio: Conquista necessária para zerar o jogo"
                              >
                                <Trophy size={11} />
                                🏆 Condição de Vitória (Requisito para Zerar)
                              </span>
                            </div>
                          ) : ach.achievement_type === "progression" ? (
                            <div style={{ marginBottom: "6px" }}>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  color: "var(--accent-cyan)",
                                  background: "rgba(0, 229, 255, 0.12)",
                                  border: "1px solid rgba(0, 229, 255, 0.3)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                ⚡ Progressão da Campanha
                              </span>
                            </div>
                          ) : ach.achievement_type === "missable" ? (
                            <div style={{ marginBottom: "6px" }}>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  fontWeight: 700,
                                  color: "#f87171",
                                  background: "rgba(248, 113, 113, 0.12)",
                                  border: "1px solid rgba(248, 113, 113, 0.3)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                ⚠️ Conquista Perdível
                              </span>
                            </div>
                          ) : null}

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: "8px",
                            }}
                          >
                            <h4
                              style={{
                                margin: 0,
                                fontSize: "0.95rem",
                                fontWeight: 700,
                                color: ach.is_unlocked ? "#fff" : "#94a3b8",
                              }}
                            >
                              {ach.title}
                            </h4>
                            <span
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                color: "#FFB84D",
                                background: "rgba(255, 153, 0, 0.15)",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {ach.points} pts
                            </span>
                          </div>

                          <p
                            style={{
                              fontSize: "0.82rem",
                              color: "var(--text-muted)",
                              margin: "4px 0 8px 0",
                              lineHeight: 1.35,
                            }}
                          >
                            {ach.description}
                          </p>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              fontSize: "0.72rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {ach.is_unlocked ? (
                              <span
                                style={{
                                  color: isWinCond ? "#4ade80" : "var(--accent-green)",
                                  fontWeight: 700,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <CheckCircle2 size={12} />
                                <span>
                                  {ach.date_unlocked ? `Desbloqueada em ${formatRaDate(ach.date_unlocked)}` : "Desbloqueada"}
                                </span>
                              </span>
                            ) : (
                              <span
                                style={{
                                  color: isWinCond ? "#86efac" : "#64748b",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontWeight: isWinCond ? 600 : 400,
                                }}
                              >
                                <Lock size={12} />
                                <span>{isWinCond ? "Bloqueada (Requisito para Zerar)" : "Bloqueada"}</span>
                              </span>
                            )}

                            {ach.is_unlocked && (
                              ach.hardcore ? (
                                <span
                                  style={{
                                    color: "#FFB84D",
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    background: "rgba(255, 153, 0, 0.2)",
                                    border: "1px solid rgba(255, 153, 0, 0.4)",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                  }}
                                  title="Desbloqueada no Modo Hardcore (Sem cheats/save states)"
                                >
                                  🔥 Hardcore
                                </span>
                              ) : (
                                <span
                                  style={{
                                    color: "#38bdf8",
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    background: "rgba(56, 189, 248, 0.15)",
                                    border: "1px solid rgba(56, 189, 248, 0.4)",
                                    padding: "2px 6px",
                                    borderRadius: "4px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                  }}
                                  title="Desbloqueada no Modo Softcore (Padrão)"
                                >
                                  🛡️ Softcore
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

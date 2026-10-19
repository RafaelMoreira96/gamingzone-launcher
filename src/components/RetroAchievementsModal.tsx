import React, { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Search,
  RotateCw,
  Award,
  Settings,
} from "lucide-react";
import { Game, RaGameProgress, RaUserProfile } from "../types";
import { api } from "../services/api";

interface RetroAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: Game[];
  initialGame?: Game | null;
  raUsername?: string;
  raApiKey?: string;
  onOpenSettings?: () => void;
}

export const RetroAchievementsModal: React.FC<RetroAchievementsModalProps> = ({
  isOpen,
  onClose,
  games,
  initialGame,
  raUsername,
  raApiKey,
  onOpenSettings,
}) => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(initialGame || games[0] || null);
  const [manualGameId, setManualGameId] = useState<string>("");
  const [userProfile, setUserProfile] = useState<RaUserProfile | null>(null);
  const [raProgress, setRaProgress] = useState<RaGameProgress | null>(null);
  const [raLoading, setRaLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [filterType, setFilterType] = useState<"all" | "unlocked" | "locked">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "points_desc" | "points_asc" | "unlocked_first">("default");

  useEffect(() => {
    if (isOpen) {
      if (initialGame) {
        setSelectedGame(initialGame);
      } else if (!selectedGame && games.length > 0) {
        setSelectedGame(games[0]);
      }
      loadUserProfile();
    }
  }, [isOpen, initialGame]);

  useEffect(() => {
    if (isOpen && selectedGame) {
      loadAchievementsForGame(selectedGame);
    }
  }, [isOpen, selectedGame]);

  const loadUserProfile = async () => {
    if (!raUsername?.trim() || !raApiKey?.trim()) {
      setUserProfile(null);
      return;
    }
    try {
      const prof = await api.getRaProfile(raUsername.trim(), raApiKey.trim());
      setUserProfile(prof);
    } catch (err) {
      console.warn("Não foi possível carregar perfil do RetroAchievements:", err);
      setUserProfile(null);
    }
  };

  const loadAchievementsForGame = async (game: Game, customId?: number) => {
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

  const handleManualIdSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedId = parseInt(manualGameId.trim(), 10);
    if (isNaN(parsedId) || parsedId <= 0) {
      setErrorMsg("Insira um ID numérico válido do jogo no RetroAchievements (ex: 11206).");
      return;
    }
    if (selectedGame) {
      loadAchievementsForGame(selectedGame, parsedId);
    } else {
      // Create a temporary placeholder game
      const tempGame: Game = {
        id: `ra-${parsedId}`,
        title: `Jogo RA #${parsedId}`,
        original_platform_id: "other",
        executable_path: "",
        working_dir: "",
        launch_arguments: "",
        total_playtime_seconds: 0,
        created_at: new Date().toISOString(),
        is_running: false,
        is_emulator: true,
        is_favorite: false,
        play_status: "backlog",
      };
      loadAchievementsForGame(tempGame, parsedId);
    }
  };

  // Filtered & Sorted Achievements
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

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10600 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "880px", width: "95vw", maxHeight: "92vh" }}
      >
        {/* MODAL HEADER */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                <h2 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 800 }}>Central RetroAchievements</h2>
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
                  Oficial
                </span>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                Conquistas, troféus e pontuação hardcore para emuladores e recompilações
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: "18px", padding: "20px 24px" }}>
          {/* USER PROFILE CARD OR CONNECT BANNER */}
          {userProfile ? (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(255, 153, 0, 0.1) 0%, rgba(13, 17, 26, 0.7) 100%)",
                border: "1px solid rgba(255, 153, 0, 0.35)",
                borderRadius: "var(--radius-md)",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ position: "relative" }}>
                  <img
                    src={userProfile.user_pic}
                    alt={userProfile.user}
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid #FF9900",
                      boxShadow: "0 0 12px rgba(255, 153, 0, 0.4)",
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://media.retroachievements.org/UserPic/RetroAchievements.png";
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: "-2px",
                      right: "-2px",
                      background: "#FF9900",
                      borderRadius: "50%",
                      padding: "2px",
                      display: "flex",
                    }}
                  >
                    <ShieldCheck size={12} color="#000" />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 800, fontSize: "1.05rem", color: "#fff" }}>
                      {userProfile.user}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: "#FFB84D",
                        background: "rgba(255, 153, 0, 0.15)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontWeight: 700,
                      }}
                    >
                      Rank #{userProfile.rank.toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                    {userProfile.motto || "Conquistando clássicos no GAMINGZONE LAUNCHER"}
                  </div>
                </div>
              </div>

              {/* STATS */}
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                    Pontos Hardcore
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#FFB84D" }}>
                    {userProfile.points.toLocaleString("pt-BR")} pts
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>
                    True Points (Raridade)
                  </span>
                  <span style={{ fontSize: "1.1rem", fontWeight: 900, color: "#00E5FF" }}>
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
                borderRadius: "var(--radius-md)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Award size={22} color="#FF9900" />
                <div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFB84D" }}>
                    Sincronização de Conta Desativada
                  </div>
                  <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                    Você pode visualizar o catálogo de conquistas normalmente. Para salvar seu progresso pessoal ao vivo, informe seu usuário e Web API Key.
                  </div>
                </div>
              </div>
              {onOpenSettings && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    onClose();
                    onOpenSettings();
                  }}
                  style={{
                    fontSize: "0.75rem",
                    padding: "6px 12px",
                    borderColor: "rgba(255, 153, 0, 0.4)",
                    color: "#FFB84D",
                  }}
                >
                  <Settings size={14} />
                  <span>Configurar Conta</span>
                </button>
              )}
            </div>
          )}

          {/* GAME SELECTOR & MANUAL ID BAR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {/* SELECT GAME DROPDOWN */}
            <div style={{ flex: 1, minWidth: "260px" }}>
              <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>
                Selecione o Jogo da sua Biblioteca:
              </label>
              <select
                className="form-input"
                value={selectedGame?.id || ""}
                onChange={(e) => {
                  const g = games.find((item) => item.id === e.target.value);
                  if (g) setSelectedGame(g);
                }}
                style={{ cursor: "pointer", fontSize: "0.88rem" }}
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title} ({g.platform_name || g.original_platform_id.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            {/* MANUAL RA GAME ID SEARCH */}
            <form onSubmit={handleManualIdSearch} style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "4px", display: "block" }}>
                  ID do Jogo no RetroAchievements:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: 11206 ou 2276"
                  value={manualGameId}
                  onChange={(e) => setManualGameId(e.target.value)}
                  style={{ width: "160px", fontSize: "0.88rem" }}
                />
              </div>
              <button
                type="submit"
                className="btn-secondary"
                disabled={raLoading || !manualGameId.trim()}
                style={{ padding: "9px 14px", height: "39px" }}
                title="Carregar conquistas deste ID específico"
              >
                <RotateCw size={14} className={raLoading ? "spin" : ""} />
                <span>Buscar ID</span>
              </button>
            </form>
          </div>

          {errorMsg && (
            <div
              style={{
                background: "rgba(255, 51, 75, 0.12)",
                border: "1px solid var(--accent-red)",
                color: "#ff6b7e",
                padding: "8px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.8rem",
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {/* ACTIVE GAME PROGRESS OVERVIEW */}
          {raLoading ? (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)" }}>
              <Trophy size={36} color="#FF9900" style={{ animation: "pulse 1.2s infinite", margin: "0 auto" }} />
              <p style={{ marginTop: "12px", fontSize: "0.9rem" }}>
                Consultando conquistas no banco de dados do RetroAchievements...
              </p>
            </div>
          ) : raProgress ? (
            <>
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(255, 153, 0, 0.12) 0%, rgba(13, 17, 26, 0.8) 100%)",
                  border: "1px solid rgba(255, 153, 0, 0.35)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff" }}>
                        {raProgress.game_title}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          background: "rgba(255, 153, 0, 0.2)",
                          color: "#FFB84D",
                          border: "1px solid rgba(255, 153, 0, 0.4)",
                          borderRadius: "4px",
                          padding: "2px 8px",
                          fontWeight: 700,
                        }}
                      >
                        {raProgress.console_name} • ID {raProgress.game_id}
                      </span>
                    </div>

                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      {raProgress.unlocked_achievements} de {raProgress.total_achievements} conquistas desbloqueadas (
                      {raProgress.completion_percentage.toFixed(1)}%)
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                        Pontuação
                      </span>
                      <span style={{ fontSize: "1.15rem", fontWeight: 900, color: "#FFB84D" }}>
                        {raProgress.unlocked_points} / {raProgress.total_points} pts
                      </span>
                    </div>

                    <a
                      href={`https://retroachievements.org/game/${raProgress.game_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                      style={{
                        fontSize: "0.78rem",
                        padding: "6px 12px",
                        borderColor: "rgba(255, 153, 0, 0.3)",
                        color: "#FFB84D",
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>Ver no RA</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                </div>

                {/* PROGRESS BAR */}
                <div
                  style={{
                    width: "100%",
                    height: "10px",
                    background: "rgba(0, 0, 0, 0.4)",
                    borderRadius: "5px",
                    overflow: "hidden",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    style={{
                      width: `${raProgress.completion_percentage}%`,
                      height: "100%",
                      background: "linear-gradient(90deg, #ff9900 0%, #ff5500 100%)",
                      borderRadius: "5px",
                      boxShadow: "0 0 12px rgba(255, 153, 0, 0.5)",
                      transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </div>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "10px",
                }}
              >
                {/* TABS */}
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    className={`details-filter-btn ${filterType === "all" ? "active" : ""}`}
                    onClick={() => setFilterType("all")}
                    style={{
                      borderColor: filterType === "all" ? "#FF9900" : undefined,
                      color: filterType === "all" ? "#FFB84D" : undefined,
                    }}
                  >
                    Todas ({raProgress.total_achievements})
                  </button>
                  <button
                    type="button"
                    className={`details-filter-btn ${filterType === "unlocked" ? "active" : ""}`}
                    onClick={() => setFilterType("unlocked")}
                    style={{
                      color: filterType === "unlocked" ? "var(--accent-green)" : undefined,
                      borderColor: filterType === "unlocked" ? "var(--accent-green)" : undefined,
                    }}
                  >
                    Desbloqueadas ({raProgress.unlocked_achievements})
                  </button>
                  <button
                    type="button"
                    className={`details-filter-btn ${filterType === "locked" ? "active" : ""}`}
                    onClick={() => setFilterType("locked")}
                  >
                    Bloqueadas ({raProgress.total_achievements - raProgress.unlocked_achievements})
                  </button>
                </div>

                {/* SEARCH INPUT & SORT */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, justifyContent: "flex-end", minWidth: "240px" }}>
                  <div style={{ position: "relative", flex: 1, maxWidth: "260px" }}>
                    <Search
                      size={14}
                      color="var(--text-muted)"
                      style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Buscar conquista..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ paddingLeft: "32px", fontSize: "0.8rem", height: "34px" }}
                    />
                  </div>

                  <select
                    className="form-input"
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    style={{ width: "150px", fontSize: "0.8rem", height: "34px", cursor: "pointer" }}
                  >
                    <option value="default">Ordem Padrão</option>
                    <option value="points_desc">Mais Pontos</option>
                    <option value="points_asc">Menos Pontos</option>
                    <option value="unlocked_first">Desbloqueadas 1º</option>
                  </select>
                </div>
              </div>

              {/* ACHIEVEMENTS LIST */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  maxHeight: "380px",
                  overflowY: "auto",
                  paddingRight: "6px",
                }}
              >
                {filteredAchievements.length > 0 ? (
                  filteredAchievements.map((ach) => (
                    <div
                      key={ach.id}
                      className="achievement-card"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "12px 18px",
                        background: ach.is_unlocked ? "rgba(255, 153, 0, 0.08)" : "var(--bg-surface)",
                        border: ach.is_unlocked
                          ? "1px solid rgba(255, 153, 0, 0.35)"
                          : "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        transition: "all 0.2s ease",
                        opacity: ach.is_unlocked ? 1 : 0.7,
                      }}
                    >
                      {/* BADGE IMAGE */}
                      <div style={{ position: "relative", width: "48px", height: "48px", flexShrink: 0 }}>
                        <img
                          src={ach.badge_url}
                          alt={ach.title}
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            filter: ach.is_unlocked ? "none" : "grayscale(90%) contrast(80%)",
                            border: ach.is_unlocked ? "2px solid #FF9900" : "1px solid rgba(255, 255, 255, 0.15)",
                            boxShadow: ach.is_unlocked ? "0 0 10px rgba(255, 153, 0, 0.3)" : "none",
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://media.retroachievements.org/Badge/00000.png";
                          }}
                        />
                        {!ach.is_unlocked && (
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(0, 0, 0, 0.45)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "8px",
                            }}
                          >
                            <Lock size={16} color="rgba(255, 255, 255, 0.6)" />
                          </div>
                        )}
                      </div>

                      {/* TEXT CONTENT */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <h4
                            style={{
                              fontSize: "0.95rem",
                              fontWeight: 700,
                              color: ach.is_unlocked ? "#fff" : "var(--text-secondary)",
                              margin: 0,
                            }}
                          >
                            {ach.title}
                          </h4>
                          {ach.is_unlocked && <CheckCircle2 size={15} color="var(--accent-green)" />}
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "3px 0 0 0" }}>
                          {ach.description}
                        </p>
                        {ach.date_unlocked && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--accent-green)",
                              marginTop: "4px",
                              display: "inline-block",
                            }}
                          >
                            Desbloqueada em {new Date(ach.date_unlocked).toLocaleString("pt-BR")}
                          </span>
                        )}
                      </div>

                      {/* POINTS BADGE */}
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: 800,
                            color: ach.is_unlocked ? "#FFB84D" : "var(--text-muted)",
                            background: ach.is_unlocked ? "rgba(255, 153, 0, 0.15)" : "rgba(255, 255, 255, 0.05)",
                            padding: "4px 10px",
                            borderRadius: "6px",
                            border: ach.is_unlocked ? "1px solid rgba(255, 153, 0, 0.3)" : "none",
                            display: "inline-block",
                          }}
                        >
                          {ach.points} pts
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "36px 16px",
                      color: "var(--text-muted)",
                      background: "rgba(255, 255, 255, 0.02)",
                      borderRadius: "var(--radius-md)",
                      border: "1px dashed var(--border-subtle)",
                    }}
                  >
                    <Trophy size={32} color="var(--text-muted)" style={{ margin: "0 auto 8px auto" }} />
                    <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600 }}>
                      Nenhuma conquista encontrada com os filtros selecionados.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
              <Trophy size={40} color="var(--text-muted)" />
              <p style={{ marginTop: "12px", fontSize: "0.9rem" }}>
                Nenhuma conquista encontrada para este jogo ou console.
              </p>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Play,
  Square,
  Star,
  Pencil,
  FolderOpen,
  Trash2,
  Clock,
  Calendar,
  Sparkles,
  Trophy,
  Save,
  BookOpen,
} from "lucide-react";
import { Game, GameDetails, RaGameProgress, SaveBackup, PlayStatusType, Platform } from "../types";
import { api, formatPlaytime, formatImageUrl } from "../services/api";
import { ConsoleIcon } from "../components/ConsoleIcon";
import { AutoScraperModal } from "../components/AutoScraperModal";
import { EditGameModal } from "../components/EditGameModal";

interface GamePageProps {
  game: Game;
  platforms?: Platform[];
  onBack: () => void;
  onLaunch: (game: Game) => void;
  onStop: (game: Game) => void;
  onGameDeleted: () => void;
  onToggleFavorite?: (game: Game) => void;
  onGameUpdated?: () => void;
  steamGridDbKey?: string;
  igdbApiKey?: string;
  igdbClientId?: string;
  igdbClientSecret?: string;
  raUsername?: string;
  raApiKey?: string;
}

export const GamePage: React.FC<GamePageProps> = ({
  game,
  platforms = [],
  onBack,
  onLaunch,
  onStop,
  onGameDeleted,
  onToggleFavorite,
  onGameUpdated,
  steamGridDbKey,
  igdbApiKey,
  igdbClientId,
  igdbClientSecret,
  raUsername,
  raApiKey,
}) => {
  const [details, setDetails] = useState<GameDetails | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isScraperOpen, setIsScraperOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Tabs: overview | achievements | saves | mods
  const [activeTab, setActiveTab] = useState<"overview" | "achievements" | "saves" | "mods">("overview");

  // RetroAchievements
  const [raProgress, setRaProgress] = useState<RaGameProgress | null>(null);
  const [raLoading, setRaLoading] = useState(false);

  // Saves
  const [backups, setBackups] = useState<SaveBackup[]>([]);

  useEffect(() => {
    if (game) {
      loadDetails(game.id);
      if (game.is_emulator) {
        loadRaProgress(game);
      } else {
        setRaProgress(null);
      }
      loadBackups(game.id);
      setConfirmDelete(false);
      setActiveTab("overview");
    }
  }, [game.id]);

  const loadDetails = async (gameId: string) => {
    try {
      const data = await api.getGameDetails(gameId);
      setDetails(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadBackups = async (gameId: string) => {
    try {
      const bks = await api.listSaveBackups(gameId);
      setBackups(bks);
    } catch (err) {
      console.warn("Failed to load backups:", err);
    }
  };

  const loadRaProgress = async (targetGame: Game) => {
    setRaLoading(true);
    try {
      const progress = await api.getRaGameProgress({
        title: targetGame.title,
        platform_id: targetGame.original_platform_id,
        username: raUsername,
        api_key: raApiKey,
      });
      setRaProgress(progress);
    } catch (err) {
      console.warn("Failed to load RetroAchievements progress:", err);
    } finally {
      setRaLoading(false);
    }
  };

  const currentGame = details?.game || game;
  const sessions = details?.sessions || [];
  const platformColor = currentGame.platform_brand_color || "var(--color-accent)";

  const handleDelete = async () => {
    try {
      await api.deleteGame(currentGame.id);
      onGameDeleted();
      onBack();
    } catch (err: any) {
      alert("Erro ao remover jogo: " + err.toString());
    }
  };

  const handleOpenFolder = () => {
    const folder = currentGame.working_dir || currentGame.executable_path;
    api.openFolder(folder);
  };

  const handleToggleFav = async () => {
    try {
      await api.toggleFavorite(currentGame.id);
      await loadDetails(currentGame.id);
      if (onToggleFavorite) onToggleFavorite(currentGame);
      if (onGameUpdated) onGameUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus: PlayStatusType) => {
    try {
      await api.updatePlayStatus(currentGame.id, newStatus);
      await loadDetails(currentGame.id);
      if (onGameUpdated) onGameUpdated();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto" }} className="thin-scrollbar">
      {/* STEAM-STYLE HERO HEADER */}
      <div style={{ position: "relative", minHeight: "320px", width: "100%", background: "#0c1018", overflow: "hidden" }}>
        {/* Background Banner Artwork */}
        {currentGame.banner_url || currentGame.cover_url ? (
          <img
            src={formatImageUrl(currentGame.banner_url || currentGame.cover_url)}
            alt={currentGame.title}
            referrerPolicy="no-referrer"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "brightness(0.35) blur(1px)",
              transform: "scale(1.02)",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(135deg, #101c2e 0%, #080a0f 100%)",
            }}
          />
        )}

        {/* Gradient Overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(0deg, var(--color-bg) 0%, rgba(8, 10, 15, 0.7) 60%, rgba(8, 10, 15, 0.3) 100%)",
          }}
        />

        {/* Top Back Navigation Bar */}
        <div style={{ position: "relative", zIndex: 10, padding: "var(--space-4) var(--space-6)" }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={onBack}
            style={{ background: "rgba(0, 0, 0, 0.5)", backdropFilter: "blur(8px)" }}
          >
            <ArrowLeft size={16} />
            <span>Voltar à Biblioteca</span>
          </button>
        </div>

        {/* Hero Title & Primary Action Strip */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            padding: "var(--space-4) var(--space-6) var(--space-6)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          {/* Metadata Chips Row */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <div
              className="badge"
              style={{
                background: "rgba(10, 14, 22, 0.8)",
                borderColor: platformColor,
                color: platformColor,
                padding: "4px 10px",
                fontSize: "0.75rem",
              }}
            >
              <ConsoleIcon
                platformId={currentGame.original_platform_id}
                name={currentGame.platform_name}
                size={14}
                color={platformColor}
              />
              <span>{currentGame.platform_name || currentGame.original_platform_id.toUpperCase()}</span>
              <span style={{ opacity: 0.6 }}>•</span>
              <span>{currentGame.is_emulator ? "EMULADO" : "PORT PC"}</span>
            </div>

            {/* Play Status Selector */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(0, 0, 0, 0.6)",
                border: "1px solid var(--color-border)",
                padding: "3px 10px",
                borderRadius: "var(--radius-pill)",
                fontSize: "0.75rem",
              }}
            >
              <span style={{ color: "var(--color-text-muted)" }}>Status:</span>
              <select
                value={currentGame.play_status || "backlog"}
                onChange={(e) => handleStatusChange(e.target.value as PlayStatusType)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontWeight: 700,
                  color:
                    currentGame.play_status === "playing"
                      ? "var(--color-success)"
                      : currentGame.play_status === "completed"
                      ? "var(--color-warning)"
                      : currentGame.play_status === "paused"
                      ? "var(--color-purple)"
                      : "var(--color-text-secondary)",
                }}
              >
                <option value="playing" style={{ background: "#0c1018" }}>🟢 Jogando</option>
                <option value="completed" style={{ background: "#0c1018" }}>🏆 Zerado</option>
                <option value="backlog" style={{ background: "#0c1018" }}>⏳ Backlog</option>
                <option value="paused" style={{ background: "#0c1018" }}>⏸️ Pausado</option>
              </select>
            </div>
          </div>

          {/* Large Title */}
          <h1
            style={{
              fontSize: "2.4rem",
              fontWeight: 800,
              letterSpacing: "-0.5px",
              color: "#ffffff",
              textShadow: "0 2px 12px rgba(0,0,0,0.8)",
            }}
          >
            {currentGame.title}
          </h1>

          {/* STEAM ACTION BAR: BIG PLAY BUTTON + QUICK STATS + UTILITIES */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-4)",
              flexWrap: "wrap",
              background: "rgba(10, 14, 22, 0.75)",
              border: "1px solid var(--color-border-strong)",
              backdropFilter: "blur(12px)",
              padding: "var(--space-3) var(--space-4)",
              borderRadius: "var(--radius-lg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-5)" }}>
              {/* Play / Stop Button */}
              {currentGame.is_running ? (
                <button
                  type="button"
                  className="btn-stop-hero"
                  onClick={() => onStop(currentGame)}
                >
                  <Square size={20} fill="currentColor" />
                  <span>ENCERRAR</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-play-hero"
                  onClick={() => onLaunch(currentGame)}
                >
                  <Play size={22} fill="currentColor" />
                  <span>JOGAR</span>
                </button>
              )}

              {/* KPI Playtime */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Tempo Jogado
                </span>
                <span style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-text)" }}>
                  {formatPlaytime(currentGame.total_playtime_seconds)}
                </span>
              </div>

              {/* KPI Last Played */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                  Última Sessão
                </span>
                <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
                  {currentGame.last_played_at
                    ? new Date(currentGame.last_played_at).toLocaleDateString("pt-BR")
                    : "Nunca jogado"}
                </span>
              </div>

              {/* RetroAchievements KPI (if available) */}
              {Boolean(currentGame.is_emulator) && raProgress && (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    Conquistas RA
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#FFB84D" }}>
                      {raProgress.unlocked_achievements}/{raProgress.total_achievements}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                      ({raProgress.completion_percentage.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions (Favorite, Edit, Folder) */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
              <button
                type="button"
                className={`btn btn-sm btn-secondary ${currentGame.is_favorite ? "active" : ""}`}
                onClick={handleToggleFav}
                title={currentGame.is_favorite ? "Remover dos Favoritos" : "Marcar como Favorito"}
              >
                <Star size={15} fill={currentGame.is_favorite ? "currentColor" : "none"} />
                <span>{currentGame.is_favorite ? "Favorito" : "Favoritar"}</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setIsEditModalOpen(true)}
                title="Editar informações do jogo"
              >
                <Pencil size={15} />
                <span>Editar</span>
              </button>

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={handleOpenFolder}
                title="Abrir pasta do executável"
              >
                <FolderOpen size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SUB-TABS NAVIGATION (Overview, RetroAchievements, Saves, Mods) */}
      <div
        style={{
          display: "flex",
          gap: "var(--space-2)",
          padding: "var(--space-3) var(--space-6)",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-bg-elevated)",
        }}
      >
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "overview" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("overview")}
        >
          <span>Visão Geral & Histórico</span>
        </button>

        {Boolean(currentGame.is_emulator) && (
          <button
            type="button"
            className={`btn btn-sm ${activeTab === "achievements" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActiveTab("achievements")}
            style={{ color: activeTab === "achievements" ? undefined : "#FFB84D" }}
          >
            <Trophy size={14} />
            <span>RetroAchievements</span>
          </button>
        )}

        <button
          type="button"
          className={`btn btn-sm ${activeTab === "saves" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("saves")}
        >
          <Save size={14} />
          <span>Saves ({backups.length})</span>
        </button>

        <button
          type="button"
          className={`btn btn-sm ${activeTab === "mods" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setActiveTab("mods")}
        >
          <BookOpen size={14} />
          <span>Mods & Manuais</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      <div style={{ padding: "var(--space-6)", flex: 1 }}>
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-6)" }}>
            {/* Left: Sessions Timeline */}
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "var(--space-3)" }}>
                Histórico de Execuções ({sessions.length})
              </h3>
              {sessions.length === 0 ? (
                <div
                  style={{
                    padding: "var(--space-6)",
                    background: "var(--color-surface-1)",
                    border: "1px dashed var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <Clock size={32} style={{ opacity: 0.5, marginBottom: "8px" }} />
                  <p>Nenhuma sessão registrada ainda. Jogue para registrar seu tempo!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                  {sessions.slice(0, 10).map((sess) => (
                    <div
                      key={sess.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "var(--space-3)",
                        background: "var(--color-surface-1)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-md)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        <Calendar size={15} color="var(--color-accent)" />
                        <span style={{ fontSize: "0.85rem" }}>
                          {sess.started_at ? new Date(sess.started_at).toLocaleString("pt-BR") : "Data desconhecida"}
                        </span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--color-accent)" }}>
                        {formatPlaytime(sess.duration_seconds)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Technical Metadata Card */}
            <div
              style={{
                background: "var(--color-surface-1)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "var(--space-5)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-4)",
                height: "fit-content",
              }}
            >
              <h4 style={{ fontSize: "0.9rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Detalhes Técnicos
              </h4>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Plataforma</span>
                <p style={{ fontWeight: 700, color: platformColor }}>
                  {currentGame.platform_name || currentGame.original_platform_id}
                </p>
              </div>

              <div>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {currentGame.is_emulator ? "Emulador" : "Executável"}
                </span>
                <p style={{ fontSize: "0.8rem", wordBreak: "break-all", fontFamily: "var(--font-mono)" }}>
                  {currentGame.is_emulator ? currentGame.emulator_path : currentGame.executable_path}
                </p>
              </div>

              {currentGame.rom_path && (
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>ROM / Imagem</span>
                  <p style={{ fontSize: "0.8rem", wordBreak: "break-all", fontFamily: "var(--font-mono)" }}>
                    {currentGame.rom_path}
                  </p>
                </div>
              )}

              {currentGame.notes && (
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Notas</span>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    {currentGame.notes}
                  </p>
                </div>
              )}

              <hr style={{ borderColor: "var(--color-border)", margin: "4px 0" }} />

              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={() => setIsScraperOpen(true)}
              >
                <Sparkles size={15} color="var(--color-accent)" />
                <span>Buscar Capas & Banners</span>
              </button>

              {confirmDelete ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-secondary"
                    onClick={() => setConfirmDelete(false)}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={handleDelete}
                    style={{ flex: 1, background: "var(--color-danger)", color: "#fff" }}
                  >
                    Confirmar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setConfirmDelete(true)}
                  style={{ color: "var(--color-danger)" }}
                >
                  <Trash2 size={15} />
                  <span>Remover Jogo</span>
                </button>
              )}
            </div>
          </div>
        )}

        {activeTab === "achievements" && (
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "var(--space-3)" }}>
              RetroAchievements
            </h3>
            {raLoading ? (
              <p>Carregando conquistas...</p>
            ) : raProgress ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-3)" }}>
                {raProgress.achievements.map((ach) => (
                  <div
                    key={ach.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-3)",
                      padding: "var(--space-3)",
                      background: ach.is_unlocked ? "rgba(0, 230, 118, 0.08)" : "var(--color-surface-1)",
                      border: `1px solid ${ach.is_unlocked ? "rgba(0, 230, 118, 0.3)" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    {ach.badge_url && (
                      <img
                        src={ach.badge_url}
                        alt=""
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "var(--radius-sm)",
                          filter: ach.is_unlocked ? "none" : "grayscale(100%) opacity(0.5)",
                        }}
                      />
                    )}
                    <div>
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 700 }}>{ach.title}</h4>
                      <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{ach.description}</p>
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#FFB84D" }}>{ach.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--color-text-muted)" }}>Nenhum dado do RetroAchievements associado a este título.</p>
            )}
          </div>
        )}

        {activeTab === "saves" && (
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "var(--space-3)" }}>
              Gerenciador de Saves & Snapshots ({backups.length})
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem", marginBottom: "var(--space-4)" }}>
              Crie backups dos seus pontos de salvamento para restaurar quando quiser.
            </p>
            {backups.length === 0 ? (
              <p style={{ color: "var(--color-text-muted)" }}>Nenhum backup criado ainda.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {backups.map((bk) => (
                  <div
                    key={bk.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "var(--space-3)",
                      background: "var(--color-surface-1)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 600, fontSize: "0.85rem" }}>{bk.note || "Snapshot de Save"}</p>
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {new Date(bk.created_at).toLocaleString("pt-BR")} • {(bk.size_bytes / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => api.restoreSaveBackup(bk.id)}
                    >
                      Restaurar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "mods" && (
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "var(--space-3)" }}>
              Mods & Manuais
            </h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              Consulte manuais e guias para este título ou abra a pasta de patches.
            </p>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AutoScraperModal
        isOpen={isScraperOpen}
        onClose={() => setIsScraperOpen(false)}
        initialQuery={currentGame.title}
        steamGridDbKey={steamGridDbKey}
        igdbApiKey={igdbApiKey}
        igdbClientId={igdbClientId}
        igdbClientSecret={igdbClientSecret}
        onSelectAssets={async (cUrl, bUrl) => {
          await api.updateGame({
            id: currentGame.id,
            title: currentGame.title,
            original_platform_id: currentGame.original_platform_id,
            executable_path: currentGame.executable_path,
            working_dir: currentGame.working_dir,
            launch_arguments: currentGame.launch_arguments,
            cover_url: cUrl || currentGame.cover_url,
            banner_url: bUrl || currentGame.banner_url,
            notes: currentGame.notes,
            is_emulator: currentGame.is_emulator,
            emulator_path: currentGame.emulator_path,
            rom_path: currentGame.rom_path,
            is_favorite: currentGame.is_favorite,
            play_status: currentGame.play_status,
            save_path: currentGame.save_path,
          });
          await loadDetails(currentGame.id);
          if (onGameUpdated) onGameUpdated();
        }}
      />

      <EditGameModal
        game={currentGame}
        platforms={platforms}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onGameUpdated={async () => {
          await loadDetails(currentGame.id);
          if (onGameUpdated) onGameUpdated();
        }}
        steamGridDbKey={steamGridDbKey}
        igdbApiKey={igdbApiKey}
        igdbClientId={igdbClientId}
        igdbClientSecret={igdbClientSecret}
      />
    </div>
  );
};

import React, { useEffect, useState } from "react";
import {
  X,
  Play,
  Square,
  FolderOpen,
  Trash2,
  Clock,
  Calendar,
  Sparkles,
  Gamepad,
  Cpu,
  Trophy,
  CheckCircle2,
  Lock,
  ExternalLink,
  ShieldCheck,
  Star,
  Save,
  HardDrive,
  RotateCcw,
  BookOpen,
  FolderPlus,
  Check,
  Search,
  RotateCw,
  Palette,
  Image as ImageIcon,
  History,
  Timer,
  Flame,
} from "lucide-react";
import { Game, GameDetails, RaGameProgress, SaveBackup, PlayStatusType } from "../types";
import { api, formatPlaytime, formatImageUrl } from "../services/api";
import { ConsoleIcon } from "./ConsoleIcon";
import { AutoScraperModal } from "./AutoScraperModal";

interface GameDetailsModalProps {
  game: Game | null;
  isOpen: boolean;
  onClose: () => void;
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

export const GameDetailsModal: React.FC<GameDetailsModalProps> = ({
  game,
  isOpen,
  onClose,
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

  // Manual Art Customization State
  const [isManualArtOpen, setIsManualArtOpen] = useState(false);
  const [manualCover, setManualCover] = useState("");
  const [manualBanner, setManualBanner] = useState("");
  const [isSavingArt, setIsSavingArt] = useState(false);

  // Tabs State: overview | achievements | saves | mods
  const [activeTab, setActiveTab] = useState<"overview" | "achievements" | "saves" | "mods">("overview");

  // RetroAchievements Tab State
  const [achFilter, setAchFilter] = useState<"all" | "unlocked" | "locked">("all");
  const [achSearch, setAchSearch] = useState("");
  const [manualRaId, setManualRaId] = useState("");
  const [raProgress, setRaProgress] = useState<RaGameProgress | null>(null);
  const [raLoading, setRaLoading] = useState(false);

  // Saves & Snapshots State
  const [backups, setBackups] = useState<SaveBackup[]>([]);
  const [backupNote, setBackupNote] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [savePathInput, setSavePathInput] = useState("");

  useEffect(() => {
    if (game && isOpen) {
      loadDetails(game.id);
      loadRaProgress(game);
      loadBackups(game.id);
      setSavePathInput(game.save_path || "");
      setConfirmDelete(false);
      setActiveTab("overview");
      setAchFilter("all");
    }
  }, [game, isOpen]);

  const loadDetails = async (gameId: string) => {
    try {
      const data = await api.getGameDetails(gameId);
      setDetails(data);
      if (data?.game?.save_path) {
        setSavePathInput(data.game.save_path);
      }
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

  const loadRaProgress = async (targetGame: Game, customId?: number) => {
    setRaLoading(true);
    try {
      const progress = await api.getRaGameProgress({
        title: targetGame.title,
        platform_id: targetGame.original_platform_id,
        username: raUsername,
        api_key: raApiKey,
        explicit_game_id: customId,
      });
      setRaProgress(progress);
      if (progress?.game_id) {
        setManualRaId(progress.game_id.toString());
      }
    } catch (err) {
      console.warn("Failed to load RetroAchievements progress:", err);
    } finally {
      setRaLoading(false);
    }
  };

  if (!isOpen || !game) return null;

  const currentGame = details?.game || game;
  const sessions = details?.sessions || [];
  const platformColor = currentGame.platform_brand_color || "#00E5FF";

  const maxSessionSeconds = sessions.length > 0
    ? Math.max(...sessions.map((s) => s.duration_seconds || 0), 60)
    : 60;

  const totalSessionsDuration = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);

  const formatSessionDate = (isoString?: string) => {
    if (!isoString) return { relative: "Data desconhecida", time: "", fullDate: "—" };
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return { relative: isoString, time: "", fullDate: isoString };

      const today = new Date();
      const isToday =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday =
        d.getDate() === yesterday.getDate() &&
        d.getMonth() === yesterday.getMonth() &&
        d.getFullYear() === yesterday.getFullYear();

      const timeStr = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      const dateStr = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

      if (isToday) return { relative: "Hoje", time: timeStr, fullDate: dateStr };
      if (isYesterday) return { relative: "Ontem", time: timeStr, fullDate: dateStr };

      return { relative: dateStr, time: timeStr, fullDate: dateStr };
    } catch {
      return { relative: isoString, time: "", fullDate: isoString };
    }
  };

  const formatSessionTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatDateSafe = (isoString?: string | null, fallback = "Nunca jogado") => {
    if (!isoString) return fallback;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return fallback;
      return d.toLocaleDateString("pt-BR");
    } catch {
      return fallback;
    }
  };

  const formatDateTimeSafe = (isoString?: string | null, fallback = "") => {
    if (!isoString) return fallback;
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return fallback;
      return d.toLocaleString("pt-BR");
    } catch {
      return fallback;
    }
  };

  const formatSessionDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return "< 1 minuto";
    if (seconds < 60) return `${seconds}s jogados`;
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, "0")}m jogadas`;
    }
    return `${mins}m jogados`;
  };

  const handleDelete = async () => {
    try {
      await api.deleteGame(currentGame.id);
      onGameDeleted();
      onClose();
    } catch (err: any) {
      alert("Erro ao remover jogo: " + err.toString());
    }
  };

  const handleOpenFolder = () => {
    const folder = currentGame.working_dir || currentGame.executable_path;
    api.openFolder(folder);
  };

  const handleToggleFavorite = async () => {
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

  const handlePickSavePath = async () => {
    try {
      const selected = await api.pickSavePath();
      if (selected) {
        setSavePathInput(selected);
        await api.updateSavePath(currentGame.id, selected);
        await loadDetails(currentGame.id);
        if (onGameUpdated) onGameUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSavePath = async () => {
    try {
      await api.updateSavePath(currentGame.id, savePathInput.trim() || undefined);
      await loadDetails(currentGame.id);
      if (onGameUpdated) onGameUpdated();
      alert("Caminho de saves atualizado com sucesso!");
    } catch (err: any) {
      alert("Erro ao salvar caminho: " + err.toString());
    }
  };

  const handleCreateBackup = async () => {
    if (!currentGame.save_path && !savePathInput.trim()) {
      alert("Configure primeiro o arquivo ou pasta de saves do jogo antes de criar um backup.");
      return;
    }
    setSaveLoading(true);
    try {
      const note = backupNote.trim() || undefined;
      await api.createSaveBackup(currentGame.id, note);
      setBackupNote("");
      await loadBackups(currentGame.id);
    } catch (err: any) {
      alert("Erro ao criar snapshot de save: " + err.toString());
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm("Restaurar este checkpoint sobrescreverá o arquivo de save atual. Deseja continuar?")) return;
    setSaveLoading(true);
    try {
      await api.restoreSaveBackup(backupId);
      alert("Checkpoint de save restaurado com sucesso!");
    } catch (err: any) {
      alert("Erro ao restaurar checkpoint: " + err.toString());
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este backup?")) return;
    try {
      await api.deleteSaveBackup(backupId);
      await loadBackups(currentGame.id);
    } catch (err: any) {
      alert("Erro ao excluir backup: " + err.toString());
    }
  };

  const handleOpenSaveFolder = () => {
    const p = currentGame.save_path || savePathInput;
    if (p) {
      api.openFolder(p);
    } else {
      alert("Nenhum caminho de save configurado.");
    }
  };

  const handlePickManual = async () => {
    try {
      const selected = await api.pickManualFile();
      if (selected) {
        api.openFolder(selected);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateArt = async (cUrl?: string, bUrl?: string, allowEmpty = false) => {
    try {
      await api.updateGame({
        id: currentGame.id,
        title: currentGame.title,
        original_platform_id: currentGame.original_platform_id,
        executable_path: currentGame.executable_path,
        working_dir: currentGame.working_dir,
        launch_arguments: currentGame.launch_arguments,
        cover_url: allowEmpty ? cUrl : (cUrl || currentGame.cover_url),
        banner_url: allowEmpty ? bUrl : (bUrl || currentGame.banner_url),
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
    } catch (err: any) {
      alert("Erro ao atualizar artes: " + err.toString());
    }
  };

  const handleOpenManualArt = () => {
    setManualCover(currentGame.cover_url || "");
    setManualBanner(currentGame.banner_url || "");
    setIsManualArtOpen(true);
  };

  const handlePickCoverFile = async () => {
    try {
      const path = await api.pickImageFile();
      if (path) {
        setManualCover(path);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePickBannerFile = async () => {
    try {
      const path = await api.pickImageFile();
      if (path) {
        setManualBanner(path);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveManualArt = async () => {
    setIsSavingArt(true);
    try {
      await handleUpdateArt(manualCover.trim() || undefined, manualBanner.trim() || undefined, true);
      setIsManualArtOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingArt(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-content details-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HERO BANNER */}
          <div className="hero-banner">
            {currentGame.banner_url || currentGame.cover_url ? (
              <img
                src={formatImageUrl(currentGame.banner_url || currentGame.cover_url)}
                alt={currentGame.title}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #18263e 0%, #0c121e 100%)",
                }}
              />
            )}

            <div className="hero-overlay">
              <button
                className="btn-close"
                onClick={onClose}
                style={{ position: "absolute", top: 18, right: 18 }}
              >
                <X size={22} />
              </button>

              <div className="hero-header-row">
                <div className="hero-title-area">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <div
                      className="origin-platform-badge"
                      style={{
                        backgroundColor: "rgba(10, 14, 22, 0.9)",
                        borderColor: platformColor,
                        color: platformColor,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <ConsoleIcon
                        platformId={currentGame.original_platform_id}
                        name={currentGame.platform_name}
                        size={16}
                        color={platformColor}
                      />
                      <span>{currentGame.platform_name || currentGame.original_platform_id.toUpperCase()}</span>
                      <span className="recomp-arrow">→</span>
                      <span className="recomp-target">
                        {currentGame.is_emulator ? "EMULADO" : "PC RECOMP"}
                      </span>
                    </div>

                    {/* FAVORITE STAR BUTTON */}
                    <button
                      className={`details-fav-btn ${currentGame.is_favorite ? "active" : ""}`}
                      onClick={handleToggleFavorite}
                      title={currentGame.is_favorite ? "Remover dos Favoritos" : "Marcar como Favorito"}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: currentGame.is_favorite ? "rgba(255, 184, 0, 0.2)" : "rgba(255, 255, 255, 0.1)",
                        border: `1px solid ${currentGame.is_favorite ? "#FFB800" : "rgba(255, 255, 255, 0.2)"}`,
                        color: currentGame.is_favorite ? "#FFD54F" : "#fff",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Star size={14} fill={currentGame.is_favorite ? "#FFB800" : "none"} stroke="currentColor" />
                      <span>{currentGame.is_favorite ? "Favorito" : "Favoritar"}</span>
                    </button>

                    {/* PLAY STATUS SELECTOR */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(10, 14, 22, 0.8)",
                        padding: "4px 10px",
                        borderRadius: "20px",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                      }}
                    >
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Status:</span>
                      <select
                        value={currentGame.play_status || "backlog"}
                        onChange={(e) => handleStatusChange(e.target.value as PlayStatusType)}
                        style={{
                          background: "transparent",
                          color:
                            currentGame.play_status === "playing"
                              ? "#00E676"
                              : currentGame.play_status === "completed"
                              ? "#FFB800"
                              : currentGame.play_status === "paused"
                              ? "#C4B5FD"
                              : "#94A3B8",
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          border: "none",
                          outline: "none",
                          cursor: "pointer",
                        }}
                      >
                        <option value="playing" style={{ background: "#0F172A", color: "#00E676" }}>🟢 Jogando</option>
                        <option value="completed" style={{ background: "#0F172A", color: "#FFB800" }}>🏆 Zerado / Concluído</option>
                        <option value="backlog" style={{ background: "#0F172A", color: "#94A3B8" }}>⏳ Pendente (Backlog)</option>
                        <option value="paused" style={{ background: "#0F172A", color: "#C4B5FD" }}>⏸️ Pausado</option>
                      </select>
                    </div>

                    {/* EDIT ART QUICK BUTTON */}
                    <button
                      className="details-fav-btn"
                      onClick={handleOpenManualArt}
                      title="Personalizar Capa e Banner manualmente"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "rgba(168, 85, 247, 0.15)",
                        border: "1px solid rgba(168, 85, 247, 0.35)",
                        color: "#D8B4FE",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <Palette size={14} />
                      <span>Editar Artes</span>
                    </button>
                  </div>

                  <h1 className="hero-title">{currentGame.title}</h1>
                </div>

                <div className="hero-actions">
                  {currentGame.is_running ? (
                    <button
                      className="btn-stop-big"
                      onClick={() => onStop(currentGame)}
                    >
                      <Square size={20} fill="currentColor" />
                      <span>ENCERRAR JOGO</span>
                    </button>
                  ) : (
                    <button
                      className="btn-launch-big"
                      onClick={() => onLaunch(currentGame)}
                    >
                      <Play size={20} fill="currentColor" />
                      <span>JOGAR</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SUB-TABS: OVERVIEW | RETROACHIEVEMENTS | SAVES | MODS */}
          <div className="details-subtabs">
            <button
              className={`details-subtab-btn ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <span>Visão Geral & Histórico</span>
            </button>

            <button
              className={`details-subtab-btn ${activeTab === "achievements" ? "active" : ""}`}
              onClick={() => setActiveTab("achievements")}
              style={{
                color: activeTab === "achievements" ? "#FFB84D" : undefined,
                borderColor: activeTab === "achievements" ? "#FF9900" : undefined,
              }}
            >
              <Trophy size={15} color="#FF9900" />
              <span>RetroAchievements</span>
              {raProgress && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    background: "rgba(255, 153, 0, 0.2)",
                    color: "#FFB84D",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: 800,
                  }}
                >
                  {raProgress.unlocked_achievements}/{raProgress.total_achievements}
                </span>
              )}
            </button>

            <button
              className={`details-subtab-btn ${activeTab === "saves" ? "active" : ""}`}
              onClick={() => setActiveTab("saves")}
              style={{
                color: activeTab === "saves" ? "var(--accent-cyan)" : undefined,
                borderColor: activeTab === "saves" ? "var(--accent-cyan)" : undefined,
              }}
            >
              <Save size={15} color="var(--accent-cyan)" />
              <span>Saves & Snapshots</span>
              {backups.length > 0 && (
                <span
                  style={{
                    fontSize: "0.7rem",
                    background: "rgba(0, 229, 255, 0.2)",
                    color: "var(--accent-cyan)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: 800,
                  }}
                >
                  {backups.length}
                </span>
              )}
            </button>

            <button
              className={`details-subtab-btn ${activeTab === "mods" ? "active" : ""}`}
              onClick={() => setActiveTab("mods")}
              style={{
                color: activeTab === "mods" ? "#A78BFA" : undefined,
                borderColor: activeTab === "mods" ? "#A78BFA" : undefined,
              }}
            >
              <BookOpen size={15} color="#A78BFA" />
              <span>Mods & Manuais</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & SESSIONS */}
          {activeTab === "overview" && (
            <div className="details-content-grid">
            {/* LEFT COLUMN: STATS & SESSIONS HISTORY */}
            <div>
              <div className="stats-card-group">
                <div className="stat-box">
                  <span className="stat-box-label">Tempo Total Jogado</span>
                  <span className="stat-box-val">
                    {formatPlaytime(currentGame.total_playtime_seconds)}
                  </span>
                </div>
                <div className="stat-box">
                  <span className="stat-box-label">Última Execução</span>
                  <span className="stat-box-val" style={{ fontSize: "1rem" }}>
                    {formatDateSafe(currentGame.last_played_at)}
                  </span>
                </div>
              </div>

              {/* SESSIONS TIMELINE (LINHA DO TEMPO DE EXECUÇÕES) */}
              <div className="sessions-timeline-container">
                <div className="sessions-timeline-header">
                  <div className="sessions-timeline-title">
                    <div className="timeline-title-icon-box">
                      <History size={17} />
                    </div>
                    <div>
                      <h3 className="timeline-title-text">
                        Linha do Tempo de Execuções
                      </h3>
                      <span className="timeline-title-sub">
                        {sessions.length} {sessions.length === 1 ? "sessão registrada" : "sessões registradas"}
                      </span>
                    </div>
                  </div>

                  {sessions.length > 0 && (
                    <div className="timeline-stats-pills">
                      <div className="timeline-stat-pill" title="Tempo total acumulado de todas as sessões gravadas">
                        <Clock size={12} color="var(--accent-cyan)" />
                        <span>Total: <strong>{formatPlaytime(totalSessionsDuration)}</strong></span>
                      </div>
                    </div>
                  )}
                </div>

                {sessions.length === 0 ? (
                  <div className="timeline-empty-state">
                    <div className="timeline-empty-icon">
                      <Clock size={28} />
                    </div>
                    <p className="timeline-empty-title">Nenhuma execução registrada ainda</p>
                    <span className="timeline-empty-desc">
                      Inicie uma partida deste jogo para que cada sessão seja gravada na sua linha do tempo com data, horário e duração detalhada!
                    </span>
                  </div>
                ) : (
                  <div className="timeline-track">
                    {sessions.map((sess, idx) => {
                      const isLatest = idx === 0;
                      const dur = sess.duration_seconds || 0;
                      const isLongSession = dur >= 3600; // >= 1 hour
                      const isMediumSession = dur >= 1200; // >= 20 mins
                      const isBriefSession = dur < 60; // < 1 min
                      const dateInfo = formatSessionDate(sess.started_at);
                      const durationFormatted = formatSessionDuration(dur);
                      const progressPercent = Math.min(100, Math.max(12, Math.round((dur / maxSessionSeconds) * 100)));

                      return (
                        <div
                          key={sess.id || idx}
                          className={`timeline-entry ${isLatest ? "is-latest" : ""}`}
                        >
                          {/* Timeline Marker Node on Spine */}
                          <div className="timeline-node-wrapper">
                            <div
                              className={`timeline-node-dot ${
                                isLatest
                                  ? "dot-latest"
                                  : isLongSession
                                  ? "dot-epic"
                                  : isMediumSession
                                  ? "dot-medium"
                                  : "dot-normal"
                              }`}
                            >
                              {isLatest && <span className="pulse-ring" />}
                            </div>
                            {idx < sessions.length - 1 && <div className="timeline-node-line" />}
                          </div>

                          {/* Timeline Content Card */}
                          <div className="timeline-card">
                            <div className="timeline-card-header">
                              <div className="timeline-date-box">
                                <div className="timeline-date-day">
                                  <Calendar size={13} color="var(--accent-cyan)" />
                                  <span>{dateInfo.relative}</span>
                                </div>
                                {dateInfo.time && (
                                  <span className="timeline-date-time">
                                    às {dateInfo.time}
                                  </span>
                                )}
                              </div>

                              <div className="timeline-badge-group">
                                {isLatest && (
                                  <span className="timeline-latest-tag">
                                    <span className="latest-dot" />
                                    Última Sessão
                                  </span>
                                )}
                                <span
                                  className={`timeline-duration-badge ${
                                    isLongSession ? "badge-epic" : isBriefSession ? "badge-brief" : "badge-normal"
                                  }`}
                                >
                                  <Timer size={13} />
                                  <span>{durationFormatted}</span>
                                </span>
                              </div>
                            </div>

                            {/* Progress intensity bar showing length relative to longest session */}
                            {!isBriefSession && (
                              <div className="timeline-intensity-track" title={`Duração de ${durationFormatted}`}>
                                <div
                                  className="timeline-intensity-fill"
                                  style={{
                                    width: `${progressPercent}%`,
                                    background: isLongSession
                                      ? "linear-gradient(90deg, var(--accent-cyan) 0%, #FFB800 100%)"
                                      : "linear-gradient(90deg, rgba(0, 229, 255, 0.4) 0%, var(--accent-cyan) 100%)",
                                  }}
                                />
                              </div>
                            )}

                            {/* Sub-details (Interval and End Time) */}
                            <div className="timeline-card-footer">
                              <span className="timeline-detail-text">
                                Início: {dateInfo.fullDate} {dateInfo.time ? `às ${dateInfo.time}` : ""}
                                {sess.ended_at && formatSessionTime(sess.ended_at) && (
                                  <>
                                    {" • "}Término: {formatSessionTime(sess.ended_at)}
                                  </>
                                )}
                              </span>
                              {isLongSession && (
                                <span className="timeline-highlight-note">
                                  <Flame size={12} color="#FFB800" />
                                  <span>Sessão Épica (1h+)</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: TECHNICAL METADATA & ACTIONS */}
            <div className="side-info-card">
              <div className="info-field">
                <span className="info-field-label">Tipo de Execução</span>
                <span className="info-field-val" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {currentGame.is_emulator ? (
                    <>
                      <Gamepad size={14} color="var(--accent-cyan)" />
                      <span>Jogo Emulado</span>
                    </>
                  ) : (
                    <>
                      <Cpu size={14} color="var(--accent-cyan)" />
                      <span>Recompilação Nativa (PC)</span>
                    </>
                  )}
                </span>
              </div>

              <div className="info-field">
                <span className="info-field-label">Plataforma Original</span>
                <span className="info-field-val" style={{ color: platformColor, fontWeight: 700 }}>
                  {currentGame.platform_name || currentGame.original_platform_id}
                </span>
              </div>

              <div className="info-field">
                <span className="info-field-label">
                  {currentGame.is_emulator ? "Emulador" : "Executável"}
                </span>
                <span className="info-field-val" style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
                  {currentGame.is_emulator && currentGame.emulator_path
                    ? currentGame.emulator_path
                    : currentGame.executable_path}
                </span>
              </div>

              {currentGame.is_emulator && currentGame.rom_path && (
                <div className="info-field">
                  <span className="info-field-label">Arquivo da ROM / ISO</span>
                  <span className="info-field-val" style={{ fontSize: "0.75rem", wordBreak: "break-all" }}>
                    {currentGame.rom_path}
                  </span>
                </div>
              )}

              {currentGame.launch_arguments && (
                <div className="info-field">
                  <span className="info-field-label">Argumentos de Execução</span>
                  <span className="info-field-val" style={{ fontSize: "0.75rem" }}>
                    {currentGame.launch_arguments}
                  </span>
                </div>
              )}

              {currentGame.notes && (
                <div className="info-field">
                  <span className="info-field-label">Notas do Port</span>
                  <span className="info-field-val" style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {currentGame.notes}
                  </span>
                </div>
              )}

              <hr style={{ borderColor: "var(--border-subtle)", margin: "8px 0" }} />

              {/* AUTO SCRAPER ART UPDATE BUTTON */}
              <button
                className="btn-secondary"
                onClick={() => setIsScraperOpen(true)}
                style={{ width: "100%", justifyContent: "center", borderColor: "rgba(0, 229, 255, 0.4)", color: "var(--accent-cyan)" }}
              >
                <Sparkles size={16} />
                <span>Buscar Capas & Banners</span>
              </button>

              {/* MANUAL ART EDIT BUTTON */}
              <button
                className="btn-secondary"
                onClick={handleOpenManualArt}
                style={{ width: "100%", justifyContent: "center", borderColor: "rgba(168, 85, 247, 0.4)", color: "#C084FC" }}
              >
                <Palette size={16} />
                <span>Editar Capa & Banner Manualmente</span>
              </button>

              <button
                className="btn-secondary"
                onClick={handleOpenFolder}
                style={{ width: "100%", justifyContent: "center" }}
              >
                <FolderOpen size={16} />
                <span>Abrir Pasta do Jogo</span>
              </button>

              {confirmDelete ? (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setConfirmDelete(false)}
                    style={{ flex: 1 }}
                  >
                    Cancelar
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: "var(--accent-red)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "var(--radius-md)",
                      fontWeight: 700,
                      cursor: "pointer",
                      padding: "8px",
                    }}
                    onClick={handleDelete}
                  >
                    Confirmar Exclusão
                  </button>
                </div>
              ) : (
                <button
                  className="btn-secondary"
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    color: "var(--accent-red)",
                    borderColor: "rgba(255, 51, 75, 0.2)",
                  }}
                >
                  <Trash2 size={16} />
                  <span>Remover da Biblioteca</span>
                </button>
              )}
            </div>
          </div>
          )}

          {/* TAB 2: RETROACHIEVEMENTS */}
          {activeTab === "achievements" && (
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>
              {raLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  <Trophy size={32} color="#FF9900" style={{ animation: "pulse 1.5s infinite" }} />
                  <p style={{ marginTop: "12px", fontSize: "0.9rem" }}>Sincronizando conquistas do RetroAchievements...</p>
                </div>
              ) : raProgress ? (
                <>
                  {/* PROGRESS SUMMARY CARD */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, rgba(255, 153, 0, 0.12) 0%, rgba(13, 17, 26, 0.7) 100%)",
                      border: "1px solid rgba(255, 153, 0, 0.3)",
                      borderRadius: "var(--radius-lg)",
                      padding: "20px 24px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                      boxShadow: "0 8px 30px rgba(0, 0, 0, 0.35)",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "#fff" }}>
                            {raProgress.game_title}
                          </span>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              background: "rgba(255, 153, 0, 0.2)",
                              color: "#FFB84D",
                              border: "1px solid rgba(255, 153, 0, 0.4)",
                              borderRadius: "4px",
                              padding: "2px 8px",
                              fontWeight: 800,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                          >
                            <ShieldCheck size={12} color="var(--accent-green)" />
                            <span>{raProgress.console_name} • ID {raProgress.game_id}</span>
                          </span>
                        </div>
                        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                          {raProgress.unlocked_achievements} de {raProgress.total_achievements} conquistas desbloqueadas ({raProgress.completion_percentage.toFixed(1)}%)
                        </p>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                            Pontos Obtidos
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
                          }}
                        >
                          <span>Página RA</span>
                          <ExternalLink size={12} />
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

                  {/* FILTER BUTTONS & SEARCH BAR */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className={`details-filter-btn ${achFilter === "all" ? "active" : ""}`}
                        onClick={() => setAchFilter("all")}
                      >
                        Todas ({raProgress.total_achievements})
                      </button>
                      <button
                        className={`details-filter-btn ${achFilter === "unlocked" ? "active" : ""}`}
                        onClick={() => setAchFilter("unlocked")}
                        style={{ color: achFilter === "unlocked" ? "var(--accent-green)" : undefined }}
                      >
                        Desbloqueadas ({raProgress.unlocked_achievements})
                      </button>
                      <button
                        className={`details-filter-btn ${achFilter === "locked" ? "active" : ""}`}
                        onClick={() => setAchFilter("locked")}
                      >
                        Bloqueadas ({raProgress.total_achievements - raProgress.unlocked_achievements})
                      </button>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ position: "relative" }}>
                        <Search size={14} color="var(--text-muted)" style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)" }} />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Buscar conquista..."
                          value={achSearch}
                          onChange={(e) => setAchSearch(e.target.value)}
                          style={{ paddingLeft: "30px", fontSize: "0.8rem", height: "34px", width: "180px" }}
                        />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="ID no RA"
                          value={manualRaId}
                          onChange={(e) => setManualRaId(e.target.value)}
                          style={{ width: "90px", fontSize: "0.8rem", height: "34px", textAlign: "center" }}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            const parsed = parseInt(manualRaId.trim(), 10);
                            if (!isNaN(parsed) && parsed > 0) {
                              loadRaProgress(currentGame, parsed);
                            }
                          }}
                          style={{ height: "34px", padding: "0 10px" }}
                          title="Alterar ID do jogo no RetroAchievements"
                        >
                          <RotateCw size={13} className={raLoading ? "spin" : ""} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ACHIEVEMENTS LIST */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      maxHeight: "420px",
                      overflowY: "auto",
                      paddingRight: "6px",
                    }}
                  >
                    {raProgress.achievements
                      .filter((ach) => {
                        if (achFilter === "unlocked") return ach.is_unlocked;
                        if (achFilter === "locked") return !ach.is_unlocked;
                        if (achSearch.trim()) {
                          const q = achSearch.toLowerCase();
                          return ach.title.toLowerCase().includes(q) || ach.description.toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .map((ach) => (
                        <div
                          key={ach.id}
                          className="achievement-card"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "14px 18px",
                            background: ach.is_unlocked ? "rgba(255, 153, 0, 0.06)" : "var(--bg-surface)",
                            border: ach.is_unlocked
                              ? "1px solid rgba(255, 153, 0, 0.35)"
                              : "1px solid var(--border-subtle)",
                            borderRadius: "var(--radius-md)",
                            transition: "all 0.2s ease",
                            opacity: ach.is_unlocked ? 1 : 0.65,
                          }}
                        >
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
                                  background: "rgba(0, 0, 0, 0.4)",
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

                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: ach.is_unlocked ? "#fff" : "var(--text-secondary)" }}>
                                {ach.title}
                              </h4>
                              {ach.is_unlocked && (
                                <CheckCircle2 size={15} color="var(--accent-green)" />
                              )}
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "2px" }}>
                              {ach.description}
                            </p>
                            {ach.date_unlocked && (
                              <span style={{ fontSize: "0.7rem", color: "var(--accent-green)", marginTop: "4px", display: "inline-block" }}>
                                Desbloqueada em {formatDateTimeSafe(ach.date_unlocked)}
                              </span>
                            )}
                          </div>

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
                              }}
                            >
                              {ach.points} pts
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  <Trophy size={40} color="var(--text-muted)" />
                  <p style={{ marginTop: "12px", fontSize: "0.9rem" }}>
                    Nenhuma conquista do RetroAchievements encontrada para este jogo ou console.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAVES & SNAPSHOTS */}
          {activeTab === "saves" && (
            <div style={{ padding: "24px 32px" }}>
              {/* SAVE PATH CONFIGURATION CARD */}
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 24px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <Save size={18} color="var(--accent-cyan)" />
                      <span>Localização do Save / Cartão de Memória</span>
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                      Caminho do arquivo de save (.sav, .srm, .mcd, .ps2, .raw) ou da pasta de saves
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="btn-secondary"
                      onClick={handlePickSavePath}
                      style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                    >
                      <FolderPlus size={14} />
                      <span>Procurar...</span>
                    </button>
                    {currentGame.save_path && (
                      <button
                        className="btn-secondary"
                        onClick={handleOpenSaveFolder}
                        style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                        title="Abrir pasta no Windows Explorer"
                      >
                        <FolderOpen size={14} />
                        <span>Abrir Pasta</span>
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    value={savePathInput}
                    onChange={(e) => setSavePathInput(e.target.value)}
                    placeholder="Ex: C:\Games\SOH\saves ou C:\PCSX2\memcards\Mcd001.ps2"
                    style={{
                      flex: 1,
                      background: "rgba(10, 14, 22, 0.6)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      padding: "8px 12px",
                      color: "#fff",
                      fontSize: "0.85rem",
                    }}
                  />
                  <button
                    className="btn-primary"
                    onClick={handleSaveSavePath}
                    style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                  >
                    <Check size={14} />
                    <span>Salvar</span>
                  </button>
                </div>
              </div>

              {/* CREATE NEW SNAPSHOT BACKUP */}
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 24px",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                  <HardDrive size={18} color="var(--accent-green)" />
                  <span>Criar Novo Snapshot de Segurança</span>
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 14px 0" }}>
                  Crie um ponto de restauração instantâneo antes de chefes difíceis ou modificações de mods.
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <input
                    type="text"
                    value={backupNote}
                    onChange={(e) => setBackupNote(e.target.value)}
                    placeholder="Descrição do checkpoint (ex: Antes do Boss final, 100% dos colecionáveis...)"
                    style={{
                      flex: 1,
                      minWidth: "260px",
                      background: "rgba(10, 14, 22, 0.6)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-sm)",
                      padding: "8px 12px",
                      color: "#fff",
                      fontSize: "0.85rem",
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCreateBackup();
                    }}
                  />
                  <button
                    className="btn-primary"
                    onClick={handleCreateBackup}
                    disabled={saveLoading}
                    style={{
                      background: "linear-gradient(135deg, #00E676 0%, #00B0FF 100%)",
                      color: "#080A0F",
                      fontWeight: 700,
                      padding: "8px 18px",
                    }}
                  >
                    <Save size={15} />
                    <span>{saveLoading ? "Salvando Snapshot..." : "Criar Backup Agora"}</span>
                  </button>
                </div>
              </div>

              {/* CHECKPOINTS LIST */}
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: "0 0 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={16} color="var(--text-muted)" />
                <span>Snapshots & Checkpoints Gravados ({backups.length})</span>
              </h3>

              {backups.length === 0 ? (
                <div
                  style={{
                    padding: "36px",
                    background: "var(--bg-card)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    border: "1px dashed var(--border-subtle)",
                  }}
                >
                  <Save size={36} color="var(--text-muted)" style={{ opacity: 0.5, marginBottom: "10px" }} />
                  <div>Nenhum snapshot de save gravado para este jogo.</div>
                  <div style={{ fontSize: "0.75rem", marginTop: "4px" }}>
                    Configure o caminho do save acima e clique em "Criar Backup Agora".
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {backups.map((bk) => (
                    <div
                      key={bk.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 18px",
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "var(--radius-md)",
                        gap: "14px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: "240px" }}>
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "8px",
                            background: "rgba(0, 229, 255, 0.12)",
                            border: "1px solid rgba(0, 229, 255, 0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--accent-cyan)",
                            flexShrink: 0,
                          }}
                        >
                          <HardDrive size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#fff" }}>
                            {bk.note || "Backup Automático"}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px", display: "flex", gap: "12px" }}>
                            <span>📅 {formatDateTimeSafe(bk.created_at)}</span>
                            <span>📦 {(bk.size_bytes / 1024).toFixed(1)} KB</span>
                            <span>📄 {bk.file_count} {bk.file_count === 1 ? "arquivo" : "arquivos"}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          className="btn-secondary"
                          onClick={() => handleRestoreBackup(bk.id)}
                          style={{
                            fontSize: "0.8rem",
                            padding: "6px 14px",
                            borderColor: "rgba(0, 230, 118, 0.4)",
                            color: "#00E676",
                          }}
                          title="Restaurar este estado de save"
                        >
                          <RotateCcw size={14} />
                          <span>Restaurar</span>
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => handleDeleteBackup(bk.id)}
                          style={{
                            fontSize: "0.8rem",
                            padding: "6px 12px",
                            borderColor: "rgba(255, 42, 85, 0.4)",
                            color: "var(--accent-red)",
                          }}
                          title="Excluir este backup"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MODS & MANUALS */}
          {activeTab === "mods" && (
            <div style={{ padding: "24px 32px" }}>
              {/* MODS AND HD TEXTURES SECTION */}
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 24px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <Sparkles size={18} color="var(--accent-purple)" />
                      <span>Gerenciador de Mods & Texturas HD</span>
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                      Abra o diretório onde você pode colocar pacotes de texturas HD, mods de áudio e shaders.
                    </p>
                  </div>
                  <button
                    className="btn-primary"
                    onClick={handleOpenFolder}
                    style={{ fontSize: "0.8rem", padding: "8px 16px" }}
                  >
                    <FolderOpen size={15} />
                    <span>Abrir Pasta de Mods / Jogo</span>
                  </button>
                </div>

                <div
                  style={{
                    background: "rgba(10, 14, 22, 0.5)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px 16px",
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                  }}
                >
                  <p style={{ margin: "0 0 6px 0", fontWeight: 600, color: "#fff" }}>
                    💡 Dicas de customização para esta plataforma:
                  </p>
                  {currentGame.is_emulator ? (
                    <div>
                      • Para <strong>DuckStation/PCSX2/Dolphin</strong>, pastas como <code>textures/</code>, <code>cheats/</code> e <code>patches/</code> permitem texturas em alta resolução substitutas e hacks de 60fps.<br />
                      • Utilize a pasta de ROMs para manter imagens de jogos compactadas (.chd / .cso / .rvz).
                    </div>
                  ) : (
                    <div>
                      • Para Recompilações de PC (como <strong>Ship of Harkinian, sm64pc, OpenGOAL</strong>), coloque arquivos <code>.otr</code>, <code>mods/</code> ou texturas Render96 diretamente na pasta do executável.<br />
                      • O executável carrega os pacotes complementares de forma nativa e automática.
                    </div>
                  )}
                </div>
              </div>

              {/* GAME MANUAL / GUIDE VIEWER */}
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-lg)",
                  padding: "20px 24px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                      <BookOpen size={18} color="#FF9900" />
                      <span>Manual & Guias do Jogo</span>
                    </h3>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                      Visualize o manual oficial do jogo em PDF, mapas ou guias de estratégia enquanto joga.
                    </p>
                  </div>
                  <button
                    className="btn-secondary"
                    onClick={handlePickManual}
                    style={{ fontSize: "0.8rem", padding: "8px 16px" }}
                  >
                    <BookOpen size={15} />
                    <span>Abrir Manual (PDF / TXT)</span>
                  </button>
                </div>

                <div
                  style={{
                    padding: "20px",
                    background: "rgba(10, 14, 22, 0.4)",
                    borderRadius: "var(--radius-md)",
                    textAlign: "center",
                    border: "1px dashed var(--border-subtle)",
                  }}
                >
                  <BookOpen size={28} color="#FF9900" style={{ opacity: 0.6, marginBottom: "8px" }} />
                  <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>Experiência Clássica Nostálgica</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                    Você pode selecionar arquivos PDF de manuais escaneados da época para consultar golpes, mapas de fases e histórias de personagens!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AUTO SCRAPER MODAL */}
      <AutoScraperModal
        isOpen={isScraperOpen}
        onClose={() => setIsScraperOpen(false)}
        initialQuery={currentGame.title}
        steamGridDbKey={steamGridDbKey}
        igdbApiKey={igdbApiKey}
        igdbClientId={igdbClientId}
        igdbClientSecret={igdbClientSecret}
        onSelectAssets={(cUrl, bUrl) => {
          handleUpdateArt(cUrl, bUrl);
        }}
      />

      {/* MANUAL ART CUSTOMIZATION MODAL */}
      {isManualArtOpen && (
        <div className="modal-backdrop nested" style={{ zIndex: 30000 }} onClick={() => setIsManualArtOpen(false)}>
          <div
            className="modal-content"
            style={{
              maxWidth: "850px",
              width: "95%",
              background: "linear-gradient(145deg, rgba(16, 22, 34, 0.98) 0%, rgba(10, 14, 22, 0.99) 100%)",
              border: "1px solid rgba(168, 85, 247, 0.35)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(168, 85, 247, 0.2)",
              borderRadius: "16px",
              padding: "0",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px 24px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(168, 85, 247, 0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "rgba(168, 85, 247, 0.2)",
                    border: "1px solid rgba(168, 85, 247, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#C084FC",
                  }}
                >
                  <Palette size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0, color: "#fff" }}>
                    Personalizar Capa & Banner Manualmente
                  </h2>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Insira uma URL da internet ou escolha uma imagem do seu computador para <strong style={{ color: "#E2E8F0" }}>{currentGame.title}</strong>
                  </p>
                </div>
              </div>
              <button
                className="btn-close"
                onClick={() => setIsManualArtOpen(false)}
                style={{ background: "rgba(255, 255, 255, 0.06)" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px", maxHeight: "70vh", overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px" }}>
                
                {/* SECTION 1: CAPA VERTICAL */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <ImageIcon size={16} color="var(--accent-cyan)" />
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Capa Vertical (Pôster)</span>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "10px" }}>
                      Proporção ~3:4 / 2:3
                    </span>
                  </div>

                  {/* Preview Container */}
                  <div
                    style={{
                      height: "220px",
                      background: "rgba(10, 14, 22, 0.6)",
                      border: "1px dashed rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {manualCover.trim() ? (
                      <img
                        src={formatImageUrl(manualCover.trim())}
                        alt="Preview Capa"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px" }}>
                        <ImageIcon size={32} style={{ opacity: 0.4, marginBottom: "8px" }} />
                        <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>Nenhuma Capa Definida</div>
                        <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "2px" }}>
                          Pôster exibido na grade da biblioteca
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input and Local picker */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                      URL da Imagem ou Caminho no Disco:
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://... ou D:\Imagens\capa.png"
                      value={manualCover}
                      onChange={(e) => setManualCover(e.target.value)}
                      style={{ fontSize: "0.8rem" }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handlePickCoverFile}
                        style={{ flex: 1, fontSize: "0.78rem", padding: "8px 12px", justifyContent: "center" }}
                      >
                        <FolderOpen size={14} color="var(--accent-cyan)" />
                        <span>Escolher Arquivo do PC</span>
                      </button>
                      {manualCover && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setManualCover("")}
                          title="Limpar Capa"
                          style={{ padding: "8px 12px", color: "var(--accent-red)", borderColor: "rgba(255, 59, 48, 0.3)" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* SECTION 2: BANNER HORIZONTAL */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <ImageIcon size={16} color="#A78BFA" />
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Banner Hero (Wallpaper)</span>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "10px" }}>
                      Proporção ~16:9
                    </span>
                  </div>

                  {/* Preview Container */}
                  <div
                    style={{
                      height: "220px",
                      background: "rgba(10, 14, 22, 0.6)",
                      border: "1px dashed rgba(255, 255, 255, 0.15)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    {manualBanner.trim() ? (
                      <img
                        src={formatImageUrl(manualBanner.trim())}
                        alt="Preview Banner"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: "center", color: "var(--text-muted)", padding: "16px" }}>
                        <ImageIcon size={32} style={{ opacity: 0.4, marginBottom: "8px" }} />
                        <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>Nenhum Banner Definido</div>
                        <div style={{ fontSize: "0.72rem", opacity: 0.7, marginTop: "2px" }}>
                          Wallpaper para o cabeçalho e Big Picture
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input and Local picker */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                      URL do Banner ou Caminho no Disco:
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://... ou D:\Imagens\banner.png"
                      value={manualBanner}
                      onChange={(e) => setManualBanner(e.target.value)}
                      style={{ fontSize: "0.8rem" }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handlePickBannerFile}
                        style={{ flex: 1, fontSize: "0.78rem", padding: "8px 12px", justifyContent: "center" }}
                      >
                        <FolderOpen size={14} color="#A78BFA" />
                        <span>Escolher Arquivo do PC</span>
                      </button>
                      {manualBanner && (
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setManualBanner("")}
                          title="Limpar Banner"
                          style={{ padding: "8px 12px", color: "var(--accent-red)", borderColor: "rgba(255, 59, 48, 0.3)" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 24px",
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                background: "rgba(10, 14, 22, 0.8)",
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setIsManualArtOpen(false);
                  setIsScraperOpen(true);
                }}
                style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", borderColor: "rgba(0, 229, 255, 0.3)" }}
              >
                <Sparkles size={14} />
                <span>Buscar no SteamGridDB / IGDB</span>
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsManualArtOpen(false)}
                  disabled={isSavingArt}
                  style={{ fontSize: "0.85rem", padding: "8px 18px" }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualArt}
                  disabled={isSavingArt}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 22px",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: isSavingArt ? "not-allowed" : "pointer",
                    boxShadow: "0 4px 14px rgba(168, 85, 247, 0.4)",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Check size={16} />
                  <span>{isSavingArt ? "Salvando..." : "Salvar Artes"}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

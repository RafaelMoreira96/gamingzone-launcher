import React, { useState, useEffect } from "react";
import { Play, Square, Clock, Gamepad2, Cpu, Star, Trophy } from "lucide-react";
import { Game, CardBadgePreference } from "../types";
import { formatPlaytime, formatImageUrl } from "../services/api";
import { ConsoleIcon } from "./ConsoleIcon";

interface GameCardProps {
  game: Game;
  badgePreference?: CardBadgePreference;
  onSelect: (game: Game) => void;
  onLaunch: (game: Game, e: React.MouseEvent) => void;
  onStop: (game: Game, e: React.MouseEvent) => void;
  onToggleFavorite?: (game: Game, e: React.MouseEvent) => void;
  onOpenAchievements?: (game: Game, e: React.MouseEvent) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  badgePreference = "auto",
  onSelect,
  onLaunch,
  onStop,
  onToggleFavorite,
  onOpenAchievements,
}) => {
  const [localToggle, setLocalToggle] = useState<boolean | null>(null);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [game.cover_url]);

  const platformColor = game.platform_brand_color || "#00E5FF";
  const isRecomp = !game.is_emulator;

  // Determine what icon to display based on preference or toggle:
  // - "recomp": always show recomp icon for PC ports
  // - "platform": always show platform console icon (e.g. N64, PS1)
  // - "auto": recomp icon for recomp ports, platform icon for emulated games
  const defaultShowRecomp =
    badgePreference === "recomp" ||
    (badgePreference === "auto" && isRecomp) ||
    (!game.original_platform_id || game.original_platform_id === "pc" || game.original_platform_id === "recomp");

  const showRecomp = localToggle !== null ? localToggle : defaultShowRecomp;

  const badgeColor = showRecomp ? "var(--accent-cyan, #00E5FF)" : platformColor;
  const badgeTooltip = showRecomp
    ? `Recompilação Nativa PC${game.platform_name ? ` • Origem: ${game.platform_name}` : ""}${game.original_platform_id ? " (Clique para alternar para o ícone do console)" : ""}`
    : `Plataforma: ${game.platform_name || game.original_platform_id?.toUpperCase() || "Console"}${game.is_emulator ? " (Emulado)" : " (Recomp Nativo)"}${isRecomp ? " (Clique para alternar para o ícone de recomp)" : ""}`;

  const getStatusBadge = () => {
    switch (game.play_status) {
      case "playing":
        return { label: "JOGANDO", bg: "rgba(0, 230, 118, 0.15)", border: "#00E676", color: "#00E676" };
      case "completed":
        return { label: "ZERADO", bg: "rgba(255, 184, 0, 0.18)", border: "#FFB800", color: "#FFD54F" };
      case "paused":
        return { label: "PAUSADO", bg: "rgba(167, 139, 250, 0.15)", border: "#A78BFA", color: "#C4B5FD" };
      case "backlog":
      default:
        return null;
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="game-card" onClick={() => onSelect(game)}>
      <div className="game-cover-container">
        {game.cover_url && !imgError ? (
          <img
            src={formatImageUrl(game.cover_url)}
            alt={game.title}
            className="game-cover-img"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => {
              setImgError(true);
            }}
          />
        ) : (
          <div className="game-cover-placeholder">
            {game.is_emulator ? (
              <Gamepad2 size={40} style={{ color: platformColor }} />
            ) : (
              <Cpu size={40} style={{ color: platformColor }} />
            )}
            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>{game.title}</span>
          </div>
        )}

        {/* Quick Play Hover Button */}
        {game.is_running ? (
          <button
            className="quick-play-btn running"
            onClick={(e) => onStop(game, e)}
            title="Encerrar Execução"
          >
            <Square size={20} fill="currentColor" />
          </button>
        ) : (
          <button
            className="quick-play-btn"
            onClick={(e) => onLaunch(game, e)}
            title={game.is_emulator ? "Iniciar no Emulador" : "Iniciar Recomp PC"}
          >
            <Play size={22} fill="currentColor" style={{ marginLeft: "2px" }} />
          </button>
        )}

        {/* TOP COVER BAR: ONLY CLEAN ICON BADGE (PLATFORM OR RECOMP) & RIGHT ACTIONS */}
        <div className="game-cover-top-bar">
          {/* Authentic Icon Badge (Single Icon Only - No Text Clutter) */}
          <div
            className={`game-card-icon-badge ${showRecomp ? "badge-recomp" : "badge-platform"}`}
            style={{
              borderColor: showRecomp ? "rgba(0, 229, 255, 0.45)" : `${platformColor}66`,
              color: badgeColor,
            }}
            title={badgeTooltip}
            onClick={(e) => {
              if (isRecomp && game.original_platform_id) {
                e.stopPropagation();
                setLocalToggle((prev) => (prev === null ? !defaultShowRecomp : !prev));
              }
            }}
          >
            <ConsoleIcon
              platformId={showRecomp ? null : game.original_platform_id}
              iconName={showRecomp ? "recomp" : undefined}
              name={game.platform_name}
              size={18}
              color={badgeColor}
            />
            {game.is_running && <span className="card-badge-running-dot" title="Jogo em execução" />}
          </div>

          {/* Right Action Icons: Achievements & Favorite */}
          <div className="game-card-top-actions">
            {onOpenAchievements && (
              <button
                type="button"
                className="card-action-icon-btn card-ra-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAchievements(game, e);
                }}
                title="Ver Conquistas do RetroAchievements"
              >
                <Trophy size={14} color="#FF9900" />
              </button>
            )}

            {onToggleFavorite && (
              <button
                type="button"
                className={`card-action-icon-btn card-fav-btn ${game.is_favorite ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(game, e);
                }}
                title={game.is_favorite ? "Remover dos Favoritos" : "Marcar como Favorito"}
              >
                <Star
                  size={14}
                  fill={game.is_favorite ? "#FFB800" : "none"}
                  stroke={game.is_favorite ? "#FFB800" : "currentColor"}
                />
              </button>
            )}
          </div>
        </div>

        {/* Bottom subtle gradient for contrast */}
        <div className="game-cover-bottom-gradient" />
      </div>

      {/* GAME CARD INFO FOOTER */}
      <div className="game-card-info">
        <div className="game-card-title-row">
          <h3 className="game-card-title" title={game.title}>
            {game.title}
          </h3>
          {statusBadge && (
            <span
              className="game-card-status-pill"
              style={{
                backgroundColor: statusBadge.bg,
                borderColor: statusBadge.border,
                color: statusBadge.color,
              }}
            >
              {game.play_status === "playing" && <span className="status-live-dot" />}
              {statusBadge.label}
            </span>
          )}
        </div>

        <div className="game-card-meta">
          <span className="playtime-tag" title="Tempo total jogado">
            <Clock size={12} />
            <span>{formatPlaytime(game.total_playtime_seconds)}</span>
          </span>
          {game.last_played_at && (
            <span className="last-played-tag" title="Última vez jogado">
              {new Date(game.last_played_at).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

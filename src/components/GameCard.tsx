import React from "react";
import { Play, Square, Clock, Gamepad2, Cpu, Star, Trophy } from "lucide-react";
import { Game } from "../types";
import { formatPlaytime, formatImageUrl } from "../services/api";
import { ConsoleIcon } from "./ConsoleIcon";

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
  onLaunch: (game: Game, e: React.MouseEvent) => void;
  onStop: (game: Game, e: React.MouseEvent) => void;
  onToggleFavorite?: (game: Game, e: React.MouseEvent) => void;
  onOpenAchievements?: (game: Game, e: React.MouseEvent) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  onSelect,
  onLaunch,
  onStop,
  onToggleFavorite,
  onOpenAchievements,
}) => {
  const platformColor = game.platform_brand_color || "#00E5FF";

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
        {game.cover_url ? (
          <img
            src={formatImageUrl(game.cover_url)}
            alt={game.title}
            className="game-cover-img"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
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

        {/* Hover Quick Action Button */}
        {game.is_running ? (
          <button
            className="quick-play-btn"
            style={{ background: "var(--accent-red)", color: "#fff" }}
            onClick={(e) => onStop(game, e)}
            title="Encerrar Execução"
          >
            <Square size={22} fill="currentColor" />
          </button>
        ) : (
          <button
            className="quick-play-btn"
            onClick={(e) => onLaunch(game, e)}
            title={game.is_emulator ? "Iniciar no Emulador" : "Iniciar Recomp PC"}
          >
            <Play size={22} fill="currentColor" />
          </button>
        )}

        {/* Quick Favorite Star Button */}
        {onToggleFavorite && (
          <button
            className={`quick-fav-btn ${game.is_favorite ? "active" : ""}`}
            onClick={(e) => onToggleFavorite(game, e)}
            title={game.is_favorite ? "Remover dos Favoritos" : "Marcar como Favorito"}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              zIndex: 10,
              background: game.is_favorite ? "rgba(10, 14, 22, 0.85)" : "rgba(10, 14, 22, 0.6)",
              border: `1px solid ${game.is_favorite ? "rgba(255, 184, 0, 0.7)" : "rgba(255, 255, 255, 0.15)"}`,
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: game.is_favorite ? "#FFB800" : "rgba(255, 255, 255, 0.6)",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
            }}
          >
            <Star
              size={16}
              fill={game.is_favorite ? "#FFB800" : "none"}
              stroke="currentColor"
            />
          </button>
        )}

        {/* Quick RetroAchievements Trophy Button */}
        {onOpenAchievements && (
          <button
            className="quick-ra-btn"
            onClick={(e) => {
              e.stopPropagation();
              onOpenAchievements(game, e);
            }}
            title="Ver Conquistas do RetroAchievements"
            style={{
              position: "absolute",
              top: "10px",
              right: onToggleFavorite ? "48px" : "10px",
              zIndex: 10,
              background: "rgba(10, 14, 22, 0.75)",
              border: "1px solid rgba(255, 153, 0, 0.4)",
              borderRadius: "8px",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#FFB84D",
              backdropFilter: "blur(8px)",
              transition: "all 0.2s ease",
            }}
          >
            <Trophy size={15} color="#FF9900" />
          </button>
        )}

        <div className="game-cover-overlay">
          <div className="card-top-badges">
            {/* PLATAFORMA DE ORIGEM INDICATOR */}
            <div
              className="origin-platform-badge"
              style={{
                backgroundColor: "rgba(10, 14, 22, 0.88)",
                borderColor: platformColor,
                color: platformColor,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              <ConsoleIcon platformId={game.original_platform_id} name={game.platform_name} size={13} color={platformColor} />
              <span>{game.platform_name || game.original_platform_id.toUpperCase()}</span>
            </div>

            {/* EXECUTION TYPE: RECOMP PC VS EMULADO */}
            <div className={`execution-type-badge ${game.is_emulator ? "type-emulator" : "type-recomp"}`}>
              {game.is_emulator ? (
                <>
                  <Gamepad2 size={11} />
                  <span>EMULADO</span>
                </>
              ) : (
                <>
                  <Cpu size={11} />
                  <span>RECOMP PC</span>
                </>
              )}
            </div>

            {/* RUNNING INDICATOR */}
            {game.is_running && (
              <div className="running-badge">
                <span className="running-dot" />
                <span>RODANDO</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="game-card-info">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
          <h3 className="game-card-title" title={game.title} style={{ margin: 0, flex: 1 }}>
            {game.title}
          </h3>
          {statusBadge && (
            <span
              style={{
                fontSize: "0.6rem",
                fontWeight: 800,
                letterSpacing: "0.5px",
                padding: "2px 6px",
                borderRadius: "4px",
                backgroundColor: statusBadge.bg,
                border: `1px solid ${statusBadge.border}`,
                color: statusBadge.color,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {statusBadge.label}
            </span>
          )}
        </div>
        <div className="game-card-meta">
          <span className="playtime-tag">
            <Clock size={13} />
            {formatPlaytime(game.total_playtime_seconds)}
          </span>
          {game.last_played_at && (
            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {new Date(game.last_played_at).toLocaleDateString("pt-BR")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

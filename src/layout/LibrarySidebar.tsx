import React, { useState } from "react";
import {
  Layers,
  Star,
  Trophy,
  Cpu,
  Gamepad2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Platform, PlayStatusType, Game } from "../types";
import { ConsoleIcon } from "../components/ConsoleIcon";
import { formatImageUrl } from "../services/api";

interface LibrarySidebarProps {
  platforms: Platform[];
  selectedPlatformId: string | null;
  onSelectPlatform: (id: string | null) => void;
  gamesCountByPlatform: Record<string, number>;
  totalGamesCount: number;
  typeFilter: "all" | "recomp" | "emulator";
  onSelectTypeFilter: (filter: "all" | "recomp" | "emulator") => void;
  recompCount: number;
  emulatorCount: number;
  onlyFavorites: boolean;
  onToggleOnlyFavorites: () => void;
  favoriteCount: number;
  statusFilter: "all" | PlayStatusType;
  onSelectStatusFilter: (status: "all" | PlayStatusType) => void;
  completedCount: number;
  games: Game[];
  selectedGameId: string | null;
  onSelectGame: (game: Game) => void;
}

export const LibrarySidebar: React.FC<LibrarySidebarProps> = ({
  platforms,
  selectedPlatformId,
  onSelectPlatform,
  gamesCountByPlatform,
  totalGamesCount,
  typeFilter,
  onSelectTypeFilter,
  recompCount,
  emulatorCount,
  onlyFavorites,
  onToggleOnlyFavorites,
  favoriteCount,
  statusFilter,
  onSelectStatusFilter,
  completedCount,
  games,
  selectedGameId,
  onSelectGame,
}) => {
  const [isPlatformsExpanded, setIsPlatformsExpanded] = useState(true);

  const resetAllFilters = () => {
    onSelectTypeFilter("all");
    onSelectPlatform(null);
    if (onlyFavorites) onToggleOnlyFavorites();
    onSelectStatusFilter("all");
  };

  return (
    <aside className="library-sidebar">
      <div className="sidebar-scroll-area thin-scrollbar">
        {/* SECTION 1: COLEÇÕES & FILTROS */}
        <div className="sidebar-section-header">
          <span>Coleções</span>
        </div>

        {/* Todos os Jogos */}
        <div
          className={`sidebar-item ${
            selectedPlatformId === null &&
            typeFilter === "all" &&
            !onlyFavorites &&
            statusFilter === "all"
              ? "active"
              : ""
          }`}
          onClick={resetAllFilters}
        >
          <div className="sidebar-item-content">
            <Layers size={15} />
            <span>Todos os Jogos</span>
          </div>
          <span className="sidebar-item-count">{totalGamesCount}</span>
        </div>

        {/* Favoritos */}
        <div
          className={`sidebar-item ${onlyFavorites ? "active" : ""}`}
          onClick={onToggleOnlyFavorites}
        >
          <div className="sidebar-item-content">
            <Star
              size={15}
              color={onlyFavorites ? "var(--color-warning)" : "var(--color-text-muted)"}
              fill={onlyFavorites ? "var(--color-warning)" : "none"}
            />
            <span>Favoritos</span>
          </div>
          <span className="sidebar-item-count">{favoriteCount}</span>
        </div>

        {/* Zerados / Concluídos */}
        <div
          className={`sidebar-item ${statusFilter === "completed" ? "active" : ""}`}
          onClick={() =>
            onSelectStatusFilter(statusFilter === "completed" ? "all" : "completed")
          }
        >
          <div className="sidebar-item-content">
            <Trophy size={15} color="var(--color-success)" />
            <span>Zerados</span>
          </div>
          <span className="sidebar-item-count">{completedCount}</span>
        </div>

        {/* Recompilações Nativas PC */}
        <div
          className={`sidebar-item ${
            typeFilter === "recomp" && selectedPlatformId === null && !onlyFavorites
              ? "active"
              : ""
          }`}
          onClick={() => {
            onSelectTypeFilter("recomp");
            onSelectPlatform(null);
          }}
        >
          <div className="sidebar-item-content">
            <Cpu size={15} color="var(--color-accent)" />
            <span>Recompilações PC</span>
          </div>
          <span className="sidebar-item-count">{recompCount}</span>
        </div>

        {/* Jogos Emulados */}
        <div
          className={`sidebar-item ${
            typeFilter === "emulator" && selectedPlatformId === null && !onlyFavorites
              ? "active"
              : ""
          }`}
          onClick={() => {
            onSelectTypeFilter("emulator");
            onSelectPlatform(null);
          }}
        >
          <div className="sidebar-item-content">
            <Gamepad2 size={15} color="var(--color-purple)" />
            <span>Emulados</span>
          </div>
          <span className="sidebar-item-count">{emulatorCount}</span>
        </div>

        {/* SECTION 2: PLATAFORMAS (Colapsável) */}
        <div
          className="sidebar-section-header"
          style={{ cursor: "pointer", marginTop: "var(--space-2)" }}
          onClick={() => setIsPlatformsExpanded((prev) => !prev)}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {isPlatformsExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <span>Plataformas</span>
          </div>
          <span style={{ fontSize: "0.65rem", textTransform: "none", opacity: 0.7 }}>
            {platforms.length}
          </span>
        </div>

        {isPlatformsExpanded &&
          platforms
            .filter((p) => p.is_enabled)
            .map((plat) => {
              const count = gamesCountByPlatform[plat.id] || 0;
              const isSelected = selectedPlatformId === plat.id;

              return (
                <div
                  key={plat.id}
                  className={`sidebar-item ${isSelected ? "active" : ""}`}
                  onClick={() => onSelectPlatform(isSelected ? null : plat.id)}
                  title={`${plat.name} (${count} jogos)`}
                >
                  <div className="sidebar-item-content">
                    <ConsoleIcon
                      platformId={plat.id}
                      name={plat.name}
                      size={15}
                      color={plat.brand_color}
                    />
                    <span>{plat.short_name}</span>
                  </div>
                  <span
                    className="sidebar-item-count"
                    style={{ color: isSelected ? plat.brand_color : undefined }}
                  >
                    {count}
                  </span>
                </div>
              );
            })}

        {/* SECTION 3: LISTA COMPACTA DE JOGOS (Playnite/Steam sidebar list) */}
        {games.length > 0 && (
          <div className="sidebar-game-list">
            <div className="sidebar-section-header" style={{ padding: "4px 0" }}>
              <span>Jogos Filtrados ({games.length})</span>
            </div>
            {games.map((g) => {
              const isSelected = selectedGameId === g.id;
              return (
                <div
                  key={g.id}
                  className={`sidebar-game-row ${isSelected ? "active" : ""}`}
                  onClick={() => onSelectGame(g)}
                  title={g.title}
                >
                  {g.cover_url ? (
                    <img
                      src={formatImageUrl(g.cover_url)}
                      alt=""
                      className="sidebar-game-thumb"
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="sidebar-game-thumb"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--color-accent)",
                      }}
                    >
                      <Gamepad2 size={13} />
                    </div>
                  )}
                  <span className="sidebar-game-title">{g.title}</span>
                  {g.is_running && (
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--color-success)",
                        boxShadow: "0 0 6px var(--color-success)",
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

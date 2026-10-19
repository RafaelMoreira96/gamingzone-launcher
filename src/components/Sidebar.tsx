import React from "react";
import { Gamepad2, Disc, Cpu, Box, Smartphone, Layers, CircleDot, Star, Trophy, BarChart3 } from "lucide-react";
import { Platform, PlayStatusType } from "../types";

interface SidebarProps {
  platforms: Platform[];
  selectedPlatformId: string | null;
  onSelectPlatform: (id: string | null) => void;
  gamesCountByPlatform: Record<string, number>;
  totalGamesCount: number;
  totalPlaytimeHours: number;
  currentView: "library" | "replay" | "achievements";
  onSelectView: (view: "library" | "replay" | "achievements") => void;
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
}

export const Sidebar: React.FC<SidebarProps> = ({
  platforms,
  selectedPlatformId,
  onSelectPlatform,
  gamesCountByPlatform,
  totalGamesCount,
  totalPlaytimeHours,
  currentView,
  onSelectView,
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
}) => {
  const getPlatformIcon = (iconName: string) => {
    switch (iconName) {
      case "gamepad":
        return <Gamepad2 size={16} />;
      case "disc":
        return <Disc size={16} />;
      case "cpu":
        return <Cpu size={16} />;
      case "box":
        return <Box size={16} />;
      case "smartphone":
        return <Smartphone size={16} />;
      case "circle-dot":
        return <CircleDot size={16} />;
      default:
        return <Layers size={16} />;
    }
  };

  const handleSelectAllGames = () => {
    onSelectView("library");
    onSelectTypeFilter("all");
    onSelectPlatform(null);
    if (onlyFavorites) onToggleOnlyFavorites();
    onSelectStatusFilter("all");
  };

  const handleSelectFavorites = () => {
    onSelectView("library");
    onToggleOnlyFavorites();
  };

  const handleSelectCompleted = () => {
    onSelectView("library");
    if (statusFilter === "completed") {
      onSelectStatusFilter("all");
    } else {
      onSelectStatusFilter("completed");
    }
  };

  const handleSelectRecomps = () => {
    onSelectView("library");
    onSelectTypeFilter("recomp");
  };

  const handleSelectEmulators = () => {
    onSelectView("library");
    onSelectTypeFilter("emulator");
  };

  const handleSelectPlatform = (id: string) => {
    onSelectView("library");
    onSelectPlatform(id);
  };

  return (
    <aside className="sidebar">
      <div className="brand-section">
        <div className="brand-icon-box">
          <Gamepad2 size={24} color="#080A0F" />
        </div>
        <div className="brand-text">
          <h1 style={{ fontSize: "1.2rem", letterSpacing: "-0.5px" }}>GAMINGZONE</h1>
          <span className="brand-tag">LAUNCHER</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-category-title">Menu Principal</div>

        {/* TODOS OS JOGOS */}
        <button
          className={`platform-pill ${currentView === "library" && selectedPlatformId === null && typeFilter === "all" && !onlyFavorites && statusFilter === "all" ? "active" : ""}`}
          onClick={handleSelectAllGames}
        >
          <div className="platform-pill-content">
            <Layers size={16} />
            <span>Todos os Jogos</span>
          </div>
          <span className="platform-count">{totalGamesCount}</span>
        </button>

        {/* FAVORITOS */}
        <button
          className={`platform-pill ${currentView === "library" && onlyFavorites ? "active" : ""}`}
          onClick={handleSelectFavorites}
          style={{
            borderColor: currentView === "library" && onlyFavorites ? "#FFB800" : undefined,
            background: currentView === "library" && onlyFavorites ? "rgba(255, 184, 0, 0.15)" : undefined,
          }}
        >
          <div className="platform-pill-content">
            <Star size={16} color="#FFB800" fill={onlyFavorites ? "#FFB800" : "none"} />
            <span style={{ color: currentView === "library" && onlyFavorites ? "#FFD54F" : undefined, fontWeight: onlyFavorites ? 700 : undefined }}>
              Favoritos
            </span>
          </div>
          <span className="platform-count" style={{ color: "#FFB800" }}>
            {favoriteCount}
          </span>
        </button>

        {/* ZERADOS / CONCLUÍDOS */}
        <button
          className={`platform-pill ${currentView === "library" && statusFilter === "completed" ? "active" : ""}`}
          onClick={handleSelectCompleted}
          style={{
            borderColor: currentView === "library" && statusFilter === "completed" ? "#00E676" : undefined,
            background: currentView === "library" && statusFilter === "completed" ? "rgba(0, 230, 118, 0.15)" : undefined,
          }}
        >
          <div className="platform-pill-content">
            <Trophy size={16} color="#00E676" />
            <span style={{ color: currentView === "library" && statusFilter === "completed" ? "#69F0AE" : undefined, fontWeight: statusFilter === "completed" ? 700 : undefined }}>
              Zerados / Concluídos
            </span>
          </div>
          <span className="platform-count" style={{ color: "#00E676" }}>
            {completedCount}
          </span>
        </button>

        {/* RECOMPILAÇÕES NATIVAS PC */}
        <button
          className={`platform-pill ${currentView === "library" && typeFilter === "recomp" && selectedPlatformId === null && !onlyFavorites ? "active" : ""}`}
          onClick={handleSelectRecomps}
          style={{
            borderColor: currentView === "library" && typeFilter === "recomp" && selectedPlatformId === null && !onlyFavorites ? "var(--accent-cyan)" : undefined,
          }}
        >
          <div className="platform-pill-content">
            <Cpu size={16} color="var(--accent-cyan)" />
            <span style={{ color: currentView === "library" && typeFilter === "recomp" && selectedPlatformId === null && !onlyFavorites ? "#fff" : undefined }}>
              Recompilações PC
            </span>
          </div>
          <span className="platform-count" style={{ color: "var(--accent-cyan)" }}>
            {recompCount}
          </span>
        </button>

        {/* JOGOS EMULADOS (ROMS) */}
        <button
          className={`platform-pill ${currentView === "library" && typeFilter === "emulator" && selectedPlatformId === null && !onlyFavorites ? "active" : ""}`}
          onClick={handleSelectEmulators}
          style={{
            borderColor: currentView === "library" && typeFilter === "emulator" && selectedPlatformId === null && !onlyFavorites ? "#A78BFA" : undefined,
          }}
        >
          <div className="platform-pill-content">
            <Gamepad2 size={16} color="#A78BFA" />
            <span style={{ color: currentView === "library" && typeFilter === "emulator" && selectedPlatformId === null && !onlyFavorites ? "#fff" : undefined }}>
              Jogos Emulados
            </span>
          </div>
          <span className="platform-count" style={{ color: "#A78BFA" }}>
            {emulatorCount}
          </span>
        </button>

        {/* RETROACHIEVEMENTS VIEW BUTTON */}
        <button
          className={`platform-pill ${currentView === "achievements" ? "active" : ""}`}
          onClick={() => onSelectView("achievements")}
          style={{
            borderColor: currentView === "achievements" ? "#FF9900" : undefined,
            background: currentView === "achievements" ? "rgba(255, 153, 0, 0.18)" : undefined,
          }}
        >
          <div className="platform-pill-content">
            <Trophy size={16} color="#FF9900" />
            <span style={{ color: currentView === "achievements" ? "#FFB84D" : undefined, fontWeight: 700 }}>
              Conquistas
            </span>
          </div>
          <span
            style={{
              fontSize: "0.65rem",
              background: "rgba(255, 153, 0, 0.2)",
              color: "#FFB84D",
              border: "1px solid rgba(255, 153, 0, 0.4)",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: 800,
            }}
          >
            OFICIAL
          </span>
        </button>

        {/* GAMING STATISTICS VIEW BUTTON */}
        <button
          className={`platform-pill ${currentView === "replay" ? "active" : ""}`}
          onClick={() => onSelectView("replay")}
          style={{
            borderColor: currentView === "replay" ? "#00E5FF" : undefined,
            background: currentView === "replay" ? "rgba(0, 229, 255, 0.15)" : undefined,
          }}
        >
          <div className="platform-pill-content">
            <BarChart3 size={16} color="#00E5FF" />
            <span style={{ color: currentView === "replay" ? "#00E5FF" : undefined, fontWeight: 700 }}>
              Gaming Statistics
            </span>
          </div>
          <span
            style={{
              fontSize: "0.65rem",
              background: "linear-gradient(90deg, #00e5ff 0%, #0077fe 100%)",
              color: "#080a0f",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: 800,
            }}
          >
            CENTRAL
          </span>
        </button>

        <div className="nav-category-title">Plataforma de Origem</div>

        {platforms.map((plat) => {
          const count = gamesCountByPlatform[plat.id] || 0;
          const isSelected = selectedPlatformId === plat.id;

          return (
            <button
              key={plat.id}
              className={`platform-pill ${currentView === "library" && isSelected ? "active" : ""}`}
              onClick={() => handleSelectPlatform(plat.id)}
            >
              <div className="platform-pill-content">
                <span
                  className="platform-badge-dot"
                  style={{
                    backgroundColor: plat.brand_color,
                    color: plat.brand_color,
                  }}
                />
                {getPlatformIcon(plat.icon_name)}
                <span>{plat.short_name}</span>
              </div>
              <span className="platform-count">{count}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-stats">
        <div className="stat-item">
          <span className="stat-label">Total de Jogos</span>
          <span className="stat-val">{totalGamesCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Horas Acumuladas</span>
          <span className="stat-val">{totalPlaytimeHours.toFixed(1)}h</span>
        </div>
      </div>
    </aside>
  );
};

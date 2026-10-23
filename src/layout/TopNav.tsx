import React, { useState, useRef, useEffect } from "react";
import {
  Gamepad2,
  Trophy,
  BarChart3,
  Search,
  Volume2,
  VolumeX,
  Tv,
  Settings,
  Plus,
  FolderUp,
  ChevronDown,
  Music,
  Check,
} from "lucide-react";
import { LoFiProfileType } from "../types";
import { LOFI_PROFILES } from "../services/ambientAudio";

interface TopNavProps {
  currentView: "library" | "replay" | "achievements";
  onSelectView: (view: "library" | "replay" | "achievements") => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  ambientPlaying: boolean;
  ambientProfile?: LoFiProfileType;
  onToggleAmbient: () => void;
  onSelectAmbientProfile?: (profile: LoFiProfileType) => void;
  onOpenBigPicture: () => void;
  onOpenSettings: () => void;
  onOpenAddGame: () => void;
  onOpenBatchImport: () => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentView,
  onSelectView,
  searchQuery,
  onSearchChange,
  ambientPlaying,
  ambientProfile = "cozy-synth",
  onToggleAmbient,
  onSelectAmbientProfile,
  onOpenBigPicture,
  onOpenSettings,
  onOpenAddGame,
  onOpenBatchImport,
  searchInputRef,
}) => {
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isLofiMenuOpen, setIsLofiMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const lofiMenuRef = useRef<HTMLDivElement>(null);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setIsAddMenuOpen(false);
      }
      if (lofiMenuRef.current && !lofiMenuRef.current.contains(e.target as Node)) {
        setIsLofiMenuOpen(false);
      }
    };
    if (isAddMenuOpen || isLofiMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAddMenuOpen, isLofiMenuOpen]);

  return (
    <header className="top-nav">
      {/* Brand & Steam-Style Primary Tabs */}
      <div className="top-nav-left">
        <div className="brand-badge-link" onClick={() => onSelectView("library")}>
          <div className="brand-badge-icon">
            <Gamepad2 size={20} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline" }}>
            <span className="brand-badge-title">GAMINGZONE</span>
            <span className="brand-badge-tag">HUB</span>
          </div>
        </div>

        <nav className="view-tabs" aria-label="Navegação principal">
          <button
            type="button"
            className={`view-tab-btn ${currentView === "library" ? "active" : ""}`}
            onClick={() => onSelectView("library")}
          >
            <Gamepad2 size={15} />
            <span>Biblioteca</span>
          </button>

          <button
            type="button"
            className={`view-tab-btn ${currentView === "achievements" ? "active" : ""}`}
            onClick={() => onSelectView("achievements")}
          >
            <Trophy size={15} />
            <span>Conquistas</span>
          </button>

          <button
            type="button"
            className={`view-tab-btn ${currentView === "replay" ? "active" : ""}`}
            onClick={() => onSelectView("replay")}
          >
            <BarChart3 size={15} />
            <span>Estatísticas</span>
          </button>
        </nav>
      </div>

      {/* Right Controls: Search, Utilities & Action Menu */}
      <div className="top-nav-right">
        {/* Search Input with Ctrl+F badge */}
        <div className="nav-search-box">
          <Search size={14} color="var(--color-text-muted)" />
          <input
            ref={searchInputRef}
            type="text"
            className="nav-search-input"
            placeholder="Buscar títulos, consoles..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              style={{ color: "var(--color-text-muted)", fontSize: "0.75rem", padding: "0 2px" }}
              title="Limpar busca (Esc)"
            >
              ✕
            </button>
          ) : (
            <span
              style={{
                fontSize: "0.625rem",
                color: "var(--color-text-muted)",
                background: "rgba(255, 255, 255, 0.06)",
                padding: "1px 4px",
                borderRadius: "3px",
                fontWeight: 700,
              }}
            >
              Ctrl+F
            </span>
          )}
        </div>

        {/* Ambient Lo-Fi Audio Toggle & Profile Menu */}
        <div ref={lofiMenuRef} style={{ position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center" }}>
            <button
              type="button"
              className={`btn btn-sm btn-secondary ${ambientPlaying ? "active" : ""}`}
              onClick={onToggleAmbient}
              title={ambientPlaying ? "Pausar Trilha Lo-Fi" : "Ativar Trilha Lo-Fi"}
              style={{
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
                paddingRight: "8px",
              }}
            >
              {ambientPlaying ? (
                <Volume2 size={15} color="var(--color-accent-purple, #b347ff)" />
              ) : (
                <VolumeX size={15} />
              )}
              <span>Lo-Fi</span>
            </button>
            <button
              type="button"
              className={`btn btn-sm btn-secondary ${ambientPlaying ? "active" : ""}`}
              onClick={() => setIsLofiMenuOpen((prev) => !prev)}
              title="Trocar perfil sonoro Lo-Fi"
              aria-label="Trocar perfil Lo-Fi"
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
                paddingLeft: "5px",
                paddingRight: "5px",
              }}
            >
              <ChevronDown size={13} style={{ opacity: 0.8 }} />
            </button>
          </div>

          {isLofiMenuOpen && (
            <div
              className="dropdown-menu"
              role="menu"
              style={{
                minWidth: "260px",
                padding: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--color-text-muted)",
                  padding: "4px 8px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Music size={12} />
                <span>Estilo Lo-Fi ({Object.keys(LOFI_PROFILES).length})</span>
              </div>
              {(Object.keys(LOFI_PROFILES) as LoFiProfileType[]).map((profId) => {
                const prof = LOFI_PROFILES[profId];
                const isSelected = ambientProfile === profId;
                return (
                  <button
                    key={prof.id}
                    type="button"
                    className="dropdown-item"
                    onClick={() => {
                      if (onSelectAmbientProfile) {
                        onSelectAmbientProfile(prof.id);
                      }
                      setIsLofiMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: "8px",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      background: isSelected ? "rgba(255, 255, 255, 0.08)" : "transparent",
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: prof.color,
                            display: "inline-block",
                          }}
                        />
                        <span style={{ fontWeight: 600, fontSize: "0.8125rem", color: isSelected ? "#fff" : "var(--color-text-primary)" }}>
                          {prof.name}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.6875rem", color: "var(--color-text-muted)" }}>
                        {prof.tag}
                      </span>
                    </div>
                    {isSelected && (
                      <Check size={14} style={{ color: prof.color, marginTop: "2px" }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Big Picture Launcher (F11) */}
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={onOpenBigPicture}
          title="Modo Big Picture para TV / Controle (F11)"
        >
          <Tv size={15} color="var(--color-accent)" />
          <span>Big Picture</span>
        </button>

        {/* Settings Modal Toggle */}
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={onOpenSettings}
          title="Configurações (Temas, Plataformas, Integrações)"
        >
          <Settings size={15} />
        </button>

        {/* Steam-Style Split / Menu Button "+ Adicionar ▾" */}
        <div ref={addMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={() => setIsAddMenuOpen((prev) => !prev)}
            aria-expanded={isAddMenuOpen}
            aria-haspopup="true"
          >
            <Plus size={15} />
            <span>Adicionar</span>
            <ChevronDown size={13} style={{ opacity: 0.8 }} />
          </button>

          {isAddMenuOpen && (
            <div className="dropdown-menu" role="menu">
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  onOpenAddGame();
                }}
              >
                <Plus size={16} />
                <span>Adicionar Jogo Manual</span>
              </button>
              <button
                type="button"
                className="dropdown-item"
                onClick={() => {
                  setIsAddMenuOpen(false);
                  onOpenBatchImport();
                }}
              >
                <FolderUp size={16} />
                <span>Importar ROMs em Lote</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

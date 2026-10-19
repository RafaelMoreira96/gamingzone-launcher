import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Square,
  Clock,
  Gamepad2,
  Tv,
  X,
  Trophy,
  Star,
  Settings,
  FolderUp,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react";
import { Game, Platform, ControllerPromptType } from "../types";
import { formatPlaytime, formatImageUrl } from "../services/api";
import { ReplayView } from "./ReplayView";
import { RetroAchievementsView } from "./RetroAchievementsView";
import { ConsoleIcon } from "./ConsoleIcon";

interface BigPictureModeProps {
  games: Game[];
  platforms: Platform[];
  onLaunchGame: (game: Game) => void;
  onStopGame: (game: Game) => void;
  onExitBigPicture: () => void;
  controllerType?: ControllerPromptType;
  onToggleFavorite?: (game: Game) => void;
  onOpenSettings?: () => void;
  onOpenAddGame?: () => void;
  onOpenBatchImport?: () => void;
  onOpenGameDetails?: (game: Game) => void;
  raUsername?: string;
  raApiKey?: string;
}

// Synthesized Audio Context for console UI feedback
let audioCtx: AudioContext | null = null;
const playSound = (type: "move" | "select" | "back") => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === "move") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.04);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === "select") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(1040, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "back") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  } catch (_) {}
};

export const BigPictureMode: React.FC<BigPictureModeProps> = ({
  games,
  platforms,
  onLaunchGame,
  onStopGame,
  onExitBigPicture,
  controllerType = "xbox",
  onToggleFavorite,
  onOpenSettings,
  onOpenAddGame,
  onOpenBatchImport,
  onOpenGameDetails,
  raUsername,
  raApiKey,
}) => {
  const [activeTab, setActiveTab] = useState<"library" | "replay" | "achievements">("library");
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "recomp" | "emulator">("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [clock, setClock] = useState("");
  const [gamepadName, setGamepadName] = useState<string | null>(null);
  const [achievementsTargetGame, setAchievementsTargetGame] = useState<Game | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const lastButtonPress = useRef<number>(0);

  // Controller layout mapping
  const prompts = useMemo(() => {
    switch (controllerType) {
      case "playstation":
        return {
          select: "✕",
          back: "○",
          details: "□",
          favorite: "△",
          bumperL: "L1",
          bumperR: "R1",
        };
      case "nintendo":
        return {
          select: "B",
          back: "A",
          details: "Y",
          favorite: "X",
          bumperL: "L",
          bumperR: "R",
        };
      case "xbox":
      default:
        return {
          select: "A",
          back: "B",
          details: "X",
          favorite: "Y",
          bumperL: "LB",
          bumperR: "RB",
        };
    }
  }, [controllerType]);

  // Counts
  const recompCount = useMemo(() => games.filter((g) => !g.is_emulator).length, [games]);
  const emulatorCount = useMemo(() => games.filter((g) => Boolean(g.is_emulator)).length, [games]);
  const favoritesCount = useMemo(() => games.filter((g) => Boolean(g.is_favorite)).length, [games]);

  // Filter games based on platform, type, favorites and search in Big Picture
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      const matchPlat = !selectedPlatformId || g.original_platform_id === selectedPlatformId;
      const matchType =
        filterMode === "all" ||
        (filterMode === "recomp" && !g.is_emulator) ||
        (filterMode === "emulator" && Boolean(g.is_emulator));
      const matchFav = !onlyFavorites || Boolean(g.is_favorite);
      const matchSearch =
        !searchQuery.trim() ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.original_platform_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (g.platform_name && g.platform_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchPlat && matchType && matchFav && matchSearch;
    });
  }, [games, selectedPlatformId, filterMode, onlyFavorites, searchQuery]);

  // Keep selected index within bounds
  useEffect(() => {
    if (selectedIndex >= filteredGames.length) {
      setSelectedIndex(Math.max(0, filteredGames.length - 1));
    }
  }, [filteredGames.length, selectedIndex]);

  // Digital Clock Updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Center selected card into view
  useEffect(() => {
    if (carouselRef.current && activeTab === "library") {
      const activeCard = carouselRef.current.children[selectedIndex] as HTMLElement;
      if (activeCard) {
        activeCard.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex, activeTab]);

  // Focus search input when toggled
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Gamepad Loop & Input Navigation
  useEffect(() => {
    let animId: number;

    const checkGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let activePad: Gamepad | null = null;
      for (const gp of gamepads) {
        if (gp && gp.connected) {
          activePad = gp;
          break;
        }
      }

      if (activePad) {
        const simpleName = activePad.id.includes("Xbox")
          ? "Controle Xbox"
          : activePad.id.includes("DualSense") || activePad.id.includes("Wireless Controller")
          ? "PlayStation DualSense"
          : "Gamepad Conectado";
        setGamepadName(simpleName);

        const now = Date.now();
        // Debounce gamepad inputs (180ms)
        if (now - lastButtonPress.current > 180) {
          const dpadLeft = activePad.buttons[14]?.pressed || activePad.axes[0] < -0.5;
          const dpadRight = activePad.buttons[15]?.pressed || activePad.axes[0] > 0.5;
          const dpadUp = activePad.buttons[12]?.pressed || activePad.axes[1] < -0.5;
          const dpadDown = activePad.buttons[13]?.pressed || activePad.axes[1] > 0.5;
          const btnA = activePad.buttons[0]?.pressed;
          const btnB = activePad.buttons[1]?.pressed;
          const btnX = activePad.buttons[2]?.pressed;
          const btnY = activePad.buttons[3]?.pressed;
          const btnLB = activePad.buttons[4]?.pressed;
          const btnRB = activePad.buttons[5]?.pressed;
          const btnBack = activePad.buttons[8]?.pressed;
          const btnStart = activePad.buttons[9]?.pressed;
          const btnGuide = activePad.buttons[16]?.pressed;

          if (activeTab === "library") {
            if (dpadLeft) {
              lastButtonPress.current = now;
              playSound("move");
              setSelectedIndex((prev) => Math.max(0, prev - 1));
            } else if (dpadRight) {
              lastButtonPress.current = now;
              playSound("move");
              setSelectedIndex((prev) => Math.min(filteredGames.length - 1, prev + 1));
            } else if (btnLB || dpadUp) {
              lastButtonPress.current = now;
              playSound("move");
              cyclePlatform(-1);
            } else if (btnRB || dpadDown) {
              lastButtonPress.current = now;
              playSound("move");
              cyclePlatform(1);
            } else if (btnA) {
              lastButtonPress.current = now;
              const current = filteredGames[selectedIndex];
              if (current) {
                playSound("select");
                if (current.is_running) {
                  onStopGame(current);
                } else {
                  onLaunchGame(current);
                }
              }
            } else if (btnB) {
              lastButtonPress.current = now;
              playSound("back");
              if (isSearchOpen || searchQuery) {
                setIsSearchOpen(false);
                setSearchQuery("");
              } else {
                onExitBigPicture();
              }
            } else if (btnX) {
              lastButtonPress.current = now;
              const current = filteredGames[selectedIndex];
              if (current && onOpenGameDetails) {
                playSound("select");
                onOpenGameDetails(current);
              }
            } else if (btnY) {
              lastButtonPress.current = now;
              const current = filteredGames[selectedIndex];
              if (current && onToggleFavorite) {
                playSound("select");
                onToggleFavorite(current);
              }
            } else if (btnStart || btnBack) {
              lastButtonPress.current = now;
              if (onOpenSettings) {
                playSound("select");
                onOpenSettings();
              }
            } else if (btnGuide) {
              lastButtonPress.current = now;
              onExitBigPicture();
            }
          } else {
            // In replay or achievements views, B button returns to library
            if (btnB) {
              lastButtonPress.current = now;
              playSound("back");
              setActiveTab("library");
            } else if (btnGuide) {
              lastButtonPress.current = now;
              onExitBigPicture();
            }
          }
        }
      } else {
        setGamepadName(null);
      }

      animId = requestAnimationFrame(checkGamepad);
    };

    animId = requestAnimationFrame(checkGamepad);
    return () => cancelAnimationFrame(animId);
  }, [
    activeTab,
    filteredGames,
    selectedIndex,
    onToggleFavorite,
    onLaunchGame,
    onStopGame,
    onExitBigPicture,
    onOpenGameDetails,
    onOpenSettings,
    isSearchOpen,
    searchQuery,
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow normal typing inside search input
      if (document.activeElement === searchInputRef.current) {
        if (e.key === "Escape") {
          setIsSearchOpen(false);
          setSearchQuery("");
          (document.activeElement as HTMLElement)?.blur();
        }
        return;
      }

      if (e.key === "Escape") {
        playSound("back");
        if (activeTab !== "library") {
          setActiveTab("library");
        } else if (isSearchOpen || searchQuery) {
          setIsSearchOpen(false);
          setSearchQuery("");
        } else {
          onExitBigPicture();
        }
        return;
      }

      if (activeTab === "library") {
        if (e.key === "ArrowLeft") {
          playSound("move");
          setSelectedIndex((prev) => Math.max(0, prev - 1));
        } else if (e.key === "ArrowRight") {
          playSound("move");
          setSelectedIndex((prev) => Math.min(filteredGames.length - 1, prev + 1));
        } else if (e.key === "ArrowUp") {
          playSound("move");
          cyclePlatform(-1);
        } else if (e.key === "ArrowDown") {
          playSound("move");
          cyclePlatform(1);
        } else if (e.key === "Enter") {
          const current = filteredGames[selectedIndex];
          if (current) {
            playSound("select");
            if (current.is_running) {
              onStopGame(current);
            } else {
              onLaunchGame(current);
            }
          }
        } else if (e.key === "x" || e.key === "X" || e.key === "d" || e.key === "D" || e.key === "Tab") {
          e.preventDefault();
          const current = filteredGames[selectedIndex];
          if (current && onOpenGameDetails) {
            playSound("select");
            onOpenGameDetails(current);
          }
        } else if (e.key === "f" || e.key === "F") {
          const current = filteredGames[selectedIndex];
          if (current && onToggleFavorite) {
            playSound("select");
            onToggleFavorite(current);
          }
        } else if (e.key === "c" || e.key === "C" || e.key === "s" || e.key === "S") {
          if (onOpenSettings) {
            playSound("select");
            onOpenSettings();
          }
        } else if (e.key === "i" || e.key === "I") {
          if (onOpenBatchImport) {
            playSound("select");
            onOpenBatchImport();
          }
        } else if (e.key === "n" || e.key === "N") {
          if (onOpenAddGame) {
            playSound("select");
            onOpenAddGame();
          }
        } else if (e.key === "r" || e.key === "R") {
          playSound("select");
          setActiveTab("replay");
        } else if (e.key === "t" || e.key === "T") {
          playSound("select");
          setAchievementsTargetGame(filteredGames[selectedIndex] || null);
          setActiveTab("achievements");
        } else if (e.key === "/") {
          e.preventDefault();
          setIsSearchOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTab,
    filteredGames,
    selectedIndex,
    onToggleFavorite,
    onLaunchGame,
    onStopGame,
    onExitBigPicture,
    onOpenGameDetails,
    onOpenSettings,
    onOpenBatchImport,
    onOpenAddGame,
    isSearchOpen,
    searchQuery,
  ]);

  const cyclePlatform = (direction: number) => {
    const enabledPlatforms = platforms.filter((p) => p.is_enabled);
    const platformOptions: (string | null)[] = [null, ...enabledPlatforms.map((p) => p.id)];
    const currentIndex = platformOptions.indexOf(selectedPlatformId);
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = platformOptions.length - 1;
    if (nextIndex >= platformOptions.length) nextIndex = 0;

    setSelectedPlatformId(platformOptions[nextIndex]);
    setSelectedIndex(0);
  };

  const selectedGame = filteredGames[selectedIndex];
  const platformColor = selectedGame?.platform_brand_color || "#00E5FF";

  return (
    <div className="big-picture-wrapper">
      {/* IMMERSIVE DYNAMIC BACKDROP */}
      <div className="big-picture-backdrop">
        {selectedGame?.banner_url || selectedGame?.cover_url ? (
          <img
            src={formatImageUrl(selectedGame.banner_url || selectedGame.cover_url)}
            alt={selectedGame.title}
            className="big-picture-backdrop-img"
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "radial-gradient(circle at 50% 30%, #17243c 0%, #060910 80%)",
            }}
          />
        )}
        <div className="big-picture-backdrop-overlay" />
      </div>

      {/* TOP CONSOLE HUD */}
      <header className="big-picture-hud">
        <div className="hud-left">
          <div
            className="hud-logo-tag"
            onClick={() => {
              playSound("select");
              setActiveTab("library");
            }}
            title="Ir para Biblioteca"
          >
            <Tv size={22} color="var(--accent-cyan)" />
            <span>GAMINGZONE</span>
          </div>

          {/* Primary View Navigation Tabs */}
          <nav className="hud-nav-tabs">
            <button
              className={`hud-nav-tab ${activeTab === "library" ? "active" : ""}`}
              onClick={() => {
                playSound("select");
                setActiveTab("library");
              }}
            >
              <Gamepad2 size={17} />
              <span>Biblioteca</span>
            </button>
            <button
              className={`hud-nav-tab ${activeTab === "replay" ? "active" : ""}`}
              onClick={() => {
                playSound("select");
                setActiveTab("replay");
              }}
            >
              <TrendingUp size={17} />
              <span>Gaming Statistics</span>
            </button>
            <button
              className={`hud-nav-tab ${activeTab === "achievements" ? "active" : ""}`}
              onClick={() => {
                playSound("select");
                setAchievementsTargetGame(selectedGame || null);
                setActiveTab("achievements");
              }}
            >
              <Trophy size={17} />
              <span>Conquistas</span>
            </button>
          </nav>
        </div>

        <div className="hud-right">
          {/* Action Buttons: Search, Add Game, Batch Import, Settings */}
          <div className="hud-actions-group">
            <button
              className={`hud-action-btn ${isSearchOpen || searchQuery ? "active" : ""}`}
              onClick={() => {
                playSound("move");
                setIsSearchOpen((prev) => !prev);
                if (activeTab !== "library") setActiveTab("library");
              }}
              title="Buscar Jogos (/)"
            >
              <Search size={15} />
              <span>Buscar</span>
            </button>

            {onOpenAddGame && (
              <button
                className="hud-action-btn"
                onClick={() => {
                  playSound("select");
                  onOpenAddGame();
                }}
                title="Adicionar Jogo (N)"
              >
                <Plus size={15} />
                <span>+ Jogo</span>
              </button>
            )}

            {onOpenBatchImport && (
              <button
                className="hud-action-btn"
                onClick={() => {
                  playSound("select");
                  onOpenBatchImport();
                }}
                title="Importar ROMs em Lote (I)"
              >
                <FolderUp size={15} />
                <span>Importar ROMs</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                className="hud-action-btn"
                onClick={() => {
                  playSound("select");
                  onOpenSettings();
                }}
                title="Configurações (C / Start)"
              >
                <Settings size={15} />
                <span>Configurações</span>
              </button>
            )}
          </div>

          <div className="hud-controller-badge">
            <Gamepad2 size={16} color={gamepadName ? "var(--accent-green)" : "var(--text-muted)"} />
            <span>{gamepadName || "Teclado Ativo"}</span>
          </div>

          <div className="hud-clock">{clock}</div>

          <button
            className="btn-exit-big-picture"
            onClick={onExitBigPicture}
            title="Sair do Modo Big Picture (ESC)"
          >
            <X size={18} />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* VIEW CONTENT ROUTING */}
      {activeTab === "library" ? (
        <>
          {/* SUB-HUD: CATEGORY, PLATFORMS, AND SEARCH BAR */}
          <div className="big-picture-subhud">
            <div className="hud-platform-pills">
              <button
                className={`hud-pill ${selectedPlatformId === null && filterMode === "all" && !onlyFavorites ? "active" : ""}`}
                onClick={() => {
                  playSound("move");
                  setSelectedPlatformId(null);
                  setFilterMode("all");
                  setOnlyFavorites(false);
                  setSelectedIndex(0);
                }}
              >
                Todos ({games.length})
              </button>
              <button
                className={`hud-pill ${filterMode === "recomp" && selectedPlatformId === null && !onlyFavorites ? "active" : ""}`}
                onClick={() => {
                  playSound("move");
                  setSelectedPlatformId(null);
                  setFilterMode("recomp");
                  setOnlyFavorites(false);
                  setSelectedIndex(0);
                }}
                style={{
                  borderColor:
                    filterMode === "recomp" && selectedPlatformId === null && !onlyFavorites
                      ? "var(--accent-cyan)"
                      : undefined,
                  color:
                    filterMode === "recomp" && selectedPlatformId === null && !onlyFavorites
                      ? "var(--accent-cyan)"
                      : undefined,
                }}
              >
                ⚡ Recomps PC ({recompCount})
              </button>
              <button
                className={`hud-pill ${filterMode === "emulator" && selectedPlatformId === null && !onlyFavorites ? "active" : ""}`}
                onClick={() => {
                  playSound("move");
                  setSelectedPlatformId(null);
                  setFilterMode("emulator");
                  setOnlyFavorites(false);
                  setSelectedIndex(0);
                }}
                style={{
                  borderColor:
                    filterMode === "emulator" && selectedPlatformId === null && !onlyFavorites
                      ? "#A78BFA"
                      : undefined,
                  color:
                    filterMode === "emulator" && selectedPlatformId === null && !onlyFavorites
                      ? "#A78BFA"
                      : undefined,
                }}
              >
                🎮 Emuladores ({emulatorCount})
              </button>
              <button
                className={`hud-pill ${onlyFavorites ? "active" : ""}`}
                onClick={() => {
                  playSound("move");
                  setOnlyFavorites((prev) => !prev);
                  setSelectedIndex(0);
                }}
                style={{
                  borderColor: onlyFavorites ? "#FFB84D" : undefined,
                  color: onlyFavorites ? "#080a0f" : "#FFB84D",
                  backgroundColor: onlyFavorites ? "#FFB84D" : undefined,
                }}
              >
                <Star size={14} fill={onlyFavorites ? "#080a0f" : "currentColor"} />
                <span>Favoritos ({favoritesCount})</span>
              </button>
              {platforms
                .filter((p) => p.is_enabled)
                .map((plat) => (
                  <button
                    key={plat.id}
                    className={`hud-pill ${selectedPlatformId === plat.id ? "active" : ""}`}
                    onClick={() => {
                      playSound("move");
                      setSelectedPlatformId(plat.id);
                      setFilterMode("all");
                      setOnlyFavorites(false);
                      setSelectedIndex(0);
                    }}
                    style={{
                      borderColor: selectedPlatformId === plat.id ? plat.brand_color : undefined,
                    }}
                  >
                    <ConsoleIcon
                      platformId={plat.id}
                      name={plat.name}
                      size={15}
                      color={plat.brand_color}
                    />
                    <span>{plat.short_name}</span>
                  </button>
                ))}
            </div>

            {/* Quick Search Bar */}
            {isSearchOpen && (
              <div className="big-picture-search-bar">
                <Search size={16} color="var(--accent-cyan)" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="big-picture-search-input"
                  placeholder="Buscar jogo ou console..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                />
                {searchQuery && (
                  <button
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                    }}
                    onClick={() => setSearchQuery("")}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* CENTER STAGE: FOCUSED HERO SHOWCASE */}
          <main className="big-picture-stage">
            {selectedGame ? (
              <div className="stage-hero-info">
                <div
                  className="origin-platform-badge"
                  style={{
                    backgroundColor: "rgba(10, 14, 22, 0.9)",
                    borderColor: platformColor,
                    color: platformColor,
                    fontSize: "0.85rem",
                    padding: "6px 12px",
                  }}
                >
                  <span>
                    {selectedGame.platform_name || selectedGame.original_platform_id.toUpperCase()}
                  </span>
                  <span className="recomp-arrow">→</span>
                  <span className="recomp-target">
                    {selectedGame.is_emulator ? "JOGO EMULADO" : "PC RECOMP NATIVO"}
                  </span>
                </div>

                <h1 className="stage-game-title">{selectedGame.title}</h1>

                <div className="stage-meta-row">
                  <span className="stage-meta-item">
                    <Clock size={16} color="var(--accent-cyan)" />
                    <span>{formatPlaytime(selectedGame.total_playtime_seconds)}</span>
                  </span>

                  {selectedGame.last_played_at && (
                    <span className="stage-meta-item">
                      Última vez: {new Date(selectedGame.last_played_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}

                  {selectedGame.is_running && (
                    <div className="running-badge" style={{ fontSize: "0.75rem" }}>
                      <span className="running-dot" />
                      <span>RODANDO AGORA</span>
                    </div>
                  )}

                  {selectedGame.is_emulator && (
                    <span className="stage-meta-item" style={{ color: "#FFB84D" }}>
                      <Trophy size={16} color="#FF9900" />
                      <span>RetroAchievements Disponível</span>
                    </span>
                  )}

                  {selectedGame.play_status && selectedGame.play_status !== "backlog" && (
                    <span
                      className="stage-meta-item"
                      style={{
                        background:
                          selectedGame.play_status === "completed"
                            ? "rgba(76, 175, 80, 0.2)"
                            : selectedGame.play_status === "playing"
                            ? "rgba(0, 229, 255, 0.2)"
                            : "rgba(255, 152, 0, 0.2)",
                        color:
                          selectedGame.play_status === "completed"
                            ? "#81C784"
                            : selectedGame.play_status === "playing"
                            ? "#00E5FF"
                            : "#FFB74D",
                        padding: "4px 10px",
                        borderRadius: "999px",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      }}
                    >
                      {selectedGame.play_status === "completed"
                        ? "ZERADO"
                        : selectedGame.play_status === "playing"
                        ? "JOGANDO"
                        : "PAUSADO"}
                    </span>
                  )}
                </div>

                {selectedGame.notes && (
                  <p className="stage-game-notes">{selectedGame.notes}</p>
                )}

                {/* BIG ACTION BUTTONS */}
                <div className="stage-actions-row">
                  {selectedGame.is_running ? (
                    <button
                      className="btn-stop-big"
                      onClick={() => onStopGame(selectedGame)}
                      style={{ padding: "16px 36px", fontSize: "1.15rem" }}
                    >
                      <Square size={22} fill="currentColor" />
                      <span>({prompts.select}) ENCERRAR JOGO</span>
                    </button>
                  ) : (
                    <button
                      className="btn-launch-big"
                      onClick={() => onLaunchGame(selectedGame)}
                      style={{ padding: "16px 42px", fontSize: "1.15rem" }}
                    >
                      <Play size={24} fill="currentColor" />
                      <span>({prompts.select}) JOGAR AGORA</span>
                    </button>
                  )}

                  {onOpenGameDetails && (
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        playSound("select");
                        onOpenGameDetails(selectedGame);
                      }}
                      style={{ padding: "16px 24px", fontSize: "1rem" }}
                      title="Histórico de Sessões, Editar Dados, Trocar Capas via IGDB e Excluir"
                    >
                      <span>({prompts.details}) Detalhes & Gerenciar</span>
                    </button>
                  )}

                  <button
                    className="btn-secondary"
                    onClick={() => {
                      playSound("select");
                      setAchievementsTargetGame(selectedGame);
                      setActiveTab("achievements");
                    }}
                    style={{ padding: "16px 20px", fontSize: "1rem" }}
                    title="Ver Conquistas deste jogo no RetroAchievements"
                  >
                    <Trophy size={18} color="#FF9900" />
                    <span>Conquistas</span>
                  </button>

                  {onToggleFavorite && (
                    <button
                      className="btn-secondary"
                      onClick={() => onToggleFavorite(selectedGame)}
                      style={{
                        padding: "16px 22px",
                        fontSize: "1rem",
                        color: selectedGame.is_favorite ? "#FFB84D" : "inherit",
                        borderColor: selectedGame.is_favorite ? "#FFB84D" : undefined,
                      }}
                    >
                      <Star size={18} fill={selectedGame.is_favorite ? "#FFB84D" : "none"} />
                      <span>
                        ({prompts.favorite}) {selectedGame.is_favorite ? "Favoritado" : "Favoritar"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="stage-empty">
                <Gamepad2 size={64} color="var(--text-muted)" />
                <h2>Nenhum jogo encontrado nesta categoria</h2>
                {searchQuery && (
                  <button
                    className="btn-secondary"
                    onClick={() => setSearchQuery("")}
                    style={{ marginTop: "12px" }}
                  >
                    Limpar Busca
                  </button>
                )}
              </div>
            )}

            {/* BOTTOM HORIZONTAL POSTER CAROUSEL */}
            <div className="big-picture-shelf">
              <div className="carousel-track" ref={carouselRef}>
                {filteredGames.map((game, idx) => {
                  const isSelected = idx === selectedIndex;
                  const gColor = game.platform_brand_color || "#00E5FF";

                  return (
                    <div
                      key={game.id}
                      className={`shelf-card ${isSelected ? "focused" : ""}`}
                      onClick={() => {
                        playSound("move");
                        setSelectedIndex(idx);
                      }}
                      onDoubleClick={() => {
                        playSound("select");
                        onLaunchGame(game);
                      }}
                      style={{
                        borderColor: isSelected ? gColor : undefined,
                        boxShadow: isSelected ? `0 0 30px ${gColor}66` : undefined,
                      }}
                    >
                      {game.cover_url ? (
                        <img
                          src={formatImageUrl(game.cover_url)}
                          alt={game.title}
                          className="shelf-card-img"
                        />
                      ) : (
                        <div className="shelf-card-fallback">
                          <Gamepad2 size={36} color={gColor} />
                          <span className="fallback-title">{game.title}</span>
                        </div>
                      )}

                      {game.is_favorite && (
                        <div
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "rgba(0, 0, 0, 0.75)",
                            backdropFilter: "blur(4px)",
                            borderRadius: "50%",
                            width: "28px",
                            height: "28px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFB84D",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                            zIndex: 5,
                          }}
                        >
                          <Star size={15} fill="#FFB84D" />
                        </div>
                      )}

                      <div className="shelf-card-badge" style={{ color: gColor, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <ConsoleIcon platformId={game.original_platform_id} name={game.platform_name} size={13} color={gColor} />
                        <span>{game.platform_name || game.original_platform_id.toUpperCase()}</span>
                      </div>

                      <div
                        className={`shelf-card-type-badge ${
                          game.is_emulator ? "type-emulator" : "type-recomp"
                        }`}
                      >
                        {game.is_emulator ? "EMU" : "PC"}
                      </div>

                      {game.is_running && (
                        <div className="shelf-card-running">
                          <span className="running-dot" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </>
      ) : (
        /* EMBEDDED CONSOLE VIEWS (REPLAY & RETROACHIEVEMENTS) */
        <div className="big-picture-content-view">
          {activeTab === "replay" && (
            <div className="big-picture-scroll-container">
              <ReplayView
                onBackToLibrary={() => setActiveTab("library")}
                games={games}
                platforms={platforms}
              />
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="big-picture-scroll-container">
              <RetroAchievementsView
                games={games}
                initialGame={achievementsTargetGame || selectedGame}
                raUsername={raUsername}
                raApiKey={raApiKey}
                onBackToLibrary={() => setActiveTab("library")}
                onOpenSettings={onOpenSettings}
              />
            </div>
          )}
        </div>
      )}

      {/* GAMEPAD / KEYBOARD HINTS FOOTER */}
      <footer className="big-picture-footer">
        {activeTab === "library" ? (
          <>
            <div className="gamepad-hint-item">
              <span className="hint-btn">{prompts.select}</span>
              <span>Iniciar</span>
            </div>
            <div className="gamepad-hint-item">
              <span className="hint-btn">{prompts.details} / X</span>
              <span>Detalhes & Gerenciar</span>
            </div>
            <div className="gamepad-hint-item">
              <span className="hint-btn">{prompts.favorite} / F</span>
              <span>Favorito</span>
            </div>
            <div className="gamepad-hint-item">
              <span className="hint-btn">
                {prompts.bumperL} / {prompts.bumperR}
              </span>
              <span>Mudar Console</span>
            </div>
            <div className="gamepad-hint-item">
              <span className="hint-btn">C</span>
              <span>Configurações</span>
            </div>
            <div className="gamepad-hint-item">
              <span className="hint-btn">/</span>
              <span>Buscar</span>
            </div>
            <div className="gamepad-hint-item">
              <span className="hint-btn">{prompts.back} / ESC</span>
              <span>Sair</span>
            </div>
          </>
        ) : (
          <>
            <div className="gamepad-hint-item">
              <span className="hint-btn">{prompts.back} / ESC</span>
              <span>Voltar para a Biblioteca</span>
            </div>
            <div className="gamepad-hint-item">
              <span className="hint-btn">C</span>
              <span>Configurações</span>
            </div>
          </>
        )}
      </footer>
    </div>
  );
};

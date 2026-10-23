import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Square,
  Clock,
  Gamepad2,
  Star,
  CheckCircle2,
} from "lucide-react";
import { Game, Platform, ControllerPromptType, ThemeType, BigPictureTheme } from "../types";
import { formatPlaytime, formatImageUrl } from "../services/api";
import { ConsoleIcon } from "./ConsoleIcon";
import { ControllerPromptBadge } from "./ControllerButton";

export const BP_THEMES_METADATA: Record<
  BigPictureTheme,
  {
    id: BigPictureTheme;
    name: string;
    brand: string;
    badgeLabel: string;
    accentColor: string;
    icon: string;
    desc: string;
  }
> = {
  steam: {
    id: "steam",
    name: "Steam Big Picture",
    brand: "Valve • Steam Deck UI",
    badgeLabel: "Steam Deck",
    accentColor: "#00E5FF",
    icon: "steam",
    desc: "Cartazes verticais cinematográficos, estética obsidian e neon ciano",
  },
  xbox: {
    id: "xbox",
    name: "Xbox Series Dashboard",
    brand: "Microsoft • Series X|S",
    badgeLabel: "Xbox Series",
    accentColor: "#00E676",
    icon: "xbox",
    desc: "Tiles com destaque esmeralda e navegação rápida",
  },
  playstation: {
    id: "playstation",
    name: "PlayStation 5 UI",
    brand: "Sony Interactive",
    badgeLabel: "PlayStation 5",
    accentColor: "#00A3FF",
    icon: "ps1",
    desc: "Arte de tela cheia dinâmica e visual cósmico Sony Blue",
  },
  nintendo: {
    id: "nintendo",
    name: "Nintendo Switch Home",
    brand: "Nintendo • Switch OLED",
    badgeLabel: "Switch Home",
    accentColor: "#E60012",
    icon: "switch",
    desc: "Estilo flat limpo, ágil e minimalista",
  },
};

interface BigPictureModeProps {
  games: Game[];
  platforms: Platform[];
  onLaunchGame: (game: Game) => void;
  onStopGame: (game: Game) => void;
  onExitBigPicture: () => void;
  controllerType?: ControllerPromptType;
  theme?: ThemeType;
  bigPictureTheme?: BigPictureTheme;
  onUpdateBigPictureTheme?: (t: BigPictureTheme) => void;
  onToggleFavorite?: (game: Game) => void;
  onOpenSettings?: () => void;
  onOpenAddGame?: () => void;
  onOpenBatchImport?: () => void;
  onOpenGameDetails?: (game: Game) => void;
  raUsername?: string;
  raApiKey?: string;
}

// Synthesized Audio Context for console UI feedback adapted to each console theme
let audioCtx: AudioContext | null = null;
const playSound = (type: "move" | "select" | "back", bpTheme: BigPictureTheme = "steam") => {
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

    if (bpTheme === "nintendo") {
      if (type === "move") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.02);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        osc.start(now);
        osc.stop(now + 0.025);
      } else if (type === "select") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(950, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.06);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } else {
      if (type === "move") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.035);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === "select") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.07);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.start(now);
        osc.stop(now + 0.07);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    }
  } catch (e) {
    // Audio context not allowed or unsupported
  }
};

export const BigPictureMode: React.FC<BigPictureModeProps> = ({
  games,
  platforms,
  onLaunchGame,
  onStopGame,
  onExitBigPicture,
  controllerType = "xbox",
  bigPictureTheme = "steam",
  onUpdateBigPictureTheme,
  onToggleFavorite,
  onOpenGameDetails,
}) => {
  // Navigation State
  const [currentBpTheme, setCurrentBpTheme] = useState<BigPictureTheme>(bigPictureTheme);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "recomp" | "emulator">("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus Zones: "filters" | "shelf" | "actions"
  const [focusZone, setFocusZone] = useState<"filters" | "shelf" | "actions">("shelf");
  const [actionFocusIndex, setActionFocusIndex] = useState(0); // 0: Play, 1: Details, 2: Fav

  // Filter Focus Index
  const [filterFocusIndex, setFilterFocusIndex] = useState(0);

  // UI Information State
  const [gamepadName, setGamepadName] = useState<string | null>(null);
  const [clock, setClock] = useState("");

  const carouselRef = useRef<HTMLDivElement>(null);
  const filterPillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastButtonPress = useRef<number>(0);

  const activeBpTheme = BP_THEMES_METADATA[currentBpTheme] || BP_THEMES_METADATA.steam;

  const playThemeSound = (type: "move" | "select" | "back") => {
    playSound(type, currentBpTheme);
  };

  // Filtered games
  const filteredGames = useMemo(() => {
    return games
      .filter((game) => {
        const matchesPlatform =
          selectedPlatformId === null || game.original_platform_id === selectedPlatformId;
        const matchesType =
          filterMode === "all" ||
          (filterMode === "recomp" && !game.is_emulator) ||
          (filterMode === "emulator" && Boolean(game.is_emulator));
        const matchesFav = !onlyFavorites || Boolean(game.is_favorite);
        return matchesPlatform && matchesType && matchesFav;
      })
      .sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  }, [games, selectedPlatformId, filterMode, onlyFavorites]);

  const selectedGame: Game | undefined = filteredGames[selectedIndex];

  // List of filter pill items
  type FilterPill =
    | { type: "all"; label: string; count: number }
    | { type: "recomp"; label: string; count: number }
    | { type: "emulator"; label: string; count: number }
    | { type: "favorites"; label: string; count: number }
    | { type: "platform"; id: string; label: string; count: number; color?: string };

  const filterPills = useMemo<FilterPill[]>(() => {
    const list: FilterPill[] = [
      { type: "all", label: "Todos", count: games.length },
      { type: "recomp", label: "Recomps PC", count: games.filter((g) => !g.is_emulator).length },
      { type: "emulator", label: "Emulados", count: games.filter((g) => Boolean(g.is_emulator)).length },
      { type: "favorites", label: "Favoritos", count: games.filter((g) => Boolean(g.is_favorite)).length },
    ];
    platforms
      .filter((p) => p.is_enabled)
      .forEach((p) => {
        const count = games.filter((g) => g.original_platform_id === p.id).length;
        if (count > 0) {
          list.push({ type: "platform", id: p.id, label: p.short_name, count, color: p.brand_color });
        }
      });
    return list;
  }, [games, platforms]);

  // Clock tick
  useEffect(() => {
    const updateTime = () => {
      setClock(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Center selected shelf card
  useEffect(() => {
    if (carouselRef.current && filteredGames.length > 0) {
      const activeCard = carouselRef.current.children[selectedIndex] as HTMLElement;
      if (activeCard) {
        activeCard.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [selectedIndex, filteredGames.length]);

  // Cycle Dashboard Themes (Start / Menu button shortcut)
  const cycleTheme = () => {
    const themes: BigPictureTheme[] = ["steam", "xbox", "playstation", "nintendo"];
    const nextIdx = (themes.indexOf(currentBpTheme) + 1) % themes.length;
    const nextTheme = themes[nextIdx];
    setCurrentBpTheme(nextTheme);
    if (onUpdateBigPictureTheme) onUpdateBigPictureTheme(nextTheme);
    playThemeSound("select");
  };

  // Apply selected filter
  const applyFilter = (pill: FilterPill) => {
    playThemeSound("select");
    if (pill.type === "all") {
      setSelectedPlatformId(null);
      setFilterMode("all");
      setOnlyFavorites(false);
    } else if (pill.type === "recomp") {
      setSelectedPlatformId(null);
      setFilterMode("recomp");
      setOnlyFavorites(false);
    } else if (pill.type === "emulator") {
      setSelectedPlatformId(null);
      setFilterMode("emulator");
      setOnlyFavorites(false);
    } else if (pill.type === "favorites") {
      setSelectedPlatformId(null);
      setFilterMode("all");
      setOnlyFavorites(true);
    } else if (pill.type === "platform") {
      setSelectedPlatformId(pill.id);
      setFilterMode("all");
      setOnlyFavorites(false);
    }
    setSelectedIndex(0);
    setFocusZone("shelf");
  };

  // 100% Gamepad Polling Loop (Standard Gamepad API)
  useEffect(() => {
    let animId: number;

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let pad: Gamepad | null = null;
      for (const gp of gamepads) {
        if (gp && gp.connected) {
          pad = gp;
          break;
        }
      }

      if (pad) {
        const name = pad.id.includes("Xbox")
          ? "Xbox Controller"
          : pad.id.includes("DualSense") || pad.id.includes("Wireless")
          ? "PlayStation Controller"
          : "Gamepad Conectado";
        setGamepadName(name);

        const now = Date.now();
        // 175ms input debounce for snappy navigation
        if (now - lastButtonPress.current > 175) {
          const dpadLeft = pad.buttons[14]?.pressed || pad.axes[0] < -0.5;
          const dpadRight = pad.buttons[15]?.pressed || pad.axes[0] > 0.5;
          const dpadUp = pad.buttons[12]?.pressed || pad.axes[1] < -0.5;
          const dpadDown = pad.buttons[13]?.pressed || pad.axes[1] > 0.5;

          const btnA = pad.buttons[0]?.pressed;      // Confirm / Launch
          const btnB = pad.buttons[1]?.pressed;      // Back / Exit
          const btnX = pad.buttons[2]?.pressed;      // Favorite Toggle
          const btnY = pad.buttons[3]?.pressed;      // Game Details
          const btnLB = pad.buttons[4]?.pressed;     // Prev Filter
          const btnRB = pad.buttons[5]?.pressed;     // Next Filter
          const btnStart = pad.buttons[9]?.pressed;  // Cycle Theme
          const btnGuide = pad.buttons[16]?.pressed; // Home Exit

          if (btnGuide) {
            lastButtonPress.current = now;
            onExitBigPicture();
            return;
          }

          if (btnStart) {
            lastButtonPress.current = now;
            cycleTheme();
            return;
          }

          // LB / RB quick filter cycling
          if (btnLB) {
            lastButtonPress.current = now;
            playThemeSound("move");
            setFilterFocusIndex((prev) => {
              const next = Math.max(0, prev - 1);
              applyFilter(filterPills[next]);
              return next;
            });
            return;
          } else if (btnRB) {
            lastButtonPress.current = now;
            playThemeSound("move");
            setFilterFocusIndex((prev) => {
              const next = Math.min(filterPills.length - 1, prev + 1);
              applyFilter(filterPills[next]);
              return next;
            });
            return;
          }

          // X Button: Toggle Favorite
          if (btnX && selectedGame && onToggleFavorite) {
            lastButtonPress.current = now;
            playThemeSound("select");
            onToggleFavorite(selectedGame);
            return;
          }

          // Y Button: Open Details
          if (btnY && selectedGame && onOpenGameDetails) {
            lastButtonPress.current = now;
            playThemeSound("select");
            onOpenGameDetails(selectedGame);
            return;
          }

          // B Button: Back / Exit
          if (btnB) {
            lastButtonPress.current = now;
            playThemeSound("back");
            if (focusZone === "filters" || focusZone === "actions") {
              setFocusZone("shelf");
            } else {
              onExitBigPicture();
            }
            return;
          }

          // Zone Navigation Logic
          if (focusZone === "filters") {
            if (dpadLeft) {
              lastButtonPress.current = now;
              playThemeSound("move");
              setFilterFocusIndex((prev) => Math.max(0, prev - 1));
            } else if (dpadRight) {
              lastButtonPress.current = now;
              playThemeSound("move");
              setFilterFocusIndex((prev) => Math.min(filterPills.length - 1, prev + 1));
            } else if (dpadDown) {
              lastButtonPress.current = now;
              playThemeSound("move");
              setFocusZone("shelf");
            } else if (btnA) {
              lastButtonPress.current = now;
              applyFilter(filterPills[filterFocusIndex]);
            }
          } else if (focusZone === "actions") {
            if (dpadLeft) {
              lastButtonPress.current = now;
              playThemeSound("move");
              setActionFocusIndex((prev) => Math.max(0, prev - 1));
            } else if (dpadRight) {
              lastButtonPress.current = now;
              playThemeSound("move");
              setActionFocusIndex((prev) => Math.min(2, prev + 1));
            } else if (dpadDown) {
              lastButtonPress.current = now;
              playThemeSound("move");
              setFocusZone("shelf");
            } else if (btnA && selectedGame) {
              lastButtonPress.current = now;
              playThemeSound("select");
              if (actionFocusIndex === 0) {
                if (selectedGame.is_running) onStopGame(selectedGame);
                else onLaunchGame(selectedGame);
              } else if (actionFocusIndex === 1 && onOpenGameDetails) {
                onOpenGameDetails(selectedGame);
              } else if (actionFocusIndex === 2 && onToggleFavorite) {
                onToggleFavorite(selectedGame);
              }
            }
          } else {
            // focusZone === "shelf"
            if (dpadLeft) {
              lastButtonPress.current = now;
              playThemeSound("move");
              setSelectedIndex((prev) => Math.max(0, prev - 1));
            } else if (dpadRight) {
              lastButtonPress.current = now;
              playThemeSound("move");
              setSelectedIndex((prev) => Math.min(filteredGames.length - 1, prev + 1));
            } else if (dpadUp) {
              lastButtonPress.current = now;
              playThemeSound("move");
              setFocusZone("actions");
            } else if (btnA && selectedGame) {
              lastButtonPress.current = now;
              playThemeSound("select");
              if (selectedGame.is_running) {
                onStopGame(selectedGame);
              } else {
                onLaunchGame(selectedGame);
              }
            }
          }
        }
      } else {
        setGamepadName(null);
      }

      animId = requestAnimationFrame(pollGamepad);
    };

    animId = requestAnimationFrame(pollGamepad);
    return () => cancelAnimationFrame(animId);
  }, [
    focusZone,
    filterFocusIndex,
    actionFocusIndex,
    selectedIndex,
    filteredGames,
    selectedGame,
    filterPills,
    currentBpTheme,
  ]);

  // Keyboard Navigation Fallback (Arrow Keys, Enter, Esc, Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        playThemeSound("back");
        if (focusZone !== "shelf") setFocusZone("shelf");
        else onExitBigPicture();
        return;
      }

      if (e.key === "ArrowLeft") {
        playThemeSound("move");
        if (focusZone === "filters") {
          setFilterFocusIndex((prev) => Math.max(0, prev - 1));
        } else if (focusZone === "actions") {
          setActionFocusIndex((prev) => Math.max(0, prev - 1));
        } else {
          setSelectedIndex((prev) => Math.max(0, prev - 1));
        }
      } else if (e.key === "ArrowRight") {
        playThemeSound("move");
        if (focusZone === "filters") {
          setFilterFocusIndex((prev) => Math.min(filterPills.length - 1, prev + 1));
        } else if (focusZone === "actions") {
          setActionFocusIndex((prev) => Math.min(2, prev + 1));
        } else {
          setSelectedIndex((prev) => Math.min(filteredGames.length - 1, prev + 1));
        }
      } else if (e.key === "ArrowUp") {
        playThemeSound("move");
        if (focusZone === "shelf") setFocusZone("actions");
        else if (focusZone === "actions") setFocusZone("filters");
      } else if (e.key === "ArrowDown") {
        playThemeSound("move");
        if (focusZone === "filters") setFocusZone("actions");
        else if (focusZone === "actions") setFocusZone("shelf");
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        playThemeSound("select");
        if (focusZone === "filters") {
          applyFilter(filterPills[filterFocusIndex]);
        } else if (focusZone === "actions" && selectedGame) {
          if (actionFocusIndex === 0) {
            if (selectedGame.is_running) onStopGame(selectedGame);
            else onLaunchGame(selectedGame);
          } else if (actionFocusIndex === 1 && onOpenGameDetails) {
            onOpenGameDetails(selectedGame);
          } else if (actionFocusIndex === 2 && onToggleFavorite) {
            onToggleFavorite(selectedGame);
          }
        } else if (selectedGame) {
          if (selectedGame.is_running) onStopGame(selectedGame);
          else onLaunchGame(selectedGame);
        }
      } else if (e.key === "f" || e.key === "F") {
        if (selectedGame && onToggleFavorite) {
          playThemeSound("select");
          onToggleFavorite(selectedGame);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusZone, filterFocusIndex, actionFocusIndex, selectedIndex, selectedGame, filterPills]);

  const platformColor = selectedGame?.platform_brand_color || activeBpTheme.accentColor;

  return (
    <div className="bp-root">
      {/* 1 · ARTWORK BACKDROP WITH AMBIENT BLUR */}
      <div className="bp-backdrop">
        {selectedGame?.banner_url || selectedGame?.cover_url ? (
          <img
            src={formatImageUrl(selectedGame.banner_url || selectedGame.cover_url)}
            alt=""
            className="bp-backdrop-image"
          />
        ) : null}
        <div className="bp-backdrop-overlay" />
      </div>

      {/* 2 · TOP CONSOLE HUD */}
      <header className="bp-hud">
        <div className="bp-hud-brand">
          <div className="bp-hud-logo" style={{ background: activeBpTheme.accentColor }}>
            <ConsoleIcon iconName={activeBpTheme.icon} size={20} color="#06090e" />
          </div>
          <span className="bp-hud-title">{activeBpTheme.name}</span>

          {/* Theme Cycler Pill */}
          <div
            className="bp-dashboard-badge"
            onClick={cycleTheme}
            title="Aperte START / MENU no controle para alternar o layout do console"
          >
            <span>Tema: {activeBpTheme.badgeLabel}</span>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: activeBpTheme.accentColor,
                boxShadow: `0 0 8px ${activeBpTheme.accentColor}`,
              }}
            />
          </div>
        </div>

        <div className="bp-hud-status">
          <div className="bp-gamepad-indicator">
            <Gamepad2 size={16} color={gamepadName ? "var(--color-success)" : "var(--color-text-muted)"} />
            <span>{gamepadName || "Teclado / Joystick"}</span>
          </div>
          <div className="bp-clock">{clock}</div>
        </div>
      </header>

      {/* 3 · QUICK FILTER BAR (LB / RB to cycle) */}
      <div className="bp-filter-bar thin-scrollbar">
        {filterPills.map((pill, idx) => {
          const isFocused = focusZone === "filters" && filterFocusIndex === idx;
          const isActive =
            (pill.type === "all" && filterMode === "all" && selectedPlatformId === null && !onlyFavorites) ||
            (pill.type === "recomp" && filterMode === "recomp" && selectedPlatformId === null && !onlyFavorites) ||
            (pill.type === "emulator" && filterMode === "emulator" && selectedPlatformId === null && !onlyFavorites) ||
            (pill.type === "favorites" && onlyFavorites) ||
            (pill.type === "platform" && selectedPlatformId === pill.id);

          return (
            <button
              key={idx}
              ref={(el) => {
                filterPillRefs.current[idx] = el;
              }}
              type="button"
              className={`bp-filter-pill ${isActive ? "active" : ""} ${isFocused ? "focused" : ""}`}
              onClick={() => applyFilter(pill)}
            >
              <span>{pill.label}</span>
              <span style={{ opacity: 0.7, fontSize: "0.72rem" }}>({pill.count})</span>
            </button>
          );
        })}
      </div>

      {/* 4 · CENTER STAGE: FOCUSED HERO SHOWCASE */}
      <main className="bp-stage">
        {selectedGame ? (
          <div className="bp-stage-info">
            <div className="bp-stage-chips">
              <span
                className="badge"
                style={{
                  background: "rgba(0, 0, 0, 0.75)",
                  borderColor: platformColor,
                  color: platformColor,
                  padding: "4px 12px",
                  fontSize: "0.8rem",
                }}
              >
                <ConsoleIcon
                  platformId={selectedGame.original_platform_id}
                  name={selectedGame.platform_name}
                  size={15}
                  color={platformColor}
                />
                <span>{selectedGame.platform_name || selectedGame.original_platform_id.toUpperCase()}</span>
                <span style={{ opacity: 0.6 }}>•</span>
                <span>{selectedGame.is_emulator ? "EMULADOR" : "RECOMP PC"}</span>
              </span>

              {selectedGame.is_favorite && (
                <span className="badge" style={{ background: "rgba(255, 184, 0, 0.2)", color: "#FFD54F", borderColor: "#FFB800" }}>
                  <Star size={13} fill="currentColor" />
                  <span>Favorito</span>
                </span>
              )}

              {selectedGame.play_status === "completed" && (
                <span className="badge badge-completed">Zerado</span>
              )}
            </div>

            <h1 className="bp-stage-title">{selectedGame.title}</h1>

            <div className="bp-stage-meta">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Clock size={16} color="var(--color-accent)" />
                <span>Tempo Jogado: <strong>{formatPlaytime(selectedGame.total_playtime_seconds)}</strong></span>
              </div>
              {selectedGame.last_played_at && (
                <span>Última vez: {new Date(selectedGame.last_played_at).toLocaleDateString("pt-BR")}</span>
              )}
            </div>

            {/* ACTION BUTTONS (Selectable via D-Pad Up / Down) */}
            <div className="bp-stage-actions">
              {/* Play Button */}
              {selectedGame.is_running ? (
                <button
                  type="button"
                  className={`bp-btn-stop ${focusZone === "actions" && actionFocusIndex === 0 ? "focused" : ""}`}
                  onClick={() => onStopGame(selectedGame)}
                >
                  <Square size={20} fill="currentColor" />
                  <ControllerPromptBadge controllerType={controllerType} action="select" size={20} />
                  <span>ENCERRAR JOGO</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={`bp-btn-play ${focusZone === "actions" && actionFocusIndex === 0 ? "focused" : ""}`}
                  onClick={() => onLaunchGame(selectedGame)}
                >
                  <Play size={22} fill="currentColor" />
                  <ControllerPromptBadge controllerType={controllerType} action="select" size={20} />
                  <span>JOGAR</span>
                </button>
              )}

              {/* Details & Manage */}
              {onOpenGameDetails && (
                <button
                  type="button"
                  className={`bp-btn-action ${focusZone === "actions" && actionFocusIndex === 1 ? "focused" : ""}`}
                  onClick={() => onOpenGameDetails(selectedGame)}
                >
                  <ControllerPromptBadge controllerType={controllerType} action="details" size={18} />
                  <span>Detalhes & Saves</span>
                </button>
              )}

              {/* Toggle Favorite */}
              {onToggleFavorite && (
                <button
                  type="button"
                  className={`bp-btn-action ${focusZone === "actions" && actionFocusIndex === 2 ? "focused" : ""}`}
                  onClick={() => onToggleFavorite(selectedGame)}
                >
                  <ControllerPromptBadge controllerType={controllerType} action="favorite" size={18} />
                  <Star size={16} fill={selectedGame.is_favorite ? "currentColor" : "none"} />
                  <span>{selectedGame.is_favorite ? "Favoritado" : "Favoritar"}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--color-text-muted)" }}>
            <Gamepad2 size={64} style={{ opacity: 0.4, marginBottom: "16px" }} />
            <h2>Nenhum jogo nesta categoria</h2>
          </div>
        )}

        {/* 5 · HORIZONTAL POSTER CAROUSEL (Game card shelf) */}
        <div className="bp-shelf">
          <div className="bp-shelf-track thin-scrollbar" ref={carouselRef}>
            {filteredGames.map((game, idx) => {
              const isSelected = idx === selectedIndex;
              const gColor = game.platform_brand_color || "var(--color-accent)";

              return (
                <div
                  key={game.id}
                  className={`bp-card ${isSelected && focusZone === "shelf" ? "focused" : ""}`}
                  onClick={() => {
                    playThemeSound("move");
                    setSelectedIndex(idx);
                    setFocusZone("shelf");
                  }}
                  onDoubleClick={() => onLaunchGame(game)}
                  style={{
                    ["--card-accent" as any]: gColor,
                  }}
                >
                  {/* Card Artwork */}
                  <div className="bp-card-media">
                    {game.cover_url ? (
                      <img src={formatImageUrl(game.cover_url)} alt={game.title} loading="lazy" />
                    ) : (
                      <div className="bp-card-fallback">
                        <Gamepad2 size={42} color={gColor} />
                        <span className="bp-card-fallback-title">{game.title}</span>
                      </div>
                    )}
                    {/* Top edge glass gloss highlight */}
                    <div className="bp-card-sheen" />
                  </div>

                  {/* Top Badges Bar */}
                  <div className="bp-card-topbar">
                    <div
                      className="bp-card-platform-badge"
                      style={{
                        borderColor: `${gColor}60`,
                        background: "rgba(0, 0, 0, 0.75)",
                      }}
                      title={game.platform_name || game.original_platform_id}
                    >
                      <ConsoleIcon
                        platformId={game.original_platform_id}
                        iconName={!game.is_emulator ? "recomp" : undefined}
                        size={15}
                        color={gColor}
                      />
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {game.is_favorite && (
                        <div className="bp-card-mini-badge bp-badge-fav" title="Favorito">
                          <Star size={11} fill="currentColor" />
                        </div>
                      )}
                      {game.play_status === "completed" && (
                        <div className="bp-card-mini-badge bp-badge-completed" title="Zerado">
                          <CheckCircle2 size={11} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Running Status Tag */}
                  {game.is_running && (
                    <div className="bp-card-running-pill">
                      <span className="bp-running-dot" />
                      <span>EM EXECUÇÃO</span>
                    </div>
                  )}

                  {/* Bottom Title & Meta Scrim Footer */}
                  <div className="bp-card-footer">
                    <span className="bp-card-title">{game.title}</span>
                    <div className="bp-card-submeta">
                      <span className="bp-card-platform-name">{game.platform_name || game.original_platform_id.toUpperCase()}</span>
                      {game.total_playtime_seconds > 0 && (
                        <span className="bp-card-playtime">
                          {formatPlaytime(game.total_playtime_seconds)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 6 · CONTROLLER PROMPTS FOOTER */}
      <footer className="bp-footer">
        <div className="bp-hint-item">
          <ControllerPromptBadge controllerType={controllerType} action="select" size={20} />
          <span>Jogar / Selecionar</span>
        </div>

        <div className="bp-hint-item">
          <ControllerPromptBadge controllerType={controllerType} action="back" size={20} />
          <span>Voltar / Sair</span>
        </div>

        <div className="bp-hint-item">
          <ControllerPromptBadge controllerType={controllerType} action="favorite" size={20} />
          <span>Favoritar</span>
        </div>

        <div className="bp-hint-item">
          <ControllerPromptBadge controllerType={controllerType} action="details" size={20} />
          <span>Detalhes</span>
        </div>

        <div className="bp-hint-item">
          <span style={{ display: "inline-flex", gap: "4px" }}>
            <ControllerPromptBadge controllerType={controllerType} action="triggerL" size={20} />
            <ControllerPromptBadge controllerType={controllerType} action="triggerR" size={20} />
          </span>
          <span>Filtro de Console</span>
        </div>

        <div className="bp-hint-item">
          <span style={{ fontSize: "0.75rem", background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
            START / MENU
          </span>
          <span>Trocar Tema</span>
        </div>
      </footer>
    </div>
  );
};

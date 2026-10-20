import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Square,
  Clock,
  Gamepad2,
  X,
  Trophy,
  Star,
  Search,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Game, Platform, ControllerPromptType, ThemeType, BigPictureTheme } from "../types";
import { formatPlaytime, formatImageUrl } from "../services/api";
import { ReplayView } from "./ReplayView";
import { RetroAchievementsView } from "./RetroAchievementsView";
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
    guideName: string;
  }
> = {
  steam: {
    id: "steam",
    name: "Steam Big Picture",
    brand: "Valve • Steam Deck UI",
    badgeLabel: "Steam Deck",
    accentColor: "#00E5FF",
    icon: "steam",
    desc: "Cartazes verticais cinematográficos, estética obsidian moderna e neon ciano",
    guideName: "GAMINGZONE DECK",
  },
  xbox: {
    id: "xbox",
    name: "Xbox Series Dashboard",
    brand: "Microsoft • Series X|S",
    badgeLabel: "Xbox Series",
    accentColor: "#00E676",
    icon: "xbox",
    desc: "Tiles quadrados e retangulares com anel verde esmeralda icônico e Xbox Guide",
    guideName: "XBOX GUIDE",
  },
  playstation: {
    id: "playstation",
    name: "PlayStation 5 UI",
    brand: "Sony Interactive",
    badgeLabel: "PlayStation 5",
    accentColor: "#00A3FF",
    icon: "ps1",
    desc: "Arte de tela cheia dinâmica, cartões compactos e visual cósmico Sony Blue",
    guideName: "PLAYSTATION HOME",
  },
  nintendo: {
    id: "nintendo",
    name: "Nintendo Switch Home",
    brand: "Nintendo • Switch OLED",
    badgeLabel: "Switch Home",
    accentColor: "#E60012",
    icon: "switch",
    desc: "Fileira de cartuchos 1:1 quadrados, estilo flat limpo, ágil e minimalista",
    guideName: "NINTENDO SWITCH",
  },
};

export const THEME_METADATA: Record<
  ThemeType,
  { name: string; label: string; accentColor: string; desc: string }
> = {
  midnight: {
    name: "Midnight Cyan",
    label: "Midnight",
    accentColor: "#00E5FF",
    desc: "Obsidian com neon ciano",
  },
  cyberpunk: {
    name: "Cyberpunk 2077",
    label: "Cyberpunk",
    accentColor: "#FCEE0A",
    desc: "Amarelo Night City e neon futurista",
  },
  "retro-arcade": {
    name: "Retro Arcade 8-Bit",
    label: "Retro Arcade",
    accentColor: "#FFE600",
    desc: "Nostalgia fliperama arcade",
  },
  synthwave: {
    name: "Synthwave Outrun",
    label: "Synthwave",
    accentColor: "#FF2A85",
    desc: "Estética anos 80 e neon magenta",
  },
  playstation: {
    name: "PlayStation Heritage",
    label: "PlayStation",
    accentColor: "#006FCD",
    desc: "Azul de console clássico PlayStation",
  },
  gameboy: {
    name: "Game Boy Classic",
    label: "Game Boy",
    accentColor: "#9BBC0F",
    desc: "Monocromático dot-matrix LCD",
  },
  famicom: {
    name: "Famicom & Nintendo",
    label: "Famicom",
    accentColor: "#E52521",
    desc: "Vermelho e dourado clássico Famicom",
  },
  pipboy: {
    name: "Fallout Pip-Boy",
    label: "Pip-Boy",
    accentColor: "#FFB000",
    desc: "Terminal CRT fósforo âmbar",
  },
  "cyber-violet": {
    name: "Cyber Violet",
    label: "Cyber Violet",
    accentColor: "#B347FF",
    desc: "Púrpura e violeta elétrico",
  },
  emerald: {
    name: "Emerald Matrix",
    label: "Emerald",
    accentColor: "#00E676",
    desc: "Verde esmeralda cyber matrix",
  },
  crimson: {
    name: "Crimson Blood",
    label: "Crimson",
    accentColor: "#FF2A55",
    desc: "Charcoal escuro e vermelho rubi",
  },
  "high-contrast": {
    name: "OLED High Contrast",
    label: "OLED",
    accentColor: "#00FFFF",
    desc: "Preto puro OLED e ciano",
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
      // Nintendo Switch signature crisp click/pop
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
    } else if (bpTheme === "xbox") {
      // Xbox Series X deep resonant pulse
      if (type === "move") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.05);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "select") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.09);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      }
    } else if (bpTheme === "playstation") {
      // PS5 ethereal crystal dual-tone
      if (type === "move") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.045);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.start(now);
        osc.stop(now + 0.045);
      } else if (type === "select") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.exponentialRampToValueAtTime(1320, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.05);
        gain.gain.setValueAtTime(0.07, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
    } else {
      // Steam Big Picture standard
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
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      }
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
  theme = "midnight",
  bigPictureTheme = "steam",
  onUpdateBigPictureTheme,
  onToggleFavorite,
  onOpenSettings,
  onOpenGameDetails,
  raUsername,
  raApiKey,
}) => {
  const [currentBpTheme, setCurrentBpTheme] = useState<BigPictureTheme>(bigPictureTheme);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [themeModalFocusIndex, setThemeModalFocusIndex] = useState(0);

  useEffect(() => {
    setCurrentBpTheme(bigPictureTheme);
  }, [bigPictureTheme]);

  const activeBpTheme = BP_THEMES_METADATA[currentBpTheme] || BP_THEMES_METADATA.steam;

  const playThemeSound = (type: "move" | "select" | "back") => {
    playSound(type, currentBpTheme);
  };

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

  // Joystick & Controller Spatial Focus Management
  const [focusZone, setFocusZone] = useState<"shelf" | "filters" | "header">("shelf");
  const [headerFocusIndex, setHeaderFocusIndex] = useState(0);
  const [filterFocusIndex, setFilterFocusIndex] = useState(0);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const filterPillRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const lastButtonPress = useRef<number>(0);

  // Counts
  const recompCount = useMemo(() => games.filter((g) => !g.is_emulator).length, [games]);
  const emulatorCount = useMemo(() => games.filter((g) => Boolean(g.is_emulator)).length, [games]);
  const favoritesCount = useMemo(() => games.filter((g) => Boolean(g.is_favorite)).length, [games]);

  // Available actions in the top-right console HUD
  type HeaderActionId = "search" | "theme" | "exit";
  const availableHeaderActions = useMemo<HeaderActionId[]>(() => {
    return ["search", "theme", "exit"];
  }, []);

  // Dynamic list of available filter pills in the Sub-HUD
  type FilterPillItem =
    | { type: "all" }
    | { type: "recomp" }
    | { type: "emulator" }
    | { type: "favorites" }
    | { type: "platform"; id: string };

  const filterPills = useMemo<FilterPillItem[]>(() => {
    const items: FilterPillItem[] = [
      { type: "all" },
      { type: "recomp" },
      { type: "emulator" },
      { type: "favorites" },
    ];
    platforms
      .filter((p) => p.is_enabled)
      .forEach((p) => {
        items.push({ type: "platform", id: p.id });
      });
    return items;
  }, [platforms]);

  // Clamp focus indices
  useEffect(() => {
    if (headerFocusIndex >= availableHeaderActions.length) {
      setHeaderFocusIndex(Math.max(0, availableHeaderActions.length - 1));
    }
  }, [availableHeaderActions.length, headerFocusIndex]);

  useEffect(() => {
    if (filterFocusIndex >= filterPills.length) {
      setFilterFocusIndex(Math.max(0, filterPills.length - 1));
    }
  }, [filterPills.length, filterFocusIndex]);

  // Auto-scroll focused filter pill into view
  useEffect(() => {
    if (focusZone === "filters" && filterPillRefs.current[filterFocusIndex]) {
      filterPillRefs.current[filterFocusIndex]?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [focusZone, filterFocusIndex]);

  // Execute Header Action
  const triggerHeaderAction = (action: HeaderActionId) => {
    playThemeSound("select");
    switch (action) {
      case "search":
        setIsSearchOpen((prev) => {
          const next = !prev;
          if (next) {
            setTimeout(() => searchInputRef.current?.focus(), 60);
          }
          return next;
        });
        if (activeTab !== "library") setActiveTab("library");
        break;
      case "theme":
        const bpThemes: BigPictureTheme[] = ["steam", "xbox", "playstation", "nintendo"];
        const currentIdx = bpThemes.indexOf(currentBpTheme);
        setThemeModalFocusIndex(currentIdx !== -1 ? currentIdx : 0);
        setIsThemeModalOpen(true);
        break;
      case "exit":
        onExitBigPicture();
        break;
    }
  };

  // Apply Filter Pill
  const applyFilterPill = (index: number) => {
    const item = filterPills[index];
    if (!item) return;
    playSound("select");
    if (item.type === "all") {
      setSelectedPlatformId(null);
      setFilterMode("all");
      setOnlyFavorites(false);
      setSelectedIndex(0);
    } else if (item.type === "recomp") {
      setSelectedPlatformId(null);
      setFilterMode("recomp");
      setOnlyFavorites(false);
      setSelectedIndex(0);
    } else if (item.type === "emulator") {
      setSelectedPlatformId(null);
      setFilterMode("emulator");
      setOnlyFavorites(false);
      setSelectedIndex(0);
    } else if (item.type === "favorites") {
      setOnlyFavorites((prev) => !prev);
      setSelectedIndex(0);
    } else if (item.type === "platform") {
      setSelectedPlatformId(item.id);
      setFilterMode("all");
      setOnlyFavorites(false);
      setSelectedIndex(0);
    }
  };

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

  // Tab Navigation for Big Picture (L2 / R2 / LT / RT / ZL / ZR / PageUp / PageDown)
  const cycleTab = (direction: number) => {
    const tabs: ("library" | "replay" | "achievements")[] = ["library", "replay", "achievements"];
    const currentIdx = tabs.indexOf(activeTab);
    let nextIdx = currentIdx + direction;
    if (nextIdx < 0) nextIdx = tabs.length - 1;
    if (nextIdx >= tabs.length) nextIdx = 0;
    const target = tabs[nextIdx];
    playSound("select");
    if (target === "achievements") {
      setAchievementsTargetGame(filteredGames[selectedIndex] || null);
    }
    setActiveTab(target);
  };

  // Platform cycling (LB / RB / D-Pad Up / Down)
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
          const btnLT = Boolean(
            activePad.buttons[6]?.pressed ||
            (typeof activePad.buttons[6]?.value === "number" && activePad.buttons[6].value > 0.4)
          );
          const btnRT = Boolean(
            activePad.buttons[7]?.pressed ||
            (typeof activePad.buttons[7]?.value === "number" && activePad.buttons[7].value > 0.4)
          );
          const btnBack = activePad.buttons[8]?.pressed;
          const btnStart = activePad.buttons[9]?.pressed;
          const btnGuide = activePad.buttons[16]?.pressed;

          // Gamepad Navigation inside Theme Selection Modal
          if (isThemeModalOpen) {
            const bpThemes: BigPictureTheme[] = ["steam", "xbox", "playstation", "nintendo"];
            if (dpadLeft) {
              lastButtonPress.current = now;
              playThemeSound("move");
              setThemeModalFocusIndex((prev) => Math.max(0, prev - 1));
            } else if (dpadRight) {
              lastButtonPress.current = now;
              playThemeSound("move");
              setThemeModalFocusIndex((prev) => Math.min(bpThemes.length - 1, prev + 1));
            } else if (btnA) {
              lastButtonPress.current = now;
              const chosen = bpThemes[themeModalFocusIndex];
              if (chosen) {
                playSound("select", chosen);
                setCurrentBpTheme(chosen);
                if (onUpdateBigPictureTheme) onUpdateBigPictureTheme(chosen);
              }
              setIsThemeModalOpen(false);
            } else if (btnB) {
              lastButtonPress.current = now;
              playThemeSound("back");
              setIsThemeModalOpen(false);
            }
            return;
          }

          // L2 / R2 (or LT / RT / ZL / ZR) Primary View Navigation (Works across all tabs)
          if (btnLT) {
            lastButtonPress.current = now;
            cycleTab(-1);
          } else if (btnRT) {
            lastButtonPress.current = now;
            cycleTab(1);
          } else if (btnStart) {
            lastButtonPress.current = now;
            playThemeSound("select");
            const bpThemes: BigPictureTheme[] = ["steam", "xbox", "playstation", "nintendo"];
            const currentIdx = bpThemes.indexOf(currentBpTheme);
            setThemeModalFocusIndex(currentIdx !== -1 ? currentIdx : 0);
            setIsThemeModalOpen(true);
          } else if (btnBack) {
            // View / Select button instantly jumps to top header actions or back to shelf
            lastButtonPress.current = now;
            playSound("move");
            setFocusZone((prev) => (prev === "header" ? "shelf" : "header"));
          } else if (btnGuide) {
            lastButtonPress.current = now;
            onExitBigPicture();
          } else if (focusZone === "header") {
            if (dpadLeft) {
              lastButtonPress.current = now;
              playSound("move");
              setHeaderFocusIndex((prev) => Math.max(0, prev - 1));
            } else if (dpadRight) {
              lastButtonPress.current = now;
              playSound("move");
              setHeaderFocusIndex((prev) => Math.min(availableHeaderActions.length - 1, prev + 1));
            } else if (dpadDown) {
              lastButtonPress.current = now;
              playSound("move");
              if (activeTab === "library") {
                setFocusZone("filters");
              } else {
                setFocusZone("shelf");
              }
            } else if (btnA) {
              lastButtonPress.current = now;
              const action = availableHeaderActions[headerFocusIndex];
              if (action) {
                triggerHeaderAction(action);
              }
            } else if (btnB) {
              lastButtonPress.current = now;
              playSound("back");
              setFocusZone("shelf");
            }
          } else if (focusZone === "filters") {
            if (dpadLeft) {
              lastButtonPress.current = now;
              playSound("move");
              setFilterFocusIndex((prev) => Math.max(0, prev - 1));
            } else if (dpadRight) {
              lastButtonPress.current = now;
              playSound("move");
              setFilterFocusIndex((prev) => Math.min(filterPills.length - 1, prev + 1));
            } else if (dpadUp) {
              lastButtonPress.current = now;
              playSound("move");
              setFocusZone("header");
            } else if (dpadDown || btnB) {
              lastButtonPress.current = now;
              playSound(btnB ? "back" : "move");
              setFocusZone("shelf");
            } else if (btnA) {
              lastButtonPress.current = now;
              applyFilterPill(filterFocusIndex);
            }
          } else {
            // focusZone === "shelf"
            if (activeTab === "library") {
              if (dpadLeft) {
                lastButtonPress.current = now;
                playSound("move");
                setSelectedIndex((prev) => Math.max(0, prev - 1));
              } else if (dpadRight) {
                lastButtonPress.current = now;
                playSound("move");
                setSelectedIndex((prev) => Math.min(filteredGames.length - 1, prev + 1));
              } else if (dpadUp) {
                lastButtonPress.current = now;
                playSound("move");
                setFocusZone("filters");
              } else if (btnLB) {
                lastButtonPress.current = now;
                playSound("move");
                cyclePlatform(-1);
              } else if (btnRB) {
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
              }
            } else {
              // In replay or achievements views
              if (dpadUp) {
                lastButtonPress.current = now;
                playSound("move");
                setFocusZone("header");
              } else if (btnB) {
                lastButtonPress.current = now;
                playSound("back");
                setActiveTab("library");
              }
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
    focusZone,
    headerFocusIndex,
    filterFocusIndex,
    availableHeaderActions,
    filterPills,
    currentBpTheme,
    isThemeModalOpen,
    themeModalFocusIndex,
    onUpdateBigPictureTheme,
    onToggleFavorite,
    onLaunchGame,
    onStopGame,
    onExitBigPicture,
    onOpenGameDetails,
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
          setFocusZone("header");
        } else if (e.key === "ArrowDown") {
          (document.activeElement as HTMLElement)?.blur();
          setFocusZone("shelf");
        }
        return;
      }

      // Keyboard Navigation inside Theme Selection Modal
      if (isThemeModalOpen) {
        const bpThemes: BigPictureTheme[] = ["steam", "xbox", "playstation", "nintendo"];
        if (e.key === "ArrowLeft") {
          playThemeSound("move");
          setThemeModalFocusIndex((prev) => Math.max(0, prev - 1));
        } else if (e.key === "ArrowRight") {
          playThemeSound("move");
          setThemeModalFocusIndex((prev) => Math.min(bpThemes.length - 1, prev + 1));
        } else if (e.key === "Enter") {
          const chosen = bpThemes[themeModalFocusIndex];
          if (chosen) {
            playSound("select", chosen);
            setCurrentBpTheme(chosen);
            if (onUpdateBigPictureTheme) onUpdateBigPictureTheme(chosen);
          }
          setIsThemeModalOpen(false);
        } else if (e.key === "Escape") {
          playThemeSound("back");
          setIsThemeModalOpen(false);
        }
        return;
      }

      // L2 / R2 Keyboard Equivalents (Tab Navigation)
      if (e.key === "PageUp" || e.key === "[" || e.key === "{") {
        e.preventDefault();
        cycleTab(-1);
        return;
      }
      if (e.key === "PageDown" || e.key === "]" || e.key === "}") {
        e.preventDefault();
        cycleTab(1);
        return;
      }
      if (e.key === "1") {
        playSound("select");
        setActiveTab("library");
        return;
      }
      if (e.key === "2") {
        playSound("select");
        setActiveTab("replay");
        return;
      }
      if (e.key === "3") {
        playSound("select");
        setAchievementsTargetGame(filteredGames[selectedIndex] || null);
        setActiveTab("achievements");
        return;
      }

      if (e.key === "Escape") {
        playSound("back");
        if (focusZone !== "shelf") {
          setFocusZone("shelf");
        } else if (activeTab !== "library") {
          setActiveTab("library");
        } else if (isSearchOpen || searchQuery) {
          setIsSearchOpen(false);
          setSearchQuery("");
        } else {
          onExitBigPicture();
        }
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        playSound("move");
        setFocusZone((prev) => {
          if (prev === "shelf") return "filters";
          if (prev === "filters") return "header";
          return "shelf";
        });
        return;
      }

      if (focusZone === "header") {
        if (e.key === "ArrowLeft") {
          playSound("move");
          setHeaderFocusIndex((prev) => Math.max(0, prev - 1));
        } else if (e.key === "ArrowRight") {
          playSound("move");
          setHeaderFocusIndex((prev) => Math.min(availableHeaderActions.length - 1, prev + 1));
        } else if (e.key === "ArrowDown") {
          playSound("move");
          if (activeTab === "library") {
            setFocusZone("filters");
          } else {
            setFocusZone("shelf");
          }
        } else if (e.key === "Enter") {
          const action = availableHeaderActions[headerFocusIndex];
          if (action) {
            triggerHeaderAction(action);
          }
        }
        return;
      }

      if (focusZone === "filters") {
        if (e.key === "ArrowLeft") {
          playSound("move");
          setFilterFocusIndex((prev) => Math.max(0, prev - 1));
        } else if (e.key === "ArrowRight") {
          playSound("move");
          setFilterFocusIndex((prev) => Math.min(filterPills.length - 1, prev + 1));
        } else if (e.key === "ArrowUp") {
          playSound("move");
          setFocusZone("header");
        } else if (e.key === "ArrowDown") {
          playSound("move");
          setFocusZone("shelf");
        } else if (e.key === "Enter") {
          applyFilterPill(filterFocusIndex);
        }
        return;
      }

      // focusZone === "shelf"
      if (activeTab === "library") {
        if (e.key === "ArrowLeft") {
          playSound("move");
          setSelectedIndex((prev) => Math.max(0, prev - 1));
        } else if (e.key === "ArrowRight") {
          playSound("move");
          setSelectedIndex((prev) => Math.min(filteredGames.length - 1, prev + 1));
        } else if (e.key === "ArrowUp") {
          playSound("move");
          setFocusZone("filters");
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
        } else if (e.key === "x" || e.key === "X" || e.key === "d" || e.key === "D") {
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
      } else {
        if (e.key === "ArrowUp") {
          playSound("move");
          setFocusZone("header");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    activeTab,
    filteredGames,
    selectedIndex,
    focusZone,
    headerFocusIndex,
    filterFocusIndex,
    availableHeaderActions,
    filterPills,
    currentBpTheme,
    isThemeModalOpen,
    themeModalFocusIndex,
    onUpdateBigPictureTheme,
    onToggleFavorite,
    onLaunchGame,
    onStopGame,
    onExitBigPicture,
    onOpenGameDetails,
    isSearchOpen,
    searchQuery,
  ]);

  const selectedGame = filteredGames[selectedIndex];
  const platformColor = selectedGame?.platform_brand_color || "#00E5FF";

  return (
    <div
      className={`big-picture-wrapper theme-${theme} bp-dashboard-${currentBpTheme}`}
      data-theme={theme}
      data-bp-theme={currentBpTheme}
    >
      {/* IMMERSIVE DYNAMIC BACKDROP */}
      <div className="big-picture-backdrop">
        {selectedGame?.banner_url || selectedGame?.cover_url ? (
          <img
            src={formatImageUrl(selectedGame.banner_url || selectedGame.cover_url)}
            alt={selectedGame.title}
            className="big-picture-backdrop-img"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="big-picture-backdrop-placeholder" />
        )}
        <div className="big-picture-theme-ambient" />
        <div className="big-picture-theme-spotlight" />
        <div className="big-picture-backdrop-overlay" />
      </div>

      {/* TOP CONSOLE HUD */}
      <header className="big-picture-hud">
        <div className="hud-left">
          <div
            className="hud-logo-tag"
            onClick={() => {
              playThemeSound("select");
              setActiveTab("library");
            }}
            title="Ir para Biblioteca"
          >
            <div
              className="hud-logo-icon-box"
              style={{
                background: activeBpTheme.accentColor,
                color: "#060910",
                boxShadow: `0 0 16px ${activeBpTheme.accentColor}66`,
              }}
            >
              <ConsoleIcon iconName={activeBpTheme.icon} size={18} color="#060910" />
            </div>
            <span>{activeBpTheme.guideName}</span>
          </div>

          {/* Primary View Navigation Tabs with L2 / R2 Prompts */}
          <nav className="hud-nav-tabs" aria-label="Navegação Principal">
            <button
              type="button"
              className="hud-tab-trigger-hint left"
              onClick={() => cycleTab(-1)}
              title="Aba Anterior (L2 / LT / ZL / PageUp / [)"
            >
              <ControllerPromptBadge controllerType={controllerType} action="triggerL" size={17} />
            </button>

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

            <button
              type="button"
              className="hud-tab-trigger-hint right"
              onClick={() => cycleTab(1)}
              title="Próxima Aba (R2 / RT / ZR / PageDown / ])"
            >
              <ControllerPromptBadge controllerType={controllerType} action="triggerR" size={17} />
            </button>
          </nav>
        </div>

        <div className="hud-right">
          {/* Action Buttons: Search */}
          <div className="hud-actions-group">
            <button
              className={`hud-action-btn ${isSearchOpen || searchQuery ? "active" : ""} ${
                focusZone === "header" && availableHeaderActions[headerFocusIndex] === "search"
                  ? "gp-focused"
                  : ""
              }`}
              onClick={() => {
                playSound("move");
                setIsSearchOpen((prev) => !prev);
                if (activeTab !== "library") setActiveTab("library");
              }}
              onMouseEnter={() => {
                const idx = availableHeaderActions.indexOf("search");
                if (idx !== -1) setHeaderFocusIndex(idx);
              }}
              title="Buscar Jogos (/)"
            >
              <Search size={15} />
              <span>Buscar</span>
            </button>
          </div>

          {/* ACTIVE BIG PICTURE CONSOLE DASHBOARD HIGHLIGHT PILL */}
          <div
            className={`hud-theme-badge hud-bp-theme-badge ${
              focusZone === "header" && availableHeaderActions[headerFocusIndex] === "theme"
                ? "gp-focused"
                : ""
            }`}
            title={`Tema do Modo Big Picture: ${activeBpTheme.name} (Clique ou aperte A para alterar o estilo da dashboard)`}
            onClick={() => {
              playThemeSound("select");
              const bpThemes: BigPictureTheme[] = ["steam", "xbox", "playstation", "nintendo"];
              const currentIdx = bpThemes.indexOf(currentBpTheme);
              setThemeModalFocusIndex(currentIdx !== -1 ? currentIdx : 0);
              setIsThemeModalOpen(true);
            }}
            onMouseEnter={() => {
              const idx = availableHeaderActions.indexOf("theme");
              if (idx !== -1) setHeaderFocusIndex(idx);
            }}
          >
            <ConsoleIcon iconName={activeBpTheme.icon} size={15} color={activeBpTheme.accentColor} />
            <span className="hud-theme-label">Dashboard:</span>
            <span className="hud-theme-val" style={{ color: activeBpTheme.accentColor }}>
              {activeBpTheme.badgeLabel}
            </span>
            <span
              className="hud-theme-dot"
              style={{
                backgroundColor: activeBpTheme.accentColor,
                boxShadow: `0 0 10px ${activeBpTheme.accentColor}`,
              }}
            />
          </div>

          <div className="hud-controller-badge">
            <Gamepad2 size={16} color={gamepadName ? "var(--accent-green)" : "var(--text-muted)"} />
            <span>{gamepadName || "Teclado Ativo"}</span>
          </div>

          <div className="hud-clock">{clock}</div>

          <button
            className={`btn-exit-big-picture ${
              focusZone === "header" && availableHeaderActions[headerFocusIndex] === "exit"
                ? "gp-focused"
                : ""
            }`}
            onClick={onExitBigPicture}
            onMouseEnter={() => {
              const idx = availableHeaderActions.indexOf("exit");
              if (idx !== -1) setHeaderFocusIndex(idx);
            }}
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
                ref={(el) => {
                  filterPillRefs.current[0] = el;
                }}
                className={`hud-pill ${
                  selectedPlatformId === null && filterMode === "all" && !onlyFavorites ? "active" : ""
                } ${focusZone === "filters" && filterFocusIndex === 0 ? "gp-focused" : ""}`}
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
                ref={(el) => {
                  filterPillRefs.current[1] = el;
                }}
                className={`hud-pill ${
                  filterMode === "recomp" && selectedPlatformId === null && !onlyFavorites ? "active" : ""
                } ${focusZone === "filters" && filterFocusIndex === 1 ? "gp-focused" : ""}`}
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
                ref={(el) => {
                  filterPillRefs.current[2] = el;
                }}
                className={`hud-pill ${
                  filterMode === "emulator" && selectedPlatformId === null && !onlyFavorites ? "active" : ""
                } ${focusZone === "filters" && filterFocusIndex === 2 ? "gp-focused" : ""}`}
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
                ref={(el) => {
                  filterPillRefs.current[3] = el;
                }}
                className={`hud-pill ${onlyFavorites ? "active" : ""} ${
                  focusZone === "filters" && filterFocusIndex === 3 ? "gp-focused" : ""
                }`}
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
                .map((plat, platIdx) => {
                  const pillIdx = 4 + platIdx;
                  return (
                    <button
                      key={plat.id}
                      ref={(el) => {
                        filterPillRefs.current[pillIdx] = el;
                      }}
                      className={`hud-pill ${selectedPlatformId === plat.id ? "active" : ""} ${
                        focusZone === "filters" && filterFocusIndex === pillIdx ? "gp-focused" : ""
                      }`}
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
                  );
                })}
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
                    borderColor: platformColor,
                    color: platformColor,
                  }}
                >
                  <ConsoleIcon
                    platformId={selectedGame.original_platform_id}
                    name={selectedGame.platform_name}
                    size={16}
                    color={platformColor}
                  />
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
                  <div className="stage-game-notes-box">
                    <div className="stage-notes-icon-bar">
                      <Sparkles size={14} color="var(--accent-cyan)" />
                      <span className="stage-notes-label">CONFIGURAÇÕES DE SISTEMA</span>
                    </div>
                    <div className="stage-notes-chips">
                      {selectedGame.notes.split(/[/|,]/).map((chip, idx) => {
                        const trimmed = chip.trim();
                        if (!trimmed) return null;
                        return (
                          <span key={idx} className="stage-notes-chip">
                            {trimmed}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* BIG ACTION BUTTONS */}
                <div className="stage-actions-row">
                  {selectedGame.is_running ? (
                    <button
                      className="btn-stop-big"
                      onClick={() => onStopGame(selectedGame)}
                      style={{ padding: "16px 36px", fontSize: "1.1rem" }}
                    >
                      <Square size={20} fill="currentColor" />
                      <ControllerPromptBadge controllerType={controllerType} action="select" size={20} />
                      <span>ENCERRAR JOGO</span>
                    </button>
                  ) : (
                    <button
                      className="btn-launch-big"
                      onClick={() => onLaunchGame(selectedGame)}
                      style={{ padding: "16px 42px", fontSize: "1.15rem" }}
                    >
                      <Play size={22} fill="currentColor" />
                      <ControllerPromptBadge controllerType={controllerType} action="select" size={20} />
                      <span>JOGAR AGORA</span>
                    </button>
                  )}

                  {onOpenGameDetails && (
                    <button
                      className="btn-secondary bp-action-btn"
                      onClick={() => {
                        playSound("select");
                        onOpenGameDetails(selectedGame);
                      }}
                      style={{ padding: "16px 24px", fontSize: "1rem" }}
                      title="Histórico de Sessões, Editar Dados, Trocar Capas via IGDB e Excluir"
                    >
                      <ControllerPromptBadge controllerType={controllerType} action="details" size={18} />
                      <span>Detalhes & Gerenciar</span>
                    </button>
                  )}

                  {Boolean(selectedGame.is_emulator) && (
                    <button
                      className="btn-secondary bp-action-btn"
                      onClick={() => {
                        playSound("select");
                        setAchievementsTargetGame(selectedGame);
                        setActiveTab("achievements");
                      }}
                      style={{ padding: "16px 20px", fontSize: "1rem" }}
                      title="Ver Conquistas deste jogo no RetroAchievements"
                    >
                      <Trophy size={17} color="#FF9900" />
                      <span>Conquistas</span>
                    </button>
                  )}

                  {onToggleFavorite && (
                    <button
                      className={`btn-secondary bp-action-btn ${selectedGame.is_favorite ? "is-fav" : ""}`}
                      onClick={() => onToggleFavorite(selectedGame)}
                      style={{
                        padding: "16px 22px",
                        fontSize: "1rem",
                        color: selectedGame.is_favorite ? "#FFB84D" : "inherit",
                        borderColor: selectedGame.is_favorite ? "#FFB84D" : undefined,
                      }}
                    >
                      <ControllerPromptBadge controllerType={controllerType} action="favorite" size={18} />
                      <Star size={17} fill={selectedGame.is_favorite ? "#FFB84D" : "none"} color={selectedGame.is_favorite ? "#FFB84D" : "currentColor"} />
                      <span>
                        {selectedGame.is_favorite ? "Favoritado" : "Favoritar"}
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
                      className={`shelf-card ${
                        isSelected ? (focusZone === "shelf" ? "focused" : "idle-selected") : ""
                      }`}
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
                        boxShadow: isSelected
                          ? `0 0 0 2px ${gColor}, 0 0 25px ${gColor}99, 0 0 45px var(--accent-cyan-glow)`
                          : undefined,
                      }}
                    >
                      {game.cover_url ? (
                        <img
                          src={formatImageUrl(game.cover_url)}
                          alt={game.title}
                          className="shelf-card-img"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="shelf-card-fallback">
                          <Gamepad2 size={36} color={gColor} />
                          <span className="fallback-title">{game.title}</span>
                        </div>
                      )}

                      {/* TOP BAR: Clean Running Status & Favorite Star (No overlapping badges) */}
                      <div className="shelf-card-top-bar">
                        {game.is_running ? (
                          <div className="shelf-card-running-pill" title="Em execução">
                            <span className="running-dot" />
                            <span>JOGANDO</span>
                          </div>
                        ) : (
                          <span />
                        )}

                        {game.is_favorite && (
                          <div className="shelf-card-fav-pill" title="Favorito">
                            <Star size={13} fill="#FFB84D" color="#FFB84D" />
                          </div>
                        )}
                      </div>

                      <div className="shelf-card-badge" style={{ color: gColor, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <ConsoleIcon platformId={game.original_platform_id} name={game.platform_name} size={13} color={gColor} />
                        <span>{game.platform_name || game.original_platform_id.toUpperCase()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* NINTENDO SWITCH SIGNATURE UTILITY BAR */}
            {currentBpTheme === "nintendo" && (
              <div className="switch-utility-bar">
                <button
                  type="button"
                  className="switch-util-btn"
                  title="Buscar Jogos na Biblioteca"
                  onClick={() => {
                    playThemeSound("select");
                    setIsSearchOpen(true);
                  }}
                >
                  <Search size={20} />
                  <span className="switch-util-tooltip">Buscar</span>
                </button>
                <button
                  type="button"
                  className="switch-util-btn"
                  title="Álbum & Gravações (Replay)"
                  onClick={() => {
                    playThemeSound("select");
                    setActiveTab("replay");
                  }}
                >
                  <Sparkles size={20} />
                  <span className="switch-util-tooltip">Replay</span>
                </button>
                <button
                  type="button"
                  className="switch-util-btn"
                  title="Conquistas (RetroAchievements)"
                  onClick={() => {
                    playThemeSound("select");
                    setActiveTab("achievements");
                  }}
                >
                  <Trophy size={20} />
                  <span className="switch-util-tooltip">Conquistas</span>
                </button>
                <button
                  type="button"
                  className="switch-util-btn"
                  title="Alterar Estilo de Dashboard"
                  onClick={() => {
                    playThemeSound("select");
                    const bpThemes: BigPictureTheme[] = ["steam", "xbox", "playstation", "nintendo"];
                    const currentIdx = bpThemes.indexOf(currentBpTheme);
                    setThemeModalFocusIndex(currentIdx !== -1 ? currentIdx : 0);
                    setIsThemeModalOpen(true);
                  }}
                >
                  <ConsoleIcon iconName="switch" size={20} />
                  <span className="switch-util-tooltip">Temas</span>
                </button>
                <button
                  type="button"
                  className="switch-util-btn switch-util-power"
                  title="Sair do Modo Big Picture"
                  onClick={() => {
                    playThemeSound("back");
                    onExitBigPicture();
                  }}
                >
                  <X size={20} />
                  <span className="switch-util-tooltip">Sair</span>
                </button>
              </div>
            )}
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
        {focusZone === "header" ? (
          <>
            <div className="gamepad-hint-item">
              <span className="hint-btn">← →</span>
              <span>Navegar Ações</span>
            </div>
            <div className="gamepad-hint-item">
              <ControllerPromptBadge controllerType={controllerType} action="select" size={20} />
              <span className="hint-btn">Enter</span>
              <span>Confirmar</span>
            </div>
            <div className="gamepad-hint-item">
              <ControllerPromptBadge controllerType={controllerType} action="back" size={20} />
              <span className="hint-btn">↓</span>
              <span>Voltar aos Jogos</span>
            </div>
            <div className="gamepad-hint-item">
              <span style={{ display: "inline-flex", gap: "4px" }}>
                <ControllerPromptBadge controllerType={controllerType} action="triggerL" size={20} />
                <ControllerPromptBadge controllerType={controllerType} action="triggerR" size={20} />
              </span>
              <span>Mudar Aba</span>
            </div>
          </>
        ) : focusZone === "filters" ? (
          <>
            <div className="gamepad-hint-item">
              <span className="hint-btn">← →</span>
              <span>Navegar Filtros</span>
            </div>
            <div className="gamepad-hint-item">
              <ControllerPromptBadge controllerType={controllerType} action="select" size={20} />
              <span className="hint-btn">Enter</span>
              <span>Aplicar Filtro</span>
            </div>
            <div className="gamepad-hint-item">
              <span className="hint-btn">↑</span>
              <span>Menu Superior</span>
            </div>
            <div className="gamepad-hint-item">
              <ControllerPromptBadge controllerType={controllerType} action="back" size={20} />
              <span className="hint-btn">↓</span>
              <span>Voltar aos Jogos</span>
            </div>
            <div className="gamepad-hint-item">
              <span style={{ display: "inline-flex", gap: "4px" }}>
                <ControllerPromptBadge controllerType={controllerType} action="triggerL" size={20} />
                <ControllerPromptBadge controllerType={controllerType} action="triggerR" size={20} />
              </span>
              <span>Mudar Aba</span>
            </div>
          </>
        ) : activeTab === "library" ? (
          <>
            <div className="gamepad-hint-item">
              <span style={{ display: "inline-flex", gap: "4px" }}>
                <ControllerPromptBadge controllerType={controllerType} action="triggerL" size={20} />
                <ControllerPromptBadge controllerType={controllerType} action="triggerR" size={20} />
              </span>
              <span>Mudar Aba</span>
            </div>
            <div className="gamepad-hint-item">
              <span className="hint-btn">↑</span>
              <span>Menu / Filtros</span>
            </div>
            <div className="gamepad-hint-item">
              <ControllerPromptBadge controllerType={controllerType} action="select" size={20} />
              <span>Iniciar</span>
            </div>
            <div className="gamepad-hint-item">
              <ControllerPromptBadge controllerType={controllerType} action="details" size={20} />
              <span className="hint-btn">X</span>
              <span>Detalhes & Gerenciar</span>
            </div>
            <div className="gamepad-hint-item">
              <ControllerPromptBadge controllerType={controllerType} action="favorite" size={20} />
              <span className="hint-btn">F</span>
              <span>Favorito</span>
            </div>
            <div className="gamepad-hint-item">
              <span style={{ display: "inline-flex", gap: "4px" }}>
                <ControllerPromptBadge controllerType={controllerType} action="bumperL" size={20} />
                <ControllerPromptBadge controllerType={controllerType} action="bumperR" size={20} />
              </span>
              <span>Mudar Console</span>
            </div>
            <div className="gamepad-hint-item">
              <ControllerPromptBadge controllerType={controllerType} action="back" size={20} />
              <span className="hint-btn">ESC</span>
              <span>Sair</span>
            </div>
          </>
        ) : (
          <>
            <div className="gamepad-hint-item">
              <span style={{ display: "inline-flex", gap: "4px" }}>
                <ControllerPromptBadge controllerType={controllerType} action="triggerL" size={20} />
                <ControllerPromptBadge controllerType={controllerType} action="triggerR" size={20} />
              </span>
              <span>Mudar Aba</span>
            </div>
            <div className="gamepad-hint-item">
              <span className="hint-btn">↑</span>
              <span>Menu Superior</span>
            </div>
            <div className="gamepad-hint-item">
              <ControllerPromptBadge controllerType={controllerType} action="back" size={20} />
              <span className="hint-btn">ESC</span>
              <span>Voltar para a Biblioteca</span>
            </div>
          </>
        )}
      </footer>

      {/* BIG PICTURE CONSOLE DASHBOARD THEME SELECTION MODAL */}
      {isThemeModalOpen && (
        <div
          className="bp-theme-modal-backdrop"
          onClick={() => {
            playThemeSound("back");
            setIsThemeModalOpen(false);
          }}
        >
          <div
            className="bp-theme-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bp-theme-modal-header">
              <div className="bp-theme-modal-title-row">
                <div
                  className="bp-theme-modal-icon-badge"
                  style={{
                    background: activeBpTheme.accentColor,
                    boxShadow: `0 0 20px ${activeBpTheme.accentColor}55`,
                  }}
                >
                  <ConsoleIcon iconName={activeBpTheme.icon} size={22} color="#060910" />
                </div>
                <div>
                  <h2 className="bp-theme-modal-title">ESTILO DE DASHBOARD</h2>
                  <p className="bp-theme-modal-subtitle">
                    Personalize o layout dos cartões, atmosfera visual e perfil sonoro como seus consoles favoritos
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="bp-theme-modal-close"
                onClick={() => {
                  playThemeSound("back");
                  setIsThemeModalOpen(false);
                }}
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bp-theme-options-grid">
              {(Object.keys(BP_THEMES_METADATA) as BigPictureTheme[]).map((themeKey, idx) => {
                const meta = BP_THEMES_METADATA[themeKey];
                const isSelected = currentBpTheme === themeKey;
                const isFocused = themeModalFocusIndex === idx;

                return (
                  <div
                    key={themeKey}
                    className={`bp-theme-choice-card ${isSelected ? "selected" : ""} ${
                      isFocused ? "focused" : ""
                    }`}
                    style={
                      {
                        "--theme-accent": meta.accentColor,
                      } as React.CSSProperties
                    }
                    onClick={() => {
                      playSound("select", themeKey);
                      setCurrentBpTheme(themeKey);
                      setThemeModalFocusIndex(idx);
                      if (onUpdateBigPictureTheme) onUpdateBigPictureTheme(themeKey);
                      setIsThemeModalOpen(false);
                    }}
                    onMouseEnter={() => {
                      playThemeSound("move");
                      setThemeModalFocusIndex(idx);
                    }}
                  >
                    <div className="bp-theme-choice-top">
                      <div className="bp-theme-choice-brand-badge" style={{ color: meta.accentColor }}>
                        <ConsoleIcon iconName={meta.icon} size={14} color={meta.accentColor} />
                        <span>{meta.brand}</span>
                      </div>
                      {isSelected && (
                        <div className="bp-theme-active-tag" style={{ background: meta.accentColor, color: "#060910" }}>
                          ATIVO
                        </div>
                      )}
                    </div>

                    <div className="bp-theme-choice-visual-preview">
                      <div className={`bp-preview-box preview-${themeKey}`}>
                        <div className="bp-preview-mini-banner" />
                        <div className="bp-preview-mini-cards">
                          <div className="bp-mini-card mini-card-1" />
                          <div className="bp-mini-card mini-card-2 active" style={{ borderColor: meta.accentColor }} />
                          <div className="bp-mini-card mini-card-3" />
                        </div>
                      </div>
                    </div>

                    <div className="bp-theme-choice-body">
                      <h3 className="bp-theme-choice-name">{meta.name}</h3>
                      <p className="bp-theme-choice-desc">{meta.desc}</p>
                    </div>

                    <div className="bp-theme-choice-action-bar">
                      <span className="bp-theme-action-text" style={{ color: meta.accentColor }}>
                        {isSelected ? "Dashboard em uso" : "Pressione para aplicar"}
                      </span>
                      <ControllerPromptBadge controllerType={controllerType} action="select" size={16} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bp-theme-modal-footer">
              <div className="gamepad-hint-item">
                <span className="hint-btn">← →</span>
                <span>Navegar</span>
              </div>
              <div className="gamepad-hint-item">
                <ControllerPromptBadge controllerType={controllerType} action="select" size={18} />
                <span className="hint-btn">Enter</span>
                <span>Selecionar Estilo</span>
              </div>
              <div className="gamepad-hint-item">
                <ControllerPromptBadge controllerType={controllerType} action="back" size={18} />
                <span className="hint-btn">ESC</span>
                <span>Fechar</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

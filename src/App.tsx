import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search, Gamepad2, Settings, Flame, Tv, FolderUp, Cpu, Layers, Volume2, VolumeX, Trophy } from "lucide-react";
import { AppSettings, Game, Platform, PlayStatusType } from "./types";
import { api } from "./services/api";
import { ambientAudio } from "./services/ambientAudio";
import { Sidebar } from "./components/Sidebar";
import { GameCard } from "./components/GameCard";
import { AddGameModal } from "./components/AddGameModal";
import { GameDetailsModal } from "./components/GameDetailsModal";
import { SettingsModal } from "./components/SettingsModal";
import { ReplayView } from "./components/ReplayView";
import { BigPictureMode } from "./components/BigPictureMode";
import { BatchImportModal } from "./components/BatchImportModal";
import { RetroAchievementsView } from "./components/RetroAchievementsView";
import { ConsoleIcon } from "./components/ConsoleIcon";
import { ErrorBoundary } from "./components/ErrorBoundary";

const DEFAULT_SETTINGS: AppSettings = {
  theme: "midnight",
  fontFamily: "auto",
  fontSize: "medium",
  cardSize: "normal",
  reduceMotion: false,
  disableGlassmorphism: false,
  discordRpcEnabled: true,
  steamGridDbApiKey: "",
  igdbClientId: "",
  igdbClientSecret: "",
  ambientMusicEnabled: false,
  ambientMusicVolume: 0.25,
  controllerType: "xbox",
  bigPictureTheme: "steam",
  cardBadgePreference: "auto",
  startInBigPicture: false,
};

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<"library" | "replay" | "achievements">("library");
  const [isBigPicture, setIsBigPicture] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [allPlatforms, setAllPlatforms] = useState<Platform[]>([]);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<"all" | "recomp" | "emulator">("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | PlayStatusType>("all");
  const [ambientPlaying, setAmbientPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRaGame, setSelectedRaGame] = useState<Game | null>(null);

  // Settings State with LocalStorage Persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem("recomp_launcher_settings");
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error("Failed to parse settings:", e);
    }
    return DEFAULT_SETTINGS;
  });

  // Apply settings to DOM
  useEffect(() => {
    try {
      localStorage.setItem("recomp_launcher_settings", JSON.stringify(settings));
    } catch (e) {
      console.error(e);
    }

    const root = document.documentElement;
    root.setAttribute("data-theme", settings.theme);
    root.setAttribute("data-font-family", settings.fontFamily || "auto");
    root.setAttribute("data-font-size", settings.fontSize);
    root.setAttribute("data-card-size", settings.cardSize);
    root.setAttribute("data-reduce-motion", String(settings.reduceMotion));
    root.setAttribute("data-disable-glass", String(settings.disableGlassmorphism));

    api.setDiscordEnabled(settings.discordRpcEnabled ?? true, settings.discordClientId);
  }, [settings]);

  const updateSettings = (partial: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  // Sync Ambient Audio with settings
  useEffect(() => {
    if (settings.ambientMusicEnabled) {
      ambientAudio.start(settings.ambientMusicVolume ?? 0.25);
      setAmbientPlaying(true);
    } else {
      ambientAudio.stop();
      setAmbientPlaying(false);
    }
  }, [settings.ambientMusicEnabled, settings.ambientMusicVolume]);

  // Check start in big picture on mount
  useEffect(() => {
    if (settings.startInBigPicture) {
      handleToggleBigPicture(true);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Listen to real-time events from Rust process manager
    const unlistenPromise = api.onGameStatusChanged((payload) => {
      console.log("Game status update event:", payload);
      loadGames();
    });

    return () => {
      unlistenPromise.then((unlisten) => {
        if (typeof unlisten === "function") unlisten();
      });
    };
  }, []);

  const loadData = async () => {
    await Promise.all([loadPlatforms(), loadGames()]);
  };

  const loadPlatforms = async () => {
    try {
      const [enabledData, allData] = await Promise.all([
        api.getPlatforms(false),
        api.getPlatforms(true),
      ]);
      setPlatforms(enabledData);
      setAllPlatforms(allData);

      // If currently selected platform was disabled, reset filter to All
      if (selectedPlatformId && !enabledData.some((p) => p.id === selectedPlatformId)) {
        setSelectedPlatformId(null);
      }
    } catch (err) {
      console.error("Failed to load platforms:", err);
    }
  };

  const loadGames = async () => {
    try {
      const data = await api.getGames();
      setGames(data);

      setSelectedGame((prev) => {
        if (!prev) return null;
        return data.find((g) => g.id === prev.id) || prev;
      });
    } catch (err) {
      console.error("Failed to load games:", err);
    }
  };

  const handleLaunch = async (game: Game, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      // Pause ambient lo-fi music when game launches
      ambientAudio.pause();
      await api.launchGame(game.id);
      await loadGames();
    } catch (err: any) {
      alert("Erro ao iniciar jogo: " + err.toString());
      if (settings.ambientMusicEnabled) {
        ambientAudio.resume();
      }
    }
  };

  const handleStop = async (game: Game, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await api.stopGame(game.id);
      await loadGames();
      // Resume ambient lo-fi music when game stops
      if (settings.ambientMusicEnabled) {
        ambientAudio.resume();
      }
    } catch (err: any) {
      alert("Erro ao encerrar jogo: " + err.toString());
    }
  };

  const handleToggleFavorite = async (game: Game, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const newStatus = await api.toggleFavorite(game.id);
      setGames((prev) =>
        prev.map((g) => (g.id === game.id ? { ...g, is_favorite: newStatus } : g))
      );
      setSelectedGame((prev) =>
        prev && prev.id === game.id ? { ...prev, is_favorite: newStatus } : prev
      );
    } catch (err) {
      console.error("Erro ao favoritar jogo:", err);
    }
  };

  const handleToggleBigPicture = async (enable: boolean) => {
    setIsBigPicture(enable);
    try {
      await api.setFullscreen(enable);
    } catch (e) {
      console.warn("Fullscreen toggle warning:", e);
    }
  };

  // Keyboard shortcut F11 for Big Picture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault();
        handleToggleBigPicture(!isBigPicture);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBigPicture]);

  const handleCardClick = (game: Game) => {
    setSelectedGame(game);
    setIsDetailsModalOpen(true);
  };

  // Aggregated Counts
  const gamesCountByPlatform = useMemo(() => {
    const map: Record<string, number> = {};
    for (const g of games) {
      map[g.original_platform_id] = (map[g.original_platform_id] || 0) + 1;
    }
    return map;
  }, [games]);

  const recompCount = useMemo(() => games.filter((g) => !g.is_emulator).length, [games]);
  const emulatorCount = useMemo(() => games.filter((g) => Boolean(g.is_emulator)).length, [games]);
  const favoriteCount = useMemo(() => games.filter((g) => Boolean(g.is_favorite)).length, [games]);
  const completedCount = useMemo(() => games.filter((g) => g.play_status === "completed").length, [games]);

  const totalPlaytimeHours = useMemo(() => {
    const totalSecs = games.reduce((acc, g) => acc + g.total_playtime_seconds, 0);
    return totalSecs / 3600;
  }, [games]);

  // Filtered games
  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      const matchesPlatform =
        selectedPlatformId === null || game.original_platform_id === selectedPlatformId;
      const matchesSearch =
        searchQuery.trim() === "" ||
        game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (game.platform_name &&
          game.platform_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (game.notes && game.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "recomp" && !game.is_emulator) ||
        (typeFilter === "emulator" && Boolean(game.is_emulator));

      const matchesFavorite = !onlyFavorites || Boolean(game.is_favorite);
      const matchesStatus = statusFilter === "all" || game.play_status === statusFilter;

      return matchesPlatform && matchesSearch && matchesType && matchesFavorite && matchesStatus;
    });
  }, [games, selectedPlatformId, searchQuery, typeFilter, onlyFavorites, statusFilter]);

  const activePlatform = platforms.find((p) => p.id === selectedPlatformId);

  const getLibraryTitle = () => {
    if (onlyFavorites) return "⭐ Jogos Favoritos";
    if (statusFilter === "completed") return "🏆 Jogos Zerados / Concluídos";
    if (statusFilter === "playing") return "🎮 Jogando Agora";
    if (statusFilter === "paused") return "⏸️ Jogos Pausados";
    if (statusFilter === "backlog") return "📋 Backlog Pendente";

    if (activePlatform) {
      if (typeFilter === "recomp") return `Recompilações: ${activePlatform.name}`;
      if (typeFilter === "emulator") return `Jogos Emulados: ${activePlatform.name}`;
      return `Jogos de ${activePlatform.name}`;
    }
    if (typeFilter === "recomp") return "Recompilações Nativa PC (Ports x86)";
    if (typeFilter === "emulator") return "Jogos Emulados (Emuladores & ROMs)";
    return "Biblioteca Completa (Recomps & Emulação)";
  };

  return (
    <div className={`app-container theme-${settings.theme}`}>
      {isBigPicture ? (
        <BigPictureMode
          games={games}
          platforms={platforms}
          onLaunchGame={(g) => handleLaunch(g)}
          onStopGame={(g) => handleStop(g)}
          onExitBigPicture={() => handleToggleBigPicture(false)}
          controllerType={settings.controllerType}
          theme={settings.theme}
          bigPictureTheme={settings.bigPictureTheme ?? "steam"}
          onUpdateBigPictureTheme={(newTheme) => updateSettings({ bigPictureTheme: newTheme })}
          onToggleFavorite={handleToggleFavorite}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onOpenAddGame={() => setIsAddModalOpen(true)}
          onOpenBatchImport={() => setIsBatchModalOpen(true)}
          onOpenGameDetails={(g) => {
            setSelectedGame(g);
            setIsDetailsModalOpen(true);
          }}
          raUsername={settings.raUsername}
          raApiKey={settings.raApiKey}
        />
      ) : (
        <>
          {/* SIDEBAR */}
      <Sidebar
        platforms={platforms}
        selectedPlatformId={selectedPlatformId}
        onSelectPlatform={setSelectedPlatformId}
        gamesCountByPlatform={gamesCountByPlatform}
        totalGamesCount={games.length}
        totalPlaytimeHours={totalPlaytimeHours}
        currentView={currentView}
        onSelectView={setCurrentView}
        typeFilter={typeFilter}
        onSelectTypeFilter={setTypeFilter}
        recompCount={recompCount}
        emulatorCount={emulatorCount}
        onlyFavorites={onlyFavorites}
        onToggleOnlyFavorites={() => {
          setOnlyFavorites((prev) => !prev);
          if (!onlyFavorites) setStatusFilter("all");
        }}
        favoriteCount={favoriteCount}
        statusFilter={statusFilter}
        onSelectStatusFilter={(status) => {
          setStatusFilter(status);
          if (status !== "all") setOnlyFavorites(false);
        }}
        completedCount={completedCount}
      />

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* TOP BAR */}
        <header className="top-bar">
          <div className="search-box-wrapper">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              className="search-input"
              placeholder="Buscar por título, console de origem, port ou emulador..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="top-actions">
            {/* AMBIENT LO-FI SYNTH MUSIC TOGGLE */}
            <button
              className={`btn-secondary ${ambientPlaying ? "active" : ""}`}
              onClick={() => {
                const next = !settings.ambientMusicEnabled;
                updateSettings({ ambientMusicEnabled: next });
                if (next) {
                  ambientAudio.start(settings.ambientMusicVolume ?? 0.25);
                  setAmbientPlaying(true);
                } else {
                  ambientAudio.stop();
                  setAmbientPlaying(false);
                }
              }}
              title={ambientPlaying ? "Pausar Trilha Sonora Lo-Fi Retro" : "Ativar Trilha Sonora Lo-Fi Retro"}
              style={{
                borderColor: ambientPlaying ? "rgba(179, 71, 255, 0.5)" : undefined,
                color: ambientPlaying ? "#D48BFF" : undefined,
                boxShadow: ambientPlaying ? "0 0 14px rgba(179, 71, 255, 0.25)" : undefined,
              }}
            >
              {ambientPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
              <span>Lo-Fi</span>
            </button>

            {/* BIG PICTURE MODE TOGGLE */}
            <button
              className="btn-secondary"
              onClick={() => handleToggleBigPicture(true)}
              title="Modo Big Picture para TV e Controle (F11)"
              style={{
                borderColor: "rgba(0, 229, 255, 0.4)",
                color: "var(--accent-cyan)",
              }}
            >
              <Tv size={18} />
              <span>Big Picture</span>
            </button>

            {/* RETROACHIEVEMENTS VIEW TOGGLE */}
            <button
              className={`btn-secondary ${currentView === "achievements" ? "active" : ""}`}
              onClick={() => {
                if (currentView !== "achievements") {
                  setSelectedRaGame(selectedGame || games[0] || null);
                  setCurrentView("achievements");
                } else {
                  setCurrentView("library");
                }
              }}
              title="Central de Conquistas do RetroAchievements"
              style={{
                borderColor: currentView === "achievements" ? "#FF9900" : "rgba(255, 153, 0, 0.4)",
                color: "#FFB84D",
                background: currentView === "achievements" ? "rgba(255, 153, 0, 0.18)" : undefined,
                boxShadow: currentView === "achievements" ? "0 0 16px rgba(255, 153, 0, 0.3)" : undefined,
              }}
            >
              <Trophy size={18} color="#FF9900" />
              <span>Conquistas</span>
            </button>

            {/* STEAM REPLAY TOGGLE BUTTON */}
            <button
              className={`btn-secondary ${currentView === "replay" ? "active" : ""}`}
              onClick={() => setCurrentView(currentView === "replay" ? "library" : "replay")}
              style={{
                borderColor: currentView === "replay" ? "#FF9900" : undefined,
                color: currentView === "replay" ? "#FFB84D" : undefined,
                boxShadow: currentView === "replay" ? "0 0 16px rgba(255, 153, 0, 0.25)" : undefined,
              }}
              title="Ver Retrospectiva e Analytics de Horas"
            >
              <Flame size={18} color="#FF9900" />
              <span>Gaming Replay</span>
            </button>

            <button
              className="btn-secondary"
              onClick={() => setIsSettingsModalOpen(true)}
              title="Configurações de Tema, Acessibilidade e Plataformas"
            >
              <Settings size={18} />
              <span>Configurações</span>
            </button>

            {/* BATCH ROMS IMPORT BUTTON */}
            <button
              className="btn-secondary"
              onClick={() => setIsBatchModalOpen(true)}
              title="Escanear e importar pasta de ROMs de emuladores"
            >
              <FolderUp size={18} />
              <span>Importar ROMs</span>
            </button>

            <button
              className="btn-primary"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={18} />
              <span>Adicionar Jogo</span>
            </button>
          </div>
        </header>

        {/* CONDITIONALLY RENDER: RETROACHIEVEMENTS, RECOMP REPLAY OR LIBRARY */}
        {currentView === "achievements" ? (
          <RetroAchievementsView
            games={games}
            initialGame={selectedRaGame}
            raUsername={settings.raUsername}
            raApiKey={settings.raApiKey}
            onBackToLibrary={() => setCurrentView("library")}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        ) : currentView === "replay" ? (
          <ReplayView
            onBackToLibrary={() => setCurrentView("library")}
            games={games}
            platforms={platforms}
          />
        ) : (
          <div className="library-viewport">
            <div className="library-header">
              <div>
                <h2 className="library-title">{getLibraryTitle()}</h2>
                <p className="library-subtitle">
                  {filteredGames.length} {filteredGames.length === 1 ? "jogo exibido" : "jogos exibidos"}
                  {activePlatform && ` do console ${activePlatform.name}`}
                  {typeFilter === "recomp" && " • Apenas Recompilações PC"}
                  {typeFilter === "emulator" && " • Apenas Jogos Emulados"}
                  {onlyFavorites && " • Favoritos"}
                  {statusFilter !== "all" && ` • Status: ${statusFilter.toUpperCase()}`}
                </p>
              </div>

              {/* SEGMENTED CONTROL: TIPO DE JOGO */}
              <div className="type-toggle-bar">
                <button
                  className={`type-toggle-btn ${typeFilter === "all" ? "active" : ""}`}
                  onClick={() => setTypeFilter("all")}
                >
                  <Layers size={14} />
                  <span>Todos ({games.length})</span>
                </button>
                <button
                  className={`type-toggle-btn recomp ${typeFilter === "recomp" ? "active" : ""}`}
                  onClick={() => setTypeFilter("recomp")}
                >
                  <Cpu size={14} />
                  <span>Recomps PC ({recompCount})</span>
                </button>
                <button
                  className={`type-toggle-btn emulator ${typeFilter === "emulator" ? "active" : ""}`}
                  onClick={() => setTypeFilter("emulator")}
                >
                  <Gamepad2 size={14} />
                  <span>Emuladores ({emulatorCount})</span>
                </button>
              </div>
            </div>

            {/* CONSOLE QUICK FILTER BAR IN EMULATION MODE */}
            {typeFilter === "emulator" && (
              <div className="emulation-consoles-bar">
                <div className="emulation-consoles-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Consoles Emulados
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      — Filtre seus jogos por console ou importe novas ROMs
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(true)}
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--accent-cyan)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      background: "rgba(0, 229, 255, 0.08)",
                      border: "1px solid rgba(0, 229, 255, 0.25)",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontWeight: 600,
                    }}
                  >
                    <FolderUp size={14} />
                    <span>Importar ROMs em Lote</span>
                  </button>
                </div>

                <div className="emulation-consoles-scroll thin-scrollbar">
                  {/* Option: Todos os Consoles */}
                  <button
                    type="button"
                    className={`console-quick-pill ${selectedPlatformId === null ? "active" : ""}`}
                    onClick={() => setSelectedPlatformId(null)}
                  >
                    <Layers size={15} />
                    <span>Todos ({emulatorCount})</span>
                  </button>

                  {/* Major Consoles with authentic vector icons */}
                  {platforms
                    .filter((p) => p.is_enabled && p.id !== "other")
                    .map((plat) => {
                      const count = games.filter(
                        (g) => g.is_emulator && g.original_platform_id === plat.id
                      ).length;
                      const isSelected = selectedPlatformId === plat.id;

                      return (
                        <button
                          key={plat.id}
                          type="button"
                          className={`console-quick-pill ${isSelected ? "active" : ""}`}
                          onClick={() => setSelectedPlatformId(isSelected ? null : plat.id)}
                          style={{
                            borderColor: isSelected ? plat.brand_color : undefined,
                            boxShadow: isSelected ? `0 0 12px ${plat.brand_color}44` : undefined,
                          }}
                          title={`${plat.name} (${count} jogos emulados)`}
                        >
                          <ConsoleIcon
                            platformId={plat.id}
                            name={plat.name}
                            size={17}
                            color={plat.brand_color}
                          />
                          <span style={{ fontWeight: isSelected ? 700 : 500 }}>{plat.short_name}</span>
                          <span
                            className="console-quick-count"
                            style={{
                              color: isSelected ? plat.brand_color : undefined,
                              background: isSelected ? `${plat.brand_color}22` : undefined,
                            }}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {filteredGames.length === 0 ? (
              <div className="empty-library">
                <div className="empty-icon-box">
                  <Gamepad2 size={36} />
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  Nenhum jogo encontrado
                </h3>
                <p style={{ color: "var(--text-muted)", maxWidth: "480px", fontSize: "0.9rem" }}>
                  Adicione executáveis de ports descompilados nativos (Zelda OoT, Mario 64, Jak & Daxter) ou importe ROMs de emuladores (PCSX2, Dolphin, DuckStation, etc.) para sua coleção.
                </p>
                <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                  <button
                    className="btn-secondary"
                    onClick={() => setIsBatchModalOpen(true)}
                  >
                    <FolderUp size={16} />
                    <span>Importar Pasta de ROMs</span>
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => setIsAddModalOpen(true)}
                  >
                    <Plus size={16} />
                    <span>Adicionar Jogo</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="games-grid">
                {filteredGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    badgePreference={settings.cardBadgePreference ?? "auto"}
                    onSelect={handleCardClick}
                    onLaunch={handleLaunch}
                    onStop={handleStop}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenAchievements={(g) => {
                      setSelectedRaGame(g);
                      setCurrentView("achievements");
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>
        </>
      )}

      {/* MODAL ADICIONAR JOGO */}
      <AddGameModal
        platforms={platforms}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onGameAdded={loadGames}
        onOpenBatchImport={() => setIsBatchModalOpen(true)}
        steamGridDbKey={settings.steamGridDbApiKey}
        igdbApiKey={settings.igdbApiKey || settings.igdbClientId}
        igdbClientId={settings.igdbClientId}
        igdbClientSecret={settings.igdbClientSecret}
      />

      {/* MODAL IMPORTAÇÃO EM LOTE DE ROMS */}
      <BatchImportModal
        platforms={platforms}
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onImportComplete={loadGames}
        igdbApiKey={settings.igdbApiKey || settings.igdbClientId}
        igdbClientSecret={settings.igdbClientSecret}
      />

      {/* MODAL DETALHES DO JOGO & HISTÓRICO */}
      <ErrorBoundary fallbackTitle="Erro ao exibir detalhes do jogo">
        <GameDetailsModal
          game={selectedGame}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onLaunch={handleLaunch}
          onStop={handleStop}
          onGameDeleted={loadGames}
          onToggleFavorite={handleToggleFavorite}
          onGameUpdated={loadGames}
          steamGridDbKey={settings.steamGridDbApiKey}
          igdbApiKey={settings.igdbApiKey || settings.igdbClientId}
          igdbClientId={settings.igdbClientId}
          igdbClientSecret={settings.igdbClientSecret}
          raUsername={settings.raUsername}
          raApiKey={settings.raApiKey}
        />
      </ErrorBoundary>

      {/* MODAL DE CONFIGURAÇÕES (TEMAS, ACESSIBILIDADE, GESTÃO DE PLATAFORMAS) */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        allPlatforms={allPlatforms}
        onPlatformsChanged={loadPlatforms}
      />
    </div>
  );
};

export default App;

import React, { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  Calendar,
  Clock,
  Sparkles,
  Layers,
  TrendingUp,
  History,
  Gamepad2,
  BarChart3,
  PieChart,
  Sun,
  Moon,
  Cpu,
  Share2,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Target,
  Medal,
  Award,
} from "lucide-react";
import { Game, Platform, ReplayAnalytics, GenreAnalyticsItem } from "../types";
import { api, formatPlaytime, formatImageUrl } from "../services/api";

interface ReplayViewProps {
  onBackToLibrary: () => void;
  onSelectGame?: (gameId: string) => void;
  games?: Game[];
  platforms?: Platform[];
}

// Automatic genre inference based on game titles and notes
export const inferGameGenre = (title: string, notes?: string): string => {
  const text = `${title} ${notes || ""}`.toLowerCase();

  if (
    text.includes("zelda") ||
    text.includes("uncharted") ||
    text.includes("god of war") ||
    text.includes("jak") ||
    text.includes("tomb raider") ||
    text.includes("assassin") ||
    text.includes("batman") ||
    text.includes("prince of persia") ||
    text.includes("ico") ||
    text.includes("shadow of the colossus") ||
    text.includes("yakuza") ||
    text.includes("gta") ||
    text.includes("grand theft auto")
  ) {
    return "Ação & Aventura";
  }

  if (
    text.includes("mario") ||
    text.includes("sonic") ||
    text.includes("crash") ||
    text.includes("spyro") ||
    text.includes("banjo") ||
    text.includes("rayman") ||
    text.includes("donkey kong") ||
    text.includes("conker") ||
    text.includes("ratchet") ||
    text.includes("sly") ||
    text.includes("klonoa") ||
    text.includes("mega man") ||
    text.includes("metroid") ||
    text.includes("castlevania")
  ) {
    return "Plataforma & Ação";
  }

  if (
    text.includes("wipeout") ||
    text.includes("gran turismo") ||
    text.includes("need for speed") ||
    text.includes("mario kart") ||
    text.includes("f-zero") ||
    text.includes("burnout") ||
    text.includes("forza") ||
    text.includes("colin mcrae") ||
    text.includes("ctr") ||
    text.includes("ridge racer")
  ) {
    return "Corrida & Velocidade";
  }

  if (
    text.includes("final fantasy") ||
    text.includes("pokemon") ||
    text.includes("pokémon") ||
    text.includes("chrono") ||
    text.includes("dragon quest") ||
    text.includes("kingdom hearts") ||
    text.includes("persona") ||
    text.includes("tales of") ||
    text.includes("suikoden") ||
    text.includes("star ocean") ||
    text.includes("valkyrie") ||
    text.includes("xenogears") ||
    text.includes("paper mario")
  ) {
    return "RPG & JRPG";
  }

  if (
    text.includes("tekken") ||
    text.includes("street fighter") ||
    text.includes("mortal kombat") ||
    text.includes("smash bros") ||
    text.includes("guilty gear") ||
    text.includes("marvel vs") ||
    text.includes("king of fighters") ||
    text.includes("soulcalibur") ||
    text.includes("virtua fighter")
  ) {
    return "Luta & Combate";
  }

  if (
    text.includes("doom") ||
    text.includes("half-life") ||
    text.includes("halo") ||
    text.includes("goldeneye") ||
    text.includes("perfect dark") ||
    text.includes("quake") ||
    text.includes("time crisis") ||
    text.includes("medal of honor") ||
    text.includes("call of duty")
  ) {
    return "Tiro & FPS";
  }

  if (
    text.includes("resident evil") ||
    text.includes("silent hill") ||
    text.includes("dino crisis") ||
    text.includes("fatal frame") ||
    text.includes("alone in the dark") ||
    text.includes("parasite eve")
  ) {
    return "Survival Horror";
  }

  if (
    text.includes("tony hawk") ||
    text.includes("fifa") ||
    text.includes("pes") ||
    text.includes("winning eleven") ||
    text.includes("nba") ||
    text.includes("ssx")
  ) {
    return "Esportes & Radical";
  }

  return "Aventura & Clássicos";
};

export const GamingStatisticsView: React.FC<ReplayViewProps> = ({
  onBackToLibrary,
  games = [],
}) => {
  const [analytics, setAnalytics] = useState<ReplayAnalytics | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"overview" | "games" | "platforms" | "genres" | "habits">("overview");

  // Retrospective Modal State
  const [isRetrospectiveOpen, setIsRetrospectiveOpen] = useState(false);
  const [retrospectiveSlide, setRetrospectiveSlide] = useState(0);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Sorting state for games ranking
  const [gameSortBy, setGameSortBy] = useState<"playtime" | "sessions">("playtime");

  useEffect(() => {
    loadAnalytics(selectedYear);
  }, [selectedYear]);

  const loadAnalytics = async (yr: number) => {
    setIsLoading(true);
    try {
      const data = await api.getAnalytics(yr);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Calculate Genre Breakdown
  const genreBreakdown = useMemo<GenreAnalyticsItem[]>(() => {
    if (!analytics) return [];
    const genreMap: Record<string, { total_seconds: number; games: Set<string> }> = {};
    const totalPlaytime = analytics.total_playtime_seconds;

    // Use top games to attribute played seconds to genres
    for (const g of analytics.top_games) {
      const fullGame = games.find((item) => item.id === g.game_id);
      const genre = inferGameGenre(g.title, fullGame?.notes);

      if (!genreMap[genre]) {
        genreMap[genre] = { total_seconds: 0, games: new Set() };
      }
      genreMap[genre].total_seconds += g.total_seconds;
      genreMap[genre].games.add(g.title);
    }

    return Object.entries(genreMap)
      .map(([genre, data]) => ({
        genre,
        total_seconds: data.total_seconds,
        game_count: data.games.size,
        percentage: totalPlaytime > 0 ? (data.total_seconds / totalPlaytime) * 100 : 0,
        games: Array.from(data.games),
      }))
      .sort((a, b) => b.total_seconds - a.total_seconds);
  }, [analytics, games]);

  // 2. Calculate Day/Time Habits Breakdown
  const habitsData = useMemo(() => {
    if (!analytics) return { timeOfDay: [], dayOfWeek: [], gamerType: "Gamer Equilibrado" };

    const timeBuckets = {
      madrugada: { label: "Madrugada (00h - 06h)", icon: "Moon", seconds: 0, color: "#8B5CF6" },
      manha: { label: "Manhã (06h - 12h)", icon: "Sunrise", seconds: 0, color: "#F59E0B" },
      tarde: { label: "Tarde (12h - 18h)", icon: "Sun", seconds: 0, color: "#00E5FF" },
      noite: { label: "Noite (18h - 00h)", icon: "Sunset", seconds: 0, color: "#EC4899" },
    };

    const daysMap: Record<number, { name: string; seconds: number; count: number }> = {
      0: { name: "Domingo", seconds: 0, count: 0 },
      1: { name: "Segunda", seconds: 0, count: 0 },
      2: { name: "Terça", seconds: 0, count: 0 },
      3: { name: "Quarta", seconds: 0, count: 0 },
      4: { name: "Quinta", seconds: 0, count: 0 },
      5: { name: "Sexta", seconds: 0, count: 0 },
      6: { name: "Sábado", seconds: 0, count: 0 },
    };

    let totalTrackedSecs = 0;

    for (const sess of analytics.recent_sessions) {
      totalTrackedSecs += sess.duration_seconds;
      try {
        const d = new Date(sess.started_at);
        const hour = d.getHours();
        const day = d.getDay();

        if (daysMap[day]) {
          daysMap[day].seconds += sess.duration_seconds;
          daysMap[day].count += 1;
        }

        if (hour >= 0 && hour < 6) timeBuckets.madrugada.seconds += sess.duration_seconds;
        else if (hour >= 6 && hour < 12) timeBuckets.manha.seconds += sess.duration_seconds;
        else if (hour >= 12 && hour < 18) timeBuckets.tarde.seconds += sess.duration_seconds;
        else timeBuckets.noite.seconds += sess.duration_seconds;
      } catch {
        timeBuckets.noite.seconds += sess.duration_seconds;
      }
    }

    // Fallback if sessions are sparse
    if (totalTrackedSecs === 0 && analytics.total_playtime_seconds > 0) {
      timeBuckets.noite.seconds = Math.floor(analytics.total_playtime_seconds * 0.55);
      timeBuckets.tarde.seconds = Math.floor(analytics.total_playtime_seconds * 0.3);
      timeBuckets.madrugada.seconds = Math.floor(analytics.total_playtime_seconds * 0.15);
      totalTrackedSecs = analytics.total_playtime_seconds;
    }

    const timeOfDayList = Object.entries(timeBuckets).map(([key, item]) => ({
      key,
      label: item.label,
      seconds: item.seconds,
      color: item.color,
      percentage: totalTrackedSecs > 0 ? (item.seconds / totalTrackedSecs) * 100 : 0,
    }));

    const maxTime = timeOfDayList.reduce((prev, curr) => (curr.seconds > prev.seconds ? curr : prev), timeOfDayList[0]);
    let gamerType = "Gamer Noturno 🌙";
    if (maxTime.key === "madrugada") gamerType = "Coruja da Madrugada 🌌";
    else if (maxTime.key === "manha") gamerType = "Gamer Matutino 🌅";
    else if (maxTime.key === "tarde") gamerType = "Gamer Vespertino ☀️";

    const dayOfWeekList = Object.entries(daysMap).map(([idx, item]) => ({
      day_index: Number(idx),
      day_name: item.name,
      seconds: item.seconds,
      session_count: item.count,
    }));

    return {
      timeOfDay: timeOfDayList,
      dayOfWeek: dayOfWeekList,
      gamerType,
    };
  }, [analytics]);

  // 3. Recomp vs Emulator Ratio
  const executionTypeStats = useMemo(() => {
    if (!analytics || !games.length) return { recompHours: "0", emuHours: "0", recompPercent: 80, emuPercent: 20 };

    let recompSecs = 0;
    let emuSecs = 0;

    for (const topG of analytics.top_games) {
      const g = games.find((item) => item.id === topG.game_id);
      if (g?.is_emulator) {
        emuSecs += topG.total_seconds;
      } else {
        recompSecs += topG.total_seconds;
      }
    }

    const tot = recompSecs + emuSecs || 1;
    return {
      recompHours: (recompSecs / 3600).toFixed(1),
      emuHours: (emuSecs / 3600).toFixed(1),
      recompPercent: Math.round((recompSecs / tot) * 100),
      emuPercent: Math.round((emuSecs / tot) * 100),
    };
  }, [analytics, games]);

  if (isLoading && !analytics) {
    return (
      <div className="replay-container" style={{ padding: "80px", textAlign: "center" }}>
        <Sparkles size={44} className="pulse-glow" style={{ color: "var(--accent-cyan)", marginBottom: "16px" }} />
        <h2 style={{ color: "#fff", fontSize: "1.4rem", fontWeight: 700 }}>
          Processando Gaming Statistics...
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "6px" }}>
          Calculando métricas de consoles, gêneros e sessões de jogo da sua biblioteca
        </p>
      </div>
    );
  }

  if (!analytics) return null;

  const topGame = analytics.top_games[0];
  const totalHours = (analytics.total_playtime_seconds / 3600).toFixed(1);
  const avgSessionMin = analytics.total_sessions_count > 0
    ? Math.round((analytics.total_playtime_seconds / analytics.total_sessions_count) / 60)
    : 0;

  const topGenre = genreBreakdown[0] || { genre: "Ação & Aventura", percentage: 0, total_seconds: 0 };
  const topPlatform = analytics.platform_distribution[0];

  const sortedGames = [...analytics.top_games].sort((a, b) => {
    if (gameSortBy === "sessions") return b.session_count - a.session_count;
    return b.total_seconds - a.total_seconds;
  });

  const maxMonthlySecs = Math.max(...analytics.monthly_breakdown.map((m) => m.total_seconds), 3600);
  const peakMonth = analytics.monthly_breakdown.reduce((prev, curr) => (curr.total_seconds > prev.total_seconds ? curr : prev), analytics.monthly_breakdown[0]);

  const handleCopySummary = () => {
    const text = `🎮 Minhas Estatísticas Gamingzone (${selectedYear === 0 ? "Histórico Geral" : selectedYear}):
⏱️ Tempo Total: ${totalHours}h jogadas (${analytics.total_sessions_count} sessões)
🏆 Jogo #1: ${topGame?.title || "Nenhum"} (${formatPlaytime(topGame?.total_seconds || 0)})
🕹️ Plataforma Favorita: ${topPlatform?.name || "Nenhuma"} (${topPlatform?.percentage.toFixed(0)}%)
🏷️ Gênero Predileto: ${topGenre.genre} (${topGenre.percentage.toFixed(0)}%)
⚡ Perfil de Jogador: ${habitsData.gamerType}`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  return (
    <div className="replay-container">
      {/* TOP CONTROLS & YEAR SELECTOR */}
      <div className="replay-top-nav" style={{ flexWrap: "wrap", gap: "12px" }}>
        <button className="btn-secondary" onClick={onBackToLibrary}>
          ← Voltar para Biblioteca
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* YEAR SELECTION PILLS */}
          <div className="year-selector-pills">
            <button
              className={`year-pill ${selectedYear === 0 ? "active" : ""}`}
              onClick={() => setSelectedYear(0)}
            >
              Todos os Anos (Geral)
            </button>
            {analytics.available_years.map((yr) => (
              <button
                key={yr}
                className={`year-pill ${selectedYear === yr ? "active" : ""}`}
                onClick={() => setSelectedYear(yr)}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* RETROSPECTIVA GAMINGZONE SPECIAL BUTTON */}
          <button
            className="btn-retrospective-cta"
            onClick={() => {
              setRetrospectiveSlide(0);
              setIsRetrospectiveOpen(true);
            }}
            title="Abrir a Retrospectiva Interativa do Gamingzone"
          >
            <Sparkles size={16} />
            <span>Retrospectiva Gamingzone {selectedYear === 0 ? "" : selectedYear}</span>
          </button>
        </div>
      </div>

      {/* HEADER DA CENTRAL DE ESTATÍSTICAS */}
      <div className="stats-hub-header">
        <div className="stats-hub-title-box">
          <div className="stats-icon-badge">
            <BarChart3 size={26} />
          </div>
          <div>
            <h1 className="stats-hub-h1">Gaming Statistics</h1>
            <p className="stats-hub-subtitle">
              Central de inteligência com estatísticas completas, plataformas, gêneros, recordes e análise da sua biblioteca.
            </p>
          </div>
        </div>

        {/* STATS TABS NAVIGATION */}
        <div className="stats-tabs-bar">
          <button
            className={`stats-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <PieChart size={15} />
            <span>Visão Geral</span>
          </button>
          <button
            className={`stats-tab-btn ${activeTab === "games" ? "active" : ""}`}
            onClick={() => setActiveTab("games")}
          >
            <Trophy size={15} />
            <span>Top Jogos</span>
          </button>
          <button
            className={`stats-tab-btn ${activeTab === "platforms" ? "active" : ""}`}
            onClick={() => setActiveTab("platforms")}
          >
            <Layers size={15} />
            <span>Plataformas</span>
          </button>
          <button
            className={`stats-tab-btn ${activeTab === "genres" ? "active" : ""}`}
            onClick={() => setActiveTab("genres")}
          >
            <Gamepad2 size={15} />
            <span>Gêneros Mais Jogados</span>
          </button>
          <button
            className={`stats-tab-btn ${activeTab === "habits" ? "active" : ""}`}
            onClick={() => setActiveTab("habits")}
          >
            <Calendar size={15} />
            <span>Hábitos & Horários</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: VISÃO GERAL */}
      {/* ========================================================================= */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* KPI CARDS (6 CARDS) */}
          <div className="replay-kpi-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <div className="replay-kpi-card">
              <span className="replay-kpi-label">Tempo Total Jogado</span>
              <div className="replay-kpi-val-group">
                <Clock size={20} color="var(--accent-cyan)" />
                <span className="replay-kpi-val">{totalHours}h</span>
              </div>
              <span className="replay-kpi-sub">{formatPlaytime(analytics.total_playtime_seconds)}</span>
            </div>

            <div className="replay-kpi-card">
              <span className="replay-kpi-label">Jogos Explorados</span>
              <div className="replay-kpi-val-group">
                <Gamepad2 size={20} color="#B347FF" />
                <span className="replay-kpi-val">{analytics.total_games_played}</span>
              </div>
              <span className="replay-kpi-sub">
                {games.length > 0 ? `${Math.round((analytics.total_games_played / games.length) * 100)}% da sua coleção` : "Títulos ativos"}
              </span>
            </div>

            <div className="replay-kpi-card">
              <span className="replay-kpi-label">Total de Sessões</span>
              <div className="replay-kpi-val-group">
                <TrendingUp size={20} color="#00E676" />
                <span className="replay-kpi-val">{analytics.total_sessions_count}</span>
              </div>
              <span className="replay-kpi-sub">Iniciações registradas</span>
            </div>

            <div className="replay-kpi-card">
              <span className="replay-kpi-label">Média por Sessão</span>
              <div className="replay-kpi-val-group">
                <Target size={20} color="#F59E0B" />
                <span className="replay-kpi-val">{avgSessionMin}m</span>
              </div>
              <span className="replay-kpi-sub">Tempo médio de jogada</span>
            </div>

            <div className="replay-kpi-card">
              <span className="replay-kpi-label">Sessão Maratona Recorde</span>
              <div className="replay-kpi-val-group">
                <Trophy size={20} color="#FFD700" />
                <span className="replay-kpi-val">{formatPlaytime(analytics.longest_session_seconds)}</span>
              </div>
              <span className="replay-kpi-sub" title={analytics.longest_session_game || ""}>
                {analytics.longest_session_game || "Nenhuma sessão"}
              </span>
            </div>

            <div className="replay-kpi-card">
              <span className="replay-kpi-label">Recomps vs Emulação</span>
              <div className="replay-kpi-val-group">
                <Cpu size={20} color="#00E5FF" />
                <span className="replay-kpi-val" style={{ fontSize: "1.2rem" }}>
                  {executionTypeStats.recompPercent}% / {executionTypeStats.emuPercent}%
                </span>
              </div>
              <span className="replay-kpi-sub">
                {executionTypeStats.recompHours}h Recomp • {executionTypeStats.emuHours}h Emulado
              </span>
            </div>
          </div>

          {/* SPOTLIGHT: #1 JOGO DO ANO */}
          {topGame && (
            <div className="spotlight-card">
              <div className="spotlight-badge">
                <Trophy size={16} color="#FFD700" />
                <span>JOGO #1 MAIS JOGADO NO PERÍODO</span>
              </div>

              <div className="spotlight-content">
                <div className="spotlight-cover-wrapper">
                  {topGame.cover_url ? (
                    <img
                      src={formatImageUrl(topGame.cover_url)}
                      alt={topGame.title}
                      className="spotlight-cover-img"
                    />
                  ) : (
                    <div className="spotlight-cover-fallback">
                      <Gamepad2 size={48} color={topGame.platform_color} />
                    </div>
                  )}
                  <div
                    className="spotlight-platform-badge"
                    style={{ borderColor: topGame.platform_color, color: topGame.platform_color }}
                  >
                    {topGame.platform_name}
                  </div>
                </div>

                <div className="spotlight-info">
                  <h2 className="spotlight-title">{topGame.title}</h2>
                  <p className="spotlight-highlight-text">
                    Você dedicou <strong style={{ color: "var(--accent-cyan)", fontSize: "1.2rem" }}>{topGame.percentage.toFixed(0)}%</strong> de todo o seu tempo de gameplay a este jogo!
                  </p>

                  <div className="spotlight-stats-row">
                    <div className="spotlight-stat-item">
                      <span className="stat-label">Tempo Acumulado</span>
                      <span className="stat-value">{formatPlaytime(topGame.total_seconds)}</span>
                    </div>
                    <div className="spotlight-stat-item">
                      <span className="stat-label">Sessões Concluídas</span>
                      <span className="stat-value">{topGame.session_count} sessões</span>
                    </div>
                    <div className="spotlight-stat-item">
                      <span className="stat-label">Gênero Principal</span>
                      <span className="stat-value" style={{ color: "#A78BFA" }}>{inferGameGenre(topGame.title)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2-COLUMN SUMMARY: TOP PLATAFORMA + TOP GÊNERO */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            {/* PLATAFORMA DOMINANTE */}
            <div className="replay-section-card">
              <div className="replay-section-header">
                <Layers size={18} color={topPlatform?.color || "#00E5FF"} />
                <h3>Plataforma Dominante</h3>
              </div>
              {topPlatform ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 800, color: topPlatform.color }}>
                      {topPlatform.name}
                    </span>
                    <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {topPlatform.percentage.toFixed(0)}% do tempo
                    </span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "6px 0 14px 0" }}>
                    {formatPlaytime(topPlatform.total_seconds)} distribuídos em {topPlatform.game_count} {topPlatform.game_count === 1 ? "título" : "títulos"}
                  </p>
                  <div className="ranking-progress-track">
                    <div
                      className="ranking-progress-fill"
                      style={{ width: `${topPlatform.percentage}%`, backgroundColor: topPlatform.color }}
                    />
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Sem dados de plataforma.</p>
              )}
            </div>

            {/* GÊNERO DOMINANTE */}
            <div className="replay-section-card">
              <div className="replay-section-header">
                <Gamepad2 size={18} color="#FF9900" />
                <h3>Gênero Mais Jogado</h3>
              </div>
              {topGenre ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#FFB84D" }}>
                      {topGenre.genre}
                    </span>
                    <span style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {topGenre.percentage.toFixed(0)}% do tempo
                    </span>
                  </div>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "6px 0 14px 0" }}>
                    {formatPlaytime(topGenre.total_seconds)} em {topGenre.game_count} {topGenre.game_count === 1 ? "jogo" : "jogos"}
                  </p>
                  <div className="ranking-progress-track">
                    <div
                      className="ranking-progress-fill"
                      style={{ width: `${topGenre.percentage}%`, background: "linear-gradient(90deg, #FF9900 0%, #FF007F 100%)" }}
                    />
                  </div>
                </div>
              ) : (
                <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Sem dados de gênero.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TOP JOGOS */}
      {/* ========================================================================= */}
      {activeTab === "games" && (
        <div className="replay-body-layout">
          <div className="replay-section-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
              <div className="replay-section-header">
                <Trophy size={20} color="var(--accent-cyan)" />
                <h3>Ranking dos Jogos Mais Jogados ({sortedGames.length})</h3>
              </div>

              {/* SORT SWITCHER */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className={`choice-btn ${gameSortBy === "playtime" ? "active" : ""}`}
                  onClick={() => setGameSortBy("playtime")}
                  style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                >
                  Por Horas Jogadas
                </button>
                <button
                  className={`choice-btn ${gameSortBy === "sessions" ? "active" : ""}`}
                  onClick={() => setGameSortBy("sessions")}
                  style={{ fontSize: "0.75rem", padding: "6px 12px" }}
                >
                  Por Nº de Sessões
                </button>
              </div>
            </div>

            {/* PODIUM VISUAL (TOP 3) */}
            {sortedGames.length >= 2 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: sortedGames.length >= 3 ? "1fr 1.15fr 1fr" : "1fr 1fr",
                  gap: "14px",
                  margin: "8px 0 16px 0",
                  alignItems: "end",
                }}
              >
                {/* #2 SILVER */}
                {sortedGames[1] && (
                  <div
                    style={{
                      background: "rgba(192, 192, 192, 0.08)",
                      border: "1px solid rgba(192, 192, 192, 0.3)",
                      borderRadius: "14px",
                      padding: "16px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Medal size={28} color="#C0C0C0" />
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#C0C0C0" }}>#2 PRATA</span>
                    {sortedGames[1].cover_url && (
                      <img
                        src={formatImageUrl(sortedGames[1].cover_url)}
                        alt={sortedGames[1].title}
                        style={{ width: "65px", height: "85px", objectFit: "cover", borderRadius: "6px" }}
                      />
                    )}
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sortedGames[1].title}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
                      {formatPlaytime(sortedGames[1].total_seconds)}
                    </span>
                  </div>
                )}

                {/* #1 GOLD */}
                {sortedGames[0] && (
                  <div
                    style={{
                      background: "linear-gradient(180deg, rgba(255, 215, 0, 0.15) 0%, rgba(20, 26, 40, 0.9) 100%)",
                      border: "1px solid rgba(255, 215, 0, 0.5)",
                      borderRadius: "16px",
                      padding: "20px 16px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "10px",
                      boxShadow: "0 0 30px rgba(255, 215, 0, 0.15)",
                    }}
                  >
                    <Trophy size={36} color="#FFD700" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 900, color: "#FFD700", letterSpacing: "1px" }}>
                      #1 CAMPEÃO
                    </span>
                    {sortedGames[0].cover_url && (
                      <img
                        src={formatImageUrl(sortedGames[0].cover_url)}
                        alt={sortedGames[0].title}
                        style={{ width: "80px", height: "105px", objectFit: "cover", borderRadius: "8px", boxShadow: "0 8px 20px rgba(0,0,0,0.5)" }}
                      />
                    )}
                    <span style={{ fontSize: "1rem", fontWeight: 800, maxWidth: "190px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sortedGames[0].title}
                    </span>
                    <span style={{ fontSize: "0.95rem", color: "#FFD700", fontWeight: 800 }}>
                      {formatPlaytime(sortedGames[0].total_seconds)}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                      {sortedGames[0].percentage.toFixed(0)}% de todo o tempo
                    </span>
                  </div>
                )}

                {/* #3 BRONZE */}
                {sortedGames[2] && (
                  <div
                    style={{
                      background: "rgba(205, 127, 50, 0.08)",
                      border: "1px solid rgba(205, 127, 50, 0.3)",
                      borderRadius: "14px",
                      padding: "16px",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Award size={28} color="#CD7F32" />
                    <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#CD7F32" }}>#3 BRONZE</span>
                    {sortedGames[2].cover_url && (
                      <img
                        src={formatImageUrl(sortedGames[2].cover_url)}
                        alt={sortedGames[2].title}
                        style={{ width: "65px", height: "85px", objectFit: "cover", borderRadius: "6px" }}
                      />
                    )}
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {sortedGames[2].title}
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 700 }}>
                      {formatPlaytime(sortedGames[2].total_seconds)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* FULL RANKING LIST */}
            <div className="top-games-ranking-list">
              {sortedGames.map((g, idx) => {
                const rank = idx + 1;
                const rankColor =
                  rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : "var(--text-muted)";

                return (
                  <div key={g.game_id} className="ranking-item-row">
                    <div className="ranking-position" style={{ color: rankColor }}>
                      #{rank}
                    </div>

                    <div className="ranking-thumb-box">
                      {g.cover_url ? (
                        <img src={formatImageUrl(g.cover_url)} alt={g.title} />
                      ) : (
                        <div className="ranking-thumb-fallback">
                          <Gamepad2 size={16} />
                        </div>
                      )}
                    </div>

                    <div className="ranking-details">
                      <div className="ranking-title-line">
                        <span className="ranking-game-title">{g.title}</span>
                        <span
                          className="ranking-platform-tag"
                          style={{ borderColor: g.platform_color, color: g.platform_color }}
                        >
                          {g.platform_name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-muted)",
                            background: "rgba(255,255,255,0.06)",
                            padding: "2px 8px",
                            borderRadius: "10px",
                          }}
                        >
                          {inferGameGenre(g.title)}
                        </span>
                      </div>

                      <div className="ranking-progress-track">
                        <div
                          className="ranking-progress-fill"
                          style={{
                            width: `${Math.max(g.percentage, 5)}%`,
                            backgroundColor: g.platform_color || "var(--accent-cyan)",
                          }}
                        />
                      </div>
                    </div>

                    <div className="ranking-time-box">
                      <span className="ranking-time-val">{formatPlaytime(g.total_seconds)}</span>
                      <span className="ranking-percent-val">
                        {g.percentage.toFixed(0)}% • {g.session_count} {g.session_count === 1 ? "sessão" : "sessões"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: PLATAFORMAS & CONSOLES */}
      {/* ========================================================================= */}
      {activeTab === "platforms" && (
        <div className="replay-body-layout">
          <div className="replay-section-card">
            <div className="replay-section-header">
              <Layers size={20} color="#B347FF" />
              <h3>Distribuição de Plataformas e Consoles de Origem</h3>
            </div>

            {/* STACKED COLOR BAR */}
            <div className="platform-stacked-bar">
              {analytics.platform_distribution.map((p) => (
                <div
                  key={p.platform_id}
                  className="stacked-bar-segment"
                  style={{ width: `${p.percentage}%`, backgroundColor: p.color }}
                  title={`${p.name}: ${p.percentage.toFixed(1)}% (${formatPlaytime(p.total_seconds)})`}
                />
              ))}
            </div>

            {/* PLATFORM CARDS GRID */}
            <div className="platform-cards-grid">
              {analytics.platform_distribution.map((p) => (
                <div key={p.platform_id} className="platform-dist-card">
                  <div className="platform-dist-header">
                    <span className="platform-badge-dot" style={{ backgroundColor: p.color, color: p.color }} />
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{p.name}</span>
                  </div>
                  <div className="platform-dist-percentage" style={{ color: p.color }}>
                    {p.percentage.toFixed(0)}%
                  </div>
                  <div className="platform-dist-time">
                    {formatPlaytime(p.total_seconds)} • {p.game_count} {p.game_count === 1 ? "título" : "títulos"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GÊNEROS & CATEGORIAS */}
      {/* ========================================================================= */}
      {activeTab === "genres" && (
        <div className="replay-body-layout">
          <div className="replay-section-card">
            <div className="replay-section-header">
              <Gamepad2 size={20} color="#FF9900" />
              <div>
                <h3>Gêneros e Categorias Mais Jogados</h3>
                <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Análise detalhada por estilo de jogo e distribuição do seu tempo
                </p>
              </div>
            </div>

            {/* GENRES GRID */}
            <div className="genres-grid">
              {genreBreakdown.map((item, idx) => (
                <div key={item.genre} className="genre-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          background: idx === 0 ? "rgba(255, 153, 0, 0.2)" : "rgba(255, 255, 255, 0.08)",
                          color: idx === 0 ? "#FF9900" : "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontWeight: 800,
                        }}
                      >
                        #{idx + 1}
                      </span>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{item.genre}</span>
                    </div>
                    <span style={{ fontSize: "1.1rem", fontWeight: 800, color: idx === 0 ? "#FF9900" : "var(--accent-cyan)" }}>
                      {item.percentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="ranking-progress-track">
                    <div
                      className="ranking-progress-fill"
                      style={{
                        width: `${item.percentage}%`,
                        background: idx === 0 ? "linear-gradient(90deg, #FF9900 0%, #FF007F 100%)" : "var(--accent-cyan)",
                      }}
                    />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    <span>{formatPlaytime(item.total_seconds)}</span>
                    <span>{item.game_count} {item.game_count === 1 ? "jogo" : "jogos"}</span>
                  </div>

                  {item.games.length > 0 && (
                    <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "4px" }}>
                      {item.games.map((gTitle) => (
                        <span
                          key={gTitle}
                          style={{
                            fontSize: "0.68rem",
                            background: "rgba(255, 255, 255, 0.05)",
                            padding: "2px 8px",
                            borderRadius: "10px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {gTitle}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HÁBITOS & HORÁRIOS */}
      {/* ========================================================================= */}
      {activeTab === "habits" && (
        <div className="replay-body-layout">
          {/* PERÍODO DO DIA + GAMER TYPE */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div className="replay-section-card">
              <div className="replay-section-header">
                <Sun size={20} color="#F59E0B" />
                <h3>Horário Preferido de Jogo</h3>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
                Seu perfil dominante: <strong style={{ color: "var(--accent-cyan)" }}>{habitsData.gamerType}</strong>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {habitsData.timeOfDay.map((t) => (
                  <div key={t.key}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600 }}>{t.label}</span>
                      <span style={{ color: t.color, fontWeight: 700 }}>{t.percentage.toFixed(0)}%</span>
                    </div>
                    <div className="ranking-progress-track">
                      <div
                        className="ranking-progress-fill"
                        style={{ width: `${t.percentage}%`, backgroundColor: t.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MÊS DE PICO (MÊS DOURADO) */}
            <div className="replay-section-card">
              <div className="replay-section-header">
                <Sparkles size={20} color="#FFD700" />
                <h3>Mês de Maior Foco</h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "10px 0" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: "rgba(255, 215, 0, 0.15)",
                    border: "1px solid rgba(255, 215, 0, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFD700",
                    fontWeight: 900,
                    fontSize: "1.2rem",
                  }}
                >
                  {peakMonth.month_name}
                </div>
                <div>
                  <h4 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#fff" }}>
                    {peakMonth.month_name} foi seu mês recorde
                  </h4>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                    Você acumulou <strong style={{ color: "#FFD700" }}>{formatPlaytime(peakMonth.total_seconds)}</strong> de gameplay!
                  </p>
                </div>
              </div>

              {/* MONTHLY BAR CHART */}
              <div className="monthly-chart-container" style={{ marginTop: "16px" }}>
                {analytics.monthly_breakdown.map((m) => {
                  const heightPercent = maxMonthlySecs > 0 ? (m.total_seconds / maxMonthlySecs) * 100 : 0;
                  const hasActivity = m.total_seconds > 0;

                  return (
                    <div key={m.month} className="monthly-bar-col">
                      <div className="monthly-bar-wrapper">
                        <div
                          className={`monthly-bar-fill ${hasActivity ? "has-data" : ""}`}
                          style={{ height: `${Math.max(heightPercent, 4)}%` }}
                          title={`${m.month_name}: ${formatPlaytime(m.total_seconds)}`}
                        />
                      </div>
                      <span className="monthly-label">{m.month_name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* HISTÓRICO DAS SESSÕES RECENTES */}
          <div className="replay-section-card">
            <div className="replay-section-header">
              <History size={20} color="var(--accent-cyan)" />
              <h3>Linha do Tempo das Sessões Recentes</h3>
            </div>

            {analytics.recent_sessions.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                Nenhuma sessão gravada para este período.
              </p>
            ) : (
              <div className="recent-sessions-timeline">
                {analytics.recent_sessions.map((s) => (
                  <div key={s.id} className="timeline-session-item">
                    <div className="timeline-dot" style={{ backgroundColor: s.platform_color }} />
                    <div className="timeline-content">
                      <div className="timeline-title-row">
                        <span className="timeline-game-title">{s.game_title}</span>
                        <span className="timeline-duration">{formatPlaytime(s.duration_seconds)}</span>
                      </div>
                      <div className="timeline-meta-row">
                        <span style={{ color: s.platform_color, fontWeight: 700 }}>{s.platform_name}</span>
                        <span>•</span>
                        <span>{new Date(s.started_at).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL RETROSPECTIVA GAMINGZONE (INTERACTIVE STORY / WRAPPED) */}
      {/* ========================================================================= */}
      {isRetrospectiveOpen && (
        <div className="retrospective-modal-overlay" onClick={() => setIsRetrospectiveOpen(false)}>
          <div className="retrospective-card-container" onClick={(e) => e.stopPropagation()}>
            {/* CLOSE BUTTON */}
            <button
              className="btn-close"
              onClick={() => setIsRetrospectiveOpen(false)}
              style={{ position: "absolute", top: 20, right: 20, zIndex: 10, background: "rgba(255,255,255,0.08)" }}
            >
              <X size={20} />
            </button>

            {/* RETROSPECTIVE SLIDE CONTENT */}
            {retrospectiveSlide === 0 && (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "20px 0" }}>
                <div
                  style={{
                    background: "linear-gradient(135deg, #FF9900 0%, #FF007F 100%)",
                    width: "64px",
                    height: "64px",
                    borderRadius: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 30px rgba(255, 0, 128, 0.5)",
                  }}
                >
                  <Sparkles size={36} color="#fff" />
                </div>
                <div style={{ textTransform: "uppercase", letterSpacing: "2px", fontSize: "0.8rem", color: "#FF9900", fontWeight: 800 }}>
                  Retrospectiva Oficial Gamingzone {selectedYear === 0 ? "Histórica" : selectedYear}
                </div>
                <h2 style={{ fontSize: "2.4rem", fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.1 }}>
                  Sua Jornada em Números
                </h2>
                <p style={{ color: "var(--text-secondary)", maxWidth: "480px", fontSize: "0.95rem" }}>
                  Prepare-se para reviver suas melhores memórias, maiores conquistas e as horas dedicadas aos seus ports e jogos clássicos favoritos.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", width: "100%", marginTop: "16px" }}>
                  <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Clock size={22} color="var(--accent-cyan)" style={{ marginBottom: "6px" }} />
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff" }}>{totalHours}h</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Horas Jogadas</div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <Gamepad2 size={22} color="#B347FF" style={{ marginBottom: "6px" }} />
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff" }}>{analytics.total_games_played}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Jogos Explorados</div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.04)", padding: "16px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <TrendingUp size={22} color="#00E676" style={{ marginBottom: "6px" }} />
                    <div style={{ fontSize: "1.8rem", fontWeight: 900, color: "#fff" }}>{analytics.total_sessions_count}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Sessões Iniciadas</div>
                  </div>
                </div>
              </div>
            )}

            {retrospectiveSlide === 1 && topGame && (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "10px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FFD700", fontWeight: 800, fontSize: "0.85rem", letterSpacing: "1px" }}>
                  <Trophy size={18} />
                  <span>SEU JOGO CAMPEÃO DO ANO</span>
                </div>
                <h2 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", margin: 0 }}>
                  {topGame.title}
                </h2>

                <div style={{ position: "relative", width: "160px", height: "220px", borderRadius: "12px", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.7), 0 0 30px rgba(255,215,0,0.3)", border: "2px solid #FFD700" }}>
                  {topGame.cover_url ? (
                    <img src={formatImageUrl(topGame.cover_url)} alt={topGame.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Gamepad2 size={48} color="#FFD700" />
                    </div>
                  )}
                </div>

                <div style={{ background: "rgba(255,215,0,0.08)", border: "1px solid rgba(255,215,0,0.25)", padding: "12px 24px", borderRadius: "20px" }}>
                  <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FFD700" }}>
                    {formatPlaytime(topGame.total_seconds)}
                  </span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginLeft: "8px" }}>
                    ({topGame.percentage.toFixed(0)}% do seu tempo total em {topGame.session_count} sessões)
                  </span>
                </div>
              </div>
            )}

            {retrospectiveSlide === 2 && (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "20px 0" }}>
                <div style={{ textTransform: "uppercase", letterSpacing: "1.5px", fontSize: "0.8rem", color: "var(--accent-cyan)", fontWeight: 800 }}>
                  Seu DNA Gamer
                </div>
                <h2 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", margin: 0 }}>
                  De onde vêm suas paixões?
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%", marginTop: "10px" }}>
                  {/* PLATAFORMA */}
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
                    <Layers size={32} color={topPlatform?.color || "#00E5FF"} style={{ marginBottom: "10px" }} />
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Console Favorito</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: topPlatform?.color || "#fff", marginTop: "4px" }}>
                      {topPlatform?.name || "Retro PC"}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      {topPlatform?.percentage.toFixed(0)}% de todo o seu tempo
                    </div>
                  </div>

                  {/* GÊNERO */}
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
                    <Gamepad2 size={32} color="#FF9900" style={{ marginBottom: "10px" }} />
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Gênero Dominante</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#FFB84D", marginTop: "4px" }}>
                      {topGenre.genre}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                      {topGenre.percentage.toFixed(0)}% do seu tempo
                    </div>
                  </div>
                </div>
              </div>
            )}

            {retrospectiveSlide === 3 && (
              <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "20px 0" }}>
                <div style={{ textTransform: "uppercase", letterSpacing: "1.5px", fontSize: "0.8rem", color: "#A78BFA", fontWeight: 800 }}>
                  Seus Hábitos de Gameplay
                </div>
                <h2 style={{ fontSize: "2.2rem", fontWeight: 900, color: "#fff", margin: 0 }}>
                  Como você joga?
                </h2>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", width: "100%", marginTop: "10px" }}>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px" }}>
                    <Moon size={32} color="#EC4899" style={{ marginBottom: "10px" }} />
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Seu Perfil</div>
                    <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#fff", marginTop: "4px" }}>
                      {habitsData.gamerType}
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px" }}>
                    <Trophy size={32} color="#FFD700" style={{ marginBottom: "10px" }} />
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Maior Maratona</div>
                    <div style={{ fontSize: "1.35rem", fontWeight: 900, color: "#FFD700", marginTop: "4px" }}>
                      {formatPlaytime(analytics.longest_session_seconds)}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px" }}>
                      em {analytics.longest_session_game || "uma única sessão"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {retrospectiveSlide === 4 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "10px 0" }}>
                <div style={{ textTransform: "uppercase", letterSpacing: "1.5px", fontSize: "0.8rem", color: "#FF9900", fontWeight: 800 }}>
                  Card Oficial para Compartilhar
                </div>

                {/* THE SHAREABLE RETROSPECTIVE CARD */}
                <div
                  style={{
                    width: "100%",
                    maxWidth: "520px",
                    background: "linear-gradient(135deg, #180D2E 0%, #080D1A 100%)",
                    border: "2px solid rgba(255, 0, 128, 0.5)",
                    boxShadow: "0 10px 40px rgba(0,0,0,0.8), 0 0 30px rgba(255, 0, 128, 0.3)",
                    borderRadius: "18px",
                    padding: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Sparkles size={18} color="#FF007F" />
                      <span style={{ fontWeight: 900, letterSpacing: "1px", fontSize: "0.95rem" }}>
                        RETROSPECTIVA GAMINGZONE
                      </span>
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#FF9900" }}>
                      {selectedYear === 0 ? "GERAL" : selectedYear}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
                    <div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "var(--accent-cyan)" }}>{totalHours}h</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Tempo Jogado</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#B347FF" }}>{analytics.total_games_played}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Jogos</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.6rem", fontWeight: 900, color: "#00E676" }}>{analytics.total_sessions_count}</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Sessões</div>
                    </div>
                  </div>

                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ fontSize: "0.72rem", color: "#FFD700", fontWeight: 800, marginBottom: "4px" }}>
                      👑 JOGO #1 MAIS JOGADO
                    </div>
                    <div style={{ fontWeight: 800, fontSize: "1rem" }}>{topGame?.title || "Nenhum"}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                      {formatPlaytime(topGame?.total_seconds || 0)} ({topGame?.percentage.toFixed(0)}% do ano)
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "0.78rem" }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Console: </span>
                      <strong style={{ color: topPlatform?.color }}>{topPlatform?.name}</strong>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: "8px" }}>
                      <span style={{ color: "var(--text-muted)" }}>Gênero: </span>
                      <strong style={{ color: "#FFB84D" }}>{topGenre.genre}</strong>
                    </div>
                  </div>
                </div>

                {/* COPY TEXT BUTTON */}
                <button
                  className="btn-secondary"
                  onClick={handleCopySummary}
                  style={{ fontSize: "0.85rem", padding: "8px 18px", gap: "8px" }}
                >
                  {copiedSummary ? <Check size={16} color="#00E676" /> : <Share2 size={16} />}
                  <span>{copiedSummary ? "Copiado para a Área de Transferência!" : "Copiar Resumo em Texto"}</span>
                </button>
              </div>
            )}

            {/* RETROSPECTIVE FOOTER CONTROLS */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "18px" }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {[0, 1, 2, 3, 4].map((idx) => (
                  <div
                    key={idx}
                    onClick={() => setRetrospectiveSlide(idx)}
                    style={{
                      width: retrospectiveSlide === idx ? "24px" : "8px",
                      height: "8px",
                      borderRadius: "4px",
                      background: retrospectiveSlide === idx ? "linear-gradient(90deg, #FF9900, #FF007F)" : "rgba(255,255,255,0.2)",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                    }}
                  />
                ))}
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                {retrospectiveSlide > 0 && (
                  <button
                    className="btn-secondary"
                    onClick={() => setRetrospectiveSlide((prev) => Math.max(0, prev - 1))}
                    style={{ fontSize: "0.85rem", padding: "8px 14px" }}
                  >
                    <ChevronLeft size={16} />
                    <span>Anterior</span>
                  </button>
                )}

                {retrospectiveSlide < 4 ? (
                  <button
                    className="btn-primary"
                    onClick={() => setRetrospectiveSlide((prev) => Math.min(4, prev + 1))}
                    style={{ fontSize: "0.85rem", padding: "8px 18px" }}
                  >
                    <span>Próximo</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    className="btn-primary"
                    onClick={() => setIsRetrospectiveOpen(false)}
                    style={{ fontSize: "0.85rem", padding: "8px 18px" }}
                  >
                    <span>Concluir</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Retro-compatible alias
export const ReplayView = GamingStatisticsView;

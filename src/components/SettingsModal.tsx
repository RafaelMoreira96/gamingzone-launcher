import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X,
  Paintbrush,
  Eye,
  Layers,
  Plus,
  Trash2,
  Check,
  Sparkles,
  MessageSquare,
  Trophy,
  ExternalLink,
  ShieldCheck,
  Gamepad2,
  Music,
  Volume2,
  Tv,
  Database,
  Key,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { AppSettings, CardSizeType, FontSizeType, FontFamilyType, Platform, ThemeType, RaUserProfile, ControllerPromptType } from "../types";
import { api } from "../services/api";
import { ambientAudio } from "../services/ambientAudio";
import { ConsoleIcon } from "./ConsoleIcon";
import { IconPickerModal } from "./IconPickerModal";
import { PlayStationButton, XboxButton, NintendoButton } from "./ControllerButton";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  allPlatforms: Platform[];
  onPlatformsChanged: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  allPlatforms,
  onPlatformsChanged,
}) => {
  const [activeTab, setActiveTab] = useState<"appearance" | "accessibility" | "platforms" | "integrations" | "retroachievements" | "htpc">("appearance");

  // Horizontal Tabs Scrolling & Drag State
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const checkScroll = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [checkScroll]);

  // Convert mouse wheel into smooth horizontal scroll
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 || e.deltaX !== 0) {
        e.preventDefault();
        const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
        el.scrollLeft += delta;
        checkScroll();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [checkScroll]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = tabsRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = tabsRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const distance = Math.abs(x - startXRef.current);
    if (distance > 5) {
      hasDraggedRef.current = true;
      e.preventDefault();
      const walk = (x - startXRef.current) * 1.5;
      el.scrollLeft = scrollLeftRef.current - walk;
      checkScroll();
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const scrollTabs = (direction: "left" | "right") => {
    const el = tabsRef.current;
    if (!el) return;
    const amount = 220;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 250);
  };

  // Ensure active tab is scrolled into view when switching tabs
  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const activeBtn = el.querySelector(".settings-tab-btn.active") as HTMLElement | null;
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
    }
    checkScroll();
  }, [activeTab, checkScroll]);

  // RetroAchievements Test State
  const [raLoading, setRaLoading] = useState(false);
  const [raProfile, setRaProfile] = useState<RaUserProfile | null>(null);
  const [raError, setRaError] = useState<string | null>(null);

  // IGDB Test State
  const [igdbTesting, setIgdbTesting] = useState(false);
  const [igdbStatus, setIgdbStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showAdvancedIgdb, setShowAdvancedIgdb] = useState(false);

  const handleTestIgdb = async () => {
    const keyToTest = (settings.igdbApiKey || settings.igdbClientId || "").trim();
    if (!keyToTest) {
      setIgdbStatus({
        success: false,
        message: "Informe sua Chave de API do IGDB antes de realizar o teste.",
      });
      return;
    }
    setIgdbTesting(true);
    setIgdbStatus(null);
    try {
      const res = await api.testIgdbConnection(
        keyToTest,
        settings.igdbClientSecret?.trim() || undefined
      );
      setIgdbStatus({ success: true, message: res });
    } catch (err: any) {
      setIgdbStatus({
        success: false,
        message: err.toString() || "Erro ao conectar com a API do IGDB",
      });
    } finally {
      setIgdbTesting(false);
    }
  };

  // Discord Test State
  const [discordTesting, setDiscordTesting] = useState(false);
  const [discordStatus, setDiscordStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestDiscord = async () => {
    setDiscordTesting(true);
    setDiscordStatus(null);
    try {
      const msg = await api.testDiscordConnection(settings.discordClientId);
      setDiscordStatus({ success: true, message: msg });
    } catch (err: any) {
      setDiscordStatus({
        success: false,
        message: err.toString(),
      });
    } finally {
      setDiscordTesting(false);
    }
  };

  // Platform Management State
  const [newPlatName, setNewPlatName] = useState("");
  const [newPlatShort, setNewPlatShort] = useState("");
  const [newPlatColor, setNewPlatColor] = useState("#00E5FF");
  const [newPlatIcon, setNewPlatIcon] = useState("gamepad");
  const [newPlatDesc, setNewPlatDesc] = useState("");
  const [isAddingPlat, setIsAddingPlat] = useState(false);
  const [platError, setPlatError] = useState("");

  // Editing Platform State
  const [editingPlatId, setEditingPlatId] = useState<string | null>(null);
  const [editPlatName, setEditPlatName] = useState("");
  const [editPlatShort, setEditPlatShort] = useState("");
  const [editPlatColor, setEditPlatColor] = useState("#00E5FF");
  const [editPlatIcon, setEditPlatIcon] = useState("gamepad");
  const [editPlatDesc, setEditPlatDesc] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editPlatError, setEditPlatError] = useState("");

  // Icon Picker Modal State
  const [iconPickerTarget, setIconPickerTarget] = useState<"new" | "edit" | null>(null);

  if (!isOpen) return null;

  const themes: {
    id: ThemeType;
    name: string;
    color: string;
    fontName: string;
    fontFamily: string;
    desc: string;
  }[] = [
    {
      id: "midnight",
      name: "Midnight Cyan",
      color: "#00E5FF",
      fontName: "Plus Jakarta Sans",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      desc: "Obsidian com neon ciano e visual clean",
    },
    {
      id: "cyberpunk",
      name: "Cyberpunk 2077",
      color: "#FCEE0A",
      fontName: "Orbitron",
      fontFamily: "'Orbitron', sans-serif",
      desc: "Amarelo Night City com fonte futurista Orbitron",
    },
    {
      id: "retro-arcade",
      name: "Retro Arcade 8-Bit",
      color: "#FFE600",
      fontName: "Silkscreen Pixel",
      fontFamily: "'Silkscreen', monospace",
      desc: "Nostalgia fliperama com tipografia pixelada",
    },
    {
      id: "synthwave",
      name: "Synthwave Outrun",
      color: "#FF2A85",
      fontName: "Righteous",
      fontFamily: "'Righteous', cursive, sans-serif",
      desc: "Estética anos 80, neon magenta e fonte Righteous",
    },
    {
      id: "playstation",
      name: "PlayStation Heritage",
      color: "#006FCD",
      fontName: "Rajdhani",
      fontFamily: "'Rajdhani', sans-serif",
      desc: "Azul de console clássico com fonte Rajdhani",
    },
    {
      id: "gameboy",
      name: "Game Boy Classic",
      color: "#9BBC0F",
      fontName: "Silkscreen LCD",
      fontFamily: "'Silkscreen', monospace",
      desc: "Monocromático dot-matrix com tipografia portátil",
    },
    {
      id: "famicom",
      name: "Famicom & Nintendo",
      color: "#E52521",
      fontName: "Outfit",
      fontFamily: "'Outfit', sans-serif",
      desc: "Vermelho e dourado clássico com fonte Outfit",
    },
    {
      id: "pipboy",
      name: "Fallout Pip-Boy",
      color: "#FFB000",
      fontName: "Share Tech Mono",
      fontFamily: "'Share Tech Mono', monospace",
      desc: "Terminal CRT âmbar estilo retro-futurista",
    },
    {
      id: "cyber-violet",
      name: "Cyber Violet",
      color: "#B347FF",
      fontName: "Plus Jakarta Sans",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      desc: "Púrpura escuro e violeta elétrico",
    },
    {
      id: "emerald",
      name: "Emerald Matrix",
      color: "#00E676",
      fontName: "Share Tech Mono",
      fontFamily: "'Share Tech Mono', monospace",
      desc: "Verde esmeralda com tipografia terminal hacker",
    },
    {
      id: "crimson",
      name: "Crimson Blood",
      color: "#FF2A55",
      fontName: "Cinzel",
      fontFamily: "'Cinzel', serif",
      desc: "Charcoal escuro e vermelho rubi gótico / RPG",
    },
    {
      id: "high-contrast",
      name: "OLED High Contrast",
      color: "#FFFFFF",
      fontName: "Plus Jakarta Sans",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      desc: "Preto puro e contraste máximo",
    },
  ];

  const fontFamilies: {
    id: FontFamilyType;
    label: string;
    sample: string;
    badge: string;
    fontFamily: string;
  }[] = [
    { id: "auto", label: "Padrão do Tema", sample: "Fonte nativa do tema ativo", badge: "⚡ Auto", fontFamily: "inherit" },
    { id: "plus-jakarta", label: "Plus Jakarta Sans", sample: "Aa Bb Gg 123", badge: "Moderno", fontFamily: "'Plus Jakarta Sans', sans-serif" },
    { id: "orbitron", label: "Orbitron", sample: "Aa Bb Gg 123", badge: "Cyber", fontFamily: "'Orbitron', sans-serif" },
    { id: "silkscreen", label: "Silkscreen", sample: "Aa Bb Gg 123", badge: "Pixel", fontFamily: "'Silkscreen', monospace" },
    { id: "press-start", label: "Press Start 2P", sample: "ABC 123", badge: "Arcade", fontFamily: "'Press Start 2P', monospace" },
    { id: "rajdhani", label: "Rajdhani", sample: "Aa Bb Gg 123", badge: "Tech", fontFamily: "'Rajdhani', sans-serif" },
    { id: "righteous", label: "Righteous", sample: "Aa Bb Gg 123", badge: "Retro", fontFamily: "'Righteous', cursive" },
    { id: "share-tech", label: "Share Tech Mono", sample: "Aa Bb Gg 123", badge: "Terminal", fontFamily: "'Share Tech Mono', monospace" },
    { id: "outfit", label: "Outfit", sample: "Aa Bb Gg 123", badge: "Clean", fontFamily: "'Outfit', sans-serif" },
    { id: "cinzel", label: "Cinzel", sample: "Aa Bb Gg 123", badge: "Fantasy", fontFamily: "'Cinzel', serif" },
    { id: "jetbrains", label: "JetBrains Mono", sample: "Aa Bb Gg 123", badge: "Código", fontFamily: "'JetBrains Mono', monospace" },
  ];

  const fontSizes: { id: FontSizeType; label: string; sample: string }[] = [
    { id: "small", label: "Pequena", sample: "85%" },
    { id: "medium", label: "Padrão", sample: "100%" },
    { id: "large", label: "Grande", sample: "115%" },
    { id: "xlarge", label: "Muito Grande", sample: "130%" },
  ];

  const cardSizes: { id: CardSizeType; label: string }[] = [
    { id: "compact", label: "Compacto" },
    { id: "normal", label: "Padrão" },
    { id: "spacious", label: "Espaçoso" },
  ];

  const handleTogglePlatform = async (id: string, currentState: boolean) => {
    try {
      await api.togglePlatform(id, !currentState);
      onPlatformsChanged();
    } catch (err: any) {
      alert("Erro ao alternar plataforma: " + err.toString());
    }
  };

  const handleDeletePlatform = async (plat: Platform) => {
    if (!confirm(`Tem certeza que deseja excluir o console "${plat.name}" (${plat.short_name}) da biblioteca?`)) return;
    try {
      await api.deletePlatform(plat.id, false);
      onPlatformsChanged();
    } catch (err: any) {
      const errStr = err.toString();
      if (errStr.includes("jogo(s) vinculado(s)") || errStr.includes("jogos vinculados")) {
        const reassign = confirm(
          `Atenção: Existem jogos cadastrados neste console (${plat.name}).\n\nDeseja transferir esses jogos para "Outra Plataforma" e excluir "${plat.name}" permanentemente?`
        );
        if (reassign) {
          try {
            await api.deletePlatform(plat.id, true);
            onPlatformsChanged();
            return;
          } catch (e2: any) {
            alert("Erro ao excluir: " + e2.toString());
            return;
          }
        }
      } else {
        alert("Erro ao excluir plataforma: " + errStr);
      }
    }
  };

  const handleStartEditPlatform = (plat: Platform) => {
    setEditingPlatId(plat.id);
    setEditPlatName(plat.name);
    setEditPlatShort(plat.short_name);
    setEditPlatColor(plat.brand_color);
    setEditPlatIcon(plat.icon_name || plat.id);
    setEditPlatDesc(plat.description || "");
    setEditPlatError("");
  };

  const handleCancelEdit = () => {
    setEditingPlatId(null);
    setEditPlatError("");
  };

  const handleSaveEditPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlatId) return;
    if (!editPlatName.trim() || !editPlatShort.trim()) {
      setEditPlatError("Informe o nome e a sigla da plataforma.");
      return;
    }

    setIsSavingEdit(true);
    setEditPlatError("");

    try {
      await api.updatePlatform({
        id: editingPlatId,
        name: editPlatName.trim(),
        short_name: editPlatShort.trim().toUpperCase(),
        brand_color: editPlatColor,
        icon_name: editPlatIcon,
        description: editPlatDesc.trim(),
      });
      setEditingPlatId(null);
      onPlatformsChanged();
    } catch (err: any) {
      setEditPlatError(err.toString());
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAddPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatName.trim() || !newPlatShort.trim()) {
      setPlatError("Informe o nome e a sigla da plataforma.");
      return;
    }

    setIsAddingPlat(true);
    setPlatError("");

    try {
      await api.addPlatform({
        name: newPlatName.trim(),
        short_name: newPlatShort.trim().toUpperCase(),
        brand_color: newPlatColor,
        icon_name: newPlatIcon,
        description: newPlatDesc.trim() || `Recompilações e emulação de ${newPlatName.trim()}`,
      });

      setNewPlatName("");
      setNewPlatShort("");
      setNewPlatDesc("");
      setNewPlatIcon("gamepad");
      onPlatformsChanged();
    } catch (err: any) {
      setPlatError(err.toString());
    } finally {
      setIsAddingPlat(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h2>Configurações — GAMINGZONE LAUNCHER</h2>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
              Personalize o visual, acessibilidade e gerencie os consoles exibidos
            </p>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* TABS WITH HORIZONTAL SCROLL CONTROLS */}
        <div className="settings-tabs-wrapper">
          {canScrollLeft && (
            <button
              type="button"
              className="tabs-scroll-btn left"
              onClick={() => scrollTabs("left")}
              title="Rolar abas para a esquerda"
              aria-label="Rolar para a esquerda"
            >
              <ChevronLeft size={16} />
            </button>
          )}

          <div
            ref={tabsRef}
            className="settings-tabs"
            onScroll={checkScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            <button
              className={`settings-tab-btn ${activeTab === "appearance" ? "active" : ""}`}
              onClick={() => {
                if (hasDraggedRef.current) return;
                setActiveTab("appearance");
              }}
            >
              <Paintbrush size={16} />
              <span>Aparência & Temas</span>
            </button>
            <button
              className={`settings-tab-btn ${activeTab === "accessibility" ? "active" : ""}`}
              onClick={() => {
                if (hasDraggedRef.current) return;
                setActiveTab("accessibility");
              }}
            >
              <Eye size={16} />
              <span>Acessibilidade</span>
            </button>
            <button
              className={`settings-tab-btn ${activeTab === "platforms" ? "active" : ""}`}
              onClick={() => {
                if (hasDraggedRef.current) return;
                setActiveTab("platforms");
              }}
            >
              <Layers size={16} />
              <span>Gerenciar Plataformas</span>
            </button>
            <button
              className={`settings-tab-btn ${activeTab === "integrations" ? "active" : ""}`}
              onClick={() => {
                if (hasDraggedRef.current) return;
                setActiveTab("integrations");
              }}
            >
              <MessageSquare size={16} />
              <span>Integrações & Discord</span>
            </button>
            <button
              className={`settings-tab-btn ${activeTab === "retroachievements" ? "active" : ""}`}
              onClick={() => {
                if (hasDraggedRef.current) return;
                setActiveTab("retroachievements");
              }}
              style={{
                color: activeTab === "retroachievements" ? "#FFB84D" : undefined,
                borderColor: activeTab === "retroachievements" ? "#FF9900" : undefined,
              }}
            >
              <Trophy size={16} color="#FF9900" />
              <span>RetroAchievements</span>
            </button>
            <button
              className={`settings-tab-btn ${activeTab === "htpc" ? "active" : ""}`}
              onClick={() => {
                if (hasDraggedRef.current) return;
                setActiveTab("htpc");
              }}
              style={{
                color: activeTab === "htpc" ? "var(--accent-cyan)" : undefined,
                borderColor: activeTab === "htpc" ? "var(--accent-cyan)" : undefined,
              }}
            >
              <Tv size={16} color="var(--accent-cyan)" />
              <span>Console & Áudio</span>
            </button>
          </div>

          {canScrollRight && (
            <button
              type="button"
              className="tabs-scroll-btn right"
              onClick={() => scrollTabs("right")}
              title="Rolar abas para a direita"
              aria-label="Rolar para a direita"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {/* TAB BODY */}
        <div className="modal-body">
          {/* TAB 1: APARÊNCIA */}
          {activeTab === "appearance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label className="form-label" style={{ margin: 0 }}>Tema da Interface (Cores & Tipografia):</label>
                  <span style={{ fontSize: "0.72rem", color: "var(--accent-cyan)" }}>
                    {themes.length} temas disponíveis
                  </span>
                </div>
                <div className="theme-options-grid">
                  {themes.map((t) => {
                    const isActive = settings.theme === t.id;
                    return (
                      <div
                        key={t.id}
                        className={`theme-card ${isActive ? "active" : ""}`}
                        onClick={() => onUpdateSettings({ theme: t.id })}
                        style={{ position: "relative" }}
                      >
                        <div
                          className="theme-preview-circle"
                          style={{ backgroundColor: t.color, boxShadow: `0 0 12px ${t.color}` }}
                        />
                        <span style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: t.fontFamily }}>
                          {t.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.65rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(255, 255, 255, 0.08)",
                            color: "var(--accent-cyan)",
                            fontFamily: t.fontFamily,
                          }}
                        >
                          🔤 {t.fontName}
                        </span>
                        <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", lineHeight: 1.3 }}>
                          {t.desc}
                        </span>
                        {isActive && <Check size={14} color="var(--accent-cyan)" style={{ marginTop: "2px" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TIPOGRAFIA / FONTE DA INTERFACE */}
              <div className="form-group">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <label className="form-label" style={{ margin: 0 }}>Tipografia da Interface (Fonte):</label>
                  <span style={{ fontSize: "0.72rem", color: "var(--accent-cyan)" }}>
                    Alterne para qualquer fonte ou mantenha a original do tema
                  </span>
                </div>
                <div className="font-options-grid">
                  {fontFamilies.map((f) => {
                    const isSelected = (settings.fontFamily || "auto") === f.id;
                    return (
                      <div
                        key={f.id}
                        className={`font-option-card ${isSelected ? "active" : ""}`}
                        onClick={() => onUpdateSettings({ fontFamily: f.id })}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onUpdateSettings({ fontFamily: f.id });
                          }
                        }}
                      >
                        <div className="font-card-header">
                          <span className="font-card-title">{f.label}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span className="font-card-badge">{f.badge}</span>
                            {isSelected && <Check size={14} color="var(--accent-cyan)" />}
                          </div>
                        </div>
                        <div
                          className="font-card-sample"
                          style={{
                            fontFamily: f.fontFamily,
                            fontSize: f.id === "press-start" ? "0.68rem" : "0.82rem",
                          }}
                        >
                          {f.sample}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Densidade dos Cards de Jogos:</label>
                <div className="card-size-row">
                  {cardSizes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`choice-btn ${settings.cardSize === c.id ? "active" : ""}`}
                      onClick={() => onUpdateSettings({ cardSize: c.id })}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="switch-row">
                <div className="switch-label-area">
                  <span className="switch-label">Efeitos de Desfocagem (Glassmorphism)</span>
                  <span className="switch-desc">
                    Transparências com blur na barra superior e modais
                  </span>
                </div>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={!settings.disableGlassmorphism}
                    onChange={(e) => onUpdateSettings({ disableGlassmorphism: !e.target.checked })}
                  />
                  <span className="slider-round" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: ACESSIBILIDADE */}
          {activeTab === "accessibility" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="form-group">
                <label className="form-label">Tamanho da Fonte (Escala da Interface):</label>
                <div className="font-size-row">
                  {fontSizes.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`choice-btn ${settings.fontSize === f.id ? "active" : ""}`}
                      onClick={() => onUpdateSettings({ fontSize: f.id })}
                    >
                      {f.label} ({f.sample})
                    </button>
                  ))}
                </div>
              </div>

              <div className="switch-row">
                <div className="switch-label-area">
                  <span className="switch-label">Reduzir Movimento e Animações</span>
                  <span className="switch-desc">
                    Desativa animações de zoom nos cards e transições dinâmicas para navegação imediata
                  </span>
                </div>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.reduceMotion}
                    onChange={(e) => onUpdateSettings({ reduceMotion: e.target.checked })}
                  />
                  <span className="slider-round" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: GERENCIAR PLATAFORMAS */}
          {activeTab === "platforms" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600 }}>
                  Consoles Cadastrados na Biblioteca:
                </span>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  Desative as plataformas que você não utiliza para mantê-las ocultas da barra lateral e dos filtros.
                </p>
              </div>

              {/* LISTA DE PLATAFORMAS COM TOGGLE, EDIÇÃO E EXCLUSÃO */}
              <div className="platforms-manager-list">
                {allPlatforms.map((plat) => {
                  const isEditingThis = editingPlatId === plat.id;

                  if (isEditingThis) {
                    return (
                      <form
                        key={plat.id}
                        onSubmit={handleSaveEditPlatform}
                        style={{
                          background: "rgba(0, 229, 255, 0.05)",
                          border: `1.5px solid ${editPlatColor}`,
                          borderRadius: "var(--radius-md)",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          boxShadow: `0 4px 20px ${editPlatColor}25`,
                          animation: "fadeIn 0.2s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Pencil size={16} color={editPlatColor} />
                            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#fff" }}>
                              Editar Console: {plat.name}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn-text"
                            onClick={handleCancelEdit}
                            style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                          >
                            Cancelar
                          </button>
                        </div>

                        {editPlatError && (
                          <div style={{ color: "var(--accent-red)", fontSize: "0.8rem" }}>
                            {editPlatError}
                          </div>
                        )}

                        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1.4fr auto", gap: "10px", alignItems: "center" }}>
                          <div>
                            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                              Nome do Console / Plataforma
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              value={editPlatName}
                              onChange={(e) => setEditPlatName(e.target.value)}
                              placeholder="Nome (ex: PlayStation 2)"
                              required
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                              Sigla (ex: PS2)
                            </label>
                            <input
                              type="text"
                              className="form-input"
                              value={editPlatShort}
                              onChange={(e) => setEditPlatShort(e.target.value)}
                              required
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                              Ícone da Plataforma
                            </label>
                            <button
                              type="button"
                              onClick={() => setIconPickerTarget("edit")}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "7px 12px",
                                borderRadius: "6px",
                                background: "rgba(255, 255, 255, 0.05)",
                                border: "1px solid var(--border-subtle)",
                                color: "#fff",
                                cursor: "pointer",
                                width: "100%",
                                fontSize: "0.8rem",
                              }}
                            >
                              <ConsoleIcon iconName={editPlatIcon} size={18} color={editPlatColor} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                Trocar Ícone...
                              </span>
                            </button>
                          </div>

                          <div>
                            <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                              Cor
                            </label>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <input
                                type="color"
                                value={editPlatColor}
                                onChange={(e) => setEditPlatColor(e.target.value)}
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "6px",
                                  border: "1px solid var(--border-subtle)",
                                  cursor: "pointer",
                                  background: "transparent",
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
                            Descrição da Plataforma
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="Descrição opcional (ex: Jogos clássicos de PS2)"
                            value={editPlatDesc}
                            onChange={(e) => setEditPlatDesc(e.target.value)}
                          />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                          <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
                            Cancelar
                          </button>
                          <button type="submit" className="btn-primary" disabled={isSavingEdit}>
                            <Check size={16} />
                            <span>{isSavingEdit ? "Salvando..." : "Salvar Alterações"}</span>
                          </button>
                        </div>
                      </form>
                    );
                  }

                  return (
                    <div key={plat.id} className="platform-manager-item">
                      <div className="platform-item-left">
                        <ConsoleIcon
                          platformId={plat.id}
                          iconName={plat.icon_name}
                          name={plat.name}
                          size={22}
                          color={plat.brand_color}
                        />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>{plat.name}</div>
                          <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {plat.description}
                          </div>
                        </div>
                      </div>

                      <div className="platform-item-right">
                        <div
                          className="platform-badge-preview"
                          style={{
                            backgroundColor: "rgba(10, 14, 22, 0.85)",
                            border: `1px solid ${plat.brand_color}`,
                            color: plat.brand_color,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <ConsoleIcon
                            platformId={plat.id}
                            iconName={plat.icon_name}
                            name={plat.name}
                            size={14}
                            color={plat.brand_color}
                          />
                          <span>{plat.short_name} → PC</span>
                        </div>

                        <label className="switch-toggle" title={plat.is_enabled ? "Desativar plataforma" : "Ativar plataforma"}>
                          <input
                            type="checkbox"
                            checked={plat.is_enabled}
                            onChange={() => handleTogglePlatform(plat.id, plat.is_enabled)}
                          />
                          <span className="slider-round" />
                        </label>

                        <button
                          type="button"
                          className="btn-edit-icon"
                          onClick={() => handleStartEditPlatform(plat)}
                          title="Editar plataforma / console"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          className="btn-delete-icon"
                          onClick={() => handleDeletePlatform(plat)}
                          title="Excluir plataforma / console da biblioteca"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* FORMULÁRIO PARA CADASTRAR NOVA PLATAFORMA */}
              <form onSubmit={handleAddPlatform} className="new-platform-box">
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Plus size={16} color="var(--accent-cyan)" />
                  <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    Cadastrar Nova Plataforma / Console
                  </span>
                </div>

                {platError && (
                  <div style={{ color: "var(--accent-red)", fontSize: "0.8rem" }}>{platError}</div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1.4fr auto", gap: "10px", alignItems: "center" }}>
                  <div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nome (ex: Nintendo Switch)"
                      value={newPlatName}
                      onChange={(e) => setNewPlatName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Sigla (ex: NSW)"
                      value={newPlatShort}
                      onChange={(e) => setNewPlatShort(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setIconPickerTarget("new")}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid var(--border-subtle)",
                        color: "#fff",
                        cursor: "pointer",
                        width: "100%",
                        fontSize: "0.8rem",
                      }}
                      title="Escolher ícone do console ou imagem do PC"
                    >
                      <ConsoleIcon iconName={newPlatIcon} size={18} color={newPlatColor} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Ícone: {newPlatIcon}
                      </span>
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <input
                      type="color"
                      value={newPlatColor}
                      onChange={(e) => setNewPlatColor(e.target.value)}
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "6px",
                        border: "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        background: "transparent",
                      }}
                    />
                    <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                      {newPlatColor}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1 }}
                    placeholder="Descrição opcional (ex: Ports nativos e emulação de Switch)"
                    value={newPlatDesc}
                    onChange={(e) => setNewPlatDesc(e.target.value)}
                  />
                  <button type="submit" className="btn-primary" disabled={isAddingPlat}>
                    <Sparkles size={16} />
                    <span>{isAddingPlat ? "Adicionando..." : "Salvar Plataforma"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: INTEGRAÇÕES & DISCORD */}
          {activeTab === "integrations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* DISCORD RPC CARD */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(88, 101, 242, 0.09) 0%, rgba(88, 101, 242, 0.03) 100%)",
                  border: "1px solid rgba(88, 101, 242, 0.35)",
                  borderRadius: "var(--radius-md)",
                  padding: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        background: "rgba(88, 101, 242, 0.22)",
                        padding: "10px",
                        borderRadius: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MessageSquare size={22} color="#5865F2" />
                    </div>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: "1rem", display: "block", color: "#fff" }}>
                        Discord Rich Presence (Status no Perfil)
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Exibe no seu perfil do Discord o jogo em execução, console e tempo de partida
                      </span>
                    </div>
                  </div>

                  <label className="switch-toggle">
                    <input
                      type="checkbox"
                      checked={settings.discordRpcEnabled ?? true}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        onUpdateSettings({ discordRpcEnabled: enabled });
                        api.setDiscordEnabled(enabled, settings.discordClientId);
                      }}
                    />
                    <span className="slider-round" />
                  </label>
                </div>

                {/* Discord Client ID (Customizable) */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.83rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span>Discord Application Client ID (Opcional):</span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 400 }}>
                      Padrão: 475456035851599874
                    </span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Deixe em branco para usar o ID padrão oficial ou insira seu Client ID do Discord..."
                    value={settings.discordClientId || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateSettings({ discordClientId: val });
                      api.setDiscordEnabled(settings.discordRpcEnabled ?? true, val);
                    }}
                    style={{ fontSize: "0.85rem" }}
                  />
                </div>

                {/* TEST BUTTON & FEEDBACK */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleTestDiscord}
                    disabled={discordTesting}
                    style={{
                      borderColor: "rgba(88, 101, 242, 0.5)",
                      color: "#858EFA",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "0.85rem",
                      padding: "8px 16px",
                    }}
                  >
                    <Sparkles size={15} />
                    <span>{discordTesting ? "Conectando ao Discord..." : "Testar Conexão com Discord"}</span>
                  </button>

                  {discordStatus && (
                    <div
                      style={{
                        fontSize: "0.82rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: discordStatus.success ? "var(--accent-green)" : "#FF5252",
                      }}
                    >
                      {discordStatus.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{discordStatus.message}</span>
                    </div>
                  )}
                </div>

                {/* IMPORTANT TIPS BOX */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.35)",
                    border: "1px dashed rgba(88, 101, 242, 0.3)",
                    borderRadius: "var(--radius-sm)",
                    padding: "12px 14px",
                    fontSize: "0.78rem",
                    color: "var(--text-secondary)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "#858EFA", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={14} />
                    <span>Como garantir que seu status apareça no Discord:</span>
                  </div>
                  <div>
                    1. <strong>O aplicativo Desktop do Discord precisa estar aberto</strong> no seu computador (a versão de navegador web não suporta Rich Presence).
                  </div>
                  <div>
                    2. No Discord, acesse <strong>Configurações de Usuário ⚙️ &gt; Configurações de Atividade &gt; Privacidade da Atividade</strong> e certifique-se de que a opção <strong>"Exibir atividade atual como uma mensagem de status"</strong> está <strong>ATIVADA</strong>.
                  </div>
                  <div>
                    3. Se o seu perfil no Discord estiver definido como <strong>Invisível</strong>, o Discord oculta o jogo em execução para outros usuários.
                  </div>
                </div>
              </div>

              {/* IGDB INTEGRATION CARD */}
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(145, 70, 255, 0.08) 0%, rgba(179, 71, 255, 0.03) 100%)",
                  border: "1px solid rgba(145, 70, 255, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        background: "rgba(145, 70, 255, 0.2)",
                        padding: "8px",
                        borderRadius: "8px",
                        display: "flex",
                      }}
                    >
                      <Database size={20} color="#B347FF" />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem", display: "block" }}>
                        IGDB API v4 (Twitch Developer)
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Base de dados global oficial para posters HD, banners 1080p e sinopses
                      </span>
                    </div>
                  </div>

                  <a
                    href="https://dev.twitch.tv/console"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      fontSize: "0.78rem",
                      color: "#B347FF",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    <span>Console Twitch</span>
                    <ExternalLink size={13} />
                  </a>
                </div>

                {/* Primary single API key field */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                    Chave de API do IGDB (Token de Acesso ou Chave Única):
                  </label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Cole sua API Key do IGDB aqui (ex: token Twitch ou CLIENT_ID:SECRET)..."
                    value={settings.igdbApiKey || settings.igdbClientId || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      onUpdateSettings({ igdbApiKey: val, igdbClientId: val });
                    }}
                  />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "4px", display: "block" }}>
                    Você só precisa fornecer esta chave para que o launcher busque automaticamente capas oficiais, banners e metadados no IGDB para todos os seus jogos recompilados e emulados.
                  </span>
                </div>

                {/* Advanced configuration toggle */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedIgdb(!showAdvancedIgdb)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-purple)",
                      fontSize: "0.76rem",
                      cursor: "pointer",
                      padding: 0,
                      textDecoration: "underline",
                      fontWeight: 600,
                    }}
                  >
                    {showAdvancedIgdb ? "▼ Ocultar campos separados de Client ID / Secret" : "▶ Configuração avançada (Client ID e Client Secret separados)"}
                  </button>

                  {showAdvancedIgdb && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: "0.78rem" }}>
                          IGDB Client ID:
                        </label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Ex: uo6dgg4p4e8..."
                          value={settings.igdbClientId || ""}
                          onChange={(e) => onUpdateSettings({ igdbClientId: e.target.value })}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: "0.78rem" }}>
                          IGDB Client Secret:
                        </label>
                        <input
                          type="password"
                          className="form-input"
                          placeholder="Ex: 5k28asdf..."
                          value={settings.igdbClientSecret || ""}
                          onChange={(e) => onUpdateSettings({ igdbClientSecret: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.25)",
                    borderRadius: "var(--radius-sm)",
                    padding: "10px 12px",
                    fontSize: "0.74rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: "var(--text-main)" }}>Como obter gratuitamente:</strong> Acesse o Twitch Dev Console, registre uma aplicação com nome <em>GamingZone</em> e redirect <code>http://localhost</code>, copie o <strong>Client ID</strong> e gere um <strong>Client Secret</strong> (ou utilize uma chave gerada via Twitch CLI).
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleTestIgdb}
                    disabled={igdbTesting}
                    style={{
                      borderColor: "rgba(179, 71, 255, 0.4)",
                      color: "#D48BFF",
                      padding: "8px 16px",
                      fontSize: "0.82rem",
                    }}
                  >
                    <Key size={14} />
                    <span>{igdbTesting ? "Validando credenciais..." : "Testar Conexão com IGDB"}</span>
                  </button>

                  {igdbStatus && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.78rem",
                        color: igdbStatus.success ? "#00E676" : "#FF5252",
                        background: igdbStatus.success ? "rgba(0, 230, 118, 0.1)" : "rgba(255, 82, 82, 0.1)",
                        padding: "6px 12px",
                        borderRadius: "var(--radius-sm)",
                        border: `1px solid ${igdbStatus.success ? "rgba(0, 230, 118, 0.3)" : "rgba(255, 82, 82, 0.3)"}`,
                      }}
                    >
                      {igdbStatus.success ? <Check size={14} /> : <AlertCircle size={14} />}
                      <span>{igdbStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* STEAMGRIDDB API KEY */}
              <div className="form-group">
                <label className="form-label">Chave de API do SteamGridDB (Opcional):</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Insira sua API Key do SteamGridDB para liberar pôsteres da comunidade..."
                  value={settings.steamGridDbApiKey || ""}
                  onChange={(e) => onUpdateSettings({ steamGridDbApiKey: e.target.value })}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Mesmo sem uma chave configurada, o <strong>Auto-Scraper</strong> busca automaticamente no Catálogo Curado de Recompilações, no IGDB (se configurado) e na CDN pública da Steam.
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: RETROACHIEVEMENTS */}
          {activeTab === "retroachievements" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(255, 153, 0, 0.1) 0%, rgba(255, 85, 0, 0.05) 100%)",
                  border: "1px solid rgba(255, 153, 0, 0.3)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "rgba(255, 153, 0, 0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Trophy size={26} color="#FF9900" />
                </div>
                <div>
                  <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#FFB84D", margin: 0 }}>
                    RetroAchievements Oficial
                  </h4>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Conecte sua conta do <strong>RetroAchievements</strong> para acompanhar troféus, pontuação e progresso em jogos emulados (PS1, PS2, GameCube, N64, PSP, etc.) diretamente no lançador!
                  </p>
                </div>
              </div>

              {raError && (
                <div
                  style={{
                    background: "rgba(255, 51, 75, 0.15)",
                    border: "1px solid var(--accent-red)",
                    color: "#ff6b7e",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                  }}
                >
                  {raError}
                </div>
              )}

              {/* USERNAME */}
              <div className="form-group">
                <label className="form-label">Nome de Usuário (Username):</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Seu usuário no retroachievements.org"
                  value={settings.raUsername || ""}
                  onChange={(e) => onUpdateSettings({ raUsername: e.target.value })}
                />
              </div>

              {/* WEB API KEY */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="form-label">Web API Key Pessoal:</label>
                  <a
                    href="https://retroachievements.org/controlpanel.php"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: "0.75rem",
                      color: "#FFB84D",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      textDecoration: "none",
                    }}
                  >
                    <span>Pegar minha chave no site</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Sua Web API Key gerada no painel de controle do RetroAchievements..."
                  value={settings.raApiKey || ""}
                  onChange={(e) => onUpdateSettings({ raApiKey: e.target.value })}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  A chave Web API é obtida em <strong>Configurações da Conta → Keys → Web API Key</strong> no site oficial do RetroAchievements.
                </span>
              </div>

              {/* HARDCORE MODE SWITCH */}
              <div className="switch-row">
                <div className="switch-label-area">
                  <span className="switch-label" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <ShieldCheck size={16} color="var(--accent-green)" />
                    <span>Priorizar Pontuação Modo Hardcore</span>
                  </span>
                  <span className="switch-desc">
                    Exibe a pontuação oficial hardcore (desativa save states nos emuladores compatíveis)
                  </span>
                </div>
                <label className="switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.raHardcoreMode ?? true}
                    onChange={(e) => onUpdateSettings({ raHardcoreMode: e.target.checked })}
                  />
                  <span className="slider-round" />
                </label>
              </div>

              {/* TEST CONNECTION BUTTON */}
              <div>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={raLoading}
                  style={{
                    borderColor: "rgba(255, 153, 0, 0.4)",
                    color: "#FFB84D",
                  }}
                  onClick={async () => {
                    setRaLoading(true);
                    setRaError(null);
                    try {
                      const user = settings.raUsername?.trim() || "RetroGamerBR";
                      const key = settings.raApiKey?.trim() || "demo";
                      const prof = await api.getRaProfile(user, key);
                      setRaProfile(prof);
                    } catch (err: any) {
                      setRaError(err.toString());
                    } finally {
                      setRaLoading(false);
                    }
                  }}
                >
                  <Sparkles size={16} />
                  <span>{raLoading ? "Conectando ao RetroAchievements..." : "Testar Conexão / Buscar Perfil"}</span>
                </button>
              </div>

              {/* PROFILE CARD PREVIEW */}
              {raProfile && (
                <div
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid rgba(255, 153, 0, 0.3)",
                    borderRadius: "var(--radius-md)",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                        src={raProfile.user_pic}
                        alt={raProfile.user}
                        style={{
                          width: "52px",
                          height: "52px",
                          borderRadius: "50%",
                          border: "2px solid #FF9900",
                          objectFit: "cover",
                          background: "#080a0f",
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://media.retroachievements.org/UserPic/RetroAchievements.png";
                        }}
                      />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>
                            {raProfile.user}
                          </span>
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(0, 230, 118, 0.15)",
                              color: "var(--accent-green)",
                              border: "1px solid var(--accent-green)",
                              borderRadius: "4px",
                              padding: "2px 6px",
                              fontWeight: 800,
                            }}
                          >
                            CONECTADO
                          </span>
                        </div>
                        {raProfile.motto && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: "2px" }}>
                            "{raProfile.motto}"
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "10px",
                      background: "rgba(0, 0, 0, 0.25)",
                      padding: "12px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                        Posição no Rank
                      </span>
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "#FFB84D" }}>
                        #{raProfile.rank.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                        Pontos Oficiais
                      </span>
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent-cyan)" }}>
                        {raProfile.points.toLocaleString()} pts
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", display: "block" }}>
                        RetroPoints (True)
                      </span>
                      <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--accent-green)" }}>
                        {raProfile.total_true_points.toLocaleString()} pts
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HTPC & AUDIO TAB */}
          {activeTab === "htpc" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Big Picture Startup */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Tv size={20} style={{ color: "var(--accent-cyan)" }} />
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>Modo Console de Sala (HTPC)</span>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.startInBigPicture ?? false}
                      onChange={(e) => onUpdateSettings({ startInBigPicture: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Iniciar o GamingZone Launcher diretamente no Modo Big Picture em tela cheia ao abrir o aplicativo. Ideal para PCs conectados à TV da sala ou setups dedicados com controle.
                </p>
              </div>

              {/* Controller Prompts Style */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <Gamepad2 size={20} style={{ color: "#FF7043" }} />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem", display: "block" }}>
                      Estilo dos Prompts de Controle
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Define os ícones e letras de botões exibidos na interface e no Modo Big Picture
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                  {(
                    [
                      {
                        id: "xbox",
                        label: "Xbox",
                        icon: "xbox",
                        brandColor: "#107C10",
                        activeBg: "linear-gradient(135deg, rgba(16, 124, 16, 0.16) 0%, rgba(10, 24, 10, 0.85) 100%)",
                        activeBorder: "#107C10",
                        activeGlow: "0 0 16px rgba(16, 124, 16, 0.4)",
                        desc: "Padrão PC / XInput • Microsoft",
                        renderButtons: () => (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", margin: "8px 0" }}>
                            <XboxButton letter="A" size={22} />
                            <XboxButton letter="B" size={22} />
                            <XboxButton letter="X" size={22} />
                            <XboxButton letter="Y" size={22} />
                          </div>
                        ),
                      },
                      {
                        id: "playstation",
                        label: "PlayStation",
                        icon: "ps1",
                        brandColor: "#0070D1",
                        activeBg: "linear-gradient(135deg, rgba(0, 112, 209, 0.18) 0%, rgba(10, 18, 36, 0.85) 100%)",
                        activeBorder: "#0070D1",
                        activeGlow: "0 0 18px rgba(0, 112, 209, 0.45)",
                        desc: "DualShock / DualSense • Sony",
                        renderButtons: () => (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", margin: "8px 0" }}>
                            <PlayStationButton symbol="cross" size={22} />
                            <PlayStationButton symbol="circle" size={22} />
                            <PlayStationButton symbol="square" size={22} />
                            <PlayStationButton symbol="triangle" size={22} />
                          </div>
                        ),
                      },
                      {
                        id: "nintendo",
                        label: "Nintendo",
                        icon: "switch",
                        brandColor: "#E60012",
                        activeBg: "linear-gradient(135deg, rgba(230, 0, 18, 0.16) 0%, rgba(30, 10, 10, 0.85) 100%)",
                        activeBorder: "#E60012",
                        activeGlow: "0 0 16px rgba(230, 0, 18, 0.4)",
                        desc: "Switch / Retro Pro • Nintendo",
                        renderButtons: () => (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", margin: "8px 0" }}>
                            <NintendoButton letter="B" size={22} />
                            <NintendoButton letter="A" size={22} />
                            <NintendoButton letter="Y" size={22} />
                            <NintendoButton letter="X" size={22} />
                          </div>
                        ),
                      },
                    ] as const
                  ).map((layout) => {
                    const isSelected = (settings.controllerType ?? "xbox") === layout.id;
                    return (
                      <div
                        key={layout.id}
                        onClick={() => onUpdateSettings({ controllerType: layout.id as ControllerPromptType })}
                        style={{
                          background: isSelected ? layout.activeBg : "rgba(255, 255, 255, 0.02)",
                          border: isSelected ? `2px solid ${layout.activeBorder}` : "1px solid var(--border-color)",
                          borderRadius: "var(--radius-md)",
                          padding: "14px 10px",
                          cursor: "pointer",
                          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                          textAlign: "center",
                          boxShadow: isSelected ? layout.activeGlow : "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", marginBottom: "4px" }}>
                          <ConsoleIcon iconName={layout.icon} size={16} color={isSelected ? layout.brandColor : undefined} />
                          <span style={{ fontWeight: 800, fontSize: "0.92rem", color: isSelected ? "#fff" : "var(--text-primary)" }}>
                            {layout.label}
                          </span>
                        </div>
                        {layout.renderButtons()}
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          {layout.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Ambient Lo-Fi Synth Audio */}
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Music size={20} style={{ color: "#B347FF" }} />
                    <div>
                      <span style={{ fontWeight: 700, fontSize: "0.95rem", display: "block" }}>
                        Trilha Sonora Ambiente Retro Lo-Fi
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        Sintetizador procedural offline com acordes suaves e nostálgicos
                      </span>
                    </div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={settings.ambientMusicEnabled ?? false}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        onUpdateSettings({ ambientMusicEnabled: enabled });
                        if (enabled) {
                          ambientAudio.start(settings.ambientMusicVolume ?? 0.25);
                        } else {
                          ambientAudio.stop();
                        }
                      }}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <p style={{ margin: "0 0 14px 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Gera acordes analógicos dinâmicos no navegador (sem download de arquivos pesados). Pausa automaticamente ao entrar em um jogo e retorna suavemente ao sair.
                </p>

                {/* Volume Slider */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "rgba(0,0,0,0.2)",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    opacity: settings.ambientMusicEnabled ? 1 : 0.45,
                    pointerEvents: settings.ambientMusicEnabled ? "auto" : "none",
                  }}
                >
                  <Volume2 size={18} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                  <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)", minWidth: "50px" }}>
                    Volume:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.ambientMusicVolume ?? 0.25}
                    onChange={(e) => {
                      const vol = parseFloat(e.target.value);
                      onUpdateSettings({ ambientMusicVolume: vol });
                      ambientAudio.setVolume(vol);
                    }}
                    style={{ flex: 1, accentColor: "#B347FF", cursor: "pointer" }}
                  />
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      minWidth: "40px",
                      textAlign: "right",
                      color: "var(--accent-purple)",
                    }}
                  >
                    {Math.round((settings.ambientMusicVolume ?? 0.25) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Concluído
          </button>
        </div>
      </div>

      {/* MODAL SELETOR DE ÍCONES DE PLATAFORMA */}
      <IconPickerModal
        isOpen={iconPickerTarget !== null}
        onClose={() => setIconPickerTarget(null)}
        selectedIcon={iconPickerTarget === "new" ? newPlatIcon : editPlatIcon}
        onSelectIcon={(icon) => {
          if (iconPickerTarget === "new") {
            setNewPlatIcon(icon);
          } else if (iconPickerTarget === "edit") {
            setEditPlatIcon(icon);
          }
        }}
        color={iconPickerTarget === "new" ? newPlatColor : editPlatColor}
        title={
          iconPickerTarget === "new"
            ? "Escolher Ícone para Nova Plataforma"
            : `Escolher Ícone para ${editPlatName || "Console"}`
        }
      />
    </div>
  );
};

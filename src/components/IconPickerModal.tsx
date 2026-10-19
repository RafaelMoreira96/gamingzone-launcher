import React from "react";
import { useState, useMemo } from "react";
import { X, Search, Upload, Check, FolderOpen } from "lucide-react";
import { ConsoleIcon, AVAILABLE_ICON_PRESETS } from "./ConsoleIcon";
import { api, formatImageUrl } from "../services/api";

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
  color?: string;
  title?: string;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  selectedIcon,
  onSelectIcon,
  color = "#00E5FF",
  title = "Escolher Ícone da Plataforma",
}) => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<
    "all" | "playstation" | "nintendo" | "sega" | "xbox" | "symbols"
  >("all");
  const [isPickingFile, setIsPickingFile] = useState(false);

  const filteredPresets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return AVAILABLE_ICON_PRESETS.filter((p) => {
      let matchCat = true;
      if (category === "symbols") {
        matchCat = p.category === "symbols";
      } else if (category === "playstation") {
        matchCat = p.id.startsWith("ps");
      } else if (category === "nintendo") {
        matchCat = [
          "nes",
          "snes",
          "n64",
          "gamecube",
          "wii",
          "wiiu",
          "switch",
          "gb",
          "gbc",
          "gba",
          "nds",
          "3ds",
          "virtualboy",
        ].includes(p.id);
      } else if (category === "sega") {
        matchCat = ["mastersystem", "genesis", "gamegear", "saturn", "dreamcast"].includes(p.id);
      } else if (category === "xbox") {
        matchCat = p.id.startsWith("xbox");
      }

      if (!matchCat) return false;
      if (!q) return true;

      const matchNameOrId =
        p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
      const matchKeyword =
        p.keywords && p.keywords.some((k) => k.toLowerCase().includes(q));

      return matchNameOrId || matchKeyword;
    });
  }, [search, category]);

  if (!isOpen) return null;

  const handlePickCustomFile = async () => {
    try {
      setIsPickingFile(true);
      const filePath = await api.pickImageFile();
      if (filePath) {
        onSelectIcon(filePath);
        onClose();
      }
    } catch (err: any) {
      alert("Erro ao selecionar imagem: " + err.toString());
    } finally {
      setIsPickingFile(false);
    }
  };

  const isCustomFile =
    selectedIcon.includes("/") ||
    selectedIcon.includes("\\") ||
    selectedIcon.startsWith("http") ||
    selectedIcon.startsWith("data:");

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 1200, background: "rgba(3, 5, 9, 0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: "760px",
          width: "94vw",
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
          padding: "24px",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.75)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(0, 229, 255, 0.12)",
                border: "1px solid rgba(0, 229, 255, 0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ConsoleIcon iconName={selectedIcon} size={24} color={color} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.15rem", margin: 0, fontWeight: 800 }}>{title}</h3>
              <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                Escolha o console oficial com visual autêntico ou envie uma imagem personalizada do seu PC
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>

        {/* SEARCH & FILTERS */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              flex: "1 1 240px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-sm)",
              padding: "6px 12px",
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar console ou símbolo (ex: PS2, N64, Switch, Mega Drive, Xbox)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontSize: "0.85rem",
                width: "100%",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* CATEGORY PILLS */}
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`console-quick-pill ${category === "all" ? "active" : ""}`}
              onClick={() => setCategory("all")}
              style={{ padding: "5px 10px", fontSize: "0.72rem" }}
            >
              Todos
            </button>
            <button
              type="button"
              className={`console-quick-pill ${category === "playstation" ? "active" : ""}`}
              onClick={() => setCategory("playstation")}
              style={{ padding: "5px 10px", fontSize: "0.72rem" }}
            >
              PlayStation
            </button>
            <button
              type="button"
              className={`console-quick-pill ${category === "nintendo" ? "active" : ""}`}
              onClick={() => setCategory("nintendo")}
              style={{ padding: "5px 10px", fontSize: "0.72rem" }}
            >
              Nintendo
            </button>
            <button
              type="button"
              className={`console-quick-pill ${category === "sega" ? "active" : ""}`}
              onClick={() => setCategory("sega")}
              style={{ padding: "5px 10px", fontSize: "0.72rem" }}
            >
              Sega
            </button>
            <button
              type="button"
              className={`console-quick-pill ${category === "xbox" ? "active" : ""}`}
              onClick={() => setCategory("xbox")}
              style={{ padding: "5px 10px", fontSize: "0.72rem" }}
            >
              Xbox
            </button>
            <button
              type="button"
              className={`console-quick-pill ${category === "symbols" ? "active" : ""}`}
              onClick={() => setCategory("symbols")}
              style={{ padding: "5px 10px", fontSize: "0.72rem" }}
            >
              Símbolos
            </button>
          </div>
        </div>

        {/* CUSTOM FILE UPLOAD BANNER */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px dashed rgba(255, 255, 255, 0.15)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 14px",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FolderOpen size={18} color="var(--accent-cyan)" />
            <div style={{ fontSize: "0.8rem" }}>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                Usar imagem personalizada do computador
              </span>
              <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text-muted)" }}>
                Suporta arquivos .png, .ico, .svg, .webp e .jpg
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={handlePickCustomFile}
            disabled={isPickingFile}
            style={{ padding: "6px 12px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
          >
            <Upload size={14} />
            <span>{isPickingFile ? "Selecionando..." : "Escolher Arquivo..."}</span>
          </button>
        </div>

        {/* CUSTOM IMAGE PREVIEW IF ACTIVE */}
        {isCustomFile && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "rgba(0, 229, 255, 0.08)",
              border: "1px solid rgba(0, 229, 255, 0.25)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img
                src={formatImageUrl(selectedIcon)}
                alt="Custom icon"
                style={{ width: "24px", height: "24px", objectFit: "contain", borderRadius: "4px" }}
              />
              <span style={{ fontSize: "0.78rem", color: "var(--accent-cyan)", fontWeight: 600 }}>
                Ícone Personalizado Selecionado
              </span>
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                ({selectedIcon})
              </span>
            </div>
            <button
              type="button"
              className="btn-text"
              onClick={() => onSelectIcon("gamepad")}
              style={{ fontSize: "0.75rem", color: "#ff6b7e" }}
            >
              Remover Imagem
            </button>
          </div>
        )}

        {/* ICONS GRID */}
        <div
          className="thin-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: "10px",
            padding: "4px",
            maxHeight: "440px",
          }}
        >
          {filteredPresets.map((preset) => {
            const isSelected = selectedIcon === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onSelectIcon(preset.id);
                  onClose();
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  padding: "14px 10px",
                  borderRadius: "10px",
                  background: isSelected
                    ? "rgba(255, 255, 255, 0.12)"
                    : "rgba(255, 255, 255, 0.03)",
                  border: `1.5px solid ${isSelected ? color : "var(--border-subtle)"}`,
                  color: isSelected ? "#fff" : "var(--text-secondary)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? `0 0 16px ${color}40` : "none",
                }}
                title={preset.name}
              >
                <div style={{ position: "relative" }}>
                  <ConsoleIcon iconName={preset.id} size={32} color={isSelected ? color : undefined} />
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-4px",
                        right: "-6px",
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: color,
                        color: "#080a0f",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: isSelected ? 700 : 500,
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>

        {filteredPresets.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Nenhum ícone encontrado para "{search}".
          </div>
        )}
      </div>
    </div>
  );
};

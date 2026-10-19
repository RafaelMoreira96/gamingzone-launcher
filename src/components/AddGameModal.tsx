import React, { useState } from "react";
import { X, FolderOpen, Image as ImageIcon, Sparkles, Gamepad, Cpu, FolderUp } from "lucide-react";
import { Platform } from "../types";
import { api } from "../services/api";
import { AutoScraperModal } from "./AutoScraperModal";

interface AddGameModalProps {
  platforms: Platform[];
  isOpen: boolean;
  onClose: () => void;
  onGameAdded: () => void;
  onOpenBatchImport?: () => void;
  steamGridDbKey?: string;
  igdbApiKey?: string;
  igdbClientId?: string;
  igdbClientSecret?: string;
}

export const AddGameModal: React.FC<AddGameModalProps> = ({
  platforms,
  isOpen,
  onClose,
  onGameAdded,
  onOpenBatchImport,
  steamGridDbKey,
  igdbApiKey,
  igdbClientId,
  igdbClientSecret,
}) => {
  const [mode, setMode] = useState<"recomp" | "emulator">("recomp");
  const [title, setTitle] = useState("");
  const [originalPlatformId, setOriginalPlatformId] = useState(platforms[0]?.id || "n64");
  const [executablePath, setExecutablePath] = useState("");
  const [workingDir, setWorkingDir] = useState("");
  const [launchArguments, setLaunchArguments] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [notes, setNotes] = useState("");

  // Emulator specific
  const [emulatorPath, setEmulatorPath] = useState("");
  const [romPath, setRomPath] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isScraperOpen, setIsScraperOpen] = useState(false);

  if (!isOpen) return null;

  const handlePickExecutable = async () => {
    try {
      const res = await api.pickExecutableFile();
      if (res) {
        if (mode === "recomp") {
          setExecutablePath(res.file_path);
          if (!title.trim() && res.suggested_title) {
            setTitle(res.suggested_title);
          }
          if (!workingDir.trim() && res.working_dir) {
            setWorkingDir(res.working_dir);
          }
        } else {
          setEmulatorPath(res.file_path);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePickRom = async () => {
    try {
      const res = await api.pickRomFile();
      if (res) {
        setRomPath(res.file_path);
        if (!title.trim() && res.suggested_title) {
          setTitle(res.suggested_title);
        }
        if (!workingDir.trim() && res.working_dir) {
          setWorkingDir(res.working_dir);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePickCover = async () => {
    try {
      const res = await api.pickImageFile();
      if (res) {
        setCoverUrl(res);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePickBanner = async () => {
    try {
      const res = await api.pickImageFile();
      if (res) {
        setBannerUrl(res);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg("Informe o título do jogo.");
      return;
    }

    if (mode === "recomp") {
      if (!executablePath.trim()) {
        setErrorMsg("Selecione o arquivo executável do jogo (.exe).");
        return;
      }
    } else {
      if (!emulatorPath.trim()) {
        setErrorMsg("Selecione o executável do emulador (ex: pcsx2.exe, dolphin.exe).");
        return;
      }
      if (!romPath.trim()) {
        setErrorMsg("Selecione o arquivo da ROM / ISO do jogo.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const isEmulator = mode === "emulator";
      await api.addGame({
        title: title.trim(),
        original_platform_id: originalPlatformId,
        executable_path: isEmulator ? emulatorPath.trim() : executablePath.trim(),
        working_dir: workingDir.trim(),
        launch_arguments: isEmulator
          ? (launchArguments.trim() || '"{rom}"')
          : launchArguments.trim(),
        cover_url: coverUrl.trim() || undefined,
        banner_url: bannerUrl.trim() || undefined,
        notes: notes.trim() || undefined,
        is_emulator: isEmulator,
        emulator_path: isEmulator ? emulatorPath.trim() : undefined,
        rom_path: isEmulator ? romPath.trim() : undefined,
      });

      onGameAdded();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.toString());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <div>
              <h2>Adicionar Jogo</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Cadastre um port recompilado nativo ou um jogo via emulador
              </p>
            </div>
            <button className="btn-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* TYPE TOGGLE PILLS */}
          <div
            style={{
              display: "flex",
              padding: "0 28px",
              gap: "10px",
              marginTop: "16px",
            }}
          >
            <button
              type="button"
              className={`choice-btn ${mode === "recomp" ? "active" : ""}`}
              onClick={() => setMode("recomp")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Cpu size={16} />
              <span>Recompilação Nativa (PC Port)</span>
            </button>
            <button
              type="button"
              className={`choice-btn ${mode === "emulator" ? "active" : ""}`}
              onClick={() => {
                setMode("emulator");
                if (!launchArguments) setLaunchArguments('"{rom}"');
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Gamepad size={16} />
              <span>Jogo Emulado (ROM + Emulador)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {errorMsg && (
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
                  {errorMsg}
                </div>
              )}

              {/* SELEÇÃO DE PLATAFORMA DE ORIGEM */}
              <div className="form-group">
                <label className="form-label">
                  {mode === "recomp"
                    ? "Plataforma de Origem (Console do qual foi recompilado):"
                    : "Console Emulado:"}
                </label>
                <div className="platform-selector-grid">
                  {platforms.map((plat) => {
                    const isSelected = originalPlatformId === plat.id;
                    return (
                      <div
                        key={plat.id}
                        className={`platform-select-card ${isSelected ? "selected" : ""}`}
                        onClick={() => setOriginalPlatformId(plat.id)}
                        style={{
                          borderColor: isSelected ? plat.brand_color : undefined,
                        }}
                      >
                        <span
                          className="platform-badge-dot"
                          style={{
                            backgroundColor: plat.brand_color,
                            color: plat.brand_color,
                          }}
                        />
                        <span style={{ color: isSelected ? "#fff" : "var(--text-secondary)" }}>
                          {plat.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* CONDITIONAL INPUTS: RECOMP VS EMULATOR */}
              {mode === "recomp" ? (
                /* EXECUTÁVEL DO RECOMP */
                <div className="form-group">
                  <label className="form-label">Arquivo Executável do Recomp (.exe):</label>
                  <div className="file-picker-row">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="C:\Games\SoH\soh.exe"
                      value={executablePath}
                      onChange={(e) => setExecutablePath(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handlePickExecutable}
                    >
                      <FolderOpen size={16} />
                      <span>Procurar...</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* EMULATOR PATH */}
                  <div className="form-group">
                    <label className="form-label">Executável do Emulador:</label>
                    <div className="file-picker-row">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: C:\Emuladores\PCSX2\pcsx2-qtx64.exe"
                        value={emulatorPath}
                        onChange={(e) => setEmulatorPath(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handlePickExecutable}
                      >
                        <FolderOpen size={16} />
                        <span>Emulador...</span>
                      </button>
                    </div>
                  </div>

                  {/* ROM PATH */}
                  <div className="form-group">
                    <label className="form-label">Arquivo da ROM / Imagem do Jogo (.iso, .chd, .z64...):</label>
                    <div className="file-picker-row">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: D:\Jogos\PS2\God of War.iso"
                        value={romPath}
                        onChange={(e) => setRomPath(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handlePickRom}
                      >
                        <FolderOpen size={16} />
                        <span>ROM...</span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* TÍTULO DO JOGO + AUTO SCRAPER BUTTON */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="form-label">Título na Biblioteca:</label>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      borderColor: "rgba(0, 229, 255, 0.4)",
                      color: "var(--accent-cyan)",
                    }}
                    onClick={() => setIsScraperOpen(true)}
                  >
                    <Sparkles size={14} />
                    <span>Auto-Scraper de Capas</span>
                  </button>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: The Legend of Zelda: Ocarina of Time"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* DIRETÓRIO DE TRABALHO */}
              <div className="form-group">
                <label className="form-label">Diretório de Trabalho (Working Directory):</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Pasta onde o executável ou ROM está localizado"
                  value={workingDir}
                  onChange={(e) => setWorkingDir(e.target.value)}
                />
              </div>

              {/* ARGUMENTOS */}
              <div className="form-group">
                <label className="form-label">
                  Argumentos de Linha de Comando {mode === "emulator" && '(use "{rom}")'}:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={mode === "emulator" ? '"{rom}" ou -batch "{rom}"' : "Ex: --fullscreen --renderer vulkan"}
                  value={launchArguments}
                  onChange={(e) => setLaunchArguments(e.target.value)}
                />
              </div>

              {/* CAPA DO JOGO */}
              <div className="form-group">
                <label className="form-label">URL da Capa Vertical (Pôster 3:4):</label>
                <div className="file-picker-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://... ou caminho local de imagem"
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handlePickCover}
                  >
                    <ImageIcon size={16} />
                    <span>Local</span>
                  </button>
                </div>
              </div>

              {/* BANNER DO JOGO */}
              <div className="form-group">
                <label className="form-label">URL do Banner Panorâmico (Hero 16:9):</label>
                <div className="file-picker-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://... ou caminho local de imagem"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handlePickBanner}
                  >
                    <ImageIcon size={16} />
                    <span>Local</span>
                  </button>
                </div>
              </div>

              {/* NOTAS ADICIONAIS */}
              <div className="form-group">
                <label className="form-label">Notas e Informações:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: 60 FPS, widescreen nativo, texturas HD, mods aplicados"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* BATCH IMPORT CALLOUT */}
              {onOpenBatchImport && (
                <div
                  style={{
                    background: "rgba(0, 229, 255, 0.05)",
                    border: "1px dashed rgba(0, 229, 255, 0.3)",
                    borderRadius: "var(--radius-md)",
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    Quer adicionar uma pasta inteira com vários jogos de emulador?
                  </div>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: "0.78rem", whiteSpace: "nowrap" }}
                    onClick={() => {
                      onClose();
                      onOpenBatchImport();
                    }}
                  >
                    <FolderUp size={14} />
                    <span>Importação em Lote</span>
                  </button>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                <Sparkles size={16} />
                <span>{isSubmitting ? "Adicionando..." : "Adicionar à Biblioteca"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AUTO SCRAPER MODAL */}
      <AutoScraperModal
        isOpen={isScraperOpen}
        onClose={() => setIsScraperOpen(false)}
        initialQuery={title}
        steamGridDbKey={steamGridDbKey}
        igdbApiKey={igdbApiKey}
        igdbClientId={igdbClientId}
        igdbClientSecret={igdbClientSecret}
        onSelectAssets={(cUrl, bUrl, sugTitle) => {
          if (cUrl) setCoverUrl(cUrl);
          if (bUrl) setBannerUrl(bUrl);
          if (sugTitle && !title.trim()) setTitle(sugTitle);
        }}
      />
    </>
  );
};

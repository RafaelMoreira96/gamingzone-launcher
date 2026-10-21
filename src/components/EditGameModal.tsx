import React, { useState, useEffect } from "react";
import {
  X,
  FolderOpen,
  Image as ImageIcon,
  Sparkles,
  Gamepad,
  Cpu,
  Save,
  Folder,
  Star,
  AlertTriangle,
  HardDrive,
} from "lucide-react";
import { Game, Platform, PlayStatusType } from "../types";
import { api, formatImageUrl } from "../services/api";
import { AutoScraperModal } from "./AutoScraperModal";
import { ConsoleIcon } from "./ConsoleIcon";

interface EditGameModalProps {
  game: Game | null;
  platforms: Platform[];
  isOpen: boolean;
  onClose: () => void;
  onGameUpdated: () => void;
  steamGridDbKey?: string;
  igdbApiKey?: string;
  igdbClientId?: string;
  igdbClientSecret?: string;
}

export const EditGameModal: React.FC<EditGameModalProps> = ({
  game,
  platforms,
  isOpen,
  onClose,
  onGameUpdated,
  steamGridDbKey,
  igdbApiKey,
  igdbClientId,
  igdbClientSecret,
}) => {
  const [mode, setMode] = useState<"recomp" | "emulator">("recomp");
  const [title, setTitle] = useState("");
  const [originalPlatformId, setOriginalPlatformId] = useState("");
  const [executablePath, setExecutablePath] = useState("");
  const [emulatorPath, setEmulatorPath] = useState("");
  const [romPath, setRomPath] = useState("");
  const [workingDir, setWorkingDir] = useState("");
  const [launchArguments, setLaunchArguments] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [playStatus, setPlayStatus] = useState<PlayStatusType>("backlog");
  const [savePath, setSavePath] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isScraperOpen, setIsScraperOpen] = useState(false);

  useEffect(() => {
    if (game && isOpen) {
      setMode(game.is_emulator ? "emulator" : "recomp");
      setTitle(game.title || "");
      setOriginalPlatformId(game.original_platform_id || (platforms[0]?.id || "n64"));
      setExecutablePath(game.executable_path || "");
      setEmulatorPath(game.emulator_path || (game.is_emulator ? game.executable_path : ""));
      setRomPath(game.rom_path || "");
      setWorkingDir(game.working_dir || "");
      setLaunchArguments(game.launch_arguments || "");
      setCoverUrl(game.cover_url || "");
      setBannerUrl(game.banner_url || "");
      setNotes(game.notes || "");
      setPlayStatus(game.play_status || "backlog");
      setSavePath(game.save_path || "");
      setIsFavorite(Boolean(game.is_favorite));
      setErrorMsg("");
    }
  }, [game, isOpen, platforms]);

  if (!isOpen || !game) return null;

  const handlePickExecutable = async () => {
    try {
      const res = await api.pickExecutableFile();
      if (res) {
        if (mode === "recomp") {
          setExecutablePath(res.file_path);
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
        if (!workingDir.trim() && res.working_dir) {
          setWorkingDir(res.working_dir);
        }
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePickWorkingDir = async () => {
    try {
      const res = await api.pickDirectory();
      if (res) {
        setWorkingDir(res);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handlePickSavePath = async () => {
    try {
      const res = await api.pickSavePath();
      if (res) {
        setSavePath(res);
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
    if (!game) return;

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
      await api.updateGame({
        id: game.id,
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
        is_favorite: isFavorite,
        play_status: playStatus,
        save_path: savePath.trim() || undefined,
      });

      onGameUpdated();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.toString());
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPlatform = platforms.find((p) => p.id === originalPlatformId);
  const platformColor = selectedPlatform?.brand_color || "#00E5FF";

  return (
    <>
      <div className="modal-backdrop nested" onClick={onClose} style={{ zIndex: 35000 }}>
        <div
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "840px", width: "95vw", maxHeight: "92vh", overflowY: "auto" }}
        >
          {/* HEADER */}
          <div className="modal-header">
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "12px",
                  background: "rgba(0, 229, 255, 0.12)",
                  border: "1px solid rgba(0, 229, 255, 0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--accent-cyan)",
                }}
              >
                <ConsoleIcon
                  platformId={originalPlatformId}
                  name={selectedPlatform?.name}
                  size={22}
                  color={platformColor}
                />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#fff" }}>Editar Jogo</h2>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                  Modifique caminhos, executáveis, plataforma, artes e argumentos de <strong>{game.title}</strong>
                </p>
              </div>
            </div>
            <button className="btn-close" onClick={onClose} title="Fechar">
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
                flex: 1,
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
                flex: 1,
              }}
            >
              <Gamepad size={16} />
              <span>Jogo Emulado (ROM + Emulador)</span>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ padding: "20px 28px" }}>
              {errorMsg && (
                <div
                  style={{
                    background: "rgba(255, 51, 75, 0.15)",
                    border: "1px solid var(--accent-red)",
                    color: "#ff6b7e",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <AlertTriangle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* TÍTULO DO JOGO + AUTO SCRAPER */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <label className="form-label" style={{ margin: 0 }}>Título na Biblioteca:</label>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      borderColor: "rgba(0, 229, 255, 0.4)",
                      color: "var(--accent-cyan)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                    onClick={() => setIsScraperOpen(true)}
                  >
                    <Sparkles size={13} />
                    <span>Auto-Scraper (IGDB / SGDB)</span>
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

              {/* SELEÇÃO DE PLATAFORMA DE ORIGEM */}
              <div className="form-group">
                <label className="form-label">
                  {mode === "recomp"
                    ? "Plataforma de Origem (Console do qual foi recompilado):"
                    : "Console Emulado:"}
                </label>
                <div className="platform-selector-grid" style={{ maxHeight: "170px", overflowY: "auto" }}>
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
                        <ConsoleIcon
                          platformId={plat.id}
                          name={plat.name}
                          size={18}
                          color={plat.brand_color}
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

              {/* WORKING DIRECTORY & ARGUMENTS IN 2 COLUMNS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* DIRETÓRIO DE TRABALHO */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Pasta Base (Working Dir):</label>
                  <div className="file-picker-row">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Diretório onde o jogo executa"
                      value={workingDir}
                      onChange={(e) => setWorkingDir(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handlePickWorkingDir}
                      title="Procurar Pasta"
                    >
                      <Folder size={15} />
                    </button>
                  </div>
                </div>

                {/* ARGUMENTOS */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">
                    Argumentos {mode === "emulator" ? '(use "{rom}")' : "de Execução"}:
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={mode === "emulator" ? '"{rom}"' : "Ex: --fullscreen"}
                    value={launchArguments}
                    onChange={(e) => setLaunchArguments(e.target.value)}
                  />
                </div>
              </div>

              {/* CAMINHO DE SAVES */}
              <div className="form-group" style={{ marginTop: "16px" }}>
                <label className="form-label">Arquivo ou Pasta de Saves (Snapshots & Backups):</label>
                <div className="file-picker-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: C:\Games\Zelda\save.sav ou pasta de saves"
                    value={savePath}
                    onChange={(e) => setSavePath(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handlePickSavePath}
                    title="Procurar Caminho de Save"
                  >
                    <HardDrive size={15} />
                    <span>Save...</span>
                  </button>
                </div>
              </div>

              {/* ARTES VISUAIS (CAPA E BANNER) COM PREVIEWS */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                {/* CAPA VERTICAL */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Capa Vertical (Pôster 3:4):</label>
                  <div className="file-picker-row">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://... ou caminho local"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handlePickCover}
                      title="Escolher Imagem Local"
                    >
                      <ImageIcon size={15} />
                      <span>Local</span>
                    </button>
                  </div>
                  {coverUrl && (
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src={formatImageUrl(coverUrl)}
                        alt="Preview Capa"
                        style={{
                          width: "50px",
                          height: "66px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Preview da Capa</span>
                    </div>
                  )}
                </div>

                {/* BANNER HORIZONTAL */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Banner Panorâmico (Hero 16:9):</label>
                  <div className="file-picker-row">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="https://... ou caminho local"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handlePickBanner}
                      title="Escolher Imagem Local"
                    >
                      <ImageIcon size={15} />
                      <span>Local</span>
                    </button>
                  </div>
                  {bannerUrl && (
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                      <img
                        src={formatImageUrl(bannerUrl)}
                        alt="Preview Banner"
                        style={{
                          width: "110px",
                          height: "44px",
                          objectFit: "cover",
                          borderRadius: "6px",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Preview do Banner</span>
                    </div>
                  )}
                </div>
              </div>

              {/* STATUS DE PROCESSO E FAVORITO */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Status de Progresso:</label>
                  <select
                    className="form-input"
                    value={playStatus}
                    onChange={(e) => setPlayStatus(e.target.value as PlayStatusType)}
                    style={{ cursor: "pointer", background: "var(--bg-card)" }}
                  >
                    <option value="playing">🟢 Jogando Atualmente</option>
                    <option value="completed">🏆 Zerado / Concluído</option>
                    <option value="backlog">⏳ Pendente (Backlog)</option>
                    <option value="paused">⏸️ Pausado</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: isFavorite ? "rgba(255, 184, 0, 0.15)" : "rgba(255, 255, 255, 0.04)",
                      border: `1px solid ${isFavorite ? "rgba(255, 184, 0, 0.5)" : "rgba(255, 255, 255, 0.1)"}`,
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isFavorite}
                      onChange={(e) => setIsFavorite(e.target.checked)}
                      style={{ cursor: "pointer", accentColor: "#FFB800" }}
                    />
                    <Star
                      size={16}
                      fill={isFavorite ? "#FFB800" : "none"}
                      color={isFavorite ? "#FFB800" : "var(--text-secondary)"}
                    />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: isFavorite ? "#FFD54F" : "#fff" }}>
                      Marcar como Jogo Favorito
                    </span>
                  </label>
                </div>
              </div>

              {/* NOTAS ADICIONAIS */}
              <div className="form-group" style={{ marginTop: "16px" }}>
                <label className="form-label">Notas do Jogo / Configurações Especiais:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Roda a 60 FPS nativo, texturas HD ativadas, requer Vulkan..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="modal-footer" style={{ padding: "16px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 24px",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                }}
              >
                <Save size={16} />
                <span>{isSubmitting ? "Salvando..." : "Salvar Alterações"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AUTO SCRAPER MODAL INTEGRADO */}
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
          if (sugTitle && (!title.trim() || title === game?.title)) {
            setTitle(sugTitle);
          }
          setIsScraperOpen(false);
        }}
      />
    </>
  );
};

import React, { useState } from "react";
import { FolderUp, Folder, FileCode, CheckCircle2, X, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Platform } from "../types";
import { api } from "../services/api";
import { ConsoleIcon } from "./ConsoleIcon";

interface BatchImportModalProps {
  platforms: Platform[];
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
  igdbApiKey?: string;
  igdbClientSecret?: string;
}

const COMMON_EXTENSIONS: Record<string, string[]> = {
  ps2: ["iso", "chd", "cso", "bin", "cue", "gz"],
  ps1: ["chd", "cue", "bin", "iso", "pbp"],
  ps3: ["iso", "pkg"],
  n64: ["z64", "n64", "v64", "zip"],
  gamecube: ["iso", "rvz", "gcm", "cso"],
  wii: ["iso", "wbfs", "rvz"],
  switch: ["nsp", "xci"],
  snes: ["sfc", "smc", "zip"],
  nes: ["nes", "zip"],
  gba: ["gba", "zip"],
  nds: ["nds", "zip"],
  genesis: ["md", "bin", "gen", "zip"],
  xbox: ["iso", "xbe"],
  saturn: ["chd", "cue", "bin", "iso"],
  dreamcast: ["chd", "cdi", "gdi", "cue"],
  psp: ["iso", "cso", "pbp"],
  other: ["iso", "zip", "chd", "bin"],
};

export const BatchImportModal: React.FC<BatchImportModalProps> = ({
  platforms,
  isOpen,
  onClose,
  onImportComplete,
  igdbApiKey,
  igdbClientSecret,
}) => {
  const [selectedPlatformId, setSelectedPlatformId] = useState<string>(
    platforms[0]?.id || "ps2"
  );
  const [emulatorPath, setEmulatorPath] = useState("");
  const [romsFolder, setRomsFolder] = useState("");
  const [customArgs, setCustomArgs] = useState('"{rom}"');
  const [extensionsText, setExtensionsText] = useState("iso, chd, cso, z64, bin");
  const [scrapeIgdb, setScrapeIgdb] = useState(Boolean(igdbApiKey));
  const [isLoading, setIsLoading] = useState(false);
  const [importedGames, setImportedGames] = useState<string[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePickEmulator = async () => {
    try {
      const res = await api.pickExecutableFile();
      if (res) {
        setEmulatorPath(res.file_path);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handlePickFolder = async () => {
    try {
      const folder = await api.pickDirectory();
      if (folder) {
        setRomsFolder(folder);
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handlePlatformChange = (platId: string) => {
    setSelectedPlatformId(platId);
    if (COMMON_EXTENSIONS[platId]) {
      setExtensionsText(COMMON_EXTENSIONS[platId].join(", "));
    }
  };

  const handleRunBatchImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedPlatformId) {
      setErrorMsg("Selecione a plataforma dos jogos.");
      return;
    }
    if (!emulatorPath.trim()) {
      setErrorMsg("Selecione o executável do emulador (ex: pcsx2.exe, dolphin.exe).");
      return;
    }
    if (!romsFolder.trim()) {
      setErrorMsg("Selecione a pasta onde estão as ROMs.");
      return;
    }

    const exts = extensionsText
      .split(",")
      .map((s) => s.trim().replace(/^\./, ""))
      .filter((s) => s.length > 0);

    if (exts.length === 0) {
      setErrorMsg("Informe ao menos uma extensão de arquivo (ex: iso, chd).");
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.batchImportRoms({
        platform_id: selectedPlatformId,
        emulator_path: emulatorPath.trim(),
        roms_folder: romsFolder.trim(),
        extensions: exts,
        custom_args: customArgs.trim() || '"{rom}"',
        scrape_igdb: scrapeIgdb,
        igdb_api_key: igdbApiKey,
        igdb_client_secret: igdbClientSecret,
      });

      if (result.length === 0) {
        setErrorMsg("Nenhum arquivo com as extensões selecionadas foi encontrado nesta pasta.");
      } else {
        setImportedGames(result);
        onImportComplete();
      }
    } catch (err: any) {
      setErrorMsg(err.toString());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop nested" onClick={onClose} style={{ zIndex: 30000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "660px" }}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #107C10 0%, #00e5ff 100%)",
                padding: "8px",
                borderRadius: "8px",
                display: "flex",
              }}
            >
              <FolderUp size={18} color="#080a0f" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Importar ROMs em Lote (Emulador)</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                Escaneie uma pasta inteira de jogos e adicione todos à sua biblioteca de uma só vez
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {importedGames ? (
          <div className="modal-body" style={{ textAlign: "center", padding: "32px 24px" }}>
            <CheckCircle2 size={48} color="var(--accent-green)" style={{ margin: "0 auto" }} />
            <h3 style={{ fontSize: "1.3rem", marginTop: "12px" }}>
              {importedGames.length} jogos importados com sucesso!
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", maxWidth: "440px", margin: "0 auto 16px auto" }}>
              Todos os atalhos foram criados na sua biblioteca com contagem de horas e configuração de emulador.
            </p>

            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-md)",
                padding: "12px",
                maxHeight: "180px",
                overflowY: "auto",
                textAlign: "left",
                fontSize: "0.85rem",
              }}
            >
              {importedGames.map((title, i) => (
                <div
                  key={i}
                  style={{
                    padding: "4px 0",
                    borderBottom: i < importedGames.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  🎮 {title}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "24px" }}>
              <button
                className="btn-primary"
                onClick={onClose}
                style={{ width: "100%", justifyContent: "center" }}
              >
                Concluir e Ver Biblioteca
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRunBatchImport}>
            <div className="modal-body">
              {errorMsg && (
                <div
                  style={{
                    background: "rgba(255, 51, 75, 0.15)",
                    border: "1px solid var(--accent-red)",
                    color: "#ff6b7e",
                    padding: "10px 14px",
                    borderRadius: "var(--radius-sm)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.85rem",
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* PLATFORM SELECTOR WITH CONSOLE ICONS */}
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Plataforma dos Jogos (Console Emulado)</span>
                  <span style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 600 }}>
                    {platforms.find((p) => p.id === selectedPlatformId)?.name || "Selecione o console"}
                  </span>
                </label>

                {/* VISUAL CONSOLE SELECTION GRID */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
                    gap: "8px",
                    marginBottom: "8px",
                    maxHeight: "155px",
                    overflowY: "auto",
                    padding: "4px",
                  }}
                  className="thin-scrollbar"
                >
                  {platforms.map((p) => {
                    const isSelected = selectedPlatformId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handlePlatformChange(p.id)}
                        title={p.name}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "8px",
                          background: isSelected ? "rgba(255, 255, 255, 0.08)" : "rgba(255, 255, 255, 0.02)",
                          border: `1.5px solid ${isSelected ? p.brand_color : "var(--border-subtle)"}`,
                          color: isSelected ? "#fff" : "var(--text-secondary)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          boxShadow: isSelected ? `0 0 10px ${p.brand_color}33` : "none",
                        }}
                      >
                        <ConsoleIcon platformId={p.id} name={p.name} size={18} color={p.brand_color} />
                        <span style={{ fontSize: "0.8rem", fontWeight: isSelected ? 700 : 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.short_name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* EMULATOR EXE */}
              <div className="form-group">
                <label className="form-label">Executável do Emulador</label>
                <div className="file-picker-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: C:\Emuladores\PCSX2\pcsx2-qtx64.exe"
                    value={emulatorPath}
                    onChange={(e) => setEmulatorPath(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handlePickEmulator}
                  >
                    <FileCode size={16} />
                    <span>Procurar</span>
                  </button>
                </div>
              </div>

              {/* ROMS FOLDER */}
              <div className="form-group">
                <label className="form-label">Pasta onde estão as ROMs / ISOs</label>
                <div className="file-picker-row">
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: D:\Jogos\PS2_ISOS"
                    value={romsFolder}
                    onChange={(e) => setRomsFolder(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handlePickFolder}
                  >
                    <Folder size={16} />
                    <span>Selecionar Pasta</span>
                  </button>
                </div>
              </div>

              {/* EXTENSIONS */}
              <div className="form-group">
                <label className="form-label">Extensões de Arquivo para Importar</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="iso, chd, cso, z64, bin"
                  value={extensionsText}
                  onChange={(e) => setExtensionsText(e.target.value)}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Arquivos na pasta com essas extensões serão detectados e os nomes serão limpos automaticamente (ex: "God of War (USA) [!].iso" vira "God of War").
                </span>
              </div>

              {/* LAUNCH ARGS */}
              <div className="form-group">
                <label className="form-label">Argumentos de Linha de Comando</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder='"{rom}" ou -batch "{rom}"'
                  value={customArgs}
                  onChange={(e) => setCustomArgs(e.target.value)}
                />
                <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Use <code>{"{rom}"}</code> onde o caminho da ROM deve ser inserido pelo emulador ao iniciar.
                </span>
              </div>

              {/* IGDB AUTO-SCRAPE TOGGLE */}
              <div
                style={{
                  background: scrapeIgdb ? "rgba(145, 71, 255, 0.12)" : "rgba(255, 255, 255, 0.03)",
                  border: `1px solid ${scrapeIgdb ? "rgba(145, 71, 255, 0.4)" : "var(--border-subtle)"}`,
                  borderRadius: "var(--radius-md)",
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginTop: "6px",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        background: "linear-gradient(135deg, #9147ff 0%, #6441a5 100%)",
                        padding: "6px",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Sparkles size={16} color="#fff" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#fff" }}>
                        ⭐ Baixar Capas e Banners via IGDB
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {igdbApiKey
                          ? "Chave de API ativa: buscará posters e artes em alta resolução no banco de dados IGDB."
                          : "Requer Chave de API do IGDB nas Configurações para obter pôsteres oficiais."}
                      </div>
                    </div>
                  </div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      cursor: igdbApiKey ? "pointer" : "not-allowed",
                      position: "relative",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={scrapeIgdb}
                      disabled={!igdbApiKey}
                      onChange={(e) => setScrapeIgdb(e.target.checked)}
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "#9147ff",
                        cursor: igdbApiKey ? "pointer" : "not-allowed",
                      }}
                    />
                  </label>
                </div>
                {!igdbApiKey && (
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#e2b714",
                      background: "rgba(226, 183, 20, 0.1)",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      marginTop: "2px",
                    }}
                  >
                    💡 Para ativar a busca automática no IGDB, informe sua chave de API nas Configurações (ícone ⚙️).
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={isLoading}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Escaneando e Importando...</span>
                  </>
                ) : (
                  <>
                    <FolderUp size={16} />
                    <span>Importar ROMs em Lote</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

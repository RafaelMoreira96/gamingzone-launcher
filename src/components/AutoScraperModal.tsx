import React, { useEffect, useState } from "react";
import { Search, Image as ImageIcon, Sparkles, X, Check, Loader2 } from "lucide-react";
import { ScrapedAsset } from "../types";
import { api } from "../services/api";

interface AutoScraperModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery: string;
  onSelectAssets: (coverUrl?: string, bannerUrl?: string, title?: string) => void;
  steamGridDbKey?: string;
  igdbApiKey?: string;
  igdbClientId?: string;
  igdbClientSecret?: string;
}

export const AutoScraperModal: React.FC<AutoScraperModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
  onSelectAssets,
  steamGridDbKey,
  igdbApiKey,
  igdbClientId,
  igdbClientSecret,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScrapedAsset[]>([]);
  const [searched, setSearched] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<"all" | "igdb" | "curated" | "steamgriddb" | "steam">("all");

  useEffect(() => {
    if (isOpen) {
      const q = initialQuery.trim();
      setQuery(q);
      if (q) {
        handleSearch(q);
      } else {
        setResults([]);
        setSearched(false);
      }
    }
  }, [isOpen, initialQuery]);

  const handleSearch = async (searchTerm?: string) => {
    const term = (searchTerm ?? query).trim();
    if (!term) return;

    setIsLoading(true);
    setSearched(true);
    const activeIgdb = (igdbApiKey || igdbClientId || "").trim();
    try {
      const res = await api.scrapeGameAssets(term, steamGridDbKey, activeIgdb, igdbClientSecret);
      setResults(res.assets || []);
    } catch (err) {
      console.error("Erro no scraper de assets:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResults = results.filter((asset) => {
    if (sourceFilter === "all") return true;
    if (sourceFilter === "igdb") return asset.source.toLowerCase().includes("igdb");
    if (sourceFilter === "curated") return asset.source.toLowerCase().includes("curado");
    if (sourceFilter === "steamgriddb") return asset.source.toLowerCase().includes("steamgriddb");
    if (sourceFilter === "steam") return asset.source.toLowerCase().includes("steam") && !asset.source.toLowerCase().includes("steamgriddb");
    return true;
  });

  const igdbCount = results.filter((r) => r.source.toLowerCase().includes("igdb")).length;

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop nested" onClick={onClose} style={{ zIndex: 30000 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "780px" }}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, #00e5ff 0%, #b347ff 100%)",
                padding: "8px",
                borderRadius: "8px",
                display: "flex",
              }}
            >
              <Sparkles size={18} color="#080a0f" />
            </div>
            <div>
              <h2 style={{ fontSize: "1.15rem", margin: 0 }}>Auto-Scraper de Capas & Banners</h2>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                Busca de artes em alta resolução (Catálogo Curado, IGDB, Steam CDN e SteamGridDB)
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: "16px" }}>
          {/* SEARCH BAR */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            style={{ display: "flex", gap: "10px" }}
          >
            <div className="file-picker-row" style={{ flex: 1 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Digite o título do jogo (ex: Zelda Ocarina, God of War, Jak)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !query.trim()}
              style={{ padding: "0 20px" }}
            >
              {isLoading ? <Loader2 size={16} className="spin" /> : <Search size={16} />}
            </button>
          </form>

          {/* SOURCE FILTER TABS */}
          {results.length > 0 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                className={`type-toggle-btn ${sourceFilter === "all" ? "active" : ""}`}
                onClick={() => setSourceFilter("all")}
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              >
                Todas ({results.length})
              </button>
              {igdbCount > 0 && (
                <button
                  type="button"
                  className={`type-toggle-btn ${sourceFilter === "igdb" ? "active" : ""}`}
                  onClick={() => setSourceFilter("igdb")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    borderColor: sourceFilter === "igdb" ? "#B347FF" : undefined,
                    color: sourceFilter === "igdb" ? "#D48BFF" : undefined,
                    background: sourceFilter === "igdb" ? "rgba(179, 71, 255, 0.2)" : undefined,
                  }}
                >
                  ⭐ IGDB Oficial ({igdbCount})
                </button>
              )}
              <button
                type="button"
                className={`type-toggle-btn ${sourceFilter === "curated" ? "active" : ""}`}
                onClick={() => setSourceFilter("curated")}
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              >
                Catálogo Curado
              </button>
              <button
                type="button"
                className={`type-toggle-btn ${sourceFilter === "steam" ? "active" : ""}`}
                onClick={() => setSourceFilter("steam")}
                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
              >
                Steam CDN
              </button>
            </div>
          )}

          {/* RESULTS AREA */}
          {isLoading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 0",
                gap: "12px",
                color: "var(--text-secondary)",
              }}
            >
              <Loader2 size={32} className="spin" color="var(--accent-cyan)" />
              <span>Varrendo catálogo e bancos de imagens...</span>
            </div>
          ) : filteredResults.length > 0 ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "16px",
                maxHeight: "440px",
                overflowY: "auto",
                paddingRight: "4px",
              }}
            >
              {filteredResults.map((asset, idx) => {
                const isIgdb = asset.source.toLowerCase().includes("igdb");
                return (
                <div
                  key={idx}
                  style={{
                    background: "var(--bg-card)",
                    border: isIgdb ? "1px solid rgba(179, 71, 255, 0.4)" : "1px solid var(--border-subtle)",
                    boxShadow: isIgdb ? "0 0 12px rgba(179, 71, 255, 0.1)" : undefined,
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    padding: "12px",
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: isIgdb ? "rgba(179, 71, 255, 0.2)" : "rgba(0, 229, 255, 0.15)",
                        color: isIgdb ? "#D48BFF" : "var(--accent-cyan)",
                        border: isIgdb ? "1px solid rgba(179, 71, 255, 0.4)" : "1px solid rgba(0, 229, 255, 0.3)",
                      }}
                    >
                      {isIgdb ? "⭐ IGDB OFICIAL" : asset.source} {asset.platform_hint ? `• ${asset.platform_hint}` : ""}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "180px",
                      }}
                    >
                      {asset.title}
                    </span>
                  </div>

                  {/* PREVIEWS ROW */}
                  <div style={{ display: "flex", gap: "10px", height: "130px" }}>
                    {/* Cover Preview (3:4.2) */}
                    <div
                      style={{
                        width: "90px",
                        height: "100%",
                        borderRadius: "6px",
                        overflow: "hidden",
                        background: "#080a0f",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        flexShrink: 0,
                      }}
                    >
                      {asset.cover_url ? (
                        <img
                          src={asset.cover_url}
                          alt="Capa"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-muted)",
                            fontSize: "0.7rem",
                          }}
                        >
                          Sem Capa
                        </div>
                      )}
                    </div>

                    {/* Banner Preview (16:9) */}
                    <div
                      style={{
                        flex: 1,
                        height: "100%",
                        borderRadius: "6px",
                        overflow: "hidden",
                        background: "#080a0f",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {asset.banner_url ? (
                        <img
                          src={asset.banner_url}
                          alt="Banner Hero"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-muted)",
                            fontSize: "0.7rem",
                          }}
                        >
                          Sem Banner
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, padding: "8px", fontSize: "0.8rem", justifyContent: "center" }}
                      onClick={() => {
                        onSelectAssets(asset.cover_url, asset.banner_url, asset.title);
                        onClose();
                      }}
                      title="Aplicar capa e banner juntos"
                    >
                      <Check size={14} />
                      <span>Usar Ambos</span>
                    </button>

                    {asset.cover_url && (
                      <button
                        className="btn-secondary"
                        style={{ padding: "8px 10px", fontSize: "0.75rem" }}
                        onClick={() => {
                          onSelectAssets(asset.cover_url, undefined, asset.title);
                          onClose();
                        }}
                        title="Aplicar apenas a capa vertical"
                      >
                        Apenas Capa
                      </button>
                    )}

                    {asset.banner_url && (
                      <button
                        className="btn-secondary"
                        style={{ padding: "8px 10px", fontSize: "0.75rem" }}
                        onClick={() => {
                          onSelectAssets(undefined, asset.banner_url, asset.title);
                          onClose();
                        }}
                        title="Aplicar apenas o banner de fundo"
                      >
                        Apenas Banner
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          ) : searched ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "36px 16px",
                gap: "8px",
                textAlign: "center",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "var(--radius-md)",
                border: "1px dashed var(--border-subtle)",
              }}
            >
              <ImageIcon size={36} color="var(--text-muted)" />
              <p style={{ fontWeight: 600, margin: 0 }}>Nenhuma arte encontrada para "{query}"</p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: "420px", margin: 0 }}>
                Dica: Tente pesquisar pelo nome em inglês ou franquia principal (ex: "God of War", "Zelda", "Mario 64", "Jak").
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "36px 16px",
                gap: "8px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <Search size={32} />
              <p style={{ fontSize: "0.85rem", margin: 0 }}>
                Digite o nome de um jogo e clique em "Buscar" para encontrar pôsteres verticais e banners panorâmicos automaticamente.
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

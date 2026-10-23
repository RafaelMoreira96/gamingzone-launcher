import React from "react";
import { Game } from "../types";

interface StatusBarProps {
  games: Game[];
  totalPlaytimeHours: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ games, totalPlaytimeHours }) => {
  const runningGames = games.filter((g) => g.is_running);

  return (
    <footer className="status-bar">
      <div className="status-bar-left">
        {runningGames.length > 0 ? (
          <div className="status-running-indicator">
            <span className="status-dot-pulse" />
            <span style={{ color: "var(--color-success)", fontWeight: 600 }}>
              Executando: {runningGames.map((g) => g.title).join(", ")}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--color-text-muted)",
              }}
            />
            <span>Nenhum jogo em execução</span>
          </div>
        )}
      </div>

      <div className="status-bar-right">
        <span>Total: {games.length} jogos</span>
        <span>•</span>
        <span>Tempo acumulado: {totalPlaytimeHours.toFixed(1)}h</span>
      </div>
    </footer>
  );
};

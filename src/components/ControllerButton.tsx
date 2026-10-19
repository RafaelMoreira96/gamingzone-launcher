import React from "react";
import { ControllerPromptType } from "../types";

export type PlayStationSymbol = "cross" | "circle" | "square" | "triangle";
export type XboxLetter = "A" | "B" | "X" | "Y";
export type NintendoLetter = "B" | "A" | "Y" | "X";

interface PlayStationButtonProps {
  symbol: PlayStationSymbol;
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Authentic Sony PlayStation Controller Button
 * Precise geometric proportions and official Sony PlayStation colors:
 * - ✕ Cross: Electric Blue (#00A3FF)
 * - ○ Circle: Crimson Red (#FF3B56)
 * - □ Square: Vivid Magenta/Pink (#FF5C9D)
 * - △ Triangle: Emerald Green (#00F0A0)
 */
export const PlayStationButton: React.FC<PlayStationButtonProps> = ({
  symbol,
  size = 22,
  className = "",
  glow = true,
}) => {
  const colorMap = {
    cross: "#00A3FF",     // Sony Electric Blue
    circle: "#FF3B56",    // Sony Crimson Red
    square: "#FF5C9D",    // Sony Vivid Pink / Magenta
    triangle: "#00F0A0",  // Sony Emerald Green
  };

  const activeColor = colorMap[symbol];

  return (
    <span
      className={`ps-controller-btn ${className}`.trim()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        verticalAlign: "middle",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #222938 0%, #10141E 100%)",
        border: "1.5px solid #2B384E",
        boxShadow: glow
          ? `0 2px 5px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.15), 0 0 8px ${activeColor}33`
          : "0 2px 5px rgba(0,0,0,0.6)",
        position: "relative",
        userSelect: "none",
        flexShrink: 0,
      }}
      title={`PlayStation ${symbol.toUpperCase()}`}
    >
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 20 20" style={{ display: "block" }}>
        {symbol === "cross" && (
          <g stroke={activeColor} strokeWidth="2.8" strokeLinecap="round">
            <line x1="4.5" y1="4.5" x2="15.5" y2="15.5" />
            <line x1="15.5" y1="4.5" x2="4.5" y2="15.5" />
          </g>
        )}
        {symbol === "circle" && (
          <circle cx="10" cy="10" r="6" fill="none" stroke={activeColor} strokeWidth="2.8" />
        )}
        {symbol === "square" && (
          <rect
            x="4"
            y="4"
            width="12"
            height="12"
            rx="1.2"
            fill="none"
            stroke={activeColor}
            strokeWidth="2.6"
          />
        )}
        {symbol === "triangle" && (
          <polygon
            points="10,3.6 16.5,15.8 3.5,15.8"
            fill="none"
            stroke={activeColor}
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </span>
  );
};

interface XboxButtonProps {
  letter: XboxLetter;
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Authentic Microsoft Xbox Controller Button
 * - A: Emerald Green (#107C10)
 * - B: Crimson Red (#E81123)
 * - X: Deep Blue (#0078D7)
 * - Y: Vibrant Amber Yellow (#FFB900)
 */
export const XboxButton: React.FC<XboxButtonProps> = ({
  letter,
  size = 22,
  className = "",
  glow = true,
}) => {
  const colorMap = {
    A: "#107C10",
    B: "#E81123",
    X: "#0078D7",
    Y: "#FFB900",
  };

  const activeColor = colorMap[letter];

  return (
    <span
      className={`xbox-controller-btn ${className}`.trim()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        verticalAlign: "middle",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #252830 0%, #111317 100%)",
        border: "1.5px solid #3A3F4D",
        boxShadow: glow
          ? `0 2px 5px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.15), 0 0 8px ${activeColor}33`
          : "0 2px 5px rgba(0,0,0,0.6)",
        fontWeight: 900,
        fontSize: size * 0.58,
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: activeColor,
        textShadow: `0 0 6px ${activeColor}88`,
        userSelect: "none",
        flexShrink: 0,
      }}
      title={`Xbox ${letter}`}
    >
      {letter}
    </span>
  );
};

interface NintendoButtonProps {
  letter: NintendoLetter;
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Authentic Nintendo Controller Button (Super Famicom 4-Color style)
 * - B: Warm Red (#EF4444)
 * - A: Golden Yellow (#F59E0B)
 * - Y: Bright Cyan / Blue (#3B82F6)
 * - X: Leaf Green (#10B981)
 */
export const NintendoButton: React.FC<NintendoButtonProps> = ({
  letter,
  size = 22,
  className = "",
  glow = true,
}) => {
  const colorMap = {
    B: "#EF4444",
    A: "#F59E0B",
    Y: "#3B82F6",
    X: "#10B981",
  };

  const activeColor = colorMap[letter];

  return (
    <span
      className={`nintendo-controller-btn ${className}`.trim()}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        verticalAlign: "middle",
        width: size,
        height: size,
        borderRadius: "50%",
        background: "radial-gradient(circle at 35% 35%, #2A2E39 0%, #14171E 100%)",
        border: "1.5px solid #3E4554",
        boxShadow: glow
          ? `0 2px 5px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.15), 0 0 8px ${activeColor}33`
          : "0 2px 5px rgba(0,0,0,0.6)",
        fontWeight: 900,
        fontSize: size * 0.58,
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: activeColor,
        textShadow: `0 0 6px ${activeColor}88`,
        userSelect: "none",
        flexShrink: 0,
      }}
      title={`Nintendo ${letter}`}
    >
      {letter}
    </span>
  );
};

interface ControllerPromptBadgeProps {
  controllerType: ControllerPromptType;
  action: "select" | "back" | "details" | "favorite" | "bumperL" | "bumperR" | "triggerL" | "triggerR";
  size?: number;
}

/**
 * Universal Controller Prompt Badge for footer shortcuts and UI hints
 */
export const ControllerPromptBadge: React.FC<ControllerPromptBadgeProps> = ({
  controllerType,
  action,
  size = 20,
}) => {
  if (controllerType === "playstation") {
    switch (action) {
      case "select":
        return <PlayStationButton symbol="cross" size={size} />;
      case "back":
        return <PlayStationButton symbol="circle" size={size} />;
      case "details":
        return <PlayStationButton symbol="square" size={size} />;
      case "favorite":
        return <PlayStationButton symbol="triangle" size={size} />;
      case "bumperL":
        return <span className="hint-btn ps-bumper-btn">L1</span>;
      case "bumperR":
        return <span className="hint-btn ps-bumper-btn">R1</span>;
      case "triggerL":
        return <span className="hint-btn ps-bumper-btn">L2</span>;
      case "triggerR":
        return <span className="hint-btn ps-bumper-btn">R2</span>;
    }
  }

  if (controllerType === "nintendo") {
    switch (action) {
      case "select":
        return <NintendoButton letter="B" size={size} />;
      case "back":
        return <NintendoButton letter="A" size={size} />;
      case "details":
        return <NintendoButton letter="Y" size={size} />;
      case "favorite":
        return <NintendoButton letter="X" size={size} />;
      case "bumperL":
        return <span className="hint-btn nin-bumper-btn">L</span>;
      case "bumperR":
        return <span className="hint-btn nin-bumper-btn">R</span>;
      case "triggerL":
        return <span className="hint-btn nin-bumper-btn">ZL</span>;
      case "triggerR":
        return <span className="hint-btn nin-bumper-btn">ZR</span>;
    }
  }

  // Default to Xbox
  switch (action) {
    case "select":
      return <XboxButton letter="A" size={size} />;
    case "back":
      return <XboxButton letter="B" size={size} />;
    case "details":
      return <XboxButton letter="X" size={size} />;
    case "favorite":
      return <XboxButton letter="Y" size={size} />;
    case "bumperL":
      return <span className="hint-btn xbox-bumper-btn">LB</span>;
    case "bumperR":
      return <span className="hint-btn xbox-bumper-btn">RB</span>;
    case "triggerL":
      return <span className="hint-btn xbox-bumper-btn">LT</span>;
    case "triggerR":
      return <span className="hint-btn xbox-bumper-btn">RT</span>;
  }
};

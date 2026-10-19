import React from "react";
import { formatImageUrl } from "../services/api";

export interface ConsoleIconProps {
  platformId?: string | null;
  name?: string | null;
  iconName?: string | null;
  size?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  /** If true, uses single-tone `currentColor` or provided `color`. If false, can use brand multi-tones where applicable */
  monochrome?: boolean;
}

export interface IconPreset {
  id: string;
  name: string;
  category: "consoles" | "symbols";
}

export const AVAILABLE_ICON_PRESETS: IconPreset[] = [
  // Retro & Modern Consoles
  { id: "ps1", name: "PlayStation 1", category: "consoles" },
  { id: "ps2", name: "PlayStation 2", category: "consoles" },
  { id: "ps3", name: "PlayStation 3", category: "consoles" },
  { id: "psp", name: "PlayStation Portable", category: "consoles" },
  { id: "psvita", name: "PlayStation Vita", category: "consoles" },
  { id: "n64", name: "Nintendo 64", category: "consoles" },
  { id: "gamecube", name: "Nintendo GameCube", category: "consoles" },
  { id: "wii", name: "Nintendo Wii", category: "consoles" },
  { id: "wiiu", name: "Nintendo Wii U", category: "consoles" },
  { id: "switch", name: "Nintendo Switch", category: "consoles" },
  { id: "snes", name: "Super Nintendo (SNES)", category: "consoles" },
  { id: "nes", name: "NES / Famicom", category: "consoles" },
  { id: "gba", name: "Game Boy Advance", category: "consoles" },
  { id: "gb", name: "Game Boy Classic", category: "consoles" },
  { id: "nds", name: "Nintendo DS", category: "consoles" },
  { id: "3ds", name: "Nintendo 3DS", category: "consoles" },
  { id: "genesis", name: "Sega Genesis / Mega Drive", category: "consoles" },
  { id: "saturn", name: "Sega Saturn", category: "consoles" },
  { id: "dreamcast", name: "Sega Dreamcast", category: "consoles" },
  { id: "mastersystem", name: "Sega Master System", category: "consoles" },
  { id: "xbox", name: "Original Xbox", category: "consoles" },
  { id: "xbox360", name: "Xbox 360", category: "consoles" },
  { id: "arcade", name: "Arcade / MAME", category: "consoles" },
  { id: "pc", name: "PC / Windows", category: "consoles" },
  { id: "recomp", name: "Recompilação CPU", category: "consoles" },

  // Generic Symbols
  { id: "gamepad", name: "Gamepad Retro", category: "symbols" },
  { id: "disc", name: "Disco Óptico", category: "symbols" },
  { id: "cpu", name: "Processador / Chip", category: "symbols" },
  { id: "tv", name: "TV / Monitor CRT", category: "symbols" },
  { id: "box", name: "Caixa / Gabinete", category: "symbols" },
  { id: "trophy", name: "Troféu", category: "symbols" },
  { id: "sparkles", name: "Brilho / Especial", category: "symbols" },
  { id: "wrench", name: "Ferramenta / Custom", category: "symbols" },
  { id: "layers", name: "Camadas", category: "symbols" },
  { id: "circle-dot", name: "Alvo / Círculo", category: "symbols" },
];

export function isImageSource(src?: string | null): boolean {
  if (!src) return false;
  const s = src.trim().toLowerCase();
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("data:") ||
    s.startsWith("blob:") ||
    s.startsWith("asset:")
  ) {
    return true;
  }
  if (s.includes("/") || s.includes("\\")) return true;
  if (
    s.endsWith(".png") ||
    s.endsWith(".jpg") ||
    s.endsWith(".jpeg") ||
    s.endsWith(".ico") ||
    s.endsWith(".svg") ||
    s.endsWith(".webp") ||
    s.endsWith(".gif")
  ) {
    return true;
  }
  return false;
}

/**
 * Normalizes any console identifier or display name to a standard console key
 */
export function normalizeConsoleKey(
  platformId?: string | null,
  name?: string | null,
  iconName?: string | null
): string {
  const iconStr = (iconName || "").toLowerCase().trim();

  // If iconName is explicitly one of our known keys
  if (iconStr === "ps1" || iconStr === "psx") return "ps1";
  if (iconStr === "ps2") return "ps2";
  if (iconStr === "ps3") return "ps3";
  if (iconStr === "psp") return "psp";
  if (iconStr === "psvita" || iconStr === "vita") return "psvita";
  if (iconStr === "n64") return "n64";
  if (iconStr === "gamecube" || iconStr === "gc" || iconStr === "cube") return "gamecube";
  if (iconStr === "wii") return "wii";
  if (iconStr === "wiiu") return "wiiu";
  if (iconStr === "switch") return "switch";
  if (iconStr === "snes") return "snes";
  if (iconStr === "nes") return "nes";
  if (iconStr === "gba") return "gba";
  if (iconStr === "gb" || iconStr === "gbc") return "gb";
  if (iconStr === "nds") return "nds";
  if (iconStr === "3ds") return "3ds";
  if (iconStr === "genesis" || iconStr === "megadrive") return "genesis";
  if (iconStr === "saturn") return "saturn";
  if (iconStr === "dreamcast" || iconStr === "swatch-book") return "dreamcast";
  if (iconStr === "mastersystem") return "mastersystem";
  if (iconStr === "xbox") return "xbox";
  if (iconStr === "xbox360") return "xbox360";
  if (iconStr === "arcade") return "arcade";
  if (iconStr === "pc") return "pc";
  if (iconStr === "recomp") return "recomp";
  if (iconStr === "disc") return "disc";
  if (iconStr === "cpu") return "cpu";
  if (iconStr === "gamepad") return "gamepad";
  if (iconStr === "box") return "box";
  if (iconStr === "tv") return "tv";
  if (iconStr === "wrench") return "wrench";
  if (iconStr === "trophy") return "trophy";
  if (iconStr === "sparkles") return "sparkles";
  if (iconStr === "layers") return "layers";
  if (iconStr === "circle-dot") return "circle-dot";

  const raw = `${platformId || ""} ${name || ""} ${iconStr}`.toLowerCase().trim();

  if (/ps1|psx|playstation\s*1|playstation\s*one/i.test(raw)) return "ps1";
  if (/ps2|playstation\s*2/i.test(raw)) return "ps2";
  if (/ps3|playstation\s*3/i.test(raw)) return "ps3";
  if (/psp|playstation\s*portable/i.test(raw)) return "psp";
  if (/vita|psvita/i.test(raw)) return "psvita";
  if (/n64|nintendo\s*64/i.test(raw)) return "n64";
  if (/gamecube|gc\b|ngc/i.test(raw)) return "gamecube";
  if (/wii\s*u|wiiu/i.test(raw)) return "wiiu";
  if (/\bwii\b/i.test(raw)) return "wii";
  if (/switch|nsw/i.test(raw)) return "switch";
  if (/snes|super\s*nintendo|sfc|super\s*famicom/i.test(raw)) return "snes";
  if (/\bnes\b|famicom|nintendo\s*entertainment/i.test(raw)) return "nes";
  if (/gba|game\s*boy\s*advance/i.test(raw)) return "gba";
  if (/gbc|game\s*boy\s*color|\bgb\b|game\s*boy/i.test(raw)) return "gb";
  if (/3ds|nintendo\s*3ds/i.test(raw)) return "3ds";
  if (/nds|\bds\b|nintendo\s*ds/i.test(raw)) return "nds";
  if (/genesis|megadrive|mega\s*drive/i.test(raw)) return "genesis";
  if (/saturn/i.test(raw)) return "saturn";
  if (/dreamcast|\bdc\b/i.test(raw)) return "dreamcast";
  if (/master\s*system|game\s*gear/i.test(raw)) return "mastersystem";
  if (/xbox\s*360|x360/i.test(raw)) return "xbox360";
  if (/xbox/i.test(raw)) return "xbox";
  if (/pc|windows|dos|steam/i.test(raw)) return "pc";
  if (/recomp|descomp/i.test(raw)) return "recomp";
  if (/arcade|mame|neogeo|neo-geo/i.test(raw)) return "arcade";
  if (/disc/i.test(raw)) return "disc";
  if (/cpu/i.test(raw)) return "cpu";
  if (/box/i.test(raw)) return "box";
  if (/wrench/i.test(raw)) return "wrench";

  return "default";
}

/**
 * ConsoleIcon Component
 * Renders authentic vector SVG logos or custom images for retro and modern gaming consoles.
 */
export const ConsoleIcon: React.FC<ConsoleIconProps> = ({
  platformId,
  name,
  iconName,
  size = 18,
  color,
  className = "",
  style,
  monochrome = false,
}) => {
  // Check if a custom image path or URL was provided
  const candidateImg = iconName || platformId;
  if (isImageSource(candidateImg)) {
    return (
      <img
        src={formatImageUrl(candidateImg)}
        alt={name || "Console Icon"}
        width={size}
        height={size}
        className={`console-icon console-custom-img ${className}`.trim()}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          display: "inline-block",
          verticalAlign: "middle",
          borderRadius: "4px",
          flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  const consoleKey = normalizeConsoleKey(platformId, name, iconName);
  const fill = color || "currentColor";

  const commonProps = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    className: `console-icon console-${consoleKey} ${className}`.trim(),
    style: { display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style },
    role: "img",
    "aria-label": name || platformId || consoleKey,
  };

  switch (consoleKey) {
    // ==========================================
    // NINTENDO 64 (Iconic 3D 4-prong N block)
    // ==========================================
    case "n64":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              {/* Left Column */}
              <polygon points="4,7.5 7.5,5.5 7.5,17 4,19" />
              {/* Right Column */}
              <polygon points="16.5,5.5 20,7.5 20,19 16.5,17" />
              {/* Diagonal Left-to-Right Beam */}
              <polygon points="7.5,8 10.5,6.5 16.5,15.5 13.5,17" />
              {/* Top Face Left */}
              <polygon points="4,7.5 7.5,5.5 10.5,7 7,9" opacity="0.8" />
              {/* Top Face Right */}
              <polygon points="13.5,7 16.5,5.5 20,7.5 17,9" opacity="0.8" />
              {/* Bottom connecting base */}
              <polygon points="7.5,17 10.5,18.5 16.5,17 13.5,15.5" opacity="0.5" />
            </g>
          ) : (
            <g>
              {/* Front Left Pillar - Red */}
              <polygon points="4,7.5 7.5,5.5 7.5,17 4,19" fill="#E52521" />
              {/* Front Right Pillar - Blue */}
              <polygon points="16.5,5.5 20,7.5 20,19 16.5,17" fill="#0038A8" />
              {/* Central Diagonal - Green */}
              <polygon points="7.5,8 10.5,6.5 16.5,15.5 13.5,17" fill="#00A651" />
              {/* Top Left Facet - Yellow */}
              <polygon points="4,7.5 7.5,5.5 10.5,7 7,9" fill="#FFD100" />
              {/* Top Right Facet - Red */}
              <polygon points="13.5,7 16.5,5.5 20,7.5 17,9" fill="#E52521" />
              {/* Rear / Shadow Facets */}
              <polygon points="7.5,17 10.5,18.5 16.5,17 13.5,15.5" fill="#0038A8" opacity="0.75" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // PLAYSTATION 1 (Classic P with striped S shadow)
    // ==========================================
    case "ps1":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              {/* Upright P */}
              <path d="M7 3v13.5h3.2V11.2h2.2c2.8 0 4.6-1.5 4.6-4.1 0-2.6-1.8-4.1-4.6-4.1H7zm3.2 2.6h2c1.2 0 1.9.6 1.9 1.5 0 .9-.7 1.5-1.9 1.5h-2V5.6z" />
              {/* Horizontal S shadow lying flat */}
              <path
                d="M5 16.8c1.5-.6 3.6-.9 6.2-.9 2.2 0 3.7.3 4.8.8.7.3.7.8 0 1.2-1.3.7-3.7 1.1-6.8 1.1-2.9 0-5.1-.4-6.4-1.1-.5-.3-.4-.7.3-1l1.9-.1z"
                opacity="0.8"
              />
              <path
                d="M11.8 17.8c3.2 0 5.4.4 6.7 1.1.6.3.6.8-.2 1.1-1.6.7-4.2 1-7.5 1-2.6 0-4.6-.3-5.7-.8-.5-.2-.5-.6 0-.8l2.2-.1c1.2.3 2.7.5 4.5.5z"
                opacity="0.6"
              />
            </g>
          ) : (
            <g>
              {/* Upright P - Red */}
              <path
                d="M7 3v13.5h3.2V11.2h2.2c2.8 0 4.6-1.5 4.6-4.1 0-2.6-1.8-4.1-4.6-4.1H7zm3.2 2.6h2c1.2 0 1.9.6 1.9 1.5 0 .9-.7 1.5-1.9 1.5h-2V5.6z"
                fill="#F32C3A"
              />
              {/* Flat S Stripe 1 - Yellow */}
              <path
                d="M5 16.8c1.5-.6 3.6-.9 6.2-.9 2.2 0 3.7.3 4.8.8.7.3.7.8 0 1.2-1.3.7-3.7 1.1-6.8 1.1-2.9 0-5.1-.4-6.4-1.1-.5-.3-.4-.7.3-1l1.9-.1z"
                fill="#FFC700"
              />
              {/* Flat S Stripe 2 - Cyan/Teal */}
              <path
                d="M11.8 17.8c3.2 0 5.4.4 6.7 1.1.6.3.6.8-.2 1.1-1.6.7-4.2 1-7.5 1-2.6 0-4.6-.3-5.7-.8-.5-.2-.5-.6 0-.8l2.2-.1c1.2.3 2.7.5 4.5.5z"
                fill="#00B2D6"
              />
              {/* Flat S Stripe 3 - Blue */}
              <path
                d="M17.5 18.8c.8.4.8.8.1 1.2-1.5.8-4.2 1.2-7.8 1.2-2.1 0-3.8-.2-4.9-.6.7-.4 2-.7 3.8-.7 3.5 0 6.6-.4 8.8-1.1z"
                fill="#00439C"
              />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // PLAYSTATION 2 (Futuristic Geometric PS2)
    // ==========================================
    case "ps2":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            {/* Geometric P */}
            <path d="M2.5 5h4.2c1.8 0 3.1 1.1 3.1 2.8 0 1.6-1.3 2.7-3.1 2.7H5.2v8.5H2.5V5zm2.7 3.6h1.5c.6 0 1-.3 1-.8s-.4-.8-1-.8H5.2v1.6z" />
            {/* Geometric S */}
            <path d="M11 7.2c0-1.4 1.1-2.2 2.8-2.2h4.5v2.2h-4.3c-.3 0-.6.1-.6.4 0 .3.2.4.6.5l3.2.9c1.6.4 2.5 1.3 2.5 2.7 0 1.5-1.1 2.3-2.9 2.3h-4.6V12h4.4c.4 0 .6-.1.6-.4s-.2-.4-.6-.5l-3.2-.9c-1.5-.4-2-1.4-2-3z" />
            {/* Blue Bold 2 */}
            <path d="M12.5 15h6v1.8h-3.6l3.6 2.4V21h-6v-1.8h3.6l-3.6-2.4V15z" />
          </g>
        </svg>
      );

    // ==========================================
    // PLAYSTATION 3 (PS3 Emblem)
    // ==========================================
    case "ps3":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            {/* Stylized P */}
            <path d="M3 6h4c1.7 0 2.8 1 2.8 2.5 0 1.4-1.1 2.5-2.8 2.5H5.2v7H3V6zm2.2 3.3h1.6c.5 0 .8-.3.8-.7s-.3-.7-.8-.7H5.2v1.4z" />
            {/* Stylized S */}
            <path d="M10.8 7.5h4.2V9.3h-2.6c-.3 0-.5.2-.5.4 0 .2.2.4.5.5l2 .6c1.2.4 1.8 1.1 1.8 2.2 0 1.3-.9 2-2.3 2H9.8V13.2h2.7c.3 0 .5-.2.5-.4 0-.2-.2-.4-.5-.5l-2-.6c-1.1-.4-1.6-1.1-1.6-2.1 0-1.2.9-2.1 1.9-2.1z" />
            {/* 3 with rounded brackets */}
            <path d="M16.5 7h4v2h-2.2v1.2H20v2h-1.7V14h2.2v2h-4V7z" />
          </g>
        </svg>
      );

    // ==========================================
    // PSP (PlayStation Portable silhouette)
    // ==========================================
    case "psp":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            {/* Outer Rounded Console Chassis */}
            <rect x="2" y="6" width="20" height="12" rx="4" fill="none" stroke={fill} strokeWidth="1.5" />
            {/* 16:9 Screen in center */}
            <rect x="7" y="8" width="10" height="8" rx="0.8" fill={fill} opacity="0.35" />
            {/* D-Pad on Left */}
            <path d="M4 11h2v2H4z" fill={fill} />
            {/* Action Buttons on Right */}
            <circle cx="18.5" cy="10" r="0.8" />
            <circle cx="19.5" cy="12" r="0.8" />
            <circle cx="18.5" cy="14" r="0.8" />
            <circle cx="17.5" cy="12" r="0.8" />
            {/* Bottom mini buttons bar */}
            <line x1="8.5" y1="16.5" x2="15.5" y2="16.5" stroke={fill} strokeWidth="0.8" strokeLinecap="round" />
          </g>
        </svg>
      );

    // ==========================================
    // PS VITA
    // ==========================================
    case "psvita":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            <rect x="2" y="6" width="20" height="12" rx="5" fill="none" stroke={fill} strokeWidth="1.5" />
            <rect x="6.5" y="7.5" width="11" height="9" rx="1" fill={fill} opacity="0.3" />
            {/* Dual Analog Sticks */}
            <circle cx="4.8" cy="14" r="1.1" fill={fill} />
            <circle cx="19.2" cy="14" r="1.1" fill={fill} />
            {/* D-pad & Buttons */}
            <circle cx="4.8" cy="9.5" r="0.8" />
            <circle cx="19.2" cy="9.5" r="0.8" />
          </g>
        </svg>
      );

    // ==========================================
    // NINTENDO GAMECUBE (Iconic Isometric G-Cube)
    // ==========================================
    case "gamecube":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
              {/* Outer Hexagon */}
              <polygon points="12,2.5 20,7.2 20,16.8 12,21.5 4,16.8 4,7.2" />
              {/* Inner Cube Y-junction */}
              <line x1="12" y1="2.5" x2="12" y2="12" />
              <line x1="12" y1="12" x2="20" y2="16.8" />
              <line x1="12" y1="12" x2="4" y2="16.8" />
              {/* Characteristic G & C Hollow Cutouts */}
              <polygon points="12,6.5 16,9 16,13.5 12,16 8,13.5 8,9" fill={fill} opacity="0.4" />
            </g>
          ) : (
            <g fill="#6A5ACD">
              {/* Outer Isometric Cube boundary */}
              <path
                d="M12 2.5L20 7.2v9.6L12 21.5 4 16.8V7.2L12 2.5z"
                fill="#6A5ACD"
              />
              {/* Dark inner face cut to create the G & C */}
              <polygon points="12,4.8 18.2,8.5 18.2,15.5 12,19.2 5.8,15.5 5.8,8.5" fill="#4B3B9B" />
              {/* Top Face - Light purple */}
              <polygon points="12,4.8 18.2,8.5 12,12 5.8,8.5" fill="#8B7BDB" />
              {/* Inner core block */}
              <polygon points="12,9 14.5,10.5 14.5,13.5 12,15 9.5,13.5 9.5,10.5" fill="#2E1C6A" />
              {/* Inner G hook */}
              <polyline points="14.5,12 12,10.5 12,13.5" stroke="#FFFFFF" strokeWidth="1" fill="none" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // NINTENDO SWITCH (Split Joy-Cons)
    // ==========================================
    case "switch":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              {/* Left Joy-Con */}
              <path d="M4 4c-1.5 0-2.5 1-2.5 2.5v11C1.5 19 2.5 20 4 20h5V4H4zm1 5.5a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              {/* Right Joy-Con */}
              <path d="M15 4v16h5c1.5 0 2.5-1 2.5-2.5v-11C22.5 5 21.5 4 20 4h-5zm4 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6z" />
            </g>
          ) : (
            <g>
              {/* Left Joy-Con - Neon Blue */}
              <path d="M4 4c-1.5 0-2.5 1-2.5 2.5v11C1.5 19 2.5 20 4 20h5.5V4H4z" fill="#00BDFF" />
              {/* Left Analog Stick */}
              <circle cx="5.2" cy="7.8" r="1.8" fill="#080A0F" />
              {/* Left D-pad buttons */}
              <circle cx="5.2" cy="14" r="0.9" fill="#080A0F" />
              <rect x="6.8" y="4.8" width="1.5" height="0.8" rx="0.2" fill="#080A0F" />

              {/* Right Joy-Con - Neon Red */}
              <path d="M14.5 4v16H20c1.5 0 2.5-1 2.5-2.5v-11C22.5 5 21.5 4 20 4h-5.5z" fill="#FF3C28" />
              {/* Right Action buttons */}
              <circle cx="18.8" cy="7.8" r="0.9" fill="#080A0F" />
              {/* Right Analog Stick */}
              <circle cx="18.8" cy="14" r="1.8" fill="#080A0F" />
              <path d="M16.5 5.2h1.4m-.7-.7v1.4" stroke="#080A0F" strokeWidth="0.8" strokeLinecap="round" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // SUPER NINTENDO / SUPER FAMICOM (SNES)
    // ==========================================
    case "snes":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              {/* Classic SNES Rounded Controller Silhouette */}
              <path d="M6 7c-3.3 0-5 2.2-5 5s1.7 5 5 5h12c3.3 0 5-2.2 5-5s-1.7-5-5-5H6zm0 1.5h12c2.4 0 3.5 1.5 3.5 3.5s-1.1 3.5-3.5 3.5H6c-2.4 0-3.5-1.5-3.5-3.5S3.6 8.5 6 8.5z" />
              {/* Left D-pad */}
              <path d="M4.5 11h1v-1h1v1h1v1h-1v1h-1v-1h-1z" />
              {/* Center select/start pills */}
              <line x1="10" y1="12.5" x2="11.2" y2="11.5" stroke={fill} strokeWidth="0.8" strokeLinecap="round" />
              <line x1="12" y1="12.5" x2="13.2" y2="11.5" stroke={fill} strokeWidth="0.8" strokeLinecap="round" />
              {/* 4 Diamond Action Buttons */}
              <circle cx="18" cy="10" r="0.9" />
              <circle cx="19.5" cy="11.8" r="0.9" />
              <circle cx="18" cy="13.6" r="0.9" />
              <circle cx="16.5" cy="11.8" r="0.9" />
            </g>
          ) : (
            <g>
              {/* Controller Body - Light Gray */}
              <path
                d="M6 7c-3.3 0-5 2.2-5 5s1.7 5 5 5h12c3.3 0 5-2.2 5-5s-1.7-5-5-5H6z"
                fill="#D4D8DD"
              />
              <path
                d="M6 8.5h12c2.4 0 3.5 1.5 3.5 3.5s-1.1 3.5-3.5 3.5H6c-2.4 0-3.5-1.5-3.5-3.5S3.6 8.5 6 8.5z"
                fill="#B8BCC4"
              />
              {/* D-Pad - Dark Slate */}
              <path d="M4.5 11h1v-1h1v1h1v1h-1v1h-1v-1h-1z" fill="#2C3440" />
              {/* Select & Start - Dark Slate */}
              <line x1="10" y1="12.5" x2="11.2" y2="11.5" stroke="#2C3440" strokeWidth="0.9" strokeLinecap="round" />
              <line x1="12" y1="12.5" x2="13.2" y2="11.5" stroke="#2C3440" strokeWidth="0.9" strokeLinecap="round" />
              {/* Super Famicom 4-Color Buttons */}
              {/* Top: Yellow (X) */}
              <circle cx="18" cy="10" r="1.1" fill="#FFC700" />
              {/* Right: Green (A) */}
              <circle cx="19.6" cy="11.8" r="1.1" fill="#00A859" />
              {/* Bottom: Blue (B) */}
              <circle cx="18" cy="13.6" r="1.1" fill="#0072CE" />
              {/* Left: Red (Y) */}
              <circle cx="16.4" cy="11.8" r="1.1" fill="#ED1C24" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // NES / FAMICOM (Classic Rectangular Controller)
    // ==========================================
    case "nes":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              {/* Rectangular Chassis */}
              <rect x="2" y="7" width="20" height="10" rx="1.5" fill="none" stroke={fill} strokeWidth="1.5" />
              {/* Center Black Plate */}
              <rect x="4" y="9" width="16" height="6" rx="0.5" fill={fill} opacity="0.3" />
              {/* D-pad Cross */}
              <path d="M5.5 11.2h0.8v-0.8h0.8v0.8h0.8v0.8h-0.8v0.8h-0.8v-0.8h-0.8z" fill={fill} />
              {/* Select & Start */}
              <rect x="9.8" y="12.5" width="1.6" height="0.8" rx="0.3" fill={fill} />
              <rect x="12.2" y="12.5" width="1.6" height="0.8" rx="0.3" fill={fill} />
              {/* Red B & A Buttons */}
              <circle cx="16" cy="12.5" r="0.9" fill={fill} />
              <circle cx="18.2" cy="12.5" r="0.9" fill={fill} />
            </g>
          ) : (
            <g>
              {/* Gray Base */}
              <rect x="2" y="7" width="20" height="10" rx="1.5" fill="#C8CCD0" stroke="#7E848C" strokeWidth="0.8" />
              {/* Black Inner Band */}
              <rect x="3.5" y="8.5" width="17" height="7" rx="0.5" fill="#1C1E22" />
              {/* D-pad */}
              <path d="M5.5 11.2h0.8v-0.8h0.8v0.8h0.8v0.8h-0.8v0.8h-0.8v-0.8h-0.8z" fill="#080A0F" stroke="#333" strokeWidth="0.2" />
              {/* Select & Start */}
              <rect x="9.6" y="12.2" width="1.8" height="0.8" rx="0.3" fill="#D32F2F" />
              <rect x="12.2" y="12.2" width="1.8" height="0.8" rx="0.3" fill="#D32F2F" />
              {/* Red B and A Buttons */}
              <circle cx="16" cy="12.5" r="1.1" fill="#D32F2F" />
              <circle cx="18.4" cy="12.5" r="1.1" fill="#D32F2F" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // GAME BOY ADVANCE (GBA)
    // ==========================================
    case "gba":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            {/* Wide Curved Handheld Body */}
            <path
              d="M3 8c1-1 3.5-1.5 5.5-1.5h7c2 0 4.5.5 5.5 1.5 1.5 1.5 1.5 6 0 7.5-1 1-3.5 1.5-5.5 1.5h-7c-2 0-4.5-.5-5.5-1.5-1.5-1.5-1.5-6 0-7.5z"
              fill="none"
              stroke={fill}
              strokeWidth="1.4"
            />
            {/* Center Widescreen */}
            <rect x="7" y="8.5" width="10" height="7" rx="0.8" fill={fill} opacity="0.35" />
            {/* D-Pad on Left */}
            <path d="M4.5 11.5h0.8v-0.8h0.8v0.8h0.8v0.8h-0.8v0.8h-0.8v-0.8h-0.8z" />
            {/* Angled B & A on Right */}
            <circle cx="18.2" cy="11.3" r="0.8" />
            <circle cx="19.4" cy="12.5" r="0.8" />
          </g>
        </svg>
      );

    // ==========================================
    // GAME BOY (Classic Vertical Handheld)
    // ==========================================
    case "gb":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            {/* Vertical Chassis with bottom-right bevel */}
            <path
              d="M5 4h14v13.5l-2.5 2.5H5V4z"
              fill="none"
              stroke={fill}
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            {/* Screen */}
            <rect x="7.5" y="6" width="9" height="6.5" rx="0.6" fill={fill} opacity="0.35" />
            {/* D-pad */}
            <path d="M7 14.5h0.8v-0.8h0.8v0.8h0.8v0.8h-0.8v0.8h-0.8v-0.8h-0.8z" />
            {/* Angled B & A */}
            <circle cx="15.2" cy="15.8" r="0.8" />
            <circle cx="16.8" cy="14.6" r="0.8" />
            {/* Select & Start slanted slots */}
            <line x1="10.5" y1="18.5" x2="11.8" y2="18" stroke={fill} strokeWidth="0.8" strokeLinecap="round" />
            <line x1="12.8" y1="18.5" x2="14.1" y2="18" stroke={fill} strokeWidth="0.8" strokeLinecap="round" />
          </g>
        </svg>
      );

    // ==========================================
    // NINTENDO DS / 3DS (Dual Screen Clamshell)
    // ==========================================
    case "nds":
    case "3ds":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            {/* Top Lid Screen */}
            <rect x="4" y="3.5" width="16" height="7.5" rx="1.5" fill="none" stroke={fill} strokeWidth="1.2" />
            <rect x="6.5" y="4.8" width="11" height="5" rx="0.5" fill={fill} opacity="0.35" />
            {/* Hinge */}
            <line x1="7" y1="11.5" x2="17" y2="11.5" stroke={fill} strokeWidth="1" />
            {/* Bottom Base Screen */}
            <rect x="4" y="12" width="16" height="8.5" rx="1.5" fill="none" stroke={fill} strokeWidth="1.2" />
            <rect x="7.5" y="13.2" width="9" height="5.5" rx="0.5" fill={fill} opacity="0.35" />
            {/* Controls */}
            <circle cx="5.6" cy="15.8" r="0.7" />
            <circle cx="18.4" cy="15.8" r="0.7" />
          </g>
        </svg>
      );

    // ==========================================
    // SEGA GENESIS / MEGA DRIVE (Crescent 3-Button Controller)
    // ==========================================
    case "genesis":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            {/* Crescent Ergonomic Silhouette */}
            <path
              d="M5 8c-3 1.5-4 4.5-3 7.5.8 2.2 3.2 3.5 5.5 3 2.5-.5 4.5-2.5 4.5-2.5s2 2 4.5 2.5c2.3.5 4.7-.8 5.5-3 1-3 0-6-3-7.5-3.5-1.8-10.5-1.8-14 0z"
              fill="none"
              stroke={fill}
              strokeWidth="1.4"
            />
            {/* Circular D-pad on Left */}
            <circle cx="6.5" cy="12.5" r="2.2" fill={fill} opacity="0.35" />
            <path d="M5.5 12.5h2M6.5 11.5v2" stroke={fill} strokeWidth="0.8" />
            {/* Center Start Button */}
            <rect x="11.2" y="9.5" width="1.6" height="0.8" rx="0.4" fill={fill} />
            {/* Three Angled Action Buttons (A, B, C) */}
            <circle cx="15.5" cy="13.8" r="0.8" />
            <circle cx="17.2" cy="12.8" r="0.8" />
            <circle cx="18.8" cy="11.6" r="0.8" />
          </g>
        </svg>
      );

    // ==========================================
    // SEGA SATURN (Ringed Planet Saturn)
    // ==========================================
    case "saturn":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            {/* Central Globe */}
            <circle cx="12" cy="12" r="5" fill={fill} opacity="0.4" />
            {/* Orbiting Ring (Tilted Oval) */}
            <path
              d="M2.5 15C3 10.5 7 7 12 7c5.2 0 9.5 3.8 10 8.5"
              fill="none"
              stroke={fill}
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M21.5 9C21 13.5 17 17 12 17c-5.2 0-9.5-3.8-10-8.5"
              fill="none"
              stroke={fill}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeDasharray="2.5 2"
            />
            <circle cx="12" cy="12" r="2.5" fill={fill} />
          </g>
        </svg>
      );

    // ==========================================
    // SEGA DREAMCAST (Legendary Orange Spiral)
    // ==========================================
    case "dreamcast":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <path
              d="M12 2.5c5.2 0 9.5 4.3 9.5 9.5 0 4.6-3.8 8.5-8.5 8.5-4 0-7.5-3.3-7.5-7.5 0-3.3 2.7-6 6-6 2.8 0 5 2.2 5 5 0 2.2-1.8 4-4 4-1.7 0-3-1.3-3-3 0-1.1.9-2 2-2s2 .9 2 2"
              fill="none"
              stroke={fill}
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M12 2.5c5.2 0 9.5 4.3 9.5 9.5 0 4.6-3.8 8.5-8.5 8.5-4 0-7.5-3.3-7.5-7.5 0-3.3 2.7-6 6-6 2.8 0 5 2.2 5 5 0 2.2-1.8 4-4 4-1.7 0-3-1.3-3-3 0-1.1.9-2 2-2s2 .9 2 2"
              fill="none"
              stroke="#FF6600"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          )}
        </svg>
      );

    // ==========================================
    // ORIGINAL XBOX (Iconic Carved Green X)
    // ==========================================
    case "xbox":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              {/* Outer Circular Shield */}
              <circle cx="12" cy="12" r="9.5" fill="none" stroke={fill} strokeWidth="1.5" />
              {/* Faceted 3D 'X' */}
              <path d="M6.5 5.5L10 12l-3.5 6.5h2.5L12 13.5l3 5h2.5L14 12l3.5-6.5H15L12 10.5 9 5.5H6.5z" />
            </g>
          ) : (
            <g>
              {/* Outer Glow Shield */}
              <circle cx="12" cy="12" r="9.5" fill="#0C1F0C" stroke="#107C10" strokeWidth="1.5" />
              {/* Faceted Carved X - Vibrant Neon Green */}
              <path
                d="M6.5 5.5L10 12l-3.5 6.5h2.5L12 13.5l3 5h2.5L14 12l3.5-6.5H15L12 10.5 9 5.5H6.5z"
                fill="#107C10"
              />
              {/* Core Gem Highlight */}
              <polygon points="12,10.5 13.5,12 12,13.5 10.5,12" fill="#52E252" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // XBOX 360
    // ==========================================
    case "xbox360":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.6" strokeLinecap="round">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M7 7l4 5-4 5M17 7l-4 5 4 5" />
            <circle cx="12" cy="12" r="2.2" fill={fill} />
          </g>
        </svg>
      );

    // ==========================================
    // NINTENDO WII / WII U
    // ==========================================
    case "wii":
    case "wiiu":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            {/* Lowercase 'w' */}
            <path d="M3 9.5l1.6 7 2-5.5 2 5.5 1.6-7h-1.6l-1 4.5-1.8-5-1.8 5-1-4.5H3z" />
            {/* First 'i' stem and dot */}
            <rect x="12" y="11" width="1.6" height="5.5" rx="0.4" />
            <circle cx="12.8" cy="8.5" r="1" />
            {/* Second 'i' stem and dot */}
            <rect x="15.2" y="11" width="1.6" height="5.5" rx="0.4" />
            <circle cx="16" cy="8.5" r="1" />
            {consoleKey === "wiiu" && (
              <text x="18" y="17" fontSize="5" fontWeight="900" fill="#00B0FF">
                U
              </text>
            )}
          </g>
        </svg>
      );

    // ==========================================
    // PC / NATIVE DESKTOP
    // ==========================================
    case "pc":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="12" rx="1.5" />
            <line x1="8" y1="20" x2="16" y2="20" />
            <line x1="12" y1="16" x2="12" y2="20" />
            <circle cx="12" cy="10" r="1" fill={fill} />
          </g>
        </svg>
      );

    // ==========================================
    // RECOMPILATION (Chip & Spark)
    // ==========================================
    case "recomp":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="5" width="14" height="14" rx="2" />
            <path d="M9 9h6v6H9z" fill={fill} opacity="0.3" />
            <line x1="9" y1="2" x2="9" y2="5" />
            <line x1="15" y1="2" x2="15" y2="5" />
            <line x1="9" y1="19" x2="9" y2="22" />
            <line x1="15" y1="19" x2="15" y2="22" />
            <line x1="2" y1="9" x2="5" y2="9" />
            <line x1="2" y1="15" x2="5" y2="15" />
            <line x1="19" y1="9" x2="22" y2="9" />
            <line x1="19" y1="15" x2="22" y2="15" />
          </g>
        </svg>
      );

    // ==========================================
    // ARCADE / NEO GEO
    // ==========================================
    case "arcade":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 3h16l-2 18H6L4 3z" />
            <rect x="6.5" y="5.5" width="11" height="6.5" rx="1" fill={fill} opacity="0.3" />
            <circle cx="9" cy="15.5" r="1.2" fill={fill} />
            <circle cx="13" cy="15" r="0.8" fill={fill} />
            <circle cx="15.5" cy="15.5" r="0.8" fill={fill} />
          </g>
        </svg>
      );

    // ==========================================
    // SYMBOLS & UTILITIES
    // ==========================================
    case "disc":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2a10 10 0 0 0-4 1" opacity="0.5" />
          </g>
        </svg>
      );

    case "cpu":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <rect x="9" y="9" width="6" height="6" fill={fill} opacity="0.3" />
            <path d="M9 1v3m6-3v3M9 20v3m6-3v3M20 9h3m-3 6h3M1 9h3m-3 6h3" />
          </g>
        </svg>
      );

    case "tv":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="15" rx="2" />
            <polyline points="17 2 12 7 7 2" />
          </g>
        </svg>
      );

    case "box":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
          </g>
        </svg>
      );

    case "wrench":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </g>
        </svg>
      );

    case "trophy":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v3h10v-3c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
          </g>
        </svg>
      );

    case "sparkles":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
          </g>
        </svg>
      );

    case "layers":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </g>
        </svg>
      );

    case "circle-dot":
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" fill={fill} />
          </g>
        </svg>
      );

    // ==========================================
    // DEFAULT / GENERIC RETRO GAMEPAD
    // ==========================================
    default:
      return (
        <svg {...commonProps}>
          <g fill="none" stroke={fill} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8h12a4 4 0 0 1 4 4v2a4 4 0 0 1-7 2.6L13.4 15H10.6L9 16.6A4 4 0 0 1 2 14v-2a4 4 0 0 1 4-4z" />
            <line x1="6" y1="12" x2="8" y2="12" />
            <line x1="7" y1="11" x2="7" y2="13" />
            <circle cx="16" cy="11.5" r="0.6" fill={fill} />
            <circle cx="18" cy="12.5" r="0.6" fill={fill} />
          </g>
        </svg>
      );
  }
};

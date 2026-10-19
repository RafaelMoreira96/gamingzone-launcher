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
  keywords?: string[];
}

export const AVAILABLE_ICON_PRESETS: IconPreset[] = [
  // ==========================================
  // PLAYSTATION FAMILY
  // ==========================================
  { id: "ps1", name: "PlayStation 1", category: "consoles", keywords: ["sony", "psx", "ps1", "playstation", "retro"] },
  { id: "ps2", name: "PlayStation 2", category: "consoles", keywords: ["sony", "ps2", "playstation 2", "monolith"] },
  { id: "ps3", name: "PlayStation 3", category: "consoles", keywords: ["sony", "ps3", "playstation 3", "fat"] },
  { id: "ps4", name: "PlayStation 4", category: "consoles", keywords: ["sony", "ps4", "playstation 4", "dualshock"] },
  { id: "ps5", name: "PlayStation 5", category: "consoles", keywords: ["sony", "ps5", "playstation 5", "dualsense"] },
  { id: "psp", name: "PlayStation Portable (PSP)", category: "consoles", keywords: ["sony", "psp", "portable", "portatil"] },
  { id: "psvita", name: "PlayStation Vita", category: "consoles", keywords: ["sony", "vita", "psvita", "portatil", "oled"] },

  // ==========================================
  // NINTENDO HOME CONSOLES
  // ==========================================
  { id: "nes", name: "NES / Famicom", category: "consoles", keywords: ["nintendo", "nes", "famicom", "8bit", "retro"] },
  { id: "snes", name: "Super Nintendo (SNES)", category: "consoles", keywords: ["nintendo", "snes", "super famicom", "16bit", "retro"] },
  { id: "n64", name: "Nintendo 64", category: "consoles", keywords: ["nintendo", "n64", "ultra 64", "64bit", "3d"] },
  { id: "gamecube", name: "Nintendo GameCube", category: "consoles", keywords: ["nintendo", "gamecube", "gc", "cube", "indigo"] },
  { id: "wii", name: "Nintendo Wii", category: "consoles", keywords: ["nintendo", "wii", "wiimote", "remote"] },
  { id: "wiiu", name: "Nintendo Wii U", category: "consoles", keywords: ["nintendo", "wii u", "wiiu", "gamepad"] },
  { id: "switch", name: "Nintendo Switch", category: "consoles", keywords: ["nintendo", "switch", "joycon", "oled", "hibrido"] },
  { id: "virtualboy", name: "Virtual Boy", category: "consoles", keywords: ["nintendo", "virtual boy", "vb", "3d", "retro"] },

  // ==========================================
  // NINTENDO PORTABLES
  // ==========================================
  { id: "gb", name: "Game Boy Classic", category: "consoles", keywords: ["nintendo", "game boy", "dmg", "dmg-01", "portatil", "retro"] },
  { id: "gbc", name: "Game Boy Color", category: "consoles", keywords: ["nintendo", "gbc", "color", "game boy color", "portatil"] },
  { id: "gba", name: "Game Boy Advance", category: "consoles", keywords: ["nintendo", "gba", "advance", "sp", "portatil"] },
  { id: "nds", name: "Nintendo DS", category: "consoles", keywords: ["nintendo", "nds", "ds", "lite", "dual screen", "portatil"] },
  { id: "3ds", name: "Nintendo 3DS", category: "consoles", keywords: ["nintendo", "3ds", "2ds", "new 3ds", "circle pad", "portatil"] },

  // ==========================================
  // SEGA FAMILY
  // ==========================================
  { id: "mastersystem", name: "Sega Master System", category: "consoles", keywords: ["sega", "master system", "sms", "8bit", "retro"] },
  { id: "genesis", name: "Sega Genesis / Mega Drive", category: "consoles", keywords: ["sega", "genesis", "megadrive", "mega drive", "16bit"] },
  { id: "gamegear", name: "Sega Game Gear", category: "consoles", keywords: ["sega", "game gear", "gg", "portatil", "color"] },
  { id: "saturn", name: "Sega Saturn", category: "consoles", keywords: ["sega", "saturn", "32bit", "cd", "retro"] },
  { id: "dreamcast", name: "Sega Dreamcast", category: "consoles", keywords: ["sega", "dreamcast", "dc", "vmu", "spiral"] },

  // ==========================================
  // MICROSOFT XBOX FAMILY
  // ==========================================
  { id: "xbox", name: "Original Xbox", category: "consoles", keywords: ["microsoft", "xbox", "classic", "duke"] },
  { id: "xbox360", name: "Xbox 360", category: "consoles", keywords: ["microsoft", "xbox 360", "x360", "guide"] },
  { id: "xboxone", name: "Xbox One", category: "consoles", keywords: ["microsoft", "xbox one", "xb1", "one s", "one x"] },
  { id: "xboxseries", name: "Xbox Series X/S", category: "consoles", keywords: ["microsoft", "xbox series", "series x", "series s", "nextgen"] },

  // ==========================================
  // RETRO & ARCADE & PC
  // ==========================================
  { id: "atari", name: "Atari 2600", category: "consoles", keywords: ["atari", "2600", "7800", "joystick", "vintage", "retro"] },
  { id: "neogeo", name: "Neo Geo AES / MVS", category: "consoles", keywords: ["snk", "neogeo", "neo geo", "aes", "mvs", "arcade"] },
  { id: "pce", name: "PC Engine / TurboGrafx-16", category: "consoles", keywords: ["nec", "pce", "pc engine", "turbografx", "tg16"] },
  { id: "steamdeck", name: "Steam Deck / Handheld PC", category: "consoles", keywords: ["valve", "steam", "steam deck", "rog ally", "portatil"] },
  { id: "retroarch", name: "RetroArch", category: "consoles", keywords: ["retroarch", "libretro", "emulador", "cores", "space invader"] },
  { id: "arcade", name: "Arcade / Fliperama", category: "consoles", keywords: ["arcade", "fliperama", "mame", "cabinet", "ficha"] },
  { id: "pc", name: "PC / Windows", category: "consoles", keywords: ["pc", "windows", "desktop", "computador", "dos"] },
  { id: "recomp", name: "Recompilação CPU", category: "consoles", keywords: ["recomp", "descompilacao", "native", "source", "chip"] },

  // ==========================================
  // GENERIC SYMBOLS
  // ==========================================
  { id: "cartridge", name: "Cartucho Retro", category: "symbols", keywords: ["fita", "cartucho", "cartridge", "rom"] },
  { id: "gamepad", name: "Gamepad Retro", category: "symbols", keywords: ["controle", "joystick", "gamepad"] },
  { id: "disc", name: "Disco Óptico (CD/DVD)", category: "symbols", keywords: ["cd", "dvd", "disco", "bluray", "iso"] },
  { id: "cpu", name: "Processador / Chip", category: "symbols", keywords: ["chip", "cpu", "processador", "hardware"] },
  { id: "tv", name: "TV CRT / Tubo", category: "symbols", keywords: ["tv", "crt", "monitor", "tubo", "scanlines"] },
  { id: "sdcard", name: "Cartão SD / Memória", category: "symbols", keywords: ["sd", "cartao", "memory card", "save"] },
  { id: "box", name: "Caixa / Gabinete", category: "symbols", keywords: ["box", "caixa", "embalagem"] },
  { id: "trophy", name: "Troféu", category: "symbols", keywords: ["trofeu", "conquista", "vitoria"] },
  { id: "sparkles", name: "Brilho / Especial", category: "symbols", keywords: ["brilho", "estrela", "especial"] },
  { id: "wrench", name: "Ferramenta / Custom", category: "symbols", keywords: ["ferramenta", "configuracao", "custom"] },
  { id: "layers", name: "Camadas", category: "symbols", keywords: ["camadas", "layers", "stack"] },
  { id: "circle-dot", name: "Alvo / Círculo", category: "symbols", keywords: ["alvo", "mira", "ponto"] },
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

  // Explicit known keys
  if (iconStr === "ps1" || iconStr === "psx") return "ps1";
  if (iconStr === "ps2") return "ps2";
  if (iconStr === "ps3") return "ps3";
  if (iconStr === "ps4") return "ps4";
  if (iconStr === "ps5") return "ps5";
  if (iconStr === "psp") return "psp";
  if (iconStr === "psvita" || iconStr === "vita") return "psvita";
  if (iconStr === "nes" || iconStr === "famicom") return "nes";
  if (iconStr === "snes" || iconStr === "sfc") return "snes";
  if (iconStr === "n64") return "n64";
  if (iconStr === "gamecube" || iconStr === "gc" || iconStr === "cube") return "gamecube";
  if (iconStr === "wii") return "wii";
  if (iconStr === "wiiu") return "wiiu";
  if (iconStr === "switch") return "switch";
  if (iconStr === "virtualboy") return "virtualboy";
  if (iconStr === "gb") return "gb";
  if (iconStr === "gbc") return "gbc";
  if (iconStr === "gba") return "gba";
  if (iconStr === "nds") return "nds";
  if (iconStr === "3ds") return "3ds";
  if (iconStr === "mastersystem" || iconStr === "sms") return "mastersystem";
  if (iconStr === "genesis" || iconStr === "megadrive") return "genesis";
  if (iconStr === "gamegear" || iconStr === "gg") return "gamegear";
  if (iconStr === "saturn") return "saturn";
  if (iconStr === "dreamcast" || iconStr === "swatch-book") return "dreamcast";
  if (iconStr === "xbox") return "xbox";
  if (iconStr === "xbox360" || iconStr === "x360") return "xbox360";
  if (iconStr === "xboxone" || iconStr === "xb1") return "xboxone";
  if (iconStr === "xboxseries" || iconStr === "seriesx") return "xboxseries";
  if (iconStr === "atari" || iconStr === "2600") return "atari";
  if (iconStr === "neogeo" || iconStr === "neo-geo") return "neogeo";
  if (iconStr === "pce" || iconStr === "turbografx") return "pce";
  if (iconStr === "steamdeck" || iconStr === "deck") return "steamdeck";
  if (iconStr === "retroarch") return "retroarch";
  if (iconStr === "arcade") return "arcade";
  if (iconStr === "pc") return "pc";
  if (iconStr === "recomp") return "recomp";
  if (iconStr === "cartridge") return "cartridge";
  if (iconStr === "sdcard") return "sdcard";
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

  if (/playstation\s*5|ps5/i.test(raw)) return "ps5";
  if (/playstation\s*4|ps4/i.test(raw)) return "ps4";
  if (/playstation\s*3|ps3/i.test(raw)) return "ps3";
  if (/playstation\s*2|ps2/i.test(raw)) return "ps2";
  if (/ps1|psx|playstation\s*1|playstation\s*one/i.test(raw)) return "ps1";
  if (/psp|playstation\s*portable/i.test(raw)) return "psp";
  if (/vita|psvita/i.test(raw)) return "psvita";
  if (/n64|nintendo\s*64/i.test(raw)) return "n64";
  if (/gamecube|gc\b|ngc/i.test(raw)) return "gamecube";
  if (/wii\s*u|wiiu/i.test(raw)) return "wiiu";
  if (/\bwii\b/i.test(raw)) return "wii";
  if (/switch|nsw/i.test(raw)) return "switch";
  if (/virtual\s*boy/i.test(raw)) return "virtualboy";
  if (/snes|super\s*nintendo|sfc|super\s*famicom/i.test(raw)) return "snes";
  if (/\bnes\b|famicom|nintendo\s*entertainment/i.test(raw)) return "nes";
  if (/gba|game\s*boy\s*advance/i.test(raw)) return "gba";
  if (/gbc|game\s*boy\s*color/i.test(raw)) return "gbc";
  if (/\bgb\b|game\s*boy/i.test(raw)) return "gb";
  if (/3ds|nintendo\s*3ds/i.test(raw)) return "3ds";
  if (/nds|\bds\b|nintendo\s*ds/i.test(raw)) return "nds";
  if (/game\s*gear|\bgg\b/i.test(raw)) return "gamegear";
  if (/master\s*system|\bsms\b/i.test(raw)) return "mastersystem";
  if (/genesis|megadrive|mega\s*drive/i.test(raw)) return "genesis";
  if (/saturn/i.test(raw)) return "saturn";
  if (/dreamcast|\bdc\b/i.test(raw)) return "dreamcast";
  if (/xbox\s*series|series\s*[xs]/i.test(raw)) return "xboxseries";
  if (/xbox\s*one|xbone/i.test(raw)) return "xboxone";
  if (/xbox\s*360|x360/i.test(raw)) return "xbox360";
  if (/xbox/i.test(raw)) return "xbox";
  if (/atari|2600|7800/i.test(raw)) return "atari";
  if (/neogeo|neo-geo|\bmvs\b|\baes\b/i.test(raw)) return "neogeo";
  if (/pce|turbografx|pc-engine|pc\s*engine/i.test(raw)) return "pce";
  if (/steam\s*deck/i.test(raw)) return "steamdeck";
  if (/retroarch/i.test(raw)) return "retroarch";
  if (/arcade|mame|fliperama/i.test(raw)) return "arcade";
  if (/cartridge|cartucho|fita/i.test(raw)) return "cartridge";
  if (/sdcard|sd\s*card|memory\s*card/i.test(raw)) return "sdcard";
  if (/pc|windows|dos|steam/i.test(raw)) return "pc";
  if (/recomp|descomp/i.test(raw)) return "recomp";
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
  // Custom image check
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
    // PLAYSTATION 1 (Iconic 3D P and S Logo)
    // ==========================================
    case "ps1":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              <path d="M7 3v13.5h3.2V11.2h2.2c2.8 0 4.6-1.5 4.6-4.1 0-2.6-1.8-4.1-4.6-4.1H7zm3.2 2.6h2c1.2 0 1.9.6 1.9 1.5 0 .9-.7 1.5-1.9 1.5h-2V5.6z" />
              <path d="M5 16.8c1.5-.6 3.6-.9 6.2-.9 2.2 0 3.7.3 4.8.8.7.3.7.8 0 1.2-1.3.7-3.7 1.1-6.8 1.1-2.9 0-5.1-.4-6.4-1.1-.5-.3-.4-.7.3-1l1.9-.1z" opacity="0.8" />
              <path d="M11.8 17.8c3.2 0 5.4.4 6.7 1.1.6.3.6.8-.2 1.1-1.6.7-4.2 1-7.5 1-2.6 0-4.6-.3-5.7-.8-.5-.2-.5-.6 0-.8l2.2-.1c1.2.3 2.7.5 4.5.5z" opacity="0.6" />
            </g>
          ) : (
            <g>
              <path d="M7 3v13.5h3.2V11.2h2.2c2.8 0 4.6-1.5 4.6-4.1 0-2.6-1.8-4.1-4.6-4.1H7zm3.2 2.6h2c1.2 0 1.9.6 1.9 1.5 0 .9-.7 1.5-1.9 1.5h-2V5.6z" fill="#F32C3A" />
              <path d="M5 16.8c1.5-.6 3.6-.9 6.2-.9 2.2 0 3.7.3 4.8.8.7.3.7.8 0 1.2-1.3.7-3.7 1.1-6.8 1.1-2.9 0-5.1-.4-6.4-1.1-.5-.3-.4-.7.3-1l1.9-.1z" fill="#FFC700" />
              <path d="M11.8 17.8c3.2 0 5.4.4 6.7 1.1.6.3.6.8-.2 1.1-1.6.7-4.2 1-7.5 1-2.6 0-4.6-.3-5.7-.8-.5-.2-.5-.6 0-.8l2.2-.1c1.2.3 2.7.5 4.5.5z" fill="#00B2D6" />
              <path d="M17.5 18.8c.8.4.8.8.1 1.2-1.5.8-4.2 1.2-7.8 1.2-2.1 0-3.8-.2-4.9-.6.7-.4 2-.7 3.8-.7 3.5 0 6.6-.4 8.8-1.1z" fill="#00439C" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // PLAYSTATION 2 (Monolith Console & Cyan Logo)
    // ==========================================
    case "ps2":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="12" rx="1.5" />
              <line x1="3" y1="11" x2="21" y2="11" strokeWidth="1" />
              <circle cx="18" cy="8.5" r="0.8" fill={fill} />
              <rect x="5" y="13.5" width="6" height="2" rx="0.5" fill={fill} />
            </g>
          ) : (
            <g>
              <rect x="3" y="5.5" width="18" height="13" rx="1.5" fill="#0E121A" stroke="#253248" strokeWidth="1.2" />
              <line x1="3" y1="11" x2="21" y2="11" stroke="#00A3E0" strokeWidth="0.8" opacity="0.8" />
              <line x1="6" y1="13.5" x2="6" y2="16.5" stroke="#1E293B" strokeWidth="0.8" />
              <line x1="8" y1="13.5" x2="8" y2="16.5" stroke="#1E293B" strokeWidth="0.8" />
              <line x1="10" y1="13.5" x2="10" y2="16.5" stroke="#1E293B" strokeWidth="0.8" />
              <circle cx="18.5" cy="8.2" r="0.9" fill="#22C55E" />
              <circle cx="16" cy="8.2" r="0.9" fill="#00A3E0" />
              <text x="5" y="9.8" fontSize="4.5" fontWeight="900" fontFamily="sans-serif" fill="#00A3E0" letterSpacing="0.5">
                PS2
              </text>
            </g>
          )}
        </svg>
      );

    // ==========================================
    // PLAYSTATION 3 (Curved Fat Console & Chrome Trim)
    // ==========================================
    case "ps3":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 17.5V9c0-3.5 3.5-5.5 8-5.5s8 2 8 5.5v8.5H4z" />
              <path d="M4 13.5h16" />
              <line x1="8" y1="15.5" x2="16" y2="15.5" strokeWidth="1" />
            </g>
          ) : (
            <g>
              <path d="M3.5 18V8.8c0-3.8 3.8-5.8 8.5-5.8s8.5 2 8.5 5.8V18H3.5z" fill="#12151E" stroke="#2A3346" strokeWidth="1" />
              <path d="M4 12c3-1.2 7-1.8 8-1.8s5 .6 8 1.8" stroke="#CBD5E1" strokeWidth="1.2" fill="none" />
              <line x1="7" y1="14.5" x2="17" y2="14.5" stroke="#000" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="18.5" cy="16.5" r="0.7" fill="#22C55E" />
              <circle cx="16.5" cy="16.5" r="0.7" fill="#EF4444" opacity="0.6" />
              <text x="7" y="9.5" fontSize="3.6" fontWeight="800" fontFamily="sans-serif" fill="#CBD5E1" letterSpacing="0.8">
                PS3
              </text>
            </g>
          )}
        </svg>
      );

    // ==========================================
    // PLAYSTATION 4 (Slanted Dual Slabs & Blue Light Bar)
    // ==========================================
    case "ps4":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              <polygon points="5,5 20,5 18,11 3,11" />
              <polygon points="2.5,13 17.5,13 15.5,19 0.5,19" opacity="0.7" />
            </g>
          ) : (
            <g>
              <polygon points="6,4.5 21.5,4.5 19.5,11.2 4,11.2" fill="#1E2433" stroke="#334155" strokeWidth="0.8" />
              <line x1="3.8" y1="11.8" x2="19.3" y2="11.8" stroke="#006FCD" strokeWidth="1.2" />
              <polygon points="3.5,12.5 19,12.5 17,19.5 1.5,19.5" fill="#0F131C" stroke="#1E293B" strokeWidth="0.8" />
              <line x1="6" y1="15.5" x2="13" y2="15.5" stroke="#000" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="8" y1="7.8" x2="10.5" y2="7.8" stroke="#00A3E0" strokeWidth="1" strokeLinecap="round" />
              <text x="13.5" y="9.5" fontSize="3.6" fontWeight="900" fontFamily="sans-serif" fill="#CBD5E1">
                PS4
              </text>
            </g>
          )}
        </svg>
      );

    // ==========================================
    // PLAYSTATION 5 (Curved White Collar Tower & Blue Glow)
    // ==========================================
    case "ps5":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3.5c1.5 5 1.5 12 0 17 4-1 10-1 14 0-1.5-5-1.5-12 0-17-4 1-10 1-14 0z" />
              <path d="M9 4.5v15M15 4.5v15" />
            </g>
          ) : (
            <g>
              <path d="M8 3.5h8c.5 4 .5 13 0 17H8c-.5-4-.5-13 0-17z" fill="#0A0D14" />
              <path d="M7.8 4c.8 4 .8 12 0 16" stroke="#2563EB" strokeWidth="1" fill="none" />
              <path d="M16.2 4c-.8 4-.8 12 0 16" stroke="#00D2FF" strokeWidth="1" fill="none" />
              <path d="M4.5 3c2 4.5 2 13.5-1 18 3.5-.8 6.5-.5 7-.5V3.5c-1 0-3.5-.2-6-.5z" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="0.6" />
              <path d="M19.5 3c-2 4.5-2 13.5 1 18-3.5-.8-6.5-.5-7-.5V3.5c1 0 3.5-.2 6-.5z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="0.6" />
              <path d="M16.5 13.5c1.2 0 2 1.5 2 3.5s-.8 3.5-2 3.5" fill="#E2E8F0" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // PSP (PlayStation Portable)
    // ==========================================
    case "psp":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              <rect x="2" y="6" width="20" height="12" rx="4" fill="none" stroke={fill} strokeWidth="1.5" />
              <rect x="7" y="8" width="10" height="8" rx="0.8" fill={fill} opacity="0.35" />
              <path d="M4 11h2v2H4z" />
              <circle cx="18.5" cy="10" r="0.8" />
              <circle cx="19.5" cy="12" r="0.8" />
              <circle cx="18.5" cy="14" r="0.8" />
              <circle cx="17.5" cy="12" r="0.8" />
            </g>
          ) : (
            <g>
              <rect x="2" y="6" width="20" height="12" rx="4" fill="#181B22" stroke="#64748B" strokeWidth="1" />
              <rect x="6.8" y="7.8" width="10.4" height="7.8" rx="0.6" fill="#0B0F19" stroke="#334155" strokeWidth="0.6" />
              <rect x="7.3" y="8.3" width="9.4" height="4" fill="#1E293B" opacity="0.4" />
              <path d="M4.2 11h.8v-.8h.8v.8h.8v.8h-.8v.8h-.8v-.8h-.8z" fill="#94A3B8" />
              <circle cx="4.6" cy="14.8" r="1" fill="#334155" stroke="#475569" strokeWidth="0.4" />
              <circle cx="18.6" cy="9.6" r="0.7" fill="#10B981" />
              <circle cx="19.7" cy="11.4" r="0.7" fill="#EF4444" />
              <circle cx="18.6" cy="13.2" r="0.7" fill="#3B82F6" />
              <circle cx="17.5" cy="11.4" r="0.7" fill="#EC4899" />
              <line x1="8" y1="16.5" x2="16" y2="16.5" stroke="#475569" strokeWidth="0.8" strokeLinecap="round" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // PS VITA (Ergonomic Oval & Dual Sticks)
    // ==========================================
    case "psvita":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              <rect x="2" y="5.5" width="20" height="13" rx="5" fill="none" stroke={fill} strokeWidth="1.5" />
              <rect x="6.5" y="7.5" width="11" height="9" rx="1" fill={fill} opacity="0.3" />
              <circle cx="4.8" cy="14" r="1.1" />
              <circle cx="19.2" cy="14" r="1.1" />
            </g>
          ) : (
            <g>
              <rect x="2" y="5.5" width="20" height="13" rx="5.5" fill="#141822" stroke="#2563EB" strokeWidth="0.9" />
              <rect x="6.4" y="7.2" width="11.2" height="9.6" rx="0.8" fill="#070A12" stroke="#1E293B" strokeWidth="0.5" />
              <polygon points="6.8,7.6 14,7.6 11,12 6.8,12" fill="#1E3A8A" opacity="0.3" />
              <circle cx="4.8" cy="13.8" r="1.3" fill="#334155" stroke="#64748B" strokeWidth="0.5" />
              <circle cx="19.2" cy="13.8" r="1.3" fill="#334155" stroke="#64748B" strokeWidth="0.5" />
              <path d="M4.2 9.4h.6v-.6h.6v.6h.6v.6h-.6v.6h-.6v-.6h-.6z" fill="#94A3B8" />
              <circle cx="19.2" cy="8.6" r="0.6" fill="#10B981" />
              <circle cx="20.1" cy="9.8" r="0.6" fill="#EF4444" />
              <circle cx="19.2" cy="11" r="0.6" fill="#3B82F6" />
              <circle cx="18.3" cy="9.8" r="0.6" fill="#EC4899" />
              <circle cx="4.6" cy="16.5" r="0.7" fill="#00E5FF" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // NINTENDO 64 (Iconic 3D 4-prong N block)
    // ==========================================
    case "n64":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              <polygon points="4,7.5 7.5,5.5 7.5,17 4,19" />
              <polygon points="16.5,5.5 20,7.5 20,19 16.5,17" />
              <polygon points="7.5,8 10.5,6.5 16.5,15.5 13.5,17" />
              <polygon points="4,7.5 7.5,5.5 10.5,7 7,9" opacity="0.8" />
              <polygon points="13.5,7 16.5,5.5 20,7.5 17,9" opacity="0.8" />
              <polygon points="7.5,17 10.5,18.5 16.5,17 13.5,15.5" opacity="0.5" />
            </g>
          ) : (
            <g>
              <polygon points="4,7.5 7.5,5.5 7.5,17 4,19" fill="#E52521" />
              <polygon points="16.5,5.5 20,7.5 20,19 16.5,17" fill="#0038A8" />
              <polygon points="7.5,8 10.5,6.5 16.5,15.5 13.5,17" fill="#00A651" />
              <polygon points="4,7.5 7.5,5.5 10.5,7 7,9" fill="#FFD100" />
              <polygon points="13.5,7 16.5,5.5 20,7.5 17,9" fill="#E52521" />
              <polygon points="7.5,17 10.5,18.5 16.5,17 13.5,15.5" fill="#0038A8" opacity="0.75" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // NINTENDO GAMECUBE (Iconic Indigo Controller)
    // ==========================================
    case "gamecube":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 7c-3 0-4.5 3-3.5 8 1 4 2.5 5 4 4 1.5-1 2-4 2-5h7c0 1 .5 4 2 5s3 0 4-4c1-5-.5-8-3.5-8-2 0-3.5 1.5-6 1.5S8 7 6 7z" />
              <circle cx="6.5" cy="10.5" r="1.8" />
              <circle cx="16.8" cy="10.8" r="1.4" fill={fill} />
              <circle cx="15" cy="12.2" r="0.8" />
              <circle cx="17.2" cy="15.2" r="1.2" />
            </g>
          ) : (
            <g>
              <path
                d="M6 6.8c-3 0-4.5 3-3.5 8 1 4 2.5 5 4 4 1.5-1 2-4 2-5h7c0 1 .5 4 2 5s3 0 4-4c1-5-.5-8-3.5-8-2 0-3.5 1.5-6 1.5S8 6.8 6 6.8z"
                fill="#5447A3"
                stroke="#3E347D"
                strokeWidth="1"
              />
              <circle cx="6.5" cy="10.5" r="2" fill="#9CA3AF" stroke="#D1D5DB" strokeWidth="0.5" />
              <circle cx="6.5" cy="10.5" r="0.9" fill="#6B7280" />
              <path d="M6 14.2h.5v-.5h.5v.5h.5v.5h-.5v.5h-.5v-.5h-.5z" fill="#2D2B52" />
              <circle cx="12" cy="11.5" r="0.8" fill="#2D2B52" />
              <circle cx="16.8" cy="10.8" r="1.7" fill="#22C55E" stroke="#15803D" strokeWidth="0.5" />
              <circle cx="14.6" cy="12.2" r="1" fill="#EF4444" stroke="#B91C1C" strokeWidth="0.4" />
              <ellipse cx="19" cy="9.8" rx="0.7" ry="1.2" transform="rotate(30 19 9.8)" fill="#E2E8F0" />
              <ellipse cx="16.8" cy="8.2" rx="1.2" ry="0.6" fill="#E2E8F0" />
              <circle cx="17.2" cy="15.2" r="1.4" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.5" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // NINTENDO WII (Iconic Wiimote Controller)
    // ==========================================
    case "wii":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8.5" y="2.5" width="7" height="19" rx="1.5" />
              <circle cx="12" cy="5.5" r="1.4" />
              <circle cx="12" cy="9" r="1.6" fill={fill} />
              <line x1="10.5" y1="12" x2="13.5" y2="12" />
              <circle cx="12" cy="14.5" r="0.7" />
              <circle cx="12" cy="17" r="0.7" />
            </g>
          ) : (
            <g>
              <rect x="8.5" y="2.5" width="7" height="19" rx="1.8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
              <rect x="10.5" y="2.5" width="3" height="0.8" rx="0.4" fill="#0F172A" />
              <path d="M11 5.5h.7v-.7h.7v.7h.7v.7h-.7v.7h-.7v-.7h-.7z" fill="#94A3B8" />
              <circle cx="12" cy="9" r="1.6" fill="#FFFFFF" stroke="#00A3E0" strokeWidth="0.6" />
              <circle cx="10.5" cy="12.2" r="0.5" fill="#94A3B8" />
              <circle cx="12" cy="12.2" r="0.6" fill="#00A3E0" />
              <circle cx="13.5" cy="12.2" r="0.5" fill="#94A3B8" />
              <circle cx="11.4" cy="14" r="0.25" fill="#94A3B8" />
              <circle cx="12.6" cy="14" r="0.25" fill="#94A3B8" />
              <circle cx="12" cy="14.6" r="0.25" fill="#94A3B8" />
              <circle cx="12" cy="16.5" r="0.7" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.4" />
              <circle cx="12" cy="18.5" r="0.7" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="0.4" />
              <circle cx="9.8" cy="20.3" r="0.35" fill="#38BDF8" />
              <circle cx="11.2" cy="20.3" r="0.35" fill="#38BDF8" opacity="0.4" />
              <circle cx="12.8" cy="20.3" r="0.35" fill="#38BDF8" opacity="0.4" />
              <circle cx="14.2" cy="20.3" r="0.35" fill="#38BDF8" opacity="0.4" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // NINTENDO WII U (Wii U GamePad)
    // ==========================================
    case "wiiu":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5.5" width="20" height="13" rx="3" />
              <rect x="6.5" y="7.5" width="11" height="9" rx="1" fill={fill} opacity="0.3" />
              <circle cx="4.5" cy="8.5" r="1.1" fill={fill} />
              <circle cx="19.5" cy="8.5" r="1.1" fill={fill} />
            </g>
          ) : (
            <g>
              <rect x="2" y="5.5" width="20" height="13" rx="3.5" fill="#181B22" stroke="#475569" strokeWidth="1" />
              <rect x="6.2" y="7.2" width="11.6" height="9.6" rx="0.8" fill="#0F172A" stroke="#334155" strokeWidth="0.6" />
              <rect x="6.8" y="7.8" width="10.4" height="4" fill="#1E293B" opacity="0.3" />
              <circle cx="4.5" cy="8.5" r="1.3" fill="#64748B" stroke="#94A3B8" strokeWidth="0.5" />
              <circle cx="19.5" cy="8.5" r="1.3" fill="#64748B" stroke="#94A3B8" strokeWidth="0.5" />
              <path d="M3.8 12.5h.5v-.5h.5v.5h.5v.5h-.5v.5h-.5v-.5h-.5z" fill="#94A3B8" />
              <circle cx="19.5" cy="11.8" r="0.5" fill="#3B82F6" />
              <circle cx="20.3" cy="12.6" r="0.5" fill="#EF4444" />
              <circle cx="19.5" cy="13.4" r="0.5" fill="#FACC15" />
              <circle cx="18.7" cy="12.6" r="0.5" fill="#10B981" />
              <circle cx="12" cy="6.4" r="0.4" fill="#00A3E0" />
              <rect x="11.3" y="17.2" width="1.4" height="0.6" rx="0.2" fill="#00A3E0" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // NINTENDO SWITCH (Split Neon Joy-Cons)
    // ==========================================
    case "switch":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              <path d="M4 4c-1.5 0-2.5 1-2.5 2.5v11C1.5 19 2.5 20 4 20h5V4H4zm1 5.5a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6zm0 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
              <path d="M15 4v16h5c1.5 0 2.5-1 2.5-2.5v-11C22.5 5 21.5 4 20 4h-5zm4 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm0 5a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6z" />
            </g>
          ) : (
            <g>
              <path d="M4 4c-1.5 0-2.5 1-2.5 2.5v11C1.5 19 2.5 20 4 20h5.5V4H4z" fill="#00BDFF" />
              <circle cx="5.2" cy="7.8" r="1.8" fill="#080A0F" />
              <circle cx="5.2" cy="14" r="0.9" fill="#080A0F" />
              <rect x="6.8" y="4.8" width="1.5" height="0.8" rx="0.2" fill="#080A0F" />
              <path d="M14.5 4v16H20c1.5 0 2.5-1 2.5-2.5v-11C22.5 5 21.5 4 20 4h-5.5z" fill="#FF3C28" />
              <circle cx="18.8" cy="7.8" r="0.9" fill="#080A0F" />
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
              <path d="M6 7c-3.3 0-5 2.2-5 5s1.7 5 5 5h12c3.3 0 5-2.2 5-5s-1.7-5-5-5H6zm0 1.5h12c2.4 0 3.5 1.5 3.5 3.5s-1.1 3.5-3.5 3.5H6c-2.4 0-3.5-1.5-3.5-3.5S3.6 8.5 6 8.5z" />
              <path d="M4.5 11h1v-1h1v1h1v1h-1v1h-1v-1h-1z" />
              <line x1="10" y1="12.5" x2="11.2" y2="11.5" stroke={fill} strokeWidth="0.8" strokeLinecap="round" />
              <line x1="12" y1="12.5" x2="13.2" y2="11.5" stroke={fill} strokeWidth="0.8" strokeLinecap="round" />
              <circle cx="18" cy="10" r="0.9" />
              <circle cx="19.5" cy="11.8" r="0.9" />
              <circle cx="18" cy="13.6" r="0.9" />
              <circle cx="16.5" cy="11.8" r="0.9" />
            </g>
          ) : (
            <g>
              <path d="M6 7c-3.3 0-5 2.2-5 5s1.7 5 5 5h12c3.3 0 5-2.2 5-5s-1.7-5-5-5H6z" fill="#D4D8DD" />
              <path d="M6 8.5h12c2.4 0 3.5 1.5 3.5 3.5s-1.1 3.5-3.5 3.5H6c-2.4 0-3.5-1.5-3.5-3.5S3.6 8.5 6 8.5z" fill="#B8BCC4" />
              <path d="M4.5 11h1v-1h1v1h1v1h-1v1h-1v-1h-1z" fill="#2C3440" />
              <line x1="10" y1="12.5" x2="11.2" y2="11.5" stroke="#2C3440" strokeWidth="0.9" strokeLinecap="round" />
              <line x1="12" y1="12.5" x2="13.2" y2="11.5" stroke="#2C3440" strokeWidth="0.9" strokeLinecap="round" />
              <circle cx="18" cy="10" r="1.1" fill="#FFC700" />
              <circle cx="19.6" cy="11.8" r="1.1" fill="#00A859" />
              <circle cx="18" cy="13.6" r="1.1" fill="#0072CE" />
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
              <rect x="2" y="7" width="20" height="10" rx="1.5" fill="none" stroke={fill} strokeWidth="1.5" />
              <rect x="4" y="9" width="16" height="6" rx="0.5" fill={fill} opacity="0.3" />
              <path d="M5.5 11.2h0.8v-0.8h0.8v0.8h0.8v0.8h-0.8v0.8h-0.8v-0.8h-0.8z" fill={fill} />
              <rect x="9.8" y="12.5" width="1.6" height="0.8" rx="0.3" fill={fill} />
              <rect x="12.2" y="12.5" width="1.6" height="0.8" rx="0.3" fill={fill} />
              <circle cx="16" cy="12.5" r="0.9" fill={fill} />
              <circle cx="18.2" cy="12.5" r="0.9" fill={fill} />
            </g>
          ) : (
            <g>
              <rect x="2" y="7" width="20" height="10" rx="1.5" fill="#C8CCD0" stroke="#7E848C" strokeWidth="0.8" />
              <rect x="3.5" y="8.5" width="17" height="7" rx="0.5" fill="#1C1E22" />
              <path d="M5.5 11.2h0.8v-0.8h0.8v0.8h0.8v0.8h-0.8v0.8h-0.8v-0.8h-0.8z" fill="#080A0F" stroke="#333" strokeWidth="0.2" />
              <rect x="9.6" y="12.2" width="1.8" height="0.8" rx="0.3" fill="#D32F2F" />
              <rect x="12.2" y="12.2" width="1.8" height="0.8" rx="0.3" fill="#D32F2F" />
              <circle cx="16" cy="12.5" r="1.1" fill="#D32F2F" />
              <circle cx="18.4" cy="12.5" r="1.1" fill="#D32F2F" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // GAME BOY (Classic DMG-01 1989)
    // ==========================================
    case "gb":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              <path d="M5 3.5h14v13.5l-2.5 2.5H5V3.5z" fill="none" stroke={fill} strokeWidth="1.4" strokeLinejoin="round" />
              <rect x="7" y="5.5" width="10" height="7.5" rx="0.8" fill={fill} opacity="0.35" />
              <path d="M6.5 15h.8v-.8h.8v.8h.8v.8h-.8v.8h-.8v-.8h-.8z" />
              <circle cx="14.8" cy="16.2" r="0.9" />
              <circle cx="16.8" cy="14.8" r="0.9" />
            </g>
          ) : (
            <g>
              <path d="M5 3.5h14v13.5l-2.5 2.5H5V3.5z" fill="#D3D2CD" stroke="#9E9D96" strokeWidth="0.9" strokeLinejoin="round" />
              <path d="M6.5 5h11c.5 0 .8.4.8.8v6.4c0 .5-.4.8-.8.8h-10c-.5 0-.8-.4-.8-.8v-6.4c0-.4.3-.8.8-.8z" fill="#585B62" />
              <circle cx="8" cy="8.5" r="0.5" fill="#EF4444" />
              <rect x="9.2" y="6" width="6.8" height="5.6" rx="0.4" fill="#889828" stroke="#717E1F" strokeWidth="0.4" />
              <path d="M6.5 14.8h.9v-.9h.9v.9h.9v.9h-.9v.9h-.9v-.9h-.9z" fill="#1C1E24" />
              <circle cx="14.5" cy="16.2" r="1.1" fill="#991B52" />
              <circle cx="16.8" cy="14.6" r="1.1" fill="#991B52" />
              <line x1="9.5" y1="18.2" x2="11" y2="17.5" stroke="#7C7F86" strokeWidth="0.8" strokeLinecap="round" />
              <line x1="12" y1="18.2" x2="13.5" y2="17.5" stroke="#7C7F86" strokeWidth="0.8" strokeLinecap="round" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // GAME BOY COLOR (GBC)
    // ==========================================
    case "gbc":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 3.5h13c.8 0 1.5.7 1.5 1.5v11c0 2-1.5 4-3.5 4h-9c-2 0-3.5-2-3.5-4V5c0-.8.7-1.5 1.5-1.5z" />
              <rect x="7" y="5.5" width="10" height="7.5" rx="0.8" fill={fill} opacity="0.35" />
              <path d="M6.8 15h.7v-.7h.7v.7h.7v.7h-.7v.7h-.7v-.7h-.7z" fill={fill} />
              <circle cx="15" cy="16" r="0.9" fill={fill} />
              <circle cx="17" cy="14.8" r="0.9" fill={fill} />
            </g>
          ) : (
            <g>
              <path d="M5.5 3.5h13c.8 0 1.5.7 1.5 1.5v11c0 2-1.5 4-3.5 4h-9c-2 0-3.5-2-3.5-4V5c0-.8.7-1.5 1.5-1.5z" fill="#6D28D9" stroke="#4C1D95" strokeWidth="0.9" />
              <rect x="6.8" y="5" width="10.4" height="8" rx="0.8" fill="#1E1B4B" />
              <circle cx="8" cy="8" r="0.5" fill="#EF4444" />
              <rect x="9.2" y="5.8" width="6.8" height="6" rx="0.4" fill="#047857" opacity="0.75" />
              <circle cx="10" cy="12.3" r="0.25" fill="#3B82F6" />
              <circle cx="10.8" cy="12.3" r="0.25" fill="#FACC15" />
              <circle cx="11.6" cy="12.3" r="0.25" fill="#EF4444" />
              <circle cx="12.4" cy="12.3" r="0.25" fill="#10B981" />
              <circle cx="13.2" cy="12.3" r="0.25" fill="#A855F7" />
              <path d="M6.8 15h.7v-.7h.7v.7h.7v.7h-.7v.7h-.7v-.7h-.7z" fill="#111827" />
              <circle cx="15" cy="16" r="1" fill="#DB2777" />
              <circle cx="17.2" cy="14.8" r="1" fill="#DB2777" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // GAME BOY ADVANCE (GBA Indigo Horizontal)
    // ==========================================
    case "gba":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              <path d="M3 8c1-1 3.5-1.5 5.5-1.5h7c2 0 4.5.5 5.5 1.5 1.5 1.5 1.5 6 0 7.5-1 1-3.5 1.5-5.5 1.5h-7c-2 0-4.5-.5-5.5-1.5-1.5-1.5-1.5-6 0-7.5z" fill="none" stroke={fill} strokeWidth="1.4" />
              <rect x="7" y="8.5" width="10" height="7" rx="0.8" fill={fill} opacity="0.35" />
              <path d="M4.5 11.5h.8v-.8h.8v.8h.8v.8h-.8v.8h-.8v-.8h-.8z" />
              <circle cx="18.2" cy="11.3" r="0.8" />
              <circle cx="19.4" cy="12.5" r="0.8" />
            </g>
          ) : (
            <g>
              <path d="M5 6.5h3.5v1.5H5z" fill="#CBD5E1" />
              <path d="M15.5 6.5H19v1.5h-3.5z" fill="#CBD5E1" />
              <path
                d="M3 8c1-1 3.5-1.5 5.5-1.5h7c2 0 4.5.5 5.5 1.5 1.5 1.5 1.5 6 0 7.5-1 1-3.5 1.5-5.5 1.5h-7c-2 0-4.5-.5-5.5-1.5-1.5-1.5-1.5-6 0-7.5z"
                fill="#4338CA"
                stroke="#312E81"
                strokeWidth="1"
              />
              <rect x="6.8" y="8" width="10.4" height="7.8" rx="0.8" fill="#1F2937" />
              <rect x="7.4" y="8.6" width="9.2" height="6.6" rx="0.4" fill="#1E1B4B" />
              <polygon points="7.8,9 13,9 10,13 7.8,13" fill="#312E81" opacity="0.5" />
              <path d="M4.2 11.6h.6v-.6h.6v.6h.6v.6h-.6v.6h-.6v-.6h-.6z" fill="#111827" />
              <circle cx="18.4" cy="11.2" r="0.9" fill="#0D9488" stroke="#115E59" strokeWidth="0.4" />
              <circle cx="19.6" cy="12.6" r="0.9" fill="#0D9488" stroke="#115E59" strokeWidth="0.4" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // NINTENDO DS (Dual Screen Clamshell)
    // ==========================================
    case "nds":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="3.5" width="16" height="7.5" rx="1.5" />
              <rect x="6.5" y="4.8" width="11" height="5" rx="0.5" fill={fill} opacity="0.35" />
              <line x1="7" y1="11.5" x2="17" y2="11.5" strokeWidth="1" />
              <rect x="4" y="12" width="16" height="8.5" rx="1.5" />
              <rect x="7.5" y="13.2" width="9" height="5.5" rx="0.5" fill={fill} opacity="0.35" />
            </g>
          ) : (
            <g>
              <rect x="4" y="3.2" width="16" height="7.8" rx="1.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.9" />
              <rect x="6.8" y="4.4" width="10.4" height="5.4" rx="0.4" fill="#0F172A" />
              <circle cx="5.5" cy="7.2" r="0.3" fill="#94A3B8" />
              <circle cx="18.5" cy="7.2" r="0.3" fill="#94A3B8" />
              <rect x="6.5" y="11" width="11" height="1.4" rx="0.6" fill="#CBD5E1" />
              <rect x="4" y="12.2" width="16" height="8.6" rx="1.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.9" />
              <rect x="7.4" y="13.2" width="9.2" height="5.8" rx="0.4" fill="#1E293B" stroke="#475569" strokeWidth="0.5" />
              <path d="M5.2 15.5h.4v-.4h.4v.4h.4v.4h-.4v.4h-.4v-.4h-.4z" fill="#475569" />
              <circle cx="18.2" cy="15.8" r="0.5" fill="#3B82F6" />
              <circle cx="18.8" cy="16.4" r="0.5" fill="#EF4444" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // NINTENDO 3DS (Circle Pad & Wide 3D Screen)
    // ==========================================
    case "3ds":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3.5" y="3.5" width="17" height="7.5" rx="1.5" />
              <rect x="5.5" y="4.8" width="13" height="5" rx="0.5" fill={fill} opacity="0.35" />
              <line x1="7" y1="11.5" x2="17" y2="11.5" strokeWidth="1" />
              <rect x="4.5" y="12" width="15" height="8.5" rx="1.5" />
              <rect x="7.5" y="13.2" width="9" height="5.5" rx="0.5" fill={fill} opacity="0.35" />
              <circle cx="6" cy="14.5" r="1" fill={fill} />
            </g>
          ) : (
            <g>
              <rect x="3.5" y="3.2" width="17" height="7.8" rx="1.5" fill="#DC2626" stroke="#991B1B" strokeWidth="0.9" />
              <rect x="5.2" y="4.4" width="13.6" height="5.4" rx="0.4" fill="#0B0F19" />
              <line x1="19.2" y1="5.2" x2="19.2" y2="8.8" stroke="#FBBF24" strokeWidth="0.6" strokeLinecap="round" />
              <rect x="6.5" y="11" width="11" height="1.4" rx="0.6" fill="#991B1B" />
              <rect x="4.5" y="12.2" width="15" height="8.6" rx="1.5" fill="#DC2626" stroke="#991B1B" strokeWidth="0.9" />
              <rect x="7.5" y="13.2" width="9" height="5.8" rx="0.4" fill="#1E293B" stroke="#475569" strokeWidth="0.5" />
              <circle cx="6" cy="14.2" r="1.1" fill="#9CA3AF" stroke="#D1D5DB" strokeWidth="0.4" />
              <path d="M5.6 17.2h.3v-.3h.3v.3h.3v.3h-.3v.3h-.3v-.3h-.3z" fill="#111827" />
              <circle cx="18" cy="14.2" r="0.5" fill="#3B82F6" />
              <circle cx="18.8" cy="15" r="0.5" fill="#EF4444" />
              <rect x="11.2" y="19.4" width="1.6" height="0.6" rx="0.2" fill="#E2E8F0" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // VIRTUAL BOY (Red/Black Stereoscopic Visor)
    // ==========================================
    case "virtualboy":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="6" width="18" height="9" rx="2" />
              <rect x="5.5" y="8" width="5" height="5" rx="1" fill={fill} opacity="0.35" />
              <rect x="13.5" y="8" width="5" height="5" rx="1" fill={fill} opacity="0.35" />
              <line x1="12" y1="15" x2="12" y2="21" />
              <line x1="12" y1="18" x2="7" y2="21" />
              <line x1="12" y1="18" x2="17" y2="21" />
            </g>
          ) : (
            <g>
              <rect x="3" y="6" width="18" height="9" rx="2" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
              <rect x="5" y="7.5" width="5.8" height="6" rx="1" fill="#111827" />
              <rect x="13.2" y="7.5" width="5.8" height="6" rx="1" fill="#111827" />
              <ellipse cx="7.9" cy="10.5" rx="1.8" ry="1.5" fill="#EF4444" opacity="0.75" />
              <ellipse cx="16.1" cy="10.5" rx="1.8" ry="1.5" fill="#EF4444" opacity="0.75" />
              <line x1="12" y1="15" x2="12" y2="21" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="12" y1="17.5" x2="6" y2="21.5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
              <line x1="12" y1="17.5" x2="18" y2="21.5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // SEGA MASTER SYSTEM (Grid Matrix & 1/2 Buttons)
    // ==========================================
    case "mastersystem":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="6.5" width="19" height="11" rx="1.5" />
              <circle cx="7" cy="12" r="2.2" />
              <rect x="14" y="10.5" width="2" height="3" fill={fill} />
              <rect x="17.5" y="10.5" width="2" height="3" fill={fill} />
            </g>
          ) : (
            <g>
              <rect x="2.5" y="6.5" width="19" height="11" rx="1.5" fill="#181A20" stroke="#333" strokeWidth="1" />
              <line x1="3" y1="9.5" x2="21" y2="9.5" stroke="#EF4444" strokeWidth="0.4" opacity="0.6" />
              <line x1="3" y1="12" x2="21" y2="12" stroke="#EF4444" strokeWidth="0.4" opacity="0.6" />
              <line x1="3" y1="14.5" x2="21" y2="14.5" stroke="#EF4444" strokeWidth="0.4" opacity="0.6" />
              <line x1="12" y1="7" x2="12" y2="17" stroke="#EF4444" strokeWidth="0.4" opacity="0.6" />
              <line x1="13.5" y1="7" x2="13.5" y2="17" stroke="#EF4444" strokeWidth="0.4" opacity="0.6" />
              <rect x="5" y="10" width="4" height="4" rx="0.5" fill="#0B0D12" />
              <path d="M5.8 12h2.4M7 10.8v2.4" stroke="#475569" strokeWidth="0.8" />
              <circle cx="7" cy="12" r="0.6" fill="#222" />
              <rect x="14.5" y="10.2" width="2.2" height="3.6" rx="0.4" fill="#EF4444" stroke="#991B1B" strokeWidth="0.4" />
              <rect x="17.8" y="10.2" width="2.2" height="3.6" rx="0.4" fill="#EF4444" stroke="#991B1B" strokeWidth="0.4" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // SEGA GENESIS / MEGA DRIVE (3-Button Crescent)
    // ==========================================
    case "genesis":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 8c-3 1.5-4 4.5-3 7.5.8 2.2 3.2 3.5 5.5 3 2.5-.5 4.5-2.5 4.5-2.5s2 2 4.5 2.5c2.3.5 4.7-.8 5.5-3 1-3 0-6-3-7.5-3.5-1.8-10.5-1.8-14 0z" />
              <circle cx="6.5" cy="12.5" r="2.2" fill={fill} opacity="0.35" />
              <circle cx="15.5" cy="13.8" r="0.8" fill={fill} />
              <circle cx="17.2" cy="12.8" r="0.8" fill={fill} />
              <circle cx="18.8" cy="11.6" r="0.8" fill={fill} />
            </g>
          ) : (
            <g>
              <path
                d="M5 8c-3 1.5-4 4.5-3 7.5.8 2.2 3.2 3.5 5.5 3 2.5-.5 4.5-2.5 4.5-2.5s2 2 4.5 2.5c2.3.5 4.7-.8 5.5-3 1-3 0-6-3-7.5-3.5-1.8-10.5-1.8-14 0z"
                fill="#181A20"
                stroke="#334155"
                strokeWidth="1"
              />
              <circle cx="6.5" cy="12.5" r="2.5" fill="#0B0D12" stroke="#475569" strokeWidth="0.5" />
              <path d="M5.2 12.5h2.6M6.5 11.2v2.6" stroke="#94A3B8" strokeWidth="0.8" />
              <rect x="11.2" y="9.8" width="1.6" height="0.8" rx="0.4" fill="#F8FAFC" />
              <circle cx="15.2" cy="13.8" r="1" fill="#334155" stroke="#64748B" strokeWidth="0.5" />
              <circle cx="17.2" cy="12.6" r="1" fill="#334155" stroke="#64748B" strokeWidth="0.5" />
              <circle cx="19" cy="11.2" r="1" fill="#334155" stroke="#64748B" strokeWidth="0.5" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // SEGA GAME GEAR (Color Handheld)
    // ==========================================
    case "gamegear":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="3" />
              <rect x="7.5" y="8" width="9" height="7.5" rx="0.5" fill={fill} opacity="0.35" />
              <circle cx="4.8" cy="12" r="1.5" />
              <circle cx="18.5" cy="11" r="0.8" fill={fill} />
              <circle cx="19.5" cy="13" r="0.8" fill={fill} />
            </g>
          ) : (
            <g>
              <rect x="2" y="6" width="20" height="12" rx="3.5" fill="#1C1E24" stroke="#374151" strokeWidth="1" />
              <rect x="7.5" y="7.8" width="9" height="8" rx="0.8" fill="#0B0F19" stroke="#334155" strokeWidth="0.6" />
              <rect x="8.2" y="8.5" width="7.6" height="6.6" rx="0.4" fill="#0369A1" opacity="0.6" />
              <line x1="6.5" y1="8" x2="6.5" y2="10" stroke="#2563EB" strokeWidth="0.7" />
              <line x1="6.5" y1="10" x2="6.5" y2="12.5" stroke="#FACC15" strokeWidth="0.7" />
              <line x1="6.5" y1="12.5" x2="6.5" y2="15" stroke="#EF4444" strokeWidth="0.7" />
              <path d="M4.2 12h.6v-.6h.6v.6h.6v.6h-.6v.6h-.6v-.6h-.6z" fill="#475569" />
              <circle cx="18.5" cy="11" r="0.9" fill="#10B981" />
              <circle cx="19.6" cy="13" r="0.9" fill="#EF4444" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // SEGA SATURN (Round 6-Button Controller)
    // ==========================================
    case "saturn":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 7c-3 0-5 3-4 8 1 3 3 4 5 3.5 2-.5 3-2 5-2s3 1.5 5 2c2 .5 4-.5 5-3.5 1-5-1-8-4-8-3 0-4.5 1-7 1s-4-1-7-1z" />
              <circle cx="6.5" cy="12.5" r="2.2" />
              <circle cx="15.5" cy="11" r="0.6" fill={fill} />
              <circle cx="17.2" cy="11" r="0.6" fill={fill} />
              <circle cx="18.8" cy="11" r="0.6" fill={fill} />
              <circle cx="15.5" cy="13.2" r="0.8" fill={fill} />
              <circle cx="17.2" cy="13.2" r="0.8" fill={fill} />
              <circle cx="18.8" cy="13.2" r="0.8" fill={fill} />
            </g>
          ) : (
            <g>
              <path
                d="M6 7c-3 0-5 3-4 8 1 3 3 4 5 3.5 2-.5 3-2 5-2s3 1.5 5 2c2 .5 4-.5 5-3.5 1-5-1-8-4-8-3 0-4.5 1-7 1s-4-1-7-1z"
                fill="#181A20"
                stroke="#334155"
                strokeWidth="1"
              />
              <circle cx="6.5" cy="12.5" r="2.4" fill="#334155" stroke="#64748B" strokeWidth="0.5" />
              <path d="M5.2 12.5h2.6M6.5 11.2v2.6" stroke="#94A3B8" strokeWidth="0.8" />
              <ellipse cx="12" cy="11.5" rx="1" ry="0.6" fill="#334155" />
              <circle cx="15.2" cy="10.8" r="0.7" fill="#64748B" />
              <circle cx="17" cy="10.8" r="0.7" fill="#64748B" />
              <circle cx="18.8" cy="10.8" r="0.7" fill="#64748B" />
              <circle cx="15.2" cy="13.2" r="1" fill="#3B82F6" />
              <circle cx="17.2" cy="13.2" r="1" fill="#FACC15" />
              <circle cx="19.2" cy="13.2" r="1" fill="#10B981" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // SEGA DREAMCAST (White Controller & VMU Window)
    // ==========================================
    case "dreamcast":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 6c-2 0-3 2-2.5 8 .5 4 2 5 3.5 5 1.5 0 2.5-3 5-3s3.5 3 5 3c1.5 0 3-1 3.5-5 .5-6-.5-8-2.5-8-2.5 0-4 1.5-6 1.5S8.5 6 6 6z" />
              <polygon points="10,6.5 14,6.5 13.5,9.5 10.5,9.5" fill={fill} opacity="0.35" />
              <circle cx="6.5" cy="11" r="1.5" />
              <circle cx="17" cy="11" r="0.8" fill={fill} />
            </g>
          ) : (
            <g>
              <path
                d="M6 6c-2 0-3 2-2.5 8 .5 4 2 5 3.5 5 1.5 0 2.5-3 5-3s3.5 3 5 3c1.5 0 3-1 3.5-5 .5-6-.5-8-2.5-8-2.5 0-4 1.5-6 1.5S8.5 6 6 6z"
                fill="#EEF1F6"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
              <polygon points="10,6.2 14,6.2 13.5,9.8 10.5,9.8" fill="#1E293B" stroke="#94A3B8" strokeWidth="0.4" />
              <rect x="11" y="7" width="2" height="1.8" fill="#38BDF8" opacity="0.75" />
              <circle cx="6.5" cy="10.8" r="1.8" fill="#94A3B8" stroke="#CBD5E1" strokeWidth="0.5" />
              <path d="M6.2 14.2h.6v-.6h.6v.6h.6v.6h-.6v.6h-.6v-.6h-.6z" fill="#475569" />
              <polygon points="12,11.5 13,13 11,13" fill="#EA580C" />
              <circle cx="17" cy="9.6" r="0.8" fill="#FACC15" />
              <circle cx="15.6" cy="11" r="0.8" fill="#3B82F6" />
              <circle cx="18.4" cy="11" r="0.8" fill="#EF4444" />
              <circle cx="17" cy="12.4" r="0.8" fill="#10B981" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // ORIGINAL XBOX (Iconic Carved Green X Jewel)
    // ==========================================
    case "xbox":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill={fill}>
              <circle cx="12" cy="12" r="9.5" fill="none" stroke={fill} strokeWidth="1.5" />
              <path d="M6.5 5.5L10 12l-3.5 6.5h2.5L12 13.5l3 5h2.5L14 12l3.5-6.5H15L12 10.5 9 5.5H6.5z" />
            </g>
          ) : (
            <g>
              <circle cx="12" cy="12" r="9.5" fill="#0A180A" stroke="#107C10" strokeWidth="1.5" />
              <path d="M6.5 5.5L10 12l-3.5 6.5h2.5L12 13.5l3 5h2.5L14 12l3.5-6.5H15L12 10.5 9 5.5H6.5z" fill="#107C10" />
              <polygon points="12,10.5 13.5,12 12,13.5 10.5,12" fill="#52E252" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // XBOX 360 (Wireless Controller & Green Guide Ring)
    // ==========================================
    case "xbox360":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 7c-3 0-4.5 3-3.5 8 1 4 2.5 5 4 4 1.5-1 2-4 2-5h7c0 1 .5 4 2 5s3 0 4-4c1-5-.5-8-3.5-8-2 0-3.5 1.5-6 1.5S8 7 6 7z" />
              <circle cx="12" cy="10" r="1.8" fill={fill} />
              <circle cx="6.5" cy="10.5" r="1.5" />
              <circle cx="15.5" cy="14" r="1.5" />
            </g>
          ) : (
            <g>
              <path
                d="M6 6.8c-3 0-4.5 3-3.5 8 1 4 2.5 5 4 4 1.5-1 2-4 2-5h7c0 1 .5 4 2 5s3 0 4-4c1-5-.5-8-3.5-8-2 0-3.5 1.5-6 1.5S8 6.8 6 6.8z"
                fill="#F8FAFC"
                stroke="#CBD5E1"
                strokeWidth="1"
              />
              <circle cx="12" cy="10" r="1.8" fill="#1E293B" stroke="#94A3B8" strokeWidth="0.4" />
              <path d="M11 9l2 2m-2 0l2-2" stroke="#22C55E" strokeWidth="0.8" strokeLinecap="round" />
              <circle cx="6.5" cy="10.5" r="1.8" fill="#475569" stroke="#94A3B8" strokeWidth="0.5" />
              <path d="M6 14.5h.5v-.5h.5v.5h.5v.5h-.5v.5h-.5v-.5h-.5z" fill="#334155" />
              <circle cx="15" cy="14" r="1.8" fill="#475569" stroke="#94A3B8" strokeWidth="0.5" />
              <circle cx="17.5" cy="9.2" r="0.7" fill="#FACC15" />
              <circle cx="16.3" cy="10.4" r="0.7" fill="#3B82F6" />
              <circle cx="18.7" cy="10.4" r="0.7" fill="#EF4444" />
              <circle cx="17.5" cy="11.6" r="0.7" fill="#22C55E" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // XBOX ONE (Sleek Modern Controller)
    // ==========================================
    case "xboxone":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5.5 6.5c-2.5 0-4 2.5-3 7.5.8 4 2.5 5 4 4 1.5-1 2.5-4 2.5-5h6c0 1 1 4 2.5 5s3.2 0 4-4c1-5-.5-7.5-3-7.5-2.5 0-3.5 1-6 1s-3.5-1-6-1z" />
              <circle cx="12" cy="8" r="1.2" fill={fill} />
              <circle cx="6.5" cy="10.5" r="1.5" />
              <circle cx="15.5" cy="14" r="1.5" />
            </g>
          ) : (
            <g>
              <path
                d="M5.5 6.5c-2.5 0-4 2.5-3 7.5.8 4 2.5 5 4 4 1.5-1 2.5-4 2.5-5h6c0 1 1 4 2.5 5s3.2 0 4-4c1-5-.5-7.5-3-7.5-2.5 0-3.5 1-6 1s-3.5-1-6-1z"
                fill="#181A20"
                stroke="#334155"
                strokeWidth="1"
              />
              <circle cx="12" cy="8" r="1.3" fill="#FFFFFF" />
              <path d="M11.3 7.3l1.4 1.4m-1.4 0l1.4-1.4" stroke="#000" strokeWidth="0.5" />
              <circle cx="6.5" cy="10.5" r="1.8" fill="#334155" stroke="#475569" strokeWidth="0.5" />
              <circle cx="15" cy="14" r="1.8" fill="#334155" stroke="#475569" strokeWidth="0.5" />
              <path d="M6 14.5h.5v-.5h.5v.5h.5v.5h-.5v.5h-.5v-.5h-.5z" fill="#475569" />
              <circle cx="17.5" cy="9.2" r="0.7" fill="#FACC15" />
              <circle cx="16.3" cy="10.4" r="0.7" fill="#3B82F6" />
              <circle cx="18.7" cy="10.4" r="0.7" fill="#EF4444" />
              <circle cx="17.5" cy="11.6" r="0.7" fill="#22C55E" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // XBOX SERIES X/S (Monolithic Tower & Green Vent)
    // ==========================================
    case "xboxseries":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="6.5" y="3.5" width="11" height="17" rx="1.5" />
              <line x1="8" y1="6" x2="16" y2="6" strokeWidth="2" />
              <circle cx="9" cy="9" r="0.8" fill={fill} />
              <line x1="9" y1="12" x2="9" y2="16" strokeWidth="1.2" />
            </g>
          ) : (
            <g>
              <rect x="6.5" y="3.5" width="11" height="17" rx="1.5" fill="#11141A" stroke="#262D3D" strokeWidth="1" />
              <ellipse cx="12" cy="4.5" rx="4.5" ry="1.2" fill="#10B981" opacity="0.8" />
              <circle cx="12" cy="4.5" r="0.8" fill="#047857" />
              <circle cx="8.8" cy="8.5" r="0.9" fill="#FFFFFF" />
              <path d="M8.3 8l1 1m-1 0l1-1" stroke="#000" strokeWidth="0.4" />
              <line x1="8.8" y1="12.5" x2="8.8" y2="17.5" stroke="#000" strokeWidth="0.8" strokeLinecap="round" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // ATARI 2600 (CX40 Joystick & Red Fire Button)
    // ==========================================
    case "atari":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="9" width="16" height="12" rx="2" />
              <line x1="12" y1="9" x2="12" y2="3" strokeWidth="2.5" />
              <circle cx="12" cy="2.5" r="1.5" fill={fill} />
              <circle cx="6.5" cy="11.5" r="1.2" fill={fill} />
            </g>
          ) : (
            <g>
              <rect x="4" y="9" width="16" height="12" rx="2" fill="#181B20" stroke="#334155" strokeWidth="1" />
              <rect x="5.5" y="18" width="13" height="1.8" rx="0.4" fill="#B45309" />
              <rect x="6" y="10.5" width="2.4" height="2.4" rx="0.5" fill="#EF4444" stroke="#B91C1C" strokeWidth="0.5" />
              <ellipse cx="12" cy="10" rx="3" ry="1.2" fill="#334155" />
              <ellipse cx="12" cy="8.8" rx="2.2" ry="0.9" fill="#475569" />
              <line x1="12" y1="8.8" x2="12" y2="3" stroke="#111827" strokeWidth="2.8" strokeLinecap="round" />
              <circle cx="12" cy="2.8" r="1.6" fill="#1F2937" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // NEO GEO AES / MVS (Arcade Stick & Rainbow Buttons)
    // ==========================================
    case "neogeo":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2.5" y="6" width="19" height="12" rx="2" />
              <line x1="7.5" y1="12" x2="7.5" y2="8" strokeWidth="2" />
              <circle cx="7.5" cy="7" r="1.5" fill={fill} />
              <circle cx="13" cy="13" r="1" fill={fill} />
              <circle cx="15" cy="11.5" r="1" fill={fill} />
              <circle cx="17" cy="11" r="1" fill={fill} />
              <circle cx="19" cy="11.5" r="1" fill={fill} />
            </g>
          ) : (
            <g>
              <rect x="2.5" y="6" width="19" height="12" rx="2" fill="#181B20" stroke="#475569" strokeWidth="1" />
              <circle cx="7.5" cy="12" r="2.2" fill="#334155" />
              <line x1="7.5" y1="12" x2="7.5" y2="8" stroke="#CBD5E1" strokeWidth="1.8" />
              <circle cx="7.5" cy="7" r="1.8" fill="#EF4444" stroke="#991B1B" strokeWidth="0.5" />
              <circle cx="13" cy="13.2" r="1.2" fill="#EF4444" stroke="#B91C1C" strokeWidth="0.4" />
              <circle cx="15" cy="11.6" r="1.2" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.4" />
              <circle cx="17" cy="11" r="1.2" fill="#10B981" stroke="#047857" strokeWidth="0.4" />
              <circle cx="19" cy="11.6" r="1.2" fill="#3B82F6" stroke="#1D4ED8" strokeWidth="0.4" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // PC ENGINE / TURBOGRAFX-16 (White Controller & Turbo Switches)
    // ==========================================
    case "pce":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="7" width="18" height="10" rx="1.5" />
              <circle cx="7" cy="12" r="2" />
              <line x1="14" y1="10" x2="18" y2="10" strokeWidth="1.5" />
              <circle cx="15" cy="13.5" r="1" fill={fill} />
              <circle cx="17.5" cy="13.5" r="1" fill={fill} />
            </g>
          ) : (
            <g>
              <rect x="3" y="6.8" width="18" height="10.4" rx="1.5" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
              <rect x="3" y="7" width="18" height="1.6" rx="0.5" fill="#F97316" />
              <circle cx="7" cy="12" r="2.2" fill="#0F172A" />
              <path d="M5.8 12h2.4M7 10.8v2.4" stroke="#64748B" strokeWidth="0.8" />
              <rect x="14" y="9.6" width="1.8" height="1.2" rx="0.3" fill="#64748B" />
              <rect x="16.5" y="9.6" width="1.8" height="1.2" rx="0.3" fill="#64748B" />
              <circle cx="14.8" cy="13.2" r="1.1" fill="#EF4444" stroke="#991B1B" strokeWidth="0.4" />
              <circle cx="17.4" cy="13.2" r="1.1" fill="#EF4444" stroke="#991B1B" strokeWidth="0.4" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // STEAM DECK / HANDHELD PC
    // ==========================================
    case "steamdeck":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 7.5L5 6h14l2.5 1.5v9L19 18H5l-2.5-1.5v-9z" />
              <rect x="6.8" y="7.5" width="10.4" height="9" rx="0.6" fill={fill} opacity="0.35" />
              <circle cx="4.5" cy="8.8" r="1" fill={fill} />
              <circle cx="19.5" cy="8.8" r="1" fill={fill} />
              <rect x="3.8" y="11.5" width="1.8" height="1.8" rx="0.3" />
              <rect x="18.4" y="11.5" width="1.8" height="1.8" rx="0.3" />
            </g>
          ) : (
            <g>
              <path d="M2.5 7.5L5 6h14l2.5 1.5v9L19 18H5l-2.5-1.5v-9z" fill="#181B22" stroke="#334155" strokeWidth="1" />
              <rect x="6.5" y="7.2" width="11" height="9.6" rx="0.8" fill="#0B0F19" stroke="#1E293B" strokeWidth="0.6" />
              <rect x="7" y="7.8" width="10" height="4" fill="#1E3A8A" opacity="0.3" />
              <circle cx="4.5" cy="8.8" r="1.2" fill="#475569" stroke="#94A3B8" strokeWidth="0.4" />
              <circle cx="19.5" cy="8.8" r="1.2" fill="#475569" stroke="#94A3B8" strokeWidth="0.4" />
              <rect x="3.6" y="11.2" width="2" height="2" rx="0.4" fill="#0B0F19" stroke="#475569" strokeWidth="0.4" />
              <rect x="18.4" y="11.2" width="2" height="2" rx="0.4" fill="#0B0F19" stroke="#475569" strokeWidth="0.4" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // RETROARCH (Space Invader Retropad Alien)
    // ==========================================
    case "retroarch":
      return (
        <svg {...commonProps}>
          <g fill={fill}>
            <path d="M6 5h2v2H6zm10 0h2v2h-2zm-6 2h4v2h-4zm-4 2h12v6H6zm2 2h2v2H8zm6 0h2v2h-2zm-4 4h4v2h-4zm-6 0h2v3H4zm14 0h2v3h-2z" />
          </g>
        </svg>
      );

    // ==========================================
    // ARCADE / FLIPERAMA / MAME
    // ==========================================
    case "arcade":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 2.5h16l-2 19H6L4 2.5z" />
              <rect x="6.5" y="4" width="11" height="3" rx="0.5" fill={fill} opacity="0.35" />
              <rect x="6.5" y="8" width="11" height="6.5" rx="0.5" />
              <circle cx="9" cy="16.5" r="1.2" fill={fill} />
            </g>
          ) : (
            <g>
              <path d="M4 2.5h16l-2 19H6L4 2.5z" fill="#181B22" stroke="#334155" strokeWidth="1" />
              <rect x="6" y="4" width="12" height="3" rx="0.5" fill="#00E5FF" opacity="0.9" />
              <text x="7.5" y="6.3" fontSize="2.5" fontWeight="900" fontFamily="sans-serif" fill="#0B0F19">
                ARCADE
              </text>
              <rect x="6.2" y="8" width="11.6" height="6.5" rx="0.6" fill="#0F172A" stroke="#1E293B" strokeWidth="0.5" />
              <polygon points="9,10 11,10 10,13" fill="#EF4444" />
              <circle cx="14" cy="11" r="1" fill="#FACC15" />
              <polygon points="5.5,15 18.5,15 18,17.5 6,17.5" fill="#1E293B" />
              <circle cx="8.5" cy="16.2" r="1.2" fill="#EF4444" />
              <line x1="8.5" y1="16.2" x2="8.5" y2="17.2" stroke="#CBD5E1" strokeWidth="0.8" />
              <circle cx="12.5" cy="16" r="0.6" fill="#3B82F6" />
              <circle cx="14.2" cy="16" r="0.6" fill="#10B981" />
              <circle cx="15.9" cy="16" r="0.6" fill="#FACC15" />
              <rect x="10" y="19" width="4" height="2" rx="0.3" fill="#111827" stroke="#475569" strokeWidth="0.4" />
              <line x1="12" y1="19.4" x2="12" y2="20.4" stroke="#FACC15" strokeWidth="0.5" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // CARTRIDGE (Retro Game Cartridge)
    // ==========================================
    case "cartridge":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 3.5h14v14.5l-2 2.5H7l-2-2.5V3.5z" />
              <rect x="7.5" y="7.5" width="9" height="7.5" rx="0.5" fill={fill} opacity="0.35" />
              <line x1="8" y1="18.5" x2="16" y2="18.5" strokeWidth="1.5" />
            </g>
          ) : (
            <g>
              <path d="M5 3.5h14v14.5l-2 2.5H7l-2-2.5V3.5z" fill="#9CA3AF" stroke="#6B7280" strokeWidth="1" />
              <line x1="7" y1="5" x2="17" y2="5" stroke="#6B7280" strokeWidth="0.8" />
              <line x1="7" y1="6.5" x2="17" y2="6.5" stroke="#6B7280" strokeWidth="0.8" />
              <rect x="7" y="8" width="10" height="8" rx="0.5" fill="#EF4444" stroke="#1F2937" strokeWidth="0.5" />
              <rect x="8" y="9" width="8" height="3" fill="#FACC15" />
              <line x1="8" y1="18.8" x2="16" y2="18.8" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          )}
        </svg>
      );

    // ==========================================
    // SD / MEMORY CARD
    // ==========================================
    case "sdcard":
      return (
        <svg {...commonProps}>
          {monochrome ? (
            <g fill="none" stroke={fill} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 4h10l4 4v12H5V4z" />
              <rect x="8" y="8" width="6" height="7" rx="0.5" fill={fill} opacity="0.35" />
            </g>
          ) : (
            <g>
              <path d="M5 3.5h10.5l4.5 4.5V20.5H5V3.5z" fill="#1E293B" stroke="#475569" strokeWidth="1" />
              <rect x="7" y="8" width="8.5" height="8" rx="0.5" fill="#2563EB" />
              <line x1="7" y1="5" x2="7" y2="6.5" stroke="#FACC15" strokeWidth="0.8" />
              <line x1="9" y1="5" x2="9" y2="6.5" stroke="#FACC15" strokeWidth="0.8" />
              <line x1="11" y1="5" x2="11" y2="6.5" stroke="#FACC15" strokeWidth="0.8" />
              <line x1="13" y1="5" x2="13" y2="6.5" stroke="#FACC15" strokeWidth="0.8" />
            </g>
          )}
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

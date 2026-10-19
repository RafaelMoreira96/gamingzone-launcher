export interface Platform {
  id: string;
  name: string;
  short_name: string;
  brand_color: string;
  badge_bg: string;
  icon_name: string;
  description: string;
  is_enabled: boolean;
  is_custom: boolean;
}

export type PlayStatusType = 'playing' | 'completed' | 'backlog' | 'paused';

export interface Game {
  id: string;
  title: string;
  original_platform_id: string;
  platform_name?: string;
  platform_brand_color?: string;
  executable_path: string;
  working_dir: string;
  launch_arguments: string;
  cover_url?: string;
  banner_url?: string;
  total_playtime_seconds: number;
  last_played_at?: string;
  created_at: string;
  notes?: string;
  is_running: boolean;
  is_emulator?: boolean;
  emulator_path?: string;
  rom_path?: string;
  is_favorite?: boolean;
  play_status?: PlayStatusType;
  save_path?: string;
}

export interface SaveBackup {
  id: string;
  game_id: string;
  backup_path: string;
  file_count: number;
  size_bytes: number;
  created_at: string;
  note: string;
}

export interface PlaySession {
  id: string;
  game_id: string;
  started_at: string;
  ended_at?: string;
  duration_seconds: number;
}

export interface GameDetails {
  game: Game;
  sessions: PlaySession[];
}

export type ThemeType =
  | 'midnight'
  | 'cyber-violet'
  | 'emerald'
  | 'crimson'
  | 'high-contrast'
  | 'retro-arcade'
  | 'cyberpunk'
  | 'synthwave'
  | 'playstation'
  | 'gameboy'
  | 'famicom'
  | 'pipboy';

export type FontFamilyType =
  | 'auto'
  | 'plus-jakarta'
  | 'orbitron'
  | 'silkscreen'
  | 'press-start'
  | 'rajdhani'
  | 'righteous'
  | 'share-tech'
  | 'outfit'
  | 'cinzel'
  | 'jetbrains';

export type FontSizeType = 'small' | 'medium' | 'large' | 'xlarge';
export type CardSizeType = 'compact' | 'normal' | 'spacious';
export type ControllerPromptType = 'xbox' | 'playstation' | 'nintendo';
export type BigPictureTheme = 'steam' | 'xbox' | 'playstation' | 'nintendo';
export type CardBadgePreference = 'auto' | 'platform' | 'recomp';

export interface AppSettings {
  theme: ThemeType;
  fontFamily?: FontFamilyType;
  fontSize: FontSizeType;
  cardSize: CardSizeType;
  reduceMotion: boolean;
  disableGlassmorphism: boolean;
  discordRpcEnabled: boolean;
  discordClientId?: string;
  steamGridDbApiKey?: string;
  igdbApiKey?: string;
  igdbClientId?: string;
  igdbClientSecret?: string;
  raUsername?: string;
  raApiKey?: string;
  raHardcoreMode?: boolean;
  startInBigPicture?: boolean;
  controllerType?: ControllerPromptType;
  bigPictureTheme?: BigPictureTheme;
  cardBadgePreference?: CardBadgePreference;
  ambientMusicEnabled?: boolean;
  ambientMusicVolume?: number;
}

export interface IgdbGameMetadata {
  id: number;
  name: string;
  summary?: string;
  storyline?: string;
  release_year?: number;
  cover_url?: string;
  banner_url?: string;
  platforms: string[];
  genres: string[];
  rating?: number;
}

export interface RaUserProfile {
  user: string;
  points: number;
  softcore_points: number;
  total_true_points: number;
  rank: number;
  total_ranked: number;
  user_pic: string;
  motto?: string;
}

export interface RaAchievement {
  id: number;
  title: string;
  description: string;
  points: number;
  badge_url: string;
  is_unlocked: boolean;
  date_unlocked?: string;
  hardcore: boolean;
  achievement_type?: string;
}

export interface RaGameProgress {
  game_id: number;
  game_title: string;
  console_name: string;
  total_achievements: number;
  unlocked_achievements: number;
  total_points: number;
  unlocked_points: number;
  completion_percentage: number;
  achievements: RaAchievement[];
  highest_award_kind?: string | null;
  highest_award_date?: string | null;
  beaten_date?: string | null;
  is_beaten?: boolean;
  is_mastered?: boolean;
  win_conditions_total?: number;
  win_conditions_unlocked?: number;
  unlocked_hardcore_count?: number;
  is_hardcore?: boolean;
  award_mode?: string | null;
}

export interface RaUserGame {
  game_id: number;
  title: string;
  console_name: string;
  console_id?: number;
  image_icon?: string;
  image_title?: string;
  image_box_art?: string;
  num_achieved: number;
  num_achieved_hardcore?: number;
  num_possible_achievements: number;
  possible_score: number;
  score_achieved: number;
  score_achieved_hardcore?: number;
  last_played?: string;
  highest_award_kind?: string | null;
  highest_award_date?: string | null;
  beaten_date?: string | null;
  is_beaten?: boolean;
  is_mastered?: boolean;
  is_hardcore?: boolean;
  award_mode?: string | null;
}

export interface ScrapedAsset {
  title: string;
  cover_url?: string;
  banner_url?: string;
  source: string;
  platform_hint?: string;
}

export interface ScrapeResult {
  query: string;
  assets: ScrapedAsset[];
}

export interface GameAnalyticsItem {
  game_id: string;
  title: string;
  cover_url?: string;
  platform_name: string;
  platform_color: string;
  original_platform_id: string;
  total_seconds: number;
  session_count: number;
  percentage: number;
}

export interface PlatformAnalyticsItem {
  platform_id: string;
  name: string;
  color: string;
  total_seconds: number;
  game_count: number;
  percentage: number;
}

export interface MonthlyPlaytime {
  month: number;
  month_name: string;
  total_seconds: number;
}

export interface SessionDetail {
  id: string;
  game_id: string;
  game_title: string;
  platform_name: string;
  platform_color: string;
  started_at: string;
  duration_seconds: number;
}

export interface GenreAnalyticsItem {
  genre: string;
  total_seconds: number;
  game_count: number;
  percentage: number;
  games: string[];
}

export interface DayOfWeekItem {
  day_index: number;
  day_name: string;
  total_seconds: number;
  session_count: number;
}

export interface TimeOfDayItem {
  period: "madrugada" | "manha" | "tarde" | "noite";
  label: string;
  time_range: string;
  total_seconds: number;
  percentage: number;
}

export interface ReplayAnalytics {
  year: number;
  available_years: number[];
  total_playtime_seconds: number;
  total_sessions_count: number;
  total_games_played: number;
  longest_session_seconds: number;
  longest_session_game?: string;
  top_games: GameAnalyticsItem[];
  platform_distribution: PlatformAnalyticsItem[];
  monthly_breakdown: MonthlyPlaytime[];
  recent_sessions: SessionDetail[];
  genres?: GenreAnalyticsItem[];
}

export type GamingStatisticsData = ReplayAnalytics;

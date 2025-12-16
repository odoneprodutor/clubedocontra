
export enum UserRole {
  DIRECTOR = 'DIRECTOR',
  COACH = 'COACH',
  PLAYER = 'PLAYER',
  REFEREE = 'REFEREE',
  FAN = 'FAN'
}

export enum MatchType {
  FRIENDLY = 'FRIENDLY',
  LEAGUE = 'LEAGUE',
  KNOCKOUT = 'KNOCKOUT'
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED',
  WAITING_ACCEPTANCE = 'WAITING_ACCEPTANCE'
}

export enum SportType {
  FUTSAL = 'FUTSAL',     // 5v5
  FUT6 = 'FUT6',         // 6v6
  FUT7 = 'FUT7',         // 7v7 Society
  FUT8 = 'FUT8',         // 8v8
  AMATEUR = 'AMATEUR',   // 11v11 Field
  PROFESSIONAL = 'PROFESSIONAL' // 11v11 Field
}

export enum MatchEventType {
  GOAL = 'GOAL',
  YELLOW_CARD = 'YELLOW_CARD',
  RED_CARD = 'RED_CARD',
  FOUL = 'FOUL',
  OFFSIDE = 'OFFSIDE',
  CORNER = 'CORNER',
  START = 'START',
  END = 'END'
}

// RBAC & Ownership Base
export interface BaseEntity {
  createdBy: string; // The ID of the Director who created it
  isDeleted: boolean; // Soft Delete flag
}

export interface PlayerStats {
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
}

export interface Player {
  id: string;
  name: string;
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD' | 'Curinga'; // Added Curinga
  stats: PlayerStats;
  userId?: string; // Link to user account
}

export interface PlayerEvaluation {
  id: string;
  playerId: string;
  evaluatorId: string;
  matchId?: string;
  rating: number; // 0-10
  technicalScore?: number;
  tacticalScore?: number;
  physicalScore?: number;
  mentalScore?: number;
  comments?: string;
  createdAt: string;
}

export interface Arena {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  googleMapsUrl?: string; // New: URL link
  profilePicture?: string; // New: Arena thumb
  coverPicture?: string; // New: Arena cover
  city?: string; // Standardized city
}

export interface TacticalPosition {
  playerId: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export interface Team extends BaseEntity {
  id: string;
  name: string;
  shortName: string;
  city: string; // Added for local filter
  logoColor: string; // Kept for backward compat/primary
  primaryColor?: string; // New
  secondaryColor?: string; // New
  tertiaryColor?: string; // New
  profilePicture?: string; // New: Team Logo/Avatar aside from cover
  cover?: string; // New field for profile banner
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  roster: Player[];
  tacticalFormation: TacticalPosition[]; // Default formation
  sportType: SportType; // Added for tactical context
  detailedStats?: Record<string, any>; // JSONB stats
}

export interface Tournament extends BaseEntity {
  id: string;
  name: string;
  format: 'LEAGUE' | 'KNOCKOUT';
  sportType: SportType; // New field
  status: 'ACTIVE' | 'FINISHED';
  currentRound: number;
  totalRounds: number; // Calculated field usually
  maxTeams?: number; // New input field
  participatingTeamIds: string[]; // No ? because we init as []
  city?: string; // Standardized city for filtering
  detailedStats?: Record<string, any>; // JSONB stats
}

export interface MatchEvent {
  id: string;
  type: MatchEventType;
  minute: number;
  teamId?: string;
  playerId?: string;
  playerName?: string; // Cache name for display
  description?: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  teamId?: string; // Which team the fan supports
  text: string;
  timestamp: string;
}

export interface MatchMedia {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string;
  uploadedBy: string; // User Name
  createdAt: string;
}

export interface Match extends BaseEntity {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  status: MatchStatus;
  type: MatchType;
  sportType: SportType; // New field
  arenaId: string;
  homeScore: number;
  awayScore: number;
  round?: string;
  tournamentId?: string;
  events: MatchEvent[];
  chatMessages: ChatMessage[];
  // Per-match tactical setups
  homeTactics?: TacticalPosition[];
  awayTactics?: TacticalPosition[];
  // Streaming & Media
  youtubeVideoId?: string; // Extracted ID for embed
  media: MatchMedia[];
  city?: string; // Standardized city if neutral ground or specific
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  teamId?: string; // For personalized feed
  tournamentId?: string; // For championship specific feed
}

export type AppView = 'HOME' | 'TEAMS' | 'MATCHES' | 'TOURNAMENTS' | 'ARENAS' | 'NEWS' | 'PROFILE';

// Robust Session Object
export interface CurrentUser {
  id: string; // Unique ID for ownership and social graph
  role: UserRole;
  teamId: string | null; // The context the user is logged in as
  name: string; // Simulated user name
  email?: string;
  location?: string; // Added for proximity filter
  avatar?: string;
}

// Authentication Account
export interface UserAccount {
  id: string;
  email: string;
  password: string; // In real app, this would be hashed
  name: string;
  role: UserRole;
  teamId: string | null;
  bio?: string;
  location?: string;
  relatedPlayerId?: string; // Links auth to roster data
  avatar?: string;
  cover?: string;
}

// Social Graph Entities
export interface Notification {
  id: string;
  type: 'TEAM_INVITE' | 'FRIEND_REQUEST' | 'SYSTEM' | 'TOURNAMENT_INVITE';
  fromId: string; // Who sent it (Director ID, etc)
  fromName: string;
  toUserId: string;
  data?: { teamId?: string; teamName?: string; tournamentId?: string; tournamentName?: string };
  isRead: boolean;
  timestamp: string; // Added timestamp
  createdAt?: string;
}

export interface SocialConnection {
  id: string;
  followerId: string;
  targetId: string; // Can be TeamID or UserID
  targetType: 'TEAM' | 'USER';
}


import { Arena, Match, MatchEvent, MatchEventType, MatchStatus, MatchType, NewsItem, Team, Tournament, UserRole, Player, TacticalPosition, Notification, SocialConnection, UserAccount, SportType } from './types';

// Default "Super User" ID for mock data ownership (kept for type safety reference)
export const DEFAULT_DIRECTOR_ID = 'user-dir-1';

// --- CONFIG ---
export const SPORT_TYPE_DETAILS = {
  [SportType.FUTSAL]: { label: 'Futsal', players: 5 },
  [SportType.FUT6]: { label: 'Fut6', players: 6 },
  [SportType.FUT7]: { label: 'Fut7 Society', players: 7 },
  [SportType.FUT8]: { label: 'Fut8', players: 8 },
  [SportType.AMATEUR]: { label: 'Futebol Amador (Campo)', players: 11 },
  [SportType.PROFESSIONAL]: { label: 'Futebol Profissional', players: 11 }
};

// --- DATA GENERATORS ---

// 1. ARENAS
export const INITIAL_ARENAS: Arena[] = [];

// 2. TEAMS
export const INITIAL_TEAMS: Team[] = [];

// 3. USERS (Keep one Director user to allow login/creation of data initially)
export const MOCK_USERS: UserAccount[] = [{
  id: 'user-admin',
  email: 'admin@locallegends.com',
  password: 'admin',
  name: 'Administrador',
  role: UserRole.DIRECTOR,
  teamId: null,
  location: 'São Paulo',
  avatar: 'https://i.pravatar.cc/150?u=admin'
}];

// 4. TOURNAMENTS
export const INITIAL_TOURNAMENTS: Tournament[] = [];

// 5. MATCHES
export const INITIAL_MATCHES: Match[] = [];

// 6. NEWS
export const MOCK_NEWS: NewsItem[] = [];

// 7. SOCIAL
export const INITIAL_NOTIFICATIONS: Notification[] = [];
export const INITIAL_SOCIAL: SocialConnection[] = [];

export const ROLE_DESCRIPTIONS = {
  [UserRole.DIRECTOR]: 'Gerenciar times, agendar jogos e aprovar desafios.',
  [UserRole.COACH]: 'Definir táticas, escalações e treinos.',
  [UserRole.PLAYER]: 'Ver estatísticas pessoais e calendário.',
  [UserRole.REFEREE]: 'Registrar resultados de partidas e súmulas.',
  [UserRole.FAN]: 'Acompanhar tabela, resultados e notícias.'
};

export const SAFE_TEAM: Team = {
  id: 'ghost',
  name: 'Time Desconhecido',
  sportType: SportType.FUT7,
  shortName: '???',
  city: 'Desconhecida',
  logoColor: '#cbd5e1',
  cover: 'https://via.placeholder.com/1200x400',
  wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0,
  roster: [],
  tacticalFormation: [],
  createdBy: '',
  isDeleted: false
};

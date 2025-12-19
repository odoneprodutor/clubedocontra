import { PlayerStats, Team, Trophy } from '../types';

export interface AchievementDefinition {
    id: string;
    name: string;
    description: string;
    category: 'PLAYER' | 'TEAM';
    icon?: string; // Optional icon name
    condition: (stats: any) => boolean;
}

// --- GENERATOR HELPERS ---
const createLevelAchievements = (
    baseId: string,
    baseName: string,
    baseDesc: string,
    category: 'PLAYER' | 'TEAM',
    field: string,
    levels: number[]
): AchievementDefinition[] => {
    return levels.map(level => ({
        id: `${baseId}_${level}`,
        name: `${baseName} ${level} ${level < 10 ? 'Jogos' : ''}`,
        description: baseDesc.replace('X', level.toString()),
        category,
        condition: (stats: any) => (stats[field] || 0) >= level
    }));
};

const createNamedLevelAchievements = (
    baseId: string,
    category: 'PLAYER' | 'TEAM',
    field: string,
    milestones: { level: number, name: string, description: string }[]
): AchievementDefinition[] => {
    return milestones.map(m => ({
        id: `${baseId}_${m.level}`,
        name: m.name,
        description: m.description,
        category,
        condition: (stats: any) => (stats[field] || 0) >= m.level
    }));
}

// --- DEFINITIONS ---

// 1. PLAYER ACHIEVEMENTS (Matches, Goals, Assists)
// Matches (18 levels)
const PLAYER_MATCH_MILESTONES = [
    { level: 1, name: "Estreia", description: "Completou a primeira partida." },
    { level: 5, name: "Aquecimento", description: "Completou 5 partidas." },
    { level: 10, name: "Regular", description: "10 partidas disputadas." },
    { level: 20, name: "Titular", description: "20 partidas disputadas." },
    { level: 30, name: "Consistente", description: "30 partidas disputadas." },
    { level: 40, name: "Experiente", description: "40 partidas disputadas." },
    { level: 50, name: "Ícone do Clube", description: "Marcou presença em 50 jogos." },
    { level: 60, name: "Comprometido", description: "60 jogos completados." },
    { level: 70, name: "Fiel", description: "70 jogos completados." },
    { level: 80, name: "Guerreiro", description: "80 jogos completados." },
    { level: 90, name: "Veterano", description: "90 jogos completados." },
    { level: 100, name: "Centenário", description: "Alcançou a marca de 100 jogos." },
    { level: 150, name: "Histórico", description: "150 jogos de dedicação." },
    { level: 200, name: "Lenda Viva", description: "200 jogos de dedicação." },
    { level: 250, name: "Eterno", description: "250 jogos." },
    { level: 300, name: "Mito", description: "300 jogos." },
    { level: 400, name: "Lenda Dourada", description: "400 jogos." },
    { level: 500, name: "Imortal", description: "Uma vida dedicada ao clube (500 jogos)." }
];

// Goals (17 levels)
const PLAYER_GOAL_MILESTONES = [
    { level: 1, name: "Primeiro Grito", description: "Marcou o primeiro gol." },
    { level: 3, name: "Hat-trick Moral", description: "Marcou 3 gols na carreira." },
    { level: 5, name: "Artilheiro Iniciante", description: "Marcou 5 gols." },
    { level: 10, name: "Matador", description: "Marcou 10 gols." },
    { level: 15, name: "Goleador", description: "Marcou 15 gols." },
    { level: 20, name: "Artilheiro Nato", description: "Marcou 20 gols." },
    { level: 25, name: "Faro de Gol", description: "Marcou 25 gols." },
    { level: 30, name: "Implacável", description: "Marcou 30 gols." },
    { level: 40, name: "Letal", description: "Marcou 40 gols." },
    { level: 50, name: "Goleador de Elite", description: "Marcou 50 gols." },
    { level: 60, name: "Craque", description: "Marcou 60 gols." },
    { level: 70, name: "Ídolo", description: "Marcou 70 gols." },
    { level: 80, name: "Lenda de Gols", description: "Marcou 80 gols." },
    { level: 90, name: "Mestre", description: "Marcou 90 gols." },
    { level: 100, name: "Rei da Rede", description: "Marcou 100 gols." },
    { level: 150, name: "Artilharia Pesada", description: "150 gols." },
    { level: 200, name: "Máquina de Gols", description: "200 gols na carreira." }
];

// Assists (10 levels)
const PLAYER_ASSIST_MILESTONES = [
    { level: 1, name: "Garçom", description: "Deu a primeira assistência." },
    { level: 3, name: "Solidário", description: "3 assistências." },
    { level: 5, name: "Visão de Jogo", description: "5 assistências distribuídas." },
    { level: 10, name: "Maestro", description: "10 assistências para gol." },
    { level: 15, name: "Cérebro", description: "15 assistências." },
    { level: 20, name: "Criativo", description: "20 assistências." },
    { level: 25, name: "Rei das Assists", description: "25 passes para gol." },
    { level: 30, name: "Visionário", description: "30 assistências." },
    { level: 50, name: "Mágico", description: "50 assistências." },
    { level: 100, name: "Gênio da Lâmpada", description: "100 assistências." }
];

// 2. TEAM ACHIEVEMENTS (Matches, Wins, Goals For, Points)
// Matches (14 levels)
const TEAM_MATCH_MILESTONES = [
    { level: 1, name: "O Começo", description: "Primeira partida do time." },
    { level: 5, name: "Primeiros Passos", description: "5 partidas disputadas." },
    { level: 10, name: "Enturmados", description: "10 partidas disputadas." },
    { level: 15, name: "Rodagem", description: "15 partidas disputadas." },
    { level: 20, name: "Experiência", description: "20 partidas disputadas." },
    { level: 25, name: "Consistência", description: "25 partidas disputadas." },
    { level: 30, name: "História Viva", description: "30 partidas disputadas." },
    { level: 40, name: "Tradição", description: "40 partidas disputadas." },
    { level: 50, name: "Time de Tradição", description: "50 partidas na história." },
    { level: 60, name: "Legado", description: "60 partidas." },
    { level: 70, name: "Respeito", description: "70 partidas." },
    { level: 80, name: "Orgulho", description: "80 partidas." },
    { level: 90, name: "Glória", description: "90 partidas." },
    { level: 100, name: "Clube Centenário", description: "100 partidas oficiais." }
];

// Wins (15 levels)
const TEAM_WIN_MILESTONES = [
    { level: 1, name: "Primeira Vitória", description: "Venceu a primeira partida." },
    { level: 3, name: "Triunfante", description: "3 vitórias." },
    { level: 5, name: "Bons Resultados", description: "5 vitórias conquistadas." },
    { level: 10, name: "Time Vencedor", description: "10 vitórias." },
    { level: 15, name: "Vitorioso", description: "15 vitórias." },
    { level: 20, name: "Campeão", description: "20 vitórias." },
    { level: 25, name: "Dominante", description: "25 vitórias." },
    { level: 30, name: "Hegemonia", description: "30 vitórias." },
    { level: 40, name: "Poderoso", description: "40 vitórias." },
    { level: 50, name: "Imbatível", description: "50 vitórias." },
    { level: 60, name: "Invencível", description: "60 vitórias." },
    { level: 70, name: "Lendário", description: "70 vitórias." },
    { level: 80, name: "Conquistador", description: "80 vitórias." },
    { level: 90, name: "Soberano", description: "90 vitórias." },
    { level: 100, name: "Reis da Várzea", description: "100 vitórias." }
];

// Goals (17 levels)
const TEAM_GOAL_MILESTONES = [
    { level: 1, name: "Gol Inaugural", description: "Primeiro gol do time." },
    { level: 5, name: "Ataque", description: "5 gols marcados." },
    { level: 10, name: "Ataque Perigoso", description: "10 gols marcados." },
    { level: 20, name: "Goleadores", description: "20 gols marcados." },
    { level: 30, name: "Artilharia", description: "30 gols marcados." },
    { level: 40, name: "Ofensiva", description: "40 gols marcados." },
    { level: 50, name: "Chuva de Gols", description: "50 gols marcados." },
    { level: 60, name: "Bombardeio", description: "60 gols marcados." },
    { level: 70, name: "Avassalador", description: "70 gols marcados." },
    { level: 80, name: "Destruidor", description: "80 gols marcados." },
    { level: 90, name: "Massacre", description: "90 gols marcados." },
    { level: 100, name: "Ataque Fulminante", description: "100 gols marcados." },
    { level: 150, name: "Arsenal", description: "150 gols marcados." },
    { level: 200, name: "Poder de Fogo", description: "200 gols marcados." },
    { level: 300, name: "Máquina", description: "300 gols marcados." },
    { level: 400, name: "Dinamite", description: "400 gols marcados." },
    { level: 500, name: "Fábrica de Gols", description: "500 gols marcados." }
];

// Points (15 levels)
const TEAM_POINT_MILESTONES = [
    { level: 1, name: "Pontuando", description: "Conquistou o primeiro ponto." },
    { level: 3, name: "Início", description: "3 pontos." },
    { level: 5, name: "Acumulando", description: "5 pontos." },
    { level: 10, name: "Na Tabela", description: "10 pontos conquistados." },
    { level: 15, name: "Crescente", description: "15 pontos." },
    { level: 20, name: "Firme", description: "20 pontos." },
    { level: 30, name: "Disputando Título", description: "30 pontos na temporada." },
    { level: 40, name: "Alta Tabela", description: "40 pontos." },
    { level: 50, name: "Campanha Sólida", description: "50 pontos." },
    { level: 60, name: "Elite", description: "60 pontos." },
    { level: 70, name: "Estelar", description: "70 pontos." },
    { level: 80, name: "Formidável", description: "80 pontos." },
    { level: 90, name: "Incrível", description: "90 pontos." },
    { level: 100, name: "Campanha Histórica", description: "100 pontos." },
    { level: 150, name: "Dinastia", description: "150 pontos." }
];


export const ALL_ACHIEVEMENTS: AchievementDefinition[] = [
    ...createNamedLevelAchievements('PLAYER_MATCH', 'PLAYER', 'matchesPlayed', PLAYER_MATCH_MILESTONES),
    ...createNamedLevelAchievements('PLAYER_GOAL', 'PLAYER', 'goals', PLAYER_GOAL_MILESTONES),
    ...createNamedLevelAchievements('PLAYER_ASSIST', 'PLAYER', 'assists', PLAYER_ASSIST_MILESTONES),

    // Custom Player Badges
    {
        id: 'PLAYER_FAIRPLAY_10',
        name: 'Fair Play',
        description: '10 jogos sem cartões (se >10 jogos e 0 cartões)',
        category: 'PLAYER',
        condition: (stats: PlayerStats) => stats.matchesPlayed >= 10 && (stats.yellowCards === 0 && stats.redCards === 0)
    },
    {
        id: 'PLAYER_BADBOY_5',
        name: 'Indisciplinado',
        description: '5 cartões amarelos acumulados.',
        category: 'PLAYER',
        condition: (stats: PlayerStats) => stats.yellowCards >= 5
    },
    {
        id: 'PLAYER_CONTRIB_20',
        name: 'Decisivo',
        description: '20 participações em gols (Gols + Assists).',
        category: 'PLAYER',
        condition: (stats: PlayerStats) => (stats.goals + stats.assists) >= 20
    },

    // Team Badges
    ...createNamedLevelAchievements('TEAM_MATCH', 'TEAM', 'matchesPlayed', TEAM_MATCH_MILESTONES),
    ...createNamedLevelAchievements('TEAM_WIN', 'TEAM', 'wins', TEAM_WIN_MILESTONES),
    ...createNamedLevelAchievements('TEAM_GOAL', 'TEAM', 'goalsFor', TEAM_GOAL_MILESTONES),
    ...createNamedLevelAchievements('TEAM_POINT', 'TEAM', 'points', TEAM_POINT_MILESTONES),
];

export const checkAndGrantAchievements = (
    currentTrophies: Trophy[],
    entityId: string,
    stats: any,
    type: 'PLAYER' | 'TEAM'
): Omit<Trophy, 'id'>[] => {
    // 1. Filter relevant definitions
    const definitions = ALL_ACHIEVEMENTS.filter(def => def.category === type);

    // 2. Identify new achievements
    const newAchievements: Omit<Trophy, 'id'>[] = [];

    definitions.forEach(def => {
        // Check if condition is met
        if (def.condition(stats)) {
            const alreadyHas = currentTrophies.some(t =>
                (type === 'PLAYER' ? t.playerId === entityId : t.teamId === entityId) &&
                t.name === def.name
            );

            if (!alreadyHas) {
                newAchievements.push({
                    name: def.name,
                    description: def.description,
                    category: type === 'PLAYER' ? 'INDIVIDUAL' : 'TEAM',
                    playerId: type === 'PLAYER' ? entityId : undefined,
                    teamId: type === 'TEAM' ? entityId : undefined,
                    dateAchieved: new Date().toISOString()
                });
            }
        }
    });

    return newAchievements;
};

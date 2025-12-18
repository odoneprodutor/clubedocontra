import { GoogleGenerativeAI } from "@google/generative-ai";
import { Match, Team } from "../types";
import { supabase } from "../supabaseClient";

// --- CONFIGURATION ---
// We prioritize calling the Supabase Edge Function to keep the API key safe.
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Helper to call Supabase Edge Function
const callEdgeFunction = async (prompt: string, model: string = "gemini-1.5-flash") => {
    try {
        const { data, error } = await supabase.functions.invoke('gemini-news', {
            body: { prompt, model },
        });
        if (error) throw error;
        return data.text;
    } catch (e) {
        console.error("[AIService] Erro ao chamar Edge Function:", e);
        throw e;
    }
};

export const AIService = {

    // 1. Gerar Notícia Pós-Jogo
    generateMatchNews: async (match: Match, homeTeam: Team, awayTeam: Team, arenaName?: string): Promise<string> => {
        const eventsSummary = match.events?.map(e =>
            `- Minuto ${e.minute}: ${e.type} (${e.playerName || 'Desconhecido'})`
        ).join('\n') || "Sem eventos registrados.";

        const tournamentName = match.tournamentId ? "pelo campeonato oficial" : "em jogo amistoso";

        const prompt = `
        Você é um jornalista esportivo fanático cobrindo jogos para o aplicativo "ClubeDoContra".
        Escreva uma matéria curta e emocionante sobre o jogo abaixo.
        
        CONTEXTO:
        - O jogo foi ${tournamentName}.
        - Se houver nome do campeonato, cite-o. Se for amistoso, deixe claro.
        - App: "ClubeDoContra" (não é o nome da liga).
        
        DADOS DO JOGO:
        - Confronto: ${homeTeam.name} vs ${awayTeam.name}
        - Placar Final: ${match.homeScore} x ${match.awayScore}
        - Estádio/Arena: ${arenaName || "Local indefinido"}
        
        PRINCIPAIS EVENTOS:
        ${eventsSummary}

        ESTILO:
        - Títulos criativos (ex: "Em noite inspirada...").
        - Destaque autores dos gols.
        - Termine com uma frase de efeito.
        `;

        try {
            // Tenta via Edge Function primeiro (Seguro)
            return await callEdgeFunction(prompt);
        } catch (edgeError) {
            // Fallback para cliente se houver chave (Legado/Desenvolvimento)
            if (genAI && API_KEY) {
                console.log("[AIService] Tentando fallback para cliente...");
                const modelSDK = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await modelSDK.generateContent(prompt);
                return result.response.text();
            }
            return "Não foi possível gerar a matéria. Serviço de IA indisponível no momento.";
        }
    },

    // 2. Analisar Tática do Time (Insight)
    generateTeamInsight: async (team: Team, recentMatches: Match[]): Promise<string> => {
        const stats = recentMatches.reduce((acc, m) => {
            const isHome = m.homeTeamId === team.id;
            const myCtx = isHome ? { g: m.homeScore, o: m.awayScore } : { g: m.awayScore, o: m.homeScore };
            if (myCtx.g > myCtx.o) acc.wins++;
            else if (myCtx.g < myCtx.o) acc.losses++;
            else acc.draws++;
            acc.gf += myCtx.g;
            acc.ga += myCtx.o;
            return acc;
        }, { wins: 0, losses: 0, draws: 0, gf: 0, ga: 0 });

        const prompt = `Analista tático do time ${team.name}. Dados: ${stats.wins}V-${stats.draws}E-${stats.losses}D. Dê 3 dicas curtas.`;

        try {
            return await callEdgeFunction(prompt);
        } catch (e) {
            if (genAI) {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(prompt);
                return result.response.text();
            }
            return "Assistente tático indisponível.";
        }
    },

    // 3. Resenha da Rodada (Campeonato)
    generateTournamentNews: async (tournamentName: string, roundMatches: Match[], teams: Team[]): Promise<string> => {
        const matchesSummary = roundMatches.map(m => {
            const hTeam = teams.find(t => t.id === m.homeTeamId)?.shortName || "Casa";
            const aTeam = teams.find(t => t.id === m.awayTeamId)?.shortName || "Visitante";
            return `- ${hTeam} ${m.homeScore} x ${m.awayScore} ${aTeam}`;
        }).join('\n');

        const prompt = `
        Você é um jornalista esportivo cobrindo o campeonato "${tournamentName}".
        Escreva uma matéria resumindo o que aconteceu nesta rodada.
        
        JOGOS DA RODADA:
        ${matchesSummary}
        
        INSTRUÇÕES:
        - Título impactante sobre a rodada.
        - Analise os resultados (quem surpreendeu, quem decepcionou).
        - Se for mata-mata, cite quem avançou. Se for pontos, cite como fica a briga no topo.
        - Seja dinâmico e empolgante.
        `;

        try {
            return await callEdgeFunction(prompt);
        } catch (e) {
            if (genAI) {
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const result = await model.generateContent(prompt);
                return result.response.text();
            }
            return "Não foi possível gerar a resenha da rodada.";
        }
    }
};

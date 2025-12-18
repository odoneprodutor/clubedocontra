import { GoogleGenerativeAI } from "@google/generative-ai";
import { Match, Team } from "../types";

// --- CONFIGURATION ---
const API_KEY = "AIzaSyAMhFpWeyFR5zqlGyc3lXr-k8xiTNiuoyk";
const genAI = new GoogleGenerativeAI(API_KEY);

export const AIService = {

    // Helper: List models available for this Key
    debugLogAvailableModels: async () => {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
            const data = await response.json();
            console.log("[LocalLegends] Modelos Dispoíveis na API:", data);
            return data.models || [];
        } catch (e) {
            console.error("[LocalLegends] Erro de conexão ao listar modelos:", e);
            return [];
        }
    },

    // 1. Gerar Notícia Pós-Jogo
    generateMatchNews: async (match: Match, homeTeam: Team, awayTeam: Team, arenaName?: string): Promise<string> => {
        const eventsSummary = match.events?.map(e =>
            `- Minuto ${e.minute}: ${e.type} (${e.playerName || 'Desconhecido'})`
        ).join('\n') || "Sem eventos registrados.";

        const tournamentName = match.tournamentId ? "pelo campeonato oficial" : "em jogo amistoso";

        const prompt = `
        Você é um jornalista esportivo fanático cobrindo jogos para o aplicativo "LocalLegends".
        Escreva uma matéria curta e emocionante sobre o jogo abaixo.
        
        CONTEXTO:
        - O jogo foi ${tournamentName}.
        - Se houver nome do campeonato, cite-o. Se for amistoso, deixe claro.
        - App: "LocalLegends" (não é o nome da liga).
        
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

        // Função de Geração via RAW FETCH
        const generateViaFetch = async (modelName: string) => {
            console.log(`[Raw Fetch] Tentando ${modelName}...`);
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API Error (${response.status}): ${errText}`);
            }

            const data = await response.json();
            if (data.candidates && data.candidates.length > 0) {
                return data.candidates[0].content.parts[0].text;
            }
            throw new Error("Nenhuma resposta gerada.");
        };

        // LISTA ATUALIZADA COM BASE NOS MODELOS DO USUÁRIO
        const modelsToTry = [
            "gemini-2.5-flash",
            "gemini-2.5-flash-lite",
            "gemini-3-flash",
            "gemini-1.5-flash", // Fallback comum
            "gemini-pro"
        ];

        // Loop de Tentativas
        for (const model of modelsToTry) {
            try {
                // Tenta via SDK primeiro
                const modelSDK = genAI.getGenerativeModel({ model: model });
                const result = await modelSDK.generateContent(prompt);
                const response = await result.response;
                return response.text();
            } catch (sdkError: any) {
                try {
                    // Tenta via Raw Fetch se SDK falhar
                    return await generateViaFetch(model);
                } catch (fetchError: any) {
                    console.warn(`[Falha] Modelo ${model} falhou.`);
                }
            }
        }

        return "Não foi possível conectar com o correspondente virtual. Nenhum dos modelos Gemini 2.5/3 respondeu.";
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

        const modelsToTry = ["gemini-2.5-flash", "gemini-3-flash", "gemini-1.5-flash"];

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                return await result.response.text();
            } catch (e) {
                console.warn(`[Insight] Erro em ${modelName}`);
            }
        }
        return "Assistente tático indisponível.";
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

        const modelsToTry = ["gemini-2.5-flash", "gemini-3-flash", "gemini-1.5-flash", "gemini-pro"];
        const generateViaFetch = async (modelName: string) => {
            // Reusing fetch logic conceptually or simplified here for brevity/reliability if not exposed
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;
            const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
            if (!response.ok) throw new Error("API Error");
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        };

        for (const model of modelsToTry) {
            try {
                const modelSDK = genAI.getGenerativeModel({ model: model });
                const result = await modelSDK.generateContent(prompt);
                return result.response.text();
            } catch (e) {
                try { return await generateViaFetch(model); } catch (err) { }
            }
        }
        return "Não foi possível gerar a resenha da rodada.";
    }
};

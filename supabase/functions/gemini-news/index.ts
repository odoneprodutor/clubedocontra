import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai";

console.log("Hello from Gemini Edge Function!");

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST',
                'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
            },
        });
    }

    try {
        const { prompt, model: modelName = "gemini-1.5-flash" } = await req.json();

        const apiKey = Deno.env.get("GEMINI_API_KEY");
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set in Supabase Edge Function Secrets.");
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return new Response(JSON.stringify({ text }), {
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
            },
        });
    }
});

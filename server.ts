import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client server-side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

const DEFAULT_MODEL = 'gemini-3.6-flash';

// --- API Endpoints ---

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiAvailable: !!process.env.GEMINI_API_KEY });
});

// 1. Generate City Goal Endpoint
const goalSchema = {
  type: Type.OBJECT,
  properties: {
    description: {
      type: Type.STRING,
      description: "A short, creative description of the goal from the perspective of city council or citizens.",
    },
    targetType: {
      type: Type.STRING,
      enum: ['population', 'money', 'building_count'],
      description: "The metric to track.",
    },
    targetValue: {
      type: Type.INTEGER,
      description: "The target numeric value to reach.",
    },
    buildingType: {
      type: Type.STRING,
      enum: ['Residential', 'Commercial', 'Industrial', 'Park', 'Road', 'Monument'],
      description: "Required if targetType is building_count.",
    },
    reward: {
      type: Type.INTEGER,
      description: "Monetary reward for completion.",
    },
  },
  required: ['description', 'targetType', 'targetValue', 'reward'],
};

app.post("/api/gemini/goal", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key not configured on server" });
    }

    const { stats, counts, buildingStats } = req.body;
    const context = `
      Current City Stats:
      Day: ${stats?.day || 1}
      Money: $${stats?.money || 1000}
      Population: ${stats?.population || 10}
      Buildings: ${JSON.stringify(counts || {})}
      Building Stats: ${JSON.stringify(buildingStats || [])}
    `;
    const prompt = `You are the AI City Advisor for Sky Metropolis simulation game. Based on the current city stats, generate a challenging but achievable short-term goal for the player to help the city grow. Return JSON.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `${context}\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: goalSchema,
        temperature: 0.7,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return res.json({ goal: { ...data, completed: false } });
    }
    res.status(500).json({ error: "Empty response from Gemini model" });
  } catch (err: any) {
    console.warn("Server Gemini Goal Error:", err?.message || err);
    res.status(500).json({ error: err?.message || "Failed to generate city goal" });
  }
});

// 2. Generate News Headline Endpoint
const newsSchema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING, description: "A one-sentence news headline representing life in the sky city." },
    type: { type: Type.STRING, enum: ['positive', 'negative', 'neutral'] },
  },
  required: ['text', 'type'],
};

app.post("/api/gemini/news", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key not configured on server" });
    }

    const { stats, recentAction } = req.body;
    const context = `City Stats - Pop: ${stats?.population || 0}, Money: $${stats?.money || 0}, Day: ${stats?.day || 1}. ${recentAction ? `Recent Action: ${recentAction}` : ''}`;
    const prompt = "Generate a very short, futuristic city-sim news headline based on the city state. Can be funny, cynical, or celebratory.";

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `${context}\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: newsSchema,
        temperature: 1.1,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return res.json({
        news: {
          id: Date.now().toString() + Math.random(),
          text: data.text,
          type: data.type,
        }
      });
    }
    res.status(500).json({ error: "Empty news response" });
  } catch (err: any) {
    console.warn("Server Gemini News Error:", err?.message || err);
    res.status(500).json({ error: err?.message || "Failed to generate news" });
  }
});

// 3. Advisor Chat Endpoint
app.post("/api/gemini/advisor", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key not configured on server" });
    }

    const { messages, stats, refinementState, systemPrompt } = req.body;
    const contextPrompt = `
You are Aetheria, the Senior AI Urban Planner & Mayoral Advisor for Sky Metropolis.
Current City Context:
- Day: ${stats?.day || 1}
- Treasury: $${stats?.money || 0}
- Population: ${stats?.population || 0}
- Happiness: ${stats?.happiness || 75}%
- Refined Aetherium Production: ${refinementState?.refinedAetheriumProduction || 0} units/tick
- Refined Aetherium Demand: ${refinementState?.refinedAetheriumDemand || 0} units/tick
- Quality of Life Multiplier: ${refinementState?.qualityOfLifeMultiplier || 1.0}x
- Active Refinement Surge: ${refinementState?.surgeActive ? 'YES' : 'NO'}

${systemPrompt || 'Provide helpful, concise, strategic urban planning advice.'}
`;

    // Convert chat history into string or conversation format
    const formattedHistory = (messages || []).map((m: any) => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const fullPrompt = `${contextPrompt}\n\nConversation History:\n${formattedHistory}\n\nADVISOR RESPONSE:`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: fullPrompt,
      config: {
        temperature: 0.8,
      }
    });

    if (response.text) {
      return res.json({ reply: response.text });
    }
    res.status(500).json({ error: "No text returned from Gemini advisor" });
  } catch (err: any) {
    console.warn("Server Gemini Advisor Error:", err?.message || err);
    res.status(500).json({ error: err?.message || "Failed to consult advisor" });
  }
});

// 4. Strategic City & Refinement Analysis Endpoint
const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    cityGrade: { type: Type.STRING, description: "Letter grade for the city (A+, A, B, C, D, F)" },
    executiveSummary: { type: Type.STRING, description: "2-3 sentence strategic overview of the metropolis." },
    supplyChainDiagnosis: { type: Type.STRING, description: "Analysis of the Refined Aetherium production vs synthesis demand." },
    keyRecommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "3 strategic action items for the Mayor."
    },
    suggestedMayoralDecree: { type: Type.STRING, description: "A formal Mayoral Decree title and brief description." }
  },
  required: ['cityGrade', 'executiveSummary', 'supplyChainDiagnosis', 'keyRecommendations', 'suggestedMayoralDecree']
};

app.post("/api/gemini/city-analysis", async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({ error: "Gemini API key not configured on server" });
    }

    const { stats, counts, refinementState } = req.body;
    const context = `
Sky Metropolis Telemetry:
- Day ${stats?.day || 1}, Treasury: $${stats?.money || 0}, Population: ${stats?.population || 0}, Happiness: ${stats?.happiness || 75}%
- Buildings: ${JSON.stringify(counts || {})}
- Refinement Pipeline: Production=${refinementState?.refinedAetheriumProduction || 0}, Demand=${refinementState?.refinedAetheriumDemand || 0}, QoL Mult=${refinementState?.qualityOfLifeMultiplier || 1.0}x, Tier=${refinementState?.purityTier || 'Standard'}
`;

    const prompt = `Perform a comprehensive Mayoral Strategic Audit on Sky Metropolis. Evaluate zoning balance, revenue efficiency, and the Refined Aetherium supply chain. Return structured JSON.`;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `${context}\n${prompt}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.7,
      }
    });

    if (response.text) {
      return res.json({ analysis: JSON.parse(response.text) });
    }
    res.status(500).json({ error: "Empty response from Gemini analysis" });
  } catch (err: any) {
    console.warn("Server Gemini Analysis Error:", err?.message || err);
    res.status(500).json({ error: err?.message || "Failed to analyze city layout" });
  }
});

// Vite Middleware & Static Serving Setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.use((req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Sky Metropolis server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

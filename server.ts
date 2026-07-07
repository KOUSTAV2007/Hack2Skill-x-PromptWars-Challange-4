import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini SDK with telemetry User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 1. Operational Dispatch Endpoint
  app.post("/api/ops/dispatch", async (req, res) => {
    try {
      const { description, context } = req.body;
      if (!description) {
        return res.status(400).json({ error: "Missing incident description" });
      }

      const systemInstruction = `
You are the Lead Coordinator for the FIFA World Cup 2026 Stadium Command & Control Center.
Analyze the following incident reported by a volunteer or staff member at the stadium.
Return a structured JSON object containing:
1. "severity": "low" | "medium" | "high" | "critical"
2. "category": a classification of the incident (e.g., "Medical", "Crowd Control", "Facilities", "Security", "Lost & Found")
3. "sopSteps": an array of 4-5 immediate, actionable step-by-step instructions for the stadium command center or field staff based on official FIFA stadium safety protocols.
4. "volunteerBriefing": a highly supportive, direct 2-3 sentence guide for volunteers assisting on the scene.
5. "paAnnouncement": a clean, calming Public Address announcement script in English and Spanish to broadcast if necessary.
6. "alertSummary": a short, urgent 5-8 word headline for the incident.

You must respond ONLY with a raw JSON object matching this schema, do not include markdown blocks.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Incident: "${description}". Context: ${JSON.stringify(context || {})}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              severity: { type: Type.STRING, description: "low, medium, high, or critical" },
              category: { type: Type.STRING, description: "Category of incident" },
              sopSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Step-by-step SOP instructions"
              },
              volunteerBriefing: { type: Type.STRING, description: "Instructions for volunteers" },
              paAnnouncement: { type: Type.STRING, description: "English and Spanish PA script" },
              alertSummary: { type: Type.STRING, description: "Short 5-8 word headline" }
            },
            required: ["severity", "category", "sopSteps", "volunteerBriefing", "paAnnouncement", "alertSummary"]
          }
        }
      });

      const resultText = response.text || "{}";
      res.json(JSON.parse(resultText.trim()));
    } catch (error: any) {
      console.error("Error in dispatch API:", error);
      res.status(500).json({ error: error.message || "Failed to process dispatch protocol" });
    }
  });

  // 2. Multilingual Concierge / Guide Endpoint
  app.post("/api/guide/ask", async (req, res) => {
    try {
      const { question, language, fanLocation } = req.body;
      if (!question) {
        return res.status(400).json({ error: "Missing question" });
      }

      const systemInstruction = `
You are 'WorldCup Assist', the official intelligent multilingual stadium virtual assistant for the FIFA World Cup 2026.
The user is a fan attending a match at a 2026 World Cup stadium (e.g. MetLife Stadium / New York New Jersey, Estadio Azteca / Mexico City, BC Place / Vancouver, etc.).
Answer their question warmly, helpful, and in detail in the requested language (which is: ${language || 'English'}).
If a location is provided (Current Location: "${fanLocation || 'Not specified'}"), tailor your guide to route them, suggest nearby amenities, restrooms, first aid, green concessions, or quiet sensory rooms.
Provide stadium transportation info (transit connections, rideshare zones, bike parking) and clear accessibility guidelines (wheelchair ramps, audio-descriptive commentary headsets).
Keep your tone enthusiastic about soccer/football and the World Cup tournament, and ensure your directions are clear and reassuring. Use Markdown bullet points where appropriate.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Fan question: "${question}". Current location: "${fanLocation || 'Unknown'}".`,
        config: {
          systemInstruction,
        }
      });

      res.json({ answer: response.text });
    } catch (error: any) {
      console.error("Error in guide API:", error);
      res.status(500).json({ error: error.message || "Failed to answer stadium query" });
    }
  });

  // 3. Eco-Fan Recycling Classifier Endpoint
  app.post("/api/eco/classify", async (req, res) => {
    try {
      const { itemName } = req.body;
      if (!itemName) {
        return res.status(400).json({ error: "Missing item name" });
      }

      const systemInstruction = `
You are the FIFA World Cup Green Initiative Assistant, helping fans recycle responsibly inside the stadium.
Based on the food, drink, or general merchandise item supplied, identify:
1. Which stadium bin it belongs in: "recycle" | "compost" | "landfill"
2. A detailed 1-2 sentence explanation of why it goes there and any pre-disposal instructions (e.g., "Empty any remaining liquid first before dropping in the blue recycling bin").
3. "co2Saved": estimated kilograms of CO2 saved by recycling or composting this item correctly (a float between 0.02 and 0.50).
4. "points": points awarded to the fan's digital FIFA Green Pass (between 10 and 50 depending on correct sort complexity).
5. "badge": if this item unlocks a special eco badge, name it (otherwise null or empty string).

You must respond ONLY with a raw JSON object matching this schema, do not include markdown blocks.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Item to sort: "${itemName}"`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bin: { type: Type.STRING, description: "recycle, compost, or landfill" },
              explanation: { type: Type.STRING, description: "Sort explanation and instructions" },
              co2Saved: { type: Type.NUMBER, description: "CO2 saved in kilograms" },
              points: { type: Type.INTEGER, description: "Points earned" },
              badge: { type: Type.STRING, description: "Eco badge earned or empty string" }
            },
            required: ["bin", "explanation", "co2Saved", "points", "badge"]
          }
        }
      });

      const resultText = response.text || "{}";
      res.json(JSON.parse(resultText.trim()));
    } catch (error: any) {
      console.error("Error in eco API:", error);
      res.status(500).json({ error: error.message || "Failed to classify eco item" });
    }
  });

  // Vite Integration for Dev/Prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

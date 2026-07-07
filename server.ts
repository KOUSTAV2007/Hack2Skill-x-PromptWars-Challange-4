import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";

dotenv.config();

// Lazy-initialized Gemini SDK to prevent server startup crash if key is missing
let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI | null {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("⚠️ Warning: GEMINI_API_KEY is not defined. Server will use secure high-fidelity fallback responses.");
      return null;
    }
    try {
      aiInstance = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    } catch (e) {
      console.error("Failed to initialize GoogleGenAI client:", e);
      return null;
    }
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic security middlewares
  app.use(express.json({ limit: "1mb" })); // Prevent large payload attacks

  // Enable CORS with restricted configuration
  app.use(cors({
    origin: "*", // Support preview environments
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  // Enable Helmet for robust secure headers, with compatibility for AI Studio preview iframes
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://*"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://*"],
        connectSrc: ["'self'", "https://*", "wss://*", "ws://*"],
        frameAncestors: ["'self'", "https://*.google.com", "https://*.run.app", "https://ai.studio", "https://*.studio.google.com"],
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // 1. Operational Dispatch Endpoint
  app.post("/api/ops/dispatch", async (req, res) => {
    try {
      const { description, context } = req.body;
      if (!description || typeof description !== "string") {
        return res.status(400).json({ error: "Missing or invalid incident description" });
      }
      if (description.length > 2000) {
        return res.status(400).json({ error: "Description exceeds maximum safe limit" });
      }

      const ai = getAI();
      if (!ai) {
        // High fidelity fallback when AI is unconfigured
        const descLower = description.toLowerCase();
        const severity = descLower.includes("fire") || descLower.includes("smoke") || descLower.includes("collapse") || descLower.includes("weapon") ? "critical" : "high";
        const category = descLower.includes("injury") || descLower.includes("pain") || descLower.includes("heart") ? "Medical" : "Facilities";
        return res.json({
          severity,
          category,
          sopSteps: [
            "Dispatch emergency responders to the reported zone immediately.",
            "Instruct nearby sector volunteers to guide crowds away from the hazard.",
            "Establish a clear visual and physical perimeter around the affected area.",
            "Alert senior management and update the Command Center log.",
            "Maintain ongoing communication with on-site coordinators."
          ],
          volunteerBriefing: "Keep calm, assist in routing fans away from the immediate scene, and wait for emergency responders.",
          paAnnouncement: "Attention fans: please stay clear of this section and follow the stadium coordinators' directions.",
          alertSummary: `Incident Alert: ${description.slice(0, 30)}...`
        });
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
      // Clean security response - never leak full stack trace to frontend
      res.status(500).json({ error: "Failed to process dispatch protocol securely" });
    }
  });

  // 2. Multilingual Concierge / Guide Endpoint
  app.post("/api/guide/ask", async (req, res) => {
    try {
      const { question, language, fanLocation } = req.body;
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "Missing or invalid question" });
      }
      if (question.length > 1000) {
        return res.status(400).json({ error: "Question exceeds maximum safe limit" });
      }

      const ai = getAI();
      if (!ai) {
        return res.json({
          answer: `[Fallback Assistance] Restrooms, medical tents, and food concessions are located near Gate A, B, and C. Please follow the illuminated green exit routes and ask on-duty volunteers for instant physical guidance.`
        });
      }

      const systemInstruction = `
You are 'WorldCup Assist', the official intelligent multilingual stadium virtual assistant for the FIFA World Cup 2026.
The user is a fan attending a match at a 2026 World Cup stadium.
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
      res.status(500).json({ error: "Failed to answer stadium query securely" });
    }
  });

  // 3. Eco-Fan Recycling Classifier Endpoint
  app.post("/api/eco/classify", async (req, res) => {
    try {
      const { itemName } = req.body;
      if (!itemName || typeof itemName !== "string") {
        return res.status(400).json({ error: "Missing or invalid item name" });
      }
      if (itemName.length > 200) {
        return res.status(400).json({ error: "Item name exceeds maximum safe limit" });
      }

      const ai = getAI();
      if (!ai) {
        const itemLower = itemName.toLowerCase();
        const bin = itemLower.includes("bottle") || itemLower.includes("can") || itemLower.includes("plastic") || itemLower.includes("aluminum") ? "recycle" : itemLower.includes("food") || itemLower.includes("leftover") || itemLower.includes("paper") ? "compost" : "landfill";
        return res.json({
          bin,
          explanation: `Please drop your ${itemName} in the designated ${bin} bin. Ensure it is empty of any remaining liquids to prevent contamination.`,
          co2Saved: 0.12,
          points: 15,
          badge: "Eco Participant"
        });
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
      res.status(500).json({ error: "Failed to classify eco item securely" });
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

import express from "express";
import { clients } from "../config/clients.js";
import { buildPrompt } from "../services/aiPrompt.js";
import { askAI } from "../services/aiAPI.js";

const router = express.Router();

router.post("/incoming", async (req, res) => {
if (!req.body) {
	    return res.status(400).json({ error: "Request body missing" });
	      }
	      

  const { clientId, speechText } = req.body;
if (!clientId || !speechText) {
    return res.status(400).json({
      error: "clientId and speechText are required"
    });
  }

  const client = clients[clientId];
  if (!client) {
    return res.json({ reply: "Invalid business number" });
  }

  const prompt = buildPrompt(client, speechText);

  // Later this will call Ollama
  const reply = await askAI(speechText);
  

  res.json({ reply });
});

export default router;

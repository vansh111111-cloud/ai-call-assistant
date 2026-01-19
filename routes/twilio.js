import express from "express";
import { clients } from "../config/clients.js";
import { buildPrompt } from "../services/aiPrompt.js";
import { askAI } from "../services/aiAPI.js";

const router = express.Router();

router.post("/incoming", async (req, res) => {
  // Twilio sends form data, NOT JSON
  const speechText = req.body.SpeechResult || "Hello";
  const clientId = "restaurant1"; // later dynamic by phone number

  const client = clients[clientId];
  const prompt = buildPrompt(client, speechText);
  const reply = await askAI(prompt);

  res.set("Content-Type", "text/xml");
  res.send(`
    <Response>
      <Say voice="alice">${reply}</Say>
      <Gather input="speech" action="/twilio/incoming" method="POST" />
    </Response>
  `);
});

export default router;

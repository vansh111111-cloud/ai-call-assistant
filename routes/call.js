import express from "express";
import twilio from "twilio";

// OPTIONAL AI IMPORT (safe fallback)
let askAI = null;
try {
  const ai = await import("../services/aiAPI.js");
  askAI = ai.askAI;
} catch (e) {
  console.log("AI disabled, running in voice-only mode");
}

const router = express.Router();

router.post("/incoming", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  // Step 1: Ask user to speak
  const gather = response.gather({
    input: "speech",
    action: "/call/respond",
    method: "POST",
    timeout: 5,
    speechTimeout: "auto",
    language: "en-IN"
  });

  gather.say(
    { voice: "alice", language: "en-IN" },
    "Hello. Please ask your question after the beep."
  );

  // If no input
  response.say(
    { voice: "alice", language: "en-IN" },
    "No response received. Goodbye."
  );

  res.type("text/xml");
  res.send(response.toString());
});

// STEP 2: Handle user speech
router.post("/respond", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const userSpeech = req.body.SpeechResult || "";

  let replyText = "";

  if (!userSpeech) {
    replyText = "I did not hear anything. Please try again later.";
  } else if (askAI) {
    try {
      replyText = await askAI(userSpeech);
    } catch (e) {
      replyText = `You said: ${userSpeech}. AI is temporarily unavailable.`;
    }
  } else {
    // SAFE FALLBACK (NO AI / NO INTERNET)
    replyText = `You said: ${userSpeech}. This is test mode.`;
  }

  response.say(
    { voice: "alice", language: "en-IN" },
    replyText
  );

  response.hangup();

  res.type("text/xml");
  res.send(response.toString());
});

export default router;

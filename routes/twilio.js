import express from "express";
import twilio from "twilio";
import { askAI } from "../services/aiAPI.js"; // your updated AI file

const router = express.Router();

router.post("/incoming", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  // Ask user to speak
  const gather = response.gather({
    input: "speech",
    action: "/twilio/respond",  // sends speech to this endpoint
    method: "POST",
    timeout: 5,
    speechTimeout: "auto",
    language: "en-IN"
  });

  gather.say({ voice: "alice", language: "en-IN" }, 
    "Hello! Please ask your question after the beep."
  );

  // If no input, retry
  response.say({ voice: "alice", language: "en-IN" }, 
    "No response received. Let's try again."
  );

  res.type("text/xml");
  res.send(response.toString());
});

// Handle user speech and loop
router.post("/respond", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const userSpeech = req.body.SpeechResult || "";
  let replyText = "";

  if (!userSpeech) {
    replyText = "I did not hear anything. Please say again.";
  } else {
    try {
      replyText = await askAI(userSpeech); // get AI response
    } catch (e) {
      replyText = `AI is temporarily unavailable. You said: ${userSpeech}`;
    }
  }

  response.say({ voice: "alice", language: "en-IN" }, replyText);

  // After AI reply, gather speech again (loop)
  const gather = response.gather({
    input: "speech",
    action: "/twilio/respond",
    method: "POST",
    timeout: 5,
    speechTimeout: "auto",
    language: "en-IN"
  });

  gather.say({ voice: "alice", language: "en-IN" }, 
    "You can continue talking. Ask me anything."
  );

  res.type("text/xml");
  res.send(response.toString());
});

export default router;

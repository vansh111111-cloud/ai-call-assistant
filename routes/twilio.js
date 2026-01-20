import express from "express";
import twilio from "twilio";
import fetch from "node-fetch";

// Your AI function
let askAI = async (question) => {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost",
      "X-Title": "AI Call Assistant"
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct",
      messages: [{ role: "user", content: question }]
    })
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "AI is unavailable.";
};

const router = express.Router();

// Step 1: Gather user speech
router.post("/incoming", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const gather = response.gather({
    input: "speech",
    action: "/twilio/respond",
    method: "POST",
    timeout: 5,
    speechTimeout: "auto",
    language: "en-IN"
  });

  gather.say(
    { voice: "alice", language: "en-IN" },
    "Hello. Please ask your question after the beep."
  );

  response.say(
    { voice: "alice", language: "en-IN" },
    "No response received. Goodbye."
  );

  res.type("text/xml");
  res.send(response.toString());
});

// Step 2: Handle user speech and continue looping
router.post("/respond", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const userSpeech = req.body.SpeechResult || "";
  let replyText = "";

  if (!userSpeech) {
    replyText = "I did not hear anything. Please try again later.";
    response.say({ voice: "alice", language: "en-IN" }, replyText);
    response.hangup();
  } else {
    try {
      replyText = await askAI(userSpeech);
    } catch (e) {
      replyText = `You said: ${userSpeech}. AI is temporarily unavailable.`;
    }

    response.say({ voice: "alice", language: "en-IN" }, replyText);

    // Loop again by gathering speech
    const gather = response.gather({
      input: "speech",
      action: "/twilio/respond",
      method: "POST",
      timeout: 5,
      speechTimeout: "auto",
      language: "en-IN"
    });
    gather.say({ voice: "alice", language: "en-IN" }, "You can ask another question now.");
  }

  res.type("text/xml");
  res.send(response.toString());
});

export default router;


import express from "express";
import twilio from "twilio";
import fetch from "node-fetch";

const router = express.Router();

// --- AI function directly here for Termux testing ---
async function askAI(question) {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
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
      }
    );

    const data = await response.json();
    if (data.error) {
      console.error("❌ OpenRouter error:", data);
      return "Sorry, AI is temporarily unavailable.";
    }

    return data.choices[0].message.content;
  } catch (err) {
    console.error("❌ Fetch failed:", err);
    return "Sorry, AI is currently unavailable.";
  }
}

// --- Incoming call route ---
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
    "Hello! Please ask your question after the beep."
  );

  // Fallback if nothing is said
  response.say(
    { voice: "alice", language: "en-IN" },
    "No response received. Goodbye."
  );

  res.type("text/xml");
  res.send(response.toString());
});

// --- Respond route (AI + loop) ---
router.post("/respond", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const userSpeech = req.body.SpeechResult || "";

  let replyText = "";
  if (!userSpeech) {
    replyText = "I did not hear anything. Please try again.";
  } else {
    replyText = await askAI(userSpeech);
  }

  // Say AI reply
  response.say({ voice: "alice", language: "en-IN" }, replyText);

  // Loop back to gather again
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
    "You can ask another question now."
  );

  res.type("text/xml");
  res.send(response.toString());
});

export default router;

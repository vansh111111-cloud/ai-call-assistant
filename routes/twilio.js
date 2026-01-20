import express from "express";
import twilio from "twilio";
import fetch from "node-fetch";

const router = express.Router();

// --- AI function using OpenRouter ---
async function askAI(question) {
  try {
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
router.post("/incoming", (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  // Use <Gather> to capture speech and loop
  const gather = response.gather({
    input: "speech",
    action: "/twilio/respond",
    method: "POST",
    timeout: 10,
    speechTimeout: "auto",
    language: "en-IN"
  });
  gather.say({ voice: "alice", language: "en-IN" }, 
    "Hello! Welcome to AI Call Assistant. You can ask anything. Speak after the beep."
  );

  // Fallback if no response
  response.say({ voice: "alice", language: "en-IN" }, "No response detected. Goodbye!");
  response.hangup();

  res.type("text/xml");
  res.send(response.toString());
});

// --- Respond route (loop + interruption) ---
router.post("/respond", async (req, res) => {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const response = new VoiceResponse();

  const userSpeech = req.body.SpeechResult?.trim();

  if (!userSpeech) {
    response.say({ voice: "alice", language: "en-IN" }, "No input detected. Goodbye!");
    response.pause({ length: 2 });
    response.hangup();
  } else {
    // Get AI response
    const aiReply = await askAI(userSpeech);

    // Split response into smaller sentences for interruption
    const sentences = aiReply.match(/.{1,150}/g) || [aiReply];
    for (const sentence of sentences) {
      response.say({ voice: "alice", language: "en-IN" }, sentence);
      response.pause({ length: 0.5 }); // allows caller to interrupt
    }

    // Gather for next question
    const gather = response.gather({
      input: "speech",
      action: "/twilio/respond",
      method: "POST",
      timeout: 10,
      speechTimeout: "auto",
      language: "en-IN"
    });
    gather.say({ voice: "alice", language: "en-IN" }, 
      "You can ask another question now. If done, stay silent."
    );

    // Goodbye if still no input
    response.say({ voice: "alice", language: "en-IN" }, "No more questions detected. Goodbye!");
    response.pause({ length: 2 });
    response.hangup();
  }

  res.type("text/xml");
  res.send(response.toString());
});

export default router;

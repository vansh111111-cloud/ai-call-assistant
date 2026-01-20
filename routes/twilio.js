import express from "express";
import twilio from "twilio";
import fetch from "node-fetch";

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

/* ---------------- AI FUNCTION ---------------- */
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
          messages: [
            {
              role: "system",
              content:
                "You are a polite, friendly AI phone assistant. Speak clearly, briefly, and politely."
            },
            { role: "user", content: question }
          ],
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (data.error || !data.choices) {
      console.error("❌ OpenRouter error:", data);
      return "Sorry, I am having trouble right now.";
    }

    return data.choices[0].message.content;
  } catch (err) {
    console.error("❌ AI fetch failed:", err);
    return "Sorry, I am currently unavailable.";
  }
}

/* ---------------- CALL START ---------------- */
router.post("/incoming", (req, res) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: "speech",
    action: "/twilio/respond",
    method: "POST",
    timeout: 10,
    speechTimeout: "auto",
    language: "en-IN"
  });

  gather.say(
    { voice: "alice", language: "en-IN" },
    "Hello. I am your AI assistant. Please ask your question."
  );

  // If user says nothing
  twiml.say(
    { voice: "alice", language: "en-IN" },
    "I did not hear anything. Goodbye."
  );
  twiml.hangup();

  res.type("text/xml");
  res.send(twiml.toString());
});

/* ---------------- MAIN CONVERSATION LOOP ---------------- */
router.post("/respond", async (req, res) => {
  const twiml = new VoiceResponse();
  const userSpeech = req.body.SpeechResult?.trim();

  // If silence
  if (!userSpeech) {
    twiml.say(
      { voice: "alice", language: "en-IN" },
      "It seems you are done. Thank you for calling. Goodbye."
    );
    twiml.hangup();

    res.type("text/xml");
    return res.send(twiml.toString());
  }

  // AI response
  const aiReply = await askAI(userSpeech);

  twiml.say({ voice: "alice", language: "en-IN" }, aiReply);

  // Short pause (natural feel)
  twiml.pause({ length: 1 });

  // Gather again (LOOP)
  const gather = twiml.gather({
    input: "speech",
    action: "/twilio/respond",
    method: "POST",
    timeout: 10,
    speechTimeout: "auto",
    language: "en-IN"
  });

  gather.say(
    { voice: "alice", language: "en-IN" },
    "You may ask another question."
  );

  // If user stays silent again
  twiml.say(
    { voice: "alice", language: "en-IN" },
    "No response received. Ending the call now. Goodbye."
  );
  twiml.hangup();

  res.type("text/xml");
  res.send(twiml.toString());
});

export default router;

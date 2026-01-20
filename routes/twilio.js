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
          "X-Title": "DorX Pizza Assistant"
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct",
          messages: [
            {
              role: "system",
              content: `
You are a sweet, polite female voice assistant for "DorX Pizza".
You help customers with menu, prices, offers, and location.
Speak clearly, briefly, and friendly like a real restaurant staff.
You are created by vansh .
Restaurant details:
Name: DorX Pizza
Location: Noida Electronic City, Noida, Uttar Pradesh, India

Menu:
1. Margherita Pizza – Small ₹149, Medium ₹249, Large ₹349
2. Farmhouse Pizza – Small ₹199, Medium ₹299, Large ₹399
3. Paneer Tikka Pizza – Small ₹219, Medium ₹319, Large ₹429
4. Veg Supreme Pizza – Small ₹239, Medium ₹349, Large ₹449
5. Cheese Burst Add-on – ₹80 extra
6. Garlic Bread – ₹129
7. French Fries – ₹99
8. Cold Drink – ₹49

If user asks anything unrelated, politely guide them back to the menu.
`
            },
            { role: "user", content: question }
          ],
          temperature: 0.6
        })
      }
    );

    const data = await response.json();

    if (!data.choices) {
      return "Sorry, I am having some technical difficulty right now.";
    }

    return data.choices[0].message.content;
  } catch (err) {
    console.error("AI error:", err);
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
    timeout: 8,
    speechTimeout: "auto",
    language: "en-IN"
  });

  gather.say(
    { voice: "alice", language: "en-IN" },
    "Hello! Welcome to DorX Pizza. How may I help you today?"
  );

  res.type("text/xml");
  res.send(twiml.toString());
});

/* ---------------- CONVERSATION LOOP ---------------- */
router.post("/respond", async (req, res) => {
  const twiml = new VoiceResponse();
  const userSpeech = req.body.SpeechResult?.trim();

  // Silence handling
  if (!userSpeech) {
    twiml.say(
      { voice: "alice", language: "en-IN" },
      "Thank you for calling DorX Pizza. Have a delicious day. Goodbye!"
    );
    twiml.hangup();

    res.type("text/xml");
    return res.send(twiml.toString());
  }

  // AI reply
  const aiReply = await askAI(userSpeech);
  twiml.say({ voice: "alice", language: "en-IN" }, aiReply);

  // 🔑 FORCE LOOP EVEN IF USER IS SILENT
  const gather = twiml.gather({
    input: "speech",
    action: "/twilio/respond",
    method: "POST",
    timeout: 8,
    speechTimeout: "auto",
    actionOnEmptyResult: true,   // ⭐ THIS IS THE MAGIC
    language: "en-IN"
  });

  gather.say(
    { voice: "alice", language: "en-IN" },
    "Would you like to order anything else or know our location?"
  );

  res.type("text/xml");
  res.send(twiml.toString());
});

export default router;

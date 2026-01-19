import 'dotenv/config';
import fetch from "node-fetch"; // Termux Node may need this

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

export async function askAI(prompt) {
  try {
    const res = await fetch("https://api.openrouter.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openrouter‑gecko‑mini‑lm‑no‑internet‑preview‑20240302", 
        messages: [
          { role: "system", content: "You are a friendly restaurant assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await res.json();

    // If the API returns data differently use console to inspect structure
    return data.choices?.[0]?.message?.content ?? "Sorry, no reply from API.";

  } catch (err) {
    console.error("OpenRouter API error:", err);
    return "Sorry, AI is currently unavailable.";
  }
}

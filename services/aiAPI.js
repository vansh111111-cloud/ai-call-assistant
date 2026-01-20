
import fetch from "node-fetch";

export async function askAI(prompt) {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost",   // REQUIRED by OpenRouter
          "X-Title": "AI Call Assistant"        // REQUIRED by OpenRouter
        },
        body: JSON.stringify({
          model: "mistralai/mistral-7b-instruct", // Updated working model
          messages: [
            { role: "system", content: "You are a friendly restaurant assistant." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("❌ OpenRouter error:", data);
      return "Sorry, AI is temporarily unavailable.";
    }

    return data.choices[0].message.content ?? "Sorry, no reply from AI.";

  } catch (err) {
    console.error("❌ Fetch failed:", err);
    return "AI error";
  }
}

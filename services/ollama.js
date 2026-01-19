import axios from "axios";

export async function askAI(prompt) {
  const res = await axios.post("http://localhost:11434/api/generate", {
    model: "gemma:2b",
    prompt,
    stream: false
  });

  return res.data.response;
}

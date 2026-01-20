import express from "express";
import callRoute from "./routes/call.js";
import 'dotenv/config'; // loads .env automatically
import OpenAI from "openai";
import twilioRoute from "./routes/twilio.js";
const app = express();

// Parse JSON requests
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Mount the call route
app.use("/twilio", callRoute);
app.use("/call", twilioRoute);

// Health check route (optional but recommended for Render)
app.get("/", (req, res) => {
  res.send("AI Call Assistant is live 🚀");
});

// Dynamic port for Render (Render sets process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI Call Assistant running on port ${PORT}`);
});

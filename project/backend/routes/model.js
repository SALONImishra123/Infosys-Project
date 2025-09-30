import express from "express";
import fs from "fs";
import path from "path";
import Annotation from "../models/Annotation.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();
router.use(authenticateToken);

// ------------------------
// Predict Route
// ------------------------
router.post("/predict", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text is required" });

    const input = text.toLowerCase();

    // Check DB annotations
    const annotation = await Annotation.findOne({ text });
    if (annotation) {
      return res.json({
        reply: `📝 Matched annotation: Intent=${annotation.intent || "unknown"}`,
        intent: annotation.intent || "unknown",
        entities: annotation.entities || []
      });
    }

    // Rule-based fallback
    let reply = "🤔 Sorry, I don't understand that.";
    let intent = "unknown";
    let entities = [];

    if (input.includes("book") && input.includes("flight")) {
      intent = "book_flight";
      reply = "✅ Your flight has been booked!";
    } else if (input.includes("restaurant")) {
      intent = "find_restaurant";
      reply = "🍽️ Searching for restaurants near you...";
    } else if (input.includes("weather")) {
      intent = "get_weather";
      reply = "☀️ The weather is sunny today!";
    } else if (input.includes("hello") || input.includes("hi")) {
      intent = "greeting";
      reply = "👋 Hello! How can I help you today?";
    } else if (input.includes("time")) {
      intent = "get_time";
      reply = `🕒 Current time is ${new Date().toLocaleTimeString()}`;
    }

    res.json({ reply, intent, entities });
  } catch (err) {
    console.error("Predict route error:", err);
    res.status(500).json({ error: "Model prediction failed" });
  }
});

// ------------------------
// Latest Metrics
// ------------------------
router.get("/metrics", (req, res) => {
  try {
    const metricsFile = path.join(__dirname, "../reports/eval_v1.json"); // latest metrics
    if (!fs.existsSync(metricsFile)) {
      return res.status(404).json({ message: "Metrics file not found" });
    }
    const metrics = JSON.parse(fs.readFileSync(metricsFile, "utf-8"));
    res.json(metrics);
  } catch (err) {
    console.error("Metrics route error:", err);
    res.status(500).json({ message: "Failed to fetch metrics" });
  }
});

// ------------------------
// Versioned Metrics for Comparison
// ------------------------
router.get("/metrics/versions", (req, res) => {
  try {
    const reportsDir = path.join(__dirname, "../reports");
    const files = fs.readdirSync(reportsDir)
      .filter(f => f.startsWith("model_metadata") && f.endsWith(".json"))
      .sort((a, b) => {
        const vA = parseInt(a.match(/_v(\d+)\.json$/)[1]);
        const vB = parseInt(b.match(/_v(\d+)\.json$/)[1]);
        return vA - vB;
      });

    if (!files.length) return res.status(404).json({ message: "No model versions found" });

    const data = files.map(f => JSON.parse(fs.readFileSync(path.join(reportsDir, f), "utf-8")));
    res.json(data);
  } catch (err) {
    console.error("Error fetching model versions:", err);
    res.status(500).json({ message: "Failed to fetch model versions" });
  }
});

// ------------------------
// Confusion Matrix
// ------------------------
router.get("/confusion-matrix", (req, res) => {
  try {
    const cmPath = path.join(__dirname, "../reports/confusion_matrix.png");
    if (!fs.existsSync(cmPath)) return res.status(404).json({ message: "Confusion matrix not found" });
    res.sendFile(cmPath);
  } catch (err) {
    console.error("Confusion matrix route error:", err);
    res.status(500).json({ message: "Failed to fetch confusion matrix" });
  }
});

export default router;

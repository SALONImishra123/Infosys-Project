import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

// Fetch latest metrics
router.get("/", (req, res) => {
  try {
    const metricsFile = path.join("backend", "reports", "latest_metrics.json");
    if (!fs.existsSync(metricsFile)) return res.status(404).json({ message: "Metrics not found" });
    const data = JSON.parse(fs.readFileSync(metricsFile, "utf-8"));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch metrics" });
  }
});

// Fetch all model versions
router.get("/versions", (req, res) => {
  try {
    const reportsDir = path.join("backend", "reports");
    const files = fs.readdirSync(reportsDir)
      .filter(f => f.startsWith("model_metadata_v") && f.endsWith(".json"))
      .sort((a, b) => a.localeCompare(b));

    const versions = files.map(f => {
      return JSON.parse(fs.readFileSync(path.join(reportsDir, f), "utf-8"));
    });

    res.json(versions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch model versions" });
  }
});

export default router;

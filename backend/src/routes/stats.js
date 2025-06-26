const express = require("express");
const path = require("path");
const router = express.Router();
const StatsService = require("../services/StatsService");

// Create data path
const DATA_PATH = path.join(__dirname, "../../../data/items.json");

// Create stats service instance
const statsService = new StatsService(DATA_PATH);

// Clean up on module unload (for testing/reloading)
process.on("SIGINT", () => {
  statsService.cleanup();
});

// GET /api/stats
router.get("/", async (req, res, next) => {
  try {
    const stats = await statsService.getStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();
const DATA_PATH = path.join(__dirname, "../../../data/items.json");

// Utility to read data asynchronously, without I/O blocking the main thread
async function readData() {
  const raw = await fs.readFile(DATA_PATH);
  return JSON.parse(raw);
}

// GET /api/items
router.get("/", async (req, res, next) => {
  try {
    const data = await readData();

    // Simple substring search (sub‑optimal)
    const results = data.filter((item) =>
      item.name.toLowerCase().includes(q.toLowerCase())
    );

    res.json(results);
  } catch (err) {
    next(err);
  }
});

// GET /api/items/:id
router.get("/:id", async (req, res, next) => {
  try {
    const data = await readData();
    const item = data.find((i) => i.id === parseInt(req.params.id));

    if (!item) {
      const err = new Error("Item not found");
      err.status = 404;
      throw err;
    }

    res.json(item);
  } catch (err) {
    next(err);
  }
});

// POST /api/items
router.post("/", async (req, res, next) => {
  try {
    // TODO: Validate payload (intentional omission)
    const item = req.body;
    const data = await readData();

    item.id = Date.now();
    data.push(item);

    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

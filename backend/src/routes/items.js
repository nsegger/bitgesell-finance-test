const express = require("express");
const fs = require("fs").promises;
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
    const { q, limit, offset } = req.query;

    let filteredResults = data;

    // Apply search filter if query parameter exists
    // Simple substring search (sub‑optimal)
    if (q) {
      filteredResults = filteredResults.filter((item) =>
        item.name.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Store the total count before pagination
    const total = filteredResults.length;

    // Apply pagination if parameters exist
    let paginatedResults = filteredResults;
    if (limit !== undefined || offset !== undefined) {
      const startIndex = parseInt(offset) || 0;
      const endIndex = limit ? startIndex + parseInt(limit) : undefined;
      paginatedResults = filteredResults.slice(startIndex, endIndex);
    }

    res.json({ total, results: paginatedResults });
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
    // Validate payload
    const { name, price, description } = req.body;
    const errors = [];

    // Required field validation
    if (!name) errors.push("Name is required");
    if (price === undefined) errors.push("Price is required");

    // Type validation
    if (name && typeof name !== "string") errors.push("Name must be a string");
    if (price !== undefined && typeof price !== "number")
      errors.push("Price must be a number");
    if (price !== undefined && price < 0)
      errors.push("Price cannot be negative");
    if (description && typeof description !== "string")
      errors.push("Description must be a string");

    // Return validation errors if any
    if (errors.length > 0) {
      return res.status(400).json({
        error: "Validation failed",
        details: errors,
      });
    }

    const item = {
      name,
      price,
      description: description || "",
      id: Date.now(),
    };

    const data = await readData();
    data.push(item);

    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

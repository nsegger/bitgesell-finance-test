const request = require("supertest");
const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const itemsRouter = require("../src/routes/items");

// Mock data for tests
const mockItems = [
  { id: 1, name: "Test Item 1", category: "Test", price: 100 },
  { id: 2, name: "Test Item 2", category: "Test", price: 200 },
];

// Setup test app
const app = express();
app.use(express.json());
app.use("/api/items", itemsRouter);

// Mock fs.promises
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
  watchFile: jest.fn(),
}));

describe("Items API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fs.readFile.mockResolvedValue(JSON.stringify(mockItems));
  });

  describe("GET /api/items", () => {
    it("should return all items", async () => {
      const res = await request(app).get("/api/items");
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body).toEqual(mockItems);
    });

    it("should return filtered items when q parameter is provided", async () => {
      const res = await request(app).get("/api/items?q=Item 1");
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe("Test Item 1");
    });

    it("should limit results when limit parameter is provided", async () => {
      const res = await request(app).get("/api/items?limit=1");
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveLength(1);
    });

    it("should handle file read errors", async () => {
      fs.readFile.mockRejectedValue(new Error("File read error"));
      const res = await request(app).get("/api/items");
      expect(res.statusCode).toBe(500);
    });
  });

  describe("GET /api/items/:id", () => {
    it("should return a specific item by id", async () => {
      const res = await request(app).get("/api/items/1");
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(mockItems[0]);
    });

    it("should return 404 for non-existent item", async () => {
      const res = await request(app).get("/api/items/999");
      expect(res.statusCode).toBe(404);
    });
  });

  describe("POST /api/items", () => {
    it("should create a new item", async () => {
      const newItem = { name: "New Item", category: "New", price: 300 };
      const res = await request(app)
        .post("/api/items")
        .send(newItem)
        .set("Content-Type", "application/json");

      expect(res.statusCode).toBe(201);
      expect(res.body.name).toBe(newItem.name);
      expect(res.body.id).toBeDefined();
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it("should handle file write errors", async () => {
      fs.writeFile.mockRejectedValue(new Error("File write error"));
      const newItem = { name: "New Item", category: "New", price: 300 };
      const res = await request(app)
        .post("/api/items")
        .send(newItem)
        .set("Content-Type", "application/json");

      expect(res.statusCode).toBe(500);
    });
  });
});

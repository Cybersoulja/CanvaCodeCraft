import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Mock storage before importing routes
vi.mock("../storage", () => ({
  storage: {
    getAllGames: vi.fn(),
    getGame: vi.fn(),
    createGame: vi.fn(),
    updateGame: vi.fn(),
    getGameElements: vi.fn(),
  },
}));

import { registerRoutes } from "../routes";
import { storage } from "../storage";

const mockStorage = storage as {
  getAllGames: ReturnType<typeof vi.fn>;
  getGame: ReturnType<typeof vi.fn>;
  createGame: ReturnType<typeof vi.fn>;
  updateGame: ReturnType<typeof vi.fn>;
  getGameElements: ReturnType<typeof vi.fn>;
};

function createApp() {
  const app = express();
  // Use a generous limit so application-level size checks can be reached in tests
  app.use(express.json({ limit: "10mb" }));
  registerRoutes(app);
  return app;
}

const mockGame = {
  id: 1,
  name: "Test Game",
  scenes: [],
  inkScript: "=== start ===\nHello",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/games", () => {
  it("returns all games", async () => {
    mockStorage.getAllGames.mockResolvedValue([mockGame]);
    const res = await request(createApp()).get("/api/games");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([mockGame]);
  });

  it("returns an empty array when there are no games", async () => {
    mockStorage.getAllGames.mockResolvedValue([]);
    const res = await request(createApp()).get("/api/games");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe("GET /api/games/:id", () => {
  it("returns the game when found", async () => {
    mockStorage.getGame.mockResolvedValue(mockGame);
    const res = await request(createApp()).get("/api/games/1");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockGame);
  });

  it("returns 404 when game is not found", async () => {
    mockStorage.getGame.mockResolvedValue(undefined);
    const res = await request(createApp()).get("/api/games/999");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Game not found" });
  });
});

describe("POST /api/games", () => {
  it("creates and returns a new game with valid data", async () => {
    mockStorage.createGame.mockResolvedValue(mockGame);
    const res = await request(createApp())
      .post("/api/games")
      .send({ name: "Test Game", scenes: [], inkScript: "" });
    expect(res.status).toBe(200);
    expect(res.body).toEqual(mockGame);
  });

  it("returns 400 for invalid game data (missing name)", async () => {
    const res = await request(createApp())
      .post("/api/games")
      .send({ scenes: [], inkScript: "" });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ message: "Invalid game data" });
  });

  it("returns 400 for invalid game data (missing scenes)", async () => {
    const res = await request(createApp())
      .post("/api/games")
      .send({ name: "Game", inkScript: "" });
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/games/:id", () => {
  it("updates and returns the game", async () => {
    const updated = { ...mockGame, name: "Updated" };
    mockStorage.updateGame.mockResolvedValue(updated);
    const res = await request(createApp())
      .patch("/api/games/1")
      .send({ name: "Updated" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated");
  });

  it("returns 404 when game to update is not found", async () => {
    mockStorage.updateGame.mockResolvedValue(undefined);
    const res = await request(createApp())
      .patch("/api/games/999")
      .send({ name: "Updated" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ message: "Game not found" });
  });
});

describe("GET /api/elements", () => {
  it("returns game elements", async () => {
    const elements = [{ id: 1, type: "button", properties: { text: "Click" } }];
    mockStorage.getGameElements.mockResolvedValue(elements);
    const res = await request(createApp()).get("/api/elements");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(elements);
  });
});

describe("POST /api/export/zip - validation", () => {
  it("returns 400 when files field is missing", async () => {
    const res = await request(createApp())
      .post("/api/export/zip")
      .send({ gameName: "test" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid files data");
  });

  it("returns 400 when files is not an object", async () => {
    const res = await request(createApp())
      .post("/api/export/zip")
      .send({ files: "bad", gameName: "test" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid files data");
  });

  it("returns 400 when more than 10 files are provided", async () => {
    const files: Record<string, string> = {};
    for (let i = 0; i < 11; i++) {
      files[`file${i}`] = "content";
    }
    const res = await request(createApp())
      .post("/api/export/zip")
      .send({ files, gameName: "test" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Too many files");
  });

  it("returns 400 for a filename not on the allowlist", async () => {
    const res = await request(createApp())
      .post("/api/export/zip")
      .send({ files: { "../../etc/passwd": "evil" }, gameName: "test" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid filename/);
  });

  it("returns 400 for another disallowed filename (scripts.js)", async () => {
    const res = await request(createApp())
      .post("/api/export/zip")
      .send({ files: { "scripts.js": "alert(1)" }, gameName: "test" });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid filename/);
  });

  it("returns 400 when file content exceeds 5MB", async () => {
    const largeContent = "x".repeat(5 * 1024 * 1024 + 1);
    const res = await request(createApp())
      .post("/api/export/zip")
      .send({ files: { "game.json": largeContent }, gameName: "test" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid file content");
  });

  it("returns 400 when file content is not a string", async () => {
    const res = await request(createApp())
      .post("/api/export/zip")
      .send({ files: { "game.json": 12345 }, gameName: "test" });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid file content");
  });

  it("accepts files exactly at the 10-file limit", async () => {
    // 10 files, but only up to 4 allowed filenames — this tests the file count check
    // passes file count check (≤10), then hits filename check
    const files: Record<string, string> = {};
    for (let i = 0; i < 10; i++) {
      files[`file${i}`] = "x";
    }
    const res = await request(createApp())
      .post("/api/export/zip")
      .send({ files, gameName: "test" });
    // Fails on invalid filename, not on too many files
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Invalid filename/);
  });

  it("sanitizes the game name in Content-Disposition header for valid files", async () => {
    const files = { "game.json": '{"name":"test"}' };
    const res = await request(createApp())
      .post("/api/export/zip")
      .send({ files, gameName: "My Game! @#" });
    // Should succeed and return a ZIP (status 200 with zip content-type)
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("application/zip");
    expect(res.headers["content-disposition"]).toContain("My_Game__");
  });

  it("falls back to 'game' as zip name when gameName is not provided", async () => {
    const files = { "game.json": "{}" };
    const res = await request(createApp())
      .post("/api/export/zip")
      .send({ files });
    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toContain("game.zip");
  });
});

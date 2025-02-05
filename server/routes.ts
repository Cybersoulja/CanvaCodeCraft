import { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertGameSchema } from "@shared/schema";

export function registerRoutes(app: Express) {
  const router = app;

  // Get all games
  router.get("/api/games", async (req, res) => {
    const games = await storage.getAllGames();
    res.json(games);
  });

  // Get a specific game
  router.get("/api/games/:id", async (req, res) => {
    const game = await storage.getGame(parseInt(req.params.id));
    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }
    res.json(game);
  });

  // Create a new game
  router.post("/api/games", async (req, res) => {
    const result = insertGameSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ message: "Invalid game data" });
      return;
    }
    const game = await storage.createGame(result.data);
    res.json(game);
  });

  // Update a game
  router.patch("/api/games/:id", async (req, res) => {
    const game = await storage.updateGame(parseInt(req.params.id), req.body);
    if (!game) {
      res.status(404).json({ message: "Game not found" });
      return;
    }
    res.json(game);
  });

  // Get game elements library
  router.get("/api/elements", async (req, res) => {
    const elements = await storage.getGameElements();
    res.json(elements);
  });

  return createServer(app);
}

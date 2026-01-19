import { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertGameSchema } from "@shared/schema";
import archiver from "archiver";

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

  // Export game as ZIP
  router.post("/api/export/zip", async (req, res) => {
    try {
      const { files, gameName } = req.body;
      
      if (!files || typeof files !== 'object') {
        res.status(400).json({ message: "Invalid files data" });
        return;
      }

      const allowedFilenames = ['game.json', 'story.ink', 'index.html', 'README.md'];
      const maxFiles = 10;
      const maxFileSize = 5 * 1024 * 1024; // 5MB per file

      const fileEntries = Object.entries(files);
      if (fileEntries.length > maxFiles) {
        res.status(400).json({ message: "Too many files" });
        return;
      }

      for (const [filename, content] of fileEntries) {
        if (!allowedFilenames.includes(filename)) {
          res.status(400).json({ message: `Invalid filename: ${filename}` });
          return;
        }
        if (typeof content !== 'string' || content.length > maxFileSize) {
          res.status(400).json({ message: "Invalid file content" });
          return;
        }
      }

      const safeGameName = (gameName || 'game').replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${safeGameName}.zip"`);

      const archive = archiver('zip', { zlib: { level: 9 } });
      
      let errorOccurred = false;
      archive.on('error', (err) => {
        if (!errorOccurred) {
          errorOccurred = true;
          if (!res.headersSent) {
            res.status(500).json({ message: err.message });
          } else {
            res.destroy();
          }
        }
      });

      archive.pipe(res);

      for (const [filename, content] of fileEntries) {
        archive.append(content as string, { name: filename });
      }

      await archive.finalize();
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to create ZIP file" });
      }
    }
  });

  return createServer(app);
}

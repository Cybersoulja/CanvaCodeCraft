import { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertGameSchema, type ExportFormat, type ExportJob } from "@shared/schema";
import archiver from "archiver";

const EXPORT_FORMATS: ExportFormat[] = ["json", "ink", "html", "zip"];
const MAX_EXPORT_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_ZIP_FILENAMES = ["game.json", "story.ink", "index.html", "README.md"];
const MAX_ZIP_FILES = 10;

const EXPORT_MIME_TYPES: Record<ExportFormat, string> = {
  json: "application/json",
  ink: "text/plain",
  html: "text/html",
  zip: "application/zip",
};

function buildZipBuffer(files: Record<string, string>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const chunks: Buffer[] = [];
    archive.on("data", (chunk) => chunks.push(chunk));
    archive.on("error", reject);
    archive.on("end", () => resolve(Buffer.concat(chunks)));
    for (const [filename, content] of Object.entries(files)) {
      archive.append(content, { name: filename });
    }
    archive.finalize();
  });
}

function jobSummary(job: ExportJob) {
  const { fileData, ...summary } = job;
  return summary;
}

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

  // List export history for a game
  router.get("/api/games/:gameId/exports", async (req, res) => {
    const gameId = parseInt(req.params.gameId);
    if (isNaN(gameId)) {
      res.status(400).json({ message: "Invalid game id" });
      return;
    }
    const jobs = await storage.listExportJobs(gameId);
    res.json(jobs.map(jobSummary));
  });

  // Get export job status
  router.get("/api/exports/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid export id" });
      return;
    }
    const job = await storage.getExportJob(id);
    if (!job) {
      res.status(404).json({ message: "Export job not found" });
      return;
    }
    res.json(jobSummary(job));
  });

  // Download the completed export file
  router.get("/api/exports/:id/download", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ message: "Invalid export id" });
      return;
    }
    const job = await storage.getExportJob(id);
    if (!job) {
      res.status(404).json({ message: "Export job not found" });
      return;
    }
    if (job.status !== "completed" || !job.fileData) {
      res.status(409).json({ message: `Export is ${job.status}`, status: job.status });
      return;
    }
    res.setHeader("Content-Type", job.mimeType);
    res.setHeader("Content-Disposition", `attachment; filename="${job.fileName}"`);
    res.send(Buffer.from(job.fileData, "base64"));
  });

  // Create an export job. JSON/Ink/HTML are generated client-side and
  // completed immediately; ZIP packages are built asynchronously in the
  // background so the request returns without blocking on archiving.
  router.post("/api/exports", async (req, res) => {
    try {
      const { gameId, format, gameName, content, files } = req.body;

      if (!EXPORT_FORMATS.includes(format)) {
        res.status(400).json({ message: "Invalid export format" });
        return;
      }

      const resolvedGameId =
        typeof gameId === "number" && Number.isInteger(gameId) ? gameId : null;
      const safeGameName = (gameName || "game").replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 50);
      const extension = format === "json" ? "json" : format === "ink" ? "ink" : format === "html" ? "html" : "zip";
      const fileName = `${safeGameName}.${extension}`;

      if (format === "zip") {
        if (!files || typeof files !== "object") {
          res.status(400).json({ message: "Invalid files data" });
          return;
        }

        const fileEntries = Object.entries(files);
        if (fileEntries.length > MAX_ZIP_FILES) {
          res.status(400).json({ message: "Too many files" });
          return;
        }

        for (const [filename, fileContent] of fileEntries) {
          if (!ALLOWED_ZIP_FILENAMES.includes(filename)) {
            res.status(400).json({ message: `Invalid filename: ${filename}` });
            return;
          }
          if (typeof fileContent !== "string" || fileContent.length > MAX_EXPORT_SIZE) {
            res.status(400).json({ message: "Invalid file content" });
            return;
          }
        }

        const job = await storage.createExportJob({
          gameId: resolvedGameId,
          format,
          fileName,
          mimeType: EXPORT_MIME_TYPES.zip,
        });
        res.status(202).json(jobSummary(job));

        buildZipBuffer(files as Record<string, string>)
          .then((buffer) => storage.completeExportJob(job.id, buffer.toString("base64")))
          .catch((err) =>
            storage.failExportJob(job.id, err instanceof Error ? err.message : "Failed to build export")
          );
        return;
      }

      const contentRequired = format !== "ink"; // an empty .ink script is a valid export
      if (
        typeof content !== "string" ||
        (contentRequired && content.length === 0) ||
        content.length > MAX_EXPORT_SIZE
      ) {
        res.status(400).json({ message: "Invalid export content" });
        return;
      }

      const job = await storage.createExportJob({
        gameId: resolvedGameId,
        format,
        fileName,
        mimeType: EXPORT_MIME_TYPES[format as ExportFormat],
      });
      const completed = await storage.completeExportJob(
        job.id,
        Buffer.from(content, "utf-8").toString("base64")
      );
      res.status(201).json(jobSummary(completed!));
    } catch (error) {
      if (!res.headersSent) {
        res.status(500).json({ message: "Failed to create export" });
      }
    }
  });

  return createServer(app);
}

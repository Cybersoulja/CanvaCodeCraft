import {
  games,
  gameElements,
  exportJobs,
  type Game,
  type GameElementModel,
  type InsertGame,
  type InsertGameElement,
  type ExportJob,
  type ExportFormat,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, inArray } from "drizzle-orm";

export interface IStorage {
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<Game>): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;
  getGameElements(): Promise<GameElementModel[]>;
  createExportJob(job: {
    gameId: number | null;
    format: ExportFormat;
    fileName: string;
    mimeType: string;
  }): Promise<ExportJob>;
  completeExportJob(id: number, fileData: string): Promise<ExportJob | undefined>;
  failExportJob(id: number, errorMessage: string): Promise<ExportJob | undefined>;
  getExportJob(id: number): Promise<ExportJob | undefined>;
  listExportJobs(gameId: number, limit?: number): Promise<ExportJob[]>;
  /** Marks jobs left in pending/processing by a prior process (e.g. a restart mid-export) as failed. */
  recoverInterruptedExportJobs(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getGame(id: number): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game || undefined;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db
      .insert(games)
      .values(game)
      .returning();
    return newGame;
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const [game] = await db
      .update(games)
      .set(updates)
      .where(eq(games.id, id))
      .returning();
    return game;
  }

  async getAllGames(): Promise<Game[]> {
    return await db.select().from(games);
  }

  async getGameElements(): Promise<GameElementModel[]> {
    // Add some default elements if none exist
    const elements = await db.select().from(gameElements);
    if (elements.length === 0) {
      await db.insert(gameElements).values([
        {
          type: "button",
          properties: { text: "Click Me", color: "#000000" }
        },
        {
          type: "text", 
          properties: { text: "Sample Text", fontSize: 16, color: "#000000" }
        }
      ]);
      return await db.select().from(gameElements);
    }
    return elements;
  }

  async createExportJob(job: {
    gameId: number | null;
    format: ExportFormat;
    fileName: string;
    mimeType: string;
  }): Promise<ExportJob> {
    const [created] = await db
      .insert(exportJobs)
      .values({
        gameId: job.gameId,
        format: job.format,
        fileName: job.fileName,
        mimeType: job.mimeType,
        status: "processing",
      })
      .returning();
    return created;
  }

  async completeExportJob(id: number, fileData: string): Promise<ExportJob | undefined> {
    const [updated] = await db
      .update(exportJobs)
      .set({ status: "completed", fileData, completedAt: new Date() })
      .where(eq(exportJobs.id, id))
      .returning();
    return updated;
  }

  async failExportJob(id: number, errorMessage: string): Promise<ExportJob | undefined> {
    const [updated] = await db
      .update(exportJobs)
      .set({ status: "failed", errorMessage, completedAt: new Date() })
      .where(eq(exportJobs.id, id))
      .returning();
    return updated;
  }

  async getExportJob(id: number): Promise<ExportJob | undefined> {
    const [job] = await db.select().from(exportJobs).where(eq(exportJobs.id, id));
    return job || undefined;
  }

  async listExportJobs(gameId: number, limit = 20): Promise<ExportJob[]> {
    return await db
      .select()
      .from(exportJobs)
      .where(eq(exportJobs.gameId, gameId))
      .orderBy(desc(exportJobs.createdAt))
      .limit(limit);
  }

  async recoverInterruptedExportJobs(): Promise<void> {
    await db
      .update(exportJobs)
      .set({
        status: "failed",
        errorMessage: "Export was interrupted by a server restart",
        completedAt: new Date(),
      })
      .where(inArray(exportJobs.status, ["pending", "processing"]));
  }
}

export const storage = new DatabaseStorage();
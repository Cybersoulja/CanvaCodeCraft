import {
  games,
  gameElements,
  exportJobs,
  canvaConnections,
  canvaAssets,
  type Game,
  type GameElementModel,
  type InsertGame,
  type InsertGameElement,
  type ExportJob,
  type ExportFormat,
  type CanvaConnection,
  type CanvaAsset,
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
  getCanvaConnection(): Promise<CanvaConnection | undefined>;
  saveCanvaConnection(connection: {
    accessToken: string;
    refreshToken: string;
    scope: string;
    expiresAt: Date;
    canvaUserId?: string | null;
  }): Promise<CanvaConnection>;
  clearCanvaConnection(): Promise<void>;
  createCanvaAsset(asset: {
    canvaAssetId: string;
    name: string;
    mimeType: string;
    fileData: string;
  }): Promise<CanvaAsset>;
  getCanvaAsset(id: number): Promise<CanvaAsset | undefined>;
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

  async getCanvaConnection(): Promise<CanvaConnection | undefined> {
    const [connection] = await db.select().from(canvaConnections).limit(1);
    return connection || undefined;
  }

  async saveCanvaConnection(connection: {
    accessToken: string;
    refreshToken: string;
    scope: string;
    expiresAt: Date;
    canvaUserId?: string | null;
  }): Promise<CanvaConnection> {
    const existing = await this.getCanvaConnection();
    if (existing) {
      const [updated] = await db
        .update(canvaConnections)
        .set(connection)
        .where(eq(canvaConnections.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(canvaConnections).values(connection).returning();
    return created;
  }

  async clearCanvaConnection(): Promise<void> {
    await db.delete(canvaConnections);
  }

  async createCanvaAsset(asset: {
    canvaAssetId: string;
    name: string;
    mimeType: string;
    fileData: string;
  }): Promise<CanvaAsset> {
    const [created] = await db.insert(canvaAssets).values(asset).returning();
    return created;
  }

  async getCanvaAsset(id: number): Promise<CanvaAsset | undefined> {
    const [asset] = await db.select().from(canvaAssets).where(eq(canvaAssets.id, id));
    return asset || undefined;
  }
}

export const storage = new DatabaseStorage();
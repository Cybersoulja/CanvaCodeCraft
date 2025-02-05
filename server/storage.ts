import { games, gameElements, type Game, type GameElementModel, type InsertGame, type InsertGameElement } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<Game>): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;
  getGameElements(): Promise<GameElementModel[]>;
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
}

export const storage = new DatabaseStorage();
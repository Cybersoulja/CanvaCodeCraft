import { games, gameElements, type Game, type GameElementModel, type InsertGame, type InsertGameElement } from "@shared/schema";

export interface IStorage {
  getGame(id: number): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: number, game: Partial<Game>): Promise<Game | undefined>;
  getAllGames(): Promise<Game[]>;
  getGameElements(): Promise<GameElementModel[]>;
}

export class MemStorage implements IStorage {
  private games: Map<number, Game>;
  private gameElements: Map<number, GameElementModel>;
  private currentGameId: number;
  private currentElementId: number;

  constructor() {
    this.games = new Map();
    this.gameElements = new Map();
    this.currentGameId = 1;
    this.currentElementId = 1;
    
    // Populate some default game elements
    this.gameElements.set(1, {
      id: 1,
      type: "button",
      properties: { text: "Click Me", color: "#000000" }
    });
    this.gameElements.set(2, {
      id: 2,
      type: "text",
      properties: { text: "Sample Text", fontSize: 16, color: "#000000" }
    });
  }

  async getGame(id: number): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async createGame(game: InsertGame): Promise<Game> {
    const id = this.currentGameId++;
    const newGame = { ...game, id };
    this.games.set(id, newGame);
    return newGame;
  }

  async updateGame(id: number, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    
    const updatedGame = { ...game, ...updates };
    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async getAllGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGameElements(): Promise<GameElementModel[]> {
    return Array.from(this.gameElements.values());
  }
}

export const storage = new MemStorage();

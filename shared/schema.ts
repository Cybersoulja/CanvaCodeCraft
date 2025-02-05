import { pgTable, text, serial, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  scenes: jsonb("scenes").$type<Scene[]>().notNull(),
  inkScript: text("ink_script").notNull(),
});

export const gameElements = pgTable("game_elements", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // button, image, text
  properties: jsonb("properties").$type<ElementProperties>().notNull(),
});

export type Scene = {
  id: string;
  name: string;
  elements: GameElement[];
};

export type GameElement = {
  id: string;
  type: string; 
  x: number;
  y: number;
  width: number;
  height: number;
  properties: ElementProperties;
};

export type ElementProperties = {
  text?: string;
  fontSize?: number;
  color?: string;
  imageUrl?: string;
  onClick?: string;
};

export const insertGameSchema = createInsertSchema(games);
export const insertGameElementSchema = createInsertSchema(gameElements);

export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertGameElement = z.infer<typeof insertGameElementSchema>;
export type Game = typeof games.$inferSelect;
export type GameElementModel = typeof gameElements.$inferSelect;

import { pgTable, text, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
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

export const exportJobs = pgTable("export_jobs", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id"),
  format: text("format").notNull(), // json | ink | html | zip
  status: text("status").notNull().default("pending"), // pending | processing | completed | failed
  fileName: text("file_name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileData: text("file_data"), // base64-encoded file content, set once completed
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
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
  inkVariable?: string;
};

export const insertGameSchema = createInsertSchema(games);
export const insertGameElementSchema = createInsertSchema(gameElements);

export type InsertGame = z.infer<typeof insertGameSchema>;
export type InsertGameElement = z.infer<typeof insertGameElementSchema>;
export type Game = typeof games.$inferSelect;
export type GameElementModel = typeof gameElements.$inferSelect;

export type ExportFormat = "json" | "ink" | "html" | "zip";
export type ExportStatus = "pending" | "processing" | "completed" | "failed";
export type ExportJob = typeof exportJobs.$inferSelect;
export type NewExportJob = typeof exportJobs.$inferInsert;
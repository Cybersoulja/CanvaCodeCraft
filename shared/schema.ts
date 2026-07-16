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

// Single-row table: this app has no multi-user auth yet, so the Canva
// OAuth connection is one shared connection for the whole instance.
export const canvaConnections = pgTable("canva_connections", {
  id: serial("id").primaryKey(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  scope: text("scope").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  canvaUserId: text("canva_user_id"),
  connectedAt: timestamp("connected_at").notNull().defaultNow(),
});

// Canva asset thumbnail URLs expire after ~15 minutes, so imported
// assets are downloaded once and persisted here (same pattern as
// exportJobs.fileData) rather than storing the short-lived URL.
export const canvaAssets = pgTable("canva_assets", {
  id: serial("id").primaryKey(),
  canvaAssetId: text("canva_asset_id").notNull(),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  fileData: text("file_data").notNull(), // base64-encoded image bytes
  importedAt: timestamp("imported_at").notNull().defaultNow(),
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

export type CanvaConnection = typeof canvaConnections.$inferSelect;
export type NewCanvaConnection = typeof canvaConnections.$inferInsert;
export type CanvaAsset = typeof canvaAssets.$inferSelect;
export type NewCanvaAsset = typeof canvaAssets.$inferInsert;
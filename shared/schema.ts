import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (from the original file)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Media files schema for videos, pdfs, webgl content
export const mediaFiles = pgTable("media_files", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  fileType: text("file_type").notNull(), // video, pdf, webgl
  uploadDate: timestamp("upload_date").defaultNow().notNull(),
  duration: integer("duration"), // for videos in seconds
  resolution: text("resolution"), // for videos (e.g., "1920x1080")
  pageCount: integer("page_count"), // for PDFs
});

export const insertMediaFileSchema = createInsertSchema(mediaFiles).omit({
  id: true,
  uploadDate: true,
});

export type InsertMediaFile = z.infer<typeof insertMediaFileSchema>;
export type MediaFile = typeof mediaFiles.$inferSelect;

// Audio recordings schema
export const audioRecordings = pgTable("audio_recordings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  duration: integer("duration").notNull(), // in seconds
  dateRecorded: timestamp("date_recorded").defaultNow().notNull(),
  format: text("format").notNull(), // audio format (e.g., "audio/webm", "audio/mp3")
});

export const insertAudioRecordingSchema = createInsertSchema(audioRecordings).omit({
  id: true,
  dateRecorded: true,
});

export type InsertAudioRecording = z.infer<typeof insertAudioRecordingSchema>;
export type AudioRecording = typeof audioRecordings.$inferSelect;

// WebGL asset schema
export const webglAssets = pgTable("webgl_assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  dateUploaded: timestamp("date_uploaded").defaultNow().notNull(),
  format: text("format").notNull(), // GLB/GLTF format
});

export const insertWebglAssetSchema = createInsertSchema(webglAssets).omit({
  id: true,
  dateUploaded: true,
});

export type InsertWebglAsset = z.infer<typeof insertWebglAssetSchema>;
export type WebglAsset = typeof webglAssets.$inferSelect;

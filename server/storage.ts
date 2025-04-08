import { 
  users, type User, type InsertUser,
  mediaFiles, type MediaFile, type InsertMediaFile,
  audioRecordings, type AudioRecording, type InsertAudioRecording,
  webglAssets, type WebglAsset, type InsertWebglAsset
} from "@shared/schema";
import fs from "fs";
import path from "path";

// Define the storage interface
export interface IStorage {
  // User methods (from original file)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Media file methods (videos, PDFs)
  getMediaFiles(fileType?: string): Promise<MediaFile[]>;
  getMediaFileById(id: number): Promise<MediaFile | undefined>;
  createMediaFile(file: InsertMediaFile): Promise<MediaFile>;
  deleteMediaFile(id: number): Promise<boolean>;

  // Audio recording methods
  getAudioRecordings(): Promise<AudioRecording[]>;
  getAudioRecordingById(id: number): Promise<AudioRecording | undefined>;
  createAudioRecording(recording: InsertAudioRecording): Promise<AudioRecording>;
  updateAudioRecording(id: number, updates: Partial<AudioRecording>): Promise<AudioRecording | undefined>;
  deleteAudioRecording(id: number): Promise<boolean>;

  // WebGL asset methods
  getWebGLAssets(): Promise<WebglAsset[]>;
  getWebGLAssetById(id: number): Promise<WebglAsset | undefined>;
  createWebGLAsset(asset: InsertWebglAsset): Promise<WebglAsset>;
  deleteWebGLAsset(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private mediaFilesMap: Map<number, MediaFile>;
  private audioRecordingsMap: Map<number, AudioRecording>;
  private webglAssetsMap: Map<number, WebglAsset>;
  
  private currentUserId: number;
  private currentMediaFileId: number;
  private currentAudioRecordingId: number;
  private currentWebglAssetId: number;

  constructor() {
    this.users = new Map();
    this.mediaFilesMap = new Map();
    this.audioRecordingsMap = new Map();
    this.webglAssetsMap = new Map();
    
    this.currentUserId = 1;
    this.currentMediaFileId = 1;
    this.currentAudioRecordingId = 1;
    this.currentWebglAssetId = 1;
  }

  // User methods (from original file)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Media file methods
  async getMediaFiles(fileType?: string): Promise<MediaFile[]> {
    const files = Array.from(this.mediaFilesMap.values());
    if (fileType) {
      return files.filter(file => file.fileType === fileType);
    }
    return files;
  }

  async getMediaFileById(id: number): Promise<MediaFile | undefined> {
    return this.mediaFilesMap.get(id);
  }

  async createMediaFile(file: InsertMediaFile): Promise<MediaFile> {
    const id = this.currentMediaFileId++;
    const now = new Date();
    const mediaFile: MediaFile = {
      ...file,
      id,
      uploadDate: now
    };
    this.mediaFilesMap.set(id, mediaFile);
    return mediaFile;
  }

  async deleteMediaFile(id: number): Promise<boolean> {
    // Get the file info to delete the physical file
    const file = this.mediaFilesMap.get(id);
    if (!file) return false;

    try {
      // Delete file from filesystem
      const filePath = path.join(process.cwd(), 'uploads', file.fileType + 's', file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete from map
      return this.mediaFilesMap.delete(id);
    } catch (error) {
      console.error(`Error deleting media file ${id}:`, error);
      return false;
    }
  }

  // Audio recording methods
  async getAudioRecordings(): Promise<AudioRecording[]> {
    return Array.from(this.audioRecordingsMap.values());
  }

  async getAudioRecordingById(id: number): Promise<AudioRecording | undefined> {
    return this.audioRecordingsMap.get(id);
  }

  async createAudioRecording(recording: InsertAudioRecording): Promise<AudioRecording> {
    const id = this.currentAudioRecordingId++;
    const now = new Date();
    const audioRecording: AudioRecording = {
      ...recording,
      id,
      dateRecorded: now
    };
    this.audioRecordingsMap.set(id, audioRecording);
    return audioRecording;
  }

  async updateAudioRecording(id: number, updates: Partial<AudioRecording>): Promise<AudioRecording | undefined> {
    const recording = this.audioRecordingsMap.get(id);
    if (!recording) return undefined;

    const updatedRecording = { ...recording, ...updates };
    this.audioRecordingsMap.set(id, updatedRecording);
    return updatedRecording;
  }

  async deleteAudioRecording(id: number): Promise<boolean> {
    const recording = this.audioRecordingsMap.get(id);
    if (!recording) return false;

    try {
      // Delete file from filesystem
      const filePath = path.join(process.cwd(), 'uploads', 'audio', recording.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete from map
      return this.audioRecordingsMap.delete(id);
    } catch (error) {
      console.error(`Error deleting audio recording ${id}:`, error);
      return false;
    }
  }

  // WebGL asset methods
  async getWebGLAssets(): Promise<WebglAsset[]> {
    return Array.from(this.webglAssetsMap.values());
  }

  async getWebGLAssetById(id: number): Promise<WebglAsset | undefined> {
    return this.webglAssetsMap.get(id);
  }

  async createWebGLAsset(asset: InsertWebglAsset): Promise<WebglAsset> {
    const id = this.currentWebglAssetId++;
    const now = new Date();
    const webglAsset: WebglAsset = {
      ...asset,
      id,
      dateUploaded: now
    };
    this.webglAssetsMap.set(id, webglAsset);
    return webglAsset;
  }

  async deleteWebGLAsset(id: number): Promise<boolean> {
    const asset = this.webglAssetsMap.get(id);
    if (!asset) return false;

    try {
      // Delete file from filesystem
      const filePath = path.join(process.cwd(), 'uploads', 'webgl', asset.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete from map
      return this.webglAssetsMap.delete(id);
    } catch (error) {
      console.error(`Error deleting WebGL asset ${id}:`, error);
      return false;
    }
  }
}

// Export a singleton instance
export const storage = new MemStorage();

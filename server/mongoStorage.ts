import { MediaFile } from './models/mediaFile';
import { AudioRecording } from './models/mediaFile';
import { WebglAsset } from './models/mediaFile';
import { streamFileToGridFS, deleteFileFromGridFS } from './mongodb';
import fs from 'fs';
import path from 'path';
import { 
  type User, type InsertUser,
  type MediaFile as MediaFileType, type InsertMediaFile,
  type AudioRecording as AudioRecordingType, type InsertAudioRecording,
  type WebglAsset as WebglAssetType, type InsertWebglAsset
} from "@shared/schema";

// Define the storage interface
import { IStorage } from './storage';

// MongoDB storage implementation
export class MongoStorage implements IStorage {
  // User methods - simplified for this example as we're focusing on media
  async getUser(id: number): Promise<User | undefined> {
    // MongoDB doesn't use sequential IDs but ObjectIds
    return undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Mock implementation for compatibility
    return { ...insertUser, id: 1 };
  }

  // Media file methods
  async getMediaFiles(fileType?: string): Promise<MediaFileType[]> {
    try {
      let query = fileType ? { fileType } : {};
      const mediaFiles = await MediaFile.find(query).sort({ uploadDate: -1 });
      
      // Convert MongoDB documents to expected interface format
      return mediaFiles.map(file => ({
        id: parseInt(file._id.toString().substring(0, 8), 16), // Generate numeric ID from ObjectId
        originalName: file.originalName,
        filename: file.filename,
        fileType: file.fileType,
        mimeType: file.mimeType,
        size: file.size,
        duration: file.duration,
        resolution: file.resolution,
        pageCount: file.pageCount,
        uploadDate: file.uploadDate
      }));
    } catch (error) {
      console.error('Error fetching media files:', error);
      return [];
    }
  }

  async getMediaFileById(id: number): Promise<MediaFileType | undefined> {
    try {
      // Since we're using MongoDB ObjectIds, we can't directly query by numeric id
      // This is a simplified approach to find a document by position in collection
      const files = await this.getMediaFiles();
      return files.find(file => file.id === id);
    } catch (error) {
      console.error(`Error fetching media file with id ${id}:`, error);
      return undefined;
    }
  }

  async createMediaFile(file: InsertMediaFile): Promise<MediaFileType> {
    try {
      // First, store the file in GridFS
      const filePath = path.join(process.cwd(), 'uploads', file.fileType + 's', file.filename);
      const metadata = {
        originalName: file.originalName,
        fileType: file.fileType,
        mimeType: file.mimeType
      };
      
      const fileId = await streamFileToGridFS(filePath, file.filename, metadata);
      
      // Now save the file metadata
      const newFile = new MediaFile({
        originalName: file.originalName,
        filename: file.filename,
        fileId,
        fileType: file.fileType,
        mimeType: file.mimeType,
        size: file.size,
        duration: file.duration || null,
        resolution: file.resolution || null,
        pageCount: file.pageCount || null
      });
      
      await newFile.save();
      
      // Convert MongoDB document to expected interface format
      return {
        id: parseInt(newFile._id.toString().substring(0, 8), 16),
        originalName: newFile.originalName,
        filename: newFile.filename,
        fileType: newFile.fileType,
        mimeType: newFile.mimeType,
        size: newFile.size,
        duration: newFile.duration,
        resolution: newFile.resolution,
        pageCount: newFile.pageCount,
        uploadDate: newFile.uploadDate
      };
    } catch (error) {
      console.error('Error creating media file:', error);
      throw error;
    }
  }

  async deleteMediaFile(id: number): Promise<boolean> {
    try {
      // Find the file by our numeric ID (this is a workaround)
      const files = await this.getMediaFiles();
      const file = files.find(f => f.id === id);
      if (!file) return false;
      
      // Find the actual MongoDB document
      const mongoFile = await MediaFile.findOne({ filename: file.filename });
      if (!mongoFile) return false;
      
      // Delete from GridFS
      await deleteFileFromGridFS(mongoFile.fileId);
      
      // Delete the metadata
      await MediaFile.deleteOne({ _id: mongoFile._id });
      
      return true;
    } catch (error) {
      console.error(`Error deleting media file ${id}:`, error);
      return false;
    }
  }

  // Audio recording methods
  async getAudioRecordings(): Promise<AudioRecordingType[]> {
    try {
      const recordings = await AudioRecording.find().sort({ dateRecorded: -1 });
      
      // Convert MongoDB documents to expected interface format
      return recordings.map(recording => ({
        id: parseInt(recording._id.toString().substring(0, 8), 16),
        name: recording.name,
        filename: recording.filename,
        duration: recording.duration,
        format: recording.format,
        size: recording.size,
        dateRecorded: recording.dateRecorded
      }));
    } catch (error) {
      console.error('Error fetching audio recordings:', error);
      return [];
    }
  }

  async getAudioRecordingById(id: number): Promise<AudioRecordingType | undefined> {
    try {
      // Simplified approach to find a document by position
      const recordings = await this.getAudioRecordings();
      return recordings.find(recording => recording.id === id);
    } catch (error) {
      console.error(`Error fetching audio recording with id ${id}:`, error);
      return undefined;
    }
  }

  async createAudioRecording(recording: InsertAudioRecording): Promise<AudioRecordingType> {
    try {
      // First, store the file in GridFS
      const filePath = path.join(process.cwd(), 'uploads', 'audio', recording.filename);
      const metadata = {
        name: recording.name,
        format: recording.format
      };
      
      const fileId = await streamFileToGridFS(filePath, recording.filename, metadata);
      
      // Now save the recording metadata
      const newRecording = new AudioRecording({
        name: recording.name,
        filename: recording.filename,
        fileId,
        duration: recording.duration,
        format: recording.format,
        size: recording.size
      });
      
      await newRecording.save();
      
      // Convert MongoDB document to expected interface format
      return {
        id: parseInt(newRecording._id.toString().substring(0, 8), 16),
        name: newRecording.name,
        filename: newRecording.filename,
        duration: newRecording.duration,
        format: newRecording.format,
        size: newRecording.size,
        dateRecorded: newRecording.dateRecorded
      };
    } catch (error) {
      console.error('Error creating audio recording:', error);
      throw error;
    }
  }

  async updateAudioRecording(id: number, updates: Partial<AudioRecordingType>): Promise<AudioRecordingType | undefined> {
    try {
      // Find the recording by our numeric ID (this is a workaround)
      const recordings = await this.getAudioRecordings();
      const recording = recordings.find(r => r.id === id);
      if (!recording) return undefined;
      
      // Find the actual MongoDB document
      const mongoRecording = await AudioRecording.findOne({ filename: recording.filename });
      if (!mongoRecording) return undefined;
      
      // Update fields
      if (updates.name) mongoRecording.name = updates.name;
      
      await mongoRecording.save();
      
      // Return updated recording
      return {
        id,
        name: mongoRecording.name,
        filename: mongoRecording.filename,
        duration: mongoRecording.duration,
        format: mongoRecording.format,
        size: mongoRecording.size,
        dateRecorded: mongoRecording.dateRecorded
      };
    } catch (error) {
      console.error(`Error updating audio recording ${id}:`, error);
      return undefined;
    }
  }

  async deleteAudioRecording(id: number): Promise<boolean> {
    try {
      // Find the recording by our numeric ID (this is a workaround)
      const recordings = await this.getAudioRecordings();
      const recording = recordings.find(r => r.id === id);
      if (!recording) return false;
      
      // Find the actual MongoDB document
      const mongoRecording = await AudioRecording.findOne({ filename: recording.filename });
      if (!mongoRecording) return false;
      
      // Delete from GridFS
      await deleteFileFromGridFS(mongoRecording.fileId);
      
      // Delete the metadata
      await AudioRecording.deleteOne({ _id: mongoRecording._id });
      
      return true;
    } catch (error) {
      console.error(`Error deleting audio recording ${id}:`, error);
      return false;
    }
  }

  // WebGL asset methods
  async getWebGLAssets(): Promise<WebglAssetType[]> {
    try {
      const assets = await WebglAsset.find().sort({ dateUploaded: -1 });
      
      // Convert MongoDB documents to expected interface format
      return assets.map(asset => ({
        id: parseInt(asset._id.toString().substring(0, 8), 16),
        name: asset.name,
        filename: asset.filename,
        format: asset.format,
        size: asset.size,
        description: asset.description,
        dateUploaded: asset.dateUploaded
      }));
    } catch (error) {
      console.error('Error fetching WebGL assets:', error);
      return [];
    }
  }

  async getWebGLAssetById(id: number): Promise<WebglAssetType | undefined> {
    try {
      // Simplified approach to find a document by position
      const assets = await this.getWebGLAssets();
      return assets.find(asset => asset.id === id);
    } catch (error) {
      console.error(`Error fetching WebGL asset with id ${id}:`, error);
      return undefined;
    }
  }

  async createWebGLAsset(asset: InsertWebglAsset): Promise<WebglAssetType> {
    try {
      // First, store the file in GridFS
      const filePath = path.join(process.cwd(), 'uploads', 'webgl', asset.filename);
      const metadata = {
        name: asset.name,
        format: asset.format
      };
      
      const fileId = await streamFileToGridFS(filePath, asset.filename, metadata);
      
      // Now save the asset metadata
      const newAsset = new WebglAsset({
        name: asset.name,
        filename: asset.filename,
        fileId,
        format: asset.format,
        size: asset.size,
        description: asset.description
      });
      
      await newAsset.save();
      
      // Convert MongoDB document to expected interface format
      return {
        id: parseInt(newAsset._id.toString().substring(0, 8), 16),
        name: newAsset.name,
        filename: newAsset.filename,
        format: newAsset.format,
        size: newAsset.size,
        description: newAsset.description,
        dateUploaded: newAsset.dateUploaded
      };
    } catch (error) {
      console.error('Error creating WebGL asset:', error);
      throw error;
    }
  }

  async deleteWebGLAsset(id: number): Promise<boolean> {
    try {
      // Find the asset by our numeric ID (this is a workaround)
      const assets = await this.getWebGLAssets();
      const asset = assets.find(a => a.id === id);
      if (!asset) return false;
      
      // Find the actual MongoDB document
      const mongoAsset = await WebglAsset.findOne({ filename: asset.filename });
      if (!mongoAsset) return false;
      
      // Delete from GridFS
      await deleteFileFromGridFS(mongoAsset.fileId);
      
      // Delete the metadata
      await WebglAsset.deleteOne({ _id: mongoAsset._id });
      
      return true;
    } catch (error) {
      console.error(`Error deleting WebGL asset ${id}:`, error);
      return false;
    }
  }
}
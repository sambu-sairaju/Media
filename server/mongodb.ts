import { MongoClient, Db, GridFSBucket } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import { log } from './vite';

// MongoDB connection URI (using environment variable or default)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mediaHub';
const DB_NAME = process.env.MONGODB_DB || 'mediaHub';

// MongoDB client instance
let client: MongoClient;
let db: Db;
let bucket: GridFSBucket;

// Connect to MongoDB and initialize GridFS bucket
export const connectToMongoDB = async () => {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    log('Connected to MongoDB');
    
    db = client.db(DB_NAME);
    
    // Initialize GridFS bucket only if db is defined
    if (db) {
      bucket = new GridFSBucket(db);
    } else {
      throw new Error('MongoDB database connection failed');
    }
    
    return { client, db, bucket };
  } catch (error) {
    log(`Error connecting to MongoDB: ${error}`);
    throw error;
  }
};

// Create upload directories for our different media types
export const createUploadDirectories = () => {
  const baseDir = path.join(process.cwd(), 'uploads');
  const directories = [
    baseDir,
    path.join(baseDir, 'videos'),
    path.join(baseDir, 'pdfs'),
    path.join(baseDir, 'audio'),
    path.join(baseDir, 'webgl')
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created directory: ${dir}`);
    }
  });
};

// Stream a file to GridFS and return the file ID
export const streamFileToGridFS = (filePath: string, filename: string, metadata: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Create a read stream from the file
    const readStream = fs.createReadStream(filePath);
    
    // Create a write stream to GridFS
    const uploadStream = bucket.openUploadStream(filename, {
      metadata
    });
    
    // Handle errors
    readStream.on('error', (error) => {
      log(`Error reading file at ${filePath}: ${error}`);
      reject(error);
    });
    
    uploadStream.on('error', (error) => {
      log(`Error uploading file to GridFS: ${error}`);
      reject(error);
    });
    
    // Handle completion with explicit typing
    uploadStream.on('finish', function(this: any) {
      // Use this._id as the file ID (properly typed with any)
      const fileId = this._id.toString();
      
      // Clean up the original file after successful upload
      fs.unlink(filePath, (err) => {
        if (err) {
          log(`Warning: Failed to delete temporary file at ${filePath}: ${err}`);
        }
      });
      
      resolve(fileId);
    });
    
    // Pipe the read stream to the upload stream
    readStream.pipe(uploadStream);
  });
};

// Get a download stream from GridFS by file ID
export const getStreamFromGridFS = (fileId: string) => {
  try {
    const { ObjectId } = require('mongodb');
    return bucket.openDownloadStream(new ObjectId(fileId));
  } catch (error) {
    log(`Error getting file stream from GridFS: ${error}`);
    throw error;
  }
};

// Delete a file from GridFS by file ID
export const deleteFileFromGridFS = async (fileId: string): Promise<boolean> => {
  try {
    const { ObjectId } = require('mongodb');
    await bucket.delete(new ObjectId(fileId));
    return true;
  } catch (error) {
    log(`Error deleting file from GridFS: ${error}`);
    return false;
  }
};

// List files in GridFS with optional filter
export const listFilesInGridFS = async (filter: any = {}) => {
  try {
    const cursor = bucket.find(filter);
    return await cursor.toArray();
  } catch (error) {
    log(`Error listing files in GridFS: ${error}`);
    return [];
  }
};
import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertMediaFileSchema } from '@shared/schema';
import { fromZodError } from 'zod-validation-error';
import fs from 'fs';
import path from 'path';
import { getFileSize, getMimeType, parseVideoMetadata } from '../utils/fileStorage';

// Get all videos
export const getAllVideos = async (req: Request, res: Response) => {
  try {
    const videos = await storage.getMediaFiles('video');
    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ message: 'Failed to fetch videos' });
  }
};

// Get video by ID
export const getVideoById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const video = await storage.getMediaFileById(id);
    if (!video || video.fileType !== 'video') {
      return res.status(404).json({ message: 'Video not found' });
    }

    res.json(video);
  } catch (error) {
    console.error('Error fetching video:', error);
    res.status(500).json({ message: 'Failed to fetch video' });
  }
};

// Stream video
export const streamVideo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const video = await storage.getMediaFileById(id);
    if (!video || video.fileType !== 'video') {
      return res.status(404).json({ message: 'Video not found' });
    }

    const videoPath = path.join(process.cwd(), 'uploads', 'videos', video.filename);
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ message: 'Video file not found' });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range request for video streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mimeType,
      };

      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      // Handle regular request
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType,
      };
      res.writeHead(200, headers);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming video:', error);
    res.status(500).json({ message: 'Failed to stream video' });
  }
};

// Upload video
export const uploadVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file uploaded' });
    }

    // Validate and prepare data for insertion
    const videoData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || getMimeType(req.file.originalname),
      size: req.file.size,
      fileType: 'video',
      duration: 0, // Default duration
      resolution: '', // Default resolution
      pageCount: null, // Not applicable for videos
    };
    
    try {
      // Try to extract video metadata if possible
      const videoPath = req.file.path;
      const metadata = await parseVideoMetadata(videoPath);
      if (metadata) {
        videoData.duration = metadata.duration || 0;
        videoData.resolution = metadata.resolution || '';
      }
    } catch (metadataError) {
      console.warn('Could not extract video metadata:', metadataError);
      // Continue without metadata - we'll use default values
    }

    // Validate with Zod schema
    const validationResult = insertMediaFileSchema.safeParse(videoData);
    if (!validationResult.success) {
      // Delete the uploaded file if validation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      const validationError = fromZodError(validationResult.error);
      return res.status(400).json({ message: 'Invalid video data', errors: validationError.details });
    }

    // Store video in database
    const savedVideo = await storage.createMediaFile(videoData);
    res.status(201).json(savedVideo);
  } catch (error) {
    console.error('Error uploading video:', error);
    
    // Clean up the file if an error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Failed to upload video' });
  }
};

// Delete video
export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid video ID' });
    }

    const video = await storage.getMediaFileById(id);
    if (!video || video.fileType !== 'video') {
      return res.status(404).json({ message: 'Video not found' });
    }

    const success = await storage.deleteMediaFile(id);
    if (!success) {
      return res.status(500).json({ message: 'Failed to delete video' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ message: 'Failed to delete video' });
  }
};

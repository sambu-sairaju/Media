import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertAudioRecordingSchema } from '@shared/schema';
import { fromZodError } from 'zod-validation-error';
import fs from 'fs';
import path from 'path';
import { getAudioDuration } from '../utils/fileStorage';

// Get all audio recordings
export const getAllRecordings = async (req: Request, res: Response) => {
  try {
    const recordings = await storage.getAudioRecordings();
    
    // Sort by newest first
    recordings.sort((a, b) => new Date(b.dateRecorded).getTime() - new Date(a.dateRecorded).getTime());
    
    res.json(recordings);
  } catch (error) {
    console.error('Error fetching audio recordings:', error);
    res.status(500).json({ message: 'Failed to fetch audio recordings' });
  }
};

// Get audio recording by ID
export const getRecordingById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid recording ID' });
    }

    const recording = await storage.getAudioRecordingById(id);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    res.json(recording);
  } catch (error) {
    console.error('Error fetching audio recording:', error);
    res.status(500).json({ message: 'Failed to fetch audio recording' });
  }
};

// Stream audio
export const streamAudio = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid recording ID' });
    }

    const recording = await storage.getAudioRecordingById(id);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    const audioPath = path.join(process.cwd(), 'uploads', 'audio', recording.filename);
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    const stat = fs.statSync(audioPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Handle range request for audio streaming
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(audioPath, { start, end });

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/webm', // Assuming WebM format for recordings
      };

      res.writeHead(206, headers);
      file.pipe(res);
    } else {
      // Handle regular request
      const headers = {
        'Content-Length': fileSize,
        'Content-Type': 'audio/webm',
      };
      res.writeHead(200, headers);
      fs.createReadStream(audioPath).pipe(res);
    }
  } catch (error) {
    console.error('Error streaming audio:', error);
    res.status(500).json({ message: 'Failed to stream audio' });
  }
};

// Download audio
export const downloadAudio = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid recording ID' });
    }

    const recording = await storage.getAudioRecordingById(id);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    const audioPath = path.join(process.cwd(), 'uploads', 'audio', recording.filename);
    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'audio/webm');
    res.setHeader('Content-Disposition', `attachment; filename="${recording.name}.webm"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(audioPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading audio:', error);
    res.status(500).json({ message: 'Failed to download audio' });
  }
};

// Upload audio recording
export const uploadRecording = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    const name = req.body.name || `Recording ${new Date().toLocaleString()}`;
    
    // Get duration from request body or calculate it
    let duration = parseInt(req.body.duration);
    if (isNaN(duration)) {
      // Calculate duration if not provided
      try {
        duration = await getAudioDuration(req.file.path);
      } catch (err) {
        console.error('Error getting audio duration:', err);
        duration = 0; // Default to 0 if duration can't be determined
      }
    }
    
    // Validate and prepare data for insertion
    const recordingData = {
      name,
      filename: req.file.filename,
      size: req.file.size,
      duration,
    };

    // Validate with Zod schema
    const validationResult = insertAudioRecordingSchema.safeParse(recordingData);
    if (!validationResult.success) {
      // Delete the uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      const validationError = fromZodError(validationResult.error);
      return res.status(400).json({ message: 'Invalid recording data', errors: validationError.details });
    }

    // Store recording in database
    const savedRecording = await storage.createAudioRecording(recordingData);
    res.status(201).json(savedRecording);
  } catch (error) {
    console.error('Error uploading audio recording:', error);
    
    // Clean up the file if an error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Failed to upload audio recording' });
  }
};

// Rename audio recording
export const renameRecording = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid recording ID' });
    }

    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ message: 'Invalid name provided' });
    }

    const recording = await storage.getAudioRecordingById(id);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    const updatedRecording = await storage.updateAudioRecording(id, { name: name.trim() });
    if (!updatedRecording) {
      return res.status(500).json({ message: 'Failed to rename recording' });
    }

    res.json(updatedRecording);
  } catch (error) {
    console.error('Error renaming audio recording:', error);
    res.status(500).json({ message: 'Failed to rename recording' });
  }
};

// Delete audio recording
export const deleteRecording = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid recording ID' });
    }

    const recording = await storage.getAudioRecordingById(id);
    if (!recording) {
      return res.status(404).json({ message: 'Recording not found' });
    }

    const success = await storage.deleteAudioRecording(id);
    if (!success) {
      return res.status(500).json({ message: 'Failed to delete recording' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting audio recording:', error);
    res.status(500).json({ message: 'Failed to delete recording' });
  }
};

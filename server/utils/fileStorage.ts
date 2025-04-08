import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Get the size of a file in bytes
 */
export const getFileSize = (filePath: string): number => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (err) {
    console.error('Error getting file size:', err);
    return 0;
  }
};

/**
 * Determine the MIME type of a file based on its extension
 */
export const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  
  switch (ext) {
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.mov':
      return 'video/quicktime';
    case '.avi':
      return 'video/x-msvideo';
    case '.pdf':
      return 'application/pdf';
    case '.mp3':
      return 'audio/mpeg';
    case '.wav':
      return 'audio/wav';
    case '.ogg':
      return 'audio/ogg';
    case '.gltf':
      return 'model/gltf+json';
    case '.glb':
      return 'model/gltf-binary';
    default:
      return 'application/octet-stream';
  }
};

/**
 * Extract video metadata using FFmpeg
 */
export const parseVideoMetadata = async (filePath: string) => {
  try {
    // Use FFmpeg to get video information
    const { stdout } = await execAsync(`ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration -of json "${filePath}"`);
    
    const data = JSON.parse(stdout);
    const stream = data.streams?.[0] || {};
    
    const duration = stream.duration ? Math.floor(parseFloat(stream.duration)) : 0;
    const resolution = stream.width && stream.height ? `${stream.width}x${stream.height}` : '';
    
    return { duration, resolution };
  } catch (err) {
    console.error('Error parsing video metadata:', err);
    return { duration: 0, resolution: '' };
  }
};

/**
 * Count the number of pages in a PDF file
 */
export const countPdfPages = async (filePath: string): Promise<number> => {
  try {
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    return pdfDoc.getPageCount();
  } catch (err) {
    console.error('Error counting PDF pages:', err);
    return 0;
  }
};

/**
 * Get the duration of an audio file in seconds
 */
export const getAudioDuration = async (filePath: string): Promise<number> => {
  try {
    // Use FFmpeg to get audio duration
    const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`);
    return Math.floor(parseFloat(stdout.trim()));
  } catch (err) {
    console.error('Error getting audio duration:', err);
    return 0;
  }
};

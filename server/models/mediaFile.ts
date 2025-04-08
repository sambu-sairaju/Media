import mongoose from 'mongoose';

// Base schema for media files (videos and PDFs)
const mediaFileSchema = new mongoose.Schema({
  originalName: { type: String, required: true },
  filename: { type: String, required: true },
  fileId: { type: String, required: true }, // GridFS file ID
  fileType: { type: String, required: true }, // 'video' or 'pdf'
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  duration: { type: Number, default: null }, // For videos
  resolution: { type: String, default: null }, // For videos
  pageCount: { type: Number, default: null }, // For PDFs
  uploadDate: { type: Date, default: Date.now }
});

// Create a compound index for faster lookups by fileType
mediaFileSchema.index({ fileType: 1, uploadDate: -1 });

export const MediaFile = mongoose.model('MediaFile', mediaFileSchema);

// Audio recording schema
const audioRecordingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  filename: { type: String, required: true },
  fileId: { type: String, required: true }, // GridFS file ID
  duration: { type: Number, required: true },
  format: { type: String, required: true },
  size: { type: Number, required: true },
  dateRecorded: { type: Date, default: Date.now }
});

export const AudioRecording = mongoose.model('AudioRecording', audioRecordingSchema);

// WebGL asset schema
const webglAssetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  filename: { type: String, required: true },
  fileId: { type: String, required: true }, // GridFS file ID
  format: { type: String, required: true },
  size: { type: Number, required: true },
  description: { type: String, default: null },
  dateUploaded: { type: Date, default: Date.now }
});

export const WebglAsset = mongoose.model('WebglAsset', webglAssetSchema);
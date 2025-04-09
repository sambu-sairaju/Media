import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";

// Controllers
import * as videoController from "./controllers/videoController";
import * as pdfController from "./controllers/pdfController";
import * as audioController from "./controllers/audioController";
import * as webglController from "./controllers/webglController";

// Ensure upload directories exist
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
ensureDir(UPLOAD_DIR);
ensureDir(path.join(UPLOAD_DIR, 'videos'));
ensureDir(path.join(UPLOAD_DIR, 'pdfs'));
ensureDir(path.join(UPLOAD_DIR, 'audio'));
ensureDir(path.join(UPLOAD_DIR, 'webgl'));

// Update multer configuration to apply file type restrictions only for WebGL uploads
const multerStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Uploading file:', file.originalname);
    let dest = UPLOAD_DIR;

    if (file.fieldname === 'video') dest = path.join(UPLOAD_DIR, 'videos');
    else if (file.fieldname === 'pdf') dest = path.join(UPLOAD_DIR, 'pdfs');
    else if (file.fieldname === 'audio') dest = path.join(UPLOAD_DIR, 'audio');
    else if (file.fieldname === 'webgl') {
      dest = path.join(UPLOAD_DIR, 'webgl');

      // Restrict file types for WebGL uploads
      const allowedExtensions = ['.gltf', '.glb', '.png', '.fbx'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        console.error('Invalid file type for WebGL upload:', ext);
        return cb(new Error('Invalid file type for WebGL upload'), '');
      }
    }

    console.log('File will be saved to:', dest);
    cb(null, dest);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

// Update multer configuration to allow .fbx files and increase file size limit
const upload = multer({
  storage: multerStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // Set file size limit to 50 MB
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'webgl') {
      const allowedExtensions = ['.gltf', '.glb', '.png', '.fbx'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        console.error('Invalid file type for WebGL upload:', ext);
        return cb(new Error('Invalid file type for WebGL upload'));
      }
    }
    cb(null, true);
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Video routes
  app.get('/api/videos', videoController.getAllVideos);
  app.get('/api/videos/:id', videoController.getVideoById);
  app.get('/api/videos/:id/stream', videoController.streamVideo);
  app.post('/api/videos', upload.single('video'), videoController.uploadVideo);
  app.delete('/api/videos/:id', videoController.deleteVideo);

  // PDF routes
  app.get('/api/pdfs', pdfController.getAllPdfs);
  app.get('/api/pdfs/:id', pdfController.getPdfById);
  app.get('/api/pdfs/:id/view', pdfController.viewPdf);
  app.get('/api/pdfs/:id/download', pdfController.downloadPdf);
  app.get('/api/pdfs/:id/pages/:pageNum/download', pdfController.downloadPdfPage);
  app.post('/api/pdfs', upload.single('pdf'), pdfController.uploadPdf);
  app.delete('/api/pdfs/:id', pdfController.deletePdf);

  // Audio routes
  app.get('/api/audio-recordings', audioController.getAllRecordings);
  app.get('/api/audio-recordings/:id', audioController.getRecordingById);
  app.get('/api/audio-recordings/:id/stream', audioController.streamAudio);
  app.get('/api/audio-recordings/:id/download', audioController.downloadAudio);
  app.post('/api/audio-recordings', upload.single('audio'), audioController.uploadRecording);
  app.patch('/api/audio-recordings/:id', audioController.renameRecording);
  app.delete('/api/audio-recordings/:id', audioController.deleteRecording);

  // WebGL routes
  app.get('/api/webgl', webglController.getAllAssets);
  app.get('/api/webgl/:id', webglController.getAssetById);
  app.get('/api/webgl/:id/render', webglController.serveWebGLAsset);
  app.post('/api/webgl', upload.single('webgl'), webglController.uploadAsset);
  app.delete('/api/webgl/:id', webglController.deleteAsset);

  const httpServer = createServer(app);

  return httpServer;
}

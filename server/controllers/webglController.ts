import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertWebglAssetSchema } from '@shared/schema';
import { fromZodError } from 'zod-validation-error';
import fs from 'fs';
import path from 'path';

// Get all WebGL assets
export const getAllAssets = async (req: Request, res: Response) => {
  try {
    const assets = await storage.getWebGLAssets();
    res.json(assets);
  } catch (error) {
    console.error('Error fetching WebGL assets:', error);
    res.status(500).json({ message: 'Failed to fetch WebGL assets' });
  }
};

// Get WebGL asset by ID
export const getAssetById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid asset ID' });
    }

    const asset = await storage.getWebGLAssetById(id);
    if (!asset) {
      return res.status(404).json({ message: 'WebGL asset not found' });
    }

    res.json(asset);
  } catch (error) {
    console.error('Error fetching WebGL asset:', error);
    res.status(500).json({ message: 'Failed to fetch WebGL asset' });
  }
};

// Serve WebGL asset
export const serveWebGLAsset = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid asset ID' });
    }

    const asset = await storage.getWebGLAssetById(id);
    if (!asset) {
      return res.status(404).json({ message: 'WebGL asset not found' });
    }

    const assetPath = path.join(process.cwd(), 'uploads', 'webgl', asset.filename);
    if (!fs.existsSync(assetPath)) {
      return res.status(404).json({ message: 'WebGL asset file not found' });
    }

    // Determine content type based on file extension
    const ext = path.extname(asset.filename).toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    
    if (ext === '.gltf') {
      contentType = 'model/gltf+json';
    } else if (ext === '.glb') {
      contentType = 'model/gltf-binary';
    }

    // Set headers for serving
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${asset.name}${ext}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(assetPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error serving WebGL asset:', error);
    res.status(500).json({ message: 'Failed to serve WebGL asset' });
  }
};

// Upload WebGL asset
export const uploadAsset = async (req: Request, res: Response) => {
  try {
    console.log('Received file:', req.file);
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ message: 'No WebGL file uploaded' });
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    console.log('File extension:', ext);

    let format = 'Unknown';
    if (ext === '.gltf') {
      format = 'GLTF';
    } else if (ext === '.glb') {
      format = 'GLB';
    } else if (ext === '.png') {
      format = 'PNG';
    }

    console.log('Determined format:', format);

    const assetData = {
      name: req.body.name || req.file.originalname.replace(ext, ''),
      description: req.body.description || '',
      filename: req.file.filename,
      size: req.file.size,
      format,
    };

    console.log('Asset data:', assetData);

    const validationResult = insertWebglAssetSchema.safeParse(assetData);
    if (!validationResult.success) {
      console.error('Validation failed:', validationResult.error);
      fs.unlinkSync(req.file.path);
      const validationError = fromZodError(validationResult.error);
      return res.status(400).json({ message: 'Invalid WebGL asset data', errors: validationError.details });
    }

    const savedAsset = await storage.createWebGLAsset(assetData);
    console.log('Saved asset:', savedAsset);
    res.status(201).json(savedAsset);
  } catch (error) {
    console.error('Error uploading WebGL asset:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Failed to upload WebGL asset' });
  }
};

// Delete WebGL asset
export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid asset ID' });
    }

    const asset = await storage.getWebGLAssetById(id);
    if (!asset) {
      return res.status(404).json({ message: 'WebGL asset not found' });
    }

    const success = await storage.deleteWebGLAsset(id);
    if (!success) {
      return res.status(500).json({ message: 'Failed to delete WebGL asset' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting WebGL asset:', error);
    res.status(500).json({ message: 'Failed to delete WebGL asset' });
  }
};

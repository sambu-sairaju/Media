import { Request, Response } from 'express';
import { storage } from '../storage';
import { insertMediaFileSchema } from '@shared/schema';
import { fromZodError } from 'zod-validation-error';
import fs from 'fs';
import path from 'path';
import { getFileSize, getMimeType, countPdfPages } from '../utils/fileStorage';
import { PDFDocument } from 'pdf-lib';

// Get all PDFs
export const getAllPdfs = async (req: Request, res: Response) => {
  try {
    const pdfs = await storage.getMediaFiles('pdf');
    res.json(pdfs);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    res.status(500).json({ message: 'Failed to fetch PDFs' });
  }
};

// Get PDF by ID
export const getPdfById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid PDF ID' });
    }

    const pdf = await storage.getMediaFileById(id);
    if (!pdf || pdf.fileType !== 'pdf') {
      return res.status(404).json({ message: 'PDF not found' });
    }

    res.json(pdf);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    res.status(500).json({ message: 'Failed to fetch PDF' });
  }
};

// View PDF
export const viewPdf = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid PDF ID' });
    }

    const pdf = await storage.getMediaFileById(id);
    if (!pdf || pdf.fileType !== 'pdf') {
      return res.status(404).json({ message: 'PDF not found' });
    }

    const pdfPath = path.join(process.cwd(), 'uploads', 'pdfs', pdf.filename);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    // Set headers for inline viewing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${pdf.originalName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error viewing PDF:', error);
    res.status(500).json({ message: 'Failed to view PDF' });
  }
};

// Download PDF
export const downloadPdf = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid PDF ID' });
    }

    const pdf = await storage.getMediaFileById(id);
    if (!pdf || pdf.fileType !== 'pdf') {
      return res.status(404).json({ message: 'PDF not found' });
    }

    const pdfPath = path.join(process.cwd(), 'uploads', 'pdfs', pdf.filename);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.originalName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({ message: 'Failed to download PDF' });
  }
};

// Download PDF page
export const downloadPdfPage = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const pageNum = parseInt(req.params.pageNum);
    
    if (isNaN(id) || isNaN(pageNum)) {
      return res.status(400).json({ message: 'Invalid PDF ID or page number' });
    }

    const pdf = await storage.getMediaFileById(id);
    if (!pdf || pdf.fileType !== 'pdf') {
      return res.status(404).json({ message: 'PDF not found' });
    }

    const pdfPath = path.join(process.cwd(), 'uploads', 'pdfs', pdf.filename);
    if (!fs.existsSync(pdfPath)) {
      return res.status(404).json({ message: 'PDF file not found' });
    }

    // Read the PDF file
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    if (pageNum < 1 || pageNum > pdfDoc.getPageCount()) {
      return res.status(400).json({ message: 'Invalid page number' });
    }

    // Create a new PDF with just the requested page
    const newPdfDoc = await PDFDocument.create();
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
    newPdfDoc.addPage(copiedPage);
    
    // Save the new PDF
    const newPdfBytes = await newPdfDoc.save();
    
    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${pdf.originalName.replace('.pdf', '')}_page${pageNum}.pdf"`);
    
    res.send(Buffer.from(newPdfBytes));
  } catch (error) {
    console.error('Error downloading PDF page:', error);
    res.status(500).json({ message: 'Failed to download PDF page' });
  }
};

// Upload PDF
export const uploadPdf = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    // Count the number of pages in the PDF
    const pdfPath = req.file.path;
    const pageCount = await countPdfPages(pdfPath);
    
    // Validate and prepare data for insertion
    const pdfData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || 'application/pdf',
      size: req.file.size,
      fileType: 'pdf',
      pageCount: pageCount || 1,
      duration: null, // Not applicable for PDFs
      resolution: null, // Not applicable for PDFs
    };

    // Validate with Zod schema
    const validationResult = insertMediaFileSchema.safeParse(pdfData);
    if (!validationResult.success) {
      // Delete the uploaded file if validation fails
      fs.unlinkSync(pdfPath);
      const validationError = fromZodError(validationResult.error);
      return res.status(400).json({ message: 'Invalid PDF data', errors: validationError.details });
    }

    // Store PDF in database
    const savedPdf = await storage.createMediaFile(pdfData);
    res.status(201).json(savedPdf);
  } catch (error) {
    console.error('Error uploading PDF:', error);
    
    // Clean up the file if an error occurs
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ message: 'Failed to upload PDF' });
  }
};

// Delete PDF
export const deletePdf = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid PDF ID' });
    }

    const pdf = await storage.getMediaFileById(id);
    if (!pdf || pdf.fileType !== 'pdf') {
      return res.status(404).json({ message: 'PDF not found' });
    }

    const success = await storage.deleteMediaFile(id);
    if (!success) {
      return res.status(500).json({ message: 'Failed to delete PDF' });
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error deleting PDF:', error);
    res.status(500).json({ message: 'Failed to delete PDF' });
  }
};

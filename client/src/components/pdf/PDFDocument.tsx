import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MediaFile } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';

// Completely remove the react-pdf dependency that's causing problems

interface PDFDocumentProps {
  selectedPdf: MediaFile | undefined;
  currentPage: number;
  zoom: number;
  loading: boolean;
  onDownloadPage: () => void;
}

const PDFDocument: React.FC<PDFDocumentProps> = ({ 
  selectedPdf, 
  currentPage, 
  zoom,
  loading,
  onDownloadPage 
}) => {
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [renderError, setRenderError] = useState<Error | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPageLoading(true);
  }, [currentPage, selectedPdf]);

  const handleDocumentLoadSuccess = (pdf: any) => {
    setPdfDocument(pdf);
  };

  const handlePageLoadSuccess = () => {
    setPageLoading(false);
    setRenderError(null);
  };

  const handleDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF document:', error);
    setRenderError(error);
  };

  // Use a simple iframe to display PDFs instead of react-pdf
  // This is a much more reliable approach that works in all browsers
  return (
    <div className="pdf-container bg-gray-50 dark:bg-gray-900 p-4 flex justify-center min-h-[60vh]">
      <div className="relative w-full max-w-3xl">
        {loading ? (
          <div className="aspect-[8.5/11] w-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
        ) : selectedPdf ? (
          <div className="w-full bg-white dark:bg-gray-800 shadow-lg flex flex-col items-center justify-center overflow-hidden" style={{ height: '70vh' }}>
            <iframe
              src={`/api/pdfs/${selectedPdf.id}/view`}
              className="w-full h-full border-0"
              title="PDF Viewer"
              onLoad={() => {
                setPageLoading(false);
                setRenderError(null);
              }}
              onError={(e) => {
                console.error('Error loading PDF:', e);
                setRenderError(new Error('Failed to load PDF'));
              }}
            />
          </div>
        ) : (
          <div className="aspect-[8.5/11] w-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
            <span className="text-gray-400">No PDF selected</span>
          </div>
        )}
        
        {selectedPdf && !loading && (
          <div className="mt-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDownloadPage()}
                className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium inline-flex items-center text-sm"
              >
                <span className="material-icons mr-1 text-sm">file_download</span>
                <span>Download PDF</span>
              </Button>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-300">
              {selectedPdf.originalName}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFDocument;

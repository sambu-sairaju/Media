import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import type { MediaFile } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Document, Page, pdfjs } from 'react-pdf';

// Set up PDFJS worker with a reliable CDN that works with React
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

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

  return (
    <div className="pdf-container bg-gray-50 dark:bg-gray-900 p-4 flex justify-center min-h-[60vh]">
      <div className="relative w-full max-w-3xl">
        {loading ? (
          <div className="aspect-[8.5/11] w-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
            <Skeleton className="w-full h-full" />
          </div>
        ) : selectedPdf ? (
          <div className="aspect-[8.5/11] w-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
            {renderError ? (
              <div className="flex flex-col items-center justify-center text-red-500 p-4">
                <span className="material-icons text-4xl mb-2">error_outline</span>
                <p className="text-center">Failed to load PDF. Please try again later.</p>
                <p className="text-sm text-gray-500 mt-2">{renderError.message}</p>
              </div>
            ) : (
              <Document
                file={`/api/pdfs/${selectedPdf.id}/view`}
                onLoadSuccess={handleDocumentLoadSuccess}
                onLoadError={handleDocumentLoadError}
                loading={<div className="w-full h-full flex items-center justify-center"><span className="material-icons text-4xl animate-spin text-gray-400">autorenew</span></div>}
                className="w-full h-full flex items-center justify-center"
              >
                {pageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-800">
                    <span className="material-icons text-4xl animate-spin text-gray-400">autorenew</span>
                  </div>
                )}
                <Page
                  pageNumber={currentPage}
                  scale={zoom}
                  onLoadSuccess={handlePageLoadSuccess}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  canvasRef={canvasRef}
                  className="max-w-full max-h-full"
                />
              </Document>
            )}
          </div>
        ) : (
          <div className="aspect-[8.5/11] w-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center overflow-hidden">
            <span className="text-gray-400">No PDF selected</span>
          </div>
        )}
        
        {selectedPdf && !loading && !renderError && (
          <div className="absolute bottom-4 right-4">
            <Button
              id="download-page"
              variant="secondary"
              onClick={onDownloadPage}
              className="bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium shadow-md inline-flex items-center text-sm"
            >
              <span className="material-icons mr-1 text-sm">file_download</span>
              <span>Download Page</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFDocument;

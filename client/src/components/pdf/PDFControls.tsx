import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { MediaFile } from '@shared/schema';

interface PDFControlsProps {
  loading: boolean;
  pdfFiles: MediaFile[];
  selectedPdfId: number | null;
  currentPage: number;
  totalPages: number;
  onPdfSelect: (id: string) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDownloadFullPdf: () => void;
}

const PDFControls: React.FC<PDFControlsProps> = ({
  loading,
  pdfFiles,
  selectedPdfId,
  currentPage,
  totalPages,
  onPdfSelect,
  onPrevPage,
  onNextPage,
  onZoomIn,
  onZoomOut,
  onDownloadFullPdf
}) => {
  return (
    <div className="pdf-controls flex flex-wrap items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
      <div className="flex items-center space-x-4 mb-2 md:mb-0">
        {loading ? (
          <>
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-40" />
          </>
        ) : (
          <>
            <div className="relative">
              <Select value={selectedPdfId?.toString() || ''} onValueChange={onPdfSelect}>
                <SelectTrigger className="appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary-light w-full">
                  <SelectValue placeholder="Select a PDF" />
                </SelectTrigger>
                <SelectContent>
                  {pdfFiles.map((pdf) => (
                    <SelectItem key={pdf.id} value={pdf.id.toString()}>
                      {pdf.originalName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              id="download-pdf"
              variant="default"
              className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded inline-flex items-center"
              onClick={onDownloadFullPdf}
              disabled={!selectedPdfId}
            >
              <span className="material-icons mr-1">download</span>
              <span>Download Full PDF</span>
            </Button>
          </>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {loading ? (
          <Skeleton className="h-8 w-36" />
        ) : (
          <>
            <Button
              id="prev-page"
              variant="outline"
              size="icon"
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-full p-1 disabled:opacity-50"
              onClick={onPrevPage}
              disabled={currentPage <= 1 || !selectedPdfId}
            >
              <span className="material-icons">navigate_before</span>
            </Button>
            
            <span className="text-gray-700 dark:text-gray-200">
              <span id="current-page">{currentPage}</span>
              /
              <span id="total-pages">{totalPages}</span>
            </span>
            
            <Button
              id="next-page"
              variant="outline"
              size="icon"
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-full p-1 disabled:opacity-50"
              onClick={onNextPage}
              disabled={currentPage >= totalPages || !selectedPdfId}
            >
              <span className="material-icons">navigate_next</span>
            </Button>

            <Button
              id="zoom-in"
              variant="outline"
              size="icon"
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-full p-1 disabled:opacity-50"
              onClick={onZoomIn}
              disabled={!selectedPdfId}
            >
              <span className="material-icons">zoom_in</span>
            </Button>
            
            <Button
              id="zoom-out"
              variant="outline"
              size="icon"
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-full p-1 disabled:opacity-50"
              onClick={onZoomOut}
              disabled={!selectedPdfId}
            >
              <span className="material-icons">zoom_out</span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PDFControls;

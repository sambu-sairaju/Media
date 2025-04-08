import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Skeleton } from '@/components/ui/skeleton';
import type { MediaFile } from '@shared/schema';

// Set up PDFJS worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFThumbnailsProps {
  selectedPdf: MediaFile | undefined;
  currentPage: number;
  loading: boolean;
  onPageSelect: (page: number) => void;
}

const PDFThumbnails: React.FC<PDFThumbnailsProps> = ({
  selectedPdf,
  currentPage,
  loading,
  onPageSelect
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  if (loading) {
    return (
      <div className="flex space-x-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-24">
            <Skeleton className="aspect-[8.5/11] mb-1" />
          </div>
        ))}
      </div>
    );
  }

  if (!selectedPdf) {
    return <div className="text-gray-500 dark:text-gray-400 text-center">No PDF selected</div>;
  }

  return (
    <div className="flex space-x-4">
      <Document
        file={`/api/pdfs/${selectedPdf.id}/view`}
        onLoadSuccess={handleDocumentLoadSuccess}
        loading={null}
      >
        {numPages &&
          Array.from(new Array(numPages)).map((_, index) => {
            const pageNumber = index + 1;
            return (
              <div 
                key={`thumb-${pageNumber}`}
                className={`flex-shrink-0 w-24 cursor-pointer`}
                onClick={() => onPageSelect(pageNumber)}
              >
                <div 
                  className={`aspect-[8.5/11] bg-gray-200 dark:bg-gray-700 rounded border ${
                    currentPage === pageNumber 
                      ? 'border-primary dark:border-primary' 
                      : 'border-gray-300 dark:border-gray-600'
                  } flex items-center justify-center mb-1 hover:border-primary dark:hover:border-primary-light`}
                >
                  <Page
                    pageNumber={pageNumber}
                    width={96}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <span className="text-xs text-gray-500 dark:text-gray-400">{pageNumber}</span>
                    }
                  />
                </div>
              </div>
            );
          })}
      </Document>
    </div>
  );
};

export default PDFThumbnails;

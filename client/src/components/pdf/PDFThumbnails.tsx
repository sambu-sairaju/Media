import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { MediaFile } from '@shared/schema';

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

  const totalPages = selectedPdf.pageCount || 1;

  return (
    <div className="flex space-x-4 overflow-x-auto pb-2">
      {Array.from({ length: totalPages }).map((_, index) => {
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
              <span className="text-sm font-medium">Page {pageNumber}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PDFThumbnails;

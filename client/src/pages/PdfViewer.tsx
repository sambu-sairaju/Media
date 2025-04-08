import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PDFDocument from "../components/pdf/PDFDocument";
import PDFControls from "../components/pdf/PDFControls";
import PDFThumbnails from "../components/pdf/PDFThumbnails";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const PdfViewer = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: pdfFiles, isLoading: loadingPdfs } = useQuery({
    queryKey: ['/api/pdfs'],
    staleTime: 60000, // 1 minute
  });

  const { data: selectedPdf, isLoading: loadingSelectedPdf } = useQuery({
    queryKey: ['/api/pdfs', selectedPdfId],
    enabled: !!selectedPdfId,
  });
  
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/pdfs', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload PDF');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/pdfs'] });
      toast({
        title: "PDF uploaded successfully",
        description: "Your PDF has been uploaded and is now available for viewing.",
      });
      setSelectedPdfId(data.id);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload PDF",
        variant: "destructive",
      });
    }
  });

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('pdf', file);
      uploadMutation.mutate(formData);
    }
  };

  // Select first PDF by default when PDFs are loaded
  useEffect(() => {
    if (pdfFiles?.length && !selectedPdfId) {
      setSelectedPdfId(pdfFiles[0].id);
    }
  }, [pdfFiles, selectedPdfId]);

  // Reset to page 1 when changing PDFs
  useEffect(() => {
    setCurrentPage(1);
    setZoom(1);
  }, [selectedPdfId]);
  
  const totalPages = selectedPdf?.pageCount || 0;

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handlePageSelect = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handlePdfSelect = (id: string) => {
    setSelectedPdfId(Number(id));
  };

  const handleDownloadFullPdf = () => {
    if (selectedPdf) {
      window.open(`/api/pdfs/${selectedPdf.id}/download`, '_blank');
    }
  };

  const handleDownloadPage = () => {
    if (selectedPdf) {
      window.open(`/api/pdfs/${selectedPdf.id}/pages/${currentPage}/download`, '_blank');
    }
  };

  return (
    <section className="p-4 md:p-6 max-w-5xl mx-auto">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-medium bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">PDF Viewer</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">View and download PDF documents</p>
        </div>
        <div>
          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-md"
          >
            <span className="material-icons mr-2">upload_file</span>
            {uploadMutation.isPending ? 'Uploading...' : 'Upload PDF'}
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleFileChange}
            onClick={(e) => (e.currentTarget.value = '')}
          />
        </div>
      </header>

      <Card className="mb-6">
        <PDFControls 
          loading={loadingPdfs || loadingSelectedPdf}
          pdfFiles={pdfFiles || []}
          selectedPdfId={selectedPdfId}
          currentPage={currentPage}
          totalPages={totalPages}
          onPdfSelect={handlePdfSelect}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onDownloadFullPdf={handleDownloadFullPdf}
        />
        
        <PDFDocument 
          selectedPdf={selectedPdf}
          currentPage={currentPage}
          zoom={zoom}
          loading={loadingSelectedPdf}
          onDownloadPage={handleDownloadPage}
        />
      </Card>

      <Card>
        <CardHeader className="py-3 px-3 bg-gray-100 dark:bg-gray-700">
          <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">Page Thumbnails</CardTitle>
        </CardHeader>
        <CardContent className="p-4 overflow-x-auto">
          <PDFThumbnails 
            selectedPdf={selectedPdf}
            currentPage={currentPage}
            loading={loadingSelectedPdf}
            onPageSelect={handlePageSelect}
          />
        </CardContent>
      </Card>
    </section>
  );
};

export default PdfViewer;

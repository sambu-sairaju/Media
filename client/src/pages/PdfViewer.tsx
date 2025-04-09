import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { MediaFile } from "@shared/schema";

// Simple PDF card component
const SimplePdfCard = ({ 
  name, 
  isActive = false, 
  onClick 
}: { 
  name: string; 
  isActive?: boolean; 
  onClick: () => void;
}) => {
  return (
    <div 
      className={`p-2 cursor-pointer rounded ${isActive ? 'bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <span className="material-icons mr-2 text-gray-500">description</span>
        <span className="truncate">{name}</span>
      </div>
    </div>
  );
};

const PdfViewer = () => {
  const [currentPdfId, setCurrentPdfId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch PDFs
  const { data: pdfs = [], isLoading: loadingPdfs } = useQuery<MediaFile[]>({
    queryKey: ['/api/pdfs'],
  });

  // Upload mutation
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
      toast({
        title: "PDF uploaded successfully",
        description: "Your PDF has been uploaded and is now available for viewing.",
      });
      
      // Important: Refetch PDFs after upload
      queryClient.invalidateQueries({ queryKey: ['/api/pdfs'] });
      
      // Wait for data to refresh then select the new PDF
      setTimeout(() => {
        if (data?.id) {
          setCurrentPdfId(data.id);
        }
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload PDF",
        variant: "destructive",
      });
    }
  });

  // Handler for file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('pdf', file);
      uploadMutation.mutate(formData);
    }
  };

  // Current selected PDF
  const currentPdf = pdfs.find(p => p.id === currentPdfId) || pdfs[0];
  
  // If we have PDFs but no selection, select the first one
  if (pdfs.length > 0 && !currentPdfId && currentPdf) {
    setCurrentPdfId(currentPdf.id);
  }

  // Handle PDF download
  const handleDownload = () => {
    if (currentPdf) {
      window.open(`/api/pdfs/${currentPdf.id}/download`, '_blank');
    }
  };

  return (
    <section className="p-4 md:p-6 max-w-5xl mx-auto">
      <header className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-medium bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">PDF Viewer</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">View and download PDF documents</p>
        </div>
        <div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-md"
          >
            <i className="material-icons mr-2">upload_file</i>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader className="py-3 px-4 bg-gray-100 dark:bg-gray-700">
              <div className="flex justify-between items-center">
                <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">
                  {currentPdf?.originalName || "No PDF selected"}
                </CardTitle>
                {currentPdf && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownload}
                    className="text-xs"
                  >
                    <span className="material-icons mr-1 text-sm">download</span>
                    Download
                  </Button>
                )}
              </div>
            </CardHeader>
            <div className="w-full bg-white dark:bg-gray-800" style={{ height: "70vh" }}>
              {loadingPdfs ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Skeleton className="w-full h-full" />
                </div>
              ) : currentPdf ? (
                <iframe
                  src={`/api/pdfs/${currentPdf.id}/view`}
                  className="w-full h-full border-0"
                  title="PDF Viewer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                  <span className="text-gray-400">No PDFs available</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader className="py-3 px-4 bg-gray-100 dark:bg-gray-700">
              <CardTitle className="text-gray-700 dark:text-gray-200 text-base font-medium">Available PDFs</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              {loadingPdfs ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <Skeleton key={n} className="h-10 w-full" />
                  ))}
                </div>
              ) : pdfs.length > 0 ? (
                <div className="space-y-2">
                  {pdfs.map((pdf) => (
                    <SimplePdfCard
                      key={pdf.id}
                      name={pdf.originalName}
                      isActive={pdf.id === currentPdfId}
                      onClick={() => setCurrentPdfId(pdf.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No PDFs available</p>
                  <p className="text-sm mt-2">Upload a PDF to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default PdfViewer;

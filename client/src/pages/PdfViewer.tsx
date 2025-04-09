import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { MediaFile } from "@shared/schema";

// Simple PDF card component
const SimplePdfCard = ({ 
  name, 
  isActive = false, 
  onClick,
  onDelete
}: { 
  name: string; 
  isActive?: boolean; 
  onClick: () => void;
  onDelete: () => void;
}) => {
  return (
    <div 
      className={`p-2 cursor-pointer rounded ${isActive ? 'bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center overflow-hidden" onClick={onClick}>
          <span className="material-icons mr-2 text-gray-500">description</span>
          <span className="truncate">{name}</span>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="text-gray-500 hover:text-red-500 focus:outline-none"
        >
          <span className="material-icons text-sm">delete</span>
        </button>
      </div>
    </div>
  );
};

const PdfViewer = () => {
  const [currentPdfId, setCurrentPdfId] = useState<number | null>(null);
  const [pdfs, setPdfs] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState<MediaFile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch PDFs directly from API
  const fetchPdfs = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pdfs');
      if (response.ok) {
        const data = await response.json();
        console.log("Fetched PDFs:", data);
        setPdfs(data || []);
        
        // Auto-select first PDF if we have PDFs but no selection
        if (data && data.length > 0 && !currentPdfId) {
          setCurrentPdfId(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching PDFs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Upload a PDF file
  const uploadPdf = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch('/api/pdfs', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "PDF uploaded successfully",
          description: "Your PDF has been uploaded and is now available.",
        });
        
        console.log("Uploaded PDF data:", data);
        
        // Fetch PDFs again to update the list
        await fetchPdfs();
        
        // Select the newly uploaded PDF
        if (data && data.id) {
          setCurrentPdfId(data.id);
        }
      } else {
        toast({
          title: "Upload failed",
          description: "There was a problem uploading your PDF.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading PDF:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your PDF.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Load PDFs when component mounts
  useEffect(() => {
    fetchPdfs();
  }, []);

  // Handler for file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPdf(file);
    }
  };

  // Current selected PDF
  const currentPdf = pdfs.find(p => p.id === currentPdfId) || (pdfs.length > 0 ? pdfs[0] : null);

  // Handle PDF download
  const handleDownload = () => {
    if (currentPdf) {
      window.open(`/api/pdfs/${currentPdf.id}/download`, '_blank');
    }
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (pdf: MediaFile) => {
    setPdfToDelete(pdf);
    setShowDeleteDialog(true);
  };
  
  // Handle PDF deletion
  const handleDeletePdf = async () => {
    if (!pdfToDelete) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/pdfs/${pdfToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "PDF deleted",
          description: `${pdfToDelete.originalName} has been deleted.`,
        });
        
        // If we just deleted the currently selected PDF, reset the selection
        if (currentPdfId === pdfToDelete.id) {
          setCurrentPdfId(null);
        }
        
        // Refresh the PDF list
        await fetchPdfs();
      } else {
        toast({
          title: "Delete failed",
          description: "Could not delete the PDF. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting PDF:", error);
      toast({
        title: "Delete failed",
        description: "An error occurred while deleting the PDF.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setPdfToDelete(null);
    }
  };

  return (
    <section className="p-4 md:p-6 max-w-5xl mx-auto">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the PDF <strong>{pdfToDelete?.originalName}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePdf} 
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    
      <header className="mb-6 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-medium bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">PDF Viewer</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">View and download PDF documents</p>
        </div>
        <div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white shadow-md"
          >
            <i className="material-icons mr-2">upload_file</i>
            {uploading ? 'Uploading...' : 'Upload PDF'}
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
              {loading ? (
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
              {loading ? (
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
                      onDelete={() => openDeleteDialog(pdf)}
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { documentsApi, driverDocumentsApi } from "@/lib/api";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface DocumentPreviewDialogProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
  documentType: 'vehicle' | 'driver';
}

export const DocumentPreviewDialog = ({ 
  open, 
  onClose, 
  documentId, 
  documentName,
  documentType 
}: DocumentPreviewDialogProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && documentId) {
      loadPreview();
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [open, documentId]);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);
      const api = documentType === 'vehicle' ? documentsApi : driverDocumentsApi;
      const response = await api.download(documentId);
      
      // Get the content type from headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      setFileType(contentType);
      
      // Create blob with correct type
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setLoading(false);
    } catch (err) {
      console.error("Preview error:", err);
      setError("Erro ao carregar pré-visualização");
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const api = documentType === 'vehicle' ? documentsApi : driverDocumentsApi;
      const response = await api.download(documentId);
      
      // Get content type and create blob with correct type
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      
      // Determine file extension from content type if not in name
      let fileName = documentName;
      if (!fileName.includes('.')) {
        const ext = getExtensionFromMimeType(contentType);
        if (ext) fileName += ext;
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Ficheiro descarregado");
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Erro ao descarregar ficheiro");
    }
  };

  const getExtensionFromMimeType = (mimeType: string): string => {
    const mimeMap: Record<string, string> = {
      'application/pdf': '.pdf',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    };
    return mimeMap[mimeType] || '';
  };

  const isPdf = fileType.includes('pdf');
  const isImage = fileType.includes('image');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg truncate pr-4">{documentName}</DialogTitle>
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Descarregar
            </Button>
          </div>
        </DialogHeader>
        
        <div className="w-full h-[70vh] bg-muted/10">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">A carregar pré-visualização...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descarregar Ficheiro
              </Button>
            </div>
          ) : isPdf ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title={documentName}
            />
          ) : isImage ? (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img 
                src={previewUrl} 
                alt={documentName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <p className="text-muted-foreground mb-4">
                Pré-visualização não disponível para este tipo de ficheiro ({fileType || 'desconhecido'})
              </p>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Descarregar Ficheiro
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
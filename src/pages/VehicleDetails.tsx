import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { vehiclesApi, documentsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Edit, Trash2, Loader2, FileText, Download, Eye } from "lucide-react";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";
import { useState } from "react";
import { DocumentForm } from "@/components/DocumentForm";
import { toast } from "sonner";
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

const VehicleDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDocForm, setShowDocForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewDocName, setPreviewDocName] = useState<string>("");

  const { data: vehicle, isLoading: vehicleLoading } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: () => vehiclesApi.getById(id!),
  });

  const { data: documents, isLoading: docsLoading } = useQuery({
    queryKey: ['documents', id],
    queryFn: () => documentsApi.getByVehicle(id!),
  });

  const deleteMutation = useMutation({
    mutationFn: documentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', id] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(t('documents.documentDeleted'));
      setDeleteDocId(null);
    },
    onError: () => {
      toast.error(t('errors.deleteError'));
    },
  });

  if (vehicleLoading || docsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config = {
      valid: { label: t('documents.statusValid'), className: "bg-success text-success-foreground" },
      expiring_30_days: { label: t('documents.statusExpiring'), className: "bg-warning text-warning-foreground" },
      expired: { label: t('documents.statusExpired'), className: "bg-expired text-expired-foreground" },
    };
    return config[status as keyof typeof config] || config.valid;
  };

  const getVehicleStatus = (status: string) => {
    switch (status) {
      case 'active': return t('vehicles.statusActive');
      case 'maintenance': return t('vehicles.statusMaintenance');
      default: return t('vehicles.statusInactive');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">{vehicle?.license_plate}</h1>
              <p className="text-sm text-muted-foreground">{vehicle?.model}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">{t('vehicles.vehicleInfo')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('vehicles.licensePlate')}</p>
              <p className="font-semibold">{vehicle?.license_plate}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('vehicles.model')}</p>
              <p className="font-semibold">{vehicle?.model}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('vehicles.department')}</p>
              <p className="font-semibold">{vehicle?.department}</p>
            </div>
            {vehicle?.fleet && (
              <div>
                <p className="text-sm text-muted-foreground">{t('vehicles.fleet')}</p>
                <p className="font-semibold">{vehicle.fleet}</p>
              </div>
            )}
            {vehicle?.color && (
              <div>
                <p className="text-sm text-muted-foreground">{t('vehicles.color')}</p>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full border border-border" 
                    style={{ backgroundColor: vehicle.color.toLowerCase() }}
                  />
                  <p className="font-semibold">{vehicle.color}</p>
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">{t('vehicles.status')}</p>
              <Badge className={vehicle?.status === 'active' ? 'bg-success' : 'bg-muted'}>
                {getVehicleStatus(vehicle?.status)}
              </Badge>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('documents.title')}</h2>
          <Button onClick={() => { setEditingDoc(null); setShowDocForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            {t('documents.addDocument')}
          </Button>
        </div>

        {documents && documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc: any) => {
              const statusBadge = getStatusBadge(doc.current_status);
              return (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-sm">{doc.file_name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{doc.file_type}</p>
                      </div>
                    </div>
                    <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('documents.documentCode')}</p>
                      <p className="text-sm font-mono">{doc.file_code}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('documents.validity')}</p>
                      <p className="text-sm">{new Date(doc.expiry_date).toLocaleDateString('pt-PT')}</p>
                    </div>
                    {doc.storage_location && (
                      <div>
                        <p className="text-xs text-muted-foreground">{t('documents.storageLocation')}</p>
                        <p className="text-sm">{doc.storage_location}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {doc.file_path && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPreviewDocId(doc.id.toString());
                            setPreviewDocName(doc.file_name);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {t('common.view')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              const response = await documentsApi.download(doc.id.toString());
                              const contentType = response.headers['content-type'] || 'application/octet-stream';
                              const blob = new Blob([response.data], { type: contentType });
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.setAttribute('download', doc.file_name);
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                              window.URL.revokeObjectURL(url);
                              toast.success(t('documents.fileDownloaded'));
                            } catch (error) {
                              toast.error(t('documents.downloadError'));
                            }
                          }}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={() => { setEditingDoc(doc); setShowDocForm(true); }}>
                      <Edit className="h-3 w-3 mr-1" />
                      {t('common.edit')}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setDeleteDocId(doc.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">{t('documents.noDocuments')}</p>
            <Button onClick={() => { setEditingDoc(null); setShowDocForm(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              {t('documents.addFirstDocument')}
            </Button>
          </Card>
        )}
      </main>

      <DocumentForm
        open={showDocForm}
        onClose={() => { setShowDocForm(false); setEditingDoc(null); }}
        vehicleId={id!}
        document={editingDoc}
      />

      {previewDocId && (
        <DocumentPreviewDialog
          open={!!previewDocId}
          onClose={() => {
            setPreviewDocId(null);
            setPreviewDocName("");
          }}
          documentId={previewDocId}
          documentName={previewDocName}
          documentType="vehicle"
        />
      )}

      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('documents.deleteDocument')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('documents.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteDocId && deleteMutation.mutate(deleteDocId)}>
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VehicleDetails;
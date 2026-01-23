import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi, driverDocumentsApi } from "@/lib/api";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FileSpreadsheet, User, Phone, Building, Shield, Calendar, Plus, Eye, Download, Edit, Trash2, FileText, CreditCard } from "lucide-react";
import { DriverDocumentForm } from "@/components/DriverDocumentForm";
import { DocumentPreviewDialog } from "@/components/DocumentPreviewDialog";
import { useToast } from "@/hooks/use-toast";
import { exportDriverProfileReport } from "@/lib/excelExport";
import { format } from "date-fns";

interface DriverProfileDialogProps {
  open: boolean;
  onClose: () => void;
  driverId?: string;
}

export const DriverProfileDialog = ({ open, onClose, driverId }: DriverProfileDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showDocForm, setShowDocForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  const [previewDocName, setPreviewDocName] = useState<string>("");

  const { data: driverData, isLoading } = useQuery({
    queryKey: ['driver-profile', driverId],
    queryFn: () => reportsApi.getDriverProfile(driverId!),
    enabled: open && !!driverId,
  });

  const { data: driverDocuments } = useQuery({
    queryKey: ['driver-documents', driverId],
    queryFn: () => driverDocumentsApi.getByDriver(driverId!),
    enabled: open && !!driverId,
  });

  const deleteDocMutation = useMutation({
    mutationFn: driverDocumentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents', driverId] });
      toast({
        title: t("documents.documentDeleted"),
        description: t("common.success"),
      });
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("errors.deleteError"),
        variant: "destructive",
      });
    },
  });

  const handleExportExcel = () => {
    if (driverData) {
      try {
        exportDriverProfileReport(driverData);
        toast({
          title: t("reports.excelExported"),
          description: t("profile.profileExported"),
        });
      } catch (error) {
        toast({
          title: t("common.error"),
          description: t("profile.exportError"),
          variant: "destructive",
        });
      }
    }
  };

  if (!driverId) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t("profile.driverProfile")}
            </DialogTitle>
            <Button size="sm" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {t("reports.exportExcel")}
            </Button>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t("profile.loading")}</p>
            </div>
          </div>
        ) : driverData ? (
          <div className="space-y-6">
            {/* Driver Info Card */}
            <Card className="p-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  {driverData.driver.profile_photo && (
                    <AvatarImage 
                      src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${driverData.driver.profile_photo}`}
                      alt={driverData.driver.name}
                      className="object-cover"
                    />
                  )}
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {driverData.driver.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold">{driverData.driver.name}</h3>
                    <Badge variant="outline" className="capitalize">
                      {driverData.driver.role}
                    </Badge>
                    <Badge className={
                      driverData.driver.status === 'active' ? 'bg-success' :
                      driverData.driver.status === 'on_leave' ? 'bg-warning' : 'bg-muted'
                    }>
                      {driverData.driver.status === 'active' ? t("vehicles.statusActive") :
                       driverData.driver.status === 'on_leave' ? t("profile.onVacation") : t("vehicles.statusInactive")}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("profile.staffNumber")}:</span>
                      <span className="font-medium">{driverData.driver.staff_no}</span>
                    </div>
                    
                    {driverData.driver.license_number && (
                      <div className="flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("drivers.licenseNumber")}:</span>
                        <span className="font-medium">{driverData.driver.license_number}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{t("vehicles.department")}:</span>
                      <span className="font-medium">{driverData.driver.department}</span>
                    </div>
                    
                    {driverData.driver.contact && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{t("drivers.contact")}:</span>
                        <span className="font-medium">{driverData.driver.contact}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{driverData.records.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">{t("profile.totalOperations")}</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-warning">
                    {driverData.records.filter((r: any) => r.operation_type === 'withdrawal').length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{t("profile.withdrawals")}</p>
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-success">
                    {driverData.records.filter((r: any) => r.operation_type === 'return').length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{t("profile.returns")}</p>
                </div>
              </Card>
            </div>

            {/* Driver Documents */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t("profile.driverDocuments")}
                </h4>
                <Button size="sm" onClick={() => { setEditingDoc(null); setShowDocForm(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("common.add")}
                </Button>
              </div>
              
              {driverDocuments && driverDocuments.length > 0 ? (
                <div className="space-y-2">
                  {driverDocuments.map((doc: any) => {
                    const getStatusBadge = (status: string) => {
                      const config = {
                        valid: { label: t("documents.statusValid"), className: "bg-success text-success-foreground" },
                        expiring_30_days: { label: t("documents.statusExpiring"), className: "bg-warning text-warning-foreground" },
                        expired: { label: t("documents.statusExpired"), className: "bg-expired text-expired-foreground" },
                        permanent: { label: t("documents.statusPermanent"), className: "bg-muted text-muted-foreground" },
                      };
                      return config[status as keyof typeof config] || config.valid;
                    };
                    const statusBadge = getStatusBadge(doc.current_status);
                    
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/5">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{doc.doc_name}</span>
                            <Badge className={statusBadge.className}>{statusBadge.label}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground capitalize">{doc.doc_type.replace(/_/g, ' ')}</p>
                          {doc.expiry_date && (
                            <p className="text-xs text-muted-foreground">
                              {t("documents.validity")}: {new Date(doc.expiry_date).toLocaleDateString('pt-PT')}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {doc.file_path && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setPreviewDocId(doc.id.toString());
                                  setPreviewDocName(doc.doc_name);
                                }}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  try {
                                    const response = await driverDocumentsApi.download(doc.id.toString());
                                    const contentType = response.headers['content-type'] || 'application/octet-stream';
                                    const blob = new Blob([response.data], { type: contentType });
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', doc.doc_name);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                    window.URL.revokeObjectURL(url);
                                    toast({
                                      title: t("documents.fileDownloaded"),
                                    });
                                  } catch (error) {
                                    toast({
                                      title: t("documents.downloadError"),
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                <Download className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingDoc(doc);
                              setShowDocForm(true);
                            }}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(t("documents.deleteConfirm"))) {
                                deleteDocMutation.mutate(doc.id.toString());
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t("profile.noDocuments")}
                </div>
              )}
            </Card>

            {/* Records History */}
            <Card className="p-6">
              <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("profile.movementHistory")}
              </h4>
              
              {driverData.records.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {driverData.records.map((record: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-accent/5 transition-smooth">
                      <div className={`mt-1 p-2 rounded-full ${
                        record.operation_type === 'withdrawal' ? 'bg-warning/10' : 'bg-success/10'
                      }`}>
                        {record.operation_type === 'withdrawal' ? '↑' : '↓'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm font-medium ${
                            record.operation_type === 'withdrawal' ? 'text-warning' : 'text-success'
                          }`}>
                            {record.operation_type === 'withdrawal' ? t("profile.withdrawals") : t("profile.returns")}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(record.operation_time), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        
                        <p className="text-sm font-medium truncate">{record.file_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {record.license_plate} - {record.model}
                        </p>
                        
                        {record.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            "{record.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t("profile.noHistory")}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {t("profile.loadError")}
          </div>
        )}

        <DriverDocumentForm
          open={showDocForm}
          onClose={() => {
            setShowDocForm(false);
            setEditingDoc(null);
          }}
          driverId={driverId!}
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
            documentType="driver"
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
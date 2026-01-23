import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Upload, RefreshCw } from "lucide-react";

interface DocumentFormProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  document?: any;
}

export const DocumentForm = ({ open, onClose, vehicleId, document }: DocumentFormProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    file_name: "",
    file_type: "registration",
    issue_date: "",
    expiry_date: "",
    storage_location: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [hasExpiry, setHasExpiry] = useState(true);

  useEffect(() => {
    if (document) {
      setFormData({
        file_name: document.file_name || "",
        file_type: document.file_type || "registration",
        issue_date: document.issue_date?.split('T')[0] || "",
        expiry_date: document.expiry_date?.split('T')[0] || "",
        storage_location: document.storage_location || "",
      });
      setHasExpiry(!!document.expiry_date);
    } else {
      setFormData({
        file_name: "",
        file_type: "registration",
        issue_date: "",
        expiry_date: "",
        storage_location: "",
      });
      setHasExpiry(true);
      setSelectedFile(null);
    }
  }, [document, open]);

  const createMutation = useMutation({
    mutationFn: documentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(t('documents.documentCreated'));
      setSelectedFile(null);
      onClose();
    },
    onError: () => {
      toast.error(t('errors.saveError'));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: documentsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(t('documents.fileUploaded'));
      setSelectedFile(null);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('errors.uploadError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => documentsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(t('documents.documentUpdated'));
      onClose();
    },
    onError: () => {
      toast.error(t('errors.saveError'));
    },
  });

  const replaceFileMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) => 
      documentsApi.replaceFile(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', vehicleId] });
      toast.success(t('documents.fileReplaced'));
      setSelectedFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || t('errors.uploadError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file_name || !formData.issue_date) {
      toast.error(t('vehicles.fillRequired'));
      return;
    }

    if (hasExpiry && !formData.expiry_date) {
      toast.error(t('documents.expiryRequired'));
      return;
    }

    if (!document && !selectedFile) {
      toast.error(t('documents.uploadRequiredError'));
      return;
    }

    const daysUntilExpiry = hasExpiry 
      ? Math.floor((new Date(formData.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    let current_status = 'permanent';
    if (hasExpiry && daysUntilExpiry !== null) {
      if (daysUntilExpiry < 0) current_status = 'expired';
      else if (daysUntilExpiry <= 30) current_status = 'expiring_30_days';
      else current_status = 'valid';
    }

    if (document) {
      updateMutation.mutate({
        id: document.id,
        data: { 
          ...formData, 
          current_status,
          expiry_date: hasExpiry ? formData.expiry_date : null 
        },
      });
      
      if (selectedFile) {
        const fileFormData = new FormData();
        fileFormData.append('file', selectedFile);
        replaceFileMutation.mutate({ id: document.id, formData: fileFormData });
      }
    } else {
      if (selectedFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('file', selectedFile);
        formDataToSend.append('vehicle_id', vehicleId);
        formDataToSend.append('file_name', formData.file_name);
        formDataToSend.append('file_type', formData.file_type);
        formDataToSend.append('issue_date', formData.issue_date);
        formDataToSend.append('has_expiry', hasExpiry.toString());
        if (hasExpiry) {
          formDataToSend.append('expiry_date', formData.expiry_date);
        }
        formDataToSend.append('storage_location', formData.storage_location);
        
        uploadMutation.mutate(formDataToSend);
      } else {
        createMutation.mutate({
          vehicle_id: vehicleId,
          ...formData,
        });
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || 
                    uploadMutation.isPending || replaceFileMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{document ? t('documents.editDocument') : t('documents.addDocument')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="file_name">{t('documents.documentName')} *</Label>
            <Input
              id="file_name"
              value={formData.file_name}
              onChange={(e) => setFormData({ ...formData, file_name: e.target.value })}
              placeholder="Ex: Licença de Circulação 2024"
              required
            />
          </div>

          <div>
            <Label htmlFor="file_type">{t('documents.documentType')} *</Label>
            <Select value={formData.file_type} onValueChange={(value) => setFormData({ ...formData, file_type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="livrete_cabeca">{t('documents.types.livrete_cabeca')}</SelectItem>
                <SelectItem value="livrete_trela">{t('documents.types.livrete_trela')}</SelectItem>
                <SelectItem value="caderneta">{t('documents.types.caderneta')}</SelectItem>
                <SelectItem value="registration">{t('documents.types.registration')}</SelectItem>
                <SelectItem value="operation_license">{t('documents.types.operation_license')}</SelectItem>
                <SelectItem value="insurance">{t('documents.types.insurance')}</SelectItem>
                <SelectItem value="seguro_trela">{t('documents.types.seguro_trela')}</SelectItem>
                <SelectItem value="inspection">{t('documents.types.inspection')}</SelectItem>
                <SelectItem value="inspencao_trela">{t('documents.types.inspencao_trela')}</SelectItem>
                <SelectItem value="livre_transito_cfm">{t('documents.types.livre_transito_cfm')}</SelectItem>
                <SelectItem value="mozambique_permit">{t('documents.types.mozambique_permit')}</SelectItem>
                <SelectItem value="radio_difusao">{t('documents.types.radio_difusao')}</SelectItem>
                <SelectItem value="manifesto_municipal">{t('documents.types.manifesto_municipal')}</SelectItem>
                <SelectItem value="comesa">{t('documents.types.comesa')}</SelectItem>
                <SelectItem value="transport_cert">{t('documents.types.transport_cert')}</SelectItem>
                <SelectItem value="other">{t('documents.types.other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="issue_date">{t('documents.issueDate')} *</Label>
            <Input
              id="issue_date"
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center space-x-2 p-3 bg-accent/5 rounded-lg">
            <Switch
              id="has_expiry"
              checked={hasExpiry}
              onCheckedChange={setHasExpiry}
            />
            <Label htmlFor="has_expiry" className="cursor-pointer">
              {t('documents.hasExpiry')}
            </Label>
          </div>

          {hasExpiry && (
            <div>
              <Label htmlFor="expiry_date">{t('documents.expiryDate')} *</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                required={hasExpiry}
              />
            </div>
          )}

          <div>
            <Label htmlFor="storage_location">{t('documents.storageLocation')}</Label>
            <Input
              id="storage_location"
              value={formData.storage_location}
              onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
              placeholder="Ex: Pasta A - Prateleira 2"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file_upload" className="flex items-center gap-2">
              {document ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {t('documents.replaceFile')}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {t('documents.fileUpload')} *
                </>
              )}
            </Label>
            <Input
              id="file_upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="cursor-pointer"
              required={!document}
            />
            <p className="text-xs text-muted-foreground">
              {document 
                ? t('documents.selectNewFile')
                : t('documents.uploadRequired')}
            </p>
            {selectedFile && (
              <p className="text-sm text-success">
                ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
            {document?.file_path && !selectedFile && (
              <p className="text-xs text-muted-foreground">
                {t('documents.currentFile')}: {document.file_name}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('common.processing') : document ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { driverDocumentsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload, RefreshCw } from "lucide-react";

interface DriverDocumentFormProps {
  open: boolean;
  onClose: () => void;
  driverId: string;
  document?: any;
}

export const DriverDocumentForm = ({ 
  open, 
  onClose, 
  driverId,
  document 
}: DriverDocumentFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [hasExpiry, setHasExpiry] = useState(true);
  
  const [formData, setFormData] = useState({
    doc_code: "",
    doc_name: "",
    doc_type: "carta_conducao",
    issue_date: "",
    expiry_date: "",
    storage_location: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      if (document) {
        setFormData({
          doc_code: document.doc_code || "",
          doc_name: document.doc_name || "",
          doc_type: document.doc_type || "carta_conducao",
          issue_date: document.issue_date?.split('T')[0] || "",
          expiry_date: document.expiry_date?.split('T')[0] || "",
          storage_location: document.storage_location || "",
          notes: document.notes || "",
        });
        setHasExpiry(!!document.expiry_date);
      } else {
        setFormData({
          doc_code: `DOC-MOT-${Date.now()}`,
          doc_name: "",
          doc_type: "carta_conducao",
          issue_date: "",
          expiry_date: "",
          storage_location: "",
          notes: "",
        });
        setHasExpiry(true);
      }
      setFile(null);
    }
  }, [document, open]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (file) {
        const formDataObj = new FormData();
        formDataObj.append('file', file);
        Object.keys(data).forEach(key => {
          if (data[key] !== null && data[key] !== undefined) {
            formDataObj.append(key, data[key]);
          }
        });
        return driverDocumentsApi.upload(formDataObj);
      }
      return driverDocumentsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents'] });
      toast({
        title: t("common.success"),
        description: t("documents.documentCreated"),
      });
      onClose();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("errors.saveError"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => driverDocumentsApi.update(document.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents'] });
      toast({
        title: t("common.success"),
        description: t("documents.documentUpdated"),
      });
      onClose();
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("errors.saveError"),
        variant: "destructive",
      });
    },
  });

  const replaceFileMutation = useMutation({
    mutationFn: (formData: FormData) => driverDocumentsApi.replaceFile(document.id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents'] });
      toast({
        title: t("common.success"),
        description: t("documents.fileReplaced"),
      });
      setFile(null);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("errors.uploadError"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!document && !file) {
      toast({
        title: t("common.error"),
        description: t("documents.uploadRequiredError"),
        variant: "destructive",
      });
      return;
    }
    
    const submitData = {
      ...formData,
      driver_id: driverId,
      expiry_date: hasExpiry ? formData.expiry_date : null,
    };
    
    if (document) {
      // Update document info
      updateMutation.mutate(submitData);
      
      // If a new file is selected, replace it
      if (file) {
        const fileFormData = new FormData();
        fileFormData.append('file', file);
        replaceFileMutation.mutate(fileFormData);
      }
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || replaceFileMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {document ? t("driverDocument.editDocument") : t("driverDocument.addDocument")}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doc_name">{t("driverDocument.documentName")} *</Label>
              <Input
                id="doc_name"
                value={formData.doc_name}
                onChange={(e) => setFormData({ ...formData, doc_name: e.target.value })}
                required
                placeholder={t("driverDocument.documentNamePlaceholder")}
              />
            </div>
            
            <div>
              <Label htmlFor="doc_type">{t("driverDocument.documentType")} *</Label>
              <Select 
                value={formData.doc_type} 
                onValueChange={(value) => setFormData({ ...formData, doc_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="carta_conducao">{t("driverDocument.types.carta_conducao")}</SelectItem>
                  <SelectItem value="cnh">{t("driverDocument.types.cnh")}</SelectItem>
                  <SelectItem value="exame_medico">{t("driverDocument.types.exame_medico")}</SelectItem>
                  <SelectItem value="cert_treinamento">{t("driverDocument.types.cert_treinamento")}</SelectItem>
                  <SelectItem value="cert_defesa_defensiva">{t("driverDocument.types.cert_defesa_defensiva")}</SelectItem>
                  <SelectItem value="cert_cargas_perigosas">{t("driverDocument.types.cert_cargas_perigosas")}</SelectItem>
                  <SelectItem value="seguro_pessoal">{t("driverDocument.types.seguro_pessoal")}</SelectItem>
                  <SelectItem value="other">{t("driverDocument.types.other")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doc_code">{t("driverDocument.documentCode")}</Label>
              <Input
                id="doc_code"
                value={formData.doc_code}
                onChange={(e) => setFormData({ ...formData, doc_code: e.target.value })}
                disabled={!!document}
              />
            </div>
            
            <div>
              <Label htmlFor="issue_date">{t("driverDocument.issueDate")} *</Label>
              <Input
                id="issue_date"
                type="date"
                value={formData.issue_date}
                onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 p-3 bg-accent/5 rounded-lg">
            <Switch
              id="has_expiry"
              checked={hasExpiry}
              onCheckedChange={setHasExpiry}
            />
            <Label htmlFor="has_expiry" className="cursor-pointer">
              {t("driverDocument.hasExpiry")}
            </Label>
          </div>

          {hasExpiry && (
            <div>
              <Label htmlFor="expiry_date">{t("driverDocument.expiryDate")} *</Label>
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
            <Label htmlFor="storage_location">{t("driverDocument.storageLocation")}</Label>
            <Input
              id="storage_location"
              value={formData.storage_location}
              onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
              placeholder={t("driverDocument.storageLocationPlaceholder")}
            />
          </div>

          <div>
            <Label htmlFor="notes">{t("common.notes")}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t("common.notes")}
              rows={3}
            />
          </div>

          {/* File upload section - always visible */}
          <div className="space-y-2">
            <Label htmlFor="file" className="flex items-center gap-2">
              {document ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {t("driverDocument.replaceFile")}
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  {t("driverDocument.file")} *
                </>
              )}
            </Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
              required={!document}
            />
            <p className="text-xs text-muted-foreground">
              {document 
                ? t("driverDocument.replaceHint")
                : t("driverDocument.uploadHint")}
            </p>
            {file && (
              <p className="text-sm text-success">
                ✓ {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
            {document?.file_path && !file && (
              <p className="text-xs text-muted-foreground">
                {t("driverDocument.currentFile")}: {document.doc_name}
              </p>
            )}
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t("common.processing") : document ? t("common.update") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
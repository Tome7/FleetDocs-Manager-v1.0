import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { flowRecordsApi, driversApi } from "@/lib/api";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface FlowRecordFormProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
}

export const FlowRecordForm = ({ open, onClose, vehicleId }: FlowRecordFormProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [driverId, setDriverId] = useState("");
  const [operationType, setOperationType] = useState<'withdrawal' | 'return'>('withdrawal');
  const [expectedReturnTime, setExpectedReturnTime] = useState("");
  const [notes, setNotes] = useState("");

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: driversApi.getAll,
  });

  const { data: documents } = useQuery({
    queryKey: ['documents', vehicleId],
    queryFn: () => import('@/lib/api').then(m => m.documentsApi.getByVehicle(vehicleId)),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const promises = data.document_ids.map((doc_id: string) => {
        const payload = {
          document_id: doc_id,
          driver_id: data.driver_id,
          notes: data.notes,
          expected_return_time: data.expected_return_time,
        };
        return operationType === 'withdrawal' 
          ? flowRecordsApi.createWithdrawal(payload)
          : flowRecordsApi.createReturn(payload);
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-records'] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast({
        title: t("common.success"),
        description: operationType === 'withdrawal' 
          ? t("flowRecord.withdrawSuccess") 
          : t("flowRecord.returnSuccess"),
      });
      onClose();
      setDriverId("");
      setOperationType('withdrawal');
      setExpectedReturnTime("");
      setNotes("");
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("errors.saveError"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!driverId) {
      toast({
        title: t("common.error"),
        description: t("flowRecord.selectDriver"),
        variant: "destructive",
      });
      return;
    }

    const allDocIds = documents?.map((doc: any) => doc.id.toString()) || [];

    mutation.mutate({
      document_ids: allDocIds,
      driver_id: driverId,
      expected_return_time: operationType === 'withdrawal' ? expectedReturnTime : undefined,
      notes,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("flowRecord.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="operation_type">{t("flowRecord.operationType")} *</Label>
            <Select value={operationType} onValueChange={(value: 'withdrawal' | 'return') => setOperationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="withdrawal">{t("flowRecord.withdraw")}</SelectItem>
                <SelectItem value="return">{t("flowRecord.return")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="driver">{t("flowRecord.driver")} *</Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger>
                <SelectValue placeholder={t("flowRecord.selectDriver")} />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((driver: any) => (
                  <SelectItem key={driver.id} value={driver.id.toString()}>
                    {driver.name} ({driver.staff_no})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-accent/10 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2">
              <strong>{t("flowRecord.documentsIncluded")}:</strong>
            </p>
            {documents && documents.length > 0 ? (
              <ul className="text-sm space-y-1">
                {documents.map((doc: any) => (
                  <li key={doc.id} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                    {doc.file_name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">{t("flowRecord.noDocumentsAvailable")}</p>
            )}
          </div>

          {operationType === 'withdrawal' && (
            <div>
              <Label htmlFor="expected_return">{t("flowRecord.expectedReturn")}</Label>
              <Input
                id="expected_return"
                type="datetime-local"
                value={expectedReturnTime}
                onChange={(e) => setExpectedReturnTime(e.target.value)}
              />
            </div>
          )}

          <div>
            <Label htmlFor="notes">{t("common.notes")}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("common.notes")}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending || !documents?.length}>
              {mutation.isPending ? t("common.processing") : operationType === 'withdrawal' ? t("flowRecord.withdraw") : t("flowRecord.return")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
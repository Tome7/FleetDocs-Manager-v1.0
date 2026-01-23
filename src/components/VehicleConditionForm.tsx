import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { vehicleConditionApi, driversApi, vehiclesApi } from "@/lib/api";
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
import { Loader2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VehicleConditionFormProps {
  open: boolean;
  onClose: () => void;
  vehicleId: string;
  condition?: any;
}

// Itens fixos de verificação conforme schema da base de dados
const CONDITION_ITEMS = [
  { key: "vidro_parabrisa", labelKey: "conditions.items.vidro_parabrisa" },
  { key: "espelho_esquerdo", labelKey: "conditions.items.espelho_esquerdo" },
  { key: "espelho_direito", labelKey: "conditions.items.espelho_direito" },
  { key: "barachoque", labelKey: "conditions.items.barachoque" },
  { key: "capom", labelKey: "conditions.items.capom" },
  { key: "farois_cabeca", labelKey: "conditions.items.farois_cabeca" },
  { key: "farois_trela", labelKey: "conditions.items.farois_trela" },
  { key: "pintura", labelKey: "conditions.items.pintura" },
  { key: "pneus", labelKey: "conditions.items.pneus" },
  { key: "quarda_lamas", labelKey: "conditions.items.quarda_lamas" },
  { key: "subsalente", labelKey: "conditions.items.subsalente" },
];

export function VehicleConditionForm({
  open,
  onClose,
  vehicleId,
  condition,
}: VehicleConditionFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [driverId, setDriverId] = useState("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");

  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: driversApi.getAll,
  });

  const { data: vehicle } = useQuery({
    queryKey: ["vehicle", vehicleId],
    queryFn: () => vehiclesApi.getById(vehicleId),
    enabled: open,
  });

  useEffect(() => {
    if (condition) {
      const data: Record<string, string> = {};
      CONDITION_ITEMS.forEach((item) => {
        data[item.key] = condition[item.key] || "bom";
      });
      setFormData(data);
      setDriverId(condition.driver_id?.toString() || "");
      setNotes(condition.notes || "");
    } else {
      const data: Record<string, string> = {};
      CONDITION_ITEMS.forEach((item) => {
        data[item.key] = "bom";
      });
      setFormData(data);
      setDriverId(vehicle?.assigned_driver_id?.toString() || "");
      setNotes("");
    }
  }, [condition, open, vehicle]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (condition) {
        return vehicleConditionApi.update(condition.id, data);
      }
      return vehicleConditionApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-conditions"] });
      queryClient.invalidateQueries({ queryKey: ["vehicle-condition", vehicleId] });
      toast({
        title: condition ? t("conditions.conditionUpdated") : t("conditions.conditionRegistered"),
        description: t("conditions.conditionSuccess"),
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error.response?.data?.error || t("errors.saveError"),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!driverId) {
      toast({
        title: t("common.error"),
        description: t("conditions.selectDriver"),
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      vehicle_id: vehicleId,
      driver_id: driverId,
      notes: notes,
      ...formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {condition
              ? t("conditions.editCondition")
              : t("conditions.registerCondition")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {vehicle?.assigned_driver_id && !condition && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {t("conditions.currentDriver")}: <strong>{drivers?.find((d: any) => d.id === vehicle.assigned_driver_id)?.name}</strong>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="driver">
              {t("conditions.driver")} <span className="text-destructive">*</span>
            </Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger>
                <SelectValue placeholder={t("conditions.selectDriver")} />
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

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-4">{t("conditions.componentStatus")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONDITION_ITEMS.map((item) => (
                <div key={item.key} className="space-y-2">
                  <Label htmlFor={item.key}>{t(item.labelKey)}</Label>
                  <Select
                    value={formData[item.key] || "bom"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, [item.key]: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bom">{t("conditions.ok")}</SelectItem>
                      <SelectItem value="mau">{t("conditions.bad")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("common.notes")}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("common.notes")}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {condition ? t("common.update") : t("common.create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { vehicleConditionApi } from "@/lib/api";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FileSpreadsheet, Loader2, CheckCircle, XCircle, Calendar, User, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { pt, enUS, zhCN } from "date-fns/locale";
import { exportVehicleConditionsReport } from "@/lib/excelExport";
import { useToast } from "@/hooks/use-toast";
import { VehicleConditionForm } from "@/components/VehicleConditionForm";

interface VehicleConditionHistoryProps {
  open: boolean;
  onClose: () => void;
  vehicleId?: string;
  vehiclePlate?: string;
}

export function VehicleConditionHistory({
  open,
  onClose,
  vehicleId,
  vehiclePlate,
}: VehicleConditionHistoryProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCheck, setEditingCheck] = useState<any>(null);
  const [deletingCheckId, setDeletingCheckId] = useState<number | null>(null);

  const dateLocale = i18n.language === 'zh' ? zhCN : i18n.language === 'en' ? enUS : pt;

  const { data: conditions, isLoading } = useQuery({
    queryKey: ["vehicle-conditions", vehicleId],
    queryFn: () => vehicleConditionApi.getByVehicle(vehicleId!),
    enabled: open && !!vehicleId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vehicleConditionApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle-conditions", vehicleId] });
      toast({
        title: t("conditions.conditionDeleted"),
        description: t("conditions.conditionDeletedSuccess"),
      });
      setDeletingCheckId(null);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("errors.deleteError"),
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    if (conditions && conditions.length > 0) {
      exportVehicleConditionsReport(conditions, vehiclePlate || "");
      toast({
        title: t("reports.excelExported"),
        description: t("common.success"),
      });
    } else {
      toast({
        title: t("common.noData"),
        description: t("conditions.noChecks"),
        variant: "destructive",
      });
    }
  };

  const getConditionStatus = (check: any) => {
    const conditionLabels: Record<string, string> = {
      vidro_parabrisa: t("conditions.items.vidro_parabrisa"),
      espelho_esquerdo: t("conditions.items.espelho_esquerdo"),
      espelho_direito: t("conditions.items.espelho_direito"),
      barachoque: t("conditions.items.barachoque"),
      capom: t("conditions.items.capom"),
      farois_cabeca: t("conditions.items.farois_cabeca"),
      farois_trela: t("conditions.items.farois_trela"),
      pintura: t("conditions.items.pintura"),
      pneus: t("conditions.items.pneus"),
      quarda_lamas: t("conditions.items.quarda_lamas"),
      subsalente: t("conditions.items.subsalente"),
    };
    
    const badItems = Object.entries(check)
      .filter(([key, value]) => conditionLabels[key] && value === "mau")
      .length;
    
    if (badItems === 0) return { label: t("conditions.excellent"), variant: "default" as const };
    if (badItems <= 2) return { label: t("conditions.good"), variant: "secondary" as const };
    if (badItems <= 4) return { label: t("conditions.regular"), variant: "outline" as const };
    return { label: t("conditions.critical"), variant: "destructive" as const };
  };

  const CONDITION_LABELS: Record<string, string> = {
    vidro_parabrisa: t("conditions.items.vidro_parabrisa"),
    espelho_esquerdo: t("conditions.items.espelho_esquerdo"),
    espelho_direito: t("conditions.items.espelho_direito"),
    barachoque: t("conditions.items.barachoque"),
    capom: t("conditions.items.capom"),
    farois_cabeca: t("conditions.items.farois_cabeca"),
    farois_trela: t("conditions.items.farois_trela"),
    pintura: t("conditions.items.pintura"),
    pneus: t("conditions.items.pneus"),
    quarda_lamas: t("conditions.items.quarda_lamas"),
    subsalente: t("conditions.items.subsalente"),
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {t("conditions.history")} - {vehiclePlate}
              </DialogTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                disabled={!conditions || conditions.length === 0}
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                {t("reports.exportExcel")}
              </Button>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : conditions && conditions.length > 0 ? (
            <ScrollArea className="h-[60vh] pr-4">
              <Accordion type="single" collapsible className="space-y-2">
                {conditions.map((check: any, index: number) => {
                  const status = getConditionStatus(check);
                  return (
                    <AccordionItem
                      key={check.id}
                      value={check.id.toString()}
                      className="border rounded-lg px-4"
                    >
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(check.check_date), "dd/MM/yyyy HH:mm", { locale: dateLocale })}
                          </div>
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto mr-4">
                            <User className="h-4 w-4" />
                            {check.driver_name || "N/A"}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-4 space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                              <div
                                key={key}
                                className={`flex items-center gap-2 p-2 rounded-lg ${
                                  check[key] === "bom"
                                    ? "bg-success/10"
                                    : "bg-destructive/10"
                                }`}
                              >
                                {check[key] === "bom" ? (
                                  <CheckCircle className="h-4 w-4 text-success" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-destructive" />
                                )}
                                <span className="text-sm">{label}</span>
                              </div>
                            ))}
                          </div>

                          {check.notes && (
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="text-sm font-medium mb-1">{t("common.notes")}:</p>
                              <p className="text-sm text-muted-foreground">{check.notes}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="text-xs text-muted-foreground">
                              {t("conditions.registeredBy")}: {check.created_by_name || "Sistema"}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingCheck(check)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                {t("common.edit")}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setDeletingCheckId(check.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                {t("common.delete")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground">
                {t("conditions.noChecks")}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Condition Form */}
      {editingCheck && (
        <VehicleConditionForm
          open={!!editingCheck}
          onClose={() => setEditingCheck(null)}
          vehicleId={vehicleId!}
          condition={editingCheck}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCheckId} onOpenChange={() => setDeletingCheckId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("conditions.deleteCheck")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("conditions.deleteCheckConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingCheckId && deleteMutation.mutate(deletingCheckId.toString())}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
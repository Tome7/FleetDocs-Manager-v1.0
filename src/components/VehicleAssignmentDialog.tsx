import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { driversApi, vehiclesApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Car, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VehicleAssignmentDialogProps {
  open: boolean;
  onClose: () => void;
  driver?: any;
}

export function VehicleAssignmentDialog({
  open,
  onClose,
  driver,
}: VehicleAssignmentDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>("");

  const { data: vehicles, isLoading: vehiclesLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.getAll,
    enabled: open,
  });

  useEffect(() => {
    if (driver && open) {
      setSelectedVehicleId("");
    }
  }, [driver, open]);

  const assignMutation = useMutation({
    mutationFn: ({ driverId, vehicleId }: { driverId: string; vehicleId: string }) =>
      driversApi.assignVehicle(driverId, vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({
        title: t('assignment.assignmentUpdated'),
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('errors.saveError'),
        variant: "destructive",
      });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (driverId: string) => driversApi.unassignVehicle(driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast({
        title: t('assignment.assignmentRemoved'),
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('errors.saveError'),
        variant: "destructive",
      });
    },
  });

  const handleAssign = () => {
    if (!selectedVehicleId) {
      toast({
        title: t('common.error'),
        description: t('assignment.selectVehicle'),
        variant: "destructive",
      });
      return;
    }
    assignMutation.mutate({
      driverId: driver.id.toString(),
      vehicleId: selectedVehicleId,
    });
  };

  const handleUnassign = () => {
    unassignMutation.mutate(driver.id.toString());
  };

  const availableVehicles = vehicles?.filter(
    (v: any) => !v.assigned_driver_id || v.assigned_driver_id === driver?.id
  );

  if (!driver) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('assignment.vehicleAssignment')} - {driver.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{driver.name}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {t('drivers.staffNo')}: {driver.staff_no}
            </div>
            {driver.assigned_vehicle && (
              <div className="flex items-center gap-2 mt-2">
                <Car className="h-4 w-4 text-primary" />
                <Badge variant="outline">{driver.assigned_vehicle}</Badge>
              </div>
            )}
          </div>

          {driver.assigned_vehicle ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('assignment.currentAssignment')}
              </p>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleUnassign}
                disabled={unassignMutation.isPending}
              >
                {unassignMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('assignment.removeAssignment')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">
                  {t('assignment.selectVehicle')} <span className="text-destructive">*</span>
                </Label>
                {vehiclesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <Select
                    value={selectedVehicleId}
                    onValueChange={setSelectedVehicleId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('assignment.selectVehicle')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVehicles && availableVehicles.length > 0 ? (
                        availableVehicles.map((vehicle: any) => (
                          <SelectItem
                            key={vehicle.id}
                            value={vehicle.id.toString()}
                          >
                            {vehicle.license_plate} - {vehicle.model}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          {t('assignment.noAvailableVehicles')}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button variant="outline" onClick={onClose}>
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={
                    assignMutation.isPending ||
                    !selectedVehicleId ||
                    vehiclesLoading
                  }
                >
                  {assignMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('assignment.assignVehicle')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
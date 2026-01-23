import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { vehiclesApi } from "@/lib/api";
import { toast } from "sonner";
import { useState, useEffect } from "react";

interface VehicleFormProps {
  open: boolean;
  onClose: () => void;
  vehicle?: any;
}

export const VehicleForm = ({ open, onClose, vehicle }: VehicleFormProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    license_plate: "",
    model: "",
    department: "",
    fleet: "",
    color: "",
    status: "active",
  });

  useEffect(() => {
    if (vehicle) {
      setFormData({
        license_plate: vehicle.license_plate || "",
        model: vehicle.model || "",
        department: vehicle.department || "",
        fleet: vehicle.fleet || "",
        color: vehicle.color || "",
        status: vehicle.status || "active",
      });
    } else {
      setFormData({
        license_plate: "",
        model: "",
        department: "",
        fleet: "",
        color: "",
        status: "active",
      });
    }
  }, [vehicle, open]);

  const createMutation = useMutation({
    mutationFn: vehiclesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(t('vehicles.vehicleCreated'));
      onClose();
    },
    onError: () => {
      toast.error(t('errors.saveError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => vehiclesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(t('vehicles.vehicleUpdated'));
      onClose();
    },
    onError: () => {
      toast.error(t('errors.saveError'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.license_plate || !formData.model || !formData.department) {
      toast.error(t('vehicles.fillRequired'));
      return;
    }

    if (vehicle) {
      updateMutation.mutate({ id: vehicle.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{vehicle ? t('vehicles.editVehicle') : t('vehicles.addVehicle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="license_plate">{t('vehicles.licensePlate')} *</Label>
            <Input
              id="license_plate"
              value={formData.license_plate}
              onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
              placeholder="Ex: AB-12-CD"
              required
            />
          </div>

          <div>
            <Label htmlFor="model">{t('vehicles.model')} *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Ex: Toyota Hilux 2020"
              required
            />
          </div>

          <div>
            <Label htmlFor="department">{t('vehicles.department')} *</Label>
            <Input
              id="department"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Ex: Logística"
              required
            />
          </div>

          <div>
            <Label htmlFor="fleet">{t('vehicles.fleet')}</Label>
            <Input
              id="fleet"
              value={formData.fleet}
              onChange={(e) => setFormData({ ...formData, fleet: e.target.value })}
              placeholder="Ex: Frota Norte"
            />
          </div>

          <div>
            <Label htmlFor="color">{t('vehicles.color')}</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              placeholder="Ex: Branco, Vermelho, Azul"
            />
          </div>

          <div>
            <Label htmlFor="status">{t('vehicles.status')} *</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('vehicles.statusActive')}</SelectItem>
                <SelectItem value="maintenance">{t('vehicles.statusMaintenance')}</SelectItem>
                <SelectItem value="on_leave">{t('vehicles.statusOnLeave')}</SelectItem>
                <SelectItem value="inactive">{t('vehicles.statusInactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
              {vehicle ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
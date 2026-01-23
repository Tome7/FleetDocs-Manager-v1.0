import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { driversApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Phone, Camera, Trash2, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DriverFormProps {
  open: boolean;
  onClose: () => void;
  driver?: any;
}

export function DriverForm({ open, onClose, driver }: DriverFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    staff_no: "",
    name: "",
    contact: "",
    alternative_contact: "",
    contact_malawi: "",
    contact_zambia: "",
    contact_zimbabwe: "",
    date_of_birth: "",
    sex: "",
    driver_license_number: "",
    driver_license_expiry: "",
    position: "",
    department: "",
    fleet: "",
    profile_photo: "",
    notes: "",
    status: "active",
  });

  const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

  useEffect(() => {
    if (driver) {
      setFormData({
        staff_no: driver.staff_no || "",
        name: driver.name || "",
        contact: driver.contact || "",
        alternative_contact: driver.alternative_contact || "",
        contact_malawi: driver.contact_malawi || "",
        contact_zambia: driver.contact_zambia || "",
        contact_zimbabwe: driver.contact_zimbabwe || "",
        date_of_birth: driver.date_of_birth ? driver.date_of_birth.split('T')[0] : "",
        sex: driver.sex || "",
        driver_license_number: driver.driver_license_number || "",
        driver_license_expiry: driver.driver_license_expiry ? driver.driver_license_expiry.split('T')[0] : "",
        position: driver.position || "",
        department: driver.department || "",
        fleet: driver.fleet || "",
        profile_photo: driver.profile_photo || "",
        notes: driver.notes || "",
        status: driver.status || "active",
      });
      setPhotoPreview(driver.profile_photo ? `${API_BASE}${driver.profile_photo}` : null);
    } else {
      setFormData({
        staff_no: "",
        name: "",
        contact: "",
        alternative_contact: "",
        contact_malawi: "",
        contact_zambia: "",
        contact_zimbabwe: "",
        date_of_birth: "",
        sex: "",
        driver_license_number: "",
        driver_license_expiry: "",
        position: "",
        department: "",
        fleet: "",
        profile_photo: "",
        notes: "",
        status: "active",
      });
      setPhotoPreview(null);
    }
    setPhotoFile(null);
  }, [driver, API_BASE]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (driver) {
        return driversApi.update(driver.id, data);
      }
      return driversApi.create(data);
    },
    onSuccess: async (response) => {
      if (photoFile && (driver?.id || response?.id)) {
        const driverId = driver?.id || response?.id;
        try {
          setIsUploadingPhoto(true);
          await driversApi.uploadPhoto(driverId.toString(), photoFile);
        } catch (error) {
          console.error('Error uploading photo:', error);
          toast({
            title: t('common.error'),
            description: t('drivers.photoSavedWarning'),
            variant: "destructive",
          });
        } finally {
          setIsUploadingPhoto(false);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      toast({
        title: driver ? t('drivers.driverUpdated') : t('drivers.driverCreated'),
        description: driver ? t('drivers.driverUpdatedDesc') : t('drivers.driverCreatedDesc'),
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

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('common.error'),
          description: t('drivers.photoMaxSize'),
          variant: "destructive",
        });
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = async () => {
    if (driver?.id && formData.profile_photo) {
      try {
        await driversApi.deletePhoto(driver.id.toString());
        setFormData({ ...formData, profile_photo: "" });
        queryClient.invalidateQueries({ queryKey: ["drivers"] });
        toast({
          title: t('drivers.photoRemoved'),
          description: t('drivers.photoRemovedDesc'),
        });
      } catch (error) {
        toast({
          title: t('common.error'),
          description: t('errors.deleteError'),
          variant: "destructive",
        });
      }
    }
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {driver ? t('drivers.editDriver') : t('drivers.addDriver')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col items-center gap-4 pb-4 border-b">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={photoPreview || undefined} alt={t('drivers.driverPhoto')} />
                <AvatarFallback className="bg-primary/10">
                  <User className="h-12 w-12 text-primary" />
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4 mr-1" />
                {photoPreview ? t('drivers.changePhoto') : t('drivers.addPhoto')}
              </Button>
              {photoPreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t('common.remove')}
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="staff_no">
                {t('drivers.staffNo')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staff_no"
                value={formData.staff_no}
                onChange={(e) => setFormData({ ...formData, staff_no: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                {t('drivers.name')} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {t('drivers.contacts')}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact">
                  {t('drivers.mainContact')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                  placeholder="+258 XX XXX XXXX"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternative_contact">{t('drivers.altContact')}</Label>
                <Input
                  id="alternative_contact"
                  value={formData.alternative_contact}
                  onChange={(e) => setFormData({ ...formData, alternative_contact: e.target.value })}
                  placeholder="+258 XX XXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_malawi">{t('drivers.contactMalawi')}</Label>
                <Input
                  id="contact_malawi"
                  value={formData.contact_malawi}
                  onChange={(e) => setFormData({ ...formData, contact_malawi: e.target.value })}
                  placeholder="+265 XX XXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_zambia">{t('drivers.contactZambia')}</Label>
                <Input
                  id="contact_zambia"
                  value={formData.contact_zambia}
                  onChange={(e) => setFormData({ ...formData, contact_zambia: e.target.value })}
                  placeholder="+260 XX XXX XXXX"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_zimbabwe">{t('drivers.contactZimbabwe')}</Label>
                <Input
                  id="contact_zimbabwe"
                  value={formData.contact_zimbabwe}
                  onChange={(e) => setFormData({ ...formData, contact_zimbabwe: e.target.value })}
                  placeholder="+263 XX XXX XXXX"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">{t('drivers.dateOfBirth')}</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sex">{t('drivers.sex')}</Label>
              <Select
                value={formData.sex}
                onValueChange={(value) => setFormData({ ...formData, sex: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('common.select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">{t('drivers.male')}</SelectItem>
                  <SelectItem value="F">{t('drivers.female')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">{t('drivers.position')}</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driver_license_number">{t('drivers.licenseNumber')}</Label>
              <Input
                id="driver_license_number"
                value={formData.driver_license_number}
                onChange={(e) => setFormData({ ...formData, driver_license_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver_license_expiry">{t('drivers.licenseExpiry')}</Label>
              <Input
                id="driver_license_expiry"
                type="date"
                value={formData.driver_license_expiry}
                onChange={(e) => setFormData({ ...formData, driver_license_expiry: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">{t('vehicles.department')}</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fleet">{t('vehicles.fleet')}</Label>
              <Input
                id="fleet"
                value={formData.fleet}
                onChange={(e) => setFormData({ ...formData, fleet: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t('common.status')}</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t('vehicles.statusActive')}</SelectItem>
                <SelectItem value="on_leave">{t('vehicles.statusOnLeave')}</SelectItem>
                <SelectItem value="inactive">{t('vehicles.statusInactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('common.notes')}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={mutation.isPending || isUploadingPhoto}>
              {(mutation.isPending || isUploadingPhoto) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {driver ? t('common.update') : t('common.create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Phone,
  Building2,
  FileText,
  AlertTriangle,
  Edit,
  Trash2,
  Car,
  Calendar,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

interface DriverCardProps {
  driver: any;
  onEdit: () => void;
  onDelete: () => void;
  onViewDocuments: () => void;
  onAssignVehicle?: () => void;
}

const calculateAge = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export function DriverCard({
  driver,
  onEdit,
  onDelete,
  onViewDocuments,
  onAssignVehicle,
}: DriverCardProps) {
  const { t } = useTranslation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-valid";
      case "on_leave": return "bg-expiring";
      case "inactive": return "bg-expired";
      default: return "bg-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return t('vehicles.statusActive');
      case "on_leave": return t('vehicles.statusOnLeave');
      case "inactive": return t('vehicles.statusInactive');
      default: return status;
    }
  };

  const getSexLabel = (sex: string | null) => {
    if (sex === 'M') return t('drivers.male');
    if (sex === 'F') return t('drivers.female');
    return null;
  };

  const age = calculateAge(driver.date_of_birth);
  const sexLabel = getSexLabel(driver.sex);
  const profilePhotoUrl = driver.profile_photo ? `${API_BASE}${driver.profile_photo}` : null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Avatar className="h-12 w-12 cursor-zoom-in hover:ring-2 hover:ring-primary transition-all">
                  <AvatarImage 
                    src={profilePhotoUrl || undefined} 
                    alt={driver.name} 
                  />
                  <AvatarFallback className="bg-primary/10">
                    <User className="h-6 w-6 text-primary" />
                  </AvatarFallback>
                </Avatar>
              </DialogTrigger>
              <DialogContent className="max-w-[90vw] sm:max-w-[450px] p-0 overflow-hidden border-none bg-transparent shadow-none">
                <DialogHeader className="sr-only">
                  <DialogTitle>{t('drivers.photoOf')} {driver.name}</DialogTitle>
                </DialogHeader>
                <div className="flex items-center justify-center p-1">
                  {profilePhotoUrl ? (
                    <img 
                      src={profilePhotoUrl} 
                      alt={driver.name} 
                      className="rounded-lg max-h-[80vh] w-auto object-contain shadow-2xl"
                    />
                  ) : (
                    <div className="bg-muted p-20 rounded-lg flex flex-col items-center">
                      <User className="h-20 w-20 text-muted-foreground" />
                      <span className="text-muted-foreground mt-2">{t('drivers.noPhoto')}</span>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <div>
              <h3 className="font-semibold text-lg">{driver.name}</h3>
              <p className="text-sm text-muted-foreground">
                {t('drivers.staffNo')} {driver.staff_no}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(driver.status)}>
            {getStatusLabel(driver.status)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {(age !== null || sexLabel) && (
          <div className="flex items-center gap-4 text-sm">
            {age !== null && (
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{age} {t('drivers.years')}</span>
              </div>
            )}
            {sexLabel && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{sexLabel}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span>{driver.contact}</span>
        </div>

        {driver.department && (
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{driver.department}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          {driver.assigned_vehicle ? (
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{driver.assigned_vehicle}</span>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">{t('drivers.noVehicleAssigned')}</span>
          )}
          {onAssignVehicle && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={onAssignVehicle}
            >
              {t('drivers.manage')}
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{driver.total_documents || 0} {t('documents.docs')}</span>
            </div>
            {(driver.expired_documents > 0 || driver.expiring_documents > 0) && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>
                  {driver.expired_documents > 0 && `${driver.expired_documents} ${t('documents.exp')}`}
                  {driver.expired_documents > 0 && driver.expiring_documents > 0 && " / "}
                  {driver.expiring_documents > 0 && `${driver.expiring_documents} ${t('documents.toExp')}`}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onViewDocuments}
          >
            <FileText className="h-4 w-4 mr-1" />
            {t('common.documents')}
          </Button>
          <Button variant="ghost" size="icon" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
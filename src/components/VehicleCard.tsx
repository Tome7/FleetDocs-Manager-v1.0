import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, MapPin, MoreVertical, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VehicleCardProps {
  vehicle: {
    id: string;
    license_plate: string;
    model: string;
    department: string;
    fleet?: string;
    status: string;
    total_documents?: number;
    expired_documents?: number;
    expiring_documents?: number;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export const VehicleCard = ({ vehicle, onEdit, onDelete }: VehicleCardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const vehicleStatus = vehicle.status || 'active';

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: t('vehicles.statusActive'), className: "bg-success text-success-foreground hover:bg-success" };
      case 'maintenance':
        return { label: t('vehicles.statusMaintenance'), className: "bg-warning text-warning-foreground hover:bg-warning" };
      case 'inactive':
        return { label: t('vehicles.statusInactive'), className: "bg-expired text-expired-foreground hover:bg-expired" };
      case 'on_leave':
        return { label: t('vehicles.statusOnLeave'), className: "bg-muted text-muted-foreground hover:bg-muted" };
      default:
        return { label: t('vehicles.statusActive'), className: "bg-success text-success-foreground hover:bg-success" };
    }
  };

  const config = getStatusConfig(vehicleStatus);

  return (
    <Card className="p-4 shadow-card transition-smooth hover:shadow-card-hover border-2 hover:border-primary/40">
      <div className="flex items-start justify-between mb-3">
        <div onClick={() => navigate(`/vehicle/${vehicle.id}`)} className="cursor-pointer flex-1">
          <h3 className="text-lg font-bold mb-1">{vehicle.license_plate}</h3>
          <p className="text-sm text-muted-foreground">{vehicle.model}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={config.className}>{config.label}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(); }}>
                <Edit className="h-4 w-4 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-2 mb-4 cursor-pointer" onClick={() => navigate(`/vehicle/${vehicle.id}`)}>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">{vehicle.department}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{vehicle.total_documents || 0} {t('documents.docs')}</span>
          </div>
          {((vehicle.expired_documents || 0) > 0 || (vehicle.expiring_documents || 0) > 0) && (
            <div className="flex items-center gap-1 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>
                {(vehicle.expired_documents || 0) > 0 && `${vehicle.expired_documents} ${t('documents.exp')}`}
                {(vehicle.expired_documents || 0) > 0 && (vehicle.expiring_documents || 0) > 0 && " / "}
                {(vehicle.expiring_documents || 0) > 0 && `${vehicle.expiring_documents} ${t('documents.toExp')}`}
              </span>
            </div>
          )}
        </div>
      </div>

      <Button variant="outline" className="w-full mt-3" onClick={() => navigate(`/vehicle/${vehicle.id}`)}>
        {t('vehicles.viewDetails')}
      </Button>
    </Card>
  );
};
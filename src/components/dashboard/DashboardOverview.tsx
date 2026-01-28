import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Truck, 
  Users, 
  FileCheck, 
  AlertTriangle, 
  FileX,
  TrendingUp,
  Activity
} from "lucide-react";
import { documentsApi, driverDocumentsApi, vehiclesApi, driversApi } from "@/lib/api";
import { DashboardCharts } from "@/components/DashboardCharts";

// Utility function to calculate document status based on expiry date
const getDocumentStatus = (expiryDateString: string | null | undefined): 'valid' | 'warning' | 'expired' => {
  if (!expiryDateString) return 'valid';

  let expiryDate: Date;
  
  if (typeof expiryDateString === 'string' && expiryDateString.includes('/')) {
    const parts = expiryDateString.split('/');
    expiryDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  } else {
    expiryDate = new Date(expiryDateString);
  }

  if (isNaN(expiryDate.getTime())) return 'valid';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 30) return 'warning';
  return 'valid';
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant: "default" | "success" | "warning" | "expired" | "info";
  subtitle?: string;
}

const StatCard = ({ title, value, icon, variant, subtitle }: StatCardProps) => {
  const variantStyles = {
    default: "bg-white border-border hover:border-primary/30",
    success: "bg-white border-success/20 hover:border-success/40",
    warning: "bg-white border-warning/20 hover:border-warning/40",
    expired: "bg-white border-expired/20 hover:border-expired/40",
    info: "bg-white border-primary/20 hover:border-primary/40",
  };

  const iconContainerStyles = {
    default: "bg-primary/10",
    success: "bg-success/10",
    warning: "bg-warning/10",
    expired: "bg-expired/10",
    info: "bg-primary/10",
  };

  const iconStyles = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    expired: "text-expired",
    info: "text-primary",
  };

  return (
    <Card className={`p-5 border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconContainerStyles[variant]}`}>
          <div className={iconStyles[variant]}>{icon}</div>
        </div>
      </div>
    </Card>
  );
};

export const DashboardOverview = () => {
  const { t } = useTranslation();

  // Fetch all necessary data
  const { data: vehicles = [], isLoading: vehiclesLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.getAll,
  });

  const { data: drivers = [], isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: driversApi.getAll,
  });

  const { data: vehicleDocuments = [], isLoading: vehicleDocsLoading } = useQuery({
    queryKey: ['all-documents-stats'],
    queryFn: documentsApi.getAll,
  });

  const { data: driverDocuments = [], isLoading: driverDocsLoading } = useQuery({
    queryKey: ['all-driver-documents-stats'],
    queryFn: driverDocumentsApi.getAll,
  });

  const isLoading = vehiclesLoading || driversLoading || vehicleDocsLoading || driverDocsLoading;

  // Calculate document statistics
  const allDocs = [...(vehicleDocuments || []), ...(driverDocuments || [])];
  
  let validCount = 0;
  let warningCount = 0;
  let expiredCount = 0;

  allDocs.forEach((doc: any) => {
    const status = getDocumentStatus(doc.expiry_date);
    if (status === 'valid') validCount++;
    else if (status === 'warning') warningCount++;
    else if (status === 'expired') expiredCount++;
  });

  // Calculate vehicle statistics
  const activeVehicles = vehicles?.filter((v: any) => v.status === 'active').length || 0;
  const maintenanceVehicles = vehicles?.filter((v: any) => v.status === 'maintenance').length || 0;

  // Calculate driver statistics
  const activeDrivers = drivers?.filter((d: any) => d.status === 'active').length || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-5 border-2 animate-pulse">
              <div className="h-20 bg-muted rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-border/50 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{t('navigation.dashboard')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.systemOverview')}
          </p>
        </div>
        <Badge className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border-0 hover:bg-primary/15">
          <Activity className="h-3 w-3 animate-pulse" />
          <span className="text-xs font-medium">{t('dashboard.synchronized')}</span>
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard
          title={t('dashboard.totalVehicles')}
          value={vehicles?.length || 0}
          icon={<Truck className="h-6 w-6" />}
          variant="info"
          subtitle={`${activeVehicles} ${t('vehicles.active').toLowerCase()} • ${maintenanceVehicles} ${t('vehicles.maintenance').toLowerCase()}`}
        />
        <StatCard
          title={t('dashboard.totalDrivers')}
          value={drivers?.length || 0}
          icon={<Users className="h-6 w-6" />}
          variant="default"
          subtitle={`${activeDrivers} ${t('drivers.active').toLowerCase()}`}
        />
        <StatCard
          title={t('dashboard.validDocuments')}
          value={validCount}
          icon={<FileCheck className="h-6 w-6" />}
          variant="success"
          subtitle={`${t('common.documents').toLowerCase()}`}
        />
        <StatCard
          title={t('dashboard.nearExpiry')}
          value={warningCount}
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="warning"
          subtitle={t('alerts.days30')}
        />
        <StatCard
          title={t('dashboard.expired')}
          value={expiredCount}
          icon={<FileX className="h-6 w-6" />}
          variant="expired"
          subtitle={t('common.actions').toLowerCase()}
        />
      </div>

      {/* Charts Section */}
      <div className="mt-6">
        <DashboardCharts vehicles={vehicles || []} />
      </div>
    </div>
  );
};

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
    default: "bg-card border-border",
    success: "bg-success/10 border-success/30",
    warning: "bg-warning/10 border-warning/30",
    expired: "bg-expired/10 border-expired/30",
    info: "bg-primary/10 border-primary/30",
  };

  const iconStyles = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    expired: "text-expired",
    info: "text-primary",
  };

  return (
    <Card className={`p-5 border-2 shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-background/50 ${iconStyles[variant]}`}>
          {icon}
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('navigation.dashboard') || 'Visão Geral'}</h2>
          <p className="text-sm text-muted-foreground">
            {t('dashboard.systemOverview') || 'Resumo do sistema em tempo real'}
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1">
          <Activity className="h-3 w-3 text-success animate-pulse" />
          <span className="text-xs">Sincronizado</span>
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <StatCard
          title={t('dashboard.totalVehicles')}
          value={vehicles?.length || 0}
          icon={<Truck className="h-6 w-6" />}
          variant="info"
          subtitle={`${activeVehicles} ativos • ${maintenanceVehicles} manutenção`}
        />
        <StatCard
          title={t('dashboard.totalDrivers') || 'Total Motoristas'}
          value={drivers?.length || 0}
          icon={<Users className="h-6 w-6" />}
          variant="default"
          subtitle={`${activeDrivers} ativos`}
        />
        <StatCard
          title={t('dashboard.validDocuments')}
          value={validCount}
          icon={<FileCheck className="h-6 w-6" />}
          variant="success"
          subtitle={`de ${allDocs.length} documentos`}
        />
        <StatCard
          title={t('dashboard.nearExpiry')}
          value={warningCount}
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="warning"
          subtitle="próximos 30 dias"
        />
        <StatCard
          title={t('dashboard.expired')}
          value={expiredCount}
          icon={<FileX className="h-6 w-6" />}
          variant="expired"
          subtitle="requerem ação"
        />
      </div>

      {/* Charts Section */}
      <div className="mt-6">
        <DashboardCharts vehicles={vehicles || []} />
      </div>
    </div>
  );
};

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, FileText, Truck } from "lucide-react";
import { documentsApi, driverDocumentsApi } from "@/lib/api";

// Utility function to calculate document status
const getDocStatus = (expiryDateString: string | null | undefined): 'valid' | 'warning' | 'expired' => {
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
  variant: "default" | "success" | "warning" | "expired";
}

const StatCard = ({ title, value, icon, variant }: StatCardProps) => {
  const variantStyles = {
    default: "bg-card border-border",
    success: "bg-success/10 border-success/30",
    warning: "bg-warning/10 border-warning/30",
    expired: "bg-expired/10 border-expired/30",
  };

  const iconStyles = {
    default: "text-primary",
    success: "text-success",
    warning: "text-warning",
    expired: "text-expired",
  };

  return (
    <Card className={`p-4 border-2 shadow-card transition-smooth hover:shadow-card-hover ${variantStyles[variant]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-background/50 ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

interface DashboardStatsProps {
  vehicles: any[];
}

export const DashboardStats = ({ vehicles }: DashboardStatsProps) => {
  const { t } = useTranslation();

  const { data: allDocuments } = useQuery({
    queryKey: ['all-documents-stats'],
    queryFn: documentsApi.getAll,
  });

  const { data: driverDocuments } = useQuery({
    queryKey: ['all-driver-documents-stats'],
    queryFn: driverDocumentsApi.getAll,
  });

  const totalVehicles = vehicles.length;
  
  const vehicleDocs = allDocuments || [];
  const driverDocs = driverDocuments || [];
  const allDocs = [...vehicleDocs, ...driverDocs];

  let validCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;

  allDocs.forEach((doc: any) => {
    const status = getDocStatus(doc.expiry_date);
    
    if (status === 'valid') validCount++;
    else if (status === 'warning') expiringCount++;
    else if (status === 'expired') expiredCount++;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        title={t('dashboard.totalVehicles')}
        value={totalVehicles}
        icon={<Truck className="h-6 w-6" />}
        variant="default"
      />
      <StatCard
        title={t('dashboard.validDocuments')}
        value={validCount}
        icon={<CheckCircle className="h-6 w-6" />}
        variant="success"
      />
      <StatCard
        title={t('dashboard.nearExpiry')}
        value={expiringCount}
        icon={<AlertCircle className="h-6 w-6" />}
        variant="warning"
      />
      <StatCard
        title={t('dashboard.expired')}
        value={expiredCount}
        icon={<FileText className="h-6 w-6" />}
        variant="expired"
      />
    </div>
  );
};

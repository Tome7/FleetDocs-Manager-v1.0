// import { useTranslation } from "react-i18next";
// import { useQuery } from "@tanstack/react-query";
// import { Card } from "@/components/ui/card";
// import { AlertCircle, CheckCircle, FileText, Truck } from "lucide-react";
// import { documentsApi, driverDocumentsApi } from "@/lib/api";

// interface StatCardProps {
//   title: string;
//   value: number;
//   icon: React.ReactNode;
//   variant: "default" | "success" | "warning" | "expired";
// }

// const StatCard = ({ title, value, icon, variant }: StatCardProps) => {
//   const variantStyles = {
//     default: "bg-card border-border",
//     success: "bg-success/10 border-success/30",
//     warning: "bg-warning/10 border-warning/30",
//     expired: "bg-expired/10 border-expired/30",
//   };

//   const iconStyles = {
//     default: "text-primary",
//     success: "text-success",
//     warning: "text-warning",
//     expired: "text-expired",
//   };

//   return (
//     <Card className={`p-4 border-2 shadow-card transition-smooth hover:shadow-card-hover ${variantStyles[variant]}`}>
//       <div className="flex items-start justify-between">
//         <div>
//           <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
//           <p className="text-3xl font-bold">{value}</p>
//         </div>
//         <div className={`p-3 rounded-lg bg-background/50 ${iconStyles[variant]}`}>
//           {icon}
//         </div>
//       </div>
//     </Card>
//   );
// };

// interface DashboardStatsProps {
//   vehicles: any[];
// }

// export const DashboardStats = ({ vehicles }: DashboardStatsProps) => {
//   const { t } = useTranslation();

//   const { data: allDocuments } = useQuery({
//     queryKey: ['all-documents-stats'],
//     queryFn: documentsApi.getAll,
//   });

//   const { data: driverDocuments } = useQuery({
//     queryKey: ['all-driver-documents-stats'],
//     queryFn: driverDocumentsApi.getAll,
//   });

//   const totalVehicles = vehicles.length;
  
//   const vehicleDocs = allDocuments || [];
//   const driverDocs = driverDocuments || [];
  
//   const validCount = vehicleDocs.filter((d: any) => d.current_status === 'valid' || d.current_status === 'permanent').length +
//                      driverDocs.filter((d: any) => d.current_status === 'valid' || d.current_status === 'permanent').length;
  
//   const expiringCount = vehicleDocs.filter((d: any) => d.current_status === 'expiring_30_days').length +
//                         driverDocs.filter((d: any) => d.current_status === 'expiring_30_days').length;
  
//   const expiredCount = vehicleDocs.filter((d: any) => d.current_status === 'expired').length +
//                        driverDocs.filter((d: any) => d.current_status === 'expired').length;
  
//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//       <StatCard
//         title={t('dashboard.totalVehicles')}
//         value={totalVehicles}
//         icon={<Truck className="h-6 w-6" />}
//         variant="default"
//       />
//       <StatCard
//         title={t('dashboard.validDocuments')}
//         value={validCount}
//         icon={<CheckCircle className="h-6 w-6" />}
//         variant="success"
//       />
//       <StatCard
//         title={t('dashboard.nearExpiry')}
//         value={expiringCount}
//         icon={<AlertCircle className="h-6 w-6" />}
//         variant="warning"
//       />
//       <StatCard
//         title={t('dashboard.expired')}
//         value={expiredCount}
//         icon={<FileText className="h-6 w-6" />}
//         variant="expired"
//       />
//     </div>
//   );
// };

import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle, FileText, Truck } from "lucide-react";
import { documentsApi, driverDocumentsApi } from "@/lib/api";

// --- COMPONENTE DO CARTÃO (Visual) ---
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

// --- LÓGICA DE CÁLCULO DE DATAS ---
// Calcula o estado baseado na data de hoje vs data de validade
const getDocStatus = (expiryDateString: string | null | undefined) => {
  // Se não tem data de validade, assume-se que é permanente/válido
  if (!expiryDateString) return 'valid';

  let expiryDate;
  
  // Tratamento robusto para formatos de data (DD/MM/YYYY ou YYYY-MM-DD)
  if (typeof expiryDateString === 'string' && expiryDateString.includes('/')) {
    const parts = expiryDateString.split('/');
    // new Date(Ano, Mês-1, Dia)
    expiryDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  } else {
    expiryDate = new Date(expiryDateString);
  }

  // Se a data for inválida, conta como válido para não dar erro
  if (isNaN(expiryDate.getTime())) return 'valid';

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Zerar horas para comparar apenas dias
  
  // Diferença em milissegundos convertida para dias
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return 'expired';   // Já passou
  if (daysRemaining <= 30) return 'warning'; // Vence nos próximos 30 dias (inclui 3, 7, 15)
  return 'valid';                            // Vence daqui a muito tempo
};

// --- COMPONENTE PRINCIPAL ---
interface DashboardStatsProps {
  vehicles: any[];
}

export const DashboardStats = ({ vehicles }: DashboardStatsProps) => {
  const { t } = useTranslation();

  // Buscar documentos de veículos
  const { data: allDocuments } = useQuery({
    queryKey: ['all-documents-stats'],
    queryFn: documentsApi.getAll,
  });

  // Buscar documentos de motoristas
  const { data: driverDocuments } = useQuery({
    queryKey: ['all-driver-documents-stats'],
    queryFn: driverDocumentsApi.getAll,
  });

  const totalVehicles = vehicles.length;
  
  // Combinar as duas listas (segurança caso a API retorne undefined)
  const vehicleDocs = allDocuments || [];
  const driverDocs = driverDocuments || [];
  const allDocs = [...vehicleDocs, ...driverDocs];

  // Contadores
  let validCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;

  // Loop único para processar tudo
  allDocs.forEach((doc: any) => {
    // Usamos a função auxiliar para determinar o estado REAL
    const status = getDocStatus(doc.expiry_date);
    
    if (status === 'valid') {
      validCount++;
    } else if (status === 'warning') {
      expiringCount++;
    } else if (status === 'expired') {
      expiredCount++;
    }
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
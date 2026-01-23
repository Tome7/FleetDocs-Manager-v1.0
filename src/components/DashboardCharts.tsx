import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { documentsApi, driverDocumentsApi, driversApi } from "@/lib/api";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Cores do design system
const COLORS = {
  valid: "hsl(142, 76%, 36%)",      // success
  warning: "hsl(38, 92%, 50%)",     // warning
  expired: "hsl(0, 72%, 51%)",      // expired/destructive
  primary: "hsl(211, 85%, 45%)",    // primary
  secondary: "hsl(210, 15%, 92%)",  // secondary
};

// Calcular estado do documento baseado na data
const getDocStatus = (expiryDateString: string | null | undefined) => {
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

interface DashboardChartsProps {
  vehicles: any[];
}

export const DashboardCharts = ({ vehicles }: DashboardChartsProps) => {
  const { t } = useTranslation();

  const { data: allDocuments } = useQuery({
    queryKey: ['all-documents-stats'],
    queryFn: documentsApi.getAll,
  });

  const { data: driverDocuments } = useQuery({
    queryKey: ['all-driver-documents-stats'],
    queryFn: driverDocumentsApi.getAll,
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: driversApi.getAll,
  });

  const vehicleDocs = allDocuments || [];
  const driverDocs = driverDocuments || [];
  const allDocs = [...vehicleDocs, ...driverDocs];

  // Contagem de documentos por estado
  let validCount = 0;
  let expiringCount = 0;
  let expiredCount = 0;

  allDocs.forEach((doc: any) => {
    const status = getDocStatus(doc.expiry_date);
    if (status === 'valid') validCount++;
    else if (status === 'warning') expiringCount++;
    else if (status === 'expired') expiredCount++;
  });

  const documentStatusData = [
    { name: t('dashboard.validDocuments'), value: validCount, color: COLORS.valid },
    { name: t('dashboard.nearExpiry'), value: expiringCount, color: COLORS.warning },
    { name: t('dashboard.expired'), value: expiredCount, color: COLORS.expired },
  ];

  // Contagem de veículos por estado
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const inactiveVehicles = vehicles.filter(v => v.status === 'inactive').length;

  const vehicleStatusData = [
    { name: t('vehicles.active'), value: activeVehicles, color: COLORS.valid },
    { name: t('vehicles.maintenance'), value: maintenanceVehicles, color: COLORS.warning },
    { name: t('vehicles.inactive'), value: inactiveVehicles, color: COLORS.expired },
  ];

  // Contagem de motoristas por estado
  const activeDrivers = drivers?.filter((d: any) => d.status === 'active').length || 0;
  const inactiveDrivers = drivers?.filter((d: any) => d.status !== 'active').length || 0;

  const driverStatusData = [
    { name: t('drivers.active'), value: activeDrivers, color: COLORS.valid },
    { name: t('drivers.inactive'), value: inactiveDrivers, color: COLORS.secondary },
  ];

  // Documentos por departamento (bar chart)
  const departmentCounts: Record<string, { valid: number; warning: number; expired: number }> = {};
  
  vehicleDocs.forEach((doc: any) => {
    const dept = doc.department || 'Sem Departamento';
    if (!departmentCounts[dept]) {
      departmentCounts[dept] = { valid: 0, warning: 0, expired: 0 };
    }
    const status = getDocStatus(doc.expiry_date);
    if (status === 'valid') departmentCounts[dept].valid++;
    else if (status === 'warning') departmentCounts[dept].warning++;
    else if (status === 'expired') departmentCounts[dept].expired++;
  });

  const departmentData = Object.entries(departmentCounts)
    .map(([dept, counts]) => ({
      department: dept.length > 12 ? dept.substring(0, 12) + '...' : dept,
      [t('dashboard.validDocuments')]: counts.valid,
      [t('dashboard.nearExpiry')]: counts.warning,
      [t('dashboard.expired')]: counts.expired,
    }))
    .slice(0, 6); // Limitar a 6 departamentos para não sobrecarregar

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm text-muted-foreground">{payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {/* Gráfico de Documentos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            {t('dashboard.documentStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={documentStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {documentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Veículos */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            {t('dashboard.vehicleStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={vehicleStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {vehicleStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Motoristas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">
            {t('dashboard.driverStatus')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={driverStatusData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {driverStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Barras por Departamento */}
      {departmentData.length > 0 && (
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              {t('dashboard.documentsByDepartment')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="department" 
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar 
                  dataKey={t('dashboard.validDocuments')} 
                  fill={COLORS.valid} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey={t('dashboard.nearExpiry')} 
                  fill={COLORS.warning} 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey={t('dashboard.expired')} 
                  fill={COLORS.expired} 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

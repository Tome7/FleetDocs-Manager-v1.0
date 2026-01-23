// import { useState } from "react";
// import { useQuery } from "@tanstack/react-query";
// import { reportsApi, vehiclesApi, driversApi } from "@/lib/api";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Download, FileText, FileSpreadsheet, Users } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { 
//   exportVehiclesReport, 
//   exportDocumentsReport, 
//   exportFlowRecordsReport,
//   exportComprehensiveReport
// } from "@/lib/excelExport";

// interface ReportsDialogProps {
//   open: boolean;
//   onClose: () => void;
// }

// export const ReportsDialog = ({ open, onClose }: ReportsDialogProps) => {
//   const { toast } = useToast();
//   const [activeTab, setActiveTab] = useState("general");

//   const { data: vehicles } = useQuery({
//     queryKey: ['vehicles'],
//     queryFn: vehiclesApi.getAll,
//     enabled: open,
//   });

//   const { data: drivers } = useQuery({
//     queryKey: ['drivers'],
//     queryFn: driversApi.getAll,
//     enabled: open,
//   });

//   const { data: expiringDocs } = useQuery({
//     queryKey: ['reports', 'expiring'],
//     queryFn: reportsApi.getExpiringDocuments,
//     enabled: open,
//   });

//   const { data: allDocs } = useQuery({
//     queryKey: ['reports', 'all-documents'],
//     queryFn: reportsApi.getAllDocuments,
//     enabled: open,
//   });

//   const { data: flowRecords } = useQuery({
//     queryKey: ['reports', 'flow-records'],
//     queryFn: () => reportsApi.getFlowRecords(),
//     enabled: open,
//   });

//   const exportToExcel = (type: 'general' | 'vehicles' | 'documents' | 'flow') => {
//     try {
//       switch (type) {
//         case 'general':
//           if (vehicles && drivers) {
//             exportComprehensiveReport(vehicles, drivers);
//             toast({
//               title: "Excel exportado",
//               description: "Relatório geral exportado com sucesso",
//             });
//           }
//           break;
//         case 'vehicles':
//           if (vehicles) {
//             exportVehiclesReport(vehicles);
//             toast({
//               title: "Excel exportado",
//               description: "Relatório de veículos exportado com sucesso",
//             });
//           }
//           break;
//         case 'documents':
//           if (allDocs) {
//             exportDocumentsReport(allDocs);
//             toast({
//               title: "Excel exportado",
//               description: "Relatório de documentos exportado com sucesso",
//             });
//           }
//           break;
//         case 'flow':
//           if (flowRecords) {
//             exportFlowRecordsReport(flowRecords);
//             toast({
//               title: "Excel exportado",
//               description: "Relatório de movimentações exportado com sucesso",
//             });
//           }
//           break;
//       }
//     } catch (error) {
//       toast({
//         title: "Erro",
//         description: "Erro ao exportar para Excel",
//         variant: "destructive",
//       });
//     }
//   };

//   const exportToCSV = (data: any[], filename: string) => {
//     if (!data || data.length === 0) {
//       toast({
//         title: "Sem dados",
//         description: "Não há dados para exportar",
//         variant: "destructive",
//       });
//       return;
//     }

//     const headers = Object.keys(data[0]).join(',');
//     const rows = data.map(row => Object.values(row).join(',')).join('\n');
//     const csv = `${headers}\n${rows}`;
    
//     const blob = new Blob([csv], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
//     a.click();
//     window.URL.revokeObjectURL(url);

//     toast({
//       title: "Exportado com sucesso",
//       description: `Relatório ${filename} exportado`,
//     });
//   };

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <FileText className="h-5 w-5" />
//             Relatórios
//           </DialogTitle>
//         </DialogHeader>

//         <Tabs value={activeTab} onValueChange={setActiveTab}>
//           <TabsList className="grid w-full grid-cols-5">
//             <TabsTrigger value="general">Geral</TabsTrigger>
//             <TabsTrigger value="vehicles">Frota</TabsTrigger>
//             <TabsTrigger value="expiring">A Expirar</TabsTrigger>
//             <TabsTrigger value="all">Todos Docs</TabsTrigger>
//             <TabsTrigger value="flow">Fluxo</TabsTrigger>
//           </TabsList>

//           {/* General Report - Vehicles with Drivers */}
//           <TabsContent value="general" className="space-y-4">
//             <div className="flex justify-between items-center">
//               <p className="text-sm text-muted-foreground">
//                 Relatório completo: {vehicles?.length || 0} veículos e {drivers?.length || 0} motoristas
//               </p>
//               <div className="flex gap-2">
//                 <Button
//                   size="sm"
//                   variant="default"
//                   onClick={() => exportToExcel('general')}
//                 >
//                   <FileSpreadsheet className="h-4 w-4 mr-2" />
//                   Exportar Excel
//                 </Button>
//               </div>
//             </div>
            
//             <div className="border rounded-lg overflow-hidden">
//               <h3 className="bg-muted p-2 font-medium text-sm flex items-center gap-2">
//                 <Users className="h-4 w-4" />
//                 Veículos com Motoristas Atribuídos
//               </h3>
//               <table className="w-full text-sm">
//                 <thead className="bg-muted/50">
//                   <tr>
//                     <th className="text-left p-2">Matrícula</th>
//                     <th className="text-left p-2">Modelo</th>
//                     <th className="text-left p-2">Departamento</th>
//                     <th className="text-left p-2">Motorista</th>
//                     <th className="text-left p-2">Nº Trabalhador</th>
//                     <th className="text-left p-2">Contacto</th>
//                     <th className="text-left p-2">Estado</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {vehicles?.map((vehicle: any) => (
//                     <tr key={vehicle.id} className="border-t">
//                       <td className="p-2 font-medium">{vehicle.license_plate}</td>
//                       <td className="p-2">{vehicle.model}</td>
//                       <td className="p-2">{vehicle.department}</td>
//                       <td className="p-2">{vehicle.driver_name || <span className="text-muted-foreground">Sem motorista</span>}</td>
//                       <td className="p-2">{vehicle.driver_staff_no || '-'}</td>
//                       <td className="p-2">{vehicle.driver_contact || '-'}</td>
//                       <td className="p-2">
//                         <span className={`px-2 py-1 rounded text-xs ${
//                           vehicle.status === 'active' ? 'bg-success/20 text-success' : 
//                           vehicle.status === 'maintenance' ? 'bg-warning/20 text-warning' : 
//                           'bg-muted text-muted-foreground'
//                         }`}>
//                           {vehicle.status === 'active' ? 'Ativo' : 
//                            vehicle.status === 'maintenance' ? 'Manutenção' : 'Inativo'}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             <div className="border rounded-lg overflow-hidden">
//               <h3 className="bg-muted p-2 font-medium text-sm flex items-center gap-2">
//                 <Users className="h-4 w-4" />
//                 Todos os Motoristas
//               </h3>
//               <table className="w-full text-sm">
//                 <thead className="bg-muted/50">
//                   <tr>
//                     <th className="text-left p-2">Nome</th>
//                     <th className="text-left p-2">Nº Trabalhador</th>
//                     <th className="text-left p-2">Contacto</th>
//                     <th className="text-left p-2">Malawi</th>
//                     <th className="text-left p-2">Zambia</th>
//                     <th className="text-left p-2">Zimbabwe</th>
//                     <th className="text-left p-2">Cargo</th>
//                     <th className="text-left p-2">Estado</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {drivers?.map((driver: any) => (
//                     <tr key={driver.id} className="border-t">
//                       <td className="p-2 font-medium">{driver.name}</td>
//                       <td className="p-2">{driver.staff_no}</td>
//                       <td className="p-2">{driver.contact || '-'}</td>
//                       <td className="p-2">{driver.contact_malawi || '-'}</td>
//                       <td className="p-2">{driver.contact_zambia || '-'}</td>
//                       <td className="p-2">{driver.contact_zimbabwe || '-'}</td>
//                       <td className="p-2">{driver.position || '-'}</td>
//                       <td className="p-2">
//                         <span className={`px-2 py-1 rounded text-xs ${
//                           driver.status === 'active' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
//                         }`}>
//                           {driver.status === 'active' ? 'Ativo' : 'Inativo'}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </TabsContent>

//           <TabsContent value="vehicles" className="space-y-4">
//             <div className="flex justify-between items-center">
//               <p className="text-sm text-muted-foreground">
//                 {vehicles?.length || 0} veículos na frota
//               </p>
//               <div className="flex gap-2">
//                 <Button
//                   size="sm"
//                   variant="default"
//                   onClick={() => exportToExcel('vehicles')}
//                 >
//                   <FileSpreadsheet className="h-4 w-4 mr-2" />
//                   Exportar Excel
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={() => exportToCSV(vehicles || [], 'veiculos')}
//                 >
//                   <Download className="h-4 w-4 mr-2" />
//                   CSV
//                 </Button>
//               </div>
//             </div>
//             <div className="border rounded-lg overflow-hidden">
//               <table className="w-full text-sm">
//                 <thead className="bg-muted">
//                   <tr>
//                     <th className="text-left p-2">Matrícula</th>
//                     <th className="text-left p-2">Modelo</th>
//                     <th className="text-left p-2">Departamento</th>
//                     <th className="text-left p-2">Estado</th>
//                     <th className="text-left p-2">Docs Válidos</th>
//                     <th className="text-left p-2">A Expirar</th>
//                     <th className="text-left p-2">Expirados</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {vehicles?.map((vehicle: any) => (
//                     <tr key={vehicle.id} className="border-t">
//                       <td className="p-2 font-medium">{vehicle.license_plate}</td>
//                       <td className="p-2">{vehicle.model}</td>
//                       <td className="p-2">{vehicle.department}</td>
//                       <td className="p-2">
//                         <span className={`px-2 py-1 rounded text-xs ${
//                           vehicle.status === 'active' ? 'bg-success/20 text-success' : 
//                           vehicle.status === 'maintenance' ? 'bg-warning/20 text-warning' : 
//                           'bg-muted text-muted-foreground'
//                         }`}>
//                           {vehicle.status === 'active' ? 'Ativo' : 
//                            vehicle.status === 'maintenance' ? 'Manutenção' : 'Inativo'}
//                         </span>
//                       </td>
//                       <td className="p-2 text-center">{vehicle.valid_count || 0}</td>
//                       <td className="p-2 text-center text-warning">{vehicle.expiring_count || 0}</td>
//                       <td className="p-2 text-center text-expired">{vehicle.expired_count || 0}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </TabsContent>

//           <TabsContent value="expiring" className="space-y-4">
//             <div className="flex justify-between items-center">
//               <p className="text-sm text-muted-foreground">
//                 {expiringDocs?.length || 0} documentos a expirar ou expirados
//               </p>
//               <div className="flex gap-2">
//                 <Button
//                   size="sm"
//                   variant="default"
//                   onClick={() => exportToExcel('documents')}
//                 >
//                   <FileSpreadsheet className="h-4 w-4 mr-2" />
//                   Exportar Excel
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={() => exportToCSV(expiringDocs || [], 'documentos_expirar')}
//                 >
//                   <Download className="h-4 w-4 mr-2" />
//                   CSV
//                 </Button>
//               </div>
//             </div>
//             <div className="border rounded-lg overflow-hidden">
//               <table className="w-full text-sm">
//                 <thead className="bg-muted">
//                   <tr>
//                     <th className="text-left p-2">Código</th>
//                     <th className="text-left p-2">Veículo/Motorista</th>
//                     <th className="text-left p-2">Documento</th>
//                     <th className="text-left p-2">Validade</th>
//                     <th className="text-left p-2">Estado</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {expiringDocs?.map((doc: any, index: number) => (
//                     <tr key={`${doc.file_code}-${index}`} className="border-t">
//                       <td className="p-2">{doc.file_code}</td>
//                       <td className="p-2">{doc.license_plate || doc.driver_name}</td>
//                       <td className="p-2">{doc.file_name}</td>
//                       <td className="p-2">{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : '-'}</td>
//                       <td className="p-2">
//                         <span className={`px-2 py-1 rounded text-xs ${
//                           doc.current_status === 'expired' ? 'bg-expired/20 text-expired' : 'bg-warning/20 text-warning'
//                         }`}>
//                           {doc.current_status === 'expired' ? 'Expirado' : 'A expirar'}
//                         </span>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </TabsContent>

//           <TabsContent value="all" className="space-y-4">
//             <div className="flex justify-between items-center">
//               <p className="text-sm text-muted-foreground">
//                 {allDocs?.length || 0} documentos no total
//               </p>
//               <div className="flex gap-2">
//                 <Button
//                   size="sm"
//                   variant="default"
//                   onClick={() => exportToExcel('documents')}
//                 >
//                   <FileSpreadsheet className="h-4 w-4 mr-2" />
//                   Exportar Excel
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={() => exportToCSV(allDocs || [], 'todos_documentos')}
//                 >
//                   <Download className="h-4 w-4 mr-2" />
//                   CSV
//                 </Button>
//               </div>
//             </div>
//             <div className="border rounded-lg overflow-hidden">
//               <table className="w-full text-sm">
//                 <thead className="bg-muted">
//                   <tr>
//                     <th className="text-left p-2">Código</th>
//                     <th className="text-left p-2">Veículo/Motorista</th>
//                     <th className="text-left p-2">Tipo</th>
//                     <th className="text-left p-2">Validade</th>
//                     <th className="text-left p-2">Localização</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {allDocs?.map((doc: any, index: number) => (
//                     <tr key={`${doc.file_code}-${index}`} className="border-t">
//                       <td className="p-2">{doc.file_code}</td>
//                       <td className="p-2">{doc.license_plate || doc.driver_name}</td>
//                       <td className="p-2">{doc.file_type}</td>
//                       <td className="p-2">{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString() : 'Sem validade'}</td>
//                       <td className="p-2">{doc.storage_location || '-'}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </TabsContent>

//           <TabsContent value="flow" className="space-y-4">
//             <div className="flex justify-between items-center">
//               <p className="text-sm text-muted-foreground">
//                 {flowRecords?.length || 0} registos de fluxo
//               </p>
//               <div className="flex gap-2">
//                 <Button
//                   size="sm"
//                   variant="default"
//                   onClick={() => exportToExcel('flow')}
//                 >
//                   <FileSpreadsheet className="h-4 w-4 mr-2" />
//                   Exportar Excel
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={() => exportToCSV(flowRecords || [], 'registos_fluxo')}
//                 >
//                   <Download className="h-4 w-4 mr-2" />
//                   CSV
//                 </Button>
//               </div>
//             </div>
//             <div className="border rounded-lg overflow-hidden">
//               <table className="w-full text-sm">
//                 <thead className="bg-muted">
//                   <tr>
//                     <th className="text-left p-2">Motorista</th>
//                     <th className="text-left p-2">Nº Trabalhador</th>
//                     <th className="text-left p-2">Documento</th>
//                     <th className="text-left p-2">Veículo</th>
//                     <th className="text-left p-2">Operação</th>
//                     <th className="text-left p-2">Data</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {flowRecords?.map((record: any, index: number) => (
//                     <tr key={`${record.operation_time}-${index}`} className="border-t">
//                       <td className="p-2">{record.driver_name}</td>
//                       <td className="p-2">{record.staff_no || '-'}</td>
//                       <td className="p-2">{record.file_code}</td>
//                       <td className="p-2">{record.license_plate || '-'}</td>
//                       <td className="p-2">
//                         <span className={`px-2 py-1 rounded text-xs ${
//                           record.operation_type === 'withdrawal' ? 'bg-warning/20 text-warning' : 'bg-success/20 text-success'
//                         }`}>
//                           {record.operation_type === 'withdrawal' ? 'Retirada' : 'Devolução'}
//                         </span>
//                       </td>
//                       <td className="p-2">{new Date(record.operation_time).toLocaleString()}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </TabsContent>
//         </Tabs>
//       </DialogContent>
//     </Dialog>
//   );
// };


import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { reportsApi, vehiclesApi, driversApi, documentsApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, FileSpreadsheet, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  exportVehiclesReport, 
  exportDocumentsReport, 
  exportFlowRecordsReport,
  exportComprehensiveReport
} from "@/lib/excelExport";

// --- FUNÇÕES AUXILIARES (Mesma lógica do Dashboard) ---
const parseDate = (dateString: string | null | undefined) => {
  if (!dateString) return null;
  if (dateString.includes('/')) {
    const parts = dateString.split('/');
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return new Date(dateString);
};

const getDocStatus = (expiryDateString: string | null | undefined) => {
  const expiryDate = parseDate(expiryDateString);
  if (!expiryDate || isNaN(expiryDate.getTime())) return 'valid';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 30) return 'warning';
  return 'valid';
};

const formatDate = (dateString: string | null | undefined) => {
  const date = parseDate(dateString);
  return date && !isNaN(date.getTime()) ? date.toLocaleDateString() : '-';
};

interface ReportsDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ReportsDialog = ({ open, onClose }: ReportsDialogProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.getAll,
    enabled: open,
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: driversApi.getAll,
    enabled: open,
  });

  // Usamos allDocs para calcular tudo (mais seguro que getExpiringDocuments que pode falhar no backend)
  const { data: allDocs } = useQuery({
    queryKey: ['reports', 'all-documents'],
    queryFn: reportsApi.getAllDocuments,
    enabled: open,
  });

  const { data: flowRecords } = useQuery({
    queryKey: ['reports', 'flow-records'],
    queryFn: () => reportsApi.getFlowRecords(),
    enabled: open,
  });

  // --- PROCESSAMENTO INTELIGENTE DE DADOS ---
  // Calcula estatísticas por veículo baseando-se nos documentos reais
  const vehicleStats = useMemo(() => {
    const stats: Record<string, { valid: number; expiring: number; expired: number }> = {};
    
    if (allDocs) {
      allDocs.forEach((doc: any) => {
        // Assume que o doc tem 'vehicle_id' ou conseguimos ligar pelo 'license_plate'
        // Se a API reportsApi.getAllDocuments não trouxer vehicle_id, tenta ligar pela placa
        const key = doc.vehicle_id || doc.license_plate; 
        
        if (key) {
           if (!stats[key]) stats[key] = { valid: 0, expiring: 0, expired: 0 };
           
           const status = getDocStatus(doc.expiry_date);
           if (status === 'valid') stats[key].valid++;
           else if (status === 'warning') stats[key].expiring++;
           else if (status === 'expired') stats[key].expired++;
        }
      });
    }
    return stats;
  }, [allDocs]);

  // Filtra documentos a expirar no Frontend para garantir precisão
  const computedExpiringDocs = useMemo(() => {
    if (!allDocs) return [];
    return allDocs.filter((doc: any) => {
      const status = getDocStatus(doc.expiry_date);
      return status === 'warning' || status === 'expired';
    }).sort((a: any, b: any) => {
      // Ordenar: Expirados primeiro, depois data mais próxima
      const dateA = parseDate(a.expiry_date)?.getTime() || 0;
      const dateB = parseDate(b.expiry_date)?.getTime() || 0;
      return dateA - dateB;
    });
  }, [allDocs]);

  // --- EXPORTAÇÃO ---
  const exportToExcel = (type: 'general' | 'vehicles' | 'documents' | 'flow') => {
    try {
      switch (type) {
        case 'general':
          if (vehicles && drivers) {
            exportComprehensiveReport(vehicles, drivers);
            toast({ title: t("reports.excelExported"), description: t("reports.generalReportDesc") });
          }
          break;
        case 'vehicles':
          if (vehicles) {
            exportVehiclesReport(vehicles);
            toast({ title: t("reports.excelExported"), description: t("reports.vehiclesReportDesc") });
          }
          break;
        case 'documents':
          if (allDocs) {
            exportDocumentsReport(allDocs);
            toast({ title: t("reports.excelExported"), description: t("reports.documentsReportDesc") });
          }
          break;
        case 'flow':
          if (flowRecords) {
            exportFlowRecordsReport(flowRecords);
            toast({ title: t("reports.excelExported"), description: t("reports.flowReportDesc") });
          }
          break;
      }
    } catch (error) {
      toast({ title: t("common.error"), description: t("errors.unexpectedError"), variant: "destructive" });
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast({ title: t("common.noData"), description: t("common.noData"), variant: "destructive" });
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: t("common.success"), description: `CSV ${filename}` });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("reports.title")}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">{t("reports.general")}</TabsTrigger>
            <TabsTrigger value="vehicles">{t("reports.fleet")}</TabsTrigger>
            <TabsTrigger value="expiring">{t("reports.expiring")} ({computedExpiringDocs.length})</TabsTrigger>
            <TabsTrigger value="all">{t("reports.allDocs")}</TabsTrigger>
            <TabsTrigger value="flow">{t("reports.flow")}</TabsTrigger>
          </TabsList>

          {/* 1. GERAL */}
          <TabsContent value="general" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{t("reports.completeReport")}: {vehicles?.length || 0} {t("reports.vehiclesAndDrivers")} {drivers?.length || 0} {t("reports.driversCount")}</p>
              <Button size="sm" onClick={() => exportToExcel('general')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> {t("reports.exportExcel")}
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
               <table className="w-full text-sm">
                 <thead className="bg-muted/50">
                   <tr>
                     <th className="text-left p-2">{t("vehicles.licensePlate")}</th>
                     <th className="text-left p-2">{t("vehicles.model")}</th>
                     <th className="text-left p-2">{t("drivers.name")}</th>
                     <th className="text-left p-2">{t("common.status")}</th>
                   </tr>
                 </thead>
                 <tbody>
                   {vehicles?.map((v: any) => (
                     <tr key={v.id} className="border-t">
                       <td className="p-2 font-medium">{v.license_plate}</td>
                       <td className="p-2">{v.model}</td>
                       <td className="p-2">{v.driver_name || '-'}</td>
                       <td className="p-2"><span className="text-xs bg-muted px-2 py-1 rounded">{v.status}</span></td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </TabsContent>

          {/* 2. FROTA */}
          <TabsContent value="vehicles" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{vehicles?.length || 0} {t("reports.vehiclesInFleet")}</p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => exportToExcel('vehicles')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> {t("reports.exportExcel")}
                </Button>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">{t("vehicles.licensePlate")}</th>
                    <th className="text-left p-2">{t("vehicles.model")}</th>
                    <th className="text-left p-2">{t("common.status")}</th>
                    <th className="text-center p-2">{t("reports.validDocs")}</th>
                    <th className="text-center p-2">{t("reports.expiringDocs")}</th>
                    <th className="text-center p-2">{t("reports.expiredDocs")}</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles?.map((vehicle: any) => {
                    const stats = vehicleStats[vehicle.id] || vehicleStats[vehicle.license_plate] || { valid: 0, expiring: 0, expired: 0 };
                    
                    return (
                    <tr key={vehicle.id} className="border-t">
                      <td className="p-2 font-medium">{vehicle.license_plate}</td>
                      <td className="p-2">{vehicle.model}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          vehicle.status === 'active' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'
                        }`}>{vehicle.status}</span>
                      </td>
                      <td className="p-2 text-center font-medium text-success">{stats.valid}</td>
                      <td className="p-2 text-center font-medium text-warning">{stats.expiring}</td>
                      <td className="p-2 text-center font-bold text-destructive">{stats.expired}</td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* 3. A EXPIRAR */}
          <TabsContent value="expiring" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {computedExpiringDocs.length} {t("reports.expiringOrExpired")}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => exportToExcel('documents')}>
                   <FileSpreadsheet className="h-4 w-4 mr-2" /> {t("reports.exportExcel")}
                </Button>
              </div>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">{t("documents.documentCode")}</th>
                    <th className="text-left p-2">{t("reports.vehicle")}</th>
                    <th className="text-left p-2">{t("reports.document")}</th>
                    <th className="text-left p-2">{t("documents.validity")}</th>
                    <th className="text-left p-2">{t("common.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {computedExpiringDocs.map((doc: any, index: number) => {
                    const status = getDocStatus(doc.expiry_date);
                    return (
                    <tr key={`${doc.file_code}-${index}`} className="border-t">
                      <td className="p-2">{doc.file_code || doc.doc_code || '-'}</td>
                      <td className="p-2">{doc.license_plate || doc.driver_name}</td>
                      <td className="p-2">{doc.file_name || doc.doc_name}</td>
                      <td className="p-2">{formatDate(doc.expiry_date)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          status === 'expired' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'
                        }`}>
                          {status === 'expired' ? t("documents.statusExpired") : t("documents.statusExpiring")}
                        </span>
                      </td>
                    </tr>
                  )})}
                  {computedExpiringDocs.length === 0 && (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">{t("alerts.noAlerts")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* 4. TODOS OS DOCUMENTOS */}
          <TabsContent value="all" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{allDocs?.length || 0} {t("reports.totalDocuments")}</p>
              <Button size="sm" onClick={() => exportToCSV(allDocs || [], 'todos_documentos')}>
                 <Download className="h-4 w-4 mr-2" /> {t("reports.exportCSV")}
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">{t("documents.documentCode")}</th>
                    <th className="text-left p-2">{t("reports.vehicle")}</th>
                    <th className="text-left p-2">{t("documents.documentType")}</th>
                    <th className="text-left p-2">{t("documents.validity")}</th>
                    <th className="text-left p-2">{t("reports.location")}</th>
                  </tr>
                </thead>
                <tbody>
                  {allDocs?.map((doc: any, index: number) => (
                    <tr key={`${doc.id}-${index}`} className="border-t">
                      <td className="p-2">{doc.file_code || doc.doc_code}</td>
                      <td className="p-2">{doc.license_plate || doc.driver_name}</td>
                      <td className="p-2">{doc.file_type || doc.doc_type}</td>
                      <td className="p-2">{formatDate(doc.expiry_date)}</td>
                      <td className="p-2">{doc.storage_location || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* 5. FLUXO */}
          <TabsContent value="flow" className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{flowRecords?.length || 0} {t("reports.flowRecords")}</p>
              <Button size="sm" onClick={() => exportToExcel('flow')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> {t("reports.exportExcel")}
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
               <table className="w-full text-sm">
                 <thead className="bg-muted">
                    <tr>
                      <th className="p-2 text-left">{t("drivers.name")}</th>
                      <th className="p-2 text-left">{t("reports.document")}</th>
                      <th className="p-2 text-left">{t("delivery.operation")}</th>
                      <th className="p-2 text-left">{t("common.date")}</th>
                    </tr>
                 </thead>
                 <tbody>
                    {flowRecords?.map((rec: any, i: number) => (
                      <tr key={i} className="border-t">
                         <td className="p-2">{rec.driver_name}</td>
                         <td className="p-2">{rec.file_code}</td>
                         <td className="p-2">
                           {rec.operation_type === 'withdrawal' 
                             ? <span className="text-warning">{t("delivery.withdrawal")}</span> 
                             : <span className="text-success">{t("delivery.return")}</span>}
                         </td>
                         <td className="p-2">{new Date(rec.operation_time).toLocaleString()}</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
            </div>
          </TabsContent>

        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
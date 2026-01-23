import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  format?: 'date' | 'currency' | 'number' | 'text' | 'status';
}

interface ExcelSheet {
  name: string;
  columns: ExcelColumn[];
  data: any[];
  sortByStatus?: boolean; // Sort by document status (expired first)
}

// Helper function to determine document status based on expiry date
const getDocumentStatusInfo = (expiryDate: string | null | undefined): { status: string; priority: number; label: string } => {
  if (!expiryDate) {
    return { status: 'valid', priority: 3, label: '✓ Válido' };
  }

  let expiry: Date;
  if (typeof expiryDate === 'string' && expiryDate.includes('/')) {
    const parts = expiryDate.split('/');
    expiry = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  } else {
    expiry = new Date(expiryDate);
  }

  if (isNaN(expiry.getTime())) {
    return { status: 'valid', priority: 3, label: '✓ Válido' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: 'expired', priority: 1, label: `⚠️ EXPIRADO (${Math.abs(daysRemaining)} dias)` };
  }
  if (daysRemaining <= 7) {
    return { status: 'critical', priority: 1, label: `🔴 URGENTE (${daysRemaining} dias)` };
  }
  if (daysRemaining <= 30) {
    return { status: 'warning', priority: 2, label: `🟡 A Expirar (${daysRemaining} dias)` };
  }
  return { status: 'valid', priority: 3, label: '✓ Válido' };
};

export class ExcelExporter {
  private workbook: XLSX.WorkBook;

  constructor() {
    this.workbook = XLSX.utils.book_new();
  }

  addSheet(config: ExcelSheet, includeRowNumber: boolean = true) {
    // Prepare data with headers - add sequential "Nº" column for row enumeration (always first column)
    const headers = includeRowNumber 
      ? ['Nº', ...config.columns.map(col => col.header)]
      : config.columns.map(col => col.header);
    
    // Sort data by status priority if requested (expired/critical first)
    let sortedData = [...config.data];
    if (config.sortByStatus) {
      sortedData.sort((a, b) => {
        const statusA = getDocumentStatusInfo(a.expiry_date);
        const statusB = getDocumentStatusInfo(b.expiry_date);
        return statusA.priority - statusB.priority;
      });
    }
    
    const formattedData = sortedData.map((row, index) => {
      const rowData = config.columns.map(col => {
        const value = row[col.key];
        
        // Format based on type
        if (col.format === 'status') {
          // Special handling for status column - show visual indicator
          const statusInfo = getDocumentStatusInfo(row.expiry_date);
          return statusInfo.label;
        }
        
        if (!value && value !== 0) return '';
        
        switch (col.format) {
          case 'date':
            try {
              return format(new Date(value), 'dd/MM/yyyy');
            } catch {
              return value;
            }
          case 'currency':
            return typeof value === 'number' ? value.toFixed(2) : value;
          case 'number':
            return typeof value === 'number' ? value : parseFloat(value) || 0;
          default:
            return value;
        }
      });
      
      // Add row number at the beginning if includeRowNumber is true
      return includeRowNumber ? [index + 1, ...rowData] : rowData;
    });

    // Combine headers and data
    const wsData = [headers, ...formattedData];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths - add width for "Nº" column
    const colWidths = includeRowNumber 
      ? [{ wch: 6 }, ...config.columns.map(col => ({ wch: col.width || 15 }))]
      : config.columns.map(col => ({ wch: col.width || 15 }));
    ws['!cols'] = colWidths;

    // Add autofilter to header row
    const totalColumns = includeRowNumber ? config.columns.length + 1 : config.columns.length;
    if (config.data.length > 0) {
      ws['!autofilter'] = { 
        ref: XLSX.utils.encode_range({
          s: { r: 0, c: 0 },
          e: { r: config.data.length, c: totalColumns - 1 }
        })
      };
    }

    // Add sheet to workbook
    XLSX.utils.book_append_sheet(this.workbook, ws, config.name);
  }

  addSummarySheet(title: string, summaryData: { label: string; value: any }[]) {
    const wsData = [
      [title],
      [],
      ...summaryData.map(item => [item.label, item.value])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    
    // Style header (merge cells for title)
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];
    
    // Set column widths
    ws['!cols'] = [{ wch: 30 }, { wch: 20 }];

    XLSX.utils.book_append_sheet(this.workbook, ws, 'Resumo');
  }

  download(filename: string) {
    // Generate file
    const timestamp = format(new Date(), 'yyyy-MM-dd_HHmmss');
    const fullFilename = `${filename}_${timestamp}.xlsx`;
    
    // Write and download
    XLSX.writeFile(this.workbook, fullFilename);
  }

  getBuffer(): ArrayBuffer {
    return XLSX.write(this.workbook, { type: 'array', bookType: 'xlsx' });
  }
}

// Predefined export templates for fleet management

export const exportVehiclesReport = (vehicles: any[]) => {
  const exporter = new ExcelExporter();

  // Summary sheet
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const totalExpired = vehicles.reduce((sum, v) => sum + (v.expired_count || 0), 0);
  const totalExpiring = vehicles.reduce((sum, v) => sum + (v.expiring_count || 0), 0);

  exporter.addSummarySheet('Resumo da Frota', [
    { label: 'Total de Veículos', value: totalVehicles },
    { label: 'Veículos Ativos', value: activeVehicles },
    { label: 'Veículos em Manutenção', value: maintenanceVehicles },
    { label: 'Documentos Expirados', value: totalExpired },
    { label: 'Documentos a Expirar', value: totalExpiring },
    { label: 'Data de Exportação', value: format(new Date(), 'dd/MM/yyyy HH:mm') }
  ]);

  // Vehicles sheet
  exporter.addSheet({
    name: 'Veículos',
    columns: [
      { header: 'Matrícula', key: 'license_plate', width: 15 },
      { header: 'Modelo', key: 'model', width: 25 },
      { header: 'Departamento', key: 'department', width: 20 },
      { header: 'Frota', key: 'fleet', width: 15 },
      { header: 'Estado', key: 'status', width: 15 },
      { header: 'Docs Válidos', key: 'valid_count', width: 12, format: 'number' },
      { header: 'Docs A Expirar', key: 'expiring_count', width: 15, format: 'number' },
      { header: 'Docs Expirados', key: 'expired_count', width: 15, format: 'number' }
    ],
    data: vehicles
  });

  exporter.download('Relatorio_Veiculos');
};

export const exportDocumentsReport = (documents: any[]) => {
  const exporter = new ExcelExporter();

  // Summary
  const totalDocs = documents.length;
  const validDocs = documents.filter(d => d.current_status === 'valid').length;
  const expiringDocs = documents.filter(d => d.current_status === 'expiring_30_days').length;
  const expiredDocs = documents.filter(d => d.current_status === 'expired').length;

  exporter.addSummarySheet('Resumo dos Documentos', [
    { label: 'Total de Documentos', value: totalDocs },
    { label: 'Documentos Válidos', value: validDocs },
    { label: 'Documentos a Expirar (30 dias)', value: expiringDocs },
    { label: 'Documentos Expirados', value: expiredDocs },
    { label: 'Data de Exportação', value: format(new Date(), 'dd/MM/yyyy HH:mm') }
  ]);

  // All documents - with status column and sorted by priority
  exporter.addSheet({
    name: 'Todos os Documentos',
    columns: [
      { header: 'Código', key: 'file_code', width: 15 },
      { header: 'Nome do Documento', key: 'file_name', width: 30 },
      { header: 'Tipo', key: 'file_type', width: 20 },
      { header: 'Veículo', key: 'license_plate', width: 15 },
      { header: 'Modelo', key: 'model', width: 25 },
      { header: 'Departamento', key: 'department', width: 20 },
      { header: 'Data de Validade', key: 'expiry_date', width: 18, format: 'date' },
      { header: '⚡ Estado', key: 'status_indicator', width: 28, format: 'status' },
      { header: 'Localização', key: 'storage_location', width: 25 }
    ],
    data: documents,
    sortByStatus: true
  });

  // Expired documents only
  const expiredDocuments = documents.filter(d => d.current_status === 'expired');
  if (expiredDocuments.length > 0) {
    exporter.addSheet({
      name: 'Documentos Expirados',
      columns: [
        { header: 'Código', key: 'file_code', width: 15 },
        { header: 'Nome do Documento', key: 'file_name', width: 30 },
        { header: 'Veículo', key: 'license_plate', width: 15 },
        { header: 'Data de Validade', key: 'expiry_date', width: 18, format: 'date' },
        { header: '⚡ Estado', key: 'status_indicator', width: 28, format: 'status' },
        { header: 'Departamento', key: 'department', width: 20 }
      ],
      data: expiredDocuments,
      sortByStatus: true
    });
  }

  // Expiring documents
  const expiringDocuments = documents.filter(d => d.current_status === 'expiring_30_days');
  if (expiringDocuments.length > 0) {
    exporter.addSheet({
      name: 'Documentos a Expirar',
      columns: [
        { header: 'Código', key: 'file_code', width: 15 },
        { header: 'Nome do Documento', key: 'file_name', width: 30 },
        { header: 'Veículo', key: 'license_plate', width: 15 },
        { header: 'Data de Validade', key: 'expiry_date', width: 18, format: 'date' },
        { header: '⚡ Estado', key: 'status_indicator', width: 28, format: 'status' },
        { header: 'Departamento', key: 'department', width: 20 }
      ],
      data: expiringDocuments,
      sortByStatus: true
    });
  }

  exporter.download('Relatorio_Documentos');
};

export const exportFlowRecordsReport = (records: any[]) => {
  const exporter = new ExcelExporter();

  // Summary
  const totalRecords = records.length;
  const withdrawals = records.filter(r => r.operation_type === 'withdrawal').length;
  const returns = records.filter(r => r.operation_type === 'return').length;

  exporter.addSummarySheet('Resumo de Movimentações', [
    { label: 'Total de Registos', value: totalRecords },
    { label: 'Retiradas', value: withdrawals },
    { label: 'Devoluções', value: returns },
    { label: 'Data de Exportação', value: format(new Date(), 'dd/MM/yyyy HH:mm') }
  ]);

  // All records
  exporter.addSheet({
    name: 'Movimentações',
    columns: [
      { header: 'Motorista', key: 'driver_name', width: 25 },
      { header: 'Nº Funcional', key: 'staff_no', width: 15 },
      { header: 'Departamento', key: 'department', width: 20 },
      { header: 'Código Documento', key: 'file_code', width: 15 },
      { header: 'Nome Documento', key: 'file_name', width: 30 },
      { header: 'Veículo', key: 'license_plate', width: 15 },
      { header: 'Operação', key: 'operation_type', width: 12 },
      { header: 'Data/Hora Operação', key: 'operation_time', width: 20, format: 'date' },
      { header: 'Devolução Esperada', key: 'expected_return_time', width: 20, format: 'date' },
      { header: 'Devolução Real', key: 'actual_return_time', width: 20, format: 'date' },
      { header: 'Observações', key: 'notes', width: 35 }
    ],
    data: records
  });

  exporter.download('Relatorio_Movimentacoes');
};

export const exportDriverProfileReport = (driverData: { driver: any; records: any[] }) => {
  const exporter = new ExcelExporter();

  const totalOperations = driverData.records.length;
  const withdrawals = driverData.records.filter(r => r.operation_type === 'withdrawal').length;
  const returns = driverData.records.filter(r => r.operation_type === 'return').length;

  exporter.addSummarySheet('Perfil do Motorista', [
    { label: 'Nome', value: driverData.driver.name },
    { label: 'Nº Funcional', value: driverData.driver.staff_no },
    { label: 'Contacto', value: driverData.driver.contact || 'N/A' },
    { label: 'Departamento', value: driverData.driver.department },
    { label: 'Estado', value: driverData.driver.status },
    { label: 'Total de Operações', value: totalOperations },
    { label: 'Retiradas', value: withdrawals },
    { label: 'Devoluções', value: returns },
    { label: 'Data de Exportação', value: format(new Date(), 'dd/MM/yyyy HH:mm') }
  ]);

  exporter.addSheet({
    name: 'Histórico de Movimentações',
    columns: [
      { header: 'Data/Hora', key: 'operation_time', width: 20, format: 'date' },
      { header: 'Operação', key: 'operation_type', width: 12 },
      { header: 'Código Documento', key: 'file_code', width: 15 },
      { header: 'Veículo', key: 'license_plate', width: 15 },
      { header: 'Observações', key: 'notes', width: 35 }
    ],
    data: driverData.records
  });

  exporter.download(`Perfil_Motorista_${driverData.driver.staff_no}`);
};

export const exportVehicleConditionsReport = (conditions: any[], vehiclePlate: string) => {
  const exporter = new ExcelExporter();

  exporter.addSummarySheet('Resumo de Verificações', [
    { label: 'Veículo', value: vehiclePlate },
    { label: 'Total de Verificações', value: conditions.length },
    { label: 'Data de Exportação', value: format(new Date(), 'dd/MM/yyyy HH:mm') }
  ]);

  exporter.addSheet({
    name: 'Verificações',
    columns: [
      { header: 'Data', key: 'check_date', width: 20, format: 'date' },
      { header: 'Motorista', key: 'driver_name', width: 25 },
      { header: 'Vidro Parabrisa', key: 'vidro_parabrisa', width: 15 },
      { header: 'Espelho Esq.', key: 'espelho_esquerdo', width: 12 },
      { header: 'Espelho Dir.', key: 'espelho_direito', width: 12 },
      { header: 'Pára-choques', key: 'barachoque', width: 12 },
      { header: 'Capô', key: 'capom', width: 10 },
      { header: 'Faróis Cab.', key: 'farois_cabeca', width: 12 },
      { header: 'Faróis Trela', key: 'farois_trela', width: 12 },
      { header: 'Pintura', key: 'pintura', width: 10 },
      { header: 'Pneus', key: 'pneus', width: 10 },
      { header: 'Guarda-lamas', key: 'quarda_lamas', width: 12 },
      { header: 'Sobressalente', key: 'subsalente', width: 12 },
      { header: 'Observações', key: 'notes', width: 30 }
    ],
    data: conditions
  });

  exporter.download(`Verificacoes_${vehiclePlate}`);
};

export const exportPostTripInspectionsReport = (inspections: any[], pendingVehicles: any[]) => {
  const exporter = new ExcelExporter();

  const verified = inspections.filter(i => i.status === 'verified').length;
  const pending = inspections.filter(i => i.status === 'pending').length;
  const incomplete = inspections.filter(i => i.status === 'incomplete').length;
  const withMissingDocs = inspections.filter(i => i.missing_documents && i.missing_documents.length > 0).length;

  exporter.addSummarySheet('Resumo de Inspeções', [
    { label: 'Total de Inspeções', value: inspections.length },
    { label: 'Verificadas (Completas)', value: verified },
    { label: 'Pendentes', value: pending },
    { label: 'Incompletas', value: incomplete },
    { label: 'Com Documentos em Falta', value: withMissingDocs },
    { label: 'Veículos Pendentes', value: pendingVehicles.length },
    { label: 'Data de Exportação', value: format(new Date(), 'dd/MM/yyyy HH:mm') }
  ]);

  // Formatar dados para incluir documentos em falta de forma clara
  const formattedInspections = inspections.map(i => ({
    ...i,
    documents_complete: i.documents_complete ? 'Sim' : 'Não',
    trip_type: i.trip_type === 'internal' ? 'Interna' : 'Longa Viagem',
    status: i.status === 'verified' ? 'Verificado' : i.status === 'pending' ? 'Pendente' : 'Incompleto'
  }));

  exporter.addSheet({
    name: 'Inspeções Realizadas',
    columns: [
      { header: 'Data/Hora', key: 'inspection_date', width: 20, format: 'date' },
      { header: 'Veículo', key: 'license_plate', width: 15 },
      { header: 'Modelo', key: 'model', width: 20 },
      { header: 'Motorista', key: 'driver_name', width: 25 },
      { header: 'Nº Trabalhador', key: 'driver_staff_no', width: 15 },
      { header: 'Tipo Viagem', key: 'trip_type', width: 15 },
      { header: 'Destino', key: 'trip_destination', width: 20 },
      { header: 'Docs Completos', key: 'documents_complete', width: 15 },
      { header: 'Documentos em Falta', key: 'missing_documents', width: 50 },
      { header: 'Inspector', key: 'inspector_name', width: 20 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Observações', key: 'observations', width: 30 }
    ],
    data: formattedInspections
  });

  // Folha separada para inspeções com documentos em falta
  const inspectionsWithMissingDocs = formattedInspections.filter(i => i.missing_documents && i.missing_documents.length > 0);
  if (inspectionsWithMissingDocs.length > 0) {
    exporter.addSheet({
      name: 'Docs em Falta',
      columns: [
        { header: 'Data', key: 'inspection_date', width: 18, format: 'date' },
        { header: 'Veículo', key: 'license_plate', width: 15 },
        { header: 'Motorista', key: 'driver_name', width: 25 },
        { header: 'Destino', key: 'trip_destination', width: 20 },
        { header: 'Documentos em Falta', key: 'missing_documents', width: 60 }
      ],
      data: inspectionsWithMissingDocs
    });
  }

  if (pendingVehicles.length > 0) {
    exporter.addSheet({
      name: 'Veículos Pendentes',
      columns: [
        { header: 'Matrícula', key: 'license_plate', width: 15 },
        { header: 'Modelo', key: 'model', width: 20 },
        { header: 'Motorista Atual', key: 'driver_name', width: 25 },
        { header: 'Nº Trabalhador', key: 'driver_staff_no', width: 15 },
        { header: 'Tipo Pendente', key: 'pending_type', width: 15 },
        { header: 'Última Inspeção', key: 'last_inspection', width: 20, format: 'date' }
      ],
      data: pendingVehicles
    });
  }

  exporter.download('Inspecoes_Pos_Viagem');
};

export const exportComprehensiveReport = (vehicles: any[], drivers: any[]) => {
  const exporter = new ExcelExporter();

  exporter.addSummarySheet('Resumo Geral', [
    { label: 'Total de Veículos', value: vehicles.length },
    { label: 'Veículos Ativos', value: vehicles.filter(v => v.status === 'active').length },
    { label: 'Total de Motoristas', value: drivers.length },
    { label: 'Motoristas Ativos', value: drivers.filter(d => d.status === 'active').length },
    { label: 'Data de Exportação', value: format(new Date(), 'dd/MM/yyyy HH:mm') }
  ]);

  // Vehicles with driver info
  const vehiclesWithDrivers = vehicles.map(v => ({
    ...v,
    driver_name: v.driver_name || 'Sem motorista',
    driver_staff_no: v.driver_staff_no || '-',
    driver_contact: v.driver_contact || '-'
  }));

  exporter.addSheet({
    name: 'Veículos e Motoristas',
    columns: [
      { header: 'Matrícula', key: 'license_plate', width: 15 },
      { header: 'Modelo', key: 'model', width: 25 },
      { header: 'Departamento', key: 'department', width: 20 },
      { header: 'Frota', key: 'fleet', width: 15 },
      { header: 'Estado Veículo', key: 'status', width: 15 },
      { header: 'Motorista', key: 'driver_name', width: 25 },
      { header: 'Nº Trabalhador', key: 'driver_staff_no', width: 15 },
      { header: 'Contacto', key: 'driver_contact', width: 15 },
      { header: 'Docs Válidos', key: 'valid_count', width: 12, format: 'number' },
      { header: 'Docs A Expirar', key: 'expiring_count', width: 15, format: 'number' },
      { header: 'Docs Expirados', key: 'expired_count', width: 15, format: 'number' }
    ],
    data: vehiclesWithDrivers
  });

  exporter.addSheet({
    name: 'Motoristas',
    columns: [
      { header: 'Nome', key: 'name', width: 25 },
      { header: 'Nº Trabalhador', key: 'staff_no', width: 15 },
      { header: 'Contacto Principal', key: 'contact', width: 15 },
      { header: 'Contacto Alt.', key: 'alternative_contact', width: 15 },
      { header: 'Malawi', key: 'contact_malawi', width: 15 },
      { header: 'Zambia', key: 'contact_zambia', width: 15 },
      { header: 'Zimbabwe', key: 'contact_zimbabwe', width: 15 },
      { header: 'Departamento', key: 'department', width: 20 },
      { header: 'Frota', key: 'fleet', width: 15 },
      { header: 'Cargo', key: 'position', width: 15 },
      { header: 'Estado', key: 'status', width: 12 },
      { header: 'Veículo Atribuído', key: 'assigned_vehicle', width: 15 }
    ],
    data: drivers
  });

  exporter.download('Relatorio_Geral');
};

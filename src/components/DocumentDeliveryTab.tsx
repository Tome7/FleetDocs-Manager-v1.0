import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { flowRecordsApi, driversApi, vehiclesApi, documentsApi, vehicleConditionApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Truck, FileText, Download, Plus, Edit, Trash2, Loader2, 
  ArrowUpFromLine, ArrowDownToLine, Search, ClipboardCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ExcelExporter } from "@/lib/excelExport";
import { VehicleConditionForm } from "@/components/VehicleConditionForm";
import { VehicleConditionHistory } from "@/components/VehicleConditionHistory";

interface VehicleGroup {
  vehicle_id: number;
  license_plate: string;
  model: string;
  department: string;
  fleet: string;
  records: FlowRecord[];
}

interface FlowRecord {
  id: number;
  operation_type: 'withdrawal' | 'return';
  operation_time: string;
  expected_return_time: string | null;
  actual_return_time: string | null;
  notes: string | null;
  driver_id: number;
  document_id: number;
  file_code: string;
  file_name: string;
  file_type: string;
  driver_name: string;
  staff_no: string;
}

export const DocumentDeliveryTab = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNewDeliveryForm, setShowNewDeliveryForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<FlowRecord | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<number | null>(null);
  const [deletingVehicleRecords, setDeletingVehicleRecords] = useState<{ id: number; plate: string } | null>(null);
  
  // Vehicle condition states
  const [showConditionForm, setShowConditionForm] = useState<string | null>(null);
  const [showConditionHistory, setShowConditionHistory] = useState<{ id: string; plate: string } | null>(null);

  // New delivery form state
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [operationType, setOperationType] = useState<'withdrawal' | 'return'>('withdrawal');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [expectedReturnTime, setExpectedReturnTime] = useState("");
  const [notes, setNotes] = useState("");

  // Edit form state
  const [editOperationType, setEditOperationType] = useState<'withdrawal' | 'return'>('withdrawal');
  const [editExpectedReturn, setEditExpectedReturn] = useState("");
  const [editActualReturn, setEditActualReturn] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editDriverId, setEditDriverId] = useState("");

  const { data: vehicleGroups, isLoading } = useQuery({
    queryKey: ['flow-records-by-vehicle'],
    queryFn: flowRecordsApi.getByVehicle,
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.getAll,
  });

  const { data: drivers } = useQuery({
    queryKey: ['drivers'],
    queryFn: driversApi.getAll,
  });

  const { data: vehicleDocuments } = useQuery({
    queryKey: ['documents', selectedVehicleId],
    queryFn: () => documentsApi.getByVehicle(selectedVehicleId),
    enabled: !!selectedVehicleId && showNewDeliveryForm,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const promises = data.document_ids.map((docId: string) => {
        const payload = {
          document_id: docId,
          driver_id: data.driver_id,
          notes: data.notes,
          expected_return_time: data.expected_return_time,
        };
        return data.operation_type === 'withdrawal'
          ? flowRecordsApi.createWithdrawal(payload)
          : flowRecordsApi.createReturn(payload);
      });
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-records-by-vehicle'] });
      queryClient.invalidateQueries({ queryKey: ['flow-records'] });
      toast({
        title: t("common.success"),
        description: operationType === 'withdrawal' 
          ? t("delivery.deliveredToDriver") 
          : t("delivery.returnedSuccess"),
      });
      resetNewDeliveryForm();
      setShowNewDeliveryForm(false);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("errors.saveError"),
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => flowRecordsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-records-by-vehicle'] });
      queryClient.invalidateQueries({ queryKey: ['flow-records'] });
      toast({
        title: t("common.success"),
        description: t("delivery.recordUpdated"),
      });
      setEditingRecord(null);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("errors.saveError"),
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => flowRecordsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-records-by-vehicle'] });
      queryClient.invalidateQueries({ queryKey: ['flow-records'] });
      toast({
        title: t("common.success"),
        description: t("delivery.recordDeleted"),
      });
      setDeletingRecordId(null);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("errors.deleteError"),
        variant: "destructive",
      });
    },
  });

  // Delete all records for a vehicle
  const deleteVehicleRecordsMutation = useMutation({
    mutationFn: (vehicleId: string) => flowRecordsApi.deleteByVehicle(vehicleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flow-records-by-vehicle'] });
      queryClient.invalidateQueries({ queryKey: ['flow-records'] });
      toast({
        title: t("common.success"),
        description: t("delivery.allRecordsDeleted"),
      });
      setDeletingVehicleRecords(null);
    },
    onError: () => {
      toast({
        title: t("common.error"),
        description: t("errors.deleteError"),
        variant: "destructive",
      });
    },
  });

  const resetNewDeliveryForm = () => {
    setSelectedVehicleId("");
    setSelectedDriverId("");
    setOperationType('withdrawal');
    setSelectedDocuments([]);
    setExpectedReturnTime("");
    setNotes("");
  };

  const handleSubmitNewDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedVehicleId || !selectedDriverId || selectedDocuments.length === 0) {
      toast({
        title: t("common.error"),
        description: t("inspection.fillRequired"),
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      document_ids: selectedDocuments,
      driver_id: selectedDriverId,
      operation_type: operationType,
      expected_return_time: operationType === 'withdrawal' ? expectedReturnTime : undefined,
      notes,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;

    updateMutation.mutate({
      id: editingRecord.id.toString(),
      data: {
        operation_type: editOperationType,
        expected_return_time: editExpectedReturn || null,
        actual_return_time: editActualReturn || null,
        notes: editNotes,
        driver_id: editDriverId,
      },
    });
  };

  const openEditDialog = (record: FlowRecord) => {
    setEditingRecord(record);
    setEditOperationType(record.operation_type);
    setEditExpectedReturn(record.expected_return_time ? format(new Date(record.expected_return_time), "yyyy-MM-dd'T'HH:mm") : "");
    setEditActualReturn(record.actual_return_time ? format(new Date(record.actual_return_time), "yyyy-MM-dd'T'HH:mm") : "");
    setEditNotes(record.notes || "");
    setEditDriverId(record.driver_id.toString());
  };

  const handleExport = () => {
    if (!vehicleGroups || vehicleGroups.length === 0) {
      toast({
        title: t("common.noData"),
        description: t("common.noData"),
        variant: "destructive",
      });
      return;
    }

    const exporter = new ExcelExporter();

    // Summary sheet
    const totalRecords = vehicleGroups.reduce((sum: number, v: VehicleGroup) => sum + v.records.length, 0);
    const totalWithdrawals = vehicleGroups.reduce((sum: number, v: VehicleGroup) => 
      sum + v.records.filter(r => r.operation_type === 'withdrawal').length, 0);
    const totalReturns = vehicleGroups.reduce((sum: number, v: VehicleGroup) => 
      sum + v.records.filter(r => r.operation_type === 'return').length, 0);

    exporter.addSummarySheet('Resumo de Entregas', [
      { label: 'Total de Veículos', value: vehicleGroups.length },
      { label: 'Total de Registos', value: totalRecords },
      { label: 'Entregas (Retiradas)', value: totalWithdrawals },
      { label: 'Devoluções', value: totalReturns },
      { label: 'Data de Exportação', value: format(new Date(), 'dd/MM/yyyy HH:mm') },
    ]);

    // Flatten records with vehicle info
    const allRecords = vehicleGroups.flatMap((v: VehicleGroup) =>
      v.records.map(r => ({
        ...r,
        license_plate: v.license_plate,
        model: v.model,
        department: v.department,
        fleet: v.fleet,
        operation_type_label: r.operation_type === 'withdrawal' ? 'Entrega ao Motorista' : 'Devolução',
      }))
    );

    exporter.addSheet({
      name: 'Entregas por Veículo',
      columns: [
        { header: 'Matrícula', key: 'license_plate', width: 15 },
        { header: 'Modelo', key: 'model', width: 20 },
        { header: 'Departamento', key: 'department', width: 15 },
        { header: 'Frota', key: 'fleet', width: 12 },
        { header: 'Documento', key: 'file_name', width: 25 },
        { header: 'Código', key: 'file_code', width: 15 },
        { header: 'Tipo Operação', key: 'operation_type_label', width: 18 },
        { header: 'Motorista', key: 'driver_name', width: 25 },
        { header: 'Nº Trabalhador', key: 'staff_no', width: 15 },
        { header: 'Data/Hora', key: 'operation_time', width: 18, format: 'date' },
        { header: 'Devolução Esperada', key: 'expected_return_time', width: 18, format: 'date' },
        { header: 'Devolução Real', key: 'actual_return_time', width: 18, format: 'date' },
        { header: 'Observações', key: 'notes', width: 30 },
      ],
      data: allRecords,
    });

    exporter.download('Entregas_Documentos_Veiculos');
    
    toast({
      title: t("common.success"),
      description: t("reports.excelExported"),
    });
  };

  const filteredGroups = vehicleGroups?.filter((v: VehicleGroup) =>
    v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleDocumentSelection = (docId: string) => {
    setSelectedDocuments(prev =>
      prev.includes(docId)
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAllDocuments = () => {
    if (vehicleDocuments) {
      setSelectedDocuments(vehicleDocuments.map((doc: any) => doc.id.toString()));
    }
  };

  const clearDocumentSelection = () => {
    setSelectedDocuments([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-1">{t("delivery.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("delivery.subtitle")} • <strong>{vehicleGroups?.length || 0}</strong> {t("delivery.vehiclesWithRecords")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            {t("reports.exportExcel")}
          </Button>
          <Button onClick={() => setShowNewDeliveryForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("delivery.newDelivery")}
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("delivery.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Vehicle Groups */}
      {filteredGroups && filteredGroups.length > 0 ? (
        <Accordion type="multiple" className="space-y-4">
          {filteredGroups.map((group: VehicleGroup) => (
            <AccordionItem key={group.vehicle_id} value={group.vehicle_id.toString()} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-4 text-left">
                  <Truck className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">{group.license_plate}</div>
                    <div className="text-sm text-muted-foreground">{group.model}</div>
                  </div>
                  <Badge variant="secondary" className="ml-auto mr-4">
                    {group.records.length} {t("delivery.records")}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {/* Group records by driver + operation + date */}
                {(() => {
                  const grouped = group.records.reduce((acc, record) => {
                    const dateKey = format(new Date(record.operation_time), 'dd/MM/yyyy HH:mm');
                    const key = `${record.driver_name}__${record.operation_type}__${dateKey}`;
                    if (!acc[key]) {
                      acc[key] = {
                        driver_name: record.driver_name,
                        staff_no: record.staff_no,
                        operation_type: record.operation_type,
                        operation_time: record.operation_time,
                        expected_return_time: record.expected_return_time,
                        actual_return_time: record.actual_return_time,
                        notes: record.notes,
                        records: [],
                      };
                    }
                    acc[key].records.push(record);
                    return acc;
                  }, {} as Record<string, { driver_name: string; staff_no: string; operation_type: string; operation_time: string; expected_return_time: string | null; actual_return_time: string | null; notes: string | null; records: FlowRecord[] }>);

                  return Object.entries(grouped).map(([key, grp]) => (
                    <div key={key} className="mb-4 last:mb-0 border rounded-lg overflow-hidden">
                      {/* Group header */}
                      <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border-b">
                        <Badge className={grp.operation_type === 'withdrawal' ? 'bg-warning text-warning-foreground' : 'bg-success text-success-foreground'}>
                          {grp.operation_type === 'withdrawal' ? (
                            <><ArrowUpFromLine className="h-3 w-3 mr-1" /> {t("delivery.withdrawal")}</>
                          ) : (
                            <><ArrowDownToLine className="h-3 w-3 mr-1" /> {t("delivery.return")}</>
                          )}
                        </Badge>
                        <div className="flex-1">
                          <span className="font-semibold text-sm">{grp.driver_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({grp.staff_no})</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(grp.operation_time), 'dd/MM/yyyy HH:mm')}
                        </span>
                        {grp.notes && (
                          <span className="text-xs text-muted-foreground italic max-w-[150px] truncate">
                            {grp.notes}
                          </span>
                        )}
                      </div>
                      {/* Documents table */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>{t("reports.document")}</TableHead>
                            <TableHead>{t("delivery.expectedReturn")}</TableHead>
                            <TableHead>{t("delivery.actualReturn")}</TableHead>
                            <TableHead className="text-right">{t("common.actions")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {grp.records.map((record) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <div className="font-medium text-sm">{record.file_name}</div>
                                    <div className="text-xs text-muted-foreground">{record.file_code}</div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {record.expected_return_time 
                                  ? format(new Date(record.expected_return_time), 'dd/MM/yyyy HH:mm')
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-sm">
                                {record.actual_return_time 
                                  ? format(new Date(record.actual_return_time), 'dd/MM/yyyy HH:mm')
                                  : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-1 justify-end">
                                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(record)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeletingRecordId(record.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ));
                })()}
                
                <div className="flex gap-2 mt-4 pt-4 border-t justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConditionHistory({ id: group.vehicle_id.toString(), plate: group.license_plate })}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    {t("delivery.conditionHistory")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConditionForm(group.vehicle_id.toString())}
                  >
                    <ClipboardCheck className="h-4 w-4 mr-2" />
                    {t("delivery.vehicleCondition")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive border-destructive/50"
                    onClick={() => setDeletingVehicleRecords({ id: group.vehicle_id, plate: group.license_plate })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("delivery.deleteAllRecords")}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <Card className="p-12 text-center">
          <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">{t("common.noData")}</p>
          <Button onClick={() => setShowNewDeliveryForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t("delivery.newDelivery")}
          </Button>
        </Card>
      )}

      {/* New Delivery Dialog */}
      <Dialog open={showNewDeliveryForm} onOpenChange={(open) => {
        if (!open) {
          resetNewDeliveryForm();
        }
        setShowNewDeliveryForm(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("delivery.newDelivery")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitNewDelivery} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vehicle">{t("inspection.vehicle")} *</Label>
                <Select value={selectedVehicleId} onValueChange={(value) => {
                  setSelectedVehicleId(value);
                  setSelectedDocuments([]);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("delivery.selectVehicle")} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((v: any) => (
                      <SelectItem key={v.id} value={v.id.toString()}>
                        {v.license_plate} - {v.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="operation_type">{t("delivery.operation")} *</Label>
                <Select value={operationType} onValueChange={(value: 'withdrawal' | 'return') => setOperationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="withdrawal">{t("delivery.deliveryToDriver")}</SelectItem>
                    <SelectItem value="return">{t("delivery.returnFromDriver")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="driver">{t("inspection.driver")} *</Label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder={t("delivery.selectDriver")} />
                </SelectTrigger>
                <SelectContent>
                  {drivers?.map((d: any) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name} ({d.staff_no})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedVehicleId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>{t("delivery.selectDocuments")} *</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="link" size="sm" onClick={selectAllDocuments}>
                      {t("delivery.selectAll")}
                    </Button>
                    <Button type="button" variant="link" size="sm" onClick={clearDocumentSelection}>
                      {t("delivery.deselectAll")}
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {vehicleDocuments && vehicleDocuments.length > 0 ? (
                    vehicleDocuments.map((doc: any) => (
                      <div key={doc.id} className="flex items-center gap-3 p-2 rounded hover:bg-accent/50">
                        <Checkbox
                          id={`doc-${doc.id}`}
                          checked={selectedDocuments.includes(doc.id.toString())}
                          onCheckedChange={() => toggleDocumentSelection(doc.id.toString())}
                        />
                        <label htmlFor={`doc-${doc.id}`} className="flex-1 cursor-pointer">
                          <div className="font-medium text-sm">{doc.file_name}</div>
                          <div className="text-xs text-muted-foreground">{doc.file_code} • {doc.file_type}</div>
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t("delivery.noDocumentsAvailable")}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedDocuments.length} {t("delivery.documentsSelected")}
                </p>
              </div>
            )}

            {operationType === 'withdrawal' && (
              <div>
                <Label htmlFor="expected_return">{t("delivery.expectedReturnDate")}</Label>
                <Input
                  id="expected_return"
                  type="datetime-local"
                  value={expectedReturnTime}
                  onChange={(e) => setExpectedReturnTime(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label htmlFor="notes">{t("common.notes")}</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("common.notes")}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => {
                resetNewDeliveryForm();
                setShowNewDeliveryForm(false);
              }}>
                {t("common.cancel")}
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || !selectedVehicleId || !selectedDriverId || selectedDocuments.length === 0}
              >
                {createMutation.isPending ? t("common.processing") : operationType === 'withdrawal' ? t("delivery.registerDelivery") : t("delivery.registerReturn")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingRecord} onOpenChange={(open) => !open && setEditingRecord(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("common.edit")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label>{t("reports.document")}</Label>
              <p className="text-sm font-medium">{editingRecord?.file_name}</p>
              <p className="text-xs text-muted-foreground">{editingRecord?.file_code}</p>
            </div>

            <div>
              <Label htmlFor="edit_operation_type">{t("delivery.operation")}</Label>
              <Select value={editOperationType} onValueChange={(value: 'withdrawal' | 'return') => setEditOperationType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="withdrawal">{t("delivery.deliveryToDriver")}</SelectItem>
                  <SelectItem value="return">{t("delivery.return")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_driver">{t("inspection.driver")}</Label>
              <Select value={editDriverId} onValueChange={setEditDriverId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {drivers?.map((d: any) => (
                    <SelectItem key={d.id} value={d.id.toString()}>
                      {d.name} ({d.staff_no})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit_expected_return">{t("delivery.expectedReturn")}</Label>
              <Input
                id="edit_expected_return"
                type="datetime-local"
                value={editExpectedReturn}
                onChange={(e) => setEditExpectedReturn(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit_actual_return">{t("delivery.actualReturn")}</Label>
              <Input
                id="edit_actual_return"
                type="datetime-local"
                value={editActualReturn}
                onChange={(e) => setEditActualReturn(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="edit_notes">{t("common.notes")}</Label>
              <Textarea
                id="edit_notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder={t("common.notes")}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setEditingRecord(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t("common.processing") : t("common.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingRecordId} onOpenChange={() => setDeletingRecordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.delete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("documents.deleteConfirm")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingRecordId && deleteMutation.mutate(deletingRecordId.toString())}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingVehicleRecords} onOpenChange={() => setDeletingVehicleRecords(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delivery.deleteAllRecords")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("delivery.deleteAllConfirm")} <strong>{deletingVehicleRecords?.plate}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingVehicleRecords && deleteVehicleRecordsMutation.mutate(deletingVehicleRecords.id.toString())}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vehicle Condition Form */}
      {showConditionForm && (
        <VehicleConditionForm
          open={!!showConditionForm}
          onClose={() => setShowConditionForm(null)}
          vehicleId={showConditionForm}
        />
      )}

      {/* Vehicle Condition History */}
      {showConditionHistory && (
        <VehicleConditionHistory
          open={!!showConditionHistory}
          onClose={() => setShowConditionHistory(null)}
          vehicleId={showConditionHistory.id}
          vehiclePlate={showConditionHistory.plate}
        />
      )}
    </div>
  );
};
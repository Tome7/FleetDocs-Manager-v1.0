import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postTripInspectionApi, vehiclesApi, driversApi, pendingInspectionsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PostTripInspectionForm } from "./PostTripInspectionForm";
import { SearchBar } from "./SearchBar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  FileSpreadsheet,
  Loader2,
  Truck,
  User,
  MapPin,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  FileCheck,
  Filter,
  TruckIcon,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { pt, enUS, zhCN } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { exportPostTripInspectionsReport } from "@/lib/excelExport";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

// Lista de documentos para checklist - Cabeça (Horse)
const HORSE_DOCUMENT_CHECKLIST = [
  { key: "livrete", label: "Livrete/White Book" },
  { key: "caderneta", label: "Caderneta/Owner Title Book" },
  { key: "seguro", label: "Seguro/Insurance" },
  { key: "inspecao", label: "Inspeção/Inspeccionado" },
  { key: "cfm", label: "Livre Trânsito CFM/Port Entrance" },
  { key: "moz_permit", label: "Mozambique Permit Licence" },
  { key: "radio_difusao", label: "Radio Difusão/Radio Fusion Rate" },
  { key: "manifesto", label: "Manifesto Municipal" },
  { key: "passaport", label: "Passaport" },
  { key: "carta_conducao", label: "Carta de Condução/Licence" },
  { key: "comesa", label: "COMESA/Yellow Book" },
];

// Lista de documentos para checklist - Trela (Trailer) - apenas documentos necessários
const TRAILER_DOCUMENT_CHECKLIST = [
  { key: "livrete", label: "Livrete/White Book" },
  { key: "seguro", label: "Seguro/Insurance" },
  { key: "inspecao", label: "Inspeção/Inspeccionado" },
  { key: "manifesto", label: "Manifesto Municipal" },
  { key: "comesa", label: "COMESA/Yellow Book" },
];

export function PostTripInspectionList() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingInspection, setEditingInspection] = useState<any>(null);
  const [viewingInspection, setViewingInspection] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState("today");
  const [tripTypeFilter, setTripTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [showAddPendingDialog, setShowAddPendingDialog] = useState(false);
  const [pendingFormData, setPendingFormData] = useState({
    vehicle_id: "",
    driver_id: "",
    trip_type: "internal",
    trip_destination: "",
    notes: "",
  });

  const getDateLocale = () => {
    switch (i18n.language) {
      case 'en': return enUS;
      case 'zh': return zhCN;
      default: return pt;
    }
  };

  // Today's inspections (real-time)
  const { data: todayInspections = [], isLoading: loadingToday } = useQuery({
    queryKey: ["post-trip-inspections-today"],
    queryFn: postTripInspectionApi.getToday,
    refetchInterval: 30000, // Refresh every 30 seconds for real-time
  });

  // All inspections (with date filter)
  const { data: allInspections = [], isLoading: loadingAll } = useQuery({
    queryKey: ["post-trip-inspections", dateFilter],
    queryFn: () => postTripInspectionApi.getAll(dateFilter ? { date: dateFilter } : undefined),
  });

  // Pending inspections
  const { data: pendingInspections = [], isLoading: loadingPending } = useQuery({
    queryKey: ["pending-inspections"],
    queryFn: pendingInspectionsApi.getAll,
  });

  // Pending summary
  const { data: pendingSummary } = useQuery({
    queryKey: ["pending-inspections-summary"],
    queryFn: pendingInspectionsApi.getSummary,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.getAll,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: driversApi.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: postTripInspectionApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-trip-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["post-trip-inspections-today"] });
      toast({
        title: t('inspections.inspectionDeleted'),
        description: t('inspections.inspectionDeletedDesc'),
      });
      setDeletingId(null);
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('errors.deleteError'),
        variant: "destructive",
      });
    },
  });

  const addPendingMutation = useMutation({
    mutationFn: pendingInspectionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["pending-inspections-summary"] });
      toast({
        title: t('inspections.addedToQueue'),
      });
      setShowAddPendingDialog(false);
      setPendingFormData({
        vehicle_id: "",
        driver_id: "",
        trip_type: "internal",
        trip_destination: "",
        notes: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('errors.saveError'),
        variant: "destructive",
      });
    },
  });

  const cancelPendingMutation = useMutation({
    mutationFn: pendingInspectionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["pending-inspections-summary"] });
      toast({
        title: t('inspections.removedFromQueue'),
      });
    },
  });

  // Stats
  const totalVehicles = vehicles.length;
  const inspectedToday = todayInspections.length;
  const totalPending = pendingSummary?.total_pending || 0;

  const handleExport = () => {
    const dataToExport = mainTab === "today" ? todayInspections : allInspections;
    if (dataToExport && dataToExport.length > 0) {
      const pendingVehicles = vehicles.filter((v: any) => 
        !dataToExport.some((i: any) => i.vehicle_id === v.id)
      );
      exportPostTripInspectionsReport(dataToExport, pendingVehicles);
      toast({
        title: t('reports.excelExported'),
      });
    } else {
      toast({
        title: t('common.noData'),
        variant: "destructive",
      });
    }
  };

  const handleAddPending = () => {
    if (!pendingFormData.vehicle_id || !pendingFormData.trip_destination) {
      toast({
        title: t('common.error'),
        description: t('inspections.vehicleAndDestinationRequired'),
        variant: "destructive",
      });
      return;
    }
    addPendingMutation.mutate(pendingFormData);
  };

  const handleInspectPending = (pending: any) => {
    setEditingInspection({
      vehicle_id: pending.vehicle_id,
      driver_id: pending.driver_id,
      trip_type: pending.trip_type,
      trip_destination: pending.trip_destination,
      pending_id: pending.id,
    });
    setShowForm(true);
  };

  const filteredInspections = (mainTab === "today" ? todayInspections : allInspections).filter((i: any) => {
    const matchesType = tripTypeFilter === "all" || i.trip_type === tripTypeFilter;
    const matchesSearch =
      !searchTerm ||
      i.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.driver_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.driver_staff_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.trip_destination?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredPending = pendingInspections.filter((p: any) => {
    const matchesType = tripTypeFilter === "all" || p.trip_type === tripTypeFilter;
    const matchesSearch =
      !searchTerm ||
      p.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.driver_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-success/20 text-success">{t('inspections.verified')}</Badge>;
      case "pending":
        return <Badge className="bg-warning/20 text-warning">{t('inspections.pending')}</Badge>;
      case "incomplete":
        return <Badge className="bg-destructive/20 text-destructive">{t('inspections.incomplete')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-success" />;
      case "pending":
        return <Clock className="h-5 w-5 text-warning" />;
      case "incomplete":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      default:
        return null;
    }
  };

  const isLoading = loadingToday || loadingAll || loadingPending;

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
          <h2 className="text-2xl font-bold mb-1">{t('inspections.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('inspections.subtitle')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setShowAddPendingDialog(true)}>
            <TruckIcon className="h-4 w-4 mr-2" />
            {t('inspections.addPending')}
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {t('inspections.newInspection')}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('inspections.pendingVehicles')}</p>
                <p className="text-2xl font-bold text-warning">{totalPending}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('inspections.inspectedToday')}</p>
                <p className="text-2xl font-bold text-success">{inspectedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('inspections.internalPending')}</p>
                <p className="text-2xl font-bold text-primary">{pendingSummary?.internal_pending || 0}</p>
              </div>
              <Truck className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('inspections.longTripPending')}</p>
                <p className="text-2xl font-bold text-secondary-foreground">{pendingSummary?.long_trip_pending || 0}</p>
              </div>
              <MapPin className="h-8 w-8 text-secondary-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={t('inspections.searchPlaceholder')}
            showStatusFilter={false}
          />
        </div>
        <div className="flex gap-2">
          <div className="w-40">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-10"
            />
          </div>
          {dateFilter && (
            <Button variant="ghost" size="sm" onClick={() => setDateFilter("")}>
              {t('inspections.clearDate')}
            </Button>
          )}
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {t('inspections.today')} ({todayInspections.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('inspections.pending')} ({totalPending})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t('inspections.history')} {dateFilter && `(${dateFilter})`}
          </TabsTrigger>
        </TabsList>

        {/* Today Tab */}
        <TabsContent value="today" className="mt-4">
          <Tabs value={tripTypeFilter} onValueChange={setTripTypeFilter}>
            <TabsList>
              <TabsTrigger value="all">{t('inspections.all')}</TabsTrigger>
              <TabsTrigger value="internal">{t('inspections.internal')}</TabsTrigger>
              <TabsTrigger value="long_trip">{t('inspections.longTrip')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {filteredInspections.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-520px)] min-h-[300px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInspections.map((inspection: any) => (
                    <InspectionCard
                      key={inspection.id}
                      inspection={inspection}
                      getStatusIcon={getStatusIcon}
                      getStatusBadge={getStatusBadge}
                      onView={() => setViewingInspection(inspection)}
                      onEdit={() => {
                        setEditingInspection(inspection);
                        setShowForm(true);
                      }}
                      onDelete={() => setDeletingId(inspection.id.toString())}
                      t={t}
                      locale={getDateLocale()}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                message={t('inspections.noInspectionsToday')}
                onAdd={() => setShowForm(true)}
                t={t}
              />
            )}
          </div>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="mt-4">
          <Tabs value={tripTypeFilter} onValueChange={setTripTypeFilter}>
            <TabsList>
              <TabsTrigger value="all">{t('inspections.all')}</TabsTrigger>
              <TabsTrigger value="internal">{t('inspections.internal')}</TabsTrigger>
              <TabsTrigger value="long_trip">{t('inspections.longTrip')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {filteredPending.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-520px)] min-h-[300px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPending.map((pending: any) => (
                    <Card key={pending.id} className="border-warning/50 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-warning" />
                            <span className="font-semibold">{pending.license_plate}</span>
                          </div>
                          <Badge className="bg-warning/20 text-warning">{t('inspections.pending')}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Truck className="h-4 w-4 text-muted-foreground" />
                          <span>{pending.model}</span>
                        </div>
                        {pending.driver_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{pending.driver_name}</span>
                            {pending.driver_staff_no && (
                              <span className="text-muted-foreground">({pending.driver_staff_no})</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{pending.trip_destination}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {t('inspection.arrived')}: {format(new Date(pending.arrival_date), "dd/MM/yyyy HH:mm", { locale: getDateLocale() })}
                          </span>
                        </div>
                        <Badge variant="outline">
                          {pending.trip_type === "internal" ? t('inspections.internal') : t('inspections.longTrip')}
                        </Badge>

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleInspectPending(pending)}
                            className="flex-1"
                          >
                            <FileCheck className="h-4 w-4 mr-1" />
                            {t('inspection.inspect')}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => cancelPendingMutation.mutate(pending.id.toString())}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">{t('inspection.allInspected')}</p>
                <Button className="mt-4" variant="outline" onClick={() => setShowAddPendingDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('inspection.addToQueue')}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Tabs value={tripTypeFilter} onValueChange={setTripTypeFilter}>
            <TabsList>
              <TabsTrigger value="all">{t('inspections.all')} ({allInspections.length})</TabsTrigger>
              <TabsTrigger value="internal">
                {t('inspections.internal')} ({allInspections.filter((i: any) => i.trip_type === "internal").length})
              </TabsTrigger>
              <TabsTrigger value="long_trip">
                {t('inspections.longTrip')} ({allInspections.filter((i: any) => i.trip_type === "long_trip").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {filteredInspections.length > 0 ? (
              <ScrollArea className="h-[calc(100vh-520px)] min-h-[300px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInspections.map((inspection: any) => (
                    <InspectionCard
                      key={inspection.id}
                      inspection={inspection}
                      getStatusIcon={getStatusIcon}
                      getStatusBadge={getStatusBadge}
                      onView={() => setViewingInspection(inspection)}
                      onEdit={() => {
                        setEditingInspection(inspection);
                        setShowForm(true);
                      }}
                      onDelete={() => setDeletingId(inspection.id.toString())}
                      t={t}
                      locale={getDateLocale()}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <EmptyState
                message={dateFilter ? t('inspections.noInspectionsHistory') : t('inspections.noInspectionsHistory')}
                onAdd={() => setShowForm(true)}
                t={t}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Pending Dialog */}
      <Dialog open={showAddPendingDialog} onOpenChange={setShowAddPendingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TruckIcon className="h-5 w-5" />
              {t('inspection.addPendingVehicle')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('inspection.vehicle')} <span className="text-destructive">*</span></Label>
              <Select
                value={pendingFormData.vehicle_id}
                onValueChange={(v) => {
                  const vehicle = vehicles.find((veh: any) => veh.id.toString() === v);
                  setPendingFormData({
                    ...pendingFormData,
                    vehicle_id: v,
                    driver_id: vehicle?.assigned_driver_id?.toString() || "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('inspection.selectVehicle')} />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((vehicle: any) => (
                    <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                      {vehicle.license_plate} - {vehicle.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('inspection.driver')}</Label>
              <Select
                value={pendingFormData.driver_id}
                onValueChange={(v) => setPendingFormData({ ...pendingFormData, driver_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('inspection.selectDriver')} />
                </SelectTrigger>
                <SelectContent>
                  {drivers.map((driver: any) => (
                    <SelectItem key={driver.id} value={driver.id.toString()}>
                      {driver.name} ({driver.staff_no})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('inspection.tripType')} <span className="text-destructive">*</span></Label>
              <Select
                value={pendingFormData.trip_type}
                onValueChange={(v) => setPendingFormData({ ...pendingFormData, trip_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">{t('inspection.tripInternal')}</SelectItem>
                  <SelectItem value="long_trip">{t('inspection.tripLong')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('inspection.destination')} <span className="text-destructive">*</span></Label>
              <Input
                value={pendingFormData.trip_destination}
                onChange={(e) => setPendingFormData({ ...pendingFormData, trip_destination: e.target.value })}
                placeholder={t('inspection.destinationPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('inspection.observations')}</Label>
              <Input
                value={pendingFormData.notes}
                onChange={(e) => setPendingFormData({ ...pendingFormData, notes: e.target.value })}
                placeholder={t('inspection.notesPlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPendingDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddPending} disabled={addPendingMutation.isPending}>
              {addPendingMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspection Form Dialog */}
      <PostTripInspectionForm
        open={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingInspection(null);
        }}
        inspection={editingInspection}
      />

      {/* View Details Dialog */}
      <Dialog open={!!viewingInspection} onOpenChange={() => setViewingInspection(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              {t('inspection.inspectionDetails')}
            </DialogTitle>
          </DialogHeader>
          {viewingInspection && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('inspection.vehicle')}</p>
                  <p className="font-medium">{viewingInspection.license_plate} - {viewingInspection.model}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('inspection.tripType')}</p>
                  <p className="font-medium">
                    {viewingInspection.trip_type === "internal" ? t('inspections.internal') : t('inspections.longTrip')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('inspection.driver')}</p>
                  <p className="font-medium">{viewingInspection.driver_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('inspection.staffNo')}</p>
                  <p className="font-medium">{viewingInspection.driver_staff_no}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('inspection.destination')}</p>
                  <p className="font-medium">{viewingInspection.trip_destination}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('inspection.dateTime')}</p>
                  <p className="font-medium">
                    {format(new Date(viewingInspection.inspection_date), "dd/MM/yyyy HH:mm", { locale: getDateLocale() })}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('inspection.inspector')}</p>
                  <p className="font-medium">{viewingInspection.inspector_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('inspection.status')}</p>
                  {getStatusBadge(viewingInspection.status)}
                </div>
              </div>

              {/* Document Checklist Display */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">{t('inspection.documentChecklist')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Horse Documents */}
                  <div>
                    <h4 className="font-medium text-primary mb-3 border-b pb-2">{t('inspection.horse')}</h4>
                    <div className="space-y-2">
                      {HORSE_DOCUMENT_CHECKLIST.map((doc) => (
                        <div key={`view_horse_${doc.key}`} className="flex items-center space-x-2">
                          <Checkbox
                            checked={viewingInspection[`horse_${doc.key}`] || false}
                            disabled
                          />
                          <span className={`text-sm ${viewingInspection[`horse_${doc.key}`] ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                            {doc.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trailer Documents */}
                  <div>
                    <h4 className="font-medium text-primary mb-3 border-b pb-2">{t('inspection.trailer')}</h4>
                    <div className="space-y-2">
                      {TRAILER_DOCUMENT_CHECKLIST.map((doc) => (
                        <div key={`view_trailer_${doc.key}`} className="flex items-center space-x-2">
                          <Checkbox
                            checked={viewingInspection[`trailer_${doc.key}`] || false}
                            disabled
                          />
                          <span className={`text-sm ${viewingInspection[`trailer_${doc.key}`] ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                            {doc.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Missing Documents */}
              {viewingInspection.missing_documents && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <h4 className="font-medium text-destructive mb-2">{t('inspection.missingDocs')}</h4>
                  <p className="text-sm">{viewingInspection.missing_documents}</p>
                </div>
              )}

              {/* Observations */}
              {viewingInspection.observations && (
                <div className="bg-muted rounded-lg p-4">
                  <h4 className="font-medium mb-2">{t('inspection.observations')}</h4>
                  <p className="text-sm">{viewingInspection.observations}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('inspection.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('inspection.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Inspection Card Component
function InspectionCard({
  inspection,
  getStatusIcon,
  getStatusBadge,
  onView,
  onEdit,
  onDelete,
  t,
  locale,
}: {
  inspection: any;
  getStatusIcon: (status: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  t: any;
  locale: any;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(inspection.status)}
            <span className="font-semibold">{inspection.license_plate}</span>
          </div>
          {getStatusBadge(inspection.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 text-muted-foreground" />
          <span>{inspection.driver_name}</span>
          <span className="text-muted-foreground">({inspection.driver_staff_no})</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{inspection.trip_destination}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>
            {format(new Date(inspection.inspection_date), "dd/MM/yyyy HH:mm", { locale })}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline">
            {inspection.trip_type === "internal" ? t('inspections.internal') : t('inspections.longTrip')}
          </Badge>
        </div>

        {!inspection.documents_complete && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {t('inspection.documentsIncomplete')}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          {t('inspection.inspector')}: {inspection.inspector_name}
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" variant="outline" onClick={onView}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            {t('common.edit')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ message, onAdd, t }: { message: string; onAdd: () => void; t: any }) {
  return (
    <div className="text-center py-12">
      <FileCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
      <Button className="mt-4" onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        {t('inspection.addInspection')}
      </Button>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { vehiclesApi, alertsApi, driversApi } from "@/lib/api";
import { DashboardStats } from "@/components/DashboardStats";
import { DashboardCharts } from "@/components/DashboardCharts";
import { SearchBar } from "@/components/SearchBar";
import { VehicleCard } from "@/components/VehicleCard";
import { VehicleForm } from "@/components/VehicleForm";
import { DriverForm } from "@/components/DriverForm";
import { DriverCard } from "@/components/DriverCard";
import { DriverProfileDialog } from "@/components/DriverProfileDialog";
import { VehicleAssignmentDialog } from "@/components/VehicleAssignmentDialog";
import { AlertsPanel } from "@/components/AlertsPanel";
import { ReportsDialog } from "@/components/ReportsDialog";
import { PostTripInspectionList } from "@/components/PostTripInspectionList";
import { DocumentDeliveryTab } from "@/components/DocumentDeliveryTab";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Bell, Menu, User, LogOut, Loader2, FileText, Car, Users, ClipboardCheck, FileStack, BarChart3, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("vehicles");
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState("all");
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [assigningVehicleDriver, setAssigningVehicleDriver] = useState<any>(null);
  const [viewingDriverProfile, setViewingDriverProfile] = useState<string | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null);
  
  const { data: vehicles, isLoading, error } = useQuery({
    queryKey: ['vehicles'],
    queryFn: vehiclesApi.getAll,
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertsApi.getAll,
  });

  const { data: drivers, isLoading: driversLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: driversApi.getAll,
  });

  // Generate alerts on mount
  useEffect(() => {
    alertsApi.generate();
  }, []);

  const deleteVehicleMutation = useMutation({
    mutationFn: vehiclesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: t('vehicles.vehicleDeleted'),
        description: t('vehicles.vehicleDeletedDesc'),
      });
      setDeletingVehicleId(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao eliminar veículo",
        variant: "destructive",
      });
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: driversApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: t('drivers.driverDeleted'),
        description: t('drivers.driverDeletedDesc'),
      });
      setDeletingDriverId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.response?.data?.error || "Erro ao eliminar motorista",
        variant: "destructive",
      });
      setDeletingDriverId(null);
    },
  });

  const filteredVehicles = vehicles?.filter((v: any) => {
    const matchesSearch = 
      v.license_plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.driver_name && v.driver_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = vehicleStatusFilter === "all" || v.status === vehicleStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredDrivers = drivers?.filter((d: any) => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.staff_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.contact && d.contact.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (d.department && d.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading || driversLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{t('errors.loadError')}</p>
          <Button onClick={() => window.location.reload()}>{t('common.tryAgain')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-foreground">{t('header.title')}</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {t('header.subtitle')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <LanguageSelector />
              <Button variant="ghost" size="icon" onClick={() => setShowReports(true)}>
                <FileText className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {alerts && alerts.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-expired rounded-full" />
                )}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.name}</span>
                      <span className="text-xs text-muted-foreground">{user?.email}</span>
                      <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('auth.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Section */}
        <DashboardStats vehicles={vehicles || []} />

        {/* Charts Toggle Button */}
        <div className="mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            {showCharts ? t('dashboard.hideCharts') : t('dashboard.showCharts')}
            {showCharts ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        {/* Charts Section - Collapsible */}
        {showCharts && (
          <DashboardCharts vehicles={vehicles || []} />
        )}

        {/* Alerts Section */}
        {alerts && alerts.length > 0 && (
          <div className="mb-6">
            <AlertsPanel />
          </div>
        )}

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              {t('navigation.vehicles')}
            </TabsTrigger>
            <TabsTrigger value="drivers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('navigation.drivers')}
            </TabsTrigger>
            <TabsTrigger value="document-delivery" className="flex items-center gap-2">
              <FileStack className="h-4 w-4" />
              {t('navigation.documentDelivery')}
            </TabsTrigger>
            <TabsTrigger value="inspections" className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              {t('navigation.inspections')}
            </TabsTrigger>
          </TabsList>

          {/* Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{t('vehicles.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('vehicles.subtitle')}
                </p>
              </div>
              <Button className="hidden sm:flex" onClick={() => setShowVehicleForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('vehicles.addVehicle')}
              </Button>
            </div>

            <SearchBar
              value={searchTerm} 
              onChange={setSearchTerm} 
              placeholder={t('vehicles.searchPlaceholder')}
              statusFilter={vehicleStatusFilter}
              onStatusChange={setVehicleStatusFilter}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVehicles && filteredVehicles.length > 0 ? (
                filteredVehicles.map((vehicle: any) => (
                  <VehicleCard 
                    key={vehicle.id} 
                    vehicle={vehicle}
                    onEdit={() => {
                      setEditingVehicle(vehicle);
                      setShowVehicleForm(true);
                    }}
                    onDelete={() => setDeletingVehicleId(vehicle.id.toString())}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">{t('vehicles.noVehicles')}</p>
                </div>
              )}
            </div>

            <Button
              size="icon"
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg sm:hidden"
              onClick={() => setShowVehicleForm(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{t('drivers.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('drivers.subtitle')} • <strong>{drivers?.length || 0}</strong> {t('drivers.registered')}
                </p>
              </div>
              <Button className="hidden sm:flex" onClick={() => setShowDriverForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('drivers.addDriver')}
              </Button>
            </div>

            <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder={t('drivers.searchPlaceholder')} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDrivers && filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver: any) => (
                  <DriverCard 
                    key={driver.id} 
                    driver={driver}
                    onEdit={() => {
                      setEditingDriver(driver);
                      setShowDriverForm(true);
                    }}
                    onDelete={() => setDeletingDriverId(driver.id.toString())}
                    onViewDocuments={() => setViewingDriverProfile(driver.id.toString())}
                    onAssignVehicle={() => setAssigningVehicleDriver(driver)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">{t('drivers.noDrivers')}</p>
                </div>
              )}
            </div>

            <Button
              size="icon"
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg sm:hidden"
              onClick={() => setShowDriverForm(true)}
            >
              <Plus className="h-6 w-6" />
            </Button>
          </TabsContent>

          {/* Document Delivery Tab */}
          <TabsContent value="document-delivery" className="space-y-6">
            <DocumentDeliveryTab />
          </TabsContent>

          {/* Post-Trip Inspections Tab */}
          <TabsContent value="inspections" className="space-y-6">
            <PostTripInspectionList />
          </TabsContent>
        </Tabs>
      </main>

      <VehicleForm 
        open={showVehicleForm} 
        onClose={() => {
          setShowVehicleForm(false);
          setEditingVehicle(null);
        }}
        vehicle={editingVehicle}
      />

      <DriverForm 
        open={showDriverForm} 
        onClose={() => {
          setShowDriverForm(false);
          setEditingDriver(null);
        }}
        driver={editingDriver}
      />

      <DriverProfileDialog
        open={!!viewingDriverProfile}
        onClose={() => setViewingDriverProfile(null)}
        driverId={viewingDriverProfile || undefined}
      />

      <VehicleAssignmentDialog
        open={!!assigningVehicleDriver}
        onClose={() => setAssigningVehicleDriver(null)}
        driver={assigningVehicleDriver}
      />


      <ReportsDialog open={showReports} onClose={() => setShowReports(false)} />

      <AlertDialog open={!!deletingVehicleId} onOpenChange={() => setDeletingVehicleId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('vehicles.deleteVehicle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('vehicles.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingVehicleId && deleteVehicleMutation.mutate(deletingVehicleId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingDriverId} onOpenChange={() => setDeletingDriverId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('drivers.deleteDriver')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('drivers.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingDriverId && deleteDriverMutation.mutate(deletingDriverId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
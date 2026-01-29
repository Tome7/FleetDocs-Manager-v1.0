import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { vehiclesApi, alertsApi, driversApi } from "@/lib/api";
import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { SearchBar } from "@/components/SearchBar";
import { VehicleCard } from "@/components/VehicleCard";
import { VehicleForm } from "@/components/VehicleForm";
import { DriverForm } from "@/components/DriverForm";
import { DriverCard } from "@/components/DriverCard";
import { DriverProfileDialog } from "@/components/DriverProfileDialog";
import { VehicleAssignmentDialog } from "@/components/VehicleAssignmentDialog";
import { AlertsPanelRefactored } from "@/components/alerts/AlertsPanelRefactored";
import { ReportsDialog } from "@/components/ReportsDialog";
import { PostTripInspectionList } from "@/components/PostTripInspectionList";
import { DocumentDeliveryTab } from "@/components/DocumentDeliveryTab";
import { LanguageSelector } from "@/components/LanguageSelector";
import { AppSidebarRefactored } from "@/components/sidebar/AppSidebarRefactored";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Plus, User, LogOut, Loader2, Menu } from "lucide-react";
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
  
  // Navigation state
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Modal states
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [showReports, setShowReports] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState("all");
  
  // Edit/Delete states
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [assigningVehicleDriver, setAssigningVehicleDriver] = useState<any>(null);
  const [viewingDriverProfile, setViewingDriverProfile] = useState<string | null>(null);
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null);
  
  // Data queries
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

  // Mutations
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

  // Filtered data
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

  // Loading state
  if (isLoading || driversLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
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

  // Get tab title
  const getTabTitle = () => {
    switch (activeTab) {
      case "dashboard":
        return t('navigation.dashboard') || 'Visão Geral';
      case "vehicles":
        return t('vehicles.title');
      case "drivers":
        return t('drivers.title');
      case "document-delivery":
        return t('navigation.documentDelivery');
      case "inspections":
        return t('navigation.inspections');
      case "alerts":
        return t('alerts.documentAlerts');
      default:
        return t('header.title');
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchTerm(""); // Reset search when changing tabs
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">
        {/* Sidebar - Fixed position */}
        <AppSidebarRefactored 
          activeTab={activeTab}
          onTabChange={handleTabChange}
          alertCount={alerts?.length || 0}
          onShowReports={() => setShowReports(true)}
        />

        {/* Main Content Area - Responsive margins */}
        <div className="flex-1 min-h-screen flex flex-col transition-all duration-300 ml-[72px] lg:ml-64">
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white border-b border-border/50 shadow-sm">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <SidebarTrigger className="lg:hidden text-foreground hover:bg-muted rounded-lg p-2">
                    <Menu className="h-5 w-5" />
                  </SidebarTrigger>
                  <div>
                    <h1 className="text-xl font-bold text-foreground">{getTabTitle()}</h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">
                      {t('header.subtitle')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <LanguageSelector />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="font-medium">{user?.name}</span>
                          <span className="text-xs text-muted-foreground">{user?.email}</span>
                          <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
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
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            
            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
              <DashboardOverview />
            )}

            {/* Alerts Tab */}
            {activeTab === "alerts" && (
              <div className="max-w-4xl">
                <AlertsPanelRefactored />
              </div>
            )}

            {/* Vehicles Tab */}
            {activeTab === "vehicles" && (
              <div className="space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
              </div>
            )}

            {/* Drivers Tab */}
            {activeTab === "drivers" && (
              <div className="space-y-6">
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

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
              </div>
            )}

            {/* Document Delivery Tab */}
            {activeTab === "document-delivery" && (
              <DocumentDeliveryTab />
            )}

            {/* Inspections Tab */}
            {activeTab === "inspections" && (
              <PostTripInspectionList />
            )}
          </main>
        </div>

        {/* Modals */}
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

        {/* Delete Vehicle Confirmation */}
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

        {/* Delete Driver Confirmation */}
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
    </SidebarProvider>
  );
};

export default Index;

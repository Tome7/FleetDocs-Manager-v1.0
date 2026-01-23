import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { postTripInspectionApi, driversApi, vehiclesApi, pendingInspectionsApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, Truck, User, FileCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PostTripInspectionFormProps {
  open: boolean;
  onClose: () => void;
  inspection?: any;
}

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

export function PostTripInspectionForm({
  open,
  onClose,
  inspection,
}: PostTripInspectionFormProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    vehicle_id: "",
    driver_id: "",
    trip_type: "internal",
    trip_destination: "",
    // Horse (Cabeça) documents
    horse_livrete: false,
    horse_caderneta: false,
    horse_seguro: false,
    horse_inspecao: false,
    horse_cfm: false,
    horse_moz_permit: false,
    horse_radio_difusao: false,
    horse_manifesto: false,
    horse_passaport: false,
    horse_carta_conducao: false,
    horse_comesa: false,
    // Trailer (Treila) documents
    trailer_livrete: false,
    trailer_caderneta: false,
    trailer_seguro: false,
    trailer_inspecao: false,
    trailer_cfm: false,
    trailer_moz_permit: false,
    trailer_radio_difusao: false,
    trailer_manifesto: false,
    trailer_comesa: false,
    // General
    documents_complete: true,
    missing_documents: "",
    observations: "",
    status: "verified",
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: vehiclesApi.getAll,
    enabled: open,
  });

  const { data: drivers } = useQuery({
    queryKey: ["drivers"],
    queryFn: driversApi.getAll,
    enabled: open,
  });

  useEffect(() => {
    if (inspection) {
      setFormData({
        vehicle_id: inspection.vehicle_id?.toString() || "",
        driver_id: inspection.driver_id?.toString() || "",
        trip_type: inspection.trip_type || "internal",
        trip_destination: inspection.trip_destination || "",
        horse_livrete: inspection.horse_livrete || false,
        horse_caderneta: inspection.horse_caderneta || false,
        horse_seguro: inspection.horse_seguro || false,
        horse_inspecao: inspection.horse_inspecao || false,
        horse_cfm: inspection.horse_cfm || false,
        horse_moz_permit: inspection.horse_moz_permit || false,
        horse_radio_difusao: inspection.horse_radio_difusao || false,
        horse_manifesto: inspection.horse_manifesto || false,
        horse_passaport: inspection.horse_passaport || false,
        horse_carta_conducao: inspection.horse_carta_conducao || false,
        horse_comesa: inspection.horse_comesa || false,
        trailer_livrete: inspection.trailer_livrete || false,
        trailer_caderneta: inspection.trailer_caderneta || false,
        trailer_seguro: inspection.trailer_seguro || false,
        trailer_inspecao: inspection.trailer_inspecao || false,
        trailer_cfm: inspection.trailer_cfm || false,
        trailer_moz_permit: inspection.trailer_moz_permit || false,
        trailer_radio_difusao: inspection.trailer_radio_difusao || false,
        trailer_manifesto: inspection.trailer_manifesto || false,
        trailer_comesa: inspection.trailer_comesa || false,
        documents_complete: inspection.documents_complete !== false,
        missing_documents: inspection.missing_documents || "",
        observations: inspection.observations || "",
        status: inspection.status || "verified",
      });
    } else {
      setFormData({
        vehicle_id: "",
        driver_id: "",
        trip_type: "internal",
        trip_destination: "",
        horse_livrete: false,
        horse_caderneta: false,
        horse_seguro: false,
        horse_inspecao: false,
        horse_cfm: false,
        horse_moz_permit: false,
        horse_radio_difusao: false,
        horse_manifesto: false,
        horse_passaport: false,
        horse_carta_conducao: false,
        horse_comesa: false,
        trailer_livrete: false,
        trailer_caderneta: false,
        trailer_seguro: false,
        trailer_inspecao: false,
        trailer_cfm: false,
        trailer_moz_permit: false,
        trailer_radio_difusao: false,
        trailer_manifesto: false,
        trailer_comesa: false,
        documents_complete: true,
        missing_documents: "",
        observations: "",
        status: "verified",
      });
    }
  }, [inspection, open]);

  // Auto-select driver when vehicle is selected
  useEffect(() => {
    if (formData.vehicle_id && vehicles) {
      const selectedVehicle = vehicles.find((v: any) => v.id.toString() === formData.vehicle_id);
      if (selectedVehicle?.assigned_driver_id && !inspection) {
        setFormData(prev => ({
          ...prev,
          driver_id: selectedVehicle.assigned_driver_id.toString()
        }));
      }
    }
  }, [formData.vehicle_id, vehicles, inspection]);

  // Calculate documents_complete and missing_documents based on checklist
  useEffect(() => {
    const horseChecks = [
      formData.horse_livrete, formData.horse_caderneta, formData.horse_seguro,
      formData.horse_inspecao, formData.horse_cfm, formData.horse_moz_permit,
      formData.horse_radio_difusao, formData.horse_manifesto, formData.horse_passaport,
      formData.horse_carta_conducao, formData.horse_comesa
    ];
    // Apenas documentos necessários da trela
    const trailerChecks = [
      formData.trailer_livrete, formData.trailer_seguro, formData.trailer_inspecao, 
      formData.trailer_manifesto, formData.trailer_comesa
    ];
    
    const allComplete = [...horseChecks, ...trailerChecks].every(Boolean);
    
    // Calcular documentos em falta
    const missingDocs: string[] = [];
    HORSE_DOCUMENT_CHECKLIST.forEach(doc => {
      if (!formData[`horse_${doc.key}` as keyof typeof formData]) {
        missingDocs.push(`Cabeça: ${doc.label}`);
      }
    });
    TRAILER_DOCUMENT_CHECKLIST.forEach(doc => {
      if (!formData[`trailer_${doc.key}` as keyof typeof formData]) {
        missingDocs.push(`Trela: ${doc.label}`);
      }
    });
    
    setFormData(prev => ({
      ...prev,
      documents_complete: allComplete,
      missing_documents: missingDocs.join(', '),
      status: allComplete ? "verified" : "incomplete"
    }));
  }, [
    formData.horse_livrete, formData.horse_caderneta, formData.horse_seguro,
    formData.horse_inspecao, formData.horse_cfm, formData.horse_moz_permit,
    formData.horse_radio_difusao, formData.horse_manifesto, formData.horse_passaport,
    formData.horse_carta_conducao, formData.horse_comesa,formData.trailer_livrete,
    formData.trailer_seguro, formData.trailer_inspecao, 
    formData.trailer_manifesto, formData.trailer_comesa
  ]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (inspection && !inspection.pending_id) {
        return postTripInspectionApi.update(inspection.id, data);
      }
      const result = await postTripInspectionApi.create(data);
      
      // If this was from a pending inspection, mark it as inspected
      if (inspection?.pending_id) {
        await pendingInspectionsApi.markInspected(inspection.pending_id.toString(), result.id.toString());
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-trip-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["post-trip-inspections-today"] });
      queryClient.invalidateQueries({ queryKey: ["pending-inspections"] });
      queryClient.invalidateQueries({ queryKey: ["pending-inspections-summary"] });
      toast({
        title: inspection && !inspection.pending_id ? t('inspection.inspectionUpdated') : t('inspection.inspectionRegistered'),
        description: t('inspection.inspectionSuccess'),
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: t('common.error'),
        description: error.response?.data?.error || t('errors.saveError'),
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.vehicle_id || !formData.driver_id || !formData.trip_destination) {
      toast({
        title: t('common.error'),
        description: t('inspection.fillRequired'),
        variant: "destructive",
      });
      return;
    }

    mutation.mutate({
      ...formData,
      vehicle_id: parseInt(formData.vehicle_id),
      driver_id: parseInt(formData.driver_id),
    });
  };

  const selectedDriver = drivers?.find((d: any) => d.id.toString() === formData.driver_id);

  const handleCheckAll = (type: 'horse' | 'trailer', checked: boolean) => {
    if (type === 'horse') {
      setFormData(prev => ({
        ...prev,
        horse_livrete: checked,
        horse_caderneta: checked,
        horse_seguro: checked,
        horse_inspecao: checked,
        horse_cfm: checked,
        horse_moz_permit: checked,
        horse_radio_difusao: checked,
        horse_manifesto: checked,
        horse_passaport: checked,
        horse_carta_conducao: checked,
        horse_comesa: checked,
      }));
    } else {
      // Apenas documentos necessários da trela
      setFormData(prev => ({
        ...prev,
        trailer_livrete: checked,
        trailer_seguro: checked,
        trailer_inspecao: checked,
        trailer_manifesto: checked,
        trailer_comesa: checked,
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            {inspection
              ? t('inspection.editInspection')
              : t('inspection.newInspection')}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-y-auto pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">
                  <Truck className="h-4 w-4 inline mr-1" />
                  {t('inspection.vehicle')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.vehicle_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, vehicle_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('inspection.selectVehicle')} />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles?.map((vehicle: any) => (
                      <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                        {vehicle.license_plate} - {vehicle.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="driver">
                  <User className="h-4 w-4 inline mr-1" />
                  {t('inspection.driver')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.driver_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, driver_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('inspection.selectDriver')} />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers?.map((driver: any) => (
                      <SelectItem key={driver.id} value={driver.id.toString()}>
                        {driver.name} ({driver.staff_no})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedDriver && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p><strong>{t('inspection.staffNo')}:</strong> {selectedDriver.staff_no}</p>
                <p><strong>{t('inspection.contact')}:</strong> {selectedDriver.contact}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trip_type">
                  {t('inspection.tripType')} <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.trip_type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, trip_type: value })
                  }
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
                <Label htmlFor="trip_destination">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  {t('inspection.destination')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="trip_destination"
                  value={formData.trip_destination}
                  onChange={(e) =>
                    setFormData({ ...formData, trip_destination: e.target.value })
                  }
                  placeholder={t('inspection.destinationPlaceholder')}
                  required
                />
              </div>
            </div>

            {/* Document Checklist */}
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <FileCheck className="h-4 w-4" />
                {t('inspection.documentChecklist')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Horse (Cabeça) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-medium text-primary">{t('inspection.horse')}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckAll('horse', true)}
                    >
                      {t('inspection.checkAll')}
                    </Button>
                  </div>
                  
                  {HORSE_DOCUMENT_CHECKLIST.map((doc) => (
                    <div key={`horse_${doc.key}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`horse_${doc.key}`}
                        checked={formData[`horse_${doc.key}` as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, [`horse_${doc.key}`]: checked })
                        }
                      />
                      <Label htmlFor={`horse_${doc.key}`} className="text-sm cursor-pointer">
                        {doc.label}
                      </Label>
                    </div>
                  ))}
                </div>

                {/* Trailer (Treila) - apenas documentos necessários */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-medium text-primary">{t('inspection.trailer')}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckAll('trailer', true)}
                    >
                      {t('inspection.checkAll')}
                    </Button>
                  </div>
                  
                  {TRAILER_DOCUMENT_CHECKLIST.map((doc) => (
                    <div key={`trailer_${doc.key}`} className="flex items-center space-x-2">
                      <Checkbox
                        id={`trailer_${doc.key}`}
                        checked={formData[`trailer_${doc.key}` as keyof typeof formData] as boolean}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, [`trailer_${doc.key}`]: checked })
                        }
                      />
                      <Label htmlFor={`trailer_${doc.key}`} className="text-sm cursor-pointer">
                        {doc.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Missing documents note */}
            {!formData.documents_complete && (
              <div className="space-y-2">
                <Label htmlFor="missing_documents" className="text-destructive">
                  {t('inspection.missingDocs')}
                </Label>
                <Textarea
                  id="missing_documents"
                  value={formData.missing_documents}
                  onChange={(e) =>
                    setFormData({ ...formData, missing_documents: e.target.value })
                  }
                  placeholder={t('inspection.missingDocsPlaceholder')}
                  rows={2}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observations">{t('inspection.observations')}</Label>
              <Textarea
                id="observations"
                value={formData.observations}
                onChange={(e) =>
                  setFormData({ ...formData, observations: e.target.value })
                }
                placeholder={t('inspection.observationsPlaceholder')}
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4 sticky bottom-0 bg-background">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {inspection ? t('common.update') : t('inspection.registerInspection')}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

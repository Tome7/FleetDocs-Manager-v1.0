import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Bell, 
  Check, 
  AlertTriangle, 
  Car, 
  User, 
  FileWarning, 
  RefreshCw,
  ShieldAlert,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Types
interface Alert {
  id: number;
  source_type: 'vehicle' | 'driver';
  alert_type: 'expired' | '3_days' | '7_days' | '15_days' | '30_days';
  doc_name: string;
  doc_type: string;
  expiry_date: string;
  license_plate?: string;
  driver_name?: string;
  department?: string;
}

interface AlertConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  priority: number;
  gradient: string;
}

// Alert item component with premium styling
interface AlertItemProps {
  alert: Alert;
  config: AlertConfig;
  onMarkRead: () => void;
  isLoading?: boolean;
  index: number;
}

const AlertItem = ({ alert, config, onMarkRead, isLoading, index }: AlertItemProps) => {
  const { t } = useTranslation();
  const isVehicle = alert.source_type === 'vehicle';
  const isUrgent = ['expired', '3_days'].includes(alert.alert_type);
  
  return (
    <div 
      className={cn(
        "group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-500 ease-out",
        "hover:shadow-card-hover hover:-translate-y-0.5",
        "animate-fade-in",
        config.bgColor,
        config.borderColor
      )}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500",
        config.gradient
      )} />

      {/* Urgent pulse indicator */}
      {isUrgent && (
        <div className="absolute top-3 right-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              alert.alert_type === 'expired' ? "bg-expired" : "bg-warning"
            )} />
            <span className={cn(
              "relative inline-flex rounded-full h-2.5 w-2.5",
              alert.alert_type === 'expired' ? "bg-expired" : "bg-warning"
            )} />
          </span>
        </div>
      )}

      {/* Source type icon */}
      <div className={cn(
        "relative z-10 mt-0.5 p-2.5 rounded-xl transition-all duration-300 group-hover:scale-105",
        isVehicle 
          ? "bg-primary/10" 
          : "bg-secondary"
      )}>
        {isVehicle ? (
          <Car className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4 text-foreground" />
        )}
      </div>
      
      <div className="flex-1 min-w-0 relative z-10">
        {/* Header with name and badge */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="font-bold text-sm text-foreground">
            {isVehicle ? alert.license_plate : alert.driver_name}
          </span>
          <Badge 
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border-0 shadow-sm",
              config.color
            )}
          >
            {config.label}
          </Badge>
        </div>
        
        {/* Document info */}
        <p className="text-sm text-foreground font-semibold truncate mb-0.5">
          {alert.doc_name}
        </p>
        <p className="text-xs text-muted-foreground capitalize font-medium">
          {alert.doc_type?.replace(/_/g, ' ')}
        </p>
        
        {/* Expiry date with icon */}
        <div className={cn(
          "flex items-center gap-1.5 mt-2 text-xs font-medium",
          alert.alert_type === 'expired' ? "text-expired" : "text-muted-foreground"
        )}>
          <Clock className="h-3 w-3" />
          <span>
            {alert.alert_type === 'expired' ? t('alerts.expiredOn') : t('alerts.expiresOn')}{' '}
            {format(new Date(alert.expiry_date), 'dd/MM/yyyy')}
          </span>
        </div>
      </div>
      
      {/* Mark as read button */}
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "relative z-10 shrink-0 h-9 w-9 p-0 rounded-xl transition-all duration-300",
          "bg-card/80 hover:bg-success hover:text-white hover:shadow-md hover:scale-110",
          "border border-border hover:border-success"
        )}
        onClick={onMarkRead}
        disabled={isLoading}
        title={t('alerts.markedAsRead')}
      >
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
};

// Section header component
interface SectionHeaderProps {
  type: 'urgent' | 'attention';
  count: number;
}

const SectionHeader = ({ type, count }: SectionHeaderProps) => {
  const { t } = useTranslation();
  const isUrgent = type === 'urgent';
  
  return (
    <div className={cn(
      "flex items-center gap-2.5 mb-3 pb-2 border-b",
      isUrgent ? "border-expired/20" : "border-warning/20"
    )}>
      <div className={cn(
        "p-1.5 rounded-lg",
        isUrgent ? "bg-expired/10" : "bg-warning/10"
      )}>
        {isUrgent ? (
          <ShieldAlert className={cn("h-4 w-4", isUrgent ? "text-expired" : "text-warning")} />
        ) : (
          <AlertTriangle className="h-4 w-4 text-warning" />
        )}
      </div>
      <h3 className={cn(
        "text-sm font-bold tracking-tight",
        isUrgent ? "text-expired" : "text-warning"
      )}>
        {isUrgent ? t('alerts.urgent') : t('alerts.attention')}
      </h3>
      <Badge 
        variant="secondary" 
        className={cn(
          "ml-auto text-xs font-bold",
          isUrgent 
            ? "bg-expired/10 text-expired hover:bg-expired/20" 
            : "bg-warning/10 text-warning hover:bg-warning/20"
        )}
      >
        {count}
      </Badge>
    </div>
  );
};

// Loading skeleton
const LoadingSkeleton = () => (
  <Card className="p-6 bg-white border border-border/50 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <div className="h-12 w-12 rounded-2xl bg-muted animate-pulse" />
      <div className="space-y-2">
        <div className="h-5 w-40 bg-muted animate-pulse rounded-lg" />
        <div className="h-3 w-24 bg-muted animate-pulse rounded-lg" />
      </div>
    </div>
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div 
          key={i} 
          className="h-24 bg-muted animate-pulse rounded-xl"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  </Card>
);

// Empty state component
const EmptyState = ({ onRefresh, isRefetching }: { onRefresh: () => void; isRefetching: boolean }) => {
  const { t } = useTranslation();
  
  return (
    <Card className="p-8 bg-white border border-border/50 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-success/10">
            <Bell className="h-5 w-5 text-success" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">{t('alerts.documentAlerts')}</h2>
            <p className="text-xs text-muted-foreground">Monitoramento de documentos</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefetching}
          className="rounded-lg hover:bg-muted"
        >
          <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
        </Button>
      </div>
      
      <div className="text-center py-10">
        <div className="relative inline-block mb-4">
          <div className="h-20 w-20 rounded-2xl bg-success/10 flex items-center justify-center mx-auto">
            <FileWarning className="h-10 w-10 text-success/50" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-success flex items-center justify-center shadow-md">
            <Check className="h-4 w-4 text-white" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-medium">{t('alerts.noAlerts')}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Todos os documentos estão em dia</p>
      </div>
    </Card>
  );
};

// Main component
export const AlertsPanelRefactored = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertsApi.getAll,
    refetchInterval: 60000,
  });

  const markSentMutation = useMutation({
    mutationFn: alertsApi.markSent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: t('alerts.markedAsRead'),
        description: "O alerta foi removido da lista.",
      });
    },
  });

  const getAlertConfig = (type: string): AlertConfig => {
    switch (type) {
      case 'expired': 
        return { 
          label: t('alerts.expired'), 
          color: 'bg-expired-gradient text-white',
          bgColor: 'bg-expired/5',
          borderColor: 'border-expired/20 hover:border-expired/40',
          iconColor: 'text-expired',
          priority: 1,
          gradient: 'bg-gradient-to-r from-expired/10 to-transparent'
        };
      case '3_days': 
        return { 
          label: t('alerts.days3'), 
          color: 'bg-expired-gradient text-white',
          bgColor: 'bg-expired/5',
          borderColor: 'border-expired/20 hover:border-expired/40',
          iconColor: 'text-expired',
          priority: 2,
          gradient: 'bg-gradient-to-r from-expired/10 to-transparent'
        };
      case '7_days': 
        return { 
          label: t('alerts.days7'), 
          color: 'bg-warning-gradient text-white',
          bgColor: 'bg-warning/5',
          borderColor: 'border-warning/20 hover:border-warning/40',
          iconColor: 'text-warning',
          priority: 3,
          gradient: 'bg-gradient-to-r from-warning/10 to-transparent'
        };
      case '15_days': 
        return { 
          label: t('alerts.days15'), 
          color: 'bg-warning-gradient text-white',
          bgColor: 'bg-warning/5',
          borderColor: 'border-warning/20 hover:border-warning/40',
          iconColor: 'text-warning',
          priority: 4,
          gradient: 'bg-gradient-to-r from-warning/10 to-transparent'
        };
      case '30_days': 
        return { 
          label: t('alerts.days30'), 
          color: 'bg-warning/80 text-white',
          bgColor: 'bg-warning/5',
          borderColor: 'border-warning/15 hover:border-warning/30',
          iconColor: 'text-warning',
          priority: 5,
          gradient: 'bg-gradient-to-r from-warning/5 to-transparent'
        };
      default: 
        return { 
          label: type, 
          color: 'bg-muted text-muted-foreground',
          bgColor: 'bg-muted/50',
          borderColor: 'border-border',
          iconColor: 'text-muted-foreground',
          priority: 6,
          gradient: ''
        };
    }
  };

  // Filter only document-related alerts
  const documentAlerts = alerts.filter((a: Alert) => 
    ['expired', '3_days', '7_days', '15_days', '30_days'].includes(a.alert_type)
  );

  const urgentAlerts = documentAlerts.filter((a: Alert) => 
    ['expired', '3_days'].includes(a.alert_type)
  );
  
  const warningAlerts = documentAlerts.filter((a: Alert) => 
    ['7_days', '15_days', '30_days'].includes(a.alert_type)
  );

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (documentAlerts.length === 0) {
    return <EmptyState onRefresh={() => refetch()} isRefetching={isRefetching} />;
  }

  return (
    <Card className="p-6 bg-white border border-border/50 shadow-sm">
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-xl relative",
              urgentAlerts.length > 0 ? "bg-expired/10" : "bg-warning/10"
            )}>
              <Bell className={cn(
                "h-5 w-5",
                urgentAlerts.length > 0 ? "text-expired" : "text-warning"
              )} />
              {urgentAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-expired opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-expired" />
                </span>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{t('alerts.documentAlerts')}</h2>
              <p className="text-xs text-muted-foreground">Documentos que requerem atenção</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              className={cn(
                "text-sm font-bold px-3 py-1 rounded-full border-0",
                urgentAlerts.length > 0 
                  ? "bg-expired/10 text-expired" 
                  : "bg-warning/10 text-warning"
              )}
            >
              {documentAlerts.length}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="rounded-lg hover:bg-muted h-9 w-9 p-0"
            >
              <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[400px] pr-4 -mr-4">
          <div className="space-y-6 pr-4">
            {/* Urgent Alerts Section */}
            {urgentAlerts.length > 0 && (
              <div>
                <SectionHeader type="urgent" count={urgentAlerts.length} />
                <div className="space-y-3">
                  {urgentAlerts.map((alert: Alert, index: number) => (
                    <AlertItem 
                      key={alert.id} 
                      alert={alert} 
                      config={getAlertConfig(alert.alert_type)}
                      onMarkRead={() => markSentMutation.mutate(alert.id.toString())}
                      isLoading={markSentMutation.isPending}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Warning Alerts Section */}
            {warningAlerts.length > 0 && (
              <div>
                <SectionHeader type="attention" count={warningAlerts.length} />
                <div className="space-y-3">
                  {warningAlerts.map((alert: Alert, index: number) => (
                    <AlertItem 
                      key={alert.id} 
                      alert={alert} 
                      config={getAlertConfig(alert.alert_type)}
                      onMarkRead={() => markSentMutation.mutate(alert.id.toString())}
                      isLoading={markSentMutation.isPending}
                      index={urgentAlerts.length + index}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};

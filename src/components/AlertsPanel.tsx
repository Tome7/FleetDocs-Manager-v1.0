import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, AlertTriangle, Car, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AlertsPanel = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: alertsApi.getAll,
  });

  const markSentMutation = useMutation({
    mutationFn: alertsApi.markSent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast({
        title: t('alerts.markedAsRead'),
      });
    },
  });

  const getAlertConfig = (type: string) => {
    switch (type) {
      case 'expired': 
        return { label: t('alerts.expired'), color: 'bg-expired text-expired-foreground', priority: 1 };
      case '3_days': 
        return { label: t('alerts.days3'), color: 'bg-expired text-expired-foreground', priority: 2 };
      case '7_days': 
        return { label: t('alerts.days7'), color: 'bg-warning text-warning-foreground', priority: 3 };
      case '15_days': 
        return { label: t('alerts.days15'), color: 'bg-warning text-warning-foreground', priority: 4 };
      case '30_days': 
        return { label: t('alerts.days30'), color: 'bg-warning/80 text-warning-foreground', priority: 5 };
      default: 
        return { label: type, color: 'bg-muted', priority: 6 };
    }
  };

  if (!alerts || alerts.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-success/10">
            <Bell className="h-5 w-5 text-success" />
          </div>
          <h2 className="text-lg font-semibold">{t('alerts.title')}</h2>
        </div>
        <p className="text-sm text-muted-foreground">{t('alerts.noAlerts')}</p>
      </Card>
    );
  }

  const urgentAlerts = alerts.filter((a: any) => ['expired', '3_days'].includes(a.alert_type));
  const warningAlerts = alerts.filter((a: any) => ['7_days', '15_days', '30_days'].includes(a.alert_type));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-expired/10">
            <Bell className="h-5 w-5 text-expired" />
          </div>
          <h2 className="text-lg font-semibold">{t('alerts.documentAlerts')}</h2>
          <Badge variant="destructive" className="ml-2">{alerts.length}</Badge>
        </div>
      </div>
      
      <ScrollArea className="h-[300px] pr-4">
        {urgentAlerts.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-expired mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t('alerts.urgent')} ({urgentAlerts.length})
            </h3>
            <div className="space-y-2">
              {urgentAlerts.map((alert: any) => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert} 
                  config={getAlertConfig(alert.alert_type)}
                  onMarkRead={() => markSentMutation.mutate(alert.id.toString())}
                />
              ))}
            </div>
          </div>
        )}
        
        {warningAlerts.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-warning mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t('alerts.attention')} ({warningAlerts.length})
            </h3>
            <div className="space-y-2">
              {warningAlerts.map((alert: any) => (
                <AlertItem 
                  key={alert.id} 
                  alert={alert} 
                  config={getAlertConfig(alert.alert_type)}
                  onMarkRead={() => markSentMutation.mutate(alert.id.toString())}
                />
              ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};

interface AlertItemProps {
  alert: any;
  config: { label: string; color: string; priority: number };
  onMarkRead: () => void;
}

const AlertItem = ({ alert, config, onMarkRead }: AlertItemProps) => {
  const { t } = useTranslation();
  const isVehicle = alert.source_type === 'vehicle';
  
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/5 transition-all">
      <div className={`mt-0.5 p-1.5 rounded-full ${isVehicle ? 'bg-primary/10' : 'bg-secondary/30'}`}>
        {isVehicle ? (
          <Car className="h-4 w-4 text-primary" />
        ) : (
          <User className="h-4 w-4 text-secondary-foreground" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {isVehicle ? (
            <span className="font-semibold text-sm">{alert.license_plate}</span>
          ) : (
            <span className="font-semibold text-sm">{alert.driver_name}</span>
          )}
          <Badge className={`${config.color} text-xs`}>
            {config.label}
          </Badge>
        </div>
        
        <p className="text-sm text-foreground truncate font-medium">
          {alert.doc_name}
        </p>
        <p className="text-xs text-muted-foreground capitalize">
          {alert.doc_type?.replace(/_/g, ' ')}
        </p>
        
        <p className="text-xs text-muted-foreground mt-1">
          {alert.alert_type === 'expired' ? t('alerts.expiredOn') : t('alerts.expiresOn')}{' '}
          {format(new Date(alert.expiry_date), 'dd/MM/yyyy')}
        </p>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className="shrink-0 h-8 w-8 p-0"
        onClick={onMarkRead}
        title={t('alerts.markedAsRead')}
      >
        <Check className="h-4 w-4" />
      </Button>
    </div>
  );
};
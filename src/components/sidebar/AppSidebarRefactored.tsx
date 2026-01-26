import { 
  Car, 
  Users, 
  FileStack, 
  ClipboardCheck, 
  Bell, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  LayoutDashboard,
  Sparkles
} from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Types
interface NavigationItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  alertCount?: number;
  onShowReports: () => void;
}

export function AppSidebarRefactored({ 
  activeTab, 
  onTabChange, 
  alertCount = 0,
  onShowReports,
}: AppSidebarProps) {
  const { t } = useTranslation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  // Main navigation items
  const navigationItems: NavigationItem[] = [
    { 
      id: "dashboard", 
      title: t('navigation.dashboard') || 'Visão Geral', 
      icon: LayoutDashboard 
    },
    { 
      id: "vehicles", 
      title: t('navigation.vehicles'), 
      icon: Car 
    },
    { 
      id: "drivers", 
      title: t('navigation.drivers'), 
      icon: Users 
    },
    { 
      id: "document-delivery", 
      title: t('navigation.documentDelivery'), 
      icon: FileStack 
    },
    { 
      id: "inspections", 
      title: t('navigation.inspections'), 
      icon: ClipboardCheck 
    },
  ];

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
  };

  return (
    <Sidebar 
      className={cn(
        "border-r-0 bg-sidebar-gradient transition-all duration-500 ease-out shadow-sidebar",
        isCollapsed ? "w-[72px]" : "w-72"
      )}
      collapsible="icon"
    >
      {/* Premium Header */}
      <SidebarHeader className="border-b border-white/10 p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
        <div className="flex items-center justify-between relative z-10">
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-primary-gradient flex items-center justify-center shadow-glow">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <Sparkles className="h-3 w-3 text-primary-glow absolute -top-1 -right-1 animate-float" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base tracking-tight">FleetDocs</h2>
                <p className="text-xs text-white/60 font-medium">Manager Pro</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center w-full">
              <div className="h-10 w-10 rounded-xl bg-primary-gradient flex items-center justify-center shadow-glow">
                <Car className="h-5 w-5 text-white" />
              </div>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "h-7 w-7 shrink-0 absolute top-1/2 -translate-y-1/2 transition-all duration-300",
            "bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-full",
            isCollapsed ? "right-1/2 translate-x-1/2 mt-10" : "right-3"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-3">
        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 py-2 mb-1">
              {t('navigation.title') || 'Navegação'}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {navigationItems.map((item, index) => {
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem 
                    key={item.id}
                    className="animate-slide-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <SidebarMenuButton
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                        isActive 
                          ? "bg-primary-gradient text-white shadow-glow" 
                          : "text-white/60 hover:text-white hover:bg-white/10"
                      )}
                      tooltip={isCollapsed ? item.title : undefined}
                    >
                      {/* Active indicator glow */}
                      {isActive && (
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      )}
                      
                      <div className={cn(
                        "relative z-10 flex items-center justify-center",
                        isActive && "animate-pulse-glow"
                      )}>
                        <item.icon className={cn(
                          "h-5 w-5 shrink-0 transition-transform duration-300",
                          isActive ? "text-white" : "group-hover:scale-110"
                        )} />
                      </div>
                      
                      {!isCollapsed && (
                        <span className={cn(
                          "font-semibold truncate relative z-10 transition-all duration-300",
                          isActive ? "text-white" : ""
                        )}>
                          {item.title}
                        </span>
                      )}

                      {/* Active indicator bar */}
                      {isActive && !isCollapsed && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)]" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup className="mt-8">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-3 py-2 mb-1">
              {t('navigation.tools') || 'Ferramentas'}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1.5">
              {/* Alerts Button - Premium Style */}
              <SidebarMenuItem className="animate-slide-in" style={{ animationDelay: '0.25s' }}>
                <SidebarMenuButton
                  onClick={() => handleTabChange('alerts')}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                    activeTab === 'alerts' 
                      ? "bg-expired-gradient text-white shadow-[0_0_20px_-5px_hsl(0_72%_51%/0.5)]" 
                      : alertCount > 0 
                        ? "bg-expired/20 text-expired hover:bg-expired/30 border border-expired/30"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                  tooltip={isCollapsed ? (alertCount > 0 ? `${alertCount} Alertas` : 'Alertas') : undefined}
                >
                  <div className={cn(
                    "relative",
                    alertCount > 0 && activeTab !== 'alerts' && "animate-pulse-alert"
                  )}>
                    <Bell className={cn(
                      "h-5 w-5 shrink-0 transition-transform duration-300",
                      "group-hover:scale-110",
                      alertCount > 0 && activeTab !== 'alerts' && "animate-float"
                    )} />
                    {alertCount > 0 && (
                      <span className={cn(
                        "absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center font-bold",
                        activeTab === 'alerts' 
                          ? "bg-white text-expired" 
                          : "bg-expired text-white shadow-[0_0_8px_2px_hsl(0_72%_51%/0.4)]"
                      )}>
                        {alertCount > 99 ? '99+' : alertCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="font-semibold truncate">
                      {alertCount > 0 ? `${alertCount} Alertas` : 'Alertas'}
                    </span>
                  )}

                  {activeTab === 'alerts' && !isCollapsed && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_2px_rgba(255,255,255,0.5)]" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Reports Button */}
              <SidebarMenuItem className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
                <SidebarMenuButton
                  onClick={onShowReports}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group",
                    "text-white/60 hover:text-white hover:bg-white/10"
                  )}
                  tooltip={isCollapsed ? t('reports.title') : undefined}
                >
                  <FileText className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" />
                  {!isCollapsed && (
                    <span className="font-semibold truncate">{t('reports.title') || 'Relatórios'}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Premium Footer */}
      <SidebarFooter className="border-t border-white/10 p-4 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {!isCollapsed ? (
          <div className="relative z-10 text-center">
            <p className="text-[10px] text-white/40 font-medium tracking-wide">
              © 2024 FleetDocs Manager
            </p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-white/50">Sistema Ativo</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center relative z-10">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

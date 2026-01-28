import { 
  Car, 
  Users, 
  FileStack, 
  ClipboardCheck, 
  Bell, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  LayoutDashboard
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
        "fixed left-0 top-0 h-screen z-40 border-r-0 transition-all duration-300 ease-out",
        "bg-gradient-to-b from-primary to-[hsl(220,85%,45%)]",
        "shadow-sidebar",
        isCollapsed ? "w-[72px]" : "w-64"
      )}
      collapsible="icon"
    >
      {/* Header */}
      <SidebarHeader className="border-b border-white/15 p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-white text-base tracking-tight">FleetDocs</h2>
                <p className="text-xs text-white/70 font-medium">Manager Pro</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="flex justify-center w-full">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
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
            "h-7 w-7 absolute transition-all duration-300",
            "bg-white/10 hover:bg-white/25 text-white rounded-full",
            isCollapsed ? "top-20 left-1/2 -translate-x-1/2" : "top-4 right-3"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-3 flex-1">
        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-3 py-2 mb-1">
              {t('navigation.title') || 'Navegação'}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item, index) => {
                const isActive = activeTab === item.id;
                return (
                  <SidebarMenuItem 
                    key={item.id}
                    className="animate-slide-in"
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <SidebarMenuButton
                      onClick={() => handleTabChange(item.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                        isActive 
                          ? "bg-white text-primary shadow-md font-semibold" 
                          : "text-white/80 hover:text-white hover:bg-white/15"
                      )}
                      tooltip={isCollapsed ? item.title : undefined}
                    >
                      <item.icon className={cn(
                        "h-5 w-5 shrink-0 transition-transform duration-200",
                        !isActive && "group-hover:scale-105"
                      )} />
                      
                      {!isCollapsed && (
                        <span className="truncate text-sm">
                          {item.title}
                        </span>
                      )}

                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup className="mt-6">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-bold text-white/50 uppercase tracking-widest px-3 py-2 mb-1">
              {t('navigation.tools') || 'Ferramentas'}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {/* Alerts Button */}
              <SidebarMenuItem className="animate-slide-in" style={{ animationDelay: '0.15s' }}>
                <SidebarMenuButton
                  onClick={() => handleTabChange('alerts')}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    activeTab === 'alerts' 
                      ? "bg-white text-expired shadow-md font-semibold" 
                      : alertCount > 0 
                        ? "bg-white/20 text-white border border-white/30"
                        : "text-white/80 hover:text-white hover:bg-white/15"
                  )}
                  tooltip={isCollapsed ? (alertCount > 0 ? `${alertCount} Alertas` : 'Alertas') : undefined}
                >
                  <div className="relative">
                    <Bell className={cn(
                      "h-5 w-5 shrink-0",
                      alertCount > 0 && activeTab !== 'alerts' && "animate-pulse"
                    )} />
                    {alertCount > 0 && (
                      <span className={cn(
                        "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] flex items-center justify-center font-bold",
                        activeTab === 'alerts' 
                          ? "bg-expired text-white" 
                          : "bg-white text-expired"
                      )}>
                        {alertCount > 99 ? '99+' : alertCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="truncate text-sm">
                      {alertCount > 0 ? `${alertCount} Alertas` : 'Alertas'}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Reports Button */}
              <SidebarMenuItem className="animate-slide-in" style={{ animationDelay: '0.18s' }}>
                <SidebarMenuButton
                  onClick={onShowReports}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                    "text-white/80 hover:text-white hover:bg-white/15"
                  )}
                  tooltip={isCollapsed ? t('reports.title') : undefined}
                >
                  <FileText className="h-5 w-5 shrink-0 group-hover:scale-105 transition-transform duration-200" />
                  {!isCollapsed && (
                    <span className="truncate text-sm">{t('reports.title') || 'Relatórios'}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-white/15 p-4">
        {!isCollapsed ? (
          <div className="text-center">
            <p className="text-[10px] text-white/50 font-medium">
              © 2024 FleetDocs Manager
            </p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-white/60">Sistema Ativo</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

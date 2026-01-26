import { 
  Car, 
  Users, 
  FileStack, 
  ClipboardCheck, 
  BarChart3, 
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
        "border-r border-border bg-card transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Car className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-foreground text-sm">FleetDocs</h2>
                <p className="text-xs text-muted-foreground">Manager</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-2">
        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              {t('navigation.title') || 'Navegação'}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleTabChange(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                      "hover:bg-muted",
                      activeTab === item.id 
                        ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    tooltip={isCollapsed ? item.title : undefined}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 shrink-0",
                      activeTab === item.id ? "text-primary-foreground" : ""
                    )} />
                    {!isCollapsed && (
                      <span className="font-medium truncate">{item.title}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools Section */}
        <SidebarGroup className="mt-6">
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2">
              {t('navigation.tools') || 'Ferramentas'}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {/* Alerts Button */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleTabChange('alerts')}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-muted",
                    activeTab === 'alerts' 
                      ? "bg-destructive/20 text-destructive" 
                      : alertCount > 0 
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "text-muted-foreground hover:text-foreground"
                  )}
                  tooltip={isCollapsed ? (alertCount > 0 ? `${alertCount} Alertas` : 'Alertas') : undefined}
                >
                  <div className="relative">
                    <Bell className="h-5 w-5 shrink-0" />
                    {alertCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full text-[8px] flex items-center justify-center text-destructive-foreground font-bold">
                        {alertCount > 9 ? '9+' : alertCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <span className="font-medium truncate">
                      {alertCount > 0 ? `${alertCount} Alertas` : 'Alertas'}
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Reports Button */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={onShowReports}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                  tooltip={isCollapsed ? t('reports.title') : undefined}
                >
                  <FileText className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <span className="font-medium truncate">{t('reports.title') || 'Relatórios'}</span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        {!isCollapsed && (
          <p className="text-xs text-muted-foreground text-center">
            © 2024 FleetDocs
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

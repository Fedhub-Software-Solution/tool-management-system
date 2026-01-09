import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  FolderPlus,
  FileText,
  FileSpreadsheet,
  Wrench,
  Database,
  ShoppingCart,
  BarChart3,
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileChartPie,
  Building2,
  Settings,
  ChevronDown,
  ChevronUp,
  Users,
  Settings2,
  Palette,
} from "lucide-react";

type UserRole = "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";

interface LeftNavProps {
  userRole: UserRole;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSwitchRole: () => void;
  pendingCount?: {
    projects?: number;
    prs?: number;
    quotations?: number;
    handovers?: number;
    lowStock?: number;
    requests?: number;
  };
}

export function LeftNav({
  userRole,
  activeTab,
  onTabChange,
  onSwitchRole,
  pendingCount = {},
}: LeftNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  // Auto-expand settings if a settings submenu is active
  useEffect(() => {
    if (activeTab.startsWith("settings")) {
      setSettingsExpanded(true);
    }
  }, [activeTab]);

  const getRoleGradient = () => {
    switch (userRole) {
      case "Approver":
        return "from-purple-500 to-pink-500";
      case "NPD":
        return "from-blue-500 to-cyan-500";
      case "Maintenance":
        return "from-cyan-500 to-teal-500";
      case "Spares":
        return "from-teal-500 to-emerald-500";
      case "Indentor":
        return "from-rose-500 to-orange-500";
      default:
        return "from-indigo-500 to-purple-500";
    }
  };

  const getNavigationItems = () => {
    switch (userRole) {
      case "Approver":
        return [
          { id: "dashboard", label: "Dashboard", icon: Home },
          { id: "projects", label: "Projects", icon: FolderPlus, count: pendingCount.projects },
          { id: "prs", label: "Purchase Requisitions", icon: FileText, count: pendingCount.prs },
          { id: "quotations", label: "Quotations", icon: FileSpreadsheet, count: pendingCount.quotations },
          { id: "suppliers", label: "Supplier Management", icon: Building2 },
          { id: "reports", label: "Reports", icon: FileChartPie },
          { 
            id: "settings", 
            label: "Settings", 
            icon: Settings,
            subItems: [
              { id: "settings-user-management", label: "User Management", icon: Users },
              { id: "settings-enterprise", label: "Enterprise", icon: Building2 },
              { id: "settings-configuration", label: "Configuration", icon: Settings2 },
              { id: "settings-preferences", label: "Preferences", icon: Palette },
            ]
          },
        ];
      case "NPD":
        return [
          { id: "dashboard", label: "Dashboard", icon: Home },
          { id: "projects", label: "Projects", icon: FolderPlus },
          { id: "prs", label: "Purchase Requisitions", icon: FileText },
          { id: "quotations", label: "Quotations", icon: FileSpreadsheet, count: pendingCount.quotations },
          { id: "handovers", label: "Tool Handovers", icon: Wrench, count: pendingCount.handovers },
          { id: "suppliers", label: "Supplier Management", icon: Building2 },
          { id: "reports", label: "Reports", icon: FileChartPie },
          { 
            id: "settings", 
            label: "Settings", 
            icon: Settings,
            subItems: [
              { id: "settings-user-management", label: "User Management", icon: Users },
              { id: "settings-enterprise", label: "Enterprise", icon: Building2 },
              { id: "settings-configuration", label: "Configuration", icon: Settings2 },
              { id: "settings-preferences", label: "Preferences", icon: Palette },
            ]
          },
        ];
      case "Maintenance":
        return [
          { id: "dashboard", label: "Dashboard", icon: Home },
          { id: "handovers", label: "Tool Handovers", icon: Wrench, count: pendingCount.handovers },
          { id: "inventory", label: "Tool Inventory", icon: Database },
          { id: "reports", label: "Reports", icon: FileChartPie },
        ];
      case "Spares":
        return [
          { id: "dashboard", label: "Dashboard", icon: Home },
          { id: "inventory", label: "Tool Inventory", icon: Database, count: pendingCount.lowStock },
          { id: "requests", label: "Spares Requests", icon: ShoppingCart, count: pendingCount.requests },
          { id: "reports", label: "Reports", icon: FileChartPie },
        ];
      case "Indentor":
        return [
          { id: "dashboard", label: "Dashboard", icon: Home },
          { id: "inventory", label: "Tool Inventory", icon: Database },
          { id: "requests", label: "My Requests", icon: ShoppingCart },
          { id: "reports", label: "Reports", icon: FileChartPie },
        ];
      default:
        return [{ id: "dashboard", label: "Dashboard", icon: Home }];
    }
  };

  const navItems = getNavigationItems();

  return (
    <div
      className={`${
        isCollapsed ? "w-20" : "w-64"
      } bg-gradient-to-b from-slate-50 to-slate-100 border-r border-slate-200 flex flex-col transition-all duration-300 shadow-lg`}
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="font-bold text-lg bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
                {userRole} Team
              </h2>
              <p className="text-xs text-slate-500 mt-1">Tool Maintenance</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-slate-200"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-smart">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || activeTab.startsWith(item.id + "-");
          const hasSubItems = item.subItems && item.subItems.length > 0;
          const isExpanded = item.id === "settings" && settingsExpanded;

          return (
            <div key={item.id}>
              <Button
                variant={isActive && !hasSubItems ? "default" : "ghost"}
                className={`w-full justify-start transition-all duration-200 ${
                  isActive && !hasSubItems
                    ? `bg-gradient-to-r ${getRoleGradient()} text-white shadow-lg hover:shadow-xl`
                    : "hover:bg-slate-200 text-slate-700"
                } ${isCollapsed ? "px-2" : "px-4"}`}
                onClick={() => {
                  if (hasSubItems) {
                    setSettingsExpanded(!settingsExpanded);
                  } else {
                    onTabChange(item.id);
                  }
                }}
              >
                <Icon className={`${isCollapsed ? "w-5 h-5" : "w-5 h-5 mr-3"}`} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.count !== undefined && item.count > 0 && (
                      <Badge
                        className={`${
                          isActive && !hasSubItems
                            ? "bg-white text-slate-700"
                            : "bg-gradient-to-r from-red-500 to-rose-600 text-white"
                        } shadow-sm`}
                      >
                        {item.count}
                      </Badge>
                    )}
                    {hasSubItems && (
                      isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </>
                )}
              </Button>

              {/* Submenu Items */}
              {hasSubItems && isExpanded && !isCollapsed && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.subItems.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = activeTab === subItem.id;

                    return (
                      <Button
                        key={subItem.id}
                        variant={isSubActive ? "default" : "ghost"}
                        className={`w-full justify-start transition-all duration-200 text-xs ${
                          isSubActive
                            ? `bg-gradient-to-r ${getRoleGradient()} text-white shadow-lg hover:shadow-xl`
                            : "hover:bg-slate-200 text-slate-700"
                        } px-3 py-1.5 h-8`}
                        onClick={() => onTabChange(subItem.id)}
                      >
                        <SubIcon className="w-4 h-4 mr-2" />
                        <span className="flex-1 text-left">{subItem.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200">
        <Button
          variant="outline"
          className={`w-full border-2 border-slate-300 hover:bg-slate-200 transition-all ${
            isCollapsed ? "px-2" : ""
          }`}
          onClick={onSwitchRole}
        >
          <LogOut className={`${isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-2"}`} />
          {!isCollapsed && "Switch Role"}
        </Button>
      </div>
    </div>
  );
}
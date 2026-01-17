import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ProjectList } from "./ProjectListUpdated";
import { PRList } from "./PRList";
import { QuotationManagement } from "./QuotationManagement";
import { ToolHandover } from "./ToolHandover";
import { ToolHandoverInspection } from "./ToolHandoverInspection";
import { SparesInventory } from "./SparesInventory";
import { SparesRequests } from "./SparesRequests";
import { Reports } from "./Reports";
import { NPDDashboard } from "./NPDDashboard";
import { SparesDashboard } from "./SparesDashboard";
import { SupplierManagement, type Supplier } from "./SupplierManagement";
import { Settings } from "./Settings";
import { 
  FolderPlus, 
  FileText, 
  FileSpreadsheet, 
  Wrench, 
  Database, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package,
  Layers,
  Activity,
  AlertTriangle,
  Filter,
  CalendarIcon,
  Settings as SettingsIcon,
  RefreshCw,
  Clock
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";
import { Button } from "./ui/button";
import { format } from "date-fns";
import { DateFilterControl, type DateFilter, filterByDateRange, groupByTimePeriod, sortTimePeriodKeys } from "./DateFilterControl";

export interface Project {
  id: string; // UUID from backend
  projectNumber?: string; // Project number like "PROJ-001" (from backend)
  customerPO: string;
  partNumber: string;
  toolNumber: string;
  price: number;
  targetDate: string;
  status: string;
  description?: string;
  createdBy: string | { id: string; firstName: string; lastName: string }; // Can be string or object from backend
  createdAt: string;
  updatedAt?: string;
}

export interface PR {
  id: string;
  projectId: string;
  prType: "New Set" | "Modification" | "Refurbished";
  items: PRItem[];
  suppliers: string[];
  status: "Submitted" | "Approved" | "Sent To Supplier" | "Evaluation Pending" | "Submitted for Approval" | "Awarded" | "Items Received";
  createdBy: string;
  createdAt: string;
  approverComments?: string;
  quotations?: Quotation[];
  awardedSupplier?: string;
  modRefReason?: string; // Reason for Modification/Refurbished
  criticalSpares?: { id: string; quantity: number }[]; // Critical spares with quantities
  itemsReceivedDate?: string; // Date when items were received
}

export interface PRItem {
  id: string;
  name: string;
  specification: string;
  quantity: number;
  requirements: string;
  price?: number; // BOM unit price
}

export interface QuotationItem {
  itemId: string;
  itemName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface Quotation {
  id: string;
  prId: string;
  supplier: string;
  price: number;
  items: QuotationItem[];
  deliveryTerms: string;
  deliveryDate: string;
  status: "Pending" | "Evaluated" | "Selected" | "Rejected";
  notes: string;
}

export interface ToolHandoverRecord {
  id: string;
  projectId: string;
  prId: string;
  toolSet: string;
  allItems: PRItem[]; // All items from the PR
  criticalSpares: SpareItem[]; // Selected critical spares from the items
  status: "Pending Inspection" | "Approved" | "Rejected";
  inspectedBy?: string;
  inspectionDate?: string;
  remarks?: string;
}

export interface SpareItem {
  id: string;
  partNumber: string;
  toolNumber: string;
  name: string;
  quantity: number;
}

export interface InventoryItem extends SpareItem {
  stockLevel: number;
  minStockLevel: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  additionHistory?: StockAddition[];
  removalHistory?: StockRemoval[];
}

export interface StockAddition {
  id: string;
  date: string;
  quantity: number;
  prNumber: string;
  projectId: string;
  prType: "New Set" | "Modification" | "Refurbished";
}

export interface StockRemoval {
  id: string;
  date: string;
  quantity: number;
  requestId: string;
  projectId?: string;
  requestedBy: string;
}

export interface SparesRequest {
  id: string;
  requestedBy: string;
  itemName: string;
  partNumber: string;
  toolNumber: string;
  quantityRequested: number;
  quantityFulfilled: number;
  status: "Pending" | "Fulfilled" | "Partially Fulfilled" | "Rejected";
  requestDate: string;
  projectId?: string;
  purpose?: string;
}

export type { Supplier } from "./SupplierManagement";

interface DashboardProps {
  userRole: "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";
  activeTab: string;
  onTabChange: (tab: string) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  prs: PR[];
  setPRs: (prs: PR[]) => void;
  handovers: ToolHandoverRecord[];
  setHandovers: (handovers: ToolHandoverRecord[]) => void;
  inventory: InventoryItem[];
  setInventory: (inventory: InventoryItem[]) => void;
  sparesRequests: SparesRequest[];
  setSparesRequests: (requests: SparesRequest[]) => void;
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
}

export function Dashboard({ 
  userRole,
  activeTab,
  onTabChange,
  projects, 
  setProjects, 
  prs, 
  setPRs, 
  handovers, 
  setHandovers, 
  inventory, 
  setInventory, 
  sparesRequests, 
  setSparesRequests,
  suppliers,
  setSuppliers
}: DashboardProps) {
  // State for selected KPI to show trend
  const [selectedKPI, setSelectedKPI] = useState<string | null>(null);
  
  // State to control opening Create PR screen directly
  const [openCreatePR, setOpenCreatePR] = useState(false);
  
  // State for tool handover inspection screen
  const [inspectionHandover, setInspectionHandover] = useState<ToolHandoverRecord | null>(null);
  
  // Date range filter for KPI trends
  const [kpiDateRange, setKpiDateRange] = useState<{
    preset: string;
    customFromDate: Date | undefined;
    customToDate: Date | undefined;
  }>({
    preset: "6months",
    customFromDate: undefined,
    customToDate: undefined
  });

  // Spares chart filter for Maintenance dashboard
  const [sparesChartFilter, setSparesChartFilter] = useState<DateFilter>({
    type: "month",
    month: new Date().toISOString().slice(0, 7), // Current month (YYYY-MM)
    year: new Date().getFullYear().toString(),
    startDate: "",
    endDate: "",
  });

  // Filter states for charts
  const [prDistributionFilter, setPRDistributionFilter] = useState<{
    partNumber: string;
    prType: string;
    dateRange: string;
    customFromDate: Date | undefined;
    customToDate: Date | undefined;
  }>({
    partNumber: "all",
    prType: "all",
    dateRange: "all",
    customFromDate: undefined,
    customToDate: undefined
  });

  const [amountAnalysisFilter, setAmountAnalysisFilter] = useState<{
    partNumber: string;
    status: string;
    prType: string;
    dateRange: string;
    customFromDate: Date | undefined;
    customToDate: Date | undefined;
  }>({
    partNumber: "all",
    status: "all",
    prType: "all",
    dateRange: "all",
    customFromDate: undefined,
    customToDate: undefined
  });

  // Total PRs chart filter
  const [totalPRsFilter, setTotalPRsFilter] = useState<DateFilter>({
    type: "month",
    month: new Date().toISOString().slice(0, 7), // Current month (YYYY-MM)
    year: new Date().getFullYear().toString(),
    startDate: "",
    endDate: "",
  });

  // Auto-update inventory when handovers are approved
  const handleHandoverUpdate = (updatedHandovers: ToolHandoverRecord[]) => {
    setHandovers(updatedHandovers);
    
    // Find newly approved handovers
    const newlyApprovedHandovers = updatedHandovers.filter(
      h => h.status === "Approved" && 
      !handovers.find(old => old.id === h.id && old.status === "Approved")
    );

    // Add critical spares to inventory
    newlyApprovedHandovers.forEach(handover => {
      handover.criticalSpares.forEach(spare => {
        const existingItem = inventory.find(
          item => item.partNumber === spare.partNumber && item.toolNumber === spare.toolNumber
        );

        if (existingItem) {
          // Update existing inventory
          setInventory(
            inventory.map(item =>
              item.partNumber === spare.partNumber && item.toolNumber === spare.toolNumber
                ? {
                    ...item,
                    stockLevel: item.stockLevel + spare.quantity,
                    status:
                      item.stockLevel + spare.quantity <= item.minStockLevel
                        ? "Low Stock"
                        : "In Stock",
                  }
                : item
            )
          );
        } else {
          // Add new inventory item
          const newItem: InventoryItem = {
            id: `INV-${Date.now()}-${spare.id}`,
            partNumber: spare.partNumber,
            toolNumber: spare.toolNumber,
            name: spare.name,
            quantity: spare.quantity,
            stockLevel: spare.quantity,
            minStockLevel: Math.max(2, Math.floor(spare.quantity * 0.2)), // 20% of initial quantity
            status: "In Stock",
          };
          setInventory([...inventory, newItem]);
        }
      });
    });
  };

  // Handle navigation to inspection screen
  const handleNavigateToInspection = (handover: ToolHandoverRecord) => {
    setInspectionHandover(handover);
  };

  // Handle approve from inspection screen
  const handleInspectionApprove = (handover: ToolHandoverRecord, remarks: string) => {
    const pr = prs.find((p) => p.id === handover.prId);
    const project = projects.find((p) => p.id === handover.projectId);
    
    // Get ALL PR items
    const allPRItems = handover.allItems || pr?.items || [];
    
    // Update handover status
    const updatedHandovers = handovers.map(h =>
      h.id === handover.id
        ? {
            ...h,
            status: "Approved" as const,
            inspectedBy: "Maintenance Team",
            inspectionDate: new Date().toISOString(),
            remarks: remarks,
            handoverDate: new Date().toISOString().split('T')[0],
          }
        : h
    );
    
    setHandovers(updatedHandovers);

    // Automatically update Tool Inventory with BOTH PR items AND critical spares
    const updatedInventory = [...inventory];
    
    // First, add all PR items to inventory
    allPRItems.forEach((item) => {
      const partNumber = item.id;
      const toolNumber = project?.toolNumber || "TBD";
      
      const existingItemIndex = updatedInventory.findIndex(
        invItem => 
          invItem.partNumber === partNumber && 
          invItem.toolNumber === toolNumber &&
          invItem.name === item.name
      );

      if (existingItemIndex >= 0) {
        const existingItem = updatedInventory[existingItemIndex];
        const newQuantity = existingItem.quantity + item.quantity;
        const newStockLevel = existingItem.stockLevel + item.quantity;
        
        updatedInventory[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          stockLevel: newStockLevel,
          status: newQuantity === 0
            ? "Out of Stock"
            : newQuantity <= existingItem.minStockLevel
            ? "Low Stock"
            : "In Stock",
        };
      } else {
        const defaultMinStockLevel = Math.max(1, Math.ceil(item.quantity * 0.3));
        
        const newInventoryItem = {
          id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          partNumber: partNumber,
          toolNumber: toolNumber,
          name: item.name,
          quantity: item.quantity,
          stockLevel: item.quantity,
          minStockLevel: defaultMinStockLevel,
          status: item.quantity === 0
            ? "Out of Stock"
            : item.quantity <= defaultMinStockLevel
            ? "Low Stock"
            : "In Stock",
        };
        
        updatedInventory.push(newInventoryItem);
      }
    });
    
    // Second, add all critical spares to inventory
    handover.criticalSpares.forEach((spare) => {
      const existingItemIndex = updatedInventory.findIndex(
        invItem => 
          invItem.partNumber === spare.partNumber && 
          invItem.toolNumber === spare.toolNumber &&
          invItem.name === spare.name
      );

      if (existingItemIndex >= 0) {
        const existingItem = updatedInventory[existingItemIndex];
        const newQuantity = existingItem.quantity + spare.quantity;
        const newStockLevel = existingItem.stockLevel + spare.quantity;
        
        updatedInventory[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          stockLevel: newStockLevel,
          status: newQuantity === 0
            ? "Out of Stock"
            : newQuantity <= existingItem.minStockLevel
            ? "Low Stock"
            : "In Stock",
        };
      } else {
        const defaultMinStockLevel = Math.max(1, Math.ceil(spare.quantity * 0.3));
        
        const newInventoryItem = {
          id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          partNumber: spare.partNumber,
          toolNumber: spare.toolNumber,
          name: spare.name,
          quantity: spare.quantity,
          stockLevel: spare.quantity,
          minStockLevel: defaultMinStockLevel,
          status: spare.quantity === 0
            ? "Out of Stock"
            : spare.quantity <= defaultMinStockLevel
            ? "Low Stock"
            : "In Stock",
        };
        
        updatedInventory.push(newInventoryItem);
      }
    });

    setInventory(updatedInventory);
    setInspectionHandover(null);
    onTabChange("handovers");
  };

  // Handle reject from inspection screen
  const handleInspectionReject = (handover: ToolHandoverRecord, remarks: string) => {
    const updatedHandovers = handovers.map(h =>
      h.id === handover.id
        ? {
            ...h,
            status: "Rejected" as const,
            inspectedBy: "Maintenance Team",
            inspectionDate: new Date().toISOString(),
            remarks: remarks,
          }
        : h
    );
    
    setHandovers(updatedHandovers);
    setInspectionHandover(null);
    onTabChange("handovers");
  };

  // Listen for navigation events from ProjectDetailView
  useEffect(() => {
    const handleNavigateToPR = (event: Event) => {
      const customEvent = event as CustomEvent;
      const pr = customEvent.detail.pr as PR;
      
      // Switch to Purchase Requests tab
      onTabChange("prs");
      
      // Trigger view PR by dispatching another event that PRList can listen to
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openPRView', { detail: { prId: pr.id } }));
      }, 100);
    };

    const handleNavigateToQuotations = (event: Event) => {
      const customEvent = event as CustomEvent;
      const pr = customEvent.detail.pr as PR;
      
      // Switch to Quotations tab
      onTabChange("quotations");
      
      // Trigger view PR in quotations by dispatching another event
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('openQuotationPRView', { detail: { prId: pr.id } }));
      }, 100);
    };

    window.addEventListener('navigateToPRView', handleNavigateToPR);
    window.addEventListener('navigateToQuotations', handleNavigateToQuotations);

    return () => {
      window.removeEventListener('navigateToPRView', handleNavigateToPR);
      window.removeEventListener('navigateToQuotations', handleNavigateToQuotations);
    };
  }, [onTabChange]);

  const getAvailableTabs = () => {
    switch (userRole) {
      case "Approver":
        return ["projects", "prs", "suppliers"];
      case "NPD":
        return ["projects", "prs", "quotations", "suppliers", "reports"];
      case "Maintenance":
        return ["dashboard", "handovers"];
      case "Spares":
        return ["dashboard", "inventory", "requests"];
      case "Indentor":
        return ["requests"];
      default:
        return ["projects"];
    }
  };

  const tabs = getAvailableTabs();

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

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {activeTab === "dashboard" && (
        <>
          {/* Comprehensive Metrics for Approver */}
          {userRole === "Approver" && (() => {
            const totalPlannedBudget = projects.reduce((sum, p) => sum + p.price, 0);
            const totalActualBudget = prs.reduce((sum, pr) => {
              if (pr.status === "Awarded" && pr.quotations) {
                const awardedQuote = pr.quotations.find(
                  q => q.status === "Selected" || q.supplier === pr.awardedSupplier
                );
                return sum + (awardedQuote?.price || 0);
              }
              return sum;
            }, 0);
            const totalVariance = totalActualBudget - totalPlannedBudget;
            const totalVariancePercentage = totalPlannedBudget > 0 
              ? (totalVariance / totalPlannedBudget) * 100 
              : 0;
            const newPRCount = prs.filter(pr => pr.prType === "New Set").length;
            const modificationPRCount = prs.filter(pr => pr.prType === "Modification").length;
            const refurbishedPRCount = prs.filter(pr => pr.prType === "Refurbished").length;
            const awardedPRCount = prs.filter(pr => pr.status === "Awarded").length;
            const pendingPRCount = prs.filter(pr => pr.status === "Pending Approval").length;

            return (
              <>
                {/* Scrollable Content with Sticky Header */}
                <div className="overflow-y-auto flex-1 scrollbar-smart">
                  {/* Key Metrics Row 1 - Sticky */}
                  <div className="sticky top-0 z-30 bg-gradient-to-br from-slate-50 to-slate-100 px-4 pt-2 pb-1.5 border-b border-slate-200/60 shadow-sm">
                    <div className="mb-1.5">
                      <h1 className="mb-0.5 text-sm font-bold leading-tight">Dashboard</h1>
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1 leading-tight">
                        Welcome, <span className={`font-semibold bg-gradient-to-r ${getRoleGradient()} bg-clip-text text-transparent`}>{userRole} Team</span>
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card 
                      className={`border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-50 cursor-pointer transition-all ${selectedKPI === 'planned' ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:shadow-lg'}`}
                      onClick={() => setSelectedKPI(selectedKPI === 'planned' ? null : 'planned')}
                    >
                      <CardHeader className="pb-1.5 pt-2 px-3">
                        <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-purple-900 leading-tight">
                          <div className="p-1 bg-purple-100 rounded-lg">
                            <DollarSign className="w-3 h-3 text-purple-600" />
                          </div>
                          Total Planned Budget
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2 px-3">
                        <div className="text-xl font-bold text-purple-600">
                          ₹{totalPlannedBudget.toLocaleString()}
                        </div>
                        <p className="text-[9px] text-purple-600/70 mt-0.5 leading-tight">From {projects.length} projects • Click for trend</p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50 cursor-pointer transition-all ${selectedKPI === 'actual' ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'}`}
                      onClick={() => setSelectedKPI(selectedKPI === 'actual' ? null : 'actual')}
                    >
                      <CardHeader className="pb-1.5 pt-2 px-3">
                        <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-blue-900 leading-tight">
                          <div className="p-1 bg-blue-100 rounded-lg">
                            <DollarSign className="w-3 h-3 text-blue-600" />
                          </div>
                          Total Actual Budget
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2 px-3">
                        <div className="text-xl font-bold text-blue-600">
                          ₹{totalActualBudget.toLocaleString()}
                        </div>
                        <p className="text-[9px] text-blue-600/70 mt-0.5 leading-tight">From {awardedPRCount} awarded PRs • Click for trend</p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`border-0 shadow-md ${totalVariance > 0 ? 'bg-gradient-to-br from-red-50 to-rose-50' : 'bg-gradient-to-br from-green-50 to-emerald-50'} cursor-pointer transition-all ${selectedKPI === 'variance' ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:shadow-lg'}`}
                      onClick={() => setSelectedKPI(selectedKPI === 'variance' ? null : 'variance')}
                    >
                      <CardHeader className="pb-1.5 pt-2 px-3">
                        <CardTitle className={`text-xs font-medium flex items-center gap-1.5 leading-tight ${totalVariance > 0 ? 'text-red-900' : 'text-green-900'}`}>
                          <div className={`p-1 ${totalVariance > 0 ? 'bg-red-100' : 'bg-green-100'} rounded-lg`}>
                            {totalVariance > 0 ? (
                              <TrendingUp className="w-3 h-3 text-red-600" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-green-600" />
                            )}
                          </div>
                          Budget Variance
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2 px-3">
                        <div className={`text-xl font-bold ${totalVariance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {totalVariance >= 0 ? '+' : ''}₹{totalVariance.toLocaleString()}
                        </div>
                        <p className={`text-[9px] mt-0.5 leading-tight ${totalVariance > 0 ? 'text-red-600/70' : 'text-green-600/70'}`}>
                          {totalVariancePercentage >= 0 ? '+' : ''}{totalVariancePercentage.toFixed(1)}% variance • Click for trend
                        </p>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`border-0 shadow-md bg-gradient-to-br from-amber-50 to-orange-50 cursor-pointer transition-all ${selectedKPI === 'prs' ? 'ring-2 ring-amber-500 shadow-lg' : 'hover:shadow-lg'}`}
                      onClick={() => setSelectedKPI(selectedKPI === 'prs' ? null : 'prs')}
                    >
                      <CardHeader className="pb-1.5 pt-2 px-3">
                        <CardTitle className="text-xs font-medium flex items-center gap-1.5 text-amber-900 leading-tight">
                          <div className="p-1 bg-amber-100 rounded-lg">
                            <Package className="w-3 h-3 text-amber-600" />
                          </div>
                          Total PRs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2 px-3">
                        <div className="text-xl font-bold text-amber-600">{prs.length}</div>
                        <p className="text-[9px] text-amber-600/70 mt-0.5 leading-tight">
                          {awardedPRCount} awarded, {pendingPRCount} pending • Click for trend
                        </p>
                      </CardContent>
                    </Card>
                    </div>

                    {/* KPI Trend Graph - Shows when a KPI is selected */}
                    {selectedKPI && (
                      <div className="mx-4 mb-3 mt-2 max-h-[450px] overflow-y-auto scrollbar-smart">
                        <Card className="border-0 shadow-lg animate-in slide-in-from-top-2 duration-300">
                          <CardHeader className="pb-2 pt-3 px-4 sticky top-0 bg-white z-10 border-b">
                            {/* Title and Period Filter on Same Line */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex-shrink-0">
                                <CardTitle className="text-sm">
                                  {selectedKPI === 'planned' && 'Planned Budget Trend'}
                                  {selectedKPI === 'actual' && 'Actual Budget Trend'}
                                  {selectedKPI === 'variance' && 'Budget Variance Trend'}
                                  {selectedKPI === 'prs' && 'PR Count Trend'}
                                </CardTitle>
                              </div>
                              
                              {/* Period Filter Buttons in Middle - with Custom Date Pickers Inline */}
                              <div className="flex items-center gap-2 flex-wrap flex-1 justify-center">
                                <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Period:</Label>
                                <div className="flex gap-1 flex-wrap items-center">
                                  <Button
                                    size="sm"
                                    variant={kpiDateRange.preset === '3months' ? 'default' : 'outline'}
                                    onClick={() => setKpiDateRange({ preset: '3months', customFromDate: undefined, customToDate: undefined })}
                                    className="h-6 px-2 text-[10px]"
                                  >
                                    3M
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={kpiDateRange.preset === '6months' ? 'default' : 'outline'}
                                    onClick={() => setKpiDateRange({ preset: '6months', customFromDate: undefined, customToDate: undefined })}
                                    className="h-6 px-2 text-[10px]"
                                  >
                                    6M
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={kpiDateRange.preset === '1year' ? 'default' : 'outline'}
                                    onClick={() => setKpiDateRange({ preset: '1year', customFromDate: undefined, customToDate: undefined })}
                                    className="h-6 px-2 text-[10px]"
                                  >
                                    1Y
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={kpiDateRange.preset === '2years' ? 'default' : 'outline'}
                                    onClick={() => setKpiDateRange({ preset: '2years', customFromDate: undefined, customToDate: undefined })}
                                    className="h-6 px-2 text-[10px]"
                                  >
                                    2Y
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={kpiDateRange.preset === '3years' ? 'default' : 'outline'}
                                    onClick={() => setKpiDateRange({ preset: '3years', customFromDate: undefined, customToDate: undefined })}
                                    className="h-6 px-2 text-[10px]"
                                  >
                                    3Y
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant={kpiDateRange.preset === 'custom' ? 'default' : 'outline'}
                                    onClick={() => setKpiDateRange({ ...kpiDateRange, preset: 'custom' })}
                                    className="h-6 px-2 text-[10px]"
                                  >
                                    Custom
                                  </Button>
                                  
                                  {/* Custom Date Pickers - Inline with Custom Button */}
                                  {kpiDateRange.preset === 'custom' && (
                                    <>
                                      <div className="flex items-center gap-1.5 ml-2">
                                        <Label className="text-[10px] text-muted-foreground whitespace-nowrap">From:</Label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-6 px-2 text-[10px] justify-start min-w-[100px]"
                                            >
                                              <CalendarIcon className="mr-1 h-3 w-3" />
                                              {kpiDateRange.customFromDate ? format(kpiDateRange.customFromDate, "MMM dd, yyyy") : "Select"}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                              mode="single"
                                              selected={kpiDateRange.customFromDate}
                                              onSelect={(date) => setKpiDateRange({ ...kpiDateRange, customFromDate: date })}
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                      
                                      <div className="flex items-center gap-1.5">
                                        <Label className="text-[10px] text-muted-foreground whitespace-nowrap">To:</Label>
                                        <Popover>
                                          <PopoverTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-6 px-2 text-[10px] justify-start min-w-[100px]"
                                            >
                                              <CalendarIcon className="mr-1 h-3 w-3" />
                                              {kpiDateRange.customToDate ? format(kpiDateRange.customToDate, "MMM dd, yyyy") : "Select"}
                                            </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                              mode="single"
                                              selected={kpiDateRange.customToDate}
                                              onSelect={(date) => setKpiDateRange({ ...kpiDateRange, customToDate: date })}
                                              initialFocus
                                            />
                                          </PopoverContent>
                                        </Popover>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                              
                              {/* Description Text - Before Close Button */}
                              <p className="text-[10px] text-muted-foreground flex-shrink-0">
                                {kpiDateRange.preset === 'custom' 
                                  ? 'Custom date range selected'
                                  : kpiDateRange.preset === '3months' 
                                  ? 'Monthly trends over the last 3 months'
                                  : kpiDateRange.preset === '6months'
                                  ? 'Monthly trends over the last 6 months'
                                  : kpiDateRange.preset === '1year'
                                  ? 'Monthly trends over the last 1 year'
                                  : kpiDateRange.preset === '2years'
                                  ? 'Monthly trends over the last 2 years'
                                  : kpiDateRange.preset === '3years'
                                  ? 'Monthly trends over the last 3 years'
                                  : 'Monthly trends over the last 6 months'
                                }
                              </p>
                              
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedKPI(null);
                                }}
                                className="h-7 w-7 p-0 flex-shrink-0"
                              >
                                ✕
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pb-3 px-4 pt-4">
                            {(() => {
                              // Determine date range based on filter selection
                              let monthsToShow = 6; // default
                              let startDate: Date;
                              let endDate = new Date();
                              
                              if (kpiDateRange.preset === 'custom') {
                                if (kpiDateRange.customFromDate && kpiDateRange.customToDate) {
                                  startDate = kpiDateRange.customFromDate;
                                  endDate = kpiDateRange.customToDate;
                                  // Calculate months between custom dates
                                  const monthDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                                   (endDate.getMonth() - startDate.getMonth());
                                  monthsToShow = Math.max(1, monthDiff + 1);
                                } else {
                                  // If custom is selected but dates aren't set, use default
                                  monthsToShow = 6;
                                  startDate = new Date(endDate.getFullYear(), endDate.getMonth() - monthsToShow + 1, 1);
                                }
                              } else {
                                // Preset ranges
                                monthsToShow = kpiDateRange.preset === '3months' ? 3 : 
                                              kpiDateRange.preset === '6months' ? 6 : 
                                              kpiDateRange.preset === '1year' ? 12 :
                                              kpiDateRange.preset === '2years' ? 24 :
                                              kpiDateRange.preset === '3years' ? 36 : 6;
                                startDate = new Date(endDate.getFullYear(), endDate.getMonth() - monthsToShow + 1, 1);
                              }
                              
                              // Generate months data based on selected range
                              const monthsData = [];
                              const now = endDate;
                              
                              for (let i = monthsToShow - 1; i >= 0; i--) {
                                const date = kpiDateRange.preset === 'custom' && startDate 
                                  ? new Date(startDate.getFullYear(), startDate.getMonth() + (monthsToShow - 1 - i), 1)
                                  : new Date(now.getFullYear(), now.getMonth() - i, 1);
                                const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                                const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                                const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

                                // Filter projects and PRs for this month
                                const monthProjects = projects.filter(p => {
                                  const projectDate = new Date(p.createdAt);
                                  return projectDate >= monthStart && projectDate <= monthEnd;
                                });

                                const monthPRs = prs.filter(pr => {
                                  const prDate = new Date(pr.createdAt);
                                  return prDate >= monthStart && prDate <= monthEnd;
                                });

                                const plannedBudget = monthProjects.reduce((sum, p) => sum + p.price, 0);
                                
                                const actualBudget = monthPRs.reduce((sum, pr) => {
                                  if (pr.status === "Awarded" && pr.quotations) {
                                    const awardedQuote = pr.quotations.find(
                                      q => q.status === "Selected" || q.supplier === pr.awardedSupplier
                                    );
                                    return sum + (awardedQuote?.price || 0);
                                  }
                                  return sum;
                                }, 0);

                                const variance = actualBudget - plannedBudget;
                                const prCount = monthPRs.length;

                                monthsData.push({
                                  month: monthName,
                                  planned: plannedBudget,
                                  actual: actualBudget,
                                  variance: variance,
                                  prCount: prCount,
                                  newPRs: monthPRs.filter(pr => pr.prType === "New Set").length,
                                  modificationPRs: monthPRs.filter(pr => pr.prType === "Modification").length,
                                  refurbishedPRs: monthPRs.filter(pr => pr.prType === "Refurbished").length,
                                });
                              }

                              return (
                                <ResponsiveContainer width="100%" height={200}>
                                  {selectedKPI === 'planned' ? (
                                    // Area Chart with Gradient for Planned Budget
                                    <AreaChart data={monthsData}>
                                      <defs>
                                        <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '10px' }} />
                                      <YAxis 
                                        stroke="#64748b" 
                                        style={{ fontSize: '10px' }}
                                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: "#fff",
                                          border: "1px solid #e2e8f0",
                                          borderRadius: "8px",
                                          fontSize: "11px",
                                        }}
                                        formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                                      />
                                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                                      <Area 
                                        type="monotone" 
                                        dataKey="planned" 
                                        stroke="#8b5cf6" 
                                        fill="url(#colorPlanned)" 
                                        strokeWidth={3}
                                        name="Planned Budget"
                                      />
                                    </AreaChart>
                                  ) : selectedKPI === 'actual' ? (
                                    // Bar Chart for Actual Budget
                                    <BarChart data={monthsData}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '10px' }} />
                                      <YAxis 
                                        stroke="#64748b" 
                                        style={{ fontSize: '10px' }}
                                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: "#fff",
                                          border: "1px solid #e2e8f0",
                                          borderRadius: "8px",
                                          fontSize: "11px",
                                        }}
                                        formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                                      />
                                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                                      <Bar 
                                        dataKey="actual" 
                                        fill="#3b82f6" 
                                        radius={[8, 8, 0, 0]}
                                        name="Actual Budget"
                                      />
                                    </BarChart>
                                  ) : selectedKPI === 'variance' ? (
                                    // Combo Chart for Variance (Area + Line)
                                    <AreaChart data={monthsData}>
                                      <defs>
                                        <linearGradient id="colorVariancePositive" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                                        </linearGradient>
                                        <linearGradient id="colorVarianceNegative" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.6}/>
                                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '10px' }} />
                                      <YAxis 
                                        stroke="#64748b" 
                                        style={{ fontSize: '10px' }}
                                        tickFormatter={(value) => `₹${value.toLocaleString()}`}
                                      />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: "#fff",
                                          border: "1px solid #e2e8f0",
                                          borderRadius: "8px",
                                          fontSize: "11px",
                                        }}
                                        formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                                      />
                                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                                      <Line 
                                        type="monotone" 
                                        dataKey="planned" 
                                        stroke="#8b5cf6" 
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ fill: '#8b5cf6', r: 3 }}
                                        name="Planned"
                                      />
                                      <Line 
                                        type="monotone" 
                                        dataKey="actual" 
                                        stroke="#3b82f6" 
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                        dot={{ fill: '#3b82f6', r: 3 }}
                                        name="Actual"
                                      />
                                      <Area 
                                        type="monotone" 
                                        dataKey="variance" 
                                        stroke="#ef4444" 
                                        fill="url(#colorVariancePositive)" 
                                        strokeWidth={3}
                                        name="Variance"
                                      />
                                    </AreaChart>
                                  ) : (
                                    // Stacked Bar Chart for PR Count
                                    <BarChart data={monthsData}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                      <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '10px' }} />
                                      <YAxis stroke="#64748b" style={{ fontSize: '10px' }} />
                                      <Tooltip
                                        contentStyle={{
                                          backgroundColor: "#fff",
                                          border: "1px solid #e2e8f0",
                                          borderRadius: "8px",
                                          fontSize: "11px",
                                        }}
                                      />
                                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                                      <Bar 
                                        dataKey="newPRs" 
                                        stackId="a"
                                        fill="#8b5cf6" 
                                        radius={[0, 0, 0, 0]}
                                        name="New PRs"
                                      />
                                      <Bar 
                                        dataKey="modificationPRs" 
                                        stackId="a"
                                        fill="#3b82f6" 
                                        radius={[0, 0, 0, 0]}
                                        name="Modification PRs"
                                      />
                                      <Bar 
                                        dataKey="refurbishedPRs" 
                                        stackId="a"
                                        fill="#10b981" 
                                        radius={[8, 8, 0, 0]}
                                        name="Refurbished PRs"
                                      />
                                    </BarChart>
                                  )}
                                </ResponsiveContainer>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>

                  {/* Scrollable Content Below Sticky Header */}
                  <div className="p-4 space-y-4">
                  {/* Charts Section */}
                  <div className="space-y-6">
                    {/* Part Number wise PR Distribution Chart */}
                    <Card className="border-0 shadow-lg w-full">
                      <CardHeader className="pb-4 space-y-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <CardTitle>Part Number wise PR Distribution</CardTitle>
                            {prDistributionFilter.prType !== "all" && (
                              <span className={`text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 ${
                                prDistributionFilter.prType === "New Set" ? "bg-purple-100 text-purple-700" :
                                prDistributionFilter.prType === "Modification" ? "bg-amber-100 text-amber-600" :
                                "bg-emerald-100 text-emerald-700"
                              }`}>
                                <Filter className="w-3 h-3" />
                                {prDistributionFilter.prType === "New Set" && "New Set Only"}
                                {prDistributionFilter.prType === "Modification" && "Modification Only"}
                                {prDistributionFilter.prType === "Refurbished" && "Refurbished Only"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Breakdown of New PR, Modification PR, and Refurbished PR by part number
                          </p>
                        </div>
                        
                        {/* Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1 font-medium">
                              <Filter className="w-3 h-3" />
                              PR Type
                            </Label>
                            <Select
                              value={prDistributionFilter.prType}
                              onValueChange={(value) =>
                                setPRDistributionFilter({ ...prDistributionFilter, prType: value })
                              }
                            >
                              <SelectTrigger className="h-9 text-sm w-full">
                                <SelectValue placeholder="All Types" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All PR Types</SelectItem>
                                <SelectItem value="New Set">New Set</SelectItem>
                                <SelectItem value="Modification">Modification</SelectItem>
                                <SelectItem value="Refurbished">Refurbished</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1 font-medium">
                              <Filter className="w-3 h-3" />
                              Date Filter
                            </Label>
                            <DateFilterControl 
                              filter={sparesChartFilter}
                              onFilterChange={setSparesChartFilter}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {(() => {
                          // Apply date filter using the unified filter
                          let filteredPRs = filterByDateRange(prs, sparesChartFilter, "createdAt");

                          // Apply PR type filter
                          if (prDistributionFilter.prType !== "all") {
                            filteredPRs = filteredPRs.filter(pr => pr.prType === prDistributionFilter.prType);
                          }

                          // Get unique part numbers (all part numbers)
                          let uniquePartNumbers = Array.from(new Set(projects.map(p => p.partNumber)));

                          const partNumberPRData = uniquePartNumbers.map(partNumber => {
                            const partProjects = projects.filter(p => p.partNumber === partNumber);
                            const partProjectIds = partProjects.map(p => p.id);
                            const partPRs = filteredPRs.filter(pr => partProjectIds.includes(pr.projectId));

                            return {
                              partNumber,
                              "New PR": partPRs.filter(pr => pr.prType === "New Set").length,
                              "Modification PR": partPRs.filter(pr => pr.prType === "Modification").length,
                              "Refurbished PR": partPRs.filter(pr => pr.prType === "Refurbished").length,
                            };
                          });

                          const COLORS = {
                            newPR: "#8b5cf6",
                            modification: "#f59e0b",
                            refurbished: "#10b981",
                          };

                          return partNumberPRData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No data available for selected filters.</p>
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height={350}>
                              <BarChart data={partNumberPRData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="partNumber" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                  }}
                                />
                                <Legend />
                                <Bar dataKey="New PR" fill={COLORS.newPR} radius={[8, 8, 0, 0]} />
                                <Bar dataKey="Modification PR" fill={COLORS.modification} radius={[8, 8, 0, 0]} />
                                <Bar dataKey="Refurbished PR" fill={COLORS.refurbished} radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </CardContent>
                    </Card>

                    {/* Amount Analysis and Total PRs - Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Amount Analysis - Planned vs Actual */}
                      <Card className="border-0 shadow-lg w-full">
                        <CardHeader className="pb-4 space-y-3">
                        <div>
                          <div className="flex items-center justify-between">
                            <CardTitle>Amount Analysis (Planned vs Actual)</CardTitle>
                            {amountAnalysisFilter.partNumber !== "all" && (
                              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                                <Filter className="w-3 h-3" />
                                {amountAnalysisFilter.partNumber} - All PR Types
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {amountAnalysisFilter.partNumber !== "all" 
                              ? "Budget comparison across all PR types for selected part number" 
                              : "Budget comparison by part number (all PR types combined)"}
                          </p>
                        </div>

                        {/* Filters */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1 font-medium">
                              <Filter className="w-3 h-3" />
                              Part Number
                            </Label>
                            <Select
                              value={amountAnalysisFilter.partNumber || "all"}
                              onValueChange={(value) =>
                                setAmountAnalysisFilter({ ...amountAnalysisFilter, partNumber: value })
                              }
                            >
                              <SelectTrigger className="h-9 text-sm w-full">
                                <SelectValue placeholder="All Part Numbers" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Part Numbers</SelectItem>
                                {Array.from(new Set(projects.map(p => p.partNumber))).sort().map(partNum => (
                                  <SelectItem key={partNum} value={partNum}>
                                    {partNum}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs flex items-center gap-1 font-medium">
                              <Filter className="w-3 h-3" />
                              Date Filter
                            </Label>
                            <DateFilterControl 
                              filter={sparesChartFilter}
                              onFilterChange={setSparesChartFilter}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {(() => {
                          // Apply date filter using the unified filter
                          let filteredPRs = filterByDateRange(prs, sparesChartFilter, "createdAt");

                          let plannedVsActualData: any[] = [];
                          let xAxisKey = "partNumber";

                          // Check if a specific part number is selected
                          if (amountAnalysisFilter.partNumber && amountAnalysisFilter.partNumber !== "all") {
                            // Show breakdown by PR Type for the selected part number
                            const selectedPartNumber = amountAnalysisFilter.partNumber;
                            const prTypes: ("New Set" | "Modification" | "Refurbished")[] = ["New Set", "Modification", "Refurbished"];
                            
                            // Get all projects for this part number
                            const partProjects = projects.filter(p => p.partNumber === selectedPartNumber);
                            const partProjectIds = partProjects.map(p => p.id);
                            
                            plannedVsActualData = prTypes.map(prType => {
                              // Get PRs for this part number filtered by PR type
                              const partPRs = filteredPRs.filter(pr => 
                                partProjectIds.includes(pr.projectId) && pr.prType === prType
                              );

                              // For planned budget, we need to calculate based on the project price
                              // Since a project doesn't have prType, we estimate by dividing total project price
                              // by the number of PR types that exist for this project
                              const plannedBudget = partProjects.reduce((sum, p) => {
                                // Check how many PR types exist for this project
                                const projectPRs = filteredPRs.filter(pr => pr.projectId === p.id);
                                const projectPRTypes = Array.from(new Set(projectPRs.map(pr => pr.prType)));
                                
                                // If this PR type exists for this project, allocate proportionally
                                if (projectPRs.some(pr => pr.prType === prType)) {
                                  return sum + (p.price / projectPRTypes.length);
                                }
                                return sum;
                              }, 0);

                              const actualBudget = partPRs.reduce((sum, pr) => {
                                if (pr.status === "Awarded" && pr.quotations) {
                                  const awardedQuote = pr.quotations.find(
                                    q => q.status === "Selected" || q.supplier === pr.awardedSupplier
                                  );
                                  return sum + (awardedQuote?.price || 0);
                                }
                                return sum;
                              }, 0);

                              return {
                                prType,
                                "Planned Budget": plannedBudget,
                                "Actual Budget": actualBudget,
                                variance: actualBudget - plannedBudget,
                              };
                            });
                            
                            xAxisKey = "prType";
                          } else {
                            // Show breakdown by Part Number (all PR types combined)
                            const uniquePartNumbers = Array.from(new Set(projects.map(p => p.partNumber)));

                            plannedVsActualData = uniquePartNumbers.map(partNumber => {
                              const partProjects = projects.filter(p => p.partNumber === partNumber);
                              const partProjectIds = partProjects.map(p => p.id);
                              const partPRs = filteredPRs.filter(pr => partProjectIds.includes(pr.projectId));

                              const plannedBudget = partProjects.reduce((sum, p) => sum + p.price, 0);
                              const actualBudget = partPRs.reduce((sum, pr) => {
                                if (pr.status === "Awarded" && pr.quotations) {
                                  const awardedQuote = pr.quotations.find(
                                    q => q.status === "Selected" || q.supplier === pr.awardedSupplier
                                  );
                                  return sum + (awardedQuote?.price || 0);
                                }
                                return sum;
                              }, 0);

                              return {
                                partNumber,
                                "Planned Budget": plannedBudget,
                                "Actual Budget": actualBudget,
                                variance: actualBudget - plannedBudget,
                              };
                            });
                            
                            xAxisKey = "partNumber";
                          }

                          return plannedVsActualData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No data available for selected filters.</p>
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height={350}>
                              <BarChart data={plannedVsActualData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey={xAxisKey} stroke="#64748b" />
                                <YAxis 
                                  stroke="#64748b"
                                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                  }}
                                  formatter={(value: number) => [`₹${value.toLocaleString()}`, ""]}
                                />
                                <Legend />
                                <Bar dataKey="Planned Budget" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="Actual Budget" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </CardContent>
                    </Card>

                      {/* Total PRs Over Time */}
                      <Card className="border-0 shadow-lg w-full">
                        <CardHeader className="pb-4 space-y-3">
                        <div>
                          <CardTitle>Total PRs Over Time</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            Number of PRs created by time period
                          </p>
                        </div>

                        {/* Time Period Filter */}
                        <div className="pt-4 border-t">
                          <Label className="text-xs flex items-center gap-1 font-medium mb-2">
                            <Filter className="w-3 h-3" />
                            Time Period
                          </Label>
                          <DateFilterControl 
                            filter={totalPRsFilter}
                            onFilterChange={setTotalPRsFilter}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {(() => {
                          // Apply date filter to PRs
                          const filteredPRs = filterByDateRange(prs, totalPRsFilter, "createdAt");

                          // Group PRs by time period
                          const groupedData = groupByTimePeriod(filteredPRs, totalPRsFilter, "createdAt");

                          // Convert to chart data with PR type breakdown
                          const chartData = Object.entries(groupedData).map(([period, prsInPeriod]) => {
                            const newSetCount = prsInPeriod.filter((pr: PR) => pr.prType === "New Set").length;
                            const modificationCount = prsInPeriod.filter((pr: PR) => pr.prType === "Modification").length;
                            const refurbishedCount = prsInPeriod.filter((pr: PR) => pr.prType === "Refurbished").length;

                            return {
                              period,
                              "New Set": newSetCount,
                              "Modification": modificationCount,
                              "Refurbished": refurbishedCount,
                              total: newSetCount + modificationCount + refurbishedCount,
                            };
                          });

                          // Sort by time period
                          const sortedKeys = sortTimePeriodKeys(Object.keys(groupedData), totalPRsFilter.type);
                          const sortedChartData = sortedKeys.map(key => 
                            chartData.find(d => d.period === key)!
                          ).filter(Boolean);

                          const COLORS = {
                            newPR: "#8b5cf6",
                            modification: "#f59e0b",
                            refurbished: "#10b981",
                          };

                          return sortedChartData.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                              <p>No PRs created in selected time period.</p>
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height={350}>
                              <LineChart data={sortedChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis 
                                  dataKey="period" 
                                  stroke="#64748b"
                                  tick={{ fontSize: 11 }}
                                />
                                <YAxis 
                                  stroke="#64748b"
                                  allowDecimals={false}
                                />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #e2e8f0",
                                    borderRadius: "8px",
                                  }}
                                />
                                <Legend />
                                <Line 
                                  type="monotone" 
                                  dataKey="New Set" 
                                  stroke={COLORS.newPR} 
                                  strokeWidth={2}
                                  dot={{ fill: COLORS.newPR, r: 4 }}
                                  activeDot={{ r: 6 }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="Modification" 
                                  stroke={COLORS.modification} 
                                  strokeWidth={2}
                                  dot={{ fill: COLORS.modification, r: 4 }}
                                  activeDot={{ r: 6 }}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="Refurbished" 
                                  stroke={COLORS.refurbished} 
                                  strokeWidth={2}
                                  dot={{ fill: COLORS.refurbished, r: 4 }}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </CardContent>
                    </Card>
                    </div>
                    {/* End of Amount Analysis and Total PRs Grid */}
                  </div>
                </div>
              </div>
              </>
            );
          })()}

          {/* Quick Stats for other roles */}
          {userRole !== "Approver" && (
            <>
            {userRole === "NPD" ? (
              <NPDDashboard prs={prs} getRoleGradient={getRoleGradient} userRole={userRole} />
            ) : userRole === "Spares" ? (
              <SparesDashboard 
                inventory={inventory}
                sparesRequests={sparesRequests}
                prs={prs}
                getRoleGradient={getRoleGradient}
                userRole={userRole}
              />
            ) : userRole === "Maintenance" ? (
              /* Comprehensive Maintenance Dashboard */
              (() => {
                // Calculate KPIs
                const totalHandovers = handovers.length;
                const pendingInspections = handovers.filter(h => h.status === "Pending Inspection").length;
                const approvedHandovers = handovers.filter(h => h.status === "Approved").length;
                const rejectedHandovers = handovers.filter(h => h.status === "Rejected").length;
                const approvalRate = totalHandovers > 0 ? ((approvedHandovers / totalHandovers) * 100).toFixed(1) : "0";
                const rejectionRate = totalHandovers > 0 ? ((rejectedHandovers / totalHandovers) * 100).toFixed(1) : "0";
                
                // Total critical spares across all handovers
                const totalCriticalSpares = handovers.reduce((sum, h) => sum + h.criticalSpares.length, 0);
                
                // Average critical spares per handover
                const avgCriticalSpares = totalHandovers > 0 ? (totalCriticalSpares / totalHandovers).toFixed(1) : "0";
                
                // Count handovers by PR type
                const newSetHandovers = handovers.filter(h => {
                  const pr = prs.find(p => p.id === h.prId);
                  return pr?.prType === "New Set";
                }).length;
                
                const modifiedHandovers = handovers.filter(h => {
                  const pr = prs.find(p => p.id === h.prId);
                  return pr?.prType === "Modification";
                }).length;
                
                const refurbishedHandovers = handovers.filter(h => {
                  const pr = prs.find(p => p.id === h.prId);
                  return pr?.prType === "Refurbished";
                }).length;
                
                // Recent activity (last 5 handovers)
                const recentHandovers = [...handovers]
                  .sort((a, b) => {
                    const dateA = a.inspectionDate || a.id;
                    const dateB = b.inspectionDate || b.id;
                    return dateB.localeCompare(dateA);
                  })
                  .slice(0, 5);

                // Status distribution data for chart
                const statusData = [
                  { name: "Pending", value: pendingInspections, color: "#eab308" },
                  { name: "Approved", value: approvedHandovers, color: "#22c55e" },
                  { name: "Rejected", value: rejectedHandovers, color: "#ef4444" }
                ];

                // Generate spares type chart data based on filter
                const getSparesChartData = () => {
                  const { type, month, year, startDate, endDate } = sparesChartFilter;
                  
                  // Filter handovers by date
                  let filteredHandovers = handovers.filter(h => {
                    if (!h.inspectionDate) return false;
                    const handoverDate = new Date(h.inspectionDate);
                    
                    if (type === "month" && month) {
                      const [filterYear, filterMonth] = month.split("-");
                      return handoverDate.getFullYear() === parseInt(filterYear) && 
                             handoverDate.getMonth() === parseInt(filterMonth) - 1;
                    } else if (type === "year" && year) {
                      return handoverDate.getFullYear() === parseInt(year);
                    } else if (type === "custom" && startDate && endDate) {
                      const start = new Date(startDate);
                      const end = new Date(endDate);
                      return handoverDate >= start && handoverDate <= end;
                    }
                    return false;
                  });

                  // Group by date based on filter type
                  const dataMap = new Map<string, { newSet: number; modified: number; refurbished: number }>();

                  filteredHandovers.forEach(h => {
                    if (!h.inspectionDate) return;
                    const pr = prs.find(p => p.id === h.prId);
                    const handoverDate = new Date(h.inspectionDate);
                    
                    let key = "";
                    if (type === "month") {
                      // Group by day of month
                      key = `Day ${handoverDate.getDate()}`;
                    } else if (type === "year") {
                      // Group by month
                      key = handoverDate.toLocaleDateString("en-US", { month: "short" });
                    } else {
                      // Group by date
                      key = handoverDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    }

                    if (!dataMap.has(key)) {
                      dataMap.set(key, { newSet: 0, modified: 0, refurbished: 0 });
                    }

                    const data = dataMap.get(key)!;
                    if (pr?.prType === "New Set") data.newSet++;
                    else if (pr?.prType === "Modification") data.modified++;
                    else if (pr?.prType === "Refurbished") data.refurbished++;
                  });

                  // Convert to array and sort
                  const chartData = Array.from(dataMap.entries()).map(([key, values]) => ({
                    period: key,
                    "New Set": values.newSet,
                    "Modified": values.modified,
                    "Refurbished": values.refurbished,
                  }));

                  // Sort by period
                  if (type === "month") {
                    chartData.sort((a, b) => {
                      const dayA = parseInt(a.period.replace("Day ", ""));
                      const dayB = parseInt(b.period.replace("Day ", ""));
                      return dayA - dayB;
                    });
                  } else if (type === "year") {
                    const monthOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    chartData.sort((a, b) => monthOrder.indexOf(a.period) - monthOrder.indexOf(b.period));
                  }

                  return chartData;
                };

                const sparesTypeChartData = getSparesChartData();

                // Generate inspection status pie chart data based on filter
                const getInspectionStatusData = () => {
                  const filteredHandovers = filterByDateRange(handovers, sparesChartFilter, "inspectionDate");
                  
                  const approved = filteredHandovers.filter(h => h.status === "Approved").length;
                  const rejected = filteredHandovers.filter(h => h.status === "Rejected").length;
                  const pending = filteredHandovers.filter(h => h.status === "Pending Inspection").length;
                  
                  return [
                    { name: "Approved", value: approved, color: "#22c55e" },
                    { name: "Rejected", value: rejected, color: "#ef4444" },
                    { name: "Pending", value: pending, color: "#eab308" },
                  ].filter(item => item.value > 0); // Only show non-zero slices
                };

                const inspectionStatusData = getInspectionStatusData();

                return (
                  <div className="overflow-y-auto flex-1 scrollbar-smart">
                    {/* Header - Sticky */}
                    <div className="sticky top-0 z-30 bg-gradient-to-br from-slate-50 to-slate-100 px-4 pt-2 pb-1.5 border-b border-slate-200/60 shadow-sm">
                      <div className="mb-1.5">
                        <h1 className="mb-0.5 text-sm font-bold leading-tight">Tool Maintenance Dashboard</h1>
                        <p className="text-[9px] text-muted-foreground flex items-center gap-1 leading-tight">
                          Welcome, <span className={`font-semibold bg-gradient-to-r ${getRoleGradient()} bg-clip-text text-transparent`}>{userRole} Team</span>
                        </p>
                      </div>

                      {/* All KPI Metrics - 4 per row (Circular) */}
                      <div className="grid grid-cols-4 gap-2 mb-3 px-1">
                        {/* Total Handovers */}
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-50 to-teal-100 border-3 border-cyan-200 shadow-md flex flex-col items-center justify-center">
                              <div className="absolute -top-0.5 -right-0.5 p-1.5 bg-cyan-500 rounded-full shadow-sm">
                                <Wrench className="w-3 h-3 text-white" />
                              </div>
                              <div className="text-2xl font-bold text-cyan-600">
                                {totalHandovers}
                              </div>
                              <p className="text-[10px] font-semibold text-cyan-900 mt-0.5">Total</p>
                              <p className="text-[9px] text-cyan-600/70">Handovers</p>
                            </div>
                          </div>
                        </div>

                        {/* Pending Inspections */}
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-yellow-50 to-amber-100 border-3 border-yellow-200 shadow-md flex flex-col items-center justify-center">
                              <div className="absolute -top-0.5 -right-0.5 p-1.5 bg-yellow-500 rounded-full shadow-sm">
                                <Activity className="w-3 h-3 text-white" />
                              </div>
                              <div className="text-2xl font-bold text-yellow-600">
                                {pendingInspections}
                              </div>
                              <p className="text-[10px] font-semibold text-yellow-900 mt-0.5">Pending</p>
                              <p className="text-[9px] text-yellow-600/70">Inspections</p>
                            </div>
                          </div>
                        </div>

                        {/* Approved */}
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-50 to-emerald-100 border-3 border-green-200 shadow-md flex flex-col items-center justify-center">
                              <div className="absolute -top-0.5 -right-0.5 p-1.5 bg-green-500 rounded-full shadow-sm">
                                <TrendingUp className="w-3 h-3 text-white" />
                              </div>
                              <div className="text-2xl font-bold text-green-600">
                                {approvedHandovers}
                              </div>
                              <p className="text-[10px] font-semibold text-green-900 mt-0.5">Approved</p>
                              <p className="text-[9px] text-green-600/70">{approvalRate}%</p>
                            </div>
                          </div>
                        </div>

                        {/* Rejected */}
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-red-50 to-rose-100 border-3 border-red-200 shadow-md flex flex-col items-center justify-center">
                              <div className="absolute -top-0.5 -right-0.5 p-1.5 bg-red-500 rounded-full shadow-sm">
                                <TrendingDown className="w-3 h-3 text-white" />
                              </div>
                              <div className="text-2xl font-bold text-red-600">
                                {rejectedHandovers}
                              </div>
                              <p className="text-[10px] font-semibold text-red-900 mt-0.5">Rejected</p>
                              <p className="text-[9px] text-red-600/70">{rejectionRate}%</p>
                            </div>
                          </div>
                        </div>

                        {/* Total Critical Spares - Rounded Square */}
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 border-3 border-blue-200 shadow-md flex flex-col items-center justify-center">
                              <div className="absolute -top-1 -right-1 p-1.5 bg-blue-500 rounded-lg shadow-sm">
                                <Package className="w-3 h-3 text-white" />
                              </div>
                              <div className="text-2xl font-bold text-blue-600">
                                {totalCriticalSpares}
                              </div>
                              <p className="text-[10px] font-semibold text-blue-900 mt-0.5">Critical</p>
                              <p className="text-[9px] text-blue-600/70">Spares</p>
                            </div>
                          </div>
                        </div>

                        {/* New Set - Rounded Square */}
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-100 border-3 border-purple-200 shadow-md flex flex-col items-center justify-center">
                              <div className="absolute -top-1 -right-1 p-1.5 bg-purple-500 rounded-lg shadow-sm">
                                <Wrench className="w-3 h-3 text-white" />
                              </div>
                              <div className="text-2xl font-bold text-purple-600">
                                {newSetHandovers}
                              </div>
                              <p className="text-[10px] font-semibold text-purple-900 mt-0.5">New Set</p>
                              <p className="text-[9px] text-purple-600/70">Handovers</p>
                            </div>
                          </div>
                        </div>

                        {/* Modified Spares - Rounded Square */}
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 border-3 border-amber-200 shadow-md flex flex-col items-center justify-center">
                              <div className="absolute -top-1 -right-1 p-1.5 bg-amber-500 rounded-lg shadow-sm">
                                <SettingsIcon className="w-3 h-3 text-white" />
                              </div>
                              <div className="text-2xl font-bold text-amber-600">
                                {modifiedHandovers}
                              </div>
                              <p className="text-[10px] font-semibold text-amber-900 mt-0.5">Modified</p>
                              <p className="text-[9px] text-amber-600/70">Handovers</p>
                            </div>
                          </div>
                        </div>

                        {/* Refurbished Spares - Rounded Square */}
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-100 border-3 border-emerald-200 shadow-md flex flex-col items-center justify-center">
                              <div className="absolute -top-1 -right-1 p-1.5 bg-emerald-500 rounded-lg shadow-sm">
                                <RefreshCw className="w-3 h-3 text-white" />
                              </div>
                              <div className="text-2xl font-bold text-emerald-600">
                                {refurbishedHandovers}
                              </div>
                              <p className="text-[10px] font-semibold text-emerald-900 mt-0.5">Refurbished</p>
                              <p className="text-[9px] text-emerald-600/70">Handovers</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Charts and Tables Section */}
                    <div className="p-4 space-y-4">
                      {/* Charts Row */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Spares Type Distribution Chart */}
                        <Card className="border-0 shadow-lg">
                          <CardHeader className="pb-2 pt-3 px-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-purple-600" />
                                  Spares Type Distribution
                                </CardTitle>
                                <CardDescription className="text-xs">New, Modified & Refurbished</CardDescription>
                              </div>
                            </div>
                            
                            {/* Filter Controls */}
                            <DateFilterControl 
                              filter={sparesChartFilter}
                              onFilterChange={setSparesChartFilter}
                              compact
                            />
                          </CardHeader>
                          <CardContent className="px-4 pb-3">
                            {sparesTypeChartData.length === 0 ? (
                              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-xs">
                                <div className="text-center">
                                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p>No data available for selected period</p>
                                </div>
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={sparesTypeChartData}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                                  <YAxis tick={{ fontSize: 11 }} />
                                  <Tooltip 
                                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                                  <Bar dataKey="New Set" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                  <Bar dataKey="Modified" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                  <Bar dataKey="Refurbished" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            )}
                          </CardContent>
                        </Card>

                        {/* Inspection Status Distribution */}
                        <Card className="border-0 shadow-lg">
                          <CardHeader className="pb-2 pt-3 px-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                  Inspection Status Distribution
                                </CardTitle>
                                <CardDescription className="text-xs">Approved, Rejected & Pending</CardDescription>
                              </div>
                            </div>
                            <DateFilterControl 
                              filter={sparesChartFilter}
                              onFilterChange={setSparesChartFilter}
                              compact
                            />
                          </CardHeader>
                          <CardContent className="px-4 pb-3">
                            {inspectionStatusData.length === 0 ? (
                              <div className="flex items-center justify-center h-[200px] text-muted-foreground text-xs">
                                <div className="text-center">
                                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                  <p>No data available for selected period</p>
                                </div>
                              </div>
                            ) : (
                              <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                  <Pie
                                    data={inspectionStatusData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={70}
                                    fill="#8884d8"
                                    dataKey="value"
                                  >
                                    {inspectionStatusData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                                  />
                                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                                </PieChart>
                              </ResponsiveContainer>
                            )}
                          </CardContent>
                        </Card>
                      </div>

                      {/* Recent Activity Table */}
                      <Card className="border-0 shadow-lg">
                        <CardHeader className="pb-2 pt-3 px-4">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Recent Handover Activity
                          </CardTitle>
                          <CardDescription className="text-xs">Latest 5 tool handovers</CardDescription>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                          <div className="space-y-2">
                            {recentHandovers.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground text-sm">
                                <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No handover activity yet</p>
                              </div>
                            ) : (
                              recentHandovers.map((handover) => {
                                const project = projects.find(p => p.id === handover.projectId);
                                const pr = prs.find(pr => pr.id === handover.prId);
                                const statusColor = 
                                  handover.status === "Approved" ? "bg-green-100 text-green-700 border-green-200" :
                                  handover.status === "Rejected" ? "bg-red-100 text-red-700 border-red-200" :
                                  "bg-yellow-100 text-yellow-700 border-yellow-200";

                                return (
                                  <div key={handover.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-slate-900 truncate">{handover.prId}</p>
                                        <Badge className={`text-[10px] px-2 py-0 border ${statusColor}`}>
                                          {handover.status}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-0.5">
                                        {project?.customerPO || 'N/A'} • {pr?.prType || 'N/A'} • {handover.criticalSpares.length} spares
                                      </p>
                                      {handover.inspectedBy && (
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                          Inspected by {handover.inspectedBy} • {handover.inspectionDate ? new Date(handover.inspectionDate).toLocaleDateString() : 'N/A'}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                );
              })()
            ) : (
            <div className="overflow-y-auto flex-1 scrollbar-smart">
              <div className="p-8">
              <div className="mb-6">
                <h1 className="mb-2 text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  Welcome, <span className={`font-semibold bg-gradient-to-r ${getRoleGradient()} bg-clip-text text-transparent`}>{userRole} Team</span>
                </p>
              </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {userRole === "NPD" && (
                <></>
              )}
              {userRole === "Maintenance" && (
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-cyan-50 to-teal-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-cyan-900">
                      <div className="p-2 bg-cyan-100 rounded-lg">
                        <Wrench className="w-4 h-4 text-cyan-600" />
                      </div>
                      Pending Inspections
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-cyan-600">
                      {handovers.filter(h => h.status === "Pending Inspection").length}
                    </div>
                    <p className="text-xs text-cyan-600/70 mt-1">Tools to inspect</p>
                  </CardContent>
                </Card>
              )}
              {userRole === "Spares" && (
                <>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-red-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-900">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Database className="w-4 h-4 text-orange-600" />
                        </div>
                        Low Stock Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">
                        {inventory.filter(item => item.status === "Low Stock").length}
                      </div>
                      <p className="text-xs text-orange-600/70 mt-1">Needs reordering</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-teal-50 to-emerald-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-teal-900">
                        <div className="p-2 bg-teal-100 rounded-lg">
                          <FileText className="w-4 h-4 text-teal-600" />
                        </div>
                        Pending Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-teal-600">
                        {sparesRequests.filter(req => req.status === "Pending").length}
                      </div>
                      <p className="text-xs text-teal-600/70 mt-1">To be fulfilled</p>
                    </CardContent>
                  </Card>
                </>
              )}
              {userRole === "Indentor" && (
                <>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-rose-50 to-orange-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-rose-900">
                        <div className="p-2 bg-rose-100 rounded-lg">
                          <FileText className="w-4 h-4 text-rose-600" />
                        </div>
                        My Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-rose-600">
                        {sparesRequests.length}
                      </div>
                      <p className="text-xs text-rose-600/70 mt-1">Total spares requests</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-orange-50 to-amber-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-900">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                        Pending Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">
                        {sparesRequests.filter(req => req.status === "Pending").length}
                      </div>
                      <p className="text-xs text-orange-600/70 mt-1">Awaiting fulfillment</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-emerald-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-900">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Package className="w-4 h-4 text-green-600" />
                        </div>
                        Fulfilled Requests
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {sparesRequests.filter(req => req.status === "Fulfilled").length}
                      </div>
                      <p className="text-xs text-green-600/70 mt-1">Successfully completed</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-red-50 to-rose-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-900">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        </div>
                        Low Stock Alert
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-red-600">
                        {inventory.filter(item => item.status === "Low Stock" || item.status === "Out of Stock").length}
                      </div>
                      <p className="text-xs text-red-600/70 mt-1">Items need attention</p>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
            
            {/* Indentor Graphs and Recent Activities */}
            {userRole === "Indentor" && (
              <div className="px-8 pb-8 mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Request Status Distribution Pie Chart */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4 text-rose-600" />
                      Request Status Distribution
                    </CardTitle>
                    <CardDescription className="text-xs">Breakdown of all your spares requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const statusData = [
                        { name: "Pending", value: sparesRequests.filter(r => r.status === "Pending").length, fill: "#f97316" },
                        { name: "Fulfilled", value: sparesRequests.filter(r => r.status === "Fulfilled").length, fill: "#10b981" },
                        { name: "Partially Fulfilled", value: sparesRequests.filter(r => r.status === "Partially Fulfilled").length, fill: "#f59e0b" },
                        { name: "Rejected", value: sparesRequests.filter(r => r.status === "Rejected").length, fill: "#ef4444" },
                      ];
                      
                      return (
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                              data={statusData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Fulfillment Rate */}
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      Fulfillment Rate
                    </CardTitle>
                    <CardDescription className="text-xs">Track your request fulfillment success</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const totalRequests = sparesRequests.length;
                      const fulfilledCount = sparesRequests.filter(r => r.status === "Fulfilled").length;
                      const partialCount = sparesRequests.filter(r => r.status === "Partially Fulfilled").length;
                      const pendingCount = sparesRequests.filter(r => r.status === "Pending").length;
                      const rejectedCount = sparesRequests.filter(r => r.status === "Rejected").length;
                      
                      const fulfillmentRate = totalRequests > 0 ? ((fulfilledCount / totalRequests) * 100).toFixed(1) : "0.0";
                      const partialRate = totalRequests > 0 ? ((partialCount / totalRequests) * 100).toFixed(1) : "0.0";
                      
                      return (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                              <div className="text-3xl font-bold text-green-600">{fulfillmentRate}%</div>
                              <p className="text-xs text-green-700 mt-1">Fully Fulfilled</p>
                              <p className="text-xs text-green-600/70 mt-0.5">{fulfilledCount} of {totalRequests}</p>
                            </div>
                            <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                              <div className="text-3xl font-bold text-amber-600">{partialRate}%</div>
                              <p className="text-xs text-amber-700 mt-1">Partially Fulfilled</p>
                              <p className="text-xs text-amber-600/70 mt-0.5">{partialCount} of {totalRequests}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <Clock className="w-8 h-8 text-orange-600" />
                              <div>
                                <div className="text-xl font-bold text-orange-600">{pendingCount}</div>
                                <p className="text-xs text-orange-700">Pending</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                              <AlertTriangle className="w-8 h-8 text-red-600" />
                              <div>
                                <div className="text-xl font-bold text-red-600">{rejectedCount}</div>
                                <p className="text-xs text-red-700">Rejected</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Recent Requests Activity */}
                <Card className="border-0 shadow-lg lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-rose-600" />
                      Recent Requests
                    </CardTitle>
                    <CardDescription className="text-xs">Latest 5 spares requests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(() => {
                        const recentRequests = sparesRequests
                          .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
                          .slice(0, 5);
                        
                        if (recentRequests.length === 0) {
                          return (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No requests submitted yet</p>
                              <p className="text-xs mt-1">Go to Inventory tab to request spares</p>
                            </div>
                          );
                        }
                        
                        return recentRequests.map((request) => {
                          const statusConfig = {
                            Pending: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
                            Fulfilled: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
                            "Partially Fulfilled": { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200" },
                            Rejected: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
                          };
                          
                          const config = statusConfig[request.status];
                          
                          return (
                            <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{request.id}</p>
                                  <Badge className={`text-[10px] px-2 py-0 border ${config.bg} ${config.text} ${config.border}`}>
                                    {request.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  {request.itemName} • {request.partNumber}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  Requested: {request.quantityRequested} units • Fulfilled: {request.quantityFulfilled} units • {new Date(request.requestDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Low Stock Items Alert */}
                <Card className="border-0 shadow-lg lg:col-span-2 bg-gradient-to-br from-red-50 to-rose-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-red-900">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Low Stock Items - Plan Ahead
                    </CardTitle>
                    <CardDescription className="text-xs text-red-700">These items are running low - consider alternative options</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(() => {
                        const lowStockItems = inventory
                          .filter(item => item.status === "Low Stock" || item.status === "Out of Stock")
                          .slice(0, 5);
                        
                        if (lowStockItems.length === 0) {
                          return (
                            <div className="text-center py-6 text-muted-foreground text-sm">
                              <Package className="w-8 h-8 mx-auto mb-2 opacity-50 text-green-600" />
                              <p className="text-green-700 font-semibold">All items are well stocked!</p>
                            </div>
                          );
                        }
                        
                        return lowStockItems.map((item) => {
                          const stockPercentage = item.minStockLevel > 0 ? (item.stockLevel / item.minStockLevel) * 100 : 0;
                          const isOutOfStock = item.status === "Out of Stock";
                          
                          return (
                            <div key={`${item.partNumber}-${item.toolNumber}`} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-white">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                                  <Badge className={`text-[10px] px-2 py-0 border ${isOutOfStock ? 'bg-red-100 text-red-700 border-red-300' : 'bg-orange-100 text-orange-700 border-orange-300'}`}>
                                    {item.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  {item.partNumber} • {item.toolNumber}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 bg-slate-200 rounded-full h-2 max-w-[200px]">
                                    <div 
                                      className={`h-2 rounded-full ${isOutOfStock ? 'bg-red-600' : 'bg-orange-600'}`}
                                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-semibold text-slate-700">
                                    {item.stockLevel} / {item.minStockLevel}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          </div>
            )}
            </>
          )} 
        </>
      )}

      {/* Content based on active tab */}
      {activeTab === "projects" && (
        <ProjectList
          projects={projects}
          setProjects={setProjects}
          userRole={userRole}
          prs={prs}
        />
      )}

      {activeTab === "prs" && (
        <PRList
          prs={prs}
          setPRs={setPRs}
          projects={projects}
          userRole={userRole}
          suppliers={suppliers.filter(s => s.status === "Active").map(s => ({ id: s.id, name: s.name, status: s.status }))}
          openCreatePRDirectly={openCreatePR}
          onCreatePRClose={() => setOpenCreatePR(false)}
        />
      )}

      {activeTab === "reports" && (
        <Reports
          projects={projects}
          prs={prs}
          handovers={handovers}
          inventory={inventory}
          userRole={userRole}
        />
      )}

      {activeTab === "quotations" && (
        <QuotationManagement
          prs={prs}
          setPRs={setPRs}
          projects={projects}
          currentUserRole={userRole}
        />
      )}

      {activeTab === "suppliers" && (
        <SupplierManagement
          suppliers={suppliers}
          setSuppliers={setSuppliers}
          userRole={userRole as "Approver" | "NPD"}
          prs={prs}
          projects={projects}
        />
      )}

      {activeTab === "handovers" && (
        <>
          {inspectionHandover ? (
            <ToolHandoverInspection
              handover={inspectionHandover}
              onBack={() => setInspectionHandover(null)}
              onApprove={handleInspectionApprove}
              onReject={handleInspectionReject}
              projects={projects}
              prs={prs}
              userRole={userRole}
            />
          ) : (
            <ToolHandover
              handovers={handovers}
              setHandovers={handleHandoverUpdate}
              projects={projects}
              prs={prs}
              inventory={inventory}
              setInventory={setInventory}
              onNavigateToInspection={handleNavigateToInspection}
              userRole={userRole}
            />
          )}
        </>
      )}

      {activeTab === "inventory" && (
        <SparesInventory
          inventory={inventory}
          setInventory={setInventory}
          sparesRequests={sparesRequests}
          setSparesRequests={setSparesRequests}
          userRole={userRole}
          projects={projects}
          onNavigateToPR={() => {
            setOpenCreatePR(true);
            onTabChange("prs");
          }}
        />
      )}

      {activeTab === "requests" && (
        <SparesRequests
          sparesRequests={sparesRequests}
          setSparesRequests={setSparesRequests}
          userRole={userRole}
          inventory={inventory}
          setInventory={setInventory}
        />
      )}

      {(activeTab === "settings" || activeTab.startsWith("settings-")) && (
        <Settings userRole={userRole} activeSection={activeTab} />
      )}
    </div>
  );
}
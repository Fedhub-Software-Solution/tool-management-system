import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { GeneratedReportTable } from "./GeneratedReportTable";
import type { Project, PR, ToolHandoverRecord, InventoryItem } from "./Dashboard";
import { bomDatabase } from "./bomDatabase";
import { 
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Wrench,
  Database,
  Activity,
  Layers,
  Edit,
  Filter,
  CalendarIcon,
  Settings,
  X,
  Award
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from "date-fns";

interface ReportsProps {
  projects: Project[];
  prs: PR[];
  handovers: ToolHandoverRecord[];
  inventory: InventoryItem[];
  userRole: "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";
}

const COLORS = ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#06b6d4'];

type ReportType = "summary" | "projects" | "prs" | "handovers" | "inventory" | "budget";

interface ReportFilters {
  reportType: ReportType;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  status: string;
  prType: string;
  partNumber: string;
  includeCharts: boolean;
  selectedFields: string[];
}

export function Reports({ projects, prs, handovers, inventory, userRole }: ReportsProps) {
  const [showDynamicBuilder, setShowDynamicBuilder] = useState(false);
  const [showGeneratedReport, setShowGeneratedReport] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    reportType: "summary",
    dateFrom: undefined,
    dateTo: undefined,
    status: "all",
    prType: "all",
    partNumber: "all",
    includeCharts: true,
    selectedFields: [],
  });

  // Time period filters for each chart (Month and Year filters)
  const [prTypeFilter, setPRTypeFilter] = useState<{ month: string; year: string }>({ month: 'all', year: 'all' });
  const [statusFilter, setStatusFilter] = useState<{ month: string; year: string }>({ month: 'all', year: 'all' });
  const [budgetFilter, setBudgetFilter] = useState<{ month: string; year: string }>({ month: 'all', year: 'all' });
  const [inventoryFilter, setInventoryFilter] = useState<{ month: string; year: string }>({ month: 'all', year: 'all' });
  const [bomFilter, setBOMFilter] = useState<{ month: string; year: string }>({ month: 'all', year: 'all' });

  // Custom date range filters for NPD reports
  const [prTypeCustomDateFrom, setPRTypeCustomDateFrom] = useState<Date | undefined>(undefined);
  const [prTypeCustomDateTo, setPRTypeCustomDateTo] = useState<Date | undefined>(undefined);
  const [statusCustomDateFrom, setStatusCustomDateFrom] = useState<Date | undefined>(undefined);
  const [statusCustomDateTo, setStatusCustomDateTo] = useState<Date | undefined>(undefined);
  const [bomCustomDateFrom, setBOMCustomDateFrom] = useState<Date | undefined>(undefined);
  const [bomCustomDateTo, setBOMCustomDateTo] = useState<Date | undefined>(undefined);

  // Helper function to get available years
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= 1990; year--) {
      years.push(year);
    }
    return years;
  };

  const availableYears = getAvailableYears();

  // Helper function to filter data by month and year
  const filterByMonthYear = <T extends { createdAt: string }>(
    data: T[],
    filter: { month: string; year: string }
  ): T[] => {
    return data.filter(item => {
      const itemDate = new Date(item.createdAt);
      const matchMonth = filter.month === 'all' || itemDate.getMonth() === parseInt(filter.month);
      const matchYear = filter.year === 'all' || itemDate.getFullYear() === parseInt(filter.year);
      return matchMonth && matchYear;
    });
  };

  // Helper function for inventory filtering (uses different date field)
  const filterInventoryByMonthYear = (
    data: InventoryItem[],
    filter: { month: string; year: string }
  ): InventoryItem[] => {
    // For inventory, we'll filter based on last updated or current status
    // Since inventory doesn't have createdAt, we'll return all for now
    // In a real app, you'd have a lastUpdated field
    return data;
  };

  // Helper function to filter by custom date range
  const filterByCustomDateRange = <T extends { createdAt: string }>(
    data: T[],
    dateFrom: Date | undefined,
    dateTo: Date | undefined
  ): T[] => {
    if (!dateFrom && !dateTo) return data;
    
    return data.filter(item => {
      const itemDate = new Date(item.createdAt);
      if (dateFrom && itemDate < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (itemDate > endOfDay) return false;
      }
      return true;
    });
  };

  // Get available fields based on report type
  const getAvailableFields = (reportType: ReportType) => {
    switch (reportType) {
      case "projects":
        return ["Project ID", "Customer PO", "Part Number", "Tool Number", "Price", "Target Date", "Status", "Created By", "Created At"];
      case "prs":
        return ["PR ID", "Project ID", "PR Type", "Items Count", "Suppliers", "Status", "Created By", "Created At", "Budget"];
      case "handovers":
        return ["Handover ID", "Project ID", "PR ID", "Tool Set", "Spares Count", "Status", "Inspected By", "Inspection Date"];
      case "inventory":
        return ["Part Number", "Tool Number", "Name", "Quantity", "Stock Level", "Min Stock Level", "Status"];
      case "budget":
        return ["Category", "Planned Budget", "Actual Budget", "Variance", "Variance %"];
      default:
        return [];
    }
  };

  // Initialize selected fields when report type changes
  const handleReportTypeChange = (type: ReportType) => {
    setFilters({
      ...filters,
      reportType: type,
      selectedFields: getAvailableFields(type), // Select all by default
    });
  };

  // Filter data based on selected criteria
  const getFilteredData = () => {
    let filteredProjects = [...projects];
    let filteredPRs = [...prs];
    let filteredHandovers = [...handovers];
    let filteredInventory = [...inventory];

    // Date filtering
    if (filters.dateFrom) {
      const fromDate = filters.dateFrom.getTime();
      filteredProjects = filteredProjects.filter(p => new Date(p.createdAt).getTime() >= fromDate);
      filteredPRs = filteredPRs.filter(pr => new Date(pr.createdAt).getTime() >= fromDate);
      filteredHandovers = filteredHandovers.filter(h => h.inspectionDate ? new Date(h.inspectionDate).getTime() >= fromDate : true);
    }

    if (filters.dateTo) {
      const toDate = filters.dateTo.getTime();
      filteredProjects = filteredProjects.filter(p => new Date(p.createdAt).getTime() <= toDate);
      filteredPRs = filteredPRs.filter(pr => new Date(pr.createdAt).getTime() <= toDate);
      filteredHandovers = filteredHandovers.filter(h => h.inspectionDate ? new Date(h.inspectionDate).getTime() <= toDate : true);
    }

    // Status filtering
    if (filters.status !== "all") {
      filteredProjects = filteredProjects.filter(p => p.status === filters.status);
      filteredPRs = filteredPRs.filter(pr => pr.status === filters.status);
      filteredHandovers = filteredHandovers.filter(h => h.status === filters.status);
      filteredInventory = filteredInventory.filter(i => i.status === filters.status);
    }

    // PR Type filtering
    if (filters.prType !== "all") {
      filteredPRs = filteredPRs.filter(pr => pr.prType === filters.prType);
    }

    // Part Number filtering
    if (filters.partNumber !== "all") {
      filteredProjects = filteredProjects.filter(p => p.partNumber === filters.partNumber);
      filteredInventory = filteredInventory.filter(i => i.partNumber === filters.partNumber);
    }

    return { filteredProjects, filteredPRs, filteredHandovers, filteredInventory };
  };

  // Export dynamic report to Excel
  const exportDynamicToExcel = () => {
    const { filteredProjects, filteredPRs, filteredHandovers, filteredInventory } = getFilteredData();
    const wb = XLSX.utils.book_new();

    // Add filter information sheet
    const filterInfo = [
      ["Dynamic Report - Filters Applied"],
      ["Report Type:", filters.reportType],
      ["Date From:", filters.dateFrom ? format(filters.dateFrom, "PPP") : "Not set"],
      ["Date To:", filters.dateTo ? format(filters.dateTo, "PPP") : "Not set"],
      ["Status Filter:", filters.status],
      ["PR Type Filter:", filters.prType],
      ["Part Number Filter:", filters.partNumber],
      ["Generated on:", new Date().toLocaleString()],
      [],
    ];
    const filterWS = XLSX.utils.aoa_to_sheet(filterInfo);
    XLSX.utils.book_append_sheet(wb, filterWS, "Filters");

    // Add data based on report type and selected fields
    switch (filters.reportType) {
      case "projects":
      case "summary":
        if (filters.reportType === "summary" || filters.reportType === "projects") {
          const projectsData = filteredProjects.map(p => {
            const row: any = {};
            if (filters.selectedFields.includes("Project ID")) row["Project ID"] = p.id;
            if (filters.selectedFields.includes("Customer PO")) row["Customer PO"] = p.customerPO;
            if (filters.selectedFields.includes("Part Number")) row["Part Number"] = p.partNumber;
            if (filters.selectedFields.includes("Tool Number")) row["Tool Number"] = p.toolNumber;
            if (filters.selectedFields.includes("Price")) row["Price"] = p.price;
            if (filters.selectedFields.includes("Target Date")) row["Target Date"] = p.targetDate;
            if (filters.selectedFields.includes("Status")) row["Status"] = p.status;
            if (filters.selectedFields.includes("Created By")) row["Created By"] = p.createdBy;
            if (filters.selectedFields.includes("Created At")) row["Created At"] = new Date(p.createdAt).toLocaleString();
            return row;
          });
          const projectsWS = XLSX.utils.json_to_sheet(projectsData);
          XLSX.utils.book_append_sheet(wb, projectsWS, "Projects");
        }
        if (filters.reportType === "summary") {
          // Continue with other sheets for summary
        }
        break;

      case "prs":
        const prsData = filteredPRs.map(pr => {
          const row: any = {};
          if (filters.selectedFields.includes("PR ID")) row["PR ID"] = pr.id;
          if (filters.selectedFields.includes("Project ID")) row["Project ID"] = pr.projectId;
          if (filters.selectedFields.includes("PR Type")) row["PR Type"] = pr.prType;
          if (filters.selectedFields.includes("Items Count")) row["Items Count"] = pr.items.length;
          if (filters.selectedFields.includes("Suppliers")) row["Suppliers"] = pr.suppliers.join(", ");
          if (filters.selectedFields.includes("Status")) row["Status"] = pr.status;
          if (filters.selectedFields.includes("Created By")) row["Created By"] = pr.createdBy;
          if (filters.selectedFields.includes("Created At")) row["Created At"] = new Date(pr.createdAt).toLocaleString();
          if (filters.selectedFields.includes("Budget") && pr.quotations) {
            const awardedQuote = pr.quotations.find(q => q.status === "Selected" || q.supplier === pr.awardedSupplier);
            row["Budget"] = awardedQuote?.price || 0;
          }
          return row;
        });
        const prsWS = XLSX.utils.json_to_sheet(prsData);
        XLSX.utils.book_append_sheet(wb, prsWS, "Purchase Requisitions");
        break;

      case "handovers":
        const handoversData = filteredHandovers.map(h => {
          const row: any = {};
          if (filters.selectedFields.includes("Handover ID")) row["Handover ID"] = h.id;
          if (filters.selectedFields.includes("Project ID")) row["Project ID"] = h.projectId;
          if (filters.selectedFields.includes("PR ID")) row["PR ID"] = h.prId;
          if (filters.selectedFields.includes("Tool Set")) row["Tool Set"] = h.toolSet;
          if (filters.selectedFields.includes("Spares Count")) row["Spares Count"] = h.criticalSpares.length;
          if (filters.selectedFields.includes("Status")) row["Status"] = h.status;
          if (filters.selectedFields.includes("Inspected By")) row["Inspected By"] = h.inspectedBy || "N/A";
          if (filters.selectedFields.includes("Inspection Date")) row["Inspection Date"] = h.inspectionDate ? new Date(h.inspectionDate).toLocaleString() : "N/A";
          return row;
        });
        const handoversWS = XLSX.utils.json_to_sheet(handoversData);
        XLSX.utils.book_append_sheet(wb, handoversWS, "Tool Handovers");
        break;

      case "inventory":
        const inventoryData = filteredInventory.map(i => {
          const row: any = {};
          if (filters.selectedFields.includes("Part Number")) row["Part Number"] = i.partNumber;
          if (filters.selectedFields.includes("Tool Number")) row["Tool Number"] = i.toolNumber;
          if (filters.selectedFields.includes("Name")) row["Name"] = i.name;
          if (filters.selectedFields.includes("Quantity")) row["Quantity"] = i.quantity;
          if (filters.selectedFields.includes("Stock Level")) row["Stock Level"] = i.stockLevel;
          if (filters.selectedFields.includes("Min Stock Level")) row["Min Stock Level"] = i.minStockLevel;
          if (filters.selectedFields.includes("Status")) row["Status"] = i.status;
          return row;
        });
        const inventoryWS = XLSX.utils.json_to_sheet(inventoryData);
        XLSX.utils.book_append_sheet(wb, inventoryWS, "Inventory");
        break;

      case "budget":
        const budgetData: any[] = [];
        const totalPlanned = filteredProjects.reduce((sum, p) => sum + p.price, 0);
        const totalActual = filteredPRs.reduce((sum, pr) => {
          if (pr.status === "Awarded" && pr.quotations) {
            const quote = pr.quotations.find(q => q.status === "Selected" || q.supplier === pr.awardedSupplier);
            return sum + (quote?.price || 0);
          }
          return sum;
        }, 0);
        const variance = totalActual - totalPlanned;
        const variancePercent = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0;

        budgetData.push({
          "Category": "Overall",
          "Planned Budget": totalPlanned,
          "Actual Budget": totalActual,
          "Variance": variance,
          "Variance %": variancePercent.toFixed(2) + "%",
        });

        const budgetWS = XLSX.utils.json_to_sheet(budgetData);
        XLSX.utils.book_append_sheet(wb, budgetWS, "Budget Analysis");
        break;
    }

    XLSX.writeFile(wb, `Dynamic_Report_${filters.reportType}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export dynamic report to PDF
  const exportDynamicToPDF = () => {
    const { filteredProjects, filteredPRs, filteredHandovers, filteredInventory } = getFilteredData();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text("Dynamic Report", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Report Type: ${filters.reportType.toUpperCase()}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 36);
    
    let yPos = 45;

    // Filters applied
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Filters Applied:", 14, yPos);
    yPos += 5;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Filter', 'Value']],
      body: [
        ['Date From', filters.dateFrom ? format(filters.dateFrom, "PPP") : 'Not set'],
        ['Date To', filters.dateTo ? format(filters.dateTo, "PPP") : 'Not set'],
        ['Status', filters.status],
        ['PR Type', filters.prType],
        ['Part Number', filters.partNumber],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 14 },
      styles: { fontSize: 9 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Add data based on report type
    switch (filters.reportType) {
      case "projects":
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Projects Report", 14, yPos);
        yPos += 5;

        const projectColumns = filters.selectedFields;
        const projectRows = filteredProjects.map(p => {
          const row: any[] = [];
          if (projectColumns.includes("Project ID")) row.push(p.id);
          if (projectColumns.includes("Customer PO")) row.push(p.customerPO);
          if (projectColumns.includes("Part Number")) row.push(p.partNumber);
          if (projectColumns.includes("Status")) row.push(p.status);
          if (projectColumns.includes("Price")) row.push(`₹${p.price.toLocaleString()}`);
          return row;
        });

        autoTable(doc, {
          startY: yPos,
          head: [projectColumns.slice(0, 5)], // Limit columns for PDF width
          body: projectRows,
          theme: 'grid',
          headStyles: { fillColor: [139, 92, 246] },
          margin: { left: 14 },
          styles: { fontSize: 8 },
        });
        break;

      case "prs":
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Purchase Requisitions Report", 14, yPos);
        yPos += 5;

        const prRows = filteredPRs.map(pr => [
          pr.id,
          pr.prType,
          pr.status,
          pr.items.length.toString(),
          new Date(pr.createdAt).toLocaleDateString(),
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['PR ID', 'Type', 'Status', 'Items', 'Created']],
          body: prRows,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14 },
          styles: { fontSize: 8 },
        });
        break;

      case "handovers":
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Tool Handovers Report", 14, yPos);
        yPos += 5;

        const handoverRows = filteredHandovers.map(h => [
          h.id,
          h.toolSet,
          h.status,
          h.criticalSpares.length.toString(),
          h.inspectedBy || "N/A",
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Handover ID', 'Tool Set', 'Status', 'Spares', 'Inspector']],
          body: handoverRows,
          theme: 'grid',
          headStyles: { fillColor: [6, 182, 212] },
          margin: { left: 14 },
          styles: { fontSize: 8 },
        });
        break;

      case "inventory":
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text("Inventory Report", 14, yPos);
        yPos += 5;

        const inventoryRows = filteredInventory.map(i => [
          i.partNumber,
          i.name,
          i.stockLevel.toString(),
          i.minStockLevel.toString(),
          i.status,
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Part Number', 'Name', 'Stock', 'Min Stock', 'Status']],
          body: inventoryRows,
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] },
          margin: { left: 14 },
          styles: { fontSize: 8 },
        });
        break;
    }

    doc.save(`Dynamic_Report_${filters.reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Calculate overall metrics (for static dashboard view)
  const totalProjects = projects.length;
  const totalPRs = prs.length;
  const totalHandovers = handovers.length;
  const totalInventoryItems = inventory.length;

  // Budget calculations
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

  // PR type breakdown
  const newPRCount = prs.filter(pr => pr.prType === "New Set").length;
  const modificationPRCount = prs.filter(pr => pr.prType === "Modification").length;
  const refurbishedPRCount = prs.filter(pr => pr.prType === "Refurbished").length;

  // Budget by PR type
  const newPRBudget = prs
    .filter(pr => pr.prType === "New Set" && pr.status === "Awarded")
    .reduce((sum, pr) => {
      const quote = pr.quotations?.find(q => q.status === "Selected" || q.supplier === pr.awardedSupplier);
      return sum + (quote?.price || 0);
    }, 0);

  const modificationPRBudget = prs
    .filter(pr => pr.prType === "Modification" && pr.status === "Awarded")
    .reduce((sum, pr) => {
      const quote = pr.quotations?.find(q => q.status === "Selected" || q.supplier === pr.awardedSupplier);
      return sum + (quote?.price || 0);
    }, 0);

  const refurbishedPRBudget = prs
    .filter(pr => pr.prType === "Refurbished" && pr.status === "Awarded")
    .reduce((sum, pr) => {
      const quote = pr.quotations?.find(q => q.status === "Selected" || q.supplier === pr.awardedSupplier);
      return sum + (quote?.price || 0);
    }, 0);

  // Status distribution
  const statusData = [
    { name: "Draft", value: prs.filter(pr => pr.status === "Draft").length },
    { name: "Pending", value: prs.filter(pr => pr.status === "Pending Approval").length },
    { name: "Approved", value: prs.filter(pr => pr.status === "Approved").length },
    { name: "Awarded", value: prs.filter(pr => pr.status === "Awarded").length },
    { name: "Rejected", value: prs.filter(pr => pr.status === "Rejected").length },
  ];

  // PR Type distribution for pie chart
  const prTypeData = [
    { name: "New Set", value: newPRCount },
    { name: "Modification", value: modificationPRCount },
    { name: "Refurbished", value: refurbishedPRCount },
  ];

  // Budget comparison data
  const budgetComparisonData = [
    {
      category: "New Set",
      Planned: projects.filter(p => prs.some(pr => pr.projectId === p.id && pr.prType === "New Set")).reduce((sum, p) => sum + p.price, 0) / 1000,
      Actual: newPRBudget / 1000,
    },
    {
      category: "Modification",
      Planned: projects.filter(p => prs.some(pr => pr.projectId === p.id && pr.prType === "Modification")).reduce((sum, p) => sum + p.price, 0) / 1000,
      Actual: modificationPRBudget / 1000,
    },
    {
      category: "Refurbished",
      Planned: projects.filter(p => prs.some(pr => pr.projectId === p.id && pr.prType === "Refurbished")).reduce((sum, p) => sum + p.price, 0) / 1000,
      Actual: refurbishedPRBudget / 1000,
    },
  ];

  // Inventory status data
  const inventoryStatusData = [
    { name: "In Stock", value: inventory.filter(i => i.status === "In Stock").length },
    { name: "Low Stock", value: inventory.filter(i => i.status === "Low Stock").length },
    { name: "Out of Stock", value: inventory.filter(i => i.status === "Out of Stock").length },
  ];

  // Get unique values for filters
  const uniquePartNumbers = Array.from(new Set(projects.map(p => p.partNumber)));
  const uniqueStatuses = ["all", "Active", "Completed", "Pending", "Draft", "Pending Approval", "Approved", "Awarded", "Rejected", "In Stock", "Low Stock", "Out of Stock"];
  const prTypes = ["all", "New Set", "Modification", "Refurbished"];

  // Filtered data for charts based on month/year filters or custom date range
  const filteredPRsForType = prTypeCustomDateFrom || prTypeCustomDateTo 
    ? filterByCustomDateRange(prs, prTypeCustomDateFrom, prTypeCustomDateTo)
    : filterByMonthYear(prs, prTypeFilter);
  const filteredPRTypeData = [
    { name: "New Set", value: filteredPRsForType.filter(pr => pr.prType === "New Set").length },
    { name: "Modification", value: filteredPRsForType.filter(pr => pr.prType === "Modification").length },
    { name: "Refurbished", value: filteredPRsForType.filter(pr => pr.prType === "Refurbished").length },
  ];

  const filteredPRsForStatus = statusCustomDateFrom || statusCustomDateTo
    ? filterByCustomDateRange(prs, statusCustomDateFrom, statusCustomDateTo)
    : filterByMonthYear(prs, statusFilter);
  const filteredStatusData = [
    { name: "Draft", value: filteredPRsForStatus.filter(pr => pr.status === "Draft").length },
    { name: "Pending", value: filteredPRsForStatus.filter(pr => pr.status === "Pending Approval").length },
    { name: "Approved", value: filteredPRsForStatus.filter(pr => pr.status === "Approved").length },
    { name: "Awarded", value: filteredPRsForStatus.filter(pr => pr.status === "Awarded").length },
    { name: "Rejected", value: filteredPRsForStatus.filter(pr => pr.status === "Rejected").length },
  ];

  // Filtered budget data
  const filteredPRsForBudget = filterByMonthYear(prs, budgetFilter);
  const filteredProjectsForBudget = filterByMonthYear(projects, budgetFilter);
  
  const filteredNewPRBudget = filteredPRsForBudget
    .filter(pr => pr.prType === "New Set" && pr.status === "Awarded")
    .reduce((sum, pr) => {
      const quote = pr.quotations?.find(q => q.status === "Selected" || q.supplier === pr.awardedSupplier);
      return sum + (quote?.price || 0);
    }, 0);

  const filteredModificationPRBudget = filteredPRsForBudget
    .filter(pr => pr.prType === "Modification" && pr.status === "Awarded")
    .reduce((sum, pr) => {
      const quote = pr.quotations?.find(q => q.status === "Selected" || q.supplier === pr.awardedSupplier);
      return sum + (quote?.price || 0);
    }, 0);

  const filteredRefurbishedPRBudget = filteredPRsForBudget
    .filter(pr => pr.prType === "Refurbished" && pr.status === "Awarded")
    .reduce((sum, pr) => {
      const quote = pr.quotations?.find(q => q.status === "Selected" || q.supplier === pr.awardedSupplier);
      return sum + (quote?.price || 0);
    }, 0);

  const filteredBudgetComparisonData = [
    {
      category: "New Set",
      Planned: filteredProjectsForBudget.filter(p => filteredPRsForBudget.some(pr => pr.projectId === p.id && pr.prType === "New Set")).reduce((sum, p) => sum + p.price, 0) / 1000,
      Actual: filteredNewPRBudget / 1000,
    },
    {
      category: "Modification",
      Planned: filteredProjectsForBudget.filter(p => filteredPRsForBudget.some(pr => pr.projectId === p.id && pr.prType === "Modification")).reduce((sum, p) => sum + p.price, 0) / 1000,
      Actual: filteredModificationPRBudget / 1000,
    },
    {
      category: "Refurbished",
      Planned: filteredProjectsForBudget.filter(p => filteredPRsForBudget.some(pr => pr.projectId === p.id && pr.prType === "Refurbished")).reduce((sum, p) => sum + p.price, 0) / 1000,
      Actual: filteredRefurbishedPRBudget / 1000,
    },
  ];

  // Filtered inventory data (returns all since inventory doesn't have createdAt)
  const filteredInventoryData = filterInventoryByMonthYear(inventory, inventoryFilter);
  const filteredInventoryStatusData = [
    { name: "In Stock", value: filteredInventoryData.filter(i => i.status === "In Stock").length },
    { name: "Low Stock", value: filteredInventoryData.filter(i => i.status === "Low Stock").length },
    { name: "Out of Stock", value: filteredInventoryData.filter(i => i.status === "Out of Stock").length },
  ];

  // Export static dashboard to Excel (original functionality)
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ["Tool Maintenance System - Reports"],
      ["Generated on:", new Date().toLocaleString()],
      [],
      ["OVERALL METRICS"],
      ["Total Projects", totalProjects],
      ["Total Purchase Requisitions", totalPRs],
      ["Total Tool Handovers", totalHandovers],
      ["Total Inventory Items", totalInventoryItems],
      [],
      ["BUDGET SUMMARY"],
      ["Total Planned Budget", `₹${totalPlannedBudget.toLocaleString()}`],
      ["Total Actual Budget", `₹${totalActualBudget.toLocaleString()}`],
      ["Variance", `₹${totalVariance.toLocaleString()}`],
      ["Variance %", `${totalVariancePercentage.toFixed(2)}%`],
      [],
      ["PR TYPE BREAKDOWN"],
      ["New Set PRs", newPRCount, `Budget: ₹${newPRBudget.toLocaleString()}`],
      ["Modification PRs", modificationPRCount, `Budget: ₹${modificationPRBudget.toLocaleString()}`],
      ["Refurbished PRs", refurbishedPRCount, `Budget: ₹${refurbishedPRBudget.toLocaleString()}`],
    ];
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWS, "Summary");

    // Projects Sheet
    const projectsData = projects.map(p => ({
      "Project ID": p.id,
      "Customer PO": p.customerPO,
      "Part Number": p.partNumber,
      "Tool Number": p.toolNumber,
      "Price": p.price,
      "Target Date": p.targetDate,
      "Status": p.status,
      "Created By": p.createdBy,
      "Created At": new Date(p.createdAt).toLocaleString(),
    }));
    const projectsWS = XLSX.utils.json_to_sheet(projectsData);
    XLSX.utils.book_append_sheet(wb, projectsWS, "Projects");

    // PRs Sheet
    const prsData = prs.map(pr => ({
      "PR ID": pr.id,
      "Project ID": pr.projectId,
      "PR Type": pr.prType,
      "Items Count": pr.items.length,
      "Suppliers": pr.suppliers.join(", "),
      "Status": pr.status,
      "Created By": pr.createdBy,
      "Created At": new Date(pr.createdAt).toLocaleString(),
    }));
    const prsWS = XLSX.utils.json_to_sheet(prsData);
    XLSX.utils.book_append_sheet(wb, prsWS, "Purchase Requisitions");

    // Handovers Sheet
    if (handovers.length > 0) {
      const handoversData = handovers.map(h => ({
        "Handover ID": h.id,
        "Project ID": h.projectId,
        "PR ID": h.prId,
        "Tool Set": h.toolSet,
        "Spares Count": h.criticalSpares.length,
        "Status": h.status,
        "Inspected By": h.inspectedBy || "N/A",
        "Inspection Date": h.inspectionDate ? new Date(h.inspectionDate).toLocaleString() : "N/A",
      }));
      const handoversWS = XLSX.utils.json_to_sheet(handoversData);
      XLSX.utils.book_append_sheet(wb, handoversWS, "Tool Handovers");
    }

    // Inventory Sheet
    if (inventory.length > 0) {
      const inventoryData = inventory.map(i => ({
        "Part Number": i.partNumber,
        "Tool Number": i.toolNumber,
        "Name": i.name,
        "Quantity": i.quantity,
        "Stock Level": i.stockLevel,
        "Min Stock Level": i.minStockLevel,
        "Status": i.status,
      }));
      const inventoryWS = XLSX.utils.json_to_sheet(inventoryData);
      XLSX.utils.book_append_sheet(wb, inventoryWS, "Inventory");
    }

    // Save the file
    XLSX.writeFile(wb, `NPD_Workflow_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export static dashboard to PDF (original functionality)
  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Title
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text("Tool Maintenance System", pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Reports Dashboard", pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 38, { align: 'center' });
    doc.text(`User Role: ${userRole}`, pageWidth / 2, 44, { align: 'center' });

    let yPos = 55;

    // Overall Metrics
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Overall Metrics", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Count']],
      body: [
        ['Total Projects', totalProjects.toString()],
        ['Total Purchase Requisitions', totalPRs.toString()],
        ['Total Tool Handovers', totalHandovers.toString()],
        ['Total Inventory Items', totalInventoryItems.toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      margin: { left: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Budget Summary
    doc.setFontSize(12);
    doc.text("Budget Summary", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Amount']],
      body: [
        ['Total Planned Budget', `₹${totalPlannedBudget.toLocaleString()}`],
        ['Total Actual Budget', `₹${totalActualBudget.toLocaleString()}`],
        ['Variance', `₹${totalVariance.toLocaleString()}`],
        ['Variance Percentage', `${totalVariancePercentage.toFixed(2)}%`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] },
      margin: { left: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // PR Type Breakdown
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.text("Purchase Requisitions Breakdown", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['PR Type', 'Count', 'Budget']],
      body: [
        ['New Set', newPRCount.toString(), `₹${newPRBudget.toLocaleString()}`],
        ['Modification', modificationPRCount.toString(), `₹${modificationPRBudget.toLocaleString()}`],
        ['Refurbished', refurbishedPRCount.toString(), `₹${refurbishedPRBudget.toLocaleString()}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      margin: { left: 14 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Status Distribution
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.text("PR Status Distribution", 14, yPos);
    yPos += 5;

    autoTable(doc, {
      startY: yPos,
      head: [['Status', 'Count']],
      body: statusData.map(s => [s.name, s.value.toString()]),
      theme: 'grid',
      headStyles: { fillColor: [245, 158, 11] },
      margin: { left: 14 },
    });

    // Save the PDF
    doc.save(`NPD_Workflow_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="flex-1 overflow-y-auto scrollbar-smart p-6">
      {/* Header with Export Buttons */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-3 rounded-lg border border-slate-200/60 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-sm font-bold leading-tight">Reports Dashboard</h1>
            <p className="text-[9px] text-muted-foreground leading-tight">
              Comprehensive analytics and export options
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowDynamicBuilder(!showDynamicBuilder)}
              size="sm"
              variant={showDynamicBuilder ? "default" : "outline"}
              className="shadow-md h-9"
            >
              <Settings className="w-4 h-4 mr-2" />
              {showDynamicBuilder ? "Hide" : "Custom Report"}
            </Button>
            <Button 
              onClick={exportToExcel}
              size="sm"
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md h-9"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
            <Button 
              onClick={exportToPDF}
              size="sm"
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md h-9"
            >
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Dynamic Report Builder */}
      {showDynamicBuilder && (
        <Card className="shadow-md mb-6 border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/50">
          <CardHeader className="pb-3 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Dynamic Report Builder
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDynamicBuilder(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-4">
            {/* Report Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Report Type</Label>
                <Select value={filters.reportType} onValueChange={(value) => handleReportTypeChange(value as ReportType)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="summary">Summary Report</SelectItem>
                    <SelectItem value="projects">Projects Report</SelectItem>
                    <SelectItem value="prs">Purchase Requisitions</SelectItem>
                    <SelectItem value="handovers">Tool Handovers</SelectItem>
                    <SelectItem value="inventory">Inventory Report</SelectItem>
                    {userRole === "Approver" && <SelectItem value="budget">Budget Analysis</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Date From</Label>
                <Input
                  type="date"
                  className="h-9 text-xs"
                  value={filters.dateFrom ? format(filters.dateFrom, "yyyy-MM-dd") : ""}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value ? new Date(e.target.value) : undefined })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Date To</Label>
                <Input
                  type="date"
                  className="h-9 text-xs"
                  value={filters.dateTo ? format(filters.dateTo, "yyyy-MM-dd") : ""}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value ? new Date(e.target.value) : undefined })}
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Status Filter</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">PR Type Filter</Label>
                <Select value={filters.prType} onValueChange={(value) => setFilters({ ...filters, prType: value })}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {prTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Part Number Filter</Label>
                <Select value={filters.partNumber} onValueChange={(value) => setFilters({ ...filters, partNumber: value })}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniquePartNumbers.map(pn => (
                      <SelectItem key={pn} value={pn}>{pn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Field Selection */}
            {filters.reportType !== "summary" && (
              <div className="space-y-2">
                <Label className="text-xs">Select Fields to Include</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-white rounded-lg border">
                  {getAvailableFields(filters.reportType).map(field => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={filters.selectedFields.includes(field)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFilters({ ...filters, selectedFields: [...filters.selectedFields, field] });
                          } else {
                            setFilters({ ...filters, selectedFields: filters.selectedFields.filter(f => f !== field) });
                          }
                        }}
                      />
                      <label htmlFor={field} className="text-xs cursor-pointer">
                        {field}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generate Buttons */}
            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => setShowGeneratedReport(true)}
                size="sm"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                <Filter className="w-4 h-4 mr-2" />
                Submit & Generate Report
              </Button>
              <Button 
                onClick={() => {
                  setFilters({
                    reportType: "summary",
                    dateFrom: undefined,
                    dateTo: undefined,
                    status: "all",
                    prType: "all",
                    partNumber: "all",
                    includeCharts: true,
                    selectedFields: [],
                  });
                  setShowGeneratedReport(false);
                }}
                size="sm"
                variant="outline"
              >
                Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Report Table */}
      {showGeneratedReport && showDynamicBuilder && (() => {
        const { filteredProjects, filteredPRs, filteredHandovers, filteredInventory } = getFilteredData();
        
        return (
          <GeneratedReportTable
            reportType={filters.reportType}
            selectedFields={filters.selectedFields}
            filteredProjects={filteredProjects}
            filteredPRs={filteredPRs}
            filteredHandovers={filteredHandovers}
            filteredInventory={filteredInventory}
            onExportExcel={exportDynamicToExcel}
            onExportPDF={exportDynamicToPDF}
          />
        );
      })()}

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Projects */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-violet-50">
          <CardHeader className="pb-1.5 pt-2 px-3">
            <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-purple-900 leading-tight">
              <div className="p-1 bg-purple-100 rounded-lg">
                <Layers className="w-3 h-3 text-purple-600" />
              </div>
              Total Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-3">
            <div className="text-xl font-bold text-purple-600">{totalProjects}</div>
            <p className="text-[9px] text-purple-600/70 leading-tight">Active projects</p>
          </CardContent>
        </Card>

        {/* Total PRs */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-1.5 pt-2 px-3">
            <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-blue-900 leading-tight">
              <div className="p-1 bg-blue-100 rounded-lg">
                <FileText className="w-3 h-3 text-blue-600" />
              </div>
              Purchase Requisitions
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-3">
            <div className="text-xl font-bold text-blue-600">{totalPRs}</div>
            <p className="text-[9px] text-blue-600/70 leading-tight">Total PRs</p>
          </CardContent>
        </Card>

        {/* Total Handovers */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-cyan-50 to-teal-50">
          <CardHeader className="pb-1.5 pt-2 px-3">
            <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-cyan-900 leading-tight">
              <div className="p-1 bg-cyan-100 rounded-lg">
                <Wrench className="w-3 h-3 text-cyan-600" />
              </div>
              Tool Handovers
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-3">
            <div className="text-xl font-bold text-cyan-600">{totalHandovers}</div>
            <p className="text-[9px] text-cyan-600/70 leading-tight">Completed handovers</p>
          </CardContent>
        </Card>

        {/* Total Inventory */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader className="pb-1.5 pt-2 px-3">
            <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-emerald-900 leading-tight">
              <div className="p-1 bg-emerald-100 rounded-lg">
                <Database className="w-3 h-3 text-emerald-600" />
              </div>
              Inventory Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-3">
            <div className="text-xl font-bold text-emerald-600">{totalInventoryItems}</div>
            <p className="text-[9px] text-emerald-600/70 leading-tight">Stock items</p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Summary Cards */}
      {userRole === "Approver" && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-purple-50">
            <CardHeader className="pb-1.5 pt-2 px-3">
              <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-indigo-900 leading-tight">
                <div className="p-1 bg-indigo-100 rounded-lg">
                  <DollarSign className="w-3 h-3 text-indigo-600" />
                </div>
                Planned Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2 px-3">
              <div className="text-xl font-bold text-indigo-600">
                ₹{(totalPlannedBudget / 1000).toFixed(0)}K
              </div>
              <p className="text-[9px] text-indigo-600/70 leading-tight">Total planned</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-sky-50">
            <CardHeader className="pb-1.5 pt-2 px-3">
              <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-blue-900 leading-tight">
                <div className="p-1 bg-blue-100 rounded-lg">
                  <Activity className="w-3 h-3 text-blue-600" />
                </div>
                Actual Budget
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2 px-3">
              <div className="text-xl font-bold text-blue-600">
                ₹{(totalActualBudget / 1000).toFixed(0)}K
              </div>
              <p className="text-[9px] text-blue-600/70 leading-tight">Total spent</p>
            </CardContent>
          </Card>

          <Card className={`border-0 shadow-md ${totalVariance >= 0 ? 'bg-gradient-to-br from-red-50 to-rose-50' : 'bg-gradient-to-br from-green-50 to-emerald-50'}`}>
            <CardHeader className="pb-1.5 pt-2 px-3">
              <CardTitle className={`text-[10px] font-medium flex items-center gap-1.5 ${totalVariance >= 0 ? 'text-red-900' : 'text-green-900'} leading-tight`}>
                <div className={`p-1 ${totalVariance >= 0 ? 'bg-red-100' : 'bg-green-100'} rounded-lg`}>
                  {totalVariance >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-red-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-green-600" />
                  )}
                </div>
                Variance
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2 px-3">
              <div className={`text-xl font-bold ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{Math.abs(totalVariance / 1000).toFixed(0)}K
              </div>
              <p className={`text-[9px] ${totalVariance >= 0 ? 'text-red-600/70' : 'text-green-600/70'} leading-tight`}>
                {totalVariancePercentage > 0 ? '+' : ''}{totalVariancePercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-purple-50">
            <CardHeader className="pb-1.5 pt-2 px-3">
              <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-violet-900 leading-tight">
                <div className="p-1 bg-violet-100 rounded-lg">
                  <Package className="w-3 h-3 text-violet-600" />
                </div>
                Awarded PRs
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-2 px-3">
              <div className="text-xl font-bold text-violet-600">
                {prs.filter(pr => pr.status === "Awarded").length}
              </div>
              <p className="text-[9px] text-violet-600/70 leading-tight">Completed awards</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* PR Type Distribution Pie Chart */}
        <Card className="shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-end justify-between">
              <CardTitle className="text-sm">PR Type Distribution</CardTitle>
              {/* Filters Row */}
              {userRole === "NPD" && (
                <div className="flex items-end gap-3">
                {/* Month Filter */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Month</span>
                  <Select
                    value={prTypeFilter.month}
                    onValueChange={(value) => {
                      setPRTypeFilter({ ...prTypeFilter, month: value });
                      setPRTypeCustomDateFrom(undefined);
                      setPRTypeCustomDateTo(undefined);
                    }}
                  >
                    <SelectTrigger className="h-7 w-20 text-[10px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-[10px]">All</SelectItem>
                      <SelectItem value="0" className="text-[10px]">Jan</SelectItem>
                      <SelectItem value="1" className="text-[10px]">Feb</SelectItem>
                      <SelectItem value="2" className="text-[10px]">Mar</SelectItem>
                      <SelectItem value="3" className="text-[10px]">Apr</SelectItem>
                      <SelectItem value="4" className="text-[10px]">May</SelectItem>
                      <SelectItem value="5" className="text-[10px]">Jun</SelectItem>
                      <SelectItem value="6" className="text-[10px]">Jul</SelectItem>
                      <SelectItem value="7" className="text-[10px]">Aug</SelectItem>
                      <SelectItem value="8" className="text-[10px]">Sep</SelectItem>
                      <SelectItem value="9" className="text-[10px]">Oct</SelectItem>
                      <SelectItem value="10" className="text-[10px]">Nov</SelectItem>
                      <SelectItem value="11" className="text-[10px]">Dec</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Year Filter */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Year</span>
                  <Select
                    value={prTypeFilter.year}
                    onValueChange={(value) => {
                      setPRTypeFilter({ ...prTypeFilter, year: value });
                      setPRTypeCustomDateFrom(undefined);
                      setPRTypeCustomDateTo(undefined);
                    }}
                  >
                    <SelectTrigger className="h-7 w-20 text-[10px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-[10px]">All</SelectItem>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()} className="text-[10px]">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Custom Date Range */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Custom</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      className="h-7 text-[10px] w-32"
                      value={prTypeCustomDateFrom ? format(prTypeCustomDateFrom, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          setPRTypeCustomDateFrom(new Date(e.target.value));
                        } else {
                          setPRTypeCustomDateFrom(undefined);
                        }
                      }}
                      placeholder="From"
                    />
                    <span className="text-[10px] text-muted-foreground">to</span>
                    <Input
                      type="date"
                      className="h-7 text-[10px] w-32"
                      value={prTypeCustomDateTo ? format(prTypeCustomDateTo, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          setPRTypeCustomDateTo(new Date(e.target.value));
                        } else {
                          setPRTypeCustomDateTo(undefined);
                        }
                      }}
                      placeholder="To"
                    />
                    {(prTypeCustomDateFrom || prTypeCustomDateTo) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setPRTypeCustomDateFrom(undefined);
                          setPRTypeCustomDateTo(undefined);
                        }}
                        className="h-7 px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={filteredPRTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {filteredPRTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution Bar Chart */}
        <Card className="shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-end justify-between">
              <CardTitle className="text-sm">PR Status Distribution</CardTitle>
              {/* Filters Row */}
              {userRole === "NPD" && (
                <div className="flex items-end gap-3">
                {/* Month Filter */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Month</span>
                  <Select
                    value={statusFilter.month}
                    onValueChange={(value) => {
                      setStatusFilter({ ...statusFilter, month: value });
                      setStatusCustomDateFrom(undefined);
                      setStatusCustomDateTo(undefined);
                    }}
                  >
                    <SelectTrigger className="h-7 w-20 text-[10px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-[10px]">All</SelectItem>
                      <SelectItem value="0" className="text-[10px]">Jan</SelectItem>
                      <SelectItem value="1" className="text-[10px]">Feb</SelectItem>
                      <SelectItem value="2" className="text-[10px]">Mar</SelectItem>
                      <SelectItem value="3" className="text-[10px]">Apr</SelectItem>
                      <SelectItem value="4" className="text-[10px]">May</SelectItem>
                      <SelectItem value="5" className="text-[10px]">Jun</SelectItem>
                      <SelectItem value="6" className="text-[10px]">Jul</SelectItem>
                      <SelectItem value="7" className="text-[10px]">Aug</SelectItem>
                      <SelectItem value="8" className="text-[10px]">Sep</SelectItem>
                      <SelectItem value="9" className="text-[10px]">Oct</SelectItem>
                      <SelectItem value="10" className="text-[10px]">Nov</SelectItem>
                      <SelectItem value="11" className="text-[10px]">Dec</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Year Filter */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Year</span>
                  <Select
                    value={statusFilter.year}
                    onValueChange={(value) => {
                      setStatusFilter({ ...statusFilter, year: value });
                      setStatusCustomDateFrom(undefined);
                      setStatusCustomDateTo(undefined);
                    }}
                  >
                    <SelectTrigger className="h-7 w-20 text-[10px]">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-[10px]">All</SelectItem>
                      {availableYears.map(year => (
                        <SelectItem key={year} value={year.toString()} className="text-[10px]">{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Custom Date Range */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Custom</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      className="h-7 text-[10px] w-32"
                      value={statusCustomDateFrom ? format(statusCustomDateFrom, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          setStatusCustomDateFrom(new Date(e.target.value));
                        } else {
                          setStatusCustomDateFrom(undefined);
                        }
                      }}
                      placeholder="From"
                    />
                    <span className="text-[10px] text-muted-foreground">to</span>
                    <Input
                      type="date"
                      className="h-7 text-[10px] w-32"
                      value={statusCustomDateTo ? format(statusCustomDateTo, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          setStatusCustomDateTo(new Date(e.target.value));
                        } else {
                          setStatusCustomDateTo(undefined);
                        }
                      }}
                      placeholder="To"
                    />
                    {(statusCustomDateFrom || statusCustomDateTo) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setStatusCustomDateFrom(undefined);
                          setStatusCustomDateTo(undefined);
                        }}
                        className="h-7 px-2"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={filteredStatusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Budget Comparison Chart */}
      {userRole === "Approver" && (
        <Card className="shadow-md mb-6">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-end justify-between">
              <CardTitle className="text-sm">Budget Comparison: Planned vs Actual</CardTitle>
              <div className="flex items-end gap-3">
              {/* Month Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">Month</span>
                <Select
                  value={budgetFilter.month}
                  onValueChange={(value) => setBudgetFilter({ ...budgetFilter, month: value })}
                >
                  <SelectTrigger className="h-7 w-20 text-[10px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px]">All</SelectItem>
                    <SelectItem value="0" className="text-[10px]">Jan</SelectItem>
                    <SelectItem value="1" className="text-[10px]">Feb</SelectItem>
                    <SelectItem value="2" className="text-[10px]">Mar</SelectItem>
                    <SelectItem value="3" className="text-[10px]">Apr</SelectItem>
                    <SelectItem value="4" className="text-[10px]">May</SelectItem>
                    <SelectItem value="5" className="text-[10px]">Jun</SelectItem>
                    <SelectItem value="6" className="text-[10px]">Jul</SelectItem>
                    <SelectItem value="7" className="text-[10px]">Aug</SelectItem>
                    <SelectItem value="8" className="text-[10px]">Sep</SelectItem>
                    <SelectItem value="9" className="text-[10px]">Oct</SelectItem>
                    <SelectItem value="10" className="text-[10px]">Nov</SelectItem>
                    <SelectItem value="11" className="text-[10px]">Dec</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Year Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">Year</span>
                <Select
                  value={budgetFilter.year}
                  onValueChange={(value) => setBudgetFilter({ ...budgetFilter, year: value })}
                >
                  <SelectTrigger className="h-7 w-20 text-[10px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px]">All</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()} className="text-[10px]">{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredBudgetComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Amount (K)', angle: -90, position: 'insideLeft', style: { fontSize: 11 } }} />
                <RechartsTooltip />
                <Legend />
                <Bar dataKey="Planned" fill="#8b5cf6" name="Planned Budget" />
                <Bar dataKey="Actual" fill="#3b82f6" name="Actual Budget" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Inventory Status Chart */}
      {(userRole === "Spares" || userRole === "Approver") && inventory.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="pb-2 pt-3 px-4">
            <div className="flex items-end justify-between">
              <CardTitle className="text-sm">Inventory Status Distribution</CardTitle>
              <div className="flex items-end gap-3">
              {/* Month Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">Month</span>
                <Select
                  value={inventoryFilter.month}
                  onValueChange={(value) => setInventoryFilter({ ...inventoryFilter, month: value })}
                >
                  <SelectTrigger className="h-7 w-20 text-[10px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px]">All</SelectItem>
                    <SelectItem value="0" className="text-[10px]">Jan</SelectItem>
                    <SelectItem value="1" className="text-[10px]">Feb</SelectItem>
                    <SelectItem value="2" className="text-[10px]">Mar</SelectItem>
                    <SelectItem value="3" className="text-[10px]">Apr</SelectItem>
                    <SelectItem value="4" className="text-[10px]">May</SelectItem>
                    <SelectItem value="5" className="text-[10px]">Jun</SelectItem>
                    <SelectItem value="6" className="text-[10px]">Jul</SelectItem>
                    <SelectItem value="7" className="text-[10px]">Aug</SelectItem>
                    <SelectItem value="8" className="text-[10px]">Sep</SelectItem>
                    <SelectItem value="9" className="text-[10px]">Oct</SelectItem>
                    <SelectItem value="10" className="text-[10px]">Nov</SelectItem>
                    <SelectItem value="11" className="text-[10px]">Dec</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Year Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">Year</span>
                <Select
                  value={inventoryFilter.year}
                  onValueChange={(value) => setInventoryFilter({ ...inventoryFilter, year: value })}
                >
                  <SelectTrigger className="h-7 w-20 text-[10px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px]">All</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()} className="text-[10px]">{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={filteredInventoryStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {filteredInventoryStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index + 2 % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* PR Type Budget Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card className="border-0 shadow-md bg-gradient-to-br from-violet-50 to-purple-50">
          <CardHeader className="pb-1.5 pt-2 px-3">
            <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-violet-900 leading-tight">
              <div className="p-1 bg-violet-100 rounded-lg">
                <Layers className="w-3 h-3 text-violet-600" />
              </div>
              New Set PRs
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-3">
            <div className="text-xl font-bold text-violet-600">{newPRCount}</div>
            <p className="text-[9px] text-violet-600/70 leading-tight">
              Budget: ₹{(newPRBudget / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-sky-50 to-blue-50">
          <CardHeader className="pb-1.5 pt-2 px-3">
            <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-sky-900 leading-tight">
              <div className="p-1 bg-sky-100 rounded-lg">
                <Edit className="w-3 h-3 text-sky-600" />
              </div>
              Modification PRs
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-3">
            <div className="text-xl font-bold text-sky-600">{modificationPRCount}</div>
            <p className="text-[9px] text-sky-600/70 leading-tight">
              Budget: ₹{(modificationPRBudget / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-green-50">
          <CardHeader className="pb-1.5 pt-2 px-3">
            <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-emerald-900 leading-tight">
              <div className="p-1 bg-emerald-100 rounded-lg">
                <Activity className="w-3 h-3 text-emerald-600" />
              </div>
              Refurbished PRs
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-2 px-3">
            <div className="text-xl font-bold text-emerald-600">{refurbishedPRCount}</div>
            <p className="text-[9px] text-emerald-600/70 leading-tight">
              Budget: ₹{(refurbishedPRBudget / 1000).toFixed(0)}K
            </p>
          </CardContent>
        </Card>
      </div>

      {/* BOM vs Supplier Price Analysis - NPD Specific Report */}
      {userRole === "NPD" && (() => {
        // Get awarded PRs with quotations, filtered by month/year or custom date range
        const filteredAwardedPRs = bomCustomDateFrom || bomCustomDateTo
          ? filterByCustomDateRange(
              prs.filter(pr => pr.status === "Awarded" && pr.quotations && pr.quotations.length > 0),
              bomCustomDateFrom,
              bomCustomDateTo
            )
          : filterByMonthYear(
              prs.filter(pr => pr.status === "Awarded" && pr.quotations && pr.quotations.length > 0),
              bomFilter
            );
        
        // Calculate BOM vs Supplier pricing for each PR
        const bomVsSupplierData = filteredAwardedPRs.map(pr => {
          const project = projects.find(p => p.id === pr.projectId);
          if (!project) return null;
          
          // Get BOM data for this tool
          const bomItems = bomDatabase[project.toolNumber] || [];
          const bomTotal = bomItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
          
          // Get awarded quotation price
          const awardedQuote = pr.quotations?.find(
            q => q.status === "Selected" || q.supplier === pr.awardedSupplier
          );
          const supplierPrice = awardedQuote?.price || 0;
          
          // Calculate variance
          const variance = supplierPrice - bomTotal;
          const variancePercent = bomTotal > 0 ? (variance / bomTotal) * 100 : 0;
          
          return {
            prId: pr.id,
            toolNumber: project.toolNumber,
            partNumber: project.partNumber,
            bomTotal,
            supplierPrice,
            variance,
            variancePercent,
            supplier: pr.awardedSupplier || awardedQuote?.supplier || "Unknown",
          };
        }).filter(Boolean);

        if (bomVsSupplierData.length === 0) return null;

        // Calculate summary stats
        const totalBOMCost = bomVsSupplierData.reduce((sum, item) => sum + (item?.bomTotal || 0), 0);
        const totalSupplierCost = bomVsSupplierData.reduce((sum, item) => sum + (item?.supplierPrice || 0), 0);
        const totalVariance = totalSupplierCost - totalBOMCost;
        const avgVariancePercent = totalBOMCost > 0 ? (totalVariance / totalBOMCost) * 100 : 0;
        
        // Chart data
        const chartData = bomVsSupplierData.slice(0, 10).map(item => ({
          pr: item?.prId || "",
          "BOM Cost": (item?.bomTotal || 0) / 1000,
          "Supplier Price": (item?.supplierPrice || 0) / 1000,
          variance: (item?.variance || 0) / 1000,
        }));

        return (
          <div className="mt-6 space-y-4">
            <div className="flex items-end justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                BOM vs Supplier Price Analysis (Awarded PRs)
              </h3>
              {/* Filters Row */}
              <div className="flex items-end gap-3">
              {/* Month Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">Month</span>
                <Select
                  value={bomFilter.month}
                  onValueChange={(value) => {
                    setBOMFilter({ ...bomFilter, month: value });
                    setBOMCustomDateFrom(undefined);
                    setBOMCustomDateTo(undefined);
                  }}
                >
                  <SelectTrigger className="h-7 w-20 text-[10px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px]">All</SelectItem>
                    <SelectItem value="0" className="text-[10px]">Jan</SelectItem>
                    <SelectItem value="1" className="text-[10px]">Feb</SelectItem>
                    <SelectItem value="2" className="text-[10px]">Mar</SelectItem>
                    <SelectItem value="3" className="text-[10px]">Apr</SelectItem>
                    <SelectItem value="4" className="text-[10px]">May</SelectItem>
                    <SelectItem value="5" className="text-[10px]">Jun</SelectItem>
                    <SelectItem value="6" className="text-[10px]">Jul</SelectItem>
                    <SelectItem value="7" className="text-[10px]">Aug</SelectItem>
                    <SelectItem value="8" className="text-[10px]">Sep</SelectItem>
                    <SelectItem value="9" className="text-[10px]">Oct</SelectItem>
                    <SelectItem value="10" className="text-[10px]">Nov</SelectItem>
                    <SelectItem value="11" className="text-[10px]">Dec</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Year Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">Year</span>
                <Select
                  value={bomFilter.year}
                  onValueChange={(value) => {
                    setBOMFilter({ ...bomFilter, year: value });
                    setBOMCustomDateFrom(undefined);
                    setBOMCustomDateTo(undefined);
                  }}
                >
                  <SelectTrigger className="h-7 w-20 text-[10px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-[10px]">All</SelectItem>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()} className="text-[10px]">{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Custom Date Range for BOM Analysis */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground font-medium">Custom</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    className="h-7 text-[10px] w-32"
                    value={bomCustomDateFrom ? format(bomCustomDateFrom, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setBOMCustomDateFrom(new Date(e.target.value));
                      } else {
                        setBOMCustomDateFrom(undefined);
                      }
                    }}
                    placeholder="From"
                  />
                  <span className="text-[10px] text-muted-foreground">to</span>
                  <Input
                    type="date"
                    className="h-7 text-[10px] w-32"
                    value={bomCustomDateTo ? format(bomCustomDateTo, "yyyy-MM-dd") : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        setBOMCustomDateTo(new Date(e.target.value));
                      } else {
                        setBOMCustomDateTo(undefined);
                      }
                    }}
                    placeholder="To"
                  />
                  {(bomCustomDateFrom || bomCustomDateTo) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setBOMCustomDateFrom(undefined);
                        setBOMCustomDateTo(undefined);
                      }}
                      className="h-7 px-2"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader className="pb-1.5 pt-2 px-3">
                  <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-blue-900 leading-tight">
                    <div className="p-1 bg-blue-100 rounded-lg">
                      <FileText className="w-3 h-3 text-blue-600" />
                    </div>
                    Total BOM Cost
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2 px-3">
                  <div className="text-xl font-bold text-blue-600">
                    ₹{(totalBOMCost / 1000).toFixed(0)}K
                  </div>
                  <p className="text-[9px] text-blue-600/70 leading-tight">
                    Based on BOM prices
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader className="pb-1.5 pt-2 px-3">
                  <CardTitle className="text-[10px] font-medium flex items-center gap-1.5 text-purple-900 leading-tight">
                    <div className="p-1 bg-purple-100 rounded-lg">
                      <Award className="w-3 h-3 text-purple-600" />
                    </div>
                    Supplier Cost
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2 px-3">
                  <div className="text-xl font-bold text-purple-600">
                    ₹{(totalSupplierCost / 1000).toFixed(0)}K
                  </div>
                  <p className="text-[9px] text-purple-600/70 leading-tight">
                    Awarded prices
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-0 shadow-md ${totalVariance >= 0 ? 'bg-gradient-to-br from-red-50 to-rose-50' : 'bg-gradient-to-br from-green-50 to-emerald-50'}`}>
                <CardHeader className="pb-1.5 pt-2 px-3">
                  <CardTitle className={`text-[10px] font-medium flex items-center gap-1.5 ${totalVariance >= 0 ? 'text-red-900' : 'text-green-900'} leading-tight`}>
                    <div className={`p-1 ${totalVariance >= 0 ? 'bg-red-100' : 'bg-green-100'} rounded-lg`}>
                      {totalVariance >= 0 ? <TrendingUp className="w-3 h-3 text-red-600" /> : <TrendingDown className="w-3 h-3 text-green-600" />}
                    </div>
                    Total Variance
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2 px-3">
                  <div className={`text-xl font-bold ${totalVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {totalVariance >= 0 ? '+' : ''}₹{(totalVariance / 1000).toFixed(0)}K
                  </div>
                  <p className={`text-[9px] ${totalVariance >= 0 ? 'text-red-600/70' : 'text-green-600/70'} leading-tight`}>
                    {totalVariance >= 0 ? 'Over BOM' : 'Under BOM'}
                  </p>
                </CardContent>
              </Card>

              <Card className={`border-0 shadow-md ${avgVariancePercent >= 0 ? 'bg-gradient-to-br from-orange-50 to-amber-50' : 'bg-gradient-to-br from-teal-50 to-cyan-50'}`}>
                <CardHeader className="pb-1.5 pt-2 px-3">
                  <CardTitle className={`text-[10px] font-medium flex items-center gap-1.5 ${avgVariancePercent >= 0 ? 'text-orange-900' : 'text-teal-900'} leading-tight`}>
                    <div className={`p-1 ${avgVariancePercent >= 0 ? 'bg-orange-100' : 'bg-teal-100'} rounded-lg`}>
                      <Activity className="w-3 h-3 text-orange-600" />
                    </div>
                    Avg Variance %
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-2 px-3">
                  <div className={`text-xl font-bold ${avgVariancePercent >= 0 ? 'text-orange-600' : 'text-teal-600'}`}>
                    {avgVariancePercent >= 0 ? '+' : ''}{avgVariancePercent.toFixed(1)}%
                  </div>
                  <p className={`text-[9px] ${avgVariancePercent >= 0 ? 'text-orange-600/70' : 'text-teal-600/70'} leading-tight`}>
                    Average deviation
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Chart */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  BOM Cost vs Supplier Price Comparison
                </CardTitle>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Showing top 10 awarded PRs
                </p>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="pr" stroke="#64748b" style={{ fontSize: '10px' }} />
                    <YAxis 
                      stroke="#64748b"
                      style={{ fontSize: '10px' }}
                      tickFormatter={(value) => `₹${value.toFixed(0)}K`}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      formatter={(value: number) => [`₹${(value * 1000).toLocaleString()}`, ""]}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="BOM Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Supplier Price" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Detailed Table */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-2 pt-3 px-4">
                <CardTitle className="text-xs">Detailed BOM vs Supplier Pricing</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-2 font-semibold text-slate-700">PR ID</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-700">Tool #</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-700">Part #</th>
                        <th className="text-left py-2 px-2 font-semibold text-slate-700">Supplier</th>
                        <th className="text-right py-2 px-2 font-semibold text-slate-700">BOM Cost</th>
                        <th className="text-right py-2 px-2 font-semibold text-slate-700">Supplier Price</th>
                        <th className="text-right py-2 px-2 font-semibold text-slate-700">Variance</th>
                        <th className="text-right py-2 px-2 font-semibold text-slate-700">Variance %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bomVsSupplierData.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="py-2 px-2 font-medium text-indigo-600">{item?.prId}</td>
                          <td className="py-2 px-2">{item?.toolNumber}</td>
                          <td className="py-2 px-2">{item?.partNumber}</td>
                          <td className="py-2 px-2 text-slate-600">{item?.supplier}</td>
                          <td className="py-2 px-2 text-right font-medium">₹{item?.bomTotal.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right font-medium">₹{item?.supplierPrice.toLocaleString()}</td>
                          <td className={`py-2 px-2 text-right font-semibold ${(item?.variance || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {(item?.variance || 0) >= 0 ? '+' : ''}₹{item?.variance.toLocaleString()}
                          </td>
                          <td className={`py-2 px-2 text-right font-semibold ${(item?.variancePercent || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {(item?.variancePercent || 0) >= 0 ? '+' : ''}{item?.variancePercent.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}
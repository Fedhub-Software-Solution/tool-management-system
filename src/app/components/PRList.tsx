import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, CheckCircle, XCircle, FileText, Trash2, AlertCircle, Clock, Award, Eye, Edit, Download, Search, Filter, X, Layers, DollarSign, Activity, FileDown, Star, ArrowUpDown, ArrowUp, ArrowDown, Send, ChevronDown } from "lucide-react";
import type { Project, PR, PRItem } from "./Dashboard";
import { CreatePRFormEnhanced } from "./CreatePRFormEnhanced";
import { apiService } from "../services/api";
import { 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Select as MuiSelect,
  InputAdornment,
  IconButton,
  Chip,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Menu
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { Pagination } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface PRListProps {
  prs?: PR[]; // Optional now, will fetch from API
  setPRs?: (prs: PR[]) => void; // Optional now
  projects: Project[];
  userRole: "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";
  suppliers?: { id: string; name: string; status: string }[];
  openCreatePRDirectly?: boolean;
  onCreatePRClose?: () => void;
}

export function PRList({ prs: prsProp, setPRs: setPRsProp, projects, userRole, suppliers = [], openCreatePRDirectly = false, onCreatePRClose }: PRListProps) {
  // Internal state for PRs fetched from API
  const [prs, setPRs] = useState<PR[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPRs, setTotalPRs] = useState(0);
  const [pagination, setPagination] = useState<any>(null);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCreatePRScreen, setShowCreatePRScreen] = useState(false);
  const [showEditPRScreen, setShowEditPRScreen] = useState(false);
  const [showViewPRScreen, setShowViewPRScreen] = useState(false);
  const [showReviewPRScreen, setShowReviewPRScreen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PR | null>(null);
  const [approvalComments, setApprovalComments] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [prTypeFilter, setPRTypeFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Export menu state
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const exportMenuOpen = Boolean(exportMenuAnchor);
  
  const [formData, setFormData] = useState({
    projectId: "",
    prType: "New Set" as "New Set" | "Modification" | "Refurbished",
    suppliers: [] as string[],
    supplierInput: "",
  });

  const [items, setItems] = useState<PRItem[]>([]);
  const [currentItem, setCurrentItem] = useState({
    name: "",
    specification: "",
    quantity: "",
    requirements: "",
  });

  // Transform backend PR data to frontend format
  const transformBackendPR = (backendPR: any): PR => {
    // Normalize pr_type: convert "NewSet" to "New Set", "Modification" stays same, etc.
    const normalizePRType = (prType: string): "New Set" | "Modification" | "Refurbished" => {
      if (!prType) return "New Set";
      const normalized = prType
        .replace(/NewSet/i, "New Set")
        .replace(/newset/i, "New Set")
        .replace(/Modificati/i, "Modification")
        .replace(/modificati/i, "Modification")
        .replace(/Refurbished/i, "Refurbished")
        .replace(/refurbished/i, "Refurbished");
      
      if (normalized === "New Set" || normalized === "Modification" || normalized === "Refurbished") {
        return normalized;
      }
      return "New Set"; // Default fallback
    };

    // Transform suppliers array - backend might have supplier objects
    const suppliersList = backendPR.suppliers?.map((s: any) => 
      typeof s === 'string' ? s : s.name || s.supplierCode || 'Unknown'
    ) || [];

    // Transform items - ensure we always have an array
    const items: PRItem[] = backendPR.items?.map((item: any) => ({
      id: item.id || `ITEM-${Date.now()}-${Math.random()}`,
      name: item.name || 'Unnamed Item',
      specification: item.specification || '',
      quantity: item.quantity || 0,
      requirements: item.requirements || '',
      price: item.bomUnitPrice || item.price || 0,
      itemCode: item.itemCode || item.item_code,
    })) || [];

    // Transform quotations if available
    const quotations = backendPR.quotations?.map((quot: any) => ({
      id: quot.id,
      prId: quot.prId || backendPR.id,
      supplier: typeof quot.supplier === 'string' ? quot.supplier : quot.supplier?.name || 'Unknown',
      price: quot.totalPrice || quot.price,
      items: quot.items || [],
      deliveryTerms: quot.deliveryTerms || '',
      deliveryDate: quot.deliveryDate || '',
      status: quot.status || 'Pending',
      notes: quot.notes || '',
    })) || [];

    // Transform critical spares
    const criticalSpares = backendPR.criticalSpares?.map((cs: any) => ({
      id: cs.prItemId || cs.id,
      quantity: cs.quantity,
    })) || [];

    return {
      id: backendPR.prNumber || backendPR.pr_number || backendPR.id,
      projectId: backendPR.projectId || backendPR.project_id || (backendPR.project?.id || ''),
      prType: normalizePRType(backendPR.prType || backendPR.pr_type),
      items,
      suppliers: suppliersList,
      status: (backendPR.status || 'Submitted') as PR['status'],
      createdBy: typeof backendPR.createdBy === 'string' 
        ? backendPR.createdBy 
        : backendPR.createdBy
        ? `${backendPR.createdBy?.firstName || ''} ${backendPR.createdBy?.lastName || ''}`.trim() || 'Unknown'
        : 'Unknown',
      createdAt: backendPR.createdAt || backendPR.created_at || new Date().toISOString(),
      approverComments: backendPR.approverComments || backendPR.approver_comments,
      quotations,
      awardedSupplier: typeof backendPR.awardedSupplier === 'string' 
        ? backendPR.awardedSupplier 
        : backendPR.awardedSupplier?.name || backendPR.awardedSupplier || backendPR.awarded_supplier,
      modRefReason: backendPR.modRefReason || backendPR.mod_ref_reason,
      criticalSpares,
      itemsReceivedDate: backendPR.itemsReceivedDate || backendPR.items_received_date,
    };
  };

  // Fetch PRs from API
  const fetchPRs = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filters: any = {
        page: currentPage,
        limit: itemsPerPage,
      };

      if (searchQuery) {
        filters.search = searchQuery;
      }

      if (statusFilter !== "All") {
        filters.status = statusFilter;
      }

      if (prTypeFilter !== "All") {
        filters.prType = prTypeFilter;
      }

      const response = await apiService.getPRs(filters);
      console.log('API Response:', response);
      console.log('Raw PRs data:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('Invalid response data format:', response);
        setError('Invalid data format received from server');
        setPRs([]);
        return;
      }
      
      const transformedPRs = response.data.map(transformBackendPR);
      console.log('Transformed PRs:', transformedPRs);
      
      setPRs(transformedPRs);
      setTotalPRs(response.pagination?.total || transformedPRs.length);
      setPagination(response.pagination);

      // Update parent if callback provided (for backward compatibility)
      if (setPRsProp) {
        setPRsProp(transformedPRs);
      }
    } catch (err) {
      console.error('Error fetching PRs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch PRs');
      setPRs([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch PRs on mount and when filters change
  useEffect(() => {
    fetchPRs();
  }, [currentPage, statusFilter, prTypeFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchPRs();
      } else {
        setCurrentPage(1); // Reset to first page on search
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Open Create PR screen directly when prop is set
  useEffect(() => {
    if (openCreatePRDirectly) {
      setShowCreatePRScreen(true);
    }
  }, [openCreatePRDirectly]);

  // Listen for navigation event to open PR view
  useEffect(() => {
    const handleOpenPRView = (event: Event) => {
      const customEvent = event as CustomEvent;
      const prId = customEvent.detail.prId as string;
      
      const pr = prs.find(p => p.id === prId);
      if (pr) {
        setSelectedPR(pr);
        setShowViewPRScreen(true);
      } else {
        // If PR not in current list, fetch it individually
        apiService.getPRById(prId).then(backendPR => {
          setSelectedPR(transformBackendPR(backendPR));
          setShowViewPRScreen(true);
        }).catch(err => {
          console.error('Error fetching PR:', err);
        });
      }
    };

    window.addEventListener('openPRView', handleOpenPRView);

    return () => {
      window.removeEventListener('openPRView', handleOpenPRView);
    };
  }, [prs]);

  const handleAddItem = () => {
    if (currentItem.name && currentItem.specification && currentItem.quantity) {
      const newItem: PRItem = {
        id: `ITEM-${Date.now()}`,
        name: currentItem.name,
        specification: currentItem.specification,
        quantity: parseInt(currentItem.quantity),
        requirements: currentItem.requirements,
      };
      setItems([...items, newItem]);
      setCurrentItem({
        name: "",
        specification: "",
        quantity: "",
        requirements: "",
      });
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAddSupplier = () => {
    if (formData.supplierInput && !formData.suppliers.includes(formData.supplierInput)) {
      setFormData({
        ...formData,
        suppliers: [...formData.suppliers, formData.supplierInput],
        supplierInput: "",
      });
    }
  };

  const handleCreatePR = async (formDataSubmit: any, itemsSubmit: PRItem[], criticalSpares: Array<{ id: string; quantity: number }>) => {
    try {
      // Transform critical spares format if needed
      const criticalSparesData = criticalSpares.map(cs => {
        // If cs is a string (item ID), convert to object format
        if (typeof cs === 'string') {
          const item = itemsSubmit.find(i => i.id === cs);
          return item ? { quantity: 1, notes: '' } : { quantity: 1, notes: '' };
        }
        return { quantity: cs.quantity, notes: '' };
      });

      const response = await apiService.createPR({
        projectId: formDataSubmit.projectId,
        prType: formDataSubmit.prType,
        modRefReason: formDataSubmit.modRefReason || undefined,
        items: itemsSubmit.map(item => ({
          itemCode: (item as any).itemCode,
          name: item.name,
          specification: item.specification,
          quantity: item.quantity,
          requirements: item.requirements,
          bomUnitPrice: item.price,
        })),
        supplierIds: formDataSubmit.suppliers.filter((s: string) => {
          // If supplier is an ID string, use it; otherwise find ID from name
          const supplier = suppliers.find(sup => sup.id === s || sup.name === s);
          return supplier?.id;
        }),
        criticalSpares: criticalSparesData.map((cs, idx) => ({
          quantity: cs.quantity,
          notes: cs.notes || '',
        })),
      });

      // Refresh the PR list and summary stats
      await fetchPRs();
      await fetchSummaryStats();
      setShowCreatePRScreen(false);
      if (onCreatePRClose) onCreatePRClose();
    } catch (err) {
      console.error('Error creating PR:', err);
      alert(err instanceof Error ? err.message : 'Failed to create PR');
    }
  };

  const handleUpdatePR = async (formDataSubmit: any, itemsSubmit: PRItem[], criticalSpares: Array<{ id: string; quantity: number }>) => {
    if (!selectedPR) return;

    try {
      const criticalSparesData = criticalSpares.map(cs => {
        if (typeof cs === 'string') {
          return { quantity: 1, notes: '' };
        }
        return { quantity: cs.quantity, notes: '' };
      });

      await apiService.updatePR(selectedPR.id, {
        prType: formDataSubmit.prType,
        modRefReason: formDataSubmit.modRefReason || undefined,
        items: itemsSubmit.map(item => ({
          itemCode: (item as any).itemCode,
          name: item.name,
          specification: item.specification,
          quantity: item.quantity,
          requirements: item.requirements,
          bomUnitPrice: item.price,
        })),
        supplierIds: formDataSubmit.suppliers.filter((s: string) => {
          const supplier = suppliers.find(sup => sup.id === s || sup.name === s);
          return supplier?.id;
        }),
        criticalSpares: criticalSparesData.map(cs => ({
          quantity: cs.quantity,
          notes: cs.notes || '',
        })),
      });

      // Refresh the PR list and summary stats
      await fetchPRs();
      await fetchSummaryStats();
      setShowEditPRScreen(false);
      setSelectedPR(null);
    } catch (err) {
      console.error('Error updating PR:', err);
      alert(err instanceof Error ? err.message : 'Failed to update PR');
    }
  };

  const handleSubmitForApproval = async (prId: string) => {
    try {
      // This might need a specific API endpoint if available
      // For now, we'll update the PR status through the update endpoint
      await apiService.updatePR(prId, {});
      await fetchPRs();
      await fetchSummaryStats();
    } catch (err) {
      console.error('Error submitting PR for approval:', err);
      alert(err instanceof Error ? err.message : 'Failed to submit PR for approval');
    }
  };

  const handleSubmitToSuppliers = async (prId: string) => {
    try {
      await apiService.sendToSuppliers(prId);
      await fetchPRs();
      await fetchSummaryStats();
    } catch (err) {
      console.error('Error sending PR to suppliers:', err);
      alert(err instanceof Error ? err.message : 'Failed to send PR to suppliers');
    }
  };

  const handleApprove = async () => {
    if (!selectedPR) return;

    try {
      await apiService.approvePR(selectedPR.id, approvalComments);
      await fetchPRs();
      await fetchSummaryStats();
      setApprovalDialogOpen(false);
      setSelectedPR(null);
      setApprovalComments("");
      setShowReviewPRScreen(false);
    } catch (err) {
      console.error('Error approving PR:', err);
      alert(err instanceof Error ? err.message : 'Failed to approve PR');
    }
  };

  const handleReject = async () => {
    if (!selectedPR) return;

    try {
      await apiService.rejectPR(selectedPR.id, approvalComments);
      await fetchPRs();
      await fetchSummaryStats();
      setApprovalDialogOpen(false);
      setSelectedPR(null);
      setApprovalComments("");
      setShowReviewPRScreen(false);
    } catch (err) {
      console.error('Error rejecting PR:', err);
      alert(err instanceof Error ? err.message : 'Failed to reject PR');
    }
  };

  const handleDeletePR = async (prId: string) => {
    if (!window.confirm("Are you sure you want to delete this PR?")) return;

    try {
      await apiService.deletePR(prId);
      await fetchPRs();
      await fetchSummaryStats();
    } catch (err) {
      console.error('Error deleting PR:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete PR');
    }
  };

  const handleViewPR = (pr: PR) => {
    setSelectedPR(pr);
    setShowViewPRScreen(true);
  };

  const handleDownloadPR = (pr: PR) => {
    const project = getProjectDetails(pr.projectId);
    const data = {
      pr,
      project,
      exportDate: new Date().toISOString(),
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${pr.id}_PR.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = (pr: PR) => {
    const project = getProjectDetails(pr.projectId);
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text("Purchase Requisition Details", 14, 20);

    // Add PR ID
    doc.setFontSize(12);
    doc.text(`PR ID: ${pr.id}`, 14, 30);

    // Add PR Type
    doc.text(`PR Type: ${pr.prType}`, 14, 40);

    // Add Status
    doc.text(`Status: ${pr.status}`, 14, 50);

    // Add Created Date
    doc.text(`Created: ${new Date(pr.createdAt).toLocaleString()}`, 14, 60);

    // Add Project Details
    if (project) {
      doc.text(`Customer PO: ${project.customerPO}`, 14, 70);
      doc.text(`Part Number: ${project.partNumber}`, 14, 80);
      doc.text(`Tool Number: ${project.toolNumber}`, 14, 90);
    }

    // Add Items Table
    const itemsTableData = pr.items.map(item => [
      item.name,
      item.specification,
      item.quantity.toString(),
      item.requirements || "N/A"
    ]);

    autoTable(doc, {
      head: [['Item Name', 'Specification', 'Quantity', 'Requirements']],
      body: itemsTableData,
      startY: 100,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [221, 221, 221],
        textColor: [0, 0, 0],
        lineWidth: 0.1
      }
    });

    // Add Suppliers
    if (pr.suppliers.length > 0) {
      doc.text("Suppliers:", 14, doc.autoTable.previous.finalY + 10);
      pr.suppliers.forEach((supplier, index) => {
        doc.text(supplier, 14, doc.autoTable.previous.finalY + 10 + (index * 5));
      });
    }

    // Add Approver Comments
    if (pr.approverComments) {
      doc.text("Approver Comments:", 14, doc.autoTable.previous.finalY + 10 + (pr.suppliers.length * 5));
      doc.text(pr.approverComments, 14, doc.autoTable.previous.finalY + 15 + (pr.suppliers.length * 5));
    }

    // Save PDF
    doc.save(`${pr.id}_PR.pdf`);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setPRTypeFilter("All");
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, set to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 inline opacity-40" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 ml-1 inline text-blue-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 ml-1 inline text-blue-600" />
    );
  };

  // Export menu handlers
  const handleExportMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setExportMenuAnchor(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };

  const handleExportCSV = () => {
    handleExportMenuClose();
    if (filteredPRs.length === 0) {
      alert("No data to export");
      return;
    }

    const dataToExport = filteredPRs.map((pr) => {
      const project = getProjectDetails(pr.projectId);
      return {
        "PR ID": pr.id,
        "PR Type": pr.prType,
        "Project ID": project?.id || "",
        "Customer PO": project?.customerPO || "",
        "Part Number": project?.partNumber || "",
        "Tool Number": project?.toolNumber || "",
        "Items Count": pr.items.length,
        "Suppliers Count": pr.suppliers.length,
        "Status": pr.status,
        "Created By": pr.createdBy,
        "Created At": new Date(pr.createdAt).toLocaleDateString(),
      };
    });

    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `PRs_Export_${timestamp}_${filteredPRs.length}_records.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPDF = () => {
    handleExportMenuClose();
    if (filteredPRs.length === 0) {
      alert("No data to export");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Purchase Requisitions Export", 14, 20);
    doc.setFontSize(12);
    doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total PRs: ${filteredPRs.length}`, 14, 40);

    const dataToExport = filteredPRs.map((pr) => {
      const project = getProjectDetails(pr.projectId);
      return [
        pr.id,
        pr.prType,
        project?.customerPO || "",
        project?.partNumber || "",
        pr.items.length.toString(),
        pr.suppliers.length.toString(),
        pr.status,
        new Date(pr.createdAt).toLocaleDateString(),
      ];
    });

    autoTable(doc, {
      head: [['PR ID', 'PR Type', 'Customer PO', 'Part Number', 'Items', 'Suppliers', 'Status', 'Created']],
      body: dataToExport,
      startY: 50,
      theme: 'grid',
      styles: {
        fontSize: 9,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [221, 221, 221],
        textColor: [0, 0, 0],
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        lineWidth: 0.1,
        lineColor: [0, 0, 0],
      },
    });

    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`PRs_Export_${timestamp}_${filteredPRs.length}_records.pdf`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-yellow-500";
      case "Approved":
        return "bg-green-500";
      case "Sent To Supplier":
        return "bg-blue-500";
      case "Evaluation Pending":
        return "bg-purple-500";
      case "Submitted for Approval":
        return "bg-indigo-500";
      case "Awarded":
        return "bg-emerald-600";
      default:
        return "bg-gray-500";
    }
  };

  const getProjectDetails = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  // Fetch summary statistics (all PRs for KPI calculations)
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    awarded: 0,
    evaluationPending: 0,
    submittedForApproval: 0,
    rejected: 0,
    newBudget: 0,
    modificationBudget: 0,
    refurbishedBudget: 0,
  });

  // Function to fetch summary stats - can be called after mutations
  const fetchSummaryStats = async () => {
    try {
      // Fetch all PRs without pagination for summary stats
      const response = await apiService.getPRs({ limit: 1000 });
      const allPRs = response.data.map(transformBackendPR);

      // Calculate stats
      const total = allPRs.length;
      const approved = allPRs.filter(pr => pr.status === "Approved").length;
      const pending = allPRs.filter(pr => pr.status === "Submitted" || pr.status === "Submitted for Approval").length;
      const awarded = allPRs.filter(pr => pr.status === "Awarded").length;
      const evaluationPending = allPRs.filter(pr => pr.status === "Evaluation Pending").length;
      const submittedForApproval = allPRs.filter(pr => pr.status === "Submitted for Approval").length;
      const rejected = allPRs.filter(pr => pr.status === "Rejected").length;

      // Calculate budgets from actual PR items prices
      const newBudget = allPRs
        .filter(pr => pr.prType === "New Set")
        .reduce((sum, pr) => {
          // Calculate total from PR items
          const itemsTotal = pr.items.reduce((itemSum, item) => {
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 0;
            return itemSum + (itemPrice * itemQuantity);
          }, 0);
          return sum + itemsTotal;
        }, 0);

      const modificationBudget = allPRs
        .filter(pr => pr.prType === "Modification")
        .reduce((sum, pr) => {
          // Calculate total from PR items
          const itemsTotal = pr.items.reduce((itemSum, item) => {
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 0;
            return itemSum + (itemPrice * itemQuantity);
          }, 0);
          return sum + itemsTotal;
        }, 0);

      const refurbishedBudget = allPRs
        .filter(pr => pr.prType === "Refurbished")
        .reduce((sum, pr) => {
          // Calculate total from PR items
          const itemsTotal = pr.items.reduce((itemSum, item) => {
            const itemPrice = item.price || 0;
            const itemQuantity = item.quantity || 0;
            return itemSum + (itemPrice * itemQuantity);
          }, 0);
          return sum + itemsTotal;
        }, 0);

      setSummaryStats({
        total,
        approved,
        pending,
        awarded,
        evaluationPending,
        submittedForApproval,
        rejected,
        newBudget,
        modificationBudget,
        refurbishedBudget,
      });
    } catch (err) {
      console.error('Error fetching summary stats:', err);
    }
  };

  // Fetch summary stats on mount and after mutations
  useEffect(() => {
    fetchSummaryStats();
  }, []); // Fetch on mount

  // Also refresh summary stats after successful mutations
  useEffect(() => {
    if (prs.length > 0) {
      fetchSummaryStats();
    }
  }, [prs.length]); // Re-fetch when PRs list changes

  // Since filtering is done server-side, we use prs directly
  const filteredPRs = prs; // Already filtered by API

  // Client-side sorting (can be moved to server-side later)
  const sortedPRs = [...filteredPRs].sort((a, b) => {
    if (!sortColumn) return 0;
    
    let aValue: any;
    let bValue: any;

    // Handle custom sorting columns
    if (sortColumn === 'project') {
      const aProject = getProjectDetails(a.projectId);
      const bProject = getProjectDetails(b.projectId);
      aValue = aProject?.customerPO || '';
      bValue = bProject?.customerPO || '';
    } else if (sortColumn === 'items') {
      aValue = a.items.length;
      bValue = b.items.length;
    } else if (sortColumn === 'suppliers') {
      aValue = a.suppliers.length;
      bValue = b.suppliers.length;
    } else {
      aValue = a[sortColumn as keyof PR];
      bValue = b[sortColumn as keyof PR];
    }

    // Sort based on type
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    return sortDirection === 'asc' ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number);
  });

  // Use API pagination
  const totalPages = pagination?.totalPages || Math.ceil(totalPRs / itemsPerPage);
  const paginatedPRs = sortedPRs; // Already paginated by API

  // Use summary stats for KPIs
  const {
    total: totalPRsCount,
    approved: approvedPRs,
    pending: pendingApproval,
    awarded: awardedPRs,
    evaluationPending,
    submittedForApproval,
    rejected: rejectedPRs,
    newBudget: newPRBudget,
    modificationBudget: modificationPRBudget,
    refurbishedBudget: refurbishedPRBudget,
  } = summaryStats;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {showCreatePRScreen ? (
        // Create PR Full Screen View
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Create Purchase Requisition</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Create a new PR for tool manufacturing or modification
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreatePRScreen(false);
                  if (onCreatePRClose) onCreatePRClose();
                }}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>

          {/* Form Content - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-smart">
            <div className="max-w-6xl mx-auto p-6">
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  <CreatePRFormEnhanced
                    projects={projects}
                    suppliers={suppliers}
                    userRole={userRole}
                    onSubmit={(formDataSubmit, itemsSubmit, criticalSpares) => {
                      handleCreatePR(formDataSubmit, itemsSubmit, criticalSpares);
                      setShowCreatePRScreen(false);
                      if (onCreatePRClose) onCreatePRClose();
                    }}
                    onCancel={() => {
                      setShowCreatePRScreen(false);
                      if (onCreatePRClose) onCreatePRClose();
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : showEditPRScreen ? (
        // Edit PR Full Screen View
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Edit Purchase Requisition</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Update PR details - {selectedPR?.id}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditPRScreen(false);
                  setSelectedPR(null);
                }}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>

          {/* Form Content - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-smart">
            <div className="max-w-6xl mx-auto p-6">
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  {selectedPR && (
                    <CreatePRFormEnhanced
                      projects={projects}
                      suppliers={suppliers}
                      userRole={userRole}
                      initialData={{
                        projectId: selectedPR.projectId,
                        prType: selectedPR.prType,
                        suppliers: selectedPR.suppliers,
                        items: selectedPR.items,
                        criticalSpares: selectedPR.criticalSpares || [],
                        modRefReason: selectedPR.modRefReason || "",
                      }}
                      isEditMode={true}
                      onSubmit={(formDataSubmit, itemsSubmit, criticalSpares) => {
                        handleUpdatePR(formDataSubmit, itemsSubmit, criticalSpares);
                      }}
                      onCancel={() => {
                        setShowEditPRScreen(false);
                        setSelectedPR(null);
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : showViewPRScreen ? (
        // View PR Full Screen View (Read-Only)
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">View Purchase Requisition</h2>
                <p className="text-sm text-slate-600 mt-1">
                  PR Details - {selectedPR?.id} (Read-Only)
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowViewPRScreen(false);
                  setSelectedPR(null);
                }}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Close
              </Button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-smart">
            <div className="max-w-6xl mx-auto p-6">
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  {selectedPR && (
                    <CreatePRFormEnhanced
                      projects={projects}
                      suppliers={suppliers}
                      userRole={userRole}
                      initialData={{
                        projectId: selectedPR.projectId,
                        prType: selectedPR.prType,
                        suppliers: selectedPR.suppliers,
                        items: selectedPR.items,
                        criticalSpares: selectedPR.criticalSpares || [],
                        modRefReason: selectedPR.modRefReason || "",
                      }}
                      isEditMode={false}
                      isViewMode={true}
                      onSubmit={() => {}}
                      onCancel={() => {
                        setShowViewPRScreen(false);
                        setSelectedPR(null);
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : showReviewPRScreen ? (
        // Review PR Full Screen View (Approver)
        <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
          {/* Header */}
          <div className="px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Review Purchase Requisition</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Review and approve/reject PR - {selectedPR?.id}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReviewPRScreen(false);
                  setSelectedPR(null);
                  setApprovalComments("");
                }}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto scrollbar-smart">
            <div className="max-w-6xl mx-auto p-6">
              <Card className="shadow-lg">
                <CardContent className="p-6">
                  {selectedPR && (
                    <>
                      {/* PR Details in View Mode */}
                      <CreatePRFormEnhanced
                        projects={projects}
                        userRole={userRole}
                        initialData={{
                          projectId: selectedPR.projectId,
                          prType: selectedPR.prType,
                          suppliers: selectedPR.suppliers,
                          items: selectedPR.items,
                          criticalSpares: selectedPR.criticalSpares || [],
                        }}
                        isEditMode={false}
                        isViewMode={true}
                        onSubmit={() => {}}
                        onCancel={() => {}}
                      />

                      {/* Approval Section */}
                      <div className="mt-8 pt-6 border-t-2 border-slate-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Approval Decision</h3>
                        
                        {/* Comments Section */}
                        <div className="mb-6">
                          <Label htmlFor="approver-comments" className="text-sm font-semibold mb-2 block">
                            Comments / Feedback
                          </Label>
                          <Textarea
                            id="approver-comments"
                            value={approvalComments}
                            onChange={(e) => setApprovalComments(e.target.value)}
                            placeholder="Enter your comments or feedback about this PR..."
                            rows={4}
                            className="w-full"
                          />
                        </div>

                        {/* Approve/Reject Buttons */}
                        <div className="flex gap-4">
                          <Button
                            onClick={() => {
                              handleApprove();
                              setShowReviewPRScreen(false);
                            }}
                            disabled={selectedPR?.status === "Awarded"}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-base font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Approve PR
                          </Button>
                          <Button
                            onClick={() => {
                              handleReject();
                              setShowReviewPRScreen(false);
                            }}
                            disabled={selectedPR?.status === "Awarded"}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-6 text-base font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-5 h-5 mr-2" />
                            Reject PR
                          </Button>
                        </div>
                        {selectedPR?.status === "Awarded" && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                            ℹ️ This PR has already been awarded and cannot be modified.
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        // PR List View
        <>
          {/* KPI Metrics Bar - Fixed */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-1.5 border-b border-slate-200/60 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <h2 className="text-sm font-bold leading-tight">Purchase Requisitions</h2>
                <p className="text-[9px] text-muted-foreground leading-tight">
                  Create and manage purchase requisitions
                </p>
              </div>
            </div>

            {/* KPI Circular Cards */}
            {userRole === "NPD" ? (
              // NPD User KPIs - Status-based metrics
              <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                {/* Total PRs */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-blue-600 rounded-full shadow-sm">
                      <FileText className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{totalPRsCount}</div>
                    <p className="text-[10px] text-blue-700 mt-0.5 font-semibold">PRs</p>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-1.5 font-medium">Total PRs</p>
                </div>

                {/* Approved PRs */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-emerald-600 rounded-full shadow-sm">
                      <CheckCircle className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-emerald-600">{approvedPRs}</div>
                    <p className="text-[10px] text-emerald-700 mt-0.5 font-semibold">Approved</p>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-1.5 font-medium">Approved PRs</p>
                </div>

                {/* Pending for Approval */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-yellow-600 rounded-full shadow-sm">
                      <Clock className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">{pendingApproval}</div>
                    <p className="text-[10px] text-yellow-700 mt-0.5 font-semibold">Pending</p>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-1.5 font-medium">Pending Approval</p>
                </div>

                {/* Awarded PRs */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-purple-600 rounded-full shadow-sm">
                      <Award className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">{awardedPRs}</div>
                    <p className="text-[10px] text-purple-700 mt-0.5 font-semibold">Awarded</p>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-1.5 font-medium">Awarded PRs</p>
                </div>

                {/* Evaluation Pending */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-orange-600 rounded-full shadow-sm">
                      <AlertCircle className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-orange-600">{evaluationPending}</div>
                    <p className="text-[10px] text-orange-700 mt-0.5 font-semibold">Evaluation</p>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-1.5 font-medium">Evaluation Pending</p>
                </div>

                {/* Submitted for Approval */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-indigo-600 rounded-full shadow-sm">
                      <Send className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-indigo-600">{submittedForApproval}</div>
                    <p className="text-[10px] text-indigo-700 mt-0.5 font-semibold">Submitted</p>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-1.5 font-medium">Submitted for Approval</p>
                </div>

                {/* Rejected PRs */}
                <div className="flex flex-col items-center">
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-red-100 to-rose-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-red-600 rounded-full shadow-sm">
                      <XCircle className="w-3 h-3 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{rejectedPRs}</div>
                    <p className="text-[10px] text-red-700 mt-0.5 font-semibold">Rejected</p>
                  </div>
                  <p className="text-[9px] text-slate-600 mt-1.5 font-medium">Rejected PRs</p>
                </div>
              </div>
            ) : (
              // Approver User KPIs - Budget-based metrics
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                {/* Total PRs */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-blue-600 rounded-full shadow-sm">
                      <FileText className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-blue-600">{totalPRsCount}</div>
                    <p className="text-[11px] text-blue-700 mt-0.5 font-semibold">PRs</p>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5 font-medium">Total</p>
                </div>

                {/* New PRs Budget */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-violet-600 rounded-full shadow-sm">
                      <Layers className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-xl font-bold text-violet-600">₹{(newPRBudget / 1000).toFixed(0)}K</div>
                    <p className="text-[11px] text-violet-700 mt-0.5 font-semibold">New PRs</p>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5 font-medium">Budget</p>
                </div>

                {/* Modification PRs Budget */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-sky-600 rounded-full shadow-sm">
                      <Edit className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-xl font-bold text-sky-600">₹{(modificationPRBudget / 1000).toFixed(0)}K</div>
                    <p className="text-[11px] text-sky-700 mt-0.5 font-semibold">Modification</p>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5 font-medium">Budget</p>
                </div>

                {/* Refurbished PRs Budget */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-green-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-emerald-600 rounded-full shadow-sm">
                      <Activity className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-xl font-bold text-emerald-600">₹{(refurbishedPRBudget / 1000).toFixed(0)}K</div>
                    <p className="text-[11px] text-emerald-700 mt-0.5 font-semibold">Refurbished</p>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5 font-medium">Budget</p>
                </div>

                {/* Pending Approval */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-100 to-amber-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-yellow-600 rounded-full shadow-sm">
                      <Clock className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-yellow-600">{pendingApproval}</div>
                    <p className="text-[11px] text-yellow-700 mt-0.5 font-semibold">Pending</p>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5 font-medium">For Approval</p>
                </div>

                {/* Submitted for Approval */}
                <div className="flex flex-col items-center">
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                    <div className="absolute -top-1 -right-1 p-1.5 bg-indigo-600 rounded-full shadow-sm">
                      <Send className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-indigo-600">{submittedForApproval}</div>
                    <p className="text-[11px] text-indigo-700 mt-0.5 font-semibold">Submitted</p>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1.5 font-medium">For Approval</p>
                </div>
              </div>
            )}
          </div>

          {/* Filters Section - Fixed, Not Scrollable */}
          <div className="px-6 pt-3 pb-2 bg-white border-b border-slate-200">
            <Paper 
              elevation={3} 
              sx={{ 
                p: 1.5, 
                background: 'linear-gradient(135deg, #ffffff 0%, #e0e7ff 100%)',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                {/* Left Side: Filters */}
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flex: 1 }}>
                  {/* Search Field */}
                  <TextField
                    placeholder="Search PRs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: '#6b7280', fontSize: 18 }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setSearchQuery("")}
                            edge="end"
                            sx={{ p: 0.3 }}
                          >
                            <ClearIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    variant="outlined"
                    size="small"
                    sx={{
                      width: '280px',
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        fontSize: '0.8rem',
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4f46e5',
                          },
                        },
                        '&.Mui-focused': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4f46e5',
                          },
                        },
                      },
                    }}
                  />

                  {/* Status Filter */}
                  <FormControl 
                    size="small"
                    sx={{
                      width: '140px',
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        fontSize: '0.8rem',
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4f46e5',
                          },
                        },
                        '&.Mui-focused': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4f46e5',
                          },
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.8rem',
                      },
                    }}
                  >
                    <InputLabel>Status</InputLabel>
                    <MuiSelect
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="Status"
                    >
                      <MenuItem value="All">All Status</MenuItem>
                      <MenuItem value="Submitted">Submitted</MenuItem>
                      <MenuItem value="Approved">Approved</MenuItem>
                      <MenuItem value="Sent To Supplier">Sent To Supplier</MenuItem>
                      <MenuItem value="Evaluation Pending">Evaluation Pending</MenuItem>
                      <MenuItem value="Submitted for Approval">Submitted for Approval</MenuItem>
                      <MenuItem value="Awarded">Awarded</MenuItem>
                    </MuiSelect>
                  </FormControl>

                  {/* PR Type Filter */}
                  <FormControl 
                    size="small"
                    sx={{
                      width: '140px',
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        fontSize: '0.8rem',
                        '&:hover': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4f46e5',
                          },
                        },
                        '&.Mui-focused': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#4f46e5',
                          },
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.8rem',
                      },
                    }}
                  >
                    <InputLabel>PR Type</InputLabel>
                    <MuiSelect
                      value={prTypeFilter}
                      onChange={(e) => setPRTypeFilter(e.target.value)}
                      label="PR Type"
                    >
                      <MenuItem value="All">All Types</MenuItem>
                      <MenuItem value="New Set">New Set</MenuItem>
                      <MenuItem value="Modification">Modification</MenuItem>
                      <MenuItem value="Refurbished">Refurbished</MenuItem>
                    </MuiSelect>
                  </FormControl>

                  {/* Clear Filters Button */}
                  {(searchQuery || statusFilter !== "All" || prTypeFilter !== "All") && (
                    <Tooltip title="Clear all filters">
                      <IconButton 
                        onClick={clearFilters}
                        size="small"
                        sx={{ 
                          backgroundColor: '#fef3c7',
                          '&:hover': {
                            backgroundColor: '#fde68a',
                          },
                        }}
                      >
                        <ClearIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  )}

                  {/* Reset Filters Button - Always visible */}
                  <Tooltip title="Reset all filters">
                    <span>
                      <Button 
                        onClick={clearFilters}
                        variant="outline"
                        size="sm"
                        className="h-9"
                        disabled={searchQuery === "" && statusFilter === "All" && prTypeFilter === "All"}
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        Reset
                      </Button>
                    </span>
                  </Tooltip>
                </Box>

                {/* Right Side: Export and Create PR Buttons */}
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  {/* Export Button with Dropdown Menu */}
                  <Tooltip title={filteredPRs.length === 0 ? "No data to export" : "Export data"}>
                    <span>
                      <Button
                        onClick={handleExportMenuClick}
                        disabled={filteredPRs.length === 0}
                        size="sm"
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg text-[11px] py-1.5 px-4 h-9 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FileDown className="w-3.5 h-3.5 mr-1.5" />
                        Export
                        <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </span>
                  </Tooltip>

                  {/* Export Menu */}
                  <Menu
                    anchorEl={exportMenuAnchor}
                    open={exportMenuOpen}
                    onClose={handleExportMenuClose}
                    MenuListProps={{
                      'aria-labelledby': 'export-button',
                    }}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem onClick={handleExportCSV} sx={{ fontSize: '0.8rem', py: 1, px: 2 }}>
                      <TableChartIcon sx={{ fontSize: '1rem', mr: 1.5, color: '#059669' }} />
                      Export as CSV
                    </MenuItem>
                    <MenuItem onClick={handleExportPDF} sx={{ fontSize: '0.8rem', py: 1, px: 2 }}>
                      <PictureAsPdfIcon sx={{ fontSize: '1rem', mr: 1.5, color: '#dc2626' }} />
                      Export as PDF
                    </MenuItem>
                  </Menu>

                  {/* Create PR Button - Only for NPD */}
                  {userRole === "NPD" && (
                    <Button 
                      size="sm"
                      onClick={() => setShowCreatePRScreen(true)}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg h-9"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create PR
                    </Button>
                  )}
                </Box>
              </Box>
            </Paper>
          </div>

          {/* Table and Pagination Area - Fixed Layout */}
          <div className="flex-1 flex flex-col px-6 py-3 bg-white overflow-hidden">
            {filteredPRs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No purchase requisitions found.</p>
                {(searchQuery || statusFilter !== "All" || prTypeFilter !== "All") && (
                  <p className="text-sm mt-2">Try adjusting your filters</p>
                )}
              </div>
            ) : (
              <>
                {isLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>Loading purchase requisitions...</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-12 text-red-600">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Error: {error}</p>
                    <Button onClick={fetchPRs} className="mt-4">Retry</Button>
                  </div>
                ) : paginatedPRs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No purchase requisitions found.</p>
                    {(searchQuery || statusFilter !== "All" || prTypeFilter !== "All") && (
                      <p className="text-sm mt-2">Try adjusting your filters</p>
                    )}
                  </div>
                ) : (
                  <>
                  <Paper elevation={3} sx={{ borderRadius: 2, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    {/* Fixed Table Header */}
                    <TableContainer sx={{ flex: 0, overflow: 'visible' }}>
                      <Table sx={{ minWidth: 650, tableLayout: 'fixed' }} size="small">
                        <colgroup>
                          <col style={{ width: '10%' }} />
                          <col style={{ width: '15%' }} />
                          <col style={{ width: '10%' }} />
                          <col style={{ width: '10%' }} />
                          <col style={{ width: '8%' }} />
                          <col style={{ width: '12%' }} />
                          <col style={{ width: '10%' }} />
                          <col style={{ width: '25%' }} />
                        </colgroup>
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f8fafc' }}>
                          <TableCell 
                            onClick={() => handleSort('id')}
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: '0.75rem', 
                              color: '#1e293b', 
                              bgcolor: '#f8fafc', 
                              py: 0.75,
                              cursor: 'pointer',
                              userSelect: 'none',
                              '&:hover': { backgroundColor: '#e2e8f0' }
                            }}
                          >
                            <div className="flex items-center">
                              PR ID
                              {renderSortIcon('id')}
                            </div>
                          </TableCell>
                          <TableCell 
                            onClick={() => handleSort('project')}
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: '0.75rem', 
                              color: '#1e293b', 
                              bgcolor: '#f8fafc', 
                              py: 0.75,
                              cursor: 'pointer',
                              userSelect: 'none',
                              '&:hover': { backgroundColor: '#e2e8f0' }
                            }}
                          >
                            <div className="flex items-center">
                              Project
                              {renderSortIcon('project')}
                            </div>
                          </TableCell>
                          <TableCell 
                            onClick={() => handleSort('prType')}
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: '0.75rem', 
                              color: '#1e293b', 
                              bgcolor: '#f8fafc', 
                              py: 0.75,
                              cursor: 'pointer',
                              userSelect: 'none',
                              '&:hover': { backgroundColor: '#e2e8f0' }
                            }}
                          >
                            <div className="flex items-center">
                              PR Type
                              {renderSortIcon('prType')}
                            </div>
                          </TableCell>
                          <TableCell 
                            onClick={() => handleSort('items')}
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: '0.75rem', 
                              color: '#1e293b', 
                              bgcolor: '#f8fafc', 
                              py: 0.75,
                              cursor: 'pointer',
                              userSelect: 'none',
                              '&:hover': { backgroundColor: '#e2e8f0' }
                            }}
                          >
                            <div className="flex items-center">
                              Items
                              {renderSortIcon('items')}
                            </div>
                          </TableCell>
                          <TableCell 
                            onClick={() => handleSort('suppliers')}
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: '0.75rem', 
                              color: '#1e293b', 
                              bgcolor: '#f8fafc', 
                              py: 0.75,
                              cursor: 'pointer',
                              userSelect: 'none',
                              '&:hover': { backgroundColor: '#e2e8f0' }
                            }}
                          >
                            <div className="flex items-center">
                              Suppliers
                              {renderSortIcon('suppliers')}
                            </div>
                          </TableCell>
                          <TableCell 
                            onClick={() => handleSort('status')}
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: '0.75rem', 
                              color: '#1e293b', 
                              bgcolor: '#f8fafc', 
                              py: 0.75,
                              cursor: 'pointer',
                              userSelect: 'none',
                              '&:hover': { backgroundColor: '#e2e8f0' }
                            }}
                          >
                            <div className="flex items-center">
                              Status
                              {renderSortIcon('status')}
                            </div>
                          </TableCell>
                          <TableCell 
                            onClick={() => handleSort('createdAt')}
                            sx={{ 
                              fontWeight: 700, 
                              fontSize: '0.75rem', 
                              color: '#1e293b', 
                              bgcolor: '#f8fafc', 
                              py: 0.75,
                              cursor: 'pointer',
                              userSelect: 'none',
                              '&:hover': { backgroundColor: '#e2e8f0' }
                            }}
                          >
                            <div className="flex items-center">
                              Created
                              {renderSortIcon('createdAt')}
                            </div>
                          </TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', bgcolor: '#f8fafc', py: 0.75 }}>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                    </Table>
                  </TableContainer>

                  {/* Scrollable Table Body */}
                  <TableContainer sx={{ flex: 1, overflow: 'auto' }} className="scrollbar-smart">
                    <Table sx={{ minWidth: 650, tableLayout: 'fixed' }} size="small">
                      <colgroup>
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '25%' }} />
                      </colgroup>
                      <TableBody>
                        {paginatedPRs.map((pr) => {
                          const project = getProjectDetails(pr.projectId);
                          return (
                            <TableRow 
                              key={pr.id}
                              sx={{ 
                                '&:hover': { backgroundColor: '#f1f5f9' },
                                transition: 'background-color 0.2s'
                              }}
                            >
                              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{pr.id}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                {project ? (
                                  <div>
                                    <div className="font-medium text-purple-600">
                                      {project.projectNumber || project.id}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {project.customerPO ? `${project.customerPO} • ${project.partNumber}` : project.partNumber}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                <Chip 
                                  label={pr.prType} 
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.65rem',
                                    height: '20px',
                                    backgroundColor: pr.prType === 'New Set' ? '#dbeafe' : pr.prType === 'Modification' ? '#fef3c7' : '#d1fae5',
                                    color: pr.prType === 'New Set' ? '#1e40af' : pr.prType === 'Modification' ? '#d97706' : '#047857'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{pr.items.length}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>{pr.suppliers.length}</TableCell>
                              <TableCell sx={{ fontSize: '0.75rem' }}>
                                <Chip 
                                  label={pr.status} 
                                  size="small"
                                  sx={{ 
                                    fontSize: '0.65rem',
                                    height: '20px',
                                    backgroundColor: 
                                      pr.status === 'Submitted' ? '#fef3c7' :
                                      pr.status === 'Approved' ? '#d1fae5' :
                                      pr.status === 'Sent To Supplier' ? '#dbeafe' :
                                      pr.status === 'Evaluation Pending' ? '#f3e8ff' :
                                      pr.status === 'Awarded' ? '#d1fae5' : '#e2e8f0',
                                    color:
                                      pr.status === 'Submitted' ? '#92400e' :
                                      pr.status === 'Approved' ? '#065f46' :
                                      pr.status === 'Sent To Supplier' ? '#1e40af' :
                                      pr.status === 'Evaluation Pending' ? '#6b21a8' :
                                      pr.status === 'Awarded' ? '#047857' : '#475569'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {new Date(pr.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                  {(userRole === "NPD" || userRole === "Approver") && (
                                    <Tooltip title="View PR">
                                      <IconButton 
                                        size="small"
                                        onClick={() => handleViewPR(pr)}
                                        sx={{ 
                                          color: '#3b82f6',
                                          '&:hover': { backgroundColor: '#dbeafe' }
                                        }}
                                      >
                                        <VisibilityIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  
                                  <Tooltip title="Download">
                                    <IconButton 
                                      size="small"
                                      onClick={() => handleDownloadPR(pr)}
                                      sx={{ 
                                        color: '#8b5cf6',
                                        '&:hover': { backgroundColor: '#ede9fe' }
                                      }}
                                    >
                                      <DownloadIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>

                                  {(userRole === "NPD" || userRole === "Approver") && (
                                    <Tooltip title={
                                      pr.status === "Awarded" ? "Cannot send awarded PR to suppliers" :
                                      pr.status === "Rejected" ? "Cannot send rejected PR to suppliers" :
                                      "Send to Suppliers"
                                    }>
                                      <span>
                                        <IconButton 
                                          size="small"
                                          disabled={pr.status === "Awarded" || pr.status === "Rejected"}
                                          onClick={() => handleSubmitToSuppliers(pr.id)}
                                          sx={{ 
                                            color: (pr.status === "Awarded" || pr.status === "Rejected") ? '#9ca3af' : '#10b981',
                                            '&:hover': { backgroundColor: (pr.status === "Awarded" || pr.status === "Rejected") ? 'transparent' : '#d1fae5' }
                                          }}
                                        >
                                          <CheckCircle className="w-4 h-4" />
                                        </IconButton>
                                      </span>
                                    </Tooltip>
                                  )}

                                  {(userRole === "NPD" || userRole === "Approver") && (
                                    <Tooltip title="Delete">
                                      <IconButton 
                                        size="small"
                                        onClick={() => handleDeletePR(pr.id)}
                                        sx={{ 
                                          color: '#ef4444',
                                          '&:hover': { backgroundColor: '#fee2e2' }
                                        }}
                                      >
                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>

                {/* Fixed Pagination - Below table */}
                {paginatedPRs.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 1.5, gap: 2, flexShrink: 0 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(event, value) => setCurrentPage(value)}
                      color="primary"
                      size="small"
                      showFirstButton
                      showLastButton
                      sx={{
                        '& .MuiPaginationItem-root': {
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          minWidth: '28px',
                          height: '28px',
                        },
                        '& .Mui-selected': {
                          bgcolor: '#4f46e5 !important',
                        }
                      }}
                    />
                    <Chip 
                      label={`Page ${currentPage} of ${totalPages} • ${pagination?.total || totalPRs} records`}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                    />
                  </Box>
                )}
                </>
              )}
              </>
            )}
          </div>

          {/* View Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-smart">
              <DialogHeader>
                <DialogTitle>Purchase Requisition Details</DialogTitle>
                <DialogDescription>
                  Complete information about the purchase requisition
                </DialogDescription>
              </DialogHeader>
              {selectedPR && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">PR ID</Label>
                      <p className="font-medium">{selectedPR.id}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">PR Type</Label>
                      <p className="font-medium">{selectedPR.prType}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <Badge className={`${getStatusColor(selectedPR.status)} mt-1`}>
                        {selectedPR.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Created</Label>
                      <p className="font-medium">{new Date(selectedPR.createdAt).toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Project Details</Label>
                    {getProjectDetails(selectedPR.projectId) && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm"><span className="font-medium">Customer PO:</span> {getProjectDetails(selectedPR.projectId)?.customerPO}</p>
                        <p className="text-sm"><span className="font-medium">Part Number:</span> {getProjectDetails(selectedPR.projectId)?.partNumber}</p>
                        <p className="text-sm"><span className="font-medium">Tool Number:</span> {getProjectDetails(selectedPR.projectId)?.toolNumber}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Items ({selectedPR.items.length})</Label>
                    <div className="space-y-2">
                      {selectedPR.items.map((item) => (
                        <div key={item.id} className="p-3 border rounded-lg">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">Specification: {item.specification}</p>
                          <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                          {item.requirements && (
                            <p className="text-sm text-muted-foreground">Requirements: {item.requirements}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Suppliers ({selectedPR.suppliers.length})</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedPR.suppliers.map((supplier, idx) => (
                        <Badge key={idx} variant="secondary">
                          {supplier}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {selectedPR.approverComments && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-2 block">Approver Comments</Label>
                      <p className="p-3 bg-amber-50 rounded-lg text-sm">{selectedPR.approverComments}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Approval Dialog */}
          <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Review Purchase Requisition</DialogTitle>
                <DialogDescription>
                  Review the purchase requisition and provide your comments.
                </DialogDescription>
              </DialogHeader>
              {selectedPR && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">PR ID: {selectedPR.id}</p>
                    <p className="text-sm text-muted-foreground">
                      Type: {selectedPR.prType}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comments">Comments</Label>
                    <Textarea
                      id="comments"
                      value={approvalComments}
                      onChange={(e) => setApprovalComments(e.target.value)}
                      placeholder="Enter your comments..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleApprove}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      onClick={handleReject}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
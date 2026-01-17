import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Calendar, DollarSign, Hash, FolderOpen, CheckCircle, Clock, Eye, Edit, Trash2, Download, Search, Filter, X, FileText, ArrowLeft, ArrowUpDown, AlertTriangle, Bell, PauseCircle, FileDown, ChevronDown, Loader2 } from "lucide-react";
import type { Project, PR } from "./Dashboard";
import { ProjectDetailView } from "./ProjectDetailView";
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
  TableSortLabel,
  Menu
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import { Pagination } from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import TableChartIcon from "@mui/icons-material/TableChart";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ProjectListProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  userRole: "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";
  prs: PR[];
}

// Transform backend project to frontend format
const transformProject = (backendProject: any): Project => {
  return {
    id: backendProject.id,
    projectNumber: backendProject.projectNumber,
    customerPO: backendProject.customerPO,
    partNumber: backendProject.partNumber,
    toolNumber: backendProject.toolNumber,
    price: parseFloat(backendProject.price),
    targetDate: backendProject.targetDate,
    status: backendProject.status,
    description: backendProject.description,
    createdBy: typeof backendProject.createdBy === 'object' 
      ? `${backendProject.createdBy.firstName} ${backendProject.createdBy.lastName}`
      : backendProject.createdBy || 'Unknown',
    createdAt: backendProject.createdAt,
    updatedAt: backendProject.updatedAt,
  };
};

type SortableKeys = 'id' | 'customerPO' | 'partNumber' | 'toolNumber' | 'createdAt' | 'targetDate' | 'status' | 'price';

export function ProjectList({ projects: parentProjects, setProjects: setParentProjects, userRole, prs }: ProjectListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [partNumberFilter, setPartNumberFilter] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState<{
    key: SortableKeys | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    customerPO: "",
    partNumber: "",
    toolNumber: "",
    price: "",
    targetDate: "",
  });

  // Fetch projects from API
  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      
      if (statusFilter !== "All") {
        filters.status = statusFilter;
      }
      
      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await apiService.getProjects(filters);
      const transformedProjects = response.data.map(transformProject);
      setParentProjects(transformedProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
      console.error('Error fetching projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, searchQuery, itemsPerPage, setParentProjects]);

  // Fetch projects on mount and when filters change
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSort = (key: SortableKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleCreateProject = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('=== handleCreateProject called ===');
    setIsLoading(true);
    setError(null);
    
    try {
      const newProjectData = {
        customerPO: formData.customerPO.trim(),
        partNumber: formData.partNumber.trim(),
        toolNumber: formData.toolNumber.trim(),
        price: parseFloat(formData.price),
        targetDate: formData.targetDate,
      };

      console.log('Creating project with data:', newProjectData);

      // Validate required fields
      if (!newProjectData.customerPO || !newProjectData.partNumber || !newProjectData.toolNumber || !newProjectData.price || !newProjectData.targetDate) {
        throw new Error('Please fill in all required fields');
      }

      if (isNaN(newProjectData.price) || newProjectData.price <= 0) {
        throw new Error('Please enter a valid price');
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(newProjectData.targetDate)) {
        throw new Error('Invalid date format');
      }

      const createdProject = await apiService.createProject(newProjectData);
      console.log('Project created successfully:', createdProject);
      
      // Refresh the project list
      await fetchProjects();
      // Also refresh parent projects for Dashboard stats
      try {
        const allProjectsResponse = await apiService.getProjects({ limit: 1000 });
        const allTransformedProjects = allProjectsResponse.data.map(transformProject);
        setParentProjects(allTransformedProjects);
      } catch (err) {
        console.error('Error refreshing parent projects:', err);
      }
      
      setIsDialogOpen(false);
      setFormData({
        customerPO: "",
        partNumber: "",
        toolNumber: "",
        price: "",
        targetDate: "",
      });
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      console.error('Error creating project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProject = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!selectedProject) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const updateData = {
        customerPO: formData.customerPO.trim(),
        partNumber: formData.partNumber.trim(),
        toolNumber: formData.toolNumber.trim(),
        price: parseFloat(formData.price),
        targetDate: formData.targetDate,
      };

      console.log('Updating project with data:', { id: selectedProject.id, ...updateData });

      // Validate required fields
      if (!updateData.customerPO || !updateData.partNumber || !updateData.toolNumber || updateData.price === undefined || !updateData.targetDate) {
        throw new Error('Please fill in all required fields');
      }

      if (isNaN(updateData.price) || updateData.price <= 0) {
        throw new Error('Please enter a valid price');
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(updateData.targetDate)) {
        throw new Error('Invalid date format');
      }

      const updatedProject = await apiService.updateProject(selectedProject.id, updateData);
      console.log('Project updated successfully:', updatedProject);
      
      // Refresh the project list
      await fetchProjects();
      // Also refresh parent projects for Dashboard stats
      try {
        const allProjectsResponse = await apiService.getProjects({ limit: 1000 });
        const allTransformedProjects = allProjectsResponse.data.map(transformProject);
        setParentProjects(allTransformedProjects);
      } catch (err) {
        console.error('Error refreshing parent projects:', err);
      }
      
      setIsEditDialogOpen(false);
      setSelectedProject(null);
      setFormData({
        customerPO: "",
        partNumber: "",
        toolNumber: "",
        price: "",
        targetDate: "",
      });
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      console.error('Error updating project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await apiService.deleteProject(projectId);
      // Refresh the project list
      await fetchProjects();
      // Also refresh parent projects for Dashboard stats
      try {
        const allProjectsResponse = await apiService.getProjects({ limit: 1000 });
        const allTransformedProjects = allProjectsResponse.data.map(transformProject);
        setParentProjects(allTransformedProjects);
      } catch (err) {
        console.error('Error refreshing parent projects:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      console.error('Error deleting project:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setViewMode('detail');
  };

  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    // Format date for input field (YYYY-MM-DD)
    const formatDateForInput = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    };
    
    setFormData({
      customerPO: project.customerPO || '',
      partNumber: project.partNumber || '',
      toolNumber: project.toolNumber || '',
      price: project.price ? project.price.toString() : '',
      targetDate: formatDateForInput(project.targetDate),
    });
    setIsEditDialogOpen(true);
  };

  const handleDownloadProject = (project: Project) => {
    const data = {
      "Project ID": project.projectNumber || project.id,
      "Customer PO": project.customerPO,
      "Part Number": project.partNumber,
      "Tool Number": project.toolNumber,
      "Price": `₹${project.price.toLocaleString()}`,
      "Target Date": new Date(project.targetDate).toLocaleDateString(),
      "Status": project.status,
      "Created By": typeof project.createdBy === 'string' ? project.createdBy : 'Unknown',
      "Created At": new Date(project.createdAt).toLocaleDateString(),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.projectNumber || project.id}_${project.customerPO}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setPartNumberFilter("All");
  };

  const handleExportProjects = () => {
    const dataToExport = filteredProjects.map((project) => ({
      "Project ID": project.projectNumber || project.id,
      "Customer PO": project.customerPO,
      "Part Number": project.partNumber,
      "Tool Number": project.toolNumber,
      ...(userRole === "Approver" && { "Price": `₹${project.price.toLocaleString()}` }),
      "Target Date": new Date(project.targetDate).toLocaleDateString(),
      "Status": project.status,
      "Created By": typeof project.createdBy === 'string' ? project.createdBy : 'Unknown',
      "Created At": new Date(project.createdAt).toLocaleDateString(),
    }));

    // Create CSV content
    if (dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = Object.keys(dataToExport[0]);
    const csvContent = [
      headers.join(","),
      ...dataToExport.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in values
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(",")
      )
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().split('T')[0];
    link.download = `Projects_Export_${timestamp}_${filteredProjects.length}_records.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportProjectsPDF = () => {
    const dataToExport = filteredProjects.map((project) => ({
      "Project ID": project.projectNumber || project.id,
      "Customer PO": project.customerPO,
      "Part Number": project.partNumber,
      "Tool Number": project.toolNumber,
      ...(userRole === "Approver" && { "Price": `₹${project.price.toLocaleString()}` }),
      "Target Date": new Date(project.targetDate).toLocaleDateString(),
      "Status": project.status,
      "Created By": typeof project.createdBy === 'string' ? project.createdBy : 'Unknown',
      "Created At": new Date(project.createdAt).toLocaleDateString(),
    }));

    // Create PDF content
    if (dataToExport.length === 0) {
      alert("No data to export");
      return;
    }

    const headers = Object.keys(dataToExport[0]);
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Projects Export", 14, 20);
    doc.setFontSize(12);
    doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total Projects: ${filteredProjects.length}`, 14, 40);

    // Add table
    autoTable(doc, {
      head: [headers],
      body: dataToExport.map(row => Object.values(row)),
      startY: 50,
      theme: 'grid',
      styles: {
        fontSize: 10,
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

    // Download PDF
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`Projects_Export_${timestamp}_${filteredProjects.length}_records.pdf`);
  };

  // Get unique part numbers for filter
  const uniquePartNumbers = Array.from(new Set(parentProjects.map(p => p.partNumber))).sort();

  // Filter projects
  let filteredProjects = parentProjects.filter(project => {
    const matchesSearch = 
      project.customerPO.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.projectNumber || project.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.toolNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || project.status === statusFilter;
    const matchesPartNumber = partNumberFilter === "All" || project.partNumber === partNumberFilter;

    return matchesSearch && matchesStatus && matchesPartNumber;
  });

  // Sort projects
  if (sortConfig.key) {
    filteredProjects = [...filteredProjects].sort((a, b) => {
      // For 'id' key, use projectNumber instead
      let aValue: any;
      let bValue: any;
      
      if (sortConfig.key === 'id') {
        aValue = a.projectNumber || a.id;
        bValue = b.projectNumber || b.id;
      } else {
        aValue = a[sortConfig.key!];
        bValue = b[sortConfig.key!];
      }
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  } else {
    // Default sort: newest projects first (by creation date descending)
    filteredProjects = [...filteredProjects].sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate; // Descending order (newest first)
    });
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "Completed":
        return "bg-blue-500";
      case "On Hold":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  // Calculate KPIs
  const totalProjects = parentProjects.length;
  const activeProjects = parentProjects.filter(p => p.status === "Active").length;
  const completedProjects = parentProjects.filter(p => p.status === "Completed").length;
  const totalBudget = parentProjects.reduce((sum, p) => sum + p.price, 0);
  const onHoldProjects = parentProjects.filter(p => p.status === "On Hold").length;
  
  // Calculate overdue projects (past target date and not completed)
  const today = new Date();
  const overdueProjects = parentProjects.filter(p => {
    const targetDate = new Date(p.targetDate);
    return targetDate < today && p.status !== "Completed";
  }).length;
  
  // Calculate upcoming deadlines (within next 7 days)
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  const upcomingDeadlines = parentProjects.filter(p => {
    const targetDate = new Date(p.targetDate);
    return targetDate >= today && targetDate <= nextWeek && p.status !== "Completed";
  }).length;

  // Show detail view if in detail mode
  if (viewMode === 'detail' && selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        prs={prs}
        userRole={userRole}
        onBack={() => setViewMode('list')}
        onDownload={handleDownloadProject}
        onNavigateToPR={(pr) => {
          // Navigate to PR view - will need to communicate with parent Dashboard
          // For now, we'll trigger an event that Dashboard can listen to
          window.dispatchEvent(new CustomEvent('navigateToPRView', { detail: { pr } }));
        }}
        onNavigateToQuotations={(pr) => {
          // Navigate to Quotations view with PR selected
          window.dispatchEvent(new CustomEvent('navigateToQuotations', { detail: { pr } }));
        }}
      />
    );
  }

  // Column definitions for NPD users (with Project ID and Tool#, no Edit)
  const npdColumns = userRole === "NPD" ? [
    { id: 'id', label: 'Project ID', width: '10%', sortable: true },
    { id: 'customerPO', label: 'PO #', width: '12%', sortable: true },
    { id: 'createdAt', label: 'Created Date', width: '12%', sortable: true },
    { id: 'partNumber', label: 'Part #', width: '10%', sortable: true },
    { id: 'toolNumber', label: 'Tool #', width: '10%', sortable: true },
    { id: 'targetDate', label: 'Target Date', width: '12%', sortable: true },
    { id: 'status', label: 'Status', width: '10%', sortable: true },
    { id: 'actions', label: 'Actions', width: '24%', sortable: false },
  ] : [];

  // Column definitions for Approver users (existing structure)
  const approverColumns = userRole === "Approver" ? [
    { id: 'id', label: 'Project ID', width: '12%', sortable: true },
    { id: 'customerPO', label: 'PO #', width: '13%', sortable: true },
    { id: 'createdAt', label: 'Created Date', width: '11%', sortable: true },
    { id: 'partNumber', label: 'Part #', width: '11%', sortable: true },
    { id: 'targetDate', label: 'Target Date', width: '11%', sortable: true },
    { id: 'status', label: 'Status', width: '10%', sortable: true },
    { id: 'price', label: 'Price', width: '10%', sortable: true },
    { id: 'actions', label: 'Actions', width: '22%', sortable: false },
  ] : [];

  const columns = userRole === "NPD" ? npdColumns : approverColumns;

  // Default list view
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* KPI Metrics Bar - Fixed */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-1.5 border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <h2 className="text-sm font-bold leading-tight">Projects</h2>
            <p className="text-[9px] text-muted-foreground leading-tight">
              Manage customer purchase order projects
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className={`grid gap-3 ${userRole === "Approver" ? "grid-cols-2 md:grid-cols-7" : "grid-cols-2 md:grid-cols-6"} justify-items-center`}>
          {/* Total Projects */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-violet-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
              <div className="absolute -top-1 -right-1 p-1.5 bg-purple-600 rounded-full shadow-sm">
                <FolderOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-3xl font-bold text-purple-600">{totalProjects}</div>
              <p className="text-[11px] text-purple-700 mt-0.5 font-semibold">Projects</p>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 font-medium">Total</p>
          </div>

          {/* Active Projects */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
              <div className="absolute -top-1 -right-1 p-1.5 bg-green-600 rounded-full shadow-sm">
                <Clock className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-3xl font-bold text-green-600">{activeProjects}</div>
              <p className="text-[11px] text-green-700 mt-0.5 font-semibold">Active</p>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 font-medium">In Progress</p>
          </div>

          {/* Completed Projects */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
              <div className="absolute -top-1 -right-1 p-1.5 bg-blue-600 rounded-full shadow-sm">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-3xl font-bold text-blue-600">{completedProjects}</div>
              <p className="text-[11px] text-blue-700 mt-0.5 font-semibold">Completed</p>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 font-medium">Finished</p>
          </div>

          {/* On Hold Projects - NEW */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-100 to-orange-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
              <div className="absolute -top-1 -right-1 p-1.5 bg-yellow-600 rounded-full shadow-sm">
                <PauseCircle className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-3xl font-bold text-yellow-600">{onHoldProjects}</div>
              <p className="text-[11px] text-yellow-700 mt-0.5 font-semibold">On Hold</p>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 font-medium">Paused</p>
          </div>

          {/* Overdue Projects - NEW */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-red-100 to-rose-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
              <div className="absolute -top-1 -right-1 p-1.5 bg-red-600 rounded-full shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-3xl font-bold text-red-600">{overdueProjects}</div>
              <p className="text-[11px] text-red-700 mt-0.5 font-semibold">Overdue</p>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 font-medium">Late</p>
          </div>

          {/* Upcoming Deadlines - NEW */}
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
              <div className="absolute -top-1 -right-1 p-1.5 bg-indigo-600 rounded-full shadow-sm">
                <Bell className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-3xl font-bold text-indigo-600">{upcomingDeadlines}</div>
              <p className="text-[11px] text-indigo-700 mt-0.5 font-semibold">Upcoming</p>
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5 font-medium">Next 7 Days</p>
          </div>

          {/* Total Budget - Only for Approver */}
          {userRole === "Approver" && (
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                <div className="absolute -top-1 -right-1 p-1.5 bg-amber-600 rounded-full shadow-sm">
                  <DollarSign className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-xl font-bold text-amber-600">₹{(totalBudget / 1000).toFixed(0)}K</div>
                <p className="text-[11px] text-amber-700 mt-0.5 font-semibold">Budget</p>
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5 font-medium">Total Planned</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters Section - Fixed, Not Scrollable */}
      {(userRole === "Approver" || userRole === "NPD") && (
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
                  placeholder="Search..."
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
                      '&.Mui-focused': {
                        color: '#4f46e5',
                      },
                    },
                  }}
                >
                  <InputLabel>Status</InputLabel>
                  <MuiSelect
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="All">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="All" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                      </Box>
                    </MenuItem>
                    <MenuItem value="Active">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="Active" size="small" sx={{ bgcolor: '#10b981', color: 'white', height: 18, fontSize: '0.65rem' }} />
                      </Box>
                    </MenuItem>
                    <MenuItem value="Completed">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="Completed" size="small" sx={{ bgcolor: '#3b82f6', color: 'white', height: 18, fontSize: '0.65rem' }} />
                      </Box>
                    </MenuItem>
                    <MenuItem value="On Hold">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="On Hold" size="small" sx={{ bgcolor: '#eab308', color: 'white', height: 18, fontSize: '0.65rem' }} />
                      </Box>
                    </MenuItem>
                  </MuiSelect>
                </FormControl>

                {/* Part Number Filter */}
                <FormControl 
                  size="small"
                  sx={{
                    width: '150px',
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
                      '&.Mui-focused': {
                        color: '#4f46e5',
                      },
                    },
                  }}
                >
                  <InputLabel>Part Number</InputLabel>
                  <MuiSelect
                    value={partNumberFilter}
                    label="Part Number"
                    onChange={(e) => setPartNumberFilter(e.target.value)}
                  >
                    <MenuItem value="All">All Parts</MenuItem>
                    {uniquePartNumbers.map((pn) => (
                      <MenuItem key={pn} value={pn}>
                        <Chip label={pn} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />
                      </MenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>

                {/* Results Counter Chip */}
                <Chip 
                  icon={<FilterListIcon sx={{ fontSize: '14px !important' }} />}
                  label={`${filteredProjects.length}/${totalProjects}`}
                  color="primary"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    bgcolor: 'white',
                    height: 26,
                    minWidth: 70
                  }}
                />

                {/* Reset Button */}
                <Tooltip title="Reset filters">
                  <span>
                    <IconButton
                      onClick={clearFilters}
                      disabled={!searchQuery && statusFilter === "All" && partNumberFilter === "All"}
                      sx={{
                        bgcolor: '#ef4444',
                        color: 'white',
                        width: 32,
                        height: 32,
                        '&:hover': { 
                          bgcolor: '#dc2626',
                        },
                        '&:disabled': {
                          bgcolor: '#e5e7eb',
                          color: '#9ca3af'
                        }
                      }}
                    >
                      <ClearIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>

              {/* Right Side: Export and Create Buttons */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                {/* Export Button with Dropdown - For both Approver and NPD */}
                <>
                  <Button
                    onClick={(e) => setExportMenuAnchor(e.currentTarget)}
                    disabled={filteredProjects.length === 0}
                    className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg text-[11px] py-1.5 px-4 h-8 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FileDown className="w-3.5 h-3.5 mr-1.5" />
                    Export
                    <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                  <Menu
                    anchorEl={exportMenuAnchor}
                    open={Boolean(exportMenuAnchor)}
                    onClose={() => setExportMenuAnchor(null)}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    PaperProps={{
                      sx: {
                        mt: 0.5,
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                        borderRadius: 1.5,
                        minWidth: 160,
                      }
                    }}
                  >
                    <MenuItem 
                      onClick={() => {
                        handleExportProjects();
                        setExportMenuAnchor(null);
                      }}
                      sx={{ 
                        fontSize: '0.8rem',
                        py: 1,
                        px: 2,
                        '&:hover': {
                          bgcolor: '#f0fdfa',
                        }
                      }}
                    >
                      <TableChartIcon sx={{ fontSize: 18, mr: 1.5, color: '#14b8a6' }} />
                      Export CSV
                    </MenuItem>
                    <MenuItem 
                      onClick={() => {
                        handleExportProjectsPDF();
                        setExportMenuAnchor(null);
                      }}
                      sx={{ 
                        fontSize: '0.8rem',
                        py: 1,
                        px: 2,
                        '&:hover': {
                          bgcolor: '#fef2f2',
                        }
                      }}
                    >
                      <PictureAsPdfIcon sx={{ fontSize: 18, mr: 1.5, color: '#ef4444' }} />
                      Export PDF
                    </MenuItem>
                  </Menu>
                </>

                {/* Create Button - Only for Approver */}
                {userRole === "Approver" && (
                  <>
                    <Button 
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg text-[11px] py-1.5 px-4 h-8 whitespace-nowrap"
                      onClick={() => {
                        console.log('=== Create Project button clicked ===');
                        setIsDialogOpen(true);
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Create Project
                    </Button>
                    
                    <Dialog 
                      open={isDialogOpen} 
                      onOpenChange={(open) => {
                        console.log('=== Dialog onOpenChange called ===', open);
                        setIsDialogOpen(open);
                        if (!open) {
                          setFormData({
                            customerPO: "",
                            partNumber: "",
                            toolNumber: "",
                            price: "",
                            targetDate: "",
                          });
                          setError(null);
                        }
                      }}
                    >
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create New Project</DialogTitle>
                          <DialogDescription>
                            Create a new project for customer purchase order
                          </DialogDescription>
                        </DialogHeader>
                        {error && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        )}
                        <form 
                          onSubmit={(e) => {
                            console.log('Form submit event triggered');
                            e.preventDefault();
                            e.stopPropagation();
                            handleCreateProject(e);
                          }} 
                          className="space-y-4"
                          noValidate
                        >
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="customerPO">Customer PO Number</Label>
                            <Input
                              id="customerPO"
                              value={formData.customerPO}
                              onChange={(e) =>
                                setFormData({ ...formData, customerPO: e.target.value })
                              }
                              placeholder="PO-2024-001"
                              required
                              disabled={isLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="partNumber">Part Number</Label>
                            <Input
                              id="partNumber"
                              value={formData.partNumber}
                              onChange={(e) =>
                                setFormData({ ...formData, partNumber: e.target.value })
                              }
                              placeholder="PN-12345"
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="toolNumber">Tool Number</Label>
                            <Input
                              id="toolNumber"
                              value={formData.toolNumber}
                              onChange={(e) =>
                                setFormData({ ...formData, toolNumber: e.target.value })
                              }
                              placeholder="TN-67890"
                              required
                              disabled={isLoading}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="price">Price (₹)</Label>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              value={formData.price}
                              onChange={(e) =>
                                setFormData({ ...formData, price: e.target.value })
                              }
                              placeholder="50000.00"
                              required
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="targetDate">Target Date</Label>
                          <Input
                            id="targetDate"
                            type="date"
                            value={formData.targetDate}
                            onChange={(e) =>
                              setFormData({ ...formData, targetDate: e.target.value })
                            }
                            required
                            disabled={isLoading}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsDialogOpen(false);
                              setError(null);
                            }}
                            disabled={isLoading}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="button"
                            disabled={isLoading}
                            onClick={(e) => {
                              console.log('=== Submit button clicked directly ===');
                              e.preventDefault();
                              e.stopPropagation();
                              handleCreateProject(e);
                            }}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                              </>
                            ) : (
                              'Create Project'
                            )}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                  </>
                )}
              </Box>
            </Box>
          </Paper>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="px-6 py-2 bg-red-50 border-l-4 border-red-500">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table and Pagination Area - Fixed Layout */}
      <div className="flex-1 flex flex-col px-6 py-3 bg-white overflow-hidden">
        {isLoading && parentProjects.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <p className="ml-3 text-muted-foreground">Loading projects...</p>
          </div>
        ) : parentProjects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No projects yet. Create your first project to get started.</p>
          </div>
        ) : (
          <>
            <Paper elevation={3} sx={{ borderRadius: 2, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Fixed Table Header */}
              <TableContainer sx={{ flex: 0, overflow: 'visible' }}>
                <Table sx={{ minWidth: 650, tableLayout: 'fixed' }} size="small">
                  <colgroup>
                    {columns.map((col) => (
                      <col key={col.id} style={{ width: col.width }} />
                    ))}
                  </colgroup>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      {columns.map((column) => (
                        <TableCell 
                          key={column.id}
                          align={column.id === 'actions' ? 'center' : 'left'}
                          sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', bgcolor: '#f8fafc', py: 0.75 }}
                        >
                          {column.sortable ? (
                            <TableSortLabel
                              active={sortConfig.key === column.id}
                              direction={sortConfig.key === column.id ? sortConfig.direction : 'asc'}
                              onClick={() => handleSort(column.id as SortableKeys)}
                              sx={{
                                '& .MuiTableSortLabel-icon': {
                                  fontSize: '0.875rem',
                                  opacity: 0.5,
                                },
                                '&.Mui-active .MuiTableSortLabel-icon': {
                                  opacity: 1,
                                  color: '#4f46e5',
                                },
                                '&:hover .MuiTableSortLabel-icon': {
                                  opacity: 0.7,
                                },
                              }}
                            >
                              {column.label}
                            </TableSortLabel>
                          ) : (
                            column.label
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                </Table>
              </TableContainer>

              {/* Scrollable Table Body */}
              <TableContainer sx={{ flex: 1, overflow: 'auto' }} className="scrollbar-smart">
                <Table sx={{ minWidth: 650, tableLayout: 'fixed' }} size="small">
                  <colgroup>
                    {columns.map((col) => (
                      <col key={col.id} style={{ width: col.width }} />
                    ))}
                  </colgroup>
                  <TableBody>
                    {filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((project) => (
                      <TableRow
                        key={project.id}
                        sx={{
                          '&:nth-of-type(odd)': { bgcolor: '#fafafa' },
                          '&:hover': { 
                            bgcolor: '#f1f5f9',
                            transition: 'background-color 0.2s'
                          },
                          borderLeft: '3px solid #9333ea'
                        }}
                      >
                        {/* Project ID - Show for both NPD and Approver */}
                        {(userRole === "NPD" || userRole === "Approver") && (
                          <TableCell sx={{ fontWeight: 600, color: userRole === "Approver" ? '#9333ea' : '#6b7280', fontSize: '0.75rem', py: 0.75 }}>
                            {project.projectNumber || project.id}
                          </TableCell>
                        )}
                        
                        <TableCell sx={{ fontWeight: 600, color: '#4f46e5', fontSize: '0.75rem', py: 0.75 }}>
                          {project.customerPO}
                        </TableCell>
                        <TableCell sx={{ color: '#64748b', fontSize: '0.75rem', py: 0.75 }}>
                          {new Date(project.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem', py: 0.75 }}>
                          {project.partNumber}
                        </TableCell>
                        
                        {/* NPD User - Show Tool # */}
                        {userRole === "NPD" && (
                          <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem', py: 0.75 }}>
                            {project.toolNumber}
                          </TableCell>
                        )}
                        
                        <TableCell sx={{ color: '#64748b', fontSize: '0.75rem', py: 0.75 }}>
                          {new Date(project.targetDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ py: 0.75 }}>
                          <Chip
                            label={project.status}
                            size="small"
                            sx={{
                              bgcolor: project.status === 'Active' ? '#10b981' : 
                                       project.status === 'Completed' ? '#3b82f6' : 
                                       project.status === 'On Hold' ? '#eab308' : '#6b7280',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              height: 20
                            }}
                          />
                        </TableCell>
                        {userRole === "Approver" && (
                          <TableCell sx={{ fontWeight: 600, color: '#f59e0b', fontSize: '0.75rem', py: 0.75 }}>
                            ₹{project.price.toLocaleString()}
                          </TableCell>
                        )}
                        <TableCell align="center" sx={{ py: 0.75 }}>
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                onClick={() => handleViewProject(project)}
                                sx={{
                                  bgcolor: '#64748b',
                                  color: 'white',
                                  '&:hover': { bgcolor: '#475569' },
                                  width: 26,
                                  height: 26
                                }}
                              >
                                <VisibilityIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                onClick={() => handleDownloadProject(project)}
                                sx={{
                                  bgcolor: '#10b981',
                                  color: 'white',
                                  '&:hover': { bgcolor: '#059669' },
                                  width: 26,
                                  height: 26
                                }}
                              >
                                <DownloadIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>

                            {/* Only show Edit for Approver, NOT for NPD */}
                            {userRole === "Approver" && (
                              <>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditClick(project)}
                                    sx={{
                                      bgcolor: '#3b82f6',
                                      color: 'white',
                                      '&:hover': { bgcolor: '#2563eb' },
                                      width: 26,
                                      height: 26
                                    }}
                                  >
                                    <EditIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="Delete">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteProject(project.id)}
                                    sx={{
                                      bgcolor: '#ef4444',
                                      color: 'white',
                                      '&:hover': { bgcolor: '#dc2626' },
                                      width: 26,
                                      height: 26
                                    }}
                                  >
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {filteredProjects.length === 0 && (
                  <Box sx={{ p: 8, textAlign: 'center', color: '#94a3b8' }}>
                    <p>No projects match your filters. Try adjusting your search criteria.</p>
                  </Box>
                )}
              </TableContainer>
            </Paper>

            {/* Fixed Pagination - Below table */}
            {filteredProjects.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 1.5, gap: 2, flexShrink: 0 }}>
                <Pagination
                  count={Math.ceil(filteredProjects.length / itemsPerPage)}
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
                  label={`Page ${currentPage} of ${Math.ceil(filteredProjects.length / itemsPerPage)}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                />
              </Box>
            )}
          </>
        )}
      </div>

      {/* Edit Project Dialog - Only for Approver */}
      {userRole === "Approver" && (
        <Dialog 
          open={isEditDialogOpen} 
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setSelectedProject(null);
              setFormData({
                customerPO: "",
                partNumber: "",
                toolNumber: "",
                price: "",
                targetDate: "",
              });
              setError(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update project details for {selectedProject?.customerPO}
              </DialogDescription>
            </DialogHeader>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleEditProject(e);
              }} 
              className="space-y-4"
              noValidate
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-customerPO">Customer PO Number</Label>
                  <Input
                    id="edit-customerPO"
                    value={formData.customerPO}
                    onChange={(e) =>
                      setFormData({ ...formData, customerPO: e.target.value })
                    }
                    placeholder="PO-2024-001"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-partNumber">Part Number</Label>
                  <Input
                    id="edit-partNumber"
                    value={formData.partNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, partNumber: e.target.value })
                    }
                    placeholder="PN-12345"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-toolNumber">Tool Number</Label>
                  <Input
                    id="edit-toolNumber"
                    value={formData.toolNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, toolNumber: e.target.value })
                    }
                    placeholder="TN-67890"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-price">Price (₹)</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="50000.00"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-targetDate">Target Date</Label>
                <Input
                  id="edit-targetDate"
                  type="date"
                  value={formData.targetDate}
                  onChange={(e) =>
                    setFormData({ ...formData, targetDate: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setSelectedProject(null);
                    setError(null);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="button"
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  disabled={isLoading}
                  onClick={(e) => {
                    console.log('=== Edit Submit button clicked ===');
                    e.preventDefault();
                    e.stopPropagation();
                    handleEditProject(e);
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
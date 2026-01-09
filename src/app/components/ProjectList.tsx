import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Calendar, DollarSign, Hash, FolderOpen, CheckCircle, Clock, Eye, Edit, Trash2, Download, Search, Filter, X, FileText, ArrowLeft, ArrowUpDown } from "lucide-react";
import type { Project, PR } from "./Dashboard";
import { ProjectDetailView } from "./ProjectDetailView";
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
  Tooltip
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DownloadIcon from "@mui/icons-material/Download";
import { Pagination } from "@mui/material";

interface ProjectListProps {
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  userRole: "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";
  prs: PR[];
}

export function ProjectList({ projects, setProjects, userRole, prs }: ProjectListProps) {
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
    key: keyof Project | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });
  
  const [formData, setFormData] = useState({
    customerPO: "",
    partNumber: "",
    toolNumber: "",
    price: "",
    targetDate: "",
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProject: Project = {
      id: `PRJ-${Date.now()}`,
      customerPO: formData.customerPO,
      partNumber: formData.partNumber,
      toolNumber: formData.toolNumber,
      price: parseFloat(formData.price),
      targetDate: formData.targetDate,
      status: "Active",
      createdBy: "Approver Team",
      createdAt: new Date().toISOString(),
    };

    setProjects([...projects, newProject]);
    setIsDialogOpen(false);
    setFormData({
      customerPO: "",
      partNumber: "",
      toolNumber: "",
      price: "",
      targetDate: "",
    });
  };

  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedProject) {
      const updatedProject: Project = {
        ...selectedProject,
        customerPO: formData.customerPO,
        partNumber: formData.partNumber,
        toolNumber: formData.toolNumber,
        price: parseFloat(formData.price),
        targetDate: formData.targetDate,
      };

      setProjects(projects.map(p => p.id === selectedProject.id ? updatedProject : p));
      setIsEditDialogOpen(false);
      setFormData({
        customerPO: "",
        partNumber: "",
        toolNumber: "",
        price: "",
        targetDate: "",
      });
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm("Are you sure you want to delete this project?")) {
      setProjects(projects.filter(p => p.id !== projectId));
    }
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setViewMode('detail');
  };

  const handleEditClick = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      customerPO: project.customerPO,
      partNumber: project.partNumber,
      toolNumber: project.toolNumber,
      price: project.price.toString(),
      targetDate: project.targetDate,
    });
    setIsEditDialogOpen(true);
  };

  const handleDownloadProject = (project: Project) => {
    const data = {
      "Project ID": project.id,
      "Customer PO": project.customerPO,
      "Part Number": project.partNumber,
      "Tool Number": project.toolNumber,
      "Price": `$${project.price.toLocaleString()}`,
      "Target Date": new Date(project.targetDate).toLocaleDateString(),
      "Status": project.status,
      "Created By": project.createdBy,
      "Created At": new Date(project.createdAt).toLocaleDateString(),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.id}_${project.customerPO}.json`;
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

  // Get unique part numbers for filter
  const uniquePartNumbers = Array.from(new Set(projects.map(p => p.partNumber))).sort();

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.customerPO.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.partNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.toolNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || project.status === statusFilter;
    const matchesPartNumber = partNumberFilter === "All" || project.partNumber === partNumberFilter;

    return matchesSearch && matchesStatus && matchesPartNumber;
  });

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
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === "Active").length;
  const completedProjects = projects.filter(p => p.status === "Completed").length;
  const totalBudget = projects.reduce((sum, p) => sum + p.price, 0);

  // Show detail view if in detail mode
  if (viewMode === 'detail' && selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        prs={prs}
        userRole={userRole}
        onBack={() => setViewMode('list')}
        onDownload={handleDownloadProject}
      />
    );
  }

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          {/* Total Budget */}
          {userRole === "Approver" && (
            <div className="flex flex-col items-center">
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 shadow-md flex flex-col items-center justify-center border-2 border-white">
                <div className="absolute -top-1 -right-1 p-1.5 bg-amber-600 rounded-full shadow-sm">
                  <DollarSign className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="text-xl font-bold text-amber-600">${(totalBudget / 1000).toFixed(0)}K</div>
                <p className="text-[11px] text-amber-700 mt-0.5 font-semibold">Budget</p>
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5 font-medium">Total Planned</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters Section - Fixed, Not Scrollable */}
      {userRole === "Approver" && (
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

              {/* Right Side: Create Button */}
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg text-[11px] py-1.5 px-4 h-8 whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Create Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Create a new project for customer purchase order
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateProject} className="space-y-4">
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
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price ($)</Label>
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
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Create Project</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </Box>
          </Paper>
        </div>
      )}

      {/* Table and Pagination Area - Fixed Layout */}
      <div className="flex-1 flex flex-col px-6 py-3 bg-white overflow-hidden">
        {projects.length === 0 ? (
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
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '10%' }} />
                    {userRole === "Approver" && <col style={{ width: '10%' }} />}
                    <col style={{ width: userRole === "Approver" ? '20%' : '30%' }} />
                  </colgroup>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', bgcolor: '#f8fafc', py: 0.75 }}>Project ID</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', bgcolor: '#f8fafc', py: 0.75 }}>PO #</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', bgcolor: '#f8fafc', py: 0.75 }}>Created Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', bgcolor: '#f8fafc', py: 0.75 }}>Part #</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', bgcolor: '#f8fafc', py: 0.75 }}>Target Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', bgcolor: '#f8fafc', py: 0.75 }}>Status</TableCell>
                      {userRole === "Approver" && (
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', bgcolor: '#f8fafc', py: 0.75 }}>Price</TableCell>
                      )}
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#1e293b', bgcolor: '#f8fafc', py: 0.75 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                </Table>
              </TableContainer>

              {/* Scrollable Table Body */}
              <TableContainer sx={{ flex: 1, overflow: 'auto' }} className="scrollbar-smart">
                <Table sx={{ minWidth: 650, tableLayout: 'fixed' }} size="small">
                  <colgroup>
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '10%' }} />
                    {userRole === "Approver" && <col style={{ width: '10%' }} />}
                    <col style={{ width: userRole === "Approver" ? '20%' : '30%' }} />
                  </colgroup>
                  <TableBody>
                    {filteredProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((project, index) => (
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
                        <TableCell sx={{ fontWeight: 600, color: '#9333ea', fontSize: '0.75rem', py: 0.75 }}>
                          {project.id}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, color: '#4f46e5', fontSize: '0.75rem', py: 0.75 }}>
                          {project.customerPO}
                        </TableCell>
                        <TableCell sx={{ color: '#64748b', fontSize: '0.75rem', py: 0.75 }}>
                          {new Date(project.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500, fontSize: '0.75rem', py: 0.75 }}>
                          {project.partNumber}
                        </TableCell>
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
                            ${project.price.toLocaleString()}
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

                            {(userRole === "Approver" || userRole === "NPD") && (
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
                                
                                {userRole === "Approver" && (
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
                                )}
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

      {/* Edit Project Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update project details for {selectedProject?.customerPO}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProject} className="space-y-4">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price ($)</Label>
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
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
                Save Changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
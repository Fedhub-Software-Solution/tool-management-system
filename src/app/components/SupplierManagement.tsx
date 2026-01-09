import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { 
  Plus, 
  Building2, 
  Edit, 
  Eye, 
  Trash2, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin,
  User,
  AlertCircle,
  ArrowLeft,
  FileText,
  Calendar,
  Package,
  TrendingUp,
  Users,
  Activity,
  ShoppingCart,
  Grid3x3,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Chip,
  IconButton,
  Tooltip,
  TextField,
  Box,
} from "@mui/material";
import type { PR, Project, PRItem } from "./Dashboard";
import { CreatePRFormEnhanced } from "./CreatePRFormEnhanced";

export interface Supplier {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  status: "Active" | "Inactive";
  category: string[];
  rating: number;
  totalOrders: number;
  createdAt: string;
  notes?: string;
}

interface SupplierManagementProps {
  suppliers: Supplier[];
  setSuppliers: (suppliers: Supplier[]) => void;
  userRole: "Approver" | "NPD";
  prs: PR[];
  projects: Project[];
}

export function SupplierManagement({ suppliers, setSuppliers, userRole, prs, projects }: SupplierManagementProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewScreen, setShowViewScreen] = useState(false);
  const [showPRDetailScreen, setShowPRDetailScreen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [selectedPR, setSelectedPR] = useState<PR | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>('code');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sorting handler
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Render sort icon
  const renderSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' ? 
      <ArrowUp className="w-3 h-3 ml-1 text-blue-600" /> : 
      <ArrowDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  const [formData, setFormData] = useState<Partial<Supplier>>({
    name: "",
    code: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gstin: "",
    status: "Active",
    category: [],
    rating: 0,
    notes: "",
  });

  const categories = [
    "Raw Materials",
    "Components",
    "Tools & Dies",
    "Machinery",
    "Spare Parts",
    "Services",
    "Packaging",
    "Chemicals",
  ];

  const handleAddSupplier = () => {
    const newSupplier: Supplier = {
      id: `SUP-${Date.now()}`,
      name: formData.name!,
      code: formData.code!,
      contactPerson: formData.contactPerson!,
      email: formData.email!,
      phone: formData.phone!,
      address: formData.address!,
      city: formData.city!,
      state: formData.state!,
      pincode: formData.pincode!,
      gstin: formData.gstin!,
      status: formData.status!,
      category: formData.category!,
      rating: 0,
      totalOrders: 0,
      createdAt: new Date().toISOString(),
      notes: formData.notes,
    };

    setSuppliers([...suppliers, newSupplier]);
    setShowAddDialog(false);
    resetForm();
  };

  const handleEditSupplier = () => {
    if (!selectedSupplier) return;

    setSuppliers(
      suppliers.map((s) =>
        s.id === selectedSupplier.id
          ? { ...selectedSupplier, ...formData }
          : s
      )
    );
    setShowEditDialog(false);
    setSelectedSupplier(null);
    resetForm();
  };

  const handleDeleteSupplier = (supplierId: string) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      setSuppliers(suppliers.filter((s) => s.id !== supplierId));
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      gstin: "",
      status: "Active",
      category: [],
      rating: 0,
      notes: "",
    });
  };

  const openEditDialog = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setFormData(supplier);
    setShowEditDialog(true);
  };

  const openViewScreen = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setShowViewScreen(true);
  };

  // Filter suppliers
  const filteredSuppliers = suppliers.filter((supplier) => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || supplier.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort suppliers
  const sortedSuppliers = filteredSuppliers.sort((a, b) => {
    if (sortColumn === 'code') {
      return sortDirection === 'asc' ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code);
    } else if (sortColumn === 'name') {
      return sortDirection === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    } else if (sortColumn === 'contactPerson') {
      return sortDirection === 'asc' ? a.contactPerson.localeCompare(b.contactPerson) : b.contactPerson.localeCompare(a.contactPerson);
    } else if (sortColumn === 'email') {
      return sortDirection === 'asc' ? a.email.localeCompare(b.email) : b.email.localeCompare(a.email);
    } else if (sortColumn === 'phone') {
      return sortDirection === 'asc' ? a.phone.localeCompare(b.phone) : b.phone.localeCompare(a.phone);
    } else if (sortColumn === 'category') {
      return sortDirection === 'asc' ? a.category.join(',').localeCompare(b.category.join(',')) : b.category.join(',').localeCompare(a.category.join(','));
    } else if (sortColumn === 'status') {
      return sortDirection === 'asc' ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSuppliers = sortedSuppliers.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Filter PRs awarded to selected supplier
  const getAwardedPRsForSupplier = (supplierName: string) => {
    return prs.filter(pr => pr.status === "Awarded" && pr.awardedSupplier === supplierName);
  };

  // Calculate KPIs
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === "Active").length;
  const inactiveSuppliers = suppliers.filter(s => s.status === "Inactive").length;
  const totalOrders = suppliers.reduce((sum, s) => sum + s.totalOrders, 0);

  // If showing PR detail screen
  if (showPRDetailScreen && selectedPR) {
    const project = projects.find(p => p.id === selectedPR.projectId);
    const awardedQuotation = selectedPR.quotations?.find(q => q.status === "Selected");
    const hasCriticalSpares = selectedPR.criticalSpares && selectedPR.criticalSpares.length > 0;

    // Calculate total price including critical spares
    const calculateTotalWithCriticalSpares = () => {
      if (!awardedQuotation?.items || awardedQuotation.items.length === 0) {
        return awardedQuotation?.price || 0;
      }

      return awardedQuotation.items.reduce((sum, quotedItem) => {
        const prItem = selectedPR.items.find(item => item.id === quotedItem.itemId);
        if (!prItem) return sum;

        const baseQuantity = prItem.quantity;
        const criticalSpare = selectedPR.criticalSpares?.find(spare => spare.id === prItem.id);
        const criticalQty = criticalSpare?.quantity || 0;
        const totalQuantity = baseQuantity + criticalQty;

        return sum + (quotedItem.unitPrice * totalQuantity);
      }, 0);
    };

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowPRDetailScreen(false);
                setSelectedPR(null);
              }}
              className="h-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Supplier View
            </Button>
            <div className="h-6 w-px bg-slate-300" />
            <div>
              <h2 className="font-semibold">Awarded PR Details - {selectedPR.id}</h2>
              <p className="text-xs text-muted-foreground">Purchase Request & Award Information</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-700">
            {selectedPR.status}
          </Badge>
        </div>

        {/* PR Content */}
        <div className="flex-1 overflow-y-auto scrollbar-smart">
          <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Award Summary Card */}
            {awardedQuotation && (
              <Card className="shadow-lg border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-green-600" />
                    Award Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Awarded Supplier</p>
                      <p className="font-semibold text-green-700">{awardedQuotation.supplier}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Award Date</p>
                      <p className="font-semibold">{new Date(selectedPR.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Delivery Date</p>
                      <p className="font-semibold">{new Date(awardedQuotation.deliveryDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total Award Value</p>
                      <div>
                        <p className="font-bold text-lg text-green-600">
                          ₹{calculateTotalWithCriticalSpares().toLocaleString()}
                        </p>
                        {hasCriticalSpares && (
                          <p className="text-xs text-orange-600">incl. critical spares</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Delivery Terms</p>
                        <p className="text-sm">{awardedQuotation.deliveryTerms}</p>
                      </div>
                      {awardedQuotation.notes && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm">{awardedQuotation.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Information */}
            {project && (
              <Card className="shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Grid3x3 className="w-5 h-5 text-blue-600" />
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Customer PO</p>
                      <p className="font-semibold">{project.customerPO}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Part Number</p>
                      <p className="font-semibold">{project.partNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tool Number</p>
                      <p className="font-semibold">{project.toolNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Target Date</p>
                      <p className="font-semibold">{new Date(project.targetDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* BOM Items with Awarded Prices */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  BOM Items & Awarded Prices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e2e8f0' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f8fafc' }}>
                        <TableCell sx={{ fontSize: '11px', fontWeight: 700, padding: '8px 12px' }}>Item ID</TableCell>
                        <TableCell sx={{ fontSize: '11px', fontWeight: 700, padding: '8px 12px' }}>Item Name</TableCell>
                        <TableCell sx={{ fontSize: '11px', fontWeight: 700, padding: '8px 12px' }}>Specification</TableCell>
                        <TableCell sx={{ fontSize: '11px', fontWeight: 700, padding: '8px 12px', textAlign: 'center' }}>Quantity</TableCell>
                        <TableCell sx={{ fontSize: '11px', fontWeight: 700, padding: '8px 12px', textAlign: 'right' }}>Unit Price</TableCell>
                        <TableCell sx={{ fontSize: '11px', fontWeight: 700, padding: '8px 12px', textAlign: 'right' }}>Total Price</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPR.items.map((item) => {
                        const quotedItem = awardedQuotation?.items?.find(qi => qi.itemId === item.id);
                        const criticalSpare = selectedPR.criticalSpares?.find(spare => spare.id === item.id);
                        const criticalQty = criticalSpare?.quantity || 0;
                        const totalQuantity = item.quantity + criticalQty;
                        const unitPrice = quotedItem?.unitPrice || 0;
                        const totalPrice = unitPrice * totalQuantity;

                        return (
                          <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                            <TableCell sx={{ fontSize: '12px', padding: '8px 12px' }}>
                              <div>
                                {item.id}
                                {criticalQty > 0 && (
                                  <Badge className="ml-2 text-xs bg-orange-100 text-orange-700 border-orange-300">
                                    Critical Spare
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell sx={{ fontSize: '12px', padding: '8px 12px', fontWeight: 600 }}>{item.name}</TableCell>
                            <TableCell sx={{ fontSize: '12px', padding: '8px 12px', color: '#64748b' }}>{item.specification}</TableCell>
                            <TableCell sx={{ fontSize: '12px', padding: '8px 12px', textAlign: 'center' }}>
                              <div>
                                <p className="font-semibold">{totalQuantity}</p>
                                {criticalQty > 0 && (
                                  <p className="text-xs text-orange-600">
                                    ({item.quantity} + {criticalQty} spare)
                                  </p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell sx={{ fontSize: '12px', padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                              ₹{unitPrice.toLocaleString()}
                            </TableCell>
                            <TableCell sx={{ fontSize: '12px', padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                              ₹{totalPrice.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                        <TableCell colSpan={5} sx={{ fontSize: '12px', padding: '8px 12px', fontWeight: 700, textAlign: 'right' }}>
                          Grand Total:
                        </TableCell>
                        <TableCell sx={{ fontSize: '14px', padding: '8px 12px', fontWeight: 700, textAlign: 'right', color: '#059669' }}>
                          ₹{calculateTotalWithCriticalSpares().toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>

            {/* Critical Spares Summary */}
            {hasCriticalSpares && (
              <Card className="shadow-lg border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    Critical Spares Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedPR.criticalSpares?.map((spare) => {
                      const item = selectedPR.items.find(i => i.id === spare.id);
                      const quotedItem = awardedQuotation?.items?.find(qi => qi.itemId === spare.id);
                      const unitPrice = quotedItem?.unitPrice || 0;
                      const spareTotal = unitPrice * spare.quantity;

                      return (
                        <div key={spare.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
                          <div>
                            <p className="font-semibold text-sm">{item?.name}</p>
                            <p className="text-xs text-muted-foreground">{spare.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">
                              <span className="font-semibold">{spare.quantity}</span> units
                              <span className="text-muted-foreground mx-2">×</span>
                              <span className="font-semibold">₹{unitPrice.toLocaleString()}</span>
                            </p>
                            <p className="text-xs text-orange-600 font-semibold">₹{spareTotal.toLocaleString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If showing supplier view screen
  if (showViewScreen && selectedSupplier) {
    const awardedPRs = getAwardedPRsForSupplier(selectedSupplier.name);
    
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowViewScreen(false);
                setSelectedSupplier(null);
              }}
              className="h-8"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Suppliers
            </Button>
            <div className="h-6 w-px bg-slate-300" />
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Building2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold">{selectedSupplier.name}</h2>
                <p className="text-xs text-muted-foreground">{selectedSupplier.code}</p>
              </div>
            </div>
          </div>
          <Badge
            className={
              selectedSupplier.status === "Active"
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-700"
            }
          >
            {selectedSupplier.status}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-smart p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Supplier Information Card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Contact Person</Label>
                      <p className="text-sm flex items-center gap-2 mt-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {selectedSupplier.contactPerson}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="text-sm flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {selectedSupplier.email}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Phone</Label>
                      <p className="text-sm flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {selectedSupplier.phone}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Address</Label>
                      <p className="text-sm flex items-start gap-2 mt-1">
                        <MapPin className="w-3 h-3 text-slate-400 mt-1" />
                        <span>
                          {selectedSupplier.address}, {selectedSupplier.city}, {selectedSupplier.state} - {selectedSupplier.pincode}
                        </span>
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">GSTIN</Label>
                      <p className="text-sm font-mono mt-1">{selectedSupplier.gstin}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">Categories</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedSupplier.category.map((cat) => (
                          <Chip
                            key={cat}
                            label={cat}
                            size="small"
                            color="primary"
                            sx={{ fontSize: "11px", height: "22px" }}
                          />
                        ))}
                      </div>
                    </div>
                    {selectedSupplier.notes && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Notes</Label>
                        <p className="text-sm p-2 bg-slate-50 rounded-md mt-1">{selectedSupplier.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-4 pt-2 border-t">
                      <div>
                        <Label className="text-xs text-muted-foreground">Total Orders</Label>
                        <p className="text-sm font-medium mt-1">{selectedSupplier.totalOrders}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Created On</Label>
                        <p className="text-sm mt-1">{new Date(selectedSupplier.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Awarded PRs Card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Awarded Purchase Requests
                  </CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    {awardedPRs.length} PRs
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {awardedPRs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Package className="w-12 h-12 opacity-50 mb-3" />
                    <p className="text-sm">No awarded PRs for this supplier</p>
                  </div>
                ) : (
                  <TableContainer component={Paper} className="shadow-sm">
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f8fafc" }}>
                          <TableCell sx={{ fontSize: "11px", fontWeight: 600, padding: "8px 12px" }}>
                            PR ID
                          </TableCell>
                          <TableCell sx={{ fontSize: "11px", fontWeight: 600, padding: "8px 12px" }}>
                            PR Type
                          </TableCell>
                          <TableCell sx={{ fontSize: "11px", fontWeight: 600, padding: "8px 12px" }}>
                            Project
                          </TableCell>
                          <TableCell sx={{ fontSize: "11px", fontWeight: 600, padding: "8px 12px" }}>
                            Items Count
                          </TableCell>
                          <TableCell sx={{ fontSize: "11px", fontWeight: 600, padding: "8px 12px" }}>
                            Created By
                          </TableCell>
                          <TableCell sx={{ fontSize: "11px", fontWeight: 600, padding: "8px 12px" }}>
                            Created Date
                          </TableCell>
                          <TableCell sx={{ fontSize: "11px", fontWeight: 600, padding: "8px 12px" }}>
                            Status
                          </TableCell>
                          <TableCell sx={{ fontSize: "11px", fontWeight: 600, padding: "8px 12px", textAlign: "center" }}>
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {awardedPRs.map((pr) => {
                          const project = projects.find(p => p.id === pr.projectId);
                          return (
                            <TableRow key={pr.id} hover>
                              <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                                <span className="font-medium text-blue-600">{pr.id}</span>
                              </TableCell>
                              <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                                <Badge
                                  className={
                                    pr.prType === "New Set"
                                      ? "bg-blue-100 text-blue-700"
                                      : pr.prType === "Modification"
                                      ? "bg-purple-100 text-purple-700"
                                      : "bg-amber-100 text-amber-700"
                                  }
                                >
                                  {pr.prType}
                                </Badge>
                              </TableCell>
                              <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                                {project ? `${project.customerPO} - ${project.partNumber}` : "N/A"}
                              </TableCell>
                              <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                                <div className="flex items-center gap-1">
                                  <Package className="w-3 h-3 text-slate-400" />
                                  {pr.items.length}
                                </div>
                              </TableCell>
                              <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                                {pr.createdBy}
                              </TableCell>
                              <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {new Date(pr.createdAt).toLocaleDateString()}
                                </div>
                              </TableCell>
                              <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                                <Badge className="bg-green-100 text-green-700">
                                  {pr.status}
                                </Badge>
                              </TableCell>
                              <TableCell sx={{ fontSize: "12px", padding: "8px 12px", textAlign: "center" }}>
                                <Tooltip title="View PR Details">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedPR(pr);
                                      setShowPRDetailScreen(true);
                                    }}
                                    sx={{ padding: "4px" }}
                                  >
                                    <Eye className="w-4 h-4 text-blue-600" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const SupplierForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Supplier Name *</Label>
          <Input
            placeholder="Enter supplier name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Supplier Code *</Label>
          <Input
            placeholder="Enter supplier code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="h-8 text-sm"
            disabled={isEdit}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Contact Person *</Label>
          <Input
            placeholder="Enter contact person name"
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email *</Label>
          <Input
            type="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Phone *</Label>
          <Input
            placeholder="Enter phone number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">GSTIN *</Label>
          <Input
            placeholder="Enter GSTIN"
            value={formData.gstin}
            onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Address *</Label>
        <Input
          placeholder="Enter address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="h-8 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">City *</Label>
          <Input
            placeholder="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">State *</Label>
          <Input
            placeholder="State"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Pincode *</Label>
          <Input
            placeholder="Pincode"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
            className="h-8 text-sm"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Category *</Label>
        <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[60px]">
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              size="small"
              onClick={() => {
                const current = formData.category || [];
                if (current.includes(cat)) {
                  setFormData({
                    ...formData,
                    category: current.filter((c) => c !== cat),
                  });
                } else {
                  setFormData({ ...formData, category: [...current, cat] });
                }
              }}
              color={formData.category?.includes(cat) ? "primary" : "default"}
              variant={formData.category?.includes(cat) ? "filled" : "outlined"}
              sx={{ fontSize: "11px", height: "24px" }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Status</Label>
        <div className="flex gap-3">
          <Button
            type="button"
            size="sm"
            variant={formData.status === "Active" ? "default" : "outline"}
            onClick={() => setFormData({ ...formData, status: "Active" })}
            className="h-8 text-xs"
          >
            Active
          </Button>
          <Button
            type="button"
            size="sm"
            variant={formData.status === "Inactive" ? "default" : "outline"}
            onClick={() => setFormData({ ...formData, status: "Inactive" })}
            className="h-8 text-xs"
          >
            Inactive
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Notes</Label>
        <Textarea
          placeholder="Additional notes about the supplier"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="text-sm min-h-[60px]"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-purple-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-4 h-4 text-purple-600" />
              <p className="text-xs text-purple-900">Total Suppliers</p>
            </div>
            <p className="text-2xl font-semibold text-purple-900 mb-1">{totalSuppliers}</p>
            <p className="text-xs text-purple-600">All suppliers</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-blue-600" />
              <p className="text-xs text-blue-900">Active Suppliers</p>
            </div>
            <p className="text-2xl font-semibold text-blue-900 mb-1">{activeSuppliers}</p>
            <p className="text-xs text-blue-600">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-cyan-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-cyan-600" />
              <p className="text-xs text-cyan-900">Inactive Suppliers</p>
            </div>
            <p className="text-2xl font-semibold text-cyan-900 mb-1">{inactiveSuppliers}</p>
            <p className="text-xs text-cyan-600">Not active</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="w-4 h-4 text-green-600" />
              <p className="text-xs text-green-900">Total Orders</p>
            </div>
            <p className="text-2xl font-semibold text-green-900 mb-1">{totalOrders}</p>
            <p className="text-xs text-green-600">All orders placed</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Supplier Management</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage supplier information and contacts
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowAddDialog(true);
              }}
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 h-8"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Filters */}
          <div className="flex gap-3 mb-4 p-3 bg-slate-50 rounded-lg">
            <TextField
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              className="flex-1"
              InputProps={{
                startAdornment: <Search className="w-4 h-4 mr-2 text-slate-400" />,
                style: { fontSize: "13px", height: "36px" },
              }}
            />
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 text-sm border border-slate-300 rounded-md px-3 bg-white"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Suppliers Table */}
          <Box sx={{ maxHeight: 'calc(100vh - 450px)', overflow: 'auto', position: 'relative' }}>
            <TableContainer component={Paper} className="shadow-sm" sx={{ maxHeight: 'calc(100vh - 450px)' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        fontSize: "11px", 
                        fontWeight: 600, 
                        padding: "8px 12px", 
                        cursor: "pointer", 
                        "&:hover": { backgroundColor: "#e2e8f0" },
                        backgroundColor: '#f8fafc !important',
                      }}
                      onClick={() => handleSort('code')}
                    >
                      <div className="flex items-center gap-1">
                        Code
                        {renderSortIcon('code')}
                      </div>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontSize: "11px", 
                        fontWeight: 600, 
                        padding: "8px 12px", 
                        cursor: "pointer", 
                        "&:hover": { backgroundColor: "#e2e8f0" },
                        backgroundColor: '#f8fafc !important',
                      }}
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Supplier Name
                        {renderSortIcon('name')}
                      </div>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontSize: "11px", 
                        fontWeight: 600, 
                        padding: "8px 12px", 
                        cursor: "pointer", 
                        "&:hover": { backgroundColor: "#e2e8f0" },
                        backgroundColor: '#f8fafc !important',
                      }}
                      onClick={() => handleSort('contactPerson')}
                    >
                      <div className="flex items-center gap-1">
                        Contact Person
                        {renderSortIcon('contactPerson')}
                      </div>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontSize: "11px", 
                        fontWeight: 600, 
                        padding: "8px 12px", 
                        cursor: "pointer", 
                        "&:hover": { backgroundColor: "#e2e8f0" },
                        backgroundColor: '#f8fafc !important',
                      }}
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-1">
                        Email
                        {renderSortIcon('email')}
                      </div>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontSize: "11px", 
                        fontWeight: 600, 
                        padding: "8px 12px", 
                        cursor: "pointer", 
                        "&:hover": { backgroundColor: "#e2e8f0" },
                        backgroundColor: '#f8fafc !important',
                      }}
                      onClick={() => handleSort('phone')}
                    >
                      <div className="flex items-center gap-1">
                        Phone
                        {renderSortIcon('phone')}
                      </div>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontSize: "11px", 
                        fontWeight: 600, 
                        padding: "8px 12px", 
                        cursor: "pointer", 
                        "&:hover": { backgroundColor: "#e2e8f0" },
                        backgroundColor: '#f8fafc !important',
                      }}
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center gap-1">
                        Category
                        {renderSortIcon('category')}
                      </div>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontSize: "11px", 
                        fontWeight: 600, 
                        padding: "8px 12px", 
                        cursor: "pointer", 
                        "&:hover": { backgroundColor: "#e2e8f0" },
                        backgroundColor: '#f8fafc !important',
                      }}
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Status
                        {renderSortIcon('status')}
                      </div>
                    </TableCell>
                    <TableCell sx={{ 
                      fontSize: "11px", 
                      fontWeight: 600, 
                      padding: "8px 12px", 
                      textAlign: "center",
                      backgroundColor: '#f8fafc !important',
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} sx={{ textAlign: "center", padding: "40px" }}>
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <AlertCircle className="w-12 h-12 opacity-50" />
                          <p className="text-sm">No suppliers found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedSuppliers.map((supplier) => (
                      <TableRow key={supplier.id} hover>
                        <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                          <span className="font-medium text-blue-600">{supplier.code}</span>
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="font-medium">{supplier.name}</span>
                          </div>
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-slate-400" />
                            {supplier.contactPerson}
                          </div>
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                          <div className="flex items-center gap-2">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {supplier.email}
                          </div>
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                          <div className="flex items-center gap-2">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {supplier.phone}
                          </div>
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                          <div className="flex flex-wrap gap-1">
                            {supplier.category.slice(0, 2).map((cat) => (
                              <Chip
                                key={cat}
                                label={cat}
                                size="small"
                                sx={{ fontSize: "10px", height: "20px" }}
                              />
                            ))}
                            {supplier.category.length > 2 && (
                              <Chip
                                label={`+${supplier.category.length - 2}`}
                                size="small"
                                sx={{ fontSize: "10px", height: "20px" }}
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px", padding: "8px 12px" }}>
                          <Badge
                            className={
                              supplier.status === "Active"
                                ? "bg-green-100 text-green-700"
                                : "bg-slate-100 text-slate-700"
                            }
                          >
                            {supplier.status}
                          </Badge>
                        </TableCell>
                        <TableCell sx={{ fontSize: "12px", padding: "8px 12px", textAlign: "center" }}>
                          <div className="flex justify-center gap-1">
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                onClick={() => openViewScreen(supplier)}
                                sx={{ padding: "4px" }}
                              >
                                <Eye className="w-4 h-4 text-blue-600" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                onClick={() => openEditDialog(supplier)}
                                sx={{ padding: "4px" }}
                              >
                                <Edit className="w-4 h-4 text-amber-600" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteSupplier(supplier.id)}
                                sx={{ padding: "4px" }}
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
                size="small"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Supplier
            </DialogTitle>
            <DialogDescription>
              Enter the supplier details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <SupplierForm />
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                resetForm();
              }}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSupplier}
              disabled={
                !formData.name ||
                !formData.code ||
                !formData.contactPerson ||
                !formData.email ||
                !formData.phone ||
                !formData.gstin ||
                !formData.address ||
                !formData.city ||
                !formData.state ||
                !formData.pincode ||
                !formData.category ||
                formData.category.length === 0
              }
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-cyan-500"
            >
              Add Supplier
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Supplier Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Edit Supplier
            </DialogTitle>
            <DialogDescription>
              Update the supplier details below.
            </DialogDescription>
          </DialogHeader>
          <SupplierForm isEdit />
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedSupplier(null);
                resetForm();
              }}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSupplier}
              disabled={
                !formData.name ||
                !formData.contactPerson ||
                !formData.email ||
                !formData.phone ||
                !formData.gstin ||
                !formData.address ||
                !formData.city ||
                !formData.state ||
                !formData.pincode ||
                !formData.category ||
                formData.category.length === 0
              }
              size="sm"
              className="bg-gradient-to-r from-blue-500 to-cyan-500"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect, Fragment } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Award, TrendingUp, Calendar, DollarSign, FileSpreadsheet, Clock, CheckCircle, XCircle, Download, Trash2, ChevronDown, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Project, PR, Quotation, QuotationItem } from "./Dashboard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { IconButton, Tooltip, TableContainer, Paper, Chip, Box, Pagination } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { QuotationEvaluation } from "./QuotationEvaluation";
import { QuotationComparison } from "./QuotationComparison";

interface QuotationManagementProps {
  prs: PR[];
  setPRs: React.Dispatch<React.SetStateAction<PR[]>>;
  projects: Project[];
  currentUserRole: string;
}

export function QuotationManagement({ prs, setPRs, projects, currentUserRole }: QuotationManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPRId, setSelectedPRId] = useState("");
  const [quotationForm, setQuotationForm] = useState({
    supplier: "",
    price: "",
    deliveryTerms: "",
    deliveryDate: "",
    notes: "",
  });
  const [evaluationPRId, setEvaluationPRId] = useState<string | null>(null);

  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Track expanded PR rows to show BOM items
  const [expandedPRs, setExpandedPRs] = useState<Set<string>>(new Set());

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

  const togglePRExpansion = (prId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedPRs);
    if (newExpanded.has(prId)) {
      newExpanded.delete(prId);
    } else {
      newExpanded.add(prId);
    }
    setExpandedPRs(newExpanded);
  };

  // Show PRs that are Approved or Sent To Supplier (ready for quotations)
  const approvedPRs = prs.filter(pr => pr.status === "Approved" || pr.status === "Sent To Supplier");

  // Listen for navigation event to open quotation PR view
  useEffect(() => {
    const handleOpenQuotationPRView = (event: Event) => {
      const customEvent = event as CustomEvent;
      const prId = customEvent.detail.prId as string;
      
      const pr = prs.find(p => p.id === prId);
      if (pr) {
        setEvaluationPRId(prId);
      }
    };

    window.addEventListener('openQuotationPRView', handleOpenQuotationPRView);

    return () => {
      window.removeEventListener('openQuotationPRView', handleOpenQuotationPRView);
    };
  }, [prs]);

  const handleAddQuotation = (e: React.FormEvent) => {
    e.preventDefault();

    const newQuotation: Quotation = {
      id: `QUO-${Date.now()}`,
      prId: selectedPRId,
      supplier: quotationForm.supplier,
      price: parseFloat(quotationForm.price),
      deliveryTerms: quotationForm.deliveryTerms,
      deliveryDate: quotationForm.deliveryDate,
      status: "Pending",
      notes: quotationForm.notes,
    };

    setPRs(
      prs.map(pr => {
        if (pr.id === selectedPRId) {
          return {
            ...pr,
            quotations: [...(pr.quotations || []), newQuotation],
          };
        }
        return pr;
      })
    );

    setIsDialogOpen(false);
    setQuotationForm({
      supplier: "",
      price: "",
      deliveryTerms: "",
      deliveryDate: "",
      notes: "",
    });
  };

  const handleEvaluateQuotation = (prId: string, quotationId: string, status: "Evaluated" | "Selected" | "Rejected") => {
    setPRs(
      prs.map(pr => {
        if (pr.id === prId) {
          return {
            ...pr,
            quotations: pr.quotations?.map(q =>
              q.id === quotationId ? { ...q, status } : q
            ),
          };
        }
        return pr;
      })
    );
  };

  const handleAwardSupplier = (prId: string, supplier: string) => {
    setPRs(
      prs.map(pr => {
        if (pr.id === prId) {
          return {
            ...pr,
            status: "Awarded" as const,
            awardedSupplier: supplier,
            quotations: pr.quotations?.map(q => ({
              ...q,
              status: q.supplier === supplier ? "Selected" as const : "Rejected" as const,
            })),
          };
        }
        return pr;
      })
    );
    alert(`Supplier "${supplier}" has been awarded for PR ${prId}!`);
  };

  const handleMarkItemsReceived = (prId: string) => {
    if (confirm("Confirm that all items have been received from the supplier?")) {
      setPRs(
        prs.map(pr => {
          if (pr.id === prId) {
            return {
              ...pr,
              status: "Items Received" as const,
              itemsReceivedDate: new Date().toISOString(),
            };
          }
          return pr;
        })
      );
      alert(`Items marked as received for PR ${prId}. Tool Maintenance team has been notified!`);
    }
  };

  const handleDeleteQuotation = (prId: string, quotationId: string) => {
    setPRs(
      prs.map(pr => {
        if (pr.id === prId) {
          return {
            ...pr,
            quotations: pr.quotations?.filter(q => q.id !== quotationId),
          };
        }
        return pr;
      })
    );
  };

  const handleDownloadQuotation = (quotation: Quotation) => {
    // Create a simple text representation of the quotation
    const quotationData = `
Quotation Details
=================
Quotation ID: ${quotation.id}
PR ID: ${quotation.prId}
Supplier: ${quotation.supplier}
Price: ₹${quotation.price.toLocaleString()}
Delivery Date: ${new Date(quotation.deliveryDate).toLocaleDateString()}
Delivery Terms: ${quotation.deliveryTerms}
Status: ${quotation.status}
Notes: ${quotation.notes || 'N/A'}
    `.trim();

    // Create a blob and download
    const blob = new Blob([quotationData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${quotation.id}_${quotation.supplier.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getProjectDetails = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  // Calculate awarded price including critical spares
  const calculateAwardedPriceWithCriticalSpares = (pr: PR, quotation: Quotation) => {
    if (!quotation.items || quotation.items.length === 0) {
      return quotation.price;
    }

    // Calculate total price including critical spares
    const totalWithSpares = quotation.items.reduce((sum, quotedItem) => {
      const prItem = pr.items.find(item => item.id === quotedItem.itemId);
      if (!prItem) return sum;

      const baseQuantity = prItem.quantity;
      const criticalSpare = pr.criticalSpares?.find(spare => spare.id === prItem.id);
      const criticalQty = criticalSpare?.quantity || 0;
      const totalQuantity = baseQuantity + criticalQty;

      return sum + (quotedItem.unitPrice * totalQuantity);
    }, 0);

    return totalWithSpares;
  };

  const checkDeliveryAlignment = (quotationDate: string, targetDate: string) => {
    const quoDate = new Date(quotationDate);
    const target = new Date(targetDate);
    const diffTime = target.getTime() - quoDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0) {
      return { aligned: true, message: `${diffDays} days before target`, color: "text-green-600" };
    } else {
      return { aligned: false, message: `${Math.abs(diffDays)} days late`, color: "text-red-600" };
    }
  };

  // Calculate KPIs
  const allQuotations = prs.flatMap(pr => pr.quotations || []);
  const totalQuotations = allQuotations.length;
  const pendingQuotations = allQuotations.filter(q => q.status === "Pending").length;
  const evaluatedQuotations = allQuotations.filter(q => q.status === "Evaluated").length;
  const selectedQuotations = allQuotations.filter(q => q.status === "Selected").length;
  const rejectedQuotations = allQuotations.filter(q => q.status === "Rejected").length;

  // Get PRs with quotations for table view - one row per PR
  const prsWithQuotations = prs.filter(pr => pr.quotations && pr.quotations.length > 0);

  // Get PRs sent to suppliers (even without quotations yet)
  const prsSentToSuppliers = prs.filter(pr => pr.status === "Sent To Supplier" || pr.status === "Evaluation Pending");

  // Combine both lists, ensuring no duplicates
  const displayPRs = Array.from(
    new Map(
      [...prsSentToSuppliers, ...prsWithQuotations].map(pr => [pr.id, pr])
    ).values()
  );

  const handleMarkAllEvaluated = (prId: string) => {
    setPRs(
      prs.map(pr => {
        if (pr.id === prId) {
          return {
            ...pr,
            quotations: pr.quotations?.map(q => ({ ...q, status: "Evaluated" as const })),
          };
        }
        return pr;
      })
    );
  };

  // If evaluation screen is shown, render it
  if (evaluationPRId) {
    const selectedPR = prs.find(pr => pr.id === evaluationPRId);
    const selectedProject = selectedPR ? getProjectDetails(selectedPR.projectId) : undefined;
    
    if (selectedPR) {
      // Show QuotationComparison for both NPD and Approver users
      return (
        <QuotationComparison
          pr={selectedPR}
          project={selectedProject}
          onBack={() => setEvaluationPRId(null)}
          onSave={(updatedPR) => {
            setPRs(prs.map(pr => pr.id === updatedPR.id ? updatedPR : pr));
            setEvaluationPRId(null);
          }}
          currentUserRole={currentUserRole}
          onAwardSupplier={handleAwardSupplier}
          onMarkItemsReceived={handleMarkItemsReceived}
        />
      );
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Sticky KPI Metrics Bar */}
      <div className="sticky top-0 z-20 bg-gradient-to-br from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Quotation Management</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Evaluate supplier quotations and award contracts
            </p>
          </div>
          {/* Add Quotation button removed as per user request */}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow bg-gradient-to-br from-cyan-50 to-teal-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2 text-cyan-900">
                <div className="p-1.5 bg-cyan-100 rounded-lg">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-600" />
                </div>
                Total Quotations
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold text-cyan-600">{totalQuotations}</div>
              <p className="text-xs text-cyan-600/70 mt-0.5">All quotations</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow bg-gradient-to-br from-yellow-50 to-amber-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2 text-yellow-900">
                <div className="p-1.5 bg-yellow-100 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-yellow-600" />
                </div>
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold text-yellow-600">{pendingQuotations}</div>
              <p className="text-xs text-yellow-600/70 mt-0.5">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2 text-blue-900">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                </div>
                Evaluated
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold text-blue-600">{evaluatedQuotations}</div>
              <p className="text-xs text-blue-600/70 mt-0.5">Under review</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2 text-green-900">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                </div>
                Selected
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold text-green-600">{selectedQuotations}</div>
              <p className="text-xs text-green-600/70 mt-0.5">Awarded</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow bg-gradient-to-br from-red-50 to-rose-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-2 text-red-900">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <XCircle className="w-3.5 h-3.5 text-red-600" />
                </div>
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="text-2xl font-bold text-red-600">{rejectedQuotations}</div>
              <p className="text-xs text-red-600/70 mt-0.5">Not selected</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-smart p-8">
        {displayPRs.length === 0 ? (
          <div className="text-center py-12">
            <FileSpreadsheet className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-lg font-medium text-slate-600 mb-2">No PRs Sent to Suppliers</p>
            <p className="text-sm text-muted-foreground">
              PRs that are sent to suppliers will appear here for quotation management.
            </p>
          </div>
        ) : (
          <Card className="border-0 shadow-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-50 hover:to-slate-100">
                  <TableHead 
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      PR ID
                      {renderSortIcon('id')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200"
                    onClick={() => handleSort('customerPO')}
                  >
                    <div className="flex items-center gap-1">
                      Customer PO
                      {renderSortIcon('customerPO')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200"
                    onClick={() => handleSort('prType')}
                  >
                    <div className="flex items-center gap-1">
                      PR Type
                      {renderSortIcon('prType')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200"
                    onClick={() => handleSort('items')}
                  >
                    <div className="flex items-center gap-1">
                      BOM Items
                      {renderSortIcon('items')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200"
                    onClick={() => handleSort('suppliers')}
                  >
                    <div className="flex items-center gap-1">
                      # Suppliers
                      {renderSortIcon('suppliers')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200"
                    onClick={() => handleSort('price')}
                  >
                    <div className="flex items-center gap-1">
                      Awarded Price
                      {renderSortIcon('price')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-200"
                    onClick={() => handleSort('quotations')}
                  >
                    <div className="flex items-center gap-1">
                      Quotation Status
                      {renderSortIcon('quotations')}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-slate-700 text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayPRs
                  .sort((a, b) => {
                    if (sortColumn === 'id') {
                      return sortDirection === 'asc' ? a.id.localeCompare(b.id) : b.id.localeCompare(a.id);
                    } else if (sortColumn === 'customerPO') {
                      const projectA = getProjectDetails(a.projectId);
                      const projectB = getProjectDetails(b.projectId);
                      return sortDirection === 'asc' ? (projectA?.customerPO || '').localeCompare(projectB?.customerPO || '') : (projectB?.customerPO || '').localeCompare(projectA?.customerPO || '');
                    } else if (sortColumn === 'prType') {
                      return sortDirection === 'asc' ? a.prType.localeCompare(b.prType) : b.prType.localeCompare(a.prType);
                    } else if (sortColumn === 'items') {
                      return sortDirection === 'asc' ? a.items.length - b.items.length : b.items.length - a.items.length;
                    } else if (sortColumn === 'suppliers') {
                      return sortDirection === 'asc' ? a.suppliers.length - b.suppliers.length : b.suppliers.length - a.suppliers.length;
                    } else if (sortColumn === 'price') {
                      const projectA = getProjectDetails(a.projectId);
                      const projectB = getProjectDetails(b.projectId);
                      return sortDirection === 'asc' ? (projectA?.price || 0) - (projectB?.price || 0) : (projectB?.price || 0) - (projectA?.price || 0);
                    } else if (sortColumn === 'quotations') {
                      const aQuotations = a.quotations || [];
                      const bQuotations = b.quotations || [];
                      const aPending = aQuotations.filter(q => q.status === "Pending").length;
                      const bPending = bQuotations.filter(q => q.status === "Pending").length;
                      const aEvaluated = aQuotations.filter(q => q.status === "Evaluated").length;
                      const bEvaluated = bQuotations.filter(q => q.status === "Evaluated").length;
                      const aSelected = aQuotations.filter(q => q.status === "Selected").length;
                      const bSelected = bQuotations.filter(q => q.status === "Selected").length;
                      return sortDirection === 'asc' ? (aPending + aEvaluated + aSelected) - (bPending + bEvaluated + bSelected) : (bPending + bEvaluated + bSelected) - (aPending + aEvaluated + aSelected);
                    }
                    return 0;
                  })
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((pr) => {
                    const project = getProjectDetails(pr.projectId);
                    const quotations = pr.quotations || [];
                    const pendingCount = quotations.filter(q => q.status === "Pending").length;
                    const evaluatedCount = quotations.filter(q => q.status === "Evaluated").length;
                    const selectedCount = quotations.filter(q => q.status === "Selected").length;
                    const isExpanded = expandedPRs.has(pr.id);

                    return [
                      <TableRow 
                        key={pr.id}
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => setEvaluationPRId(pr.id)}
                      >
                        <TableCell className="font-medium text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => togglePRExpansion(pr.id, e)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                            {pr.id}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {project?.customerPO || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant="outline">{pr.prType}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {pr.items.length} items
                        </TableCell>
                        <TableCell className="text-sm">
                          {pr.suppliers.length}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(() => {
                            // Find the awarded quotation (Selected status)
                            const awardedQuotation = quotations.find(q => q.status === "Selected");
                            if (awardedQuotation) {
                              // Show price including critical spares for both NPD and Approver users
                              const displayPrice = calculateAwardedPriceWithCriticalSpares(pr, awardedQuotation);
                              
                              const hasCriticalSpares = pr.criticalSpares && pr.criticalSpares.length > 0;
                              
                              return (
                                <div>
                                  <p className="font-medium text-green-600">
                                    ₹{displayPrice.toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {awardedQuotation.supplier}
                                  </p>
                                  {hasCriticalSpares && (
                                    <p className="text-xs text-orange-600 mt-0.5">
                                      incl. critical spares
                                    </p>
                                  )}
                                </div>
                              );
                            } else {
                              return (
                                <p className="text-sm text-muted-foreground">
                                  Not Awarded
                                </p>
                              );
                            }
                          })()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {(() => {
                            // Determine status based on PR status and quotation status
                            if (selectedCount > 0 || pr.status === "Awarded") {
                              return (
                                <Badge className="text-xs bg-green-600 text-white">
                                  Awarded
                                </Badge>
                              );
                            } else if (pr.status === "Sent To Supplier" || pr.status === "Evaluation Pending") {
                              return (
                                <Badge className="text-xs bg-purple-100 text-purple-700">
                                  Evaluation Pending
                                </Badge>
                              );
                            } else if (pr.status === "Submitted for Approval") {
                              return (
                                <Badge className="text-xs bg-yellow-100 text-yellow-700">
                                  Approval Pending
                                </Badge>
                              );
                            } else {
                              return (
                                <Badge variant="outline" className="text-xs">
                                  {pr.status}
                                </Badge>
                              );
                            }
                          })()}
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-0.5 justify-center">
                            <Tooltip title="Evaluate Quotations">
                              <IconButton
                                size="small"
                                onClick={() => setEvaluationPRId(pr.id)}
                                sx={{ color: '#3b82f6' }}
                              >
                                <RateReviewIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>,

                      // Expandable BOM Items Row
                      isExpanded && (
                        <TableRow key={`${pr.id}-bom`}>
                          <TableCell colSpan={8} className="bg-slate-50/50 p-0">
                            <div className="p-4">
                              <h4 className="text-sm font-semibold mb-3 text-slate-700">BOM Items for {pr.id}</h4>
                              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-slate-100">
                                      <TableHead className="text-xs font-semibold">Item ID</TableHead>
                                      <TableHead className="text-xs font-semibold">Item Name</TableHead>
                                      <TableHead className="text-xs font-semibold">Specification</TableHead>
                                      <TableHead className="text-xs font-semibold">Requirements</TableHead>
                                      <TableHead className="text-xs font-semibold text-center">Quantity</TableHead>
                                      <TableHead className="text-xs font-semibold text-right">Unit Price</TableHead>
                                      <TableHead className="text-xs font-semibold text-right">Total</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {pr.items.map((item) => (
                                      <TableRow key={item.id} className="hover:bg-slate-50">
                                        <TableCell className="text-xs text-slate-600">{item.id}</TableCell>
                                        <TableCell className="text-xs font-medium">{item.name}</TableCell>
                                        <TableCell className="text-xs text-slate-600">{item.specification}</TableCell>
                                        <TableCell className="text-xs text-slate-600">{item.requirements}</TableCell>
                                        <TableCell className="text-xs text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-xs text-right">
                                          {item.price ? `₹${item.price.toLocaleString()}` : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-xs text-right font-semibold">
                                          {item.price ? `₹${(item.price * item.quantity).toLocaleString()}` : 'N/A'}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                    <TableRow className="bg-slate-100 font-semibold">
                                      <TableCell colSpan={6} className="text-xs text-right">Grand Total:</TableCell>
                                      <TableCell className="text-xs text-right">
                                        ₹{pr.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0).toLocaleString()}
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    ].filter(Boolean);
                  })}
              </TableBody>
            </Table>
            
            {/* Pagination */}
            {displayPRs.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2, gap: 2, borderTop: '1px solid #e2e8f0' }}>
                <Pagination
                  count={Math.ceil(displayPRs.length / itemsPerPage)}
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
                  label={`Page ${currentPage} of ${Math.ceil(displayPRs.length / itemsPerPage)} • ${displayPRs.length} records`}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                />
              </Box>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
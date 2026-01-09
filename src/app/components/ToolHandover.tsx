import type { Project, PR, ToolHandoverRecord, SpareItem } from "./Dashboard";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, CheckCircle, XCircle, Wrench, Trash2, Eye, Edit, Download, Package, Search, X } from "lucide-react";
import { 
  Paper, 
  TableContainer, 
  IconButton, 
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

interface ToolHandoverProps {
  handovers: ToolHandoverRecord[];
  setHandovers: (handovers: ToolHandoverRecord[]) => void;
  projects: Project[];
  prs: PR[];
  inventory: any[];
  setInventory: (inventory: any[]) => void;
  onNavigateToInspection?: (handover: ToolHandoverRecord) => void;
  userRole?: "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";
}

export function ToolHandover({ handovers, setHandovers, projects, prs, inventory, setInventory, onNavigateToInspection, userRole }: ToolHandoverProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [selectedHandover, setSelectedHandover] = useState<ToolHandoverRecord | null>(null);
  const [inspectionRemarks, setInspectionRemarks] = useState("");
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [filterText, setFilterText] = useState("");

  const [formData, setFormData] = useState({
    projectId: "",
    prId: "",
    toolSet: "",
  });

  const [spares, setSpares] = useState<SpareItem[]>([]);
  const [currentSpare, setCurrentSpare] = useState({
    partNumber: "",
    toolNumber: "",
    name: "",
    quantity: "",
  });

  // Filter PRs with "Items Received" status for notifications
  const itemsReceivedPRs = prs.filter(pr => pr.status === "Items Received");
  const awardedPRs = prs.filter(pr => pr.status === "Awarded");

  // Auto-create handover records for PRs with "Items Received" status
  useEffect(() => {
    itemsReceivedPRs.forEach((pr) => {
      // Check if handover already exists for this PR
      const handoverExists = handovers.some(h => h.prId === pr.id);
      
      if (!handoverExists) {
        // Get project details
        const project = getProjectDetails(pr.projectId);
        
        // Convert only the critical spares marked in the PR to SpareItem format
        const criticalSpares: SpareItem[] = (pr.criticalSpares || [])
          .map((criticalSpare) => {
            // Find the corresponding item from pr.items
            const item = pr.items.find(i => i.id === criticalSpare.id);
            if (!item) return null;
            
            return {
              id: `SPARE-${pr.id}-${item.id}`,
              partNumber: item.id,
              toolNumber: project?.toolNumber || "TBD",
              name: item.name,
              quantity: criticalSpare.quantity, // Use the critical spare quantity
            };
          })
          .filter((spare): spare is SpareItem => spare !== null);

        // Create new handover record
        const newHandover: ToolHandoverRecord = {
          id: `HAND-${pr.id}`,
          projectId: pr.projectId,
          prId: pr.id,
          toolSet: `${pr.prType} - ${pr.items.length} items`,
          allItems: pr.items, // Store all PR items
          criticalSpares: criticalSpares,
          status: "Pending Inspection",
        };

        // Add to handovers
        setHandovers([...handovers, newHandover]);
      }
    });
  }, [prs, handovers, setHandovers]);

  const handleAddSpare = () => {
    if (currentSpare.partNumber && currentSpare.name && currentSpare.quantity) {
      const newSpare: SpareItem = {
        id: `SPARE-${Date.now()}`,
        partNumber: currentSpare.partNumber,
        toolNumber: currentSpare.toolNumber,
        name: currentSpare.name,
        quantity: parseInt(currentSpare.quantity),
      };
      setSpares([...spares, newSpare]);
      setCurrentSpare({
        partNumber: "",
        toolNumber: "",
        name: "",
        quantity: "",
      });
    }
  };

  const handleRemoveSpare = (id: string) => {
    setSpares(spares.filter(spare => spare.id !== id));
  };

  const handleCreateHandover = (e: React.FormEvent) => {
    e.preventDefault();

    const newHandover: ToolHandoverRecord = {
      id: `HO-${Date.now()}`,
      projectId: formData.projectId,
      prId: formData.prId,
      toolSet: formData.toolSet,
      criticalSpares: spares,
      status: "Pending Inspection",
    };

    setHandovers([...handovers, newHandover]);
    setIsDialogOpen(false);
    setFormData({
      projectId: "",
      prId: "",
      toolSet: "",
    });
    setSpares([]);
  };

  const handleApprove = () => {
    if (selectedHandover) {
      console.log("🔍 Approving handover:", selectedHandover.id);
      
      // Get the PR details to access all items
      const pr = getPRDetails(selectedHandover.prId);
      const project = getProjectDetails(selectedHandover.projectId);
      
      // Get ALL PR items
      const allPRItems = selectedHandover.allItems || pr?.items || [];
      
      console.log("📦 PR Items to add to inventory:", allPRItems);
      console.log("🔧 Critical spares to add to inventory:", selectedHandover.criticalSpares);
      console.log("📊 Current inventory before update:", inventory);

      // Update handover status
      setHandovers(
        handovers.map(h =>
          h.id === selectedHandover.id
            ? {
                ...h,
                status: "Approved",
                inspectedBy: "Maintenance Team",
                inspectionDate: new Date().toISOString(),
                remarks: inspectionRemarks,
              }
            : h
        )
      );

      // Automatically update Tool Inventory with BOTH PR items AND critical spares
      const updatedInventory = [...inventory];
      
      // First, add all PR items to inventory
      allPRItems.forEach((item) => {
        console.log("📦 Processing PR item:", item);
        
        // Create inventory-compatible item data
        const partNumber = item.id; // PR item ID is used as part number
        const toolNumber = project?.toolNumber || "TBD";
        
        // Check if this item already exists in inventory (by partNumber, toolNumber, AND name)
        const existingItemIndex = updatedInventory.findIndex(
          invItem => 
            invItem.partNumber === partNumber && 
            invItem.toolNumber === toolNumber &&
            invItem.name === item.name
        );

        console.log("🔍 PR Item - Existing item index:", existingItemIndex);

        if (existingItemIndex >= 0) {
          // Update existing inventory item - add quantity
          const existingItem = updatedInventory[existingItemIndex];
          const newQuantity = existingItem.quantity + item.quantity;
          const newStockLevel = existingItem.stockLevel + item.quantity;
          
          console.log("✏️ Updating existing PR item:", existingItem.id, "Old qty:", existingItem.quantity, "Adding:", item.quantity, "New qty:", newQuantity);
          
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
          // Add new inventory item
          const defaultMinStockLevel = Math.max(1, Math.ceil(item.quantity * 0.3)); // 30% of initial quantity as min stock
          
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
          
          console.log("➕ Adding new PR item to inventory:", newInventoryItem);
          updatedInventory.push(newInventoryItem);
        }
      });
      
      // Second, add all critical spares to inventory
      selectedHandover.criticalSpares.forEach((spare) => {
        console.log("🔧 Processing critical spare:", spare);
        
        // Check if this spare already exists in inventory (by partNumber, toolNumber, AND name)
        const existingItemIndex = updatedInventory.findIndex(
          invItem => 
            invItem.partNumber === spare.partNumber && 
            invItem.toolNumber === spare.toolNumber &&
            invItem.name === spare.name
        );

        console.log("🔍 Critical Spare - Existing item index:", existingItemIndex);

        if (existingItemIndex >= 0) {
          // Update existing inventory item - add quantity
          const existingItem = updatedInventory[existingItemIndex];
          const newQuantity = existingItem.quantity + spare.quantity;
          const newStockLevel = existingItem.stockLevel + spare.quantity;
          
          console.log("✏️ Updating existing critical spare:", existingItem.id, "Old qty:", existingItem.quantity, "Adding:", spare.quantity, "New qty:", newQuantity);
          
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
          // Add new inventory item
          const defaultMinStockLevel = Math.max(1, Math.ceil(spare.quantity * 0.3)); // 30% of initial quantity as min stock
          
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
          
          console.log("➕ Adding new critical spare to inventory:", newInventoryItem);
          updatedInventory.push(newInventoryItem);
        }
      });

      console.log("✅ Updated inventory:", updatedInventory);
      console.log("🚀 Calling setInventory with", updatedInventory.length, "items");

      // Update inventory state
      setInventory(updatedInventory);

      setInspectionDialogOpen(false);
      setSelectedHandover(null);
      setInspectionRemarks("");
      
      const totalItemsAdded = allPRItems.length + selectedHandover.criticalSpares.length;
      toast.success(`Tool handover approved! ${totalItemsAdded} items added to inventory (${allPRItems.length} PR items + ${selectedHandover.criticalSpares.length} critical spares)`);
    }
  };

  const handleReject = () => {
    if (selectedHandover) {
      setHandovers(
        handovers.map(h =>
          h.id === selectedHandover.id
            ? {
                ...h,
                status: "Rejected",
                inspectedBy: "Maintenance Team",
                inspectionDate: new Date().toISOString(),
                remarks: inspectionRemarks,
              }
            : h
        )
      );
      setInspectionDialogOpen(false);
      setSelectedHandover(null);
      setInspectionRemarks("");
      toast.error("Tool handover rejected!");
    }
  };

  const getProjectDetails = (projectId: string) => {
    return projects.find(p => p.id === projectId);
  };

  const getPRDetails = (prId: string) => {
    return prs.find(pr => pr.id === prId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending Inspection":
        return "bg-yellow-500";
      case "Approved":
        return "bg-green-500";
      case "Rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const handleEdit = (handover: ToolHandoverRecord) => {
    setSelectedHandover(handover);
    setFormData({
      projectId: handover.projectId,
      prId: handover.prId,
      toolSet: handover.toolSet,
    });
    setSpares(handover.criticalSpares);
    setIsEditMode(true);
    setEditDialogOpen(true);
  };

  const handleDelete = (handoverId: string) => {
    if (window.confirm("Are you sure you want to delete this handover record?")) {
      setHandovers(handovers.filter(h => h.id !== handoverId));
    }
  };

  const handleViewDetails = (handover: ToolHandoverRecord) => {
    setSelectedHandover(handover);
    setViewDetailsDialogOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedHandover) {
      setHandovers(
        handovers.map(h =>
          h.id === selectedHandover.id
            ? {
                ...h,
                projectId: formData.projectId,
                prId: formData.prId,
                toolSet: formData.toolSet,
                criticalSpares: spares,
              }
            : h
        )
      );
      setEditDialogOpen(false);
      setIsEditMode(false);
      setSelectedHandover(null);
      setFormData({ projectId: "", prId: "", toolSet: "" });
      setSpares([]);
      toast.success("Tool handover record updated successfully!");
    }
  };

  const exportToPDF = (handover: ToolHandoverRecord) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Tool Handover Record", 14, 20);
    doc.setFontSize(12);
    doc.text(`Handover ID: ${handover.id}`, 14, 30);
    doc.text(`Project: ${getProjectDetails(handover.projectId)?.customerPO || "N/A"}`, 14, 40);
    doc.text(`PR: ${getPRDetails(handover.prId)?.id || "N/A"} (${getPRDetails(handover.prId)?.prType || "N/A"})`, 14, 50);
    doc.text(`Tool Set: ${handover.toolSet}`, 14, 60);
    doc.text(`Status: ${handover.status}`, 14, 70);
    doc.text(`Inspected By: ${handover.inspectedBy || "N/A"}`, 14, 80);
    doc.text(`Inspection Date: ${handover.inspectionDate ? new Date(handover.inspectionDate).toLocaleDateString() : "N/A"}`, 14, 90);
    doc.text(`Remarks: ${handover.remarks || "N/A"}`, 14, 100);

    const sparesData = handover.criticalSpares.map(spare => [spare.name, spare.partNumber, spare.toolNumber, spare.quantity]);
    autoTable(doc, {
      head: [['Spare Name', 'Part Number', 'Tool Number', 'Quantity']],
      body: sparesData,
      startY: 110,
      margin: { top: 10 },
    });

    doc.save(`Tool_Handover_${handover.id}.pdf`);
  };

  // Filter handovers based on search text
  const filteredHandovers = handovers.filter((handover) => {
    if (!filterText) return true;
    
    const searchTerm = filterText.toLowerCase();
    const project = getProjectDetails(handover.projectId);
    const pr = getPRDetails(handover.prId);
    
    return (
      handover.id.toLowerCase().includes(searchTerm) ||
      (project?.customerPO?.toLowerCase() || "").includes(searchTerm) ||
      (project?.partNumber?.toLowerCase() || "").includes(searchTerm) ||
      (pr?.id?.toLowerCase() || "").includes(searchTerm) ||
      (pr?.prType?.toLowerCase() || "").includes(searchTerm) ||
      handover.toolSet.toLowerCase().includes(searchTerm) ||
      handover.status.toLowerCase().includes(searchTerm) ||
      (handover.inspectedBy?.toLowerCase() || "").includes(searchTerm)
    );
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Tool Handover Management</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Inspect and approve tool handovers with critical spares
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {/* Notifications for Items Received PRs */}
        {itemsReceivedPRs.length > 0 && (
          <div className="mb-4 space-y-2">
            {itemsReceivedPRs.map((pr) => {
              const project = getProjectDetails(pr.projectId);
              return (
                <Card key={pr.id} className="bg-green-50 border-green-200">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-green-500 p-2 rounded-full flex-shrink-0">
                        <Wrench className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-green-900">
                          Items Received - Tool Handover Required
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          PR: {pr.id} • {pr.prType} • {pr.items.length} items
                        </p>
                        {project && (
                          <p className="text-xs text-green-600 mt-1">
                            Project: {project.customerPO} • Part: {project.partNumber}
                          </p>
                        )}
                        {pr.itemsReceivedDate && (
                          <p className="text-xs text-green-600 mt-1">
                            Received on: {new Date(pr.itemsReceivedDate).toLocaleString()}
                          </p>
                        )}
                        <p className="text-sm text-green-700 mt-2 font-medium">
                          ✓ Please initiate tool handover process for this PR
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {handovers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No tool handovers yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Search Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by project, PR ID, tool set, status, or inspected by..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="pl-10"
                />
              </div>
              {filterText && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setFilterText("")}
                  title="Clear filter"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Table or No Results Message */}
            {filteredHandovers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No handovers match your search criteria.</p>
                <p className="text-sm mt-2">Try adjusting your search terms.</p>
              </div>
            ) : (
              <TableContainer component={Paper} elevation={3} sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>
                        Project
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>
                        PR ID
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>
                        Tool Set
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>
                        Critical Spares
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>
                        Status
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>
                        Inspected By
                      </TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#475569' }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredHandovers.map((handover) => {
                      const project = getProjectDetails(handover.projectId);
                      const pr = getPRDetails(handover.prId);
                      return (
                        <TableRow 
                          key={handover.id}
                          sx={{ 
                            '&:hover': { backgroundColor: '#f1f5f9' },
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {project ? (
                              <div>
                                <div className="font-medium">{project.customerPO}</div>
                                <div className="text-[10px] text-muted-foreground">{project.partNumber}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {pr ? (
                              <div>
                                <div className="font-medium">{pr.id}</div>
                                <div className="text-[10px] text-muted-foreground">{pr.prType}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', maxWidth: '200px' }}>
                            <div className="truncate" title={handover.toolSet}>
                              {handover.toolSet}
                            </div>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            <div>
                              <div className="font-semibold text-blue-600">
                                {handover.criticalSpares?.length || 0} items
                              </div>
                              {handover.criticalSpares && handover.criticalSpares.length > 0 && (
                                <div className="text-[10px] text-muted-foreground truncate" title={handover.criticalSpares.map(s => s.name).join(', ')}>
                                  {handover.criticalSpares.slice(0, 2).map(s => s.name).join(', ')}
                                  {handover.criticalSpares.length > 2 && ` +${handover.criticalSpares.length - 2} more`}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            <Badge className={getStatusColor(handover.status)}>
                              {handover.status}
                            </Badge>
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {handover.inspectedBy ? (
                              <div>
                                <div className="font-medium">{handover.inspectedBy}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {handover.inspectionDate ? new Date(handover.inspectionDate).toLocaleDateString() : '-'}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <div className="flex gap-1 justify-center">
                              {userRole === "NPD" ? (
                                // NPD users only see View icon
                                <Tooltip title="View Details">
                                  <IconButton 
                                    size="small"
                                    onClick={() => {
                                      if (onNavigateToInspection) {
                                        onNavigateToInspection(handover);
                                      } else {
                                        setSelectedHandover(handover);
                                        setInspectionDialogOpen(true);
                                      }
                                    }}
                                    sx={{ 
                                      color: '#2563eb',
                                      '&:hover': { backgroundColor: '#dbeafe' }
                                    }}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                // Maintenance users see full action buttons
                                <>
                                  <Tooltip title="Inspect">
                                    <IconButton 
                                      size="small"
                                      onClick={() => {
                                        if (onNavigateToInspection) {
                                          onNavigateToInspection(handover);
                                        } else {
                                          setSelectedHandover(handover);
                                          setInspectionDialogOpen(true);
                                        }
                                      }}
                                      sx={{ 
                                        color: '#16a34a',
                                        '&:hover': { backgroundColor: '#dcfce7' }
                                      }}
                                    >
                                      <Wrench className="w-4 h-4" />
                                    </IconButton>
                                  </Tooltip>
                                  {handover.status === "Pending Inspection" && (
                                    <Tooltip title="Delete">
                                      <IconButton 
                                        size="small"
                                        onClick={() => handleDelete(handover.id)}
                                        sx={{ 
                                          color: '#dc2626',
                                          '&:hover': { backgroundColor: '#fee2e2' }
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Download PDF">
                                    <IconButton 
                                      size="small"
                                      onClick={() => exportToPDF(handover)}
                                      sx={{ 
                                        color: '#16a34a',
                                        '&:hover': { backgroundColor: '#dcfce7' }
                                      }}
                                    >
                                      <Download className="w-4 h-4" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        )}

        {/* Inspection Dialog */}
        <Dialog open={inspectionDialogOpen} onOpenChange={setInspectionDialogOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto scrollbar-smart">
            <DialogHeader>
              <DialogTitle>Inspect Tool Handover</DialogTitle>
              <DialogDescription>
                Review all PR items and critical spares, then provide inspection remarks.
              </DialogDescription>
            </DialogHeader>
            {selectedHandover && (() => {
              const pr = getPRDetails(selectedHandover.prId);
              const project = getProjectDetails(selectedHandover.projectId);
              return (
                <div className="space-y-4">
                  {/* Summary Information */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground">PR ID</p>
                      <p className="font-semibold">{selectedHandover.prId}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">PR Type</p>
                      <p className="font-semibold">{pr?.prType || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Project</p>
                      <p className="font-semibold">{project?.customerPO || '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tool Number</p>
                      <p className="font-semibold">{project?.toolNumber || '-'}</p>
                    </div>
                  </div>

                  {/* PR Items Section */}
                  <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-blue-900">
                        PR Items ({selectedHandover.allItems?.length || pr?.items?.length || 0} total)
                      </h3>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-smart">
                      {(selectedHandover.allItems || pr?.items || []).map((item, index) => (
                        <div key={item.id} className="flex items-start gap-3 p-3 bg-white rounded border">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{item.specification}</p>
                            <div className="flex gap-4 mt-1">
                              <span className="text-xs text-gray-600">Qty: <strong>{item.quantity}</strong></span>
                              {item.price && (
                                <span className="text-xs text-gray-600">Price: <strong>₹{item.price.toLocaleString()}</strong></span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Critical Spares Section */}
                  <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Wrench className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-green-900">
                        Critical Spares ({selectedHandover.criticalSpares.length} items)
                      </h3>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-smart">
                      {selectedHandover.criticalSpares.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <p className="text-sm">No critical spares designated for this PR</p>
                        </div>
                      ) : (
                        selectedHandover.criticalSpares.map((spare, index) => (
                          <div key={spare.id} className="flex items-center gap-3 p-3 bg-white rounded border border-green-200">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{spare.name}</p>
                              <div className="flex gap-4 mt-1">
                                <span className="text-xs text-gray-600">Part No: <strong>{spare.partNumber}</strong></span>
                                <span className="text-xs text-gray-600">Tool No: <strong>{spare.toolNumber}</strong></span>
                                <span className="text-xs text-gray-600">Critical Spare Qty: <strong>{spare.quantity}</strong></span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Inspection Remarks */}
                  <div className="space-y-2">
                    <Label htmlFor="remarks">Inspection Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={inspectionRemarks}
                      onChange={(e) => setInspectionRemarks(e.target.value)}
                      placeholder="Enter inspection notes, observations, or any issues found..."
                      rows={4}
                      className="resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleApprove}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={selectedHandover.status !== "Pending Inspection"}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Handover
                    </Button>
                    <Button
                      onClick={handleReject}
                      className="flex-1 bg-red-600 hover:bg-red-700"
                      disabled={selectedHandover.status !== "Pending Inspection"}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Handover
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-smart">
            <DialogHeader>
              <DialogTitle>Edit Tool Handover</DialogTitle>
              <DialogDescription>
                Modify the tool handover record and update critical spares information.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEdit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Select Project</Label>
                  <Select
                    value={formData.projectId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, projectId: value, prId: "" });
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.customerPO} - {project.partNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prId">Select PR</Label>
                  <Select
                    value={formData.prId}
                    onValueChange={(value) => setFormData({ ...formData, prId: value })}
                    required
                    disabled={!formData.projectId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a PR" />
                    </SelectTrigger>
                    <SelectContent>
                      {awardedPRs
                        .filter(pr => pr.projectId === formData.projectId)
                        .map((pr) => (
                          <SelectItem key={pr.id} value={pr.id}>
                            {pr.id} - {pr.prType}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="toolSet">Tool Set Description</Label>
                <Input
                  id="toolSet"
                  value={formData.toolSet}
                  onChange={(e) =>
                    setFormData({ ...formData, toolSet: e.target.value })
                  }
                  placeholder="e.g., 1 Set - Complete Assembly"
                  required
                />
              </div>

              <div className="space-y-4">
                <Label>Critical Spares</Label>
                <div className="border rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="partNumber">Part Number</Label>
                      <Input
                        id="partNumber"
                        value={currentSpare.partNumber}
                        onChange={(e) =>
                          setCurrentSpare({ ...currentSpare, partNumber: e.target.value })
                        }
                        placeholder="PN-12345"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toolNumber">Tool Number</Label>
                      <Input
                        id="toolNumber"
                        value={currentSpare.toolNumber}
                        onChange={(e) =>
                          setCurrentSpare({ ...currentSpare, toolNumber: e.target.value })
                        }
                        placeholder="TN-67890"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="spareName">Spare Name</Label>
                      <Input
                        id="spareName"
                        value={currentSpare.name}
                        onChange={(e) =>
                          setCurrentSpare({ ...currentSpare, name: e.target.value })
                        }
                        placeholder="e.g., Bearing Assembly"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="spareQuantity">Quantity</Label>
                      <Input
                        id="spareQuantity"
                        type="number"
                        value={currentSpare.quantity}
                        onChange={(e) =>
                          setCurrentSpare({ ...currentSpare, quantity: e.target.value })
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <Button type="button" onClick={handleAddSpare} variant="outline">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Spare
                  </Button>
                </div>

                {spares.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Added Spares ({spares.length})</p>
                    {spares.map((spare) => (
                      <div
                        key={spare.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{spare.name}</p>
                          <p className="text-sm text-muted-foreground">
                            PN: {spare.partNumber} • TN: {spare.toolNumber} • Qty: {spare.quantity}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSpare(spare.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={spares.length === 0}>
                  Save Changes
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsDialogOpen} onOpenChange={setViewDetailsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-smart">
            <DialogHeader>
              <DialogTitle>Tool Handover Details</DialogTitle>
              <DialogDescription>
                View comprehensive details of the tool handover record and critical spares.
              </DialogDescription>
            </DialogHeader>
            {selectedHandover && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">PR ID: {selectedHandover.prId}</p>
                  <p className="text-sm text-muted-foreground">
                    Critical Spares: {selectedHandover.criticalSpares.length} items
                  </p>
                </div>

                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto scrollbar-smart">
                  <p className="text-sm font-medium mb-2">Spares Checklist</p>
                  {selectedHandover.criticalSpares.map((spare) => (
                    <div key={spare.id} className="flex items-center gap-2 py-2 border-b">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{spare.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {spare.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">Inspection Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={selectedHandover.remarks || ""}
                    onChange={(e) => setInspectionRemarks(e.target.value)}
                    placeholder="Enter inspection notes or missing spares..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => exportToPDF(selectedHandover)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to PDF
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
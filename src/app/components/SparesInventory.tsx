import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "./ui/dialog";
import { Plus, Database, ShoppingCart, AlertTriangle, Package, Search, X, Eye, Edit, Trash2, Download, ChevronLeft, ChevronRight, ArrowLeft, History, TrendingDown, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { InventoryItem, SparesRequest, StockAddition, StockRemoval, Project } from "./Dashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Pagination, 
  Box,
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableContainer,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  TableSortLabel,
  Paper,
  Chip,
  IconButton,
  Tooltip
} from "@mui/material";
import { InventoryDetailView } from "./InventoryDetailView";

type SortableKeys = 'name' | 'partNumber' | 'toolNumber' | 'stockLevel' | 'minStockLevel' | 'status';

// Spares Inventory Component with KPI Cards, Pagination, and Actions
interface SparesInventoryProps {
  inventory: InventoryItem[];
  setInventory: (inventory: InventoryItem[]) => void;
  sparesRequests: SparesRequest[];
  setSparesRequests: (requests: SparesRequest[]) => void;
  userRole: "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";
  onNavigateToPR?: () => void;
  projects?: Project[];
}

export function SparesInventory({
  inventory,
  setInventory,
  sparesRequests,
  setSparesRequests,
  userRole,
  onNavigateToPR,
  projects = [],
}: SparesInventoryProps) {
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isReorderDialogOpen, setIsReorderDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState("");
  const [requestFilter, setRequestFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [inventoryForm, setInventoryForm] = useState({
    partNumber: "",
    toolNumber: "",
    name: "",
    quantity: "",
    minStockLevel: "",
  });

  const [editForm, setEditForm] = useState({
    partNumber: "",
    toolNumber: "",
    name: "",
    quantity: "",
    minStockLevel: "",
  });

  const [requestForm, setRequestForm] = useState({
    projectId: "",
    partNumber: "",
    toolNumber: "",
    itemName: "",
    quantity: "",
    purpose: "",
  });

  const [reorderForm, setReorderForm] = useState({
    quantity: "",
    reason: "",
  });

  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = parseInt(inventoryForm.quantity);
    const minStock = parseInt(inventoryForm.minStockLevel);

    const newItem: InventoryItem = {
      id: `INV-${Date.now()}`,
      partNumber: inventoryForm.partNumber,
      toolNumber: inventoryForm.toolNumber,
      name: inventoryForm.name,
      quantity: quantity,
      stockLevel: quantity,
      minStockLevel: minStock,
      status:
        quantity === 0
          ? "Out of Stock"
          : quantity <= minStock
          ? "Low Stock"
          : "In Stock",
    };

    setInventory([...inventory, newItem]);
    setIsInventoryDialogOpen(false);
    setInventoryForm({
      partNumber: "",
      toolNumber: "",
      name: "",
      quantity: "",
      minStockLevel: "",
    });
  };

  const handleEditInventory = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) return;

    const quantity = parseInt(editForm.quantity);
    const minStock = parseInt(editForm.minStockLevel);

    const updatedInventory = inventory.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          partNumber: editForm.partNumber,
          toolNumber: editForm.toolNumber,
          name: editForm.name,
          quantity: quantity,
          stockLevel: quantity,
          minStockLevel: minStock,
          status:
            quantity === 0
              ? "Out of Stock"
              : quantity <= minStock
              ? "Low Stock"
              : "In Stock",
        };
      }
      return item;
    });

    setInventory(updatedInventory);
    setIsEditDialogOpen(false);
    setSelectedItem(null);
    setEditForm({
      partNumber: "",
      toolNumber: "",
      name: "",
      quantity: "",
      minStockLevel: "",
    });
  };

  const handleRequestSpares = (e: React.FormEvent) => {
    e.preventDefault();

    // Find the inventory item to get the item name
    const inventoryItem = inventory.find(
      item => item.partNumber === requestForm.partNumber && item.toolNumber === requestForm.toolNumber
    );

    const newRequest: SparesRequest = {
      id: `REQ-${Date.now()}`,
      requestedBy: "Indentor",
      itemName: requestForm.itemName || inventoryItem?.name || "Unknown Item",
      partNumber: requestForm.partNumber,
      toolNumber: requestForm.toolNumber,
      quantityRequested: parseInt(requestForm.quantity),
      quantityFulfilled: 0,
      status: "Pending",
      requestDate: new Date().toISOString(),
      projectId: requestForm.projectId || undefined,
      purpose: requestForm.purpose || undefined,
    };

    setSparesRequests([...sparesRequests, newRequest]);
    setIsRequestDialogOpen(false);
    setRequestForm({
      projectId: "",
      partNumber: "",
      toolNumber: "",
      itemName: "",
      quantity: "",
      purpose: "",
    });
  };

  const handleFulfillRequest = (requestId: string) => {
    const request = sparesRequests.find(r => r.id === requestId);
    if (!request) return;

    // Update inventory with removal history
    setInventory(
      inventory.map(item => {
        if (item.partNumber === request.partNumber) {
          const newStockLevel = item.stockLevel - request.quantity;
          
          // Add removal history entry
          const newRemoval: StockRemoval = {
            id: `REM-${Date.now()}`,
            date: new Date().toISOString(),
            quantity: request.quantity,
            requestId: request.id,
            projectId: request.projectId,
            requestedBy: request.requestedBy,
          };

          return {
            ...item,
            stockLevel: newStockLevel,
            status:
              newStockLevel === 0
                ? "Out of Stock"
                : newStockLevel <= item.minStockLevel
                ? "Low Stock"
                : "In Stock",
            removalHistory: [...(item.removalHistory || []), newRemoval],
          };
        }
        return item;
      })
    );

    // Update request status
    setSparesRequests(
      sparesRequests.map(r =>
        r.id === requestId ? { ...r, status: "Fulfilled" } : r
      )
    );
  };

  const handleRaiseReorderPR = (e: React.FormEvent) => {
    e.preventDefault();

    // In a real application, this would create a new PR
    alert(
      `Reorder PR raised for ${selectedItem?.name}\nQuantity: ${reorderForm.quantity}\nReason: ${reorderForm.reason}\n\nThis PR will be sent to Approver Team for review.`
    );

    setIsReorderDialogOpen(false);
    setSelectedItem(null);
    setReorderForm({
      quantity: "",
      reason: "",
    });

    if (onNavigateToPR) {
      onNavigateToPR();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Stock":
        return "bg-green-500";
      case "Low Stock":
        return "bg-orange-500";
      case "Out of Stock":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500";
      case "Fulfilled":
        return "bg-green-500";
      case "Rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Filter functions
  const filteredInventory = inventory.filter((item) => {
    const searchTerm = inventoryFilter.toLowerCase();
    return (
      item.name.toLowerCase().includes(searchTerm) ||
      item.partNumber.toLowerCase().includes(searchTerm) ||
      item.toolNumber.toLowerCase().includes(searchTerm) ||
      item.status.toLowerCase().includes(searchTerm)
    );
  });

  const filteredRequests = sparesRequests.filter((request) => {
    const searchTerm = requestFilter.toLowerCase();
    return (
      request.id.toLowerCase().includes(searchTerm) ||
      request.partNumber.toLowerCase().includes(searchTerm) ||
      request.toolNumber.toLowerCase().includes(searchTerm) ||
      request.requestedBy.toLowerCase().includes(searchTerm) ||
      request.status.toLowerCase().includes(searchTerm)
    );
  });

  // Calculate KPIs
  const totalItems = inventory.length;
  const inStockCount = inventory.filter(item => item.status === "In Stock").length;
  const lowStockCount = inventory.filter(item => item.status === "Low Stock").length;
  const outOfStockCount = inventory.filter(item => item.status === "Out of Stock").length;
  const totalStockValue = inventory.reduce((sum, item) => sum + item.stockLevel, 0);

  // Sorting for inventory
  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys, direction: 'ascending' | 'descending' } | null>(null);

  const sortedInventory = useMemo(() => {
    let sortableItems = [...filteredInventory];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredInventory, sortConfig]);

  const requestSort = (key: SortableKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: SortableKeys) => {
    if (!sortConfig) return null;
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  // Pagination
  const totalPages = Math.ceil(sortedInventory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInventory = sortedInventory.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  const handleFilterChange = (value: string) => {
    setInventoryFilter(value);
    setCurrentPage(1);
  };

  // If in detail mode and item is selected, show detail view
  if (userRole === "Spares" && viewMode === 'detail' && selectedItem) {
    return (
      <InventoryDetailView
        item={selectedItem}
        onBack={() => {
          setViewMode('list');
          setSelectedItem(null);
        }}
        getStatusColor={getStatusColor}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Tool Inventory View for Maintenance */}
      {userRole === "Maintenance" && (
        <Card>
          <CardHeader>
            <CardTitle>Tool Inventory</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              View critical spares inventory for tools under maintenance
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, part number, tool number, or status..."
                  value={inventoryFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              {inventoryFilter && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setInventoryFilter("")}
                  title="Clear filter"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {filteredInventory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{inventoryFilter ? "No inventory items match your search." : "No inventory items available yet."}</p>
                {inventoryFilter && <p className="text-sm mt-2">Try adjusting your search terms.</p>}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Spare Name</TableHead>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Tool Number</TableHead>
                      <TableHead className="text-center">Stock Level</TableHead>
                      <TableHead className="text-center">Min Stock</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInventory.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.partNumber}</TableCell>
                        <TableCell>{item.toolNumber}</TableCell>
                        <TableCell className="text-center font-semibold">{item.stockLevel}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{item.minStockLevel}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show Inventory View for Indentor */}
      {userRole === "Indentor" && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>Tool Inventory</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  View available spares inventory and request for production
                </p>
              </div>
              <Button
                onClick={() => {
                  setRequestForm({
                    projectId: "",
                    partNumber: "",
                    toolNumber: "",
                    itemName: "",
                    quantity: "",
                    purpose: "",
                  });
                  setIsRequestDialogOpen(true);
                }}
                className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Request
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, part number, tool number, or status..."
                  value={inventoryFilter}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              {inventoryFilter && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setInventoryFilter("")}
                  title="Clear filter"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {filteredInventory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{inventoryFilter ? "No inventory items match your search." : "No inventory items available yet."}</p>
                {inventoryFilter && <p className="text-sm mt-2">Try adjusting your search terms.</p>}
              </div>
            ) : (
              <div>
                <div className="rounded-md border max-h-[500px] overflow-y-auto scrollbar-smart">
                  <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow>
                      <TableHead className="w-[200px]">Spare Name</TableHead>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Tool Number</TableHead>
                      <TableHead className="text-center">Stock Level</TableHead>
                      <TableHead className="text-center">Min Stock</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Spare Request</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedInventory.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.partNumber}</TableCell>
                        <TableCell>{item.toolNumber}</TableCell>
                        <TableCell className="text-center font-semibold">{item.stockLevel}</TableCell>
                        <TableCell className="text-center text-muted-foreground">{item.minStockLevel}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            onClick={() => {
                              setRequestForm({
                                projectId: "",
                                partNumber: item.partNumber,
                                toolNumber: item.toolNumber,
                                itemName: item.name,
                                quantity: "",
                                purpose: "",
                              });
                              setIsRequestDialogOpen(true);
                            }}
                            disabled={item.status === "Out of Stock"}
                            className="bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 disabled:opacity-50"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Request
                          </Button>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedItem(item);
                                setViewMode('detail');
                              }}
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                const dataStr = JSON.stringify(item, null, 2);
                                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `${item.partNumber}_${item.name}.json`;
                                link.click();
                                URL.revokeObjectURL(url);
                              }}
                              title="Download Item Details"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Inventory Management */}
      {userRole === "Spares" && (
        <>
          {/* KPI Cards - Circular Gradient Design - Compact Version */}
          <div className="grid grid-cols-5 gap-3">
            {/* Total Items */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 shadow-lg flex flex-col items-center justify-center">
                <Database className="w-6 h-6 text-slate-700 mb-0.5" />
                <p className="text-[10px] text-slate-600 mb-0.5">Total Items</p>
                <p className="text-xl font-bold">{totalItems}</p>
              </div>
            </div>

            {/* In Stock */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-200 to-emerald-400 text-emerald-900 shadow-lg flex flex-col items-center justify-center">
                <Package className="w-6 h-6 text-emerald-700 mb-0.5" />
                <p className="text-[10px] text-emerald-700 mb-0.5">In Stock</p>
                <p className="text-xl font-bold">{inStockCount}</p>
              </div>
            </div>

            {/* Low Stock */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-200 to-orange-400 text-orange-900 shadow-lg flex flex-col items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-700 mb-0.5" />
                <p className="text-[10px] text-orange-700 mb-0.5">Low Stock</p>
                <p className="text-xl font-bold">{lowStockCount}</p>
              </div>
            </div>

            {/* Out of Stock */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-200 to-red-400 text-red-900 shadow-lg flex flex-col items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-700 mb-0.5" />
                <p className="text-[10px] text-red-700 mb-0.5">Out of Stock</p>
                <p className="text-xl font-bold">{outOfStockCount}</p>
              </div>
            </div>

            {/* Total Stock Units */}
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-200 to-indigo-400 text-indigo-900 shadow-lg flex flex-col items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-indigo-700 mb-0.5" />
                <p className="text-[10px] text-indigo-700 mb-0.5">Total Stock Units</p>
                <p className="text-xl font-bold">{totalStockValue}</p>
              </div>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tool Inventory</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage critical spares inventory and reorder items
                  </p>
                </div>
                <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Inventory
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Inventory Item</DialogTitle>
                      <DialogDescription>
                        Add a new spare part to the inventory with stock levels
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddInventory} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="invPartNumber">Part Number</Label>
                          <Input
                            id="invPartNumber"
                            value={inventoryForm.partNumber}
                            onChange={(e) =>
                              setInventoryForm({ ...inventoryForm, partNumber: e.target.value })
                            }
                            placeholder="PN-12345"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invToolNumber">Tool Number</Label>
                          <Input
                            id="invToolNumber"
                            value={inventoryForm.toolNumber}
                            onChange={(e) =>
                              setInventoryForm({ ...inventoryForm, toolNumber: e.target.value })
                            }
                            placeholder="TN-67890"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="invName">Spare Name</Label>
                        <Input
                          id="invName"
                          value={inventoryForm.name}
                          onChange={(e) =>
                            setInventoryForm({ ...inventoryForm, name: e.target.value })
                          }
                          placeholder="e.g., Bearing Assembly"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="invQuantity">Initial Quantity</Label>
                          <Input
                            id="invQuantity"
                            type="number"
                            value={inventoryForm.quantity}
                            onChange={(e) =>
                              setInventoryForm({ ...inventoryForm, quantity: e.target.value })
                            }
                            placeholder="0"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="minStock">Min Stock Level</Label>
                          <Input
                            id="minStock"
                            type="number"
                            value={inventoryForm.minStockLevel}
                            onChange={(e) =>
                              setInventoryForm({
                                ...inventoryForm,
                                minStockLevel: e.target.value,
                              })
                            }
                            placeholder="5"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsInventoryDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Add Item</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="mb-3 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, part number, tool number, or status..."
                    value={inventoryFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
                {inventoryFilter && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInventoryFilter("")}
                    title="Clear filter"
                    className="h-9 px-3"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {filteredInventory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Database className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">{inventoryFilter ? "No inventory items match your search." : "No inventory items yet."}</p>
                  {inventoryFilter && <p className="text-xs mt-1">Try adjusting your search terms.</p>}
                </div>
              ) : (
                <>
                  <div className="rounded-md border overflow-hidden">
                    {/* Sticky Header */}
                    <div className="relative overflow-hidden">
                      <table className="w-full table-fixed">
                        <colgroup>
                          <col style={{ width: '200px' }} />
                          <col style={{ width: '110px' }} />
                          <col style={{ width: '110px' }} />
                          <col style={{ width: '75px' }} />
                          <col style={{ width: '75px' }} />
                          <col style={{ width: '110px' }} />
                          <col style={{ width: '100px' }} />
                          <col style={{ width: 'auto' }} />
                        </colgroup>
                        <thead className="sticky top-0 bg-muted/90 backdrop-blur z-20 shadow-sm">
                          <tr className="border-b">
                            <th 
                              className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-xs cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => requestSort("name")}
                            >
                              <div className="flex items-center gap-1">
                                Spare Name {getSortIndicator("name")}
                              </div>
                            </th>
                            <th 
                              className="h-10 px-2 text-left align-middle font-medium text-muted-foreground text-xs cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => requestSort("partNumber")}
                            >
                              <div className="flex items-center gap-1">
                                Part Number {getSortIndicator("partNumber")}
                              </div>
                            </th>
                            <th 
                              className="h-10 px-2 text-left align-middle font-medium text-muted-foreground text-xs cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => requestSort("toolNumber")}
                            >
                              <div className="flex items-center gap-1">
                                Tool Number {getSortIndicator("toolNumber")}
                              </div>
                            </th>
                            <th 
                              className="h-10 px-1 text-center align-middle font-medium text-muted-foreground text-xs cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => requestSort("stockLevel")}
                            >
                              <div className="flex items-center justify-center gap-1">
                                Stock Level {getSortIndicator("stockLevel")}
                              </div>
                            </th>
                            <th 
                              className="h-10 px-1 text-center align-middle font-medium text-muted-foreground text-xs cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => requestSort("minStockLevel")}
                            >
                              <div className="flex items-center justify-center gap-1">
                                Min Stock {getSortIndicator("minStockLevel")}
                              </div>
                            </th>
                            <th 
                              className="h-10 px-4 text-center align-middle font-medium text-muted-foreground text-xs cursor-pointer hover:bg-muted transition-colors"
                              onClick={() => requestSort("status")}
                            >
                              <div className="flex items-center justify-center gap-1">
                                Status {getSortIndicator("status")}
                              </div>
                            </th>
                            <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground text-xs">
                              Reorder
                            </th>
                            <th className="h-10 px-4 text-center align-middle font-medium text-muted-foreground text-xs">
                              Actions
                            </th>
                          </tr>
                        </thead>
                      </table>
                    </div>
                    
                    {/* Scrollable Body */}
                    <div className="max-h-[calc(100vh-500px)] overflow-y-auto">
                      <table className="w-full table-fixed">
                        <colgroup>
                          <col style={{ width: '200px' }} />
                          <col style={{ width: '110px' }} />
                          <col style={{ width: '110px' }} />
                          <col style={{ width: '75px' }} />
                          <col style={{ width: '75px' }} />
                          <col style={{ width: '110px' }} />
                          <col style={{ width: '100px' }} />
                          <col style={{ width: 'auto' }} />
                        </colgroup>
                        <tbody>
                          {paginatedInventory.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="px-4 py-2.5 align-middle font-medium text-xs">
                                {item.name}
                              </td>
                              <td className="px-2 py-2.5 align-middle text-xs">
                                {item.partNumber}
                              </td>
                              <td className="px-2 py-2.5 align-middle text-xs">
                                {item.toolNumber}
                              </td>
                              <td className="px-1 py-2.5 align-middle text-center font-semibold text-xs">
                                {item.stockLevel}
                              </td>
                              <td className="px-1 py-2.5 align-middle text-center text-muted-foreground text-xs">
                                {item.minStockLevel}
                              </td>
                              <td className="px-4 py-2.5 align-middle text-center">
                                <Badge className={`${getStatusColor(item.status)} text-[10px] px-2 py-0.5`}>
                                  {item.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-2.5 align-middle text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    title="Reorder"
                                    onClick={() => {
                                      if (onNavigateToPR) {
                                        onNavigateToPR();
                                      }
                                    }}
                                    disabled={item.status === "In Stock"}
                                  >
                                    <AlertTriangle className={`w-3 h-3 ${item.status === "In Stock" ? "opacity-30" : "text-orange-500"}`} />
                                  </Button>
                                </div>
                              </td>
                              <td className="px-4 py-2.5 align-middle text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    title="View"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setViewMode('detail');
                                    }}
                                  >
                                    <Eye className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    title="Edit"
                                    onClick={() => {
                                      setSelectedItem(item);
                                      setEditForm({
                                        partNumber: item.partNumber,
                                        toolNumber: item.toolNumber,
                                        name: item.name,
                                        quantity: item.quantity.toString(),
                                        minStockLevel: item.minStockLevel.toString(),
                                      });
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    title="Delete"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete ${item.name}?`)) {
                                        setInventory(inventory.filter(inv => inv.id !== item.id));
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0"
                                    title="Download"
                                    onClick={() => {
                                      alert(`Download data for ${item.name}`);
                                    }}
                                  >
                                    <Download className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Pagination Controls - Always visible with more spacing */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    py: 2, 
                    gap: 2,
                    mt: 4,
                    borderTop: '1px solid #e2e8f0',
                    backgroundColor: '#fafafa'
                  }}>
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
                          fontSize: '0.7rem',
                          minWidth: '24px',
                          height: '24px',
                        },
                        '& .Mui-selected': {
                          bgcolor: '#4f46e5 !important',
                        }
                      }}
                    />
                    <p className="text-[11px] text-muted-foreground font-medium">
                      Showing {startIndex + 1}-{Math.min(endIndex, filteredInventory.length)} of {filteredInventory.length} items
                    </p>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Spares Requests */}
      {userRole === "Indentor" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Spares Requests</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {userRole === "Indentor"
                    ? "Request spares for production"
                    : "Manage incoming spares requests"}
                </p>
              </div>
              {userRole === "Indentor" && (
                <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Request Spares
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Production Spares</DialogTitle>
                      <DialogDescription>
                        Submit a request for spares needed for production
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleRequestSpares} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reqProject">Project (Optional)</Label>
                        <Select
                          value={requestForm.projectId}
                          onValueChange={(value) => {
                            const selectedProject = projects.find(p => p.id === value);
                            if (selectedProject) {
                              const inventoryItem = inventory.find(
                                item => item.partNumber === selectedProject.partNumber && 
                                       item.toolNumber === selectedProject.toolNumber
                              );
                              setRequestForm({
                                ...requestForm,
                                projectId: value,
                                partNumber: selectedProject.partNumber,
                                toolNumber: selectedProject.toolNumber,
                                itemName: inventoryItem?.name || "",
                              });
                            }
                          }}
                        >
                          <SelectTrigger id="reqProject">
                            <SelectValue placeholder="Select a project..." />
                          </SelectTrigger>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id}>
                                {project.id}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="reqPartNumber">Part Number <span className="text-red-500">*</span></Label>
                          <Input
                            id="reqPartNumber"
                            value={requestForm.partNumber}
                            onChange={(e) =>
                              setRequestForm({ ...requestForm, partNumber: e.target.value })
                            }
                            placeholder="PN-12345"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reqToolNumber">Tool Number <span className="text-red-500">*</span></Label>
                          <Input
                            id="reqToolNumber"
                            value={requestForm.toolNumber}
                            onChange={(e) =>
                              setRequestForm({ ...requestForm, toolNumber: e.target.value })
                            }
                            placeholder="TN-67890"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reqItemName">Item Name <span className="text-red-500">*</span></Label>
                        <Input
                          id="reqItemName"
                          value={requestForm.itemName}
                          onChange={(e) =>
                            setRequestForm({ ...requestForm, itemName: e.target.value })
                          }
                          placeholder="e.g., Ejector Pin Set, Core Pin, etc."
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reqQuantity">Quantity Required <span className="text-red-500">*</span></Label>
                        <Input
                          id="reqQuantity"
                          type="number"
                          min="1"
                          value={requestForm.quantity}
                          onChange={(e) =>
                            setRequestForm({ ...requestForm, quantity: e.target.value })
                          }
                          placeholder="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reqPurpose">Purpose / Reason (Optional)</Label>
                        <Input
                          id="reqPurpose"
                          value={requestForm.purpose}
                          onChange={(e) =>
                            setRequestForm({ ...requestForm, purpose: e.target.value })
                          }
                          placeholder="e.g., Production Line A, Replacement for worn parts, etc."
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsRequestDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Submit Request</Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No spares requests yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <Card key={request.id} className="border">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{request.id}</h4>
                            <Badge className={getRequestStatusColor(request.status)}>
                              {request.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Part: {request.partNumber} • Tool: {request.toolNumber}</p>
                            <p>Quantity: {request.quantity}</p>
                            <p>Requested by: {request.requestedBy}</p>
                            <p>Date: {new Date(request.requestDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {userRole === "Spares" && request.status === "Pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleFulfillRequest(request.id)}
                          >
                            Fulfill
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reorder Dialog */}
      <Dialog open={isReorderDialogOpen} onOpenChange={setIsReorderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise Reorder PR</DialogTitle>
            <DialogDescription>
              Create a purchase requisition to reorder spare parts
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleRaiseReorderPR} className="space-y-4">
              <div className="p-3 bg-muted rounded">
                <p className="text-sm font-medium">{selectedItem.name}</p>
                <p className="text-sm text-muted-foreground">
                  PN: {selectedItem.partNumber} • TN: {selectedItem.toolNumber}
                </p>
                <p className="text-sm mt-1">
                  Current Stock: {selectedItem.stockLevel} / Min: {selectedItem.minStockLevel}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reorderQty">Reorder Quantity</Label>
                <Input
                  id="reorderQty"
                  type="number"
                  value={reorderForm.quantity}
                  onChange={(e) =>
                    setReorderForm({ ...reorderForm, quantity: e.target.value })
                  }
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Reordering</Label>
                <Textarea
                  id="reason"
                  value={reorderForm.reason}
                  onChange={(e) =>
                    setReorderForm({ ...reorderForm, reason: e.target.value })
                  }
                  placeholder="e.g., Stock level below minimum threshold for production continuity"
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReorderDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Raise PR</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>View Inventory Item</DialogTitle>
            <DialogDescription>
              Detailed information about the inventory item
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded">
                <p className="text-sm font-medium">{selectedItem.name}</p>
                <p className="text-sm text-muted-foreground">
                  PN: {selectedItem.partNumber} • TN: {selectedItem.toolNumber}
                </p>
                <p className="text-sm mt-1">
                  Current Stock: {selectedItem.stockLevel} / Min: {selectedItem.minStockLevel}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="viewPartNumber">Part Number</Label>
                <Input
                  id="viewPartNumber"
                  value={selectedItem.partNumber}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="viewToolNumber">Tool Number</Label>
                <Input
                  id="viewToolNumber"
                  value={selectedItem.toolNumber}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="viewName">Spare Name</Label>
                <Input
                  id="viewName"
                  value={selectedItem.name}
                  readOnly
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="viewQuantity">Initial Quantity</Label>
                  <Input
                    id="viewQuantity"
                    type="number"
                    value={selectedItem.quantity.toString()}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="viewMinStock">Min Stock Level</Label>
                  <Input
                    id="viewMinStock"
                    type="number"
                    value={selectedItem.minStockLevel.toString()}
                    readOnly
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update the details of the inventory item
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditInventory} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editPartNumber">Part Number</Label>
                  <Input
                    id="editPartNumber"
                    value={editForm.partNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, partNumber: e.target.value })
                    }
                    placeholder="PN-12345"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editToolNumber">Tool Number</Label>
                  <Input
                    id="editToolNumber"
                    value={editForm.toolNumber}
                    onChange={(e) =>
                      setEditForm({ ...editForm, toolNumber: e.target.value })
                    }
                    placeholder="TN-67890"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="editName">Spare Name</Label>
                <Input
                  id="editName"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="e.g., Bearing Assembly"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editQuantity">Initial Quantity</Label>
                  <Input
                    id="editQuantity"
                    type="number"
                    value={editForm.quantity}
                    onChange={(e) =>
                      setEditForm({ ...editForm, quantity: e.target.value })
                    }
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editMinStock">Min Stock Level</Label>
                  <Input
                    id="editMinStock"
                    type="number"
                    value={editForm.minStockLevel}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        minStockLevel: e.target.value,
                      })
                    }
                    placeholder="5"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Item</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
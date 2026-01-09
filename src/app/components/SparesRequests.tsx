import type { SparesRequest } from "./Dashboard";
import type { InventoryItem } from "./Dashboard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { useState } from "react";
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Pencil,
  Package,
  MinusCircle,
  ArrowLeft,
  Save,
  Trash2,
  Eye,
} from "lucide-react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

interface SparesRequestsProps {
  sparesRequests: SparesRequest[];
  setSparesRequests: (requests: SparesRequest[]) => void;
  userRole: string;
  inventory: InventoryItem[];
  setInventory: (inventory: InventoryItem[]) => void;
}

export function SparesRequests({
  sparesRequests,
  setSparesRequests,
  userRole,
  inventory,
  setInventory,
}: SparesRequestsProps) {
  const [requestStatusFilter, setRequestStatusFilter] = useState<"All" | "Pending" | "Fulfilled" | "Partially Fulfilled" | "Rejected">("All");
  const [editingRequest, setEditingRequest] = useState<SparesRequest | null>(null);
  const [editQuantityFulfilled, setEditQuantityFulfilled] = useState<number>(0);
  const [editReason, setEditReason] = useState<string>("");
  const [showEditScreen, setShowEditScreen] = useState(false);
  
  // Edit fields for Pending requests (Indentor editing their own request)
  const [editQuantityRequested, setEditQuantityRequested] = useState<number>(0);
  const [editPurpose, setEditPurpose] = useState<string>("");

  const pendingRequests = sparesRequests.filter(req => req.status === "Pending").length;
  const fulfilledRequests = sparesRequests.filter(req => req.status === "Fulfilled").length;
  const partiallyFulfilledRequests = sparesRequests.filter(req => req.status === "Partially Fulfilled").length;
  const rejectedRequests = sparesRequests.filter(req => req.status === "Rejected").length;

  const handleEditClick = (request: SparesRequest) => {
    setEditingRequest(request);
    setEditQuantityFulfilled(request.quantityFulfilled);
    setEditReason("");
    // For Pending requests, set editable fields
    setEditQuantityRequested(request.quantityRequested);
    setEditPurpose(request.purpose || "");
    setShowEditScreen(true);
  };

  const handleFulfilledAction = () => {
    if (!editingRequest) return;
    
    // Calculate the quantity change (how much we're actually fulfilling now)
    const quantityChange = editQuantityFulfilled - editingRequest.quantityFulfilled;
    
    // Update the spares request
    const updatedRequests = sparesRequests.map(req =>
      req.id === editingRequest.id
        ? {
            ...req,
            quantityFulfilled: editQuantityFulfilled,
            status: "Fulfilled" as const,
          }
        : req
    );
    setSparesRequests(updatedRequests);
    
    // Update the inventory - decrease stock level and add removal history
    const updatedInventory = inventory.map(item =>
      item.partNumber === editingRequest.partNumber && item.toolNumber === editingRequest.toolNumber
        ? {
            ...item,
            stockLevel: Math.max(0, item.stockLevel - quantityChange),
            // Only add removal history if there's an actual quantity change
            removalHistory: quantityChange > 0 ? [
              ...(item.removalHistory || []),
              {
                id: `REM-${Date.now()}`,
                date: new Date().toISOString(),
                quantity: quantityChange,
                requestId: editingRequest.id,
                projectId: editingRequest.projectId,
                requestedBy: editingRequest.requestedBy,
              },
            ] : (item.removalHistory || []),
          }
        : item
    );
    setInventory(updatedInventory);
    
    setShowEditScreen(false);
    setEditingRequest(null);
  };

  const handlePartiallyFulfilledAction = () => {
    if (!editingRequest) return;
    
    // Calculate the quantity change (how much we're actually fulfilling now)
    const quantityChange = editQuantityFulfilled - editingRequest.quantityFulfilled;
    
    // Update the spares request
    const updatedRequests = sparesRequests.map(req =>
      req.id === editingRequest.id
        ? {
            ...req,
            quantityFulfilled: editQuantityFulfilled,
            status: "Partially Fulfilled" as const,
          }
        : req
    );
    setSparesRequests(updatedRequests);
    
    // Update the inventory - decrease stock level and add removal history
    const updatedInventory = inventory.map(item =>
      item.partNumber === editingRequest.partNumber && item.toolNumber === editingRequest.toolNumber
        ? {
            ...item,
            stockLevel: Math.max(0, item.stockLevel - quantityChange),
            // Only add removal history if there's an actual quantity change
            removalHistory: quantityChange > 0 ? [
              ...(item.removalHistory || []),
              {
                id: `REM-${Date.now()}`,
                date: new Date().toISOString(),
                quantity: quantityChange,
                requestId: editingRequest.id,
                projectId: editingRequest.projectId,
                requestedBy: editingRequest.requestedBy,
              },
            ] : (item.removalHistory || []),
          }
        : item
    );
    setInventory(updatedInventory);
    
    setShowEditScreen(false);
    setEditingRequest(null);
  };

  const handleRejectedAction = () => {
    if (!editingRequest) return;
    
    const updatedRequests = sparesRequests.map(req =>
      req.id === editingRequest.id
        ? {
            ...req,
            quantityFulfilled: 0,
            status: "Rejected" as const,
          }
        : req
    );
    setSparesRequests(updatedRequests);
    setShowEditScreen(false);
    setEditingRequest(null);
  };

  const handleCancelEdit = () => {
    setShowEditScreen(false);
    setEditingRequest(null);
    setEditQuantityFulfilled(0);
    setEditReason("");
    setEditQuantityRequested(0);
    setEditPurpose("");
  };

  const handleSavePendingRequest = () => {
    if (!editingRequest) return;
    
    // Update the spares request with edited values
    const updatedRequests = sparesRequests.map(req =>
      req.id === editingRequest.id
        ? {
            ...req,
            quantityRequested: editQuantityRequested,
            purpose: editPurpose,
          }
        : req
    );
    setSparesRequests(updatedRequests);
    setShowEditScreen(false);
    setEditingRequest(null);
  };

  const handleDeleteRequest = (requestId: string) => {
    if (confirm("Are you sure you want to delete this pending request?")) {
      const updatedRequests = sparesRequests.filter(req => req.id !== requestId);
      setSparesRequests(updatedRequests);
    }
  };

  const handleViewRequest = (request: SparesRequest) => {
    setEditingRequest(request);
    setEditQuantityFulfilled(request.quantityFulfilled);
    setEditReason("");
    setShowEditScreen(true);
  };

  const getRoleGradient = () => {
    switch (userRole) {
      case "Spares":
        return "from-teal-500 to-emerald-500";
      case "Indentor":
        return "from-rose-500 to-orange-500";
      default:
        return "from-indigo-500 to-purple-500";
    }
  };

  // Show Edit Screen
  if (showEditScreen && editingRequest) {
    // FOR INDENTOR ROLE WITH PENDING STATUS - Simple Edit Screen with editable fields
    if (userRole === "Indentor" && editingRequest.status === "Pending") {
      return (
        <div className="overflow-y-auto flex-1 scrollbar-smart">
          {/* Header - Sticky */}
          <div className="sticky top-0 z-30 bg-gradient-to-br from-orange-50 to-orange-100 px-4 pt-2 pb-1.5 border-b border-orange-200/60 shadow-sm">
            <div className="mb-1.5 flex items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                className="h-7 px-2 hover:bg-orange-200/50"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="text-xs">Back to List</span>
              </Button>
              <div>
                <h1 className="mb-0.5 text-sm font-bold leading-tight">Edit Pending Request</h1>
                <p className="text-[9px] text-muted-foreground flex items-center gap-1 leading-tight">
                  Request ID: <span className="font-semibold text-orange-600">{editingRequest.id}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="max-w-3xl mx-auto">
              <Card className="shadow-lg border-orange-300">
                <CardHeader className="pb-3 bg-gradient-to-br from-orange-50/50 to-amber-50/50">
                  <CardTitle className="text-base font-semibold text-slate-800">Request Details</CardTitle>
                  <CardDescription className="text-xs">Edit your pending spares request</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-6">
                    {/* Read-Only Information */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-600 font-semibold">Request ID</Label>
                        <p className="font-bold text-blue-600">{editingRequest.id}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-600 font-semibold">Indentor</Label>
                        <p className="font-bold text-slate-800">{editingRequest.requestedBy}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-600 font-semibold">Project ID</Label>
                        <p className="font-bold text-slate-800">{editingRequest.projectId || "N/A"}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-600 font-semibold">Request Date</Label>
                        <p className="font-bold text-slate-800">{new Date(editingRequest.requestDate).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-600 font-semibold">Item Name</Label>
                        <p className="font-bold text-slate-800">{editingRequest.itemName}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-slate-600 font-semibold">Part Number</Label>
                        <p className="font-bold text-slate-800">{editingRequest.partNumber}</p>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <Label className="text-[10px] text-slate-600 font-semibold">Tool Number</Label>
                        <p className="font-bold text-slate-800">{editingRequest.toolNumber}</p>
                      </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-4 p-4 bg-blue-50/30 rounded-lg border border-blue-200">
                      <div className="space-y-2">
                        <Label htmlFor="editQuantityRequested" className="text-xs font-semibold text-slate-700">
                          Quantity Requested <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="editQuantityRequested"
                          type="number"
                          min="1"
                          value={editQuantityRequested}
                          onChange={(e) => setEditQuantityRequested(Number(e.target.value))}
                          className="text-xs h-9"
                          placeholder="Enter quantity needed"
                        />
                        <p className="text-[10px] text-slate-500">
                          Specify how many units you need for this request
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="editPurpose" className="text-xs font-semibold text-slate-700">
                          Purpose / Reason <span className="text-slate-400">(Optional)</span>
                        </Label>
                        <Textarea
                          id="editPurpose"
                          value={editPurpose}
                          onChange={(e) => setEditPurpose(e.target.value)}
                          className="text-xs min-h-[100px]"
                          placeholder="Describe the purpose or reason for this spares request..."
                        />
                        <p className="text-[10px] text-slate-500">
                          Explain why you need these spares (e.g., production line, maintenance, etc.)
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-slate-200">
                      <Button
                        type="button"
                        onClick={handleSavePendingRequest}
                        className="flex-1 bg-green-600 hover:bg-green-700 h-10"
                        disabled={editQuantityRequested <= 0}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="flex-1 h-10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      );
    }

    // FOR OTHER STATUSES (Spares Team fulfillment screen)
    const inventoryItem = inventory.find(
      item => item.partNumber === editingRequest.partNumber && 
             item.toolNumber === editingRequest.toolNumber
    );
    const stockLevel = inventoryItem?.stockLevel || 0;
    const minStock = inventoryItem?.minStockLevel || 0;
    const isLowStock = stockLevel < minStock;
    const stockColor = isLowStock ? "text-red-600" : stockLevel < minStock * 1.5 ? "text-orange-600" : "text-green-600";
    const bgColor = isLowStock ? "bg-red-50 border-red-300" : stockLevel < minStock * 1.5 ? "bg-orange-50 border-orange-300" : "bg-green-50 border-green-300";

    return (
      <div className="overflow-y-auto flex-1 scrollbar-smart">
        {/* Header - Sticky */}
        <div className="sticky top-0 z-30 bg-gradient-to-br from-blue-50 to-blue-100 px-4 pt-2 pb-1.5 border-b border-blue-200/60 shadow-sm">
          <div className="mb-1.5 flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
              className="h-7 px-2 hover:bg-blue-200/50"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="text-xs">Back to List</span>
            </Button>
            <div>
              <h1 className="mb-0.5 text-sm font-bold leading-tight">Edit Spares Request</h1>
              <p className="text-[9px] text-muted-foreground flex items-center gap-1 leading-tight">
                Request ID: <span className="font-semibold text-blue-600">{editingRequest.id}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="p-4 h-[calc(100vh-80px)]">
          <div className="grid grid-cols-2 gap-4 h-full">
            {/* LEFT SIDE - Request Details */}
            <div className="flex flex-col">
              <Card className="shadow-lg border-slate-300 flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800">Request Details</CardTitle>
                  <CardDescription className="text-xs">Information from Indentor</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Request ID</Label>
                      <p className="font-bold text-blue-600 text-lg">{editingRequest.id}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Indentor</Label>
                      <p className="font-bold text-slate-800 text-lg">{editingRequest.requestedBy}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Project ID</Label>
                      <p className="font-bold text-slate-800 text-lg">{editingRequest.projectId || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Request Date</Label>
                      <p className="font-bold text-slate-800 text-lg">{new Date(editingRequest.requestDate).toLocaleDateString()}</p>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Item Name</Label>
                      <p className="font-bold text-slate-800 text-lg">{editingRequest.itemName}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Part Number</Label>
                      <p className="font-bold text-slate-800 text-lg">{editingRequest.partNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Tool Number</Label>
                      <p className="font-bold text-slate-800 text-lg">{editingRequest.toolNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Qty Requested</Label>
                      <div>
                        <Badge className="bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100 text-lg px-4 py-1.5 font-bold">
                          {editingRequest.quantityRequested} units
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-slate-600 font-semibold">Current Status</Label>
                      <div>
                        <Badge 
                          variant="secondary" 
                          className={`text-base font-bold px-4 py-1.5 ${
                            editingRequest.status === "Pending" ? "bg-orange-100 text-orange-700 border-orange-300" :
                            editingRequest.status === "Fulfilled" ? "bg-green-100 text-green-700 border-green-300" :
                            editingRequest.status === "Partially Fulfilled" ? "bg-amber-100 text-amber-700 border-amber-300" :
                            "bg-red-100 text-red-700 border-red-300"
                          }`}
                        >
                          {editingRequest.status}
                        </Badge>
                      </div>
                    </div>
                    {editingRequest.purpose && (
                      <div className="col-span-2 space-y-2">
                        <Label className="text-xs text-slate-600 font-semibold">Purpose</Label>
                        <div className="bg-slate-50 p-3 rounded border border-slate-200">
                          <p className="text-sm text-slate-700 font-medium leading-relaxed">{editingRequest.purpose}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT SIDE - Inventory + Update Fulfillment */}
            <div className="flex flex-col gap-4">
              {/* Inventory Stock Alert - Top */}
              <Card className={`${bgColor} border-2 shadow-lg`}>
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Package className={`w-5 h-5 ${stockColor}`} />
                    <Label className="text-xs text-slate-700 font-semibold">Current Tool Inventory</Label>
                  </div>
                  <div className={`text-5xl font-bold ${stockColor} mb-1`}>
                    {stockLevel}
                  </div>
                  <p className="text-xs text-slate-600">
                    Units available in stock
                    {isLowStock && <span className="text-red-600 font-semibold ml-1">(Low Stock Alert!)</span>}
                  </p>
                </CardContent>
              </Card>

              {/* Editable Fields */}
              <Card className="shadow-lg border-blue-300 bg-blue-50/30 flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-slate-800">Update Fulfillment</CardTitle>
                  <CardDescription className="text-[10px]">Enter quantity and reason</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantityFulfilled" className="text-xs font-semibold">
                      Quantity Fulfilled <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="quantityFulfilled"
                      type="number"
                      min="0"
                      max={editingRequest.quantityRequested}
                      value={editQuantityFulfilled}
                      onChange={(e) => setEditQuantityFulfilled(Number(e.target.value))}
                      className="text-xs h-9"
                      placeholder="Enter quantity fulfilled"
                    />
                    <p className="text-[10px] text-slate-500">
                      Maximum: {editingRequest.quantityRequested} units
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-xs font-semibold">
                      Reason / Notes <span className="text-slate-400">(Optional)</span>
                    </Label>
                    <Textarea
                      id="reason"
                      value={editReason}
                      onChange={(e) => setEditReason(e.target.value)}
                      className="text-xs min-h-[100px]"
                      placeholder="Add any notes or reason for partial fulfillment, rejection, etc."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card className="shadow-lg border-slate-300">
                <CardContent className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleFulfilledAction}
                      className="text-xs bg-green-600 hover:bg-green-700 flex-1 min-w-[120px] h-9"
                      disabled={editingRequest.status !== "Pending" || editQuantityFulfilled !== editingRequest.quantityRequested}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Fulfilled
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handlePartiallyFulfilledAction}
                      className="text-xs bg-amber-600 hover:bg-amber-700 flex-1 min-w-[120px] h-9"
                      disabled={editingRequest.status !== "Pending" || editQuantityFulfilled === 0 || editQuantityFulfilled >= editingRequest.quantityRequested}
                    >
                      <MinusCircle className="w-4 h-4 mr-1" />
                      Partially Fulfilled
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleRejectedAction}
                      className="text-xs bg-red-600 hover:bg-red-700 flex-1 min-w-[120px] h-9"
                      disabled={editingRequest.status !== "Pending"}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejected
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show List Screen
  return (
    <div className="overflow-y-auto flex-1 scrollbar-smart">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-30 bg-gradient-to-br from-slate-50 to-slate-100 px-4 pt-2 pb-1.5 border-b border-slate-200/60 shadow-sm">
        <div className="mb-1.5">
          <h1 className="mb-0.5 text-sm font-bold leading-tight">Spares Requests</h1>
          <p className="text-[9px] text-muted-foreground flex items-center gap-1 leading-tight">
            Welcome, <span className={`font-semibold bg-gradient-to-r ${getRoleGradient()} bg-clip-text text-transparent`}>{userRole} Team</span>
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-4">
        <Card className="shadow-lg border-orange-200 bg-gradient-to-br from-orange-50/30 to-amber-50/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  Spares Requests Management
                </CardTitle>
                <CardDescription className="text-[10px]">All indentor requests with status tracking</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-300">
                  {sparesRequests.length} Total
                </Badge>
              </div>
            </div>
            {/* Status Filter Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <span className="text-[10px] font-semibold text-slate-600">Filter:</span>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={requestStatusFilter === "All" ? "default" : "outline"}
                  className={`h-6 px-2 text-[10px] ${
                    requestStatusFilter === "All"
                      ? "bg-slate-600 hover:bg-slate-700 text-white"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                  onClick={() => setRequestStatusFilter("All")}
                >
                  All ({sparesRequests.length})
                </Button>
                <Button
                  size="sm"
                  variant={requestStatusFilter === "Pending" ? "default" : "outline"}
                  className={`h-6 px-2 text-[10px] ${
                    requestStatusFilter === "Pending"
                      ? "bg-orange-600 hover:bg-orange-700 text-white"
                      : "border-orange-300 text-orange-600 hover:bg-orange-50"
                  }`}
                  onClick={() => setRequestStatusFilter("Pending")}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Pending ({pendingRequests})
                </Button>
                <Button
                  size="sm"
                  variant={requestStatusFilter === "Fulfilled" ? "default" : "outline"}
                  className={`h-6 px-2 text-[10px] ${
                    requestStatusFilter === "Fulfilled"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border-green-300 text-green-600 hover:bg-green-50"
                  }`}
                  onClick={() => setRequestStatusFilter("Fulfilled")}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Fulfilled ({fulfilledRequests})
                </Button>
                <Button
                  size="sm"
                  variant={requestStatusFilter === "Partially Fulfilled" ? "default" : "outline"}
                  className={`h-6 px-2 text-[10px] ${
                    requestStatusFilter === "Partially Fulfilled"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-amber-300 text-amber-600 hover:bg-amber-50"
                  }`}
                  onClick={() => setRequestStatusFilter("Partially Fulfilled")}
                >
                  <MinusCircle className="w-3 h-3 mr-1" />
                  Partially Fulfilled ({partiallyFulfilledRequests})
                </Button>
                <Button
                  size="sm"
                  variant={requestStatusFilter === "Rejected" ? "default" : "outline"}
                  className={`h-6 px-2 text-[10px] ${
                    requestStatusFilter === "Rejected"
                      ? "bg-red-600 hover:bg-red-700 text-white"
                      : "border-red-300 text-red-600 hover:bg-red-50"
                  }`}
                  onClick={() => setRequestStatusFilter("Rejected")}
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Rejected ({rejectedRequests})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="text-left p-2 font-semibold text-slate-700">Request ID</th>
                    <th className="text-left p-2 font-semibold text-slate-700">Indentor</th>
                    <th className="text-left p-2 font-semibold text-slate-700">Item Name</th>
                    <th className="text-left p-2 font-semibold text-slate-700">Part Number</th>
                    <th className="text-center p-2 font-semibold text-slate-700">Qty Requested</th>
                    <th className="text-center p-2 font-semibold text-slate-700">Qty Fulfilled</th>
                    <th className="text-left p-2 font-semibold text-slate-700">Request Date</th>
                    <th className="text-center p-2 font-semibold text-slate-700">Status</th>
                    <th className="text-center p-2 font-semibold text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sparesRequests
                    .filter(req => requestStatusFilter === "All" || req.status === requestStatusFilter)
                    .sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime())
                    .map((request) => {
                      const statusConfig = {
                        Pending: {
                          badge: "bg-orange-100 text-orange-700 border-orange-300",
                          icon: <Clock className="w-3 h-3" />,
                          rowHover: "hover:bg-orange-50/50",
                        },
                        Fulfilled: {
                          badge: "bg-green-100 text-green-700 border-green-300",
                          icon: <CheckCircle className="w-3 h-3" />,
                          rowHover: "hover:bg-green-50/50",
                        },
                        "Partially Fulfilled": {
                          badge: "bg-amber-100 text-amber-700 border-amber-300",
                          icon: <MinusCircle className="w-3 h-3" />,
                          rowHover: "hover:bg-amber-50/50",
                        },
                        Rejected: {
                          badge: "bg-red-100 text-red-700 border-red-300",
                          icon: <XCircle className="w-3 h-3" />,
                          rowHover: "hover:bg-red-50/50",
                        },
                      };

                      const config = statusConfig[request.status as keyof typeof statusConfig];

                      return (
                        <tr key={request.id} className={`border-b border-slate-100 ${config.rowHover} transition-colors`}>
                          <td className="p-2 font-medium text-blue-600">{request.id}</td>
                          <td className="p-2">{request.requestedBy}</td>
                          <td className="p-2 font-medium">{request.itemName}</td>
                          <td className="p-2 text-slate-600">{request.partNumber}</td>
                          <td className="p-2 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                              {request.quantityRequested}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-100 text-green-700 font-semibold">
                              {request.quantityFulfilled}
                            </span>
                          </td>
                          <td className="p-2 text-slate-600">
                            {new Date(request.requestDate).toLocaleDateString()}
                          </td>
                          <td className="p-2 text-center">
                            <Badge 
                              variant="secondary" 
                              className={`${config.badge} flex items-center gap-1 justify-center w-fit mx-auto`}
                            >
                              {config.icon}
                              {request.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              {userRole === "Indentor" ? (
                                // INDENTOR VIEW: Edit + Delete for Pending, View for others
                                request.status === "Pending" ? (
                                  <>
                                    {/* Edit Button - Pending Only */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 hover:bg-blue-50"
                                      onClick={() => handleEditClick(request)}
                                      title="Edit Request"
                                    >
                                      <Pencil className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    {/* Delete Button - Pending Only */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 hover:bg-red-50"
                                      onClick={() => handleDeleteRequest(request.id)}
                                      title="Delete Request"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    {/* View Button - All Other Statuses */}
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 w-7 p-0 hover:bg-slate-50"
                                      onClick={() => handleViewRequest(request)}
                                      title="View Request Details"
                                    >
                                      <Eye className="w-4 h-4 text-slate-600" />
                                    </Button>
                                  </>
                                )
                              ) : (
                                // SPARES TEAM VIEW: Edit icon for all requests
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0 hover:bg-blue-50"
                                    onClick={() => handleEditClick(request)}
                                    title="Edit Request"
                                  >
                                    <Pencil className="w-4 h-4 text-blue-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {sparesRequests.filter(req => requestStatusFilter === "All" || req.status === requestStatusFilter).length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-sm text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-8 h-8 text-slate-400" />
                          <p>No {requestStatusFilter.toLowerCase()} requests found</p>
                          <p className="text-xs">Try selecting a different filter</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, History, TrendingUp, TrendingDown, Package } from "lucide-react";
import type { InventoryItem } from "./Dashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface InventoryDetailViewProps {
  item: InventoryItem;
  onBack: () => void;
  getStatusColor: (status: string) => string;
}

export function InventoryDetailView({ item, onBack, getStatusColor }: InventoryDetailViewProps) {
  // Mock data for history - in real app, this would come from the item
  const additionHistory = item.additionHistory || [
    {
      id: "ADD-001",
      date: "2024-12-15T10:30:00",
      quantity: 50,
      prNumber: "PR-2024-001",
      projectId: "PROJ-2024-078",
      prType: "New Set" as const,
    },
    {
      id: "ADD-002",
      date: "2024-11-20T14:15:00",
      quantity: 30,
      prNumber: "PR-2024-045",
      projectId: "PROJ-2024-045",
      prType: "Modification" as const,
    },
    {
      id: "ADD-003",
      date: "2024-10-10T09:00:00",
      quantity: 25,
      prNumber: "PR-2024-023",
      projectId: "PROJ-2024-023",
      prType: "Refurbished" as const,
    },
  ];

  const removalHistory = item.removalHistory || [
    {
      id: "REM-001",
      date: "2024-12-20T11:00:00",
      quantity: 15,
      requestId: "REQ-2024-012",
      projectId: "PROJ-2024-089",
      requestedBy: "Indentor",
    },
    {
      id: "REM-002",
      date: "2024-11-25T16:30:00",
      quantity: 10,
      requestId: "REQ-2024-008",
      projectId: "PROJ-2024-067",
      requestedBy: "Indentor",
    },
    {
      id: "REM-003",
      date: "2024-10-15T13:45:00",
      quantity: 8,
      requestId: "REQ-2024-004",
      projectId: "PROJ-2024-034",
      requestedBy: "Indentor",
    },
  ];

  const getPrTypeColor = (prType: string) => {
    switch (prType) {
      case "New Set":
        return "bg-blue-500";
      case "Modification":
        return "bg-purple-500";
      case "Refurbished":
        return "bg-teal-500";
      default:
        return "bg-gray-500";
    }
  };

  const totalAdded = additionHistory.reduce((sum, item) => sum + item.quantity, 0);
  const totalRemoved = removalHistory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-full overflow-y-auto scrollbar-smart">
      <div className="space-y-4 p-4">
        {/* Header with Back Button */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to List
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{item.name}</h2>
            <p className="text-xs text-muted-foreground">Inventory Detail View</p>
          </div>
        </div>

        {/* Item Summary Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Item Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Part Number</p>
                <p className="text-xs font-medium">{item.partNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Tool Number</p>
                <p className="text-xs font-medium">{item.toolNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Current Stock</p>
                <p className="text-xs font-semibold text-blue-600">{item.stockLevel} units</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-1">Min Stock Level</p>
                <p className="text-xs font-medium text-orange-600">{item.minStockLevel} units</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Status</p>
                  <Badge className={`${getStatusColor(item.status)} text-[10px]`}>
                    {item.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground mb-1">Initial Quantity</p>
                  <p className="text-xs font-medium">{item.quantity} units</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Movement Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 rounded">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Added</p>
                  <p className="text-sm font-bold text-green-600">{totalAdded} units</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-red-100 rounded">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Total Removed</p>
                  <p className="text-sm font-bold text-red-600">{totalRemoved} units</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Net Stock</p>
                  <p className="text-sm font-bold text-blue-600">{item.stockLevel} units</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stock Addition History */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <CardTitle className="text-base">Stock Addition History</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              History of stock additions from approved PRs
            </p>
          </CardHeader>
          <CardContent>
            {additionHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No addition history available</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Quantity Added</TableHead>
                      <TableHead className="text-xs">PR Number</TableHead>
                      <TableHead className="text-xs">Project ID</TableHead>
                      <TableHead className="text-xs">PR Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {additionHistory.map((addition) => (
                      <TableRow key={addition.id} className="hover:bg-muted/50">
                        <TableCell className="text-xs">
                          {new Date(addition.date).toLocaleDateString()} {new Date(addition.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-green-600">
                          +{addition.quantity}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {addition.prNumber}
                        </TableCell>
                        <TableCell className="text-xs">
                          {addition.projectId}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge className={`${getPrTypeColor(addition.prType)} text-[10px]`}>
                            {addition.prType}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stock Removal History */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <CardTitle className="text-base">Stock Removal History</CardTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              History of stock removed for production requests
            </p>
          </CardHeader>
          <CardContent>
            {removalHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No removal history available</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Quantity Removed</TableHead>
                      <TableHead className="text-xs">Request ID</TableHead>
                      <TableHead className="text-xs">Project ID</TableHead>
                      <TableHead className="text-xs">Requested By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {removalHistory.map((removal) => (
                      <TableRow key={removal.id} className="hover:bg-muted/50">
                        <TableCell className="text-xs">
                          {new Date(removal.date).toLocaleDateString()} {new Date(removal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-red-600">
                          -{removal.quantity}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {removal.requestId}
                        </TableCell>
                        <TableCell className="text-xs">
                          {removal.projectId || "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          {removal.requestedBy}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
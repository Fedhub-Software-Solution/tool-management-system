import type { Project, PR, ToolHandoverRecord, SpareItem } from "./Dashboard";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { CheckCircle, XCircle, Wrench, ArrowLeft, Package, Star } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface ToolHandoverInspectionProps {
  handover: ToolHandoverRecord;
  onBack: () => void;
  onApprove: (handover: ToolHandoverRecord, remarks: string) => void;
  onReject: (handover: ToolHandoverRecord, remarks: string) => void;
  projects: Project[];
  prs: PR[];
  userRole?: "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";
}

interface TableItem {
  id: string;
  bomCode: string;
  itemName: string;
  specification: string;
  qty: number;
  isCriticalSpare: boolean;
  criticalSpareQty: number;
}

export function ToolHandoverInspection({
  handover,
  onBack,
  onApprove,
  onReject,
  projects,
  prs,
  userRole,
}: ToolHandoverInspectionProps) {
  const [inspectionRemarks, setInspectionRemarks] = useState("");

  const getPRDetails = (prId: string) => {
    return prs.find((pr) => pr.id === prId);
  };

  const getProjectDetails = (projectId: string) => {
    return projects.find((project) => project.id === projectId);
  };

  const handleApprove = () => {
    if (!inspectionRemarks.trim()) {
      toast.error("Please provide inspection remarks");
      return;
    }
    onApprove(handover, inspectionRemarks);
  };

  const handleReject = () => {
    if (!inspectionRemarks.trim()) {
      toast.error("Please provide rejection remarks");
      return;
    }
    onReject(handover, inspectionRemarks);
  };

  const pr = getPRDetails(handover.prId);
  const project = getProjectDetails(handover.projectId);

  // Combine PR items with critical spare information
  const tableItems: TableItem[] = (handover.allItems || pr?.items || []).map((item, index) => {
    // Check if this item is marked as a critical spare
    const criticalSpare = handover.criticalSpares.find(
      spare => spare.partNumber === item.id || spare.name === item.name
    );

    return {
      id: item.id,
      bomCode: item.id,
      itemName: item.name,
      specification: item.specification || "-",
      qty: item.quantity,
      isCriticalSpare: !!criticalSpare,
      criticalSpareQty: criticalSpare?.quantity || 0,
    };
  });

  const totalItems = tableItems.length;
  const criticalSparesCount = tableItems.filter(item => item.isCriticalSpare).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gradient-to-br from-slate-50 to-slate-100 px-4 pt-2 pb-1.5 border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-3 mb-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-7 px-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="mb-0.5 text-sm font-bold leading-tight">
              Inspect Tool Handover
            </h1>
            <p className="text-[9px] text-muted-foreground flex items-center gap-1 leading-tight">
              Review all PR items and critical spares, then provide inspection remarks
            </p>
          </div>
          <Badge
            variant={
              handover.status === "Pending Inspection"
                ? "default"
                : handover.status === "Approved"
                ? "secondary"
                : "destructive"
            }
            className="text-xs"
          >
            {handover.status}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-smart">
        {/* Summary Information */}
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Handover Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Handover ID</p>
                <p className="text-sm font-semibold">{handover.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">PR ID</p>
                <p className="text-sm font-semibold">{handover.prId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">PR Type</p>
                <p className="text-sm font-semibold">{pr?.prType || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Project</p>
                <p className="text-sm font-semibold">
                  {project?.customerPO || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Part Number</p>
                <p className="text-sm font-semibold">
                  {project?.partNumber || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tool Number</p>
                <p className="text-sm font-semibold">
                  {project?.toolNumber || "-"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Handover Date</p>
                <p className="text-sm font-semibold">{handover.handoverDate || new Date().toISOString().split('T')[0]}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Tool Set</p>
                <p className="text-sm font-semibold">{handover.toolSet}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bill of Materials Table */}
        <Card>
          <CardHeader className="p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                Bill of Materials ({totalItems} items, {criticalSparesCount} critical spares)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-100">
                    <TableHead className="text-xs font-semibold h-9 px-2">BOM Code</TableHead>
                    <TableHead className="text-xs font-semibold h-9 px-2">Item Name</TableHead>
                    <TableHead className="text-xs font-semibold h-9 px-2">Specification</TableHead>
                    <TableHead className="text-xs font-semibold h-9 px-2 text-center">Qty</TableHead>
                    <TableHead className="text-xs font-semibold h-9 px-2 text-center bg-yellow-50">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                        Critical Spare
                      </div>
                    </TableHead>
                    <TableHead className="text-xs font-semibold h-9 px-2 text-center bg-yellow-50">
                      Critical Spare Qty
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    tableItems.map((item, index) => (
                      <TableRow 
                        key={item.id}
                        className={item.isCriticalSpare ? "bg-yellow-50/30" : ""}
                      >
                        <TableCell className="text-xs font-medium px-2 py-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {item.bomCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-medium px-2 py-2">
                          {item.itemName}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground px-2 py-2">
                          {item.specification}
                        </TableCell>
                        <TableCell className="text-xs text-center px-2 py-2">
                          <span className="font-semibold">{item.qty}</span>
                        </TableCell>
                        <TableCell className="px-2 py-2 bg-yellow-50/50">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={item.isCriticalSpare}
                              disabled
                              className="h-4 w-4"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-center px-2 py-2 bg-yellow-50/50">
                          {item.isCriticalSpare ? (
                            <span className="font-semibold text-orange-600">
                              {item.criticalSpareQty}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Inspection Remarks */}
        <Card>
          <CardHeader className="p-3">
            <CardTitle className="text-sm">Inspection Remarks</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <Textarea
              value={inspectionRemarks}
              onChange={(e) => setInspectionRemarks(e.target.value)}
              placeholder="Enter inspection notes, observations, or any issues found..."
              rows={6}
              className="resize-none text-xs"
            />
          </CardContent>
        </Card>
      </div>

      {/* Footer Actions */}
      {userRole !== "NPD" && (
        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-3 shadow-lg">
          <div className="flex gap-2">
            <Button
              onClick={handleApprove}
              className="flex-1 bg-green-600 hover:bg-green-700 h-9 text-xs"
              disabled={handover.status !== "Pending Inspection"}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Handover
            </Button>
            <Button
              onClick={handleReject}
              className="flex-1 bg-red-600 hover:bg-red-700 h-9 text-xs"
              disabled={handover.status !== "Pending Inspection"}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Handover
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
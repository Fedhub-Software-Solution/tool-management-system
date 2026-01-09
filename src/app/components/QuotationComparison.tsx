import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ArrowLeft, Save, Send, Award, Download, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import type { Project, PR, Quotation, QuotationItem } from "./Dashboard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tooltip } from "@mui/material";

interface QuotationComparisonProps {
  pr: PR;
  project: Project | undefined;
  onBack: () => void;
  onSave: (updatedPR: PR) => void;
  currentUserRole: string;
  onAwardSupplier?: (prId: string, supplier: string) => void;
  onMarkItemsReceived?: (prId: string) => void;
}

interface SupplierQuotationData {
  supplier: string;
  deliveryDate: string;
  deliveryTerms: string;
  items: {
    itemId: string;
    unitPrice: string;
  }[];
}

export function QuotationComparison({ pr, project, onBack, onSave, currentUserRole, onAwardSupplier, onMarkItemsReceived }: QuotationComparisonProps) {
  // Initialize quotation data for each supplier
  const [quotationData, setQuotationData] = useState<SupplierQuotationData[]>(() => {
    return pr.suppliers.map((supplier) => {
      // Check if quotation already exists for this supplier
      const existingQuotation = pr.quotations?.find(q => q.supplier === supplier);
      
      return {
        supplier,
        deliveryDate: existingQuotation?.deliveryDate || "",
        deliveryTerms: existingQuotation?.deliveryTerms || "",
        items: pr.items.map((item) => ({
          itemId: item.id,
          unitPrice: existingQuotation?.items?.find(qi => qi.itemId === item.id)?.unitPrice.toString() || "",
        })),
      };
    });
  });

  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [approverComments, setApproverComments] = useState("");

  const isAwarded = pr.status === "Awarded";
  const isItemsReceived = pr.status === "Items Received";
  const awardedSupplier = pr.awardedSupplier || pr.quotations?.find(q => q.status === "Selected")?.supplier;

  const handlePriceChange = (supplierIndex: number, itemIndex: number, value: string) => {
    const updated = [...quotationData];
    updated[supplierIndex].items[itemIndex].unitPrice = value;
    setQuotationData(updated);
  };

  const handleDeliveryDateChange = (supplierIndex: number, value: string) => {
    const updated = [...quotationData];
    updated[supplierIndex].deliveryDate = value;
    setQuotationData(updated);
  };

  const handleDeliveryTermsChange = (supplierIndex: number, value: string) => {
    const updated = [...quotationData];
    updated[supplierIndex].deliveryTerms = value;
    setQuotationData(updated);
  };

  const calculateSupplierTotal = (supplierIndex: number): number => {
    return quotationData[supplierIndex].items.reduce((sum, item, itemIndex) => {
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const prItem = pr.items[itemIndex];
      const baseQuantity = prItem.quantity;
      
      // Add critical spare quantity if this item is marked as critical spare
      const criticalSpare = pr.criticalSpares?.find(spare => spare.id === prItem.id);
      const criticalQty = criticalSpare?.quantity || 0;
      const totalQuantity = baseQuantity + criticalQty;
      
      return sum + (unitPrice * totalQuantity);
    }, 0);
  };

  const getLowestPriceForItem = (itemIndex: number): number | null => {
    const prices = quotationData
      .map(data => parseFloat(data.items[itemIndex].unitPrice))
      .filter(price => !isNaN(price) && price > 0);
    
    return prices.length > 0 ? Math.min(...prices) : null;
  };

  const getLowestTotal = (): number | null => {
    const totals = quotationData
      .map((_, index) => calculateSupplierTotal(index))
      .filter(total => total > 0);
    
    return totals.length > 0 ? Math.min(...totals) : null;
  };

  const handleSave = () => {
    // Convert quotation data to Quotation objects
    const quotations: Quotation[] = quotationData.map((data, index) => {
      const items: QuotationItem[] = data.items.map((item, itemIndex) => {
        const prItem = pr.items[itemIndex];
        const unitPrice = parseFloat(item.unitPrice) || 0;
        return {
          itemId: prItem.id,
          itemName: prItem.name,
          unitPrice,
          quantity: prItem.quantity,
          totalPrice: unitPrice * prItem.quantity,
        };
      });

      const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

      // Find existing quotation ID if updating
      const existingQuotation = pr.quotations?.find(q => q.supplier === data.supplier);

      return {
        id: existingQuotation?.id || `QUO-${Date.now()}-${index}`,
        prId: pr.id,
        supplier: data.supplier,
        price: totalPrice,
        items,
        deliveryTerms: data.deliveryTerms,
        deliveryDate: data.deliveryDate,
        status: existingQuotation?.status || "Pending",
        notes: existingQuotation?.notes || "",
      };
    });

    const updatedPR: PR = {
      ...pr,
      quotations,
    };

    onSave(updatedPR);
  };

  const handleSubmitForEvaluation = () => {
    // Convert quotation data to Quotation objects and mark as evaluated
    const quotations: Quotation[] = quotationData.map((data, index) => {
      const items: QuotationItem[] = data.items.map((item, itemIndex) => {
        const prItem = pr.items[itemIndex];
        const unitPrice = parseFloat(item.unitPrice) || 0;
        return {
          itemId: prItem.id,
          itemName: prItem.name,
          unitPrice,
          quantity: prItem.quantity,
          totalPrice: unitPrice * prItem.quantity,
        };
      });

      const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);

      return {
        id: `QUO-${Date.now()}-${index}`,
        prId: pr.id,
        supplier: data.supplier,
        price: totalPrice,
        items,
        deliveryTerms: data.deliveryTerms,
        deliveryDate: data.deliveryDate,
        status: "Evaluated",
        notes: "",
      };
    });

    const updatedPR: PR = {
      ...pr,
      quotations,
      status: "Submitted for Approval",
    };

    onSave(updatedPR);
    alert("Quotation comparison submitted for approval! Approvers have been notified.");
  };

  const handleApprove = () => {
    setApprovalAction("approve");
    setShowApprovalDialog(true);
  };

  const handleReject = () => {
    setApprovalAction("reject");
    setShowApprovalDialog(true);
  };

  const handleConfirmApproval = () => {
    if (approvalAction === "approve") {
      const updatedPR: PR = {
        ...pr,
        status: "Evaluation Pending",
        approverComments: approverComments || "Quotations approved for supplier award",
      };
      onSave(updatedPR);
      alert("Quotations approved! NPD team can now award the supplier.");
    } else if (approvalAction === "reject") {
      const updatedPR: PR = {
        ...pr,
        status: "Sent To Supplier",
        approverComments: approverComments || "Quotations rejected. Please revise.",
      };
      onSave(updatedPR);
      alert("Quotations rejected! NPD team has been notified to revise.");
    }
    setShowApprovalDialog(false);
    setApproverComments("");
    setApprovalAction(null);
  };

  const isFormValid = (): boolean => {
    return quotationData.every((data) => {
      const hasAllPrices = data.items.every((item) => item.unitPrice !== "" && parseFloat(item.unitPrice) > 0);
      const hasDeliveryDate = data.deliveryDate !== "";
      const hasDeliveryTerms = data.deliveryTerms !== "";
      return hasAllPrices && hasDeliveryDate && hasDeliveryTerms;
    });
  };

  const lowestTotal = getLowestTotal();
  const bomTotal = pr.items.reduce((sum, item) => {
    const baseQuantity = item.quantity;
    const criticalSpare = pr.criticalSpares?.find(spare => spare.id === item.id);
    const criticalQty = criticalSpare?.quantity || 0;
    const totalQuantity = baseQuantity + criticalQty;
    return sum + (item.price || 0) * totalQuantity;
  }, 0);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="px-8 py-6 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h2 className="text-2xl font-bold">BOM & Supplier Quotations Comparison</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter supplier prices for each item - {pr.id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={!isFormValid() || pr.status === "Approved" || isAwarded || isItemsReceived}
              className={`gap-2 ${(isAwarded || isItemsReceived) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Save className="w-4 h-4" />
              Save Draft
            </Button>
            {currentUserRole === "NPD" && pr.status === "Awarded" && onMarkItemsReceived && (
              <Button
                onClick={() => onMarkItemsReceived(pr.id)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Items Received
              </Button>
            )}
            {currentUserRole === "NPD" && pr.status !== "Awarded" && pr.status !== "Items Received" && (
              <Button
                onClick={handleSubmitForEvaluation}
                disabled={!isFormValid() || pr.status === "Approved" || isAwarded || isItemsReceived}
                className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2 ${(isAwarded || isItemsReceived) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Send className="w-4 h-4" />
                Submit for Approval
              </Button>
            )}
            {currentUserRole === "Approver" && pr.status === "Submitted for Approval" && (
              <>
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
                <Button
                  onClick={handleApprove}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-smart p-8">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* PR Details */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="text-lg">Purchase Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">PR ID</p>
                  <p className="font-semibold">{pr.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Customer PO</p>
                  <p className="font-semibold">{project?.customerPO || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">PR Type</p>
                  <Badge variant="outline">{pr.prType}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className={
                    pr.status === "Submitted for Approval" ? "bg-indigo-500 text-white" :
                    pr.status === "Evaluation Pending" ? "bg-purple-500 text-white" :
                    pr.status === "Approved" ? "bg-green-500 text-white" :
                    pr.status === "Awarded" ? "bg-emerald-600 text-white" :
                    pr.status === "Sent To Supplier" ? "bg-blue-500 text-white" :
                    ""
                  }>{pr.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Part Number</p>
                  <p className="font-semibold">{project?.partNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tool Number</p>
                  <p className="font-semibold">{project?.toolNumber || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Target Date</p>
                  <p className="font-semibold">{project ? new Date(project.targetDate).toLocaleDateString() : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">BOM Total</p>
                  <p className="font-semibold text-blue-600">₹{bomTotal.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          {currentUserRole === "NPD" && !pr.quotations?.length && (
            <Card className="border-0 shadow-lg border-l-4 border-l-amber-500 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-900">Instructions</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      Enter the unit price for each item as quoted by each supplier. All fields marked with * are required.
                      The system will automatically calculate totals and highlight the lowest prices.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Approver Alert Banner */}
          {currentUserRole === "Approver" && pr.status === "Submitted for Approval" && (
            <Card className="border-0 shadow-lg border-l-4 border-l-indigo-500 bg-indigo-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-indigo-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-indigo-900">Action Required: Quotation Approval</h3>
                    <p className="text-sm text-indigo-700 mt-1">
                      This PR has been submitted by the NPD team for your approval. Please review the supplier quotations below and use the Approve or Reject buttons in the header to proceed.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparison Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Item-wise Price Comparison</span>
                <span className="text-sm font-normal text-muted-foreground">
                  💡 <strong className="text-green-600">Green cells</strong> indicate lowest price for each item
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-100 to-slate-200">
                      <TableHead className="font-bold text-slate-800 w-[200px]">BOM Item</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[250px]">Specification</TableHead>
                      <TableHead className="font-bold text-slate-800 text-center w-[100px]">BOM Price (₹)</TableHead>
                      <TableHead className="font-bold text-slate-800 text-center w-[80px]">Qty</TableHead>
                      {quotationData.map((data, index) => {
                        const isAwardedSupplier = isAwarded && data.supplier === awardedSupplier;
                        return (
                        <TableHead 
                          key={index} 
                          className={`font-bold text-slate-800 text-center min-w-[200px] ${
                            isAwardedSupplier ? 'bg-gradient-to-br from-emerald-100 to-green-100 border-2 border-emerald-500' : ''
                          }`}
                        >
                          <div className="space-y-2 py-2">
                            <div className="flex items-center justify-center gap-2">
                              <p className="text-sm font-bold">{data.supplier}</p>
                              {isAwardedSupplier && (
                                <Badge className="bg-emerald-600 text-white">
                                  <Award className="w-3 h-3 mr-1 inline" />
                                  Awarded
                                </Badge>
                              )}
                            </div>
                            
                            {/* Delivery Date Input */}
                            <div className="space-y-1">
                              <p className="text-xs font-normal text-muted-foreground">Delivery Date *</p>
                              <Input
                                type="date"
                                value={data.deliveryDate}
                                onChange={(e) => handleDeliveryDateChange(index, e.target.value)}
                                disabled={isAwarded || isItemsReceived}
                                className={`h-7 text-xs ${(isAwarded || isItemsReceived) ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>

                            {/* Delivery Terms Input */}
                            <div className="space-y-1">
                              <p className="text-xs font-normal text-muted-foreground">Delivery Terms *</p>
                              <Input
                                placeholder="FOB, CIF, etc."
                                value={data.deliveryTerms}
                                onChange={(e) => handleDeliveryTermsChange(index, e.target.value)}
                                disabled={isAwarded || isItemsReceived}
                                className={`h-7 text-xs ${(isAwarded || isItemsReceived) ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''}`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                        </TableHead>
                        );
                      })}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pr.items.map((item, itemIndex) => {
                      const lowestPrice = getLowestPriceForItem(itemIndex);
                      
                      // Check if this item has critical spare quantity
                      const criticalSpare = pr.criticalSpares?.find(spare => spare.id === item.id);
                      const criticalQty = criticalSpare?.quantity || 0;
                      const totalQuantity = item.quantity + criticalQty;

                      return (
                        <TableRow 
                          key={item.id}
                          className={itemIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                        >
                          <TableCell className="font-medium">
                            <div>
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.id}</p>
                              {criticalQty > 0 && (
                                <Badge className="mt-1 text-xs bg-orange-100 text-orange-700 border-orange-300">
                                  Critical Spare
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            <div>
                              <p>{item.specification}</p>
                              <p className="text-xs mt-0.5 text-blue-600">{item.requirements}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {item.price ? (
                              <div>
                                <p className="text-base">₹{item.price.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground mt-1">per unit</p>
                                <p className="text-xs font-normal text-muted-foreground">
                                  Total: ₹{(item.price * totalQuantity).toLocaleString()}
                                </p>
                                {criticalQty > 0 && (
                                  <p className="text-xs text-orange-600 mt-1">
                                    ({item.quantity} + {criticalQty} spare)
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">N/A</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            <div>
                              <p className="text-base">{totalQuantity}</p>
                              {criticalQty > 0 && (
                                <p className="text-xs text-orange-600 mt-1">
                                  ({item.quantity} + {criticalQty} spare)
                                </p>
                              )}
                            </div>
                          </TableCell>
                          
                          {/* Supplier Price Input Cells */}
                          {quotationData.map((data, supplierIndex) => {
                            const unitPrice = parseFloat(data.items[itemIndex].unitPrice) || 0;
                            const totalPrice = unitPrice * totalQuantity;
                            const isLowest = lowestPrice !== null && unitPrice > 0 && unitPrice === lowestPrice;
                            const isAwardedSupplier = isAwarded && data.supplier === awardedSupplier;

                            return (
                              <TableCell 
                                key={supplierIndex}
                                className={`text-center ${
                                  isAwardedSupplier ? 'bg-gradient-to-br from-emerald-50 to-green-50' :
                                  isLowest ? 'bg-green-100 border-2 border-green-400' : ''
                                }`}
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="text-xs text-muted-foreground">₹</span>
                                    <Input
                                      type="text"
                                      placeholder="0.00"
                                      value={data.items[itemIndex].unitPrice}
                                      onChange={(e) => handlePriceChange(supplierIndex, itemIndex, e.target.value)}
                                      disabled={isAwarded || isItemsReceived}
                                      className={`h-8 text-sm text-center w-24 ${
                                        (isAwarded || isItemsReceived) ? 'opacity-60 cursor-not-allowed bg-gray-100' :
                                        isLowest ? 'font-bold border-green-500' : ''
                                      }`}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  {unitPrice > 0 && (
                                    <div className={isLowest ? 'font-semibold text-green-800' : ''}>
                                      <p className="text-xs text-muted-foreground">per unit</p>
                                      <p className="text-xs font-semibold mt-1">
                                        Total: ₹{totalPrice.toLocaleString()}
                                      </p>
                                      {criticalQty > 0 && (
                                        <p className="text-xs text-orange-600 mt-1">
                                          Qty: {totalQuantity} ({item.quantity} + {criticalQty})
                                        </p>
                                      )}
                                      {item.price && unitPrice < item.price && (
                                        <p className="text-xs text-green-600 mt-1">
                                          ↓ ₹{(item.price - unitPrice).toFixed(2)} savings
                                        </p>
                                      )}
                                      {item.price && unitPrice > item.price && (
                                        <p className="text-xs text-red-600 mt-1">
                                          ↑ ₹{(unitPrice - item.price).toFixed(2)} over BOM
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}

                    {/* Grand Total Row */}
                    <TableRow className="bg-gradient-to-r from-slate-200 to-slate-300 border-t-2 border-slate-400">
                      <TableCell colSpan={2} className="text-right font-bold text-lg">
                        Grand Total:
                      </TableCell>
                      <TableCell className="text-center font-bold text-lg">
                        <div>
                          <p className="text-xl">₹{bomTotal.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-1">BOM Budget</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">-</TableCell>
                      {quotationData.map((data, index) => {
                        const total = calculateSupplierTotal(index);
                        const isLowestTotal = lowestTotal !== null && total > 0 && total === lowestTotal;
                        const savingsVsBOM = bomTotal - total;

                        return (
                          <TableCell 
                            key={index}
                            className={`text-center font-bold text-lg ${
                              isLowestTotal ? 'bg-green-200 text-green-900 border-2 border-green-500' : ''
                            }`}
                          >
                            {total > 0 ? (
                              <div>
                                <p className="text-xl">₹{total.toLocaleString()}</p>
                                {savingsVsBOM > 0 && (
                                  <p className="text-xs text-green-600 mt-1">
                                    ✓ ₹{savingsVsBOM.toLocaleString()} savings vs BOM
                                  </p>
                                )}
                                {savingsVsBOM < 0 && (
                                  <p className="text-xs text-red-600 mt-1">
                                    ✗ ₹{Math.abs(savingsVsBOM).toLocaleString()} over BOM
                                  </p>
                                )}
                                {isLowestTotal && (
                                  <Badge className="bg-green-600 text-white mt-2">
                                    Best Price
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>

                    {/* Award Buttons Row - For NPD users when status is Approved */}
                    {(currentUserRole === "NPD" || currentUserRole === "Approver") && pr.status === "Evaluation Pending" && pr.quotations && pr.quotations.length > 0 && onAwardSupplier && (
                      <TableRow className="bg-slate-100">
                        <TableCell colSpan={4} className="text-left font-semibold py-4">
                          <div className="flex items-center gap-3 pl-4">
                            <span className="text-sm text-muted-foreground">Select Supplier:</span>
                          </div>
                        </TableCell>
                        {pr.quotations.map((quotation) => {
                          const isAwarded = quotation.status === "Selected";
                          
                          return (
                            <TableCell 
                              key={quotation.id} 
                              className="text-center py-4"
                            >
                              {isAwarded ? (
                                <Badge className="bg-green-600 text-white px-4 py-2">
                                  <Award className="w-4 h-4 mr-1 inline" />
                                  Awarded
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => onAwardSupplier(pr.id, quotation.supplier)}
                                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                >
                                  <Award className="w-3.5 h-3.5 mr-1" />
                                  Award
                                </Button>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons - Removed as per user request */}
        </div>
      </div>

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {approvalAction === "approve" ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Approve Quotations
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    Reject Quotations
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {approvalAction === "approve"
                  ? "Please add your comments (optional) and confirm to approve these quotations for supplier award."
                  : "Please provide a reason for rejection to help the NPD team revise the quotations."}
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">Comments {approvalAction === "reject" && "(Required)"}</label>
                <Textarea
                  value={approverComments}
                  onChange={(e) => setApproverComments(e.target.value)}
                  placeholder={approvalAction === "approve" ? "Enter your comments..." : "Explain why the quotations are being rejected..."}
                  rows={4}
                  className="resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApprovalDialog(false);
                    setApproverComments("");
                    setApprovalAction(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmApproval}
                  disabled={approvalAction === "reject" && !approverComments.trim()}
                  className={
                    approvalAction === "approve"
                      ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                  }
                >
                  {approvalAction === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
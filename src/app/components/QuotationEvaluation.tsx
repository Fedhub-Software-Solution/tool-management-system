import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { ArrowLeft, Award, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import type { Project, PR } from "./Dashboard";

interface QuotationEvaluationProps {
  pr: PR;
  project: Project | undefined;
  onBack: () => void;
  onMarkEvaluated: (prId: string) => void;
  onAwardSupplier: (prId: string, supplier: string) => void;
  onSave?: (updatedPR: PR) => void;
  currentUserRole: string;
}

export function QuotationEvaluation({ pr, project, onBack, onMarkEvaluated, onAwardSupplier, onSave, currentUserRole }: QuotationEvaluationProps) {
  // Calculate lowest price for each item
  const lowestPrices: { [itemId: string]: number } = {};
  pr.items.forEach(item => {
    const prices = pr.quotations
      ?.map(q => q.items?.find(qi => qi.itemId === item.id)?.unitPrice || Infinity)
      .filter(p => p !== Infinity) || [];
    lowestPrices[item.id] = Math.min(...prices);
  });

  // State to hold comments for each quotation
  const [comments, setComments] = useState<{ [quotationId: string]: string }>({});
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject" | null>(null);
  const [approverComments, setApproverComments] = useState("");

  const handleApprove = () => {
    setApprovalAction("approve");
    setShowApprovalDialog(true);
  };

  const handleReject = () => {
    setApprovalAction("reject");
    setShowApprovalDialog(true);
  };

  const handleConfirmApproval = () => {
    if (!onSave) return;
    
    if (approvalAction === "approve") {
      const updatedPR: PR = {
        ...pr,
        status: "Approved",
        approverComments: approverComments || "Quotations approved for supplier award",
        quotations: pr.quotations?.map(q => ({ ...q, status: "Approved" as const })),
      };
      onSave(updatedPR);
      alert("Quotations approved! NPD team can now award the supplier.");
      onBack();
    } else if (approvalAction === "reject") {
      if (!approverComments.trim()) {
        alert("Please provide a reason for rejection.");
        return;
      }
      const updatedPR: PR = {
        ...pr,
        status: "Sent To Supplier",
        approverComments: approverComments,
        quotations: pr.quotations?.map(q => ({ ...q, status: "Rejected" as const })),
      };
      onSave(updatedPR);
      alert("Quotations rejected! NPD team has been notified to revise.");
      onBack();
    }
    setShowApprovalDialog(false);
    setApproverComments("");
    setApprovalAction(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="px-8 py-6 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </Button>
            <div>
              <h2 className="text-2xl font-bold">Quotation Comparative Analysis</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Compare supplier quotations for {pr.id}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky PR Details Section */}
      <div className="sticky top-0 z-10 bg-white px-8 py-4 border-b border-slate-200 shadow-sm">
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
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
                  pr.status === "Approved" ? "bg-green-500 text-white" :
                  pr.status === "Evaluation Pending" ? "bg-purple-500 text-white" :
                  pr.status === "Awarded" ? "bg-emerald-600 text-white" :
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
              {currentUserRole !== "NPD" && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Budget Price</p>
                  <p className="font-semibold text-green-600">₹{project?.price.toLocaleString() || 'N/A'}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Target Date</p>
                <p className="font-semibold">{project ? new Date(project.targetDate).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-smart p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Evaluation Table */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>BOM & Supplier Quotations Comparison</span>
                <span className="text-sm font-normal text-muted-foreground">
                  💡 <strong className="text-green-600">Green cells</strong> indicate lowest price for each item
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto scrollbar-smart">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-slate-100 to-slate-200">
                      <TableHead className="font-bold text-slate-800 w-[200px]">BOM Item</TableHead>
                      <TableHead className="font-bold text-slate-800 w-[250px]">Specification</TableHead>
                      <TableHead className="font-bold text-slate-800 text-center w-[100px]">BOM Price</TableHead>
                      <TableHead className="font-bold text-slate-800 text-center w-[80px]">Qty</TableHead>
                      {pr.quotations?.map(quotation => (
                        <TableHead key={quotation.id} className="font-bold text-slate-800 text-center min-w-[180px]">
                          <div className="space-y-1">
                            <p className="text-sm">{quotation.supplier}</p>
                            <Badge variant="outline" className="text-xs">
                              {quotation.status}
                            </Badge>
                            <p className="text-xs font-normal text-muted-foreground mt-1">
                              Delivery: {new Date(quotation.deliveryDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs font-normal text-muted-foreground">
                              {quotation.deliveryTerms}
                            </p>
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pr.items.map((item, index) => (
                      <TableRow 
                        key={item.id}
                        className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                      >
                        <TableCell className="font-medium">
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.id}</p>
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
                              <p className="text-xs text-muted-foreground mt-1">
                                per unit
                              </p>
                              <p className="text-xs font-normal text-muted-foreground">
                                Total: ₹{(item.price * item.quantity).toLocaleString()}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">N/A</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-semibold">{item.quantity}</TableCell>
                        {pr.quotations?.map(quotation => {
                          const quotedItem = quotation.items?.find(qi => qi.itemId === item.id);
                          const isLowest = quotedItem && quotedItem.unitPrice === lowestPrices[item.id];
                          
                          return (
                            <TableCell 
                              key={quotation.id} 
                              className={`text-center ${
                                isLowest ? 'bg-green-100 border-2 border-green-400' : ''
                              }`}
                            >
                              {quotedItem ? (
                                <div className={`${isLowest ? 'font-bold text-green-800' : 'font-semibold'}`}>
                                  <p className="text-base">₹{quotedItem.unitPrice.toLocaleString()}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    per unit
                                  </p>
                                  <p className="text-xs font-normal text-muted-foreground">
                                    Total: ₹{quotedItem.totalPrice.toLocaleString()}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">N/A</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    
                    {/* Grand Total Row */}
                    <TableRow className="bg-gradient-to-r from-slate-200 to-slate-300 border-t-2 border-slate-400">
                      <TableCell colSpan={4} className="text-right font-bold text-lg">
                        Grand Total:
                      </TableCell>
                      {pr.quotations?.map(quotation => {
                        const isLowestTotal = pr.quotations?.every(q => 
                          quotation.price <= q.price
                        );
                        return (
                          <TableCell 
                            key={quotation.id} 
                            className={`text-center font-bold text-lg ${
                              isLowestTotal ? 'bg-green-200 text-green-900 border-2 border-green-500' : ''
                            }`}
                          >
                            <div>
                              <p className="text-xl">₹{quotation.price.toLocaleString()}</p>
                              {project && (
                                <p className={`text-xs mt-1 ${
                                  quotation.price <= project.price ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {quotation.price <= project.price ? '✓ Within budget' : '✗ Over budget'}
                                </p>
                              )}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    
                    {/* Award Buttons Row */}
                    <TableRow className="bg-slate-100">
                      <TableCell colSpan={4} className="text-left font-semibold">
                        <div className="flex items-center gap-3 pl-4">
                          {currentUserRole === "Approver" && pr.status === "Submitted for Approval" && (
                            <>
                              <Button
                                onClick={handleApprove}
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 gap-2"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Approve
                              </Button>
                              <Button
                                onClick={handleReject}
                                size="sm"
                                variant="outline"
                                className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      {pr.quotations?.map(quotation => {
                        const isAwarded = quotation.status === "Selected";
                        const canAward = pr.status === "Evaluation Pending" || pr.status === "Approved";
                        
                        return (
                          <TableCell 
                            key={quotation.id} 
                            className="text-center py-3"
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
                                disabled={!canAward}
                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!canAward ? "Quotations must be approved by Approver before awarding" : "Award this supplier"}
                              >
                                <Award className="w-3.5 h-3.5 mr-1" />
                                Award
                              </Button>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Removed old Award Supplier Section - now in table */}
        </div>
      </div>

      {/* Approval Dialog */}
      {showApprovalDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 shadow-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3">
                {approvalAction === "approve" ? (
                  <>
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <span>Approve Quotations</span>
                  </>
                ) : (
                  <>
                    <div className="p-2 bg-red-100 rounded-full">
                      <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <span>Reject Quotations</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {approvalAction === "approve" 
                  ? "Are you sure you want to approve these quotations? The NPD team will be able to award the supplier."
                  : "Please provide a reason for rejecting these quotations. The NPD team will be notified to revise."}
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {approvalAction === "reject" ? "Reason for Rejection *" : "Comments (Optional)"}
                </label>
                <Textarea
                  value={approverComments}
                  onChange={(e) => setApproverComments(e.target.value)}
                  placeholder={approvalAction === "reject" ? "Enter reason for rejection..." : "Enter your comments here..."}
                  className="w-full min-h-[120px]"
                  required={approvalAction === "reject"}
                />
                {approvalAction === "reject" && !approverComments.trim() && (
                  <p className="text-xs text-red-600">* Reason for rejection is required</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowApprovalDialog(false);
                    setApproverComments("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmApproval}
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
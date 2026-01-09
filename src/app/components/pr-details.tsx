import { useState } from "react";
import { PurchaseRequisition } from "./pr-list";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { CheckCircle, XCircle, Plus, Trash2, Award } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface PRDetailsProps {
  pr: PurchaseRequisition;
  onBack: () => void;
  onApprove?: (prId: string) => void;
  onReject?: (prId: string, reason: string) => void;
  onAddQuotation?: (prId: string, quotation: Omit<PurchaseRequisition["quotations"][0], "id" | "status">) => void;
  onAwardSupplier?: (prId: string, quotationId: string) => void;
  userRole: "npd" | "approver";
}

export function PRDetails({
  pr,
  onBack,
  onApprove,
  onReject,
  onAddQuotation,
  onAwardSupplier,
  userRole
}: PRDetailsProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showAwardDialog, setShowAwardDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedQuotationId, setSelectedQuotationId] = useState("");
  const [showAddQuotation, setShowAddQuotation] = useState(false);

  // Quotation form state
  const [quotationForm, setQuotationForm] = useState({
    supplierName: "",
    amount: "",
    currency: "USD",
    deliveryTime: "",
    notes: ""
  });

  const handleApprove = () => {
    onApprove?.(pr.id);
    setShowApproveDialog(false);
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject?.(pr.id, rejectionReason);
      setShowRejectDialog(false);
      setRejectionReason("");
    }
  };

  const handleAddQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    onAddQuotation?.(pr.id, {
      supplierName: quotationForm.supplierName,
      amount: parseFloat(quotationForm.amount),
      currency: quotationForm.currency,
      deliveryTime: quotationForm.deliveryTime,
      notes: quotationForm.notes
    });
    setQuotationForm({
      supplierName: "",
      amount: "",
      currency: "USD",
      deliveryTime: "",
      notes: ""
    });
    setShowAddQuotation(false);
  };

  const handleAwardSupplier = () => {
    if (selectedQuotationId) {
      onAwardSupplier?.(pr.id, selectedQuotationId);
      setShowAwardDialog(false);
      setSelectedQuotationId("");
    }
  };

  const getStatusBadge = (status: PurchaseRequisition["status"]) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const },
      pending_approval: { label: "Pending Approval", variant: "default" as const },
      approved: { label: "Approved", variant: "default" as const },
      rejected: { label: "Rejected", variant: "destructive" as const },
      quotation_pending: { label: "Quotation Pending", variant: "default" as const },
      awarded: { label: "Awarded", variant: "default" as const },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          ← Back to List
        </Button>
        {getStatusBadge(pr.status)}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle>{pr.prNumber}</CardTitle>
              <CardDescription>{pr.title}</CardDescription>
              <Badge variant="outline">
                {pr.type === "new_set" ? "New Set" : "Modification"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Requested By</p>
              <p>{pr.requestedBy}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Department</p>
              <p>{pr.department}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p>{pr.date}</p>
            </div>
            {pr.approver && (
              <div>
                <p className="text-sm text-muted-foreground">Approved By</p>
                <p>{pr.approver}</p>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="mb-2">Description</h3>
            <p className="text-muted-foreground">{pr.description}</p>
          </div>

          {pr.rejectionReason && (
            <div className="bg-destructive/10 p-4 rounded-lg">
              <h3 className="mb-2 text-destructive">Rejection Reason</h3>
              <p className="text-sm">{pr.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="items" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="items">Items</TabsTrigger>
          <TabsTrigger value="quotations">
            Quotations {pr.quotations && pr.quotations.length > 0 && `(${pr.quotations.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {pr.items.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>
                  {index + 1}. {item.itemName}
                </CardTitle>
                <CardDescription>Quantity: {item.quantity}</CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Specifications</p>
                  <p className="text-sm">{item.specifications}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="quotations" className="space-y-4">
          {userRole === "npd" && (pr.status === "approved" || pr.status === "quotation_pending") && (
            <div>
              {!showAddQuotation ? (
                <Button onClick={() => setShowAddQuotation(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Quotation
                </Button>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Add Supplier Quotation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleAddQuotation} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="supplierName">Supplier Name</Label>
                          <Input
                            id="supplierName"
                            value={quotationForm.supplierName}
                            onChange={(e) => setQuotationForm({ ...quotationForm, supplierName: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={quotationForm.amount}
                            onChange={(e) => setQuotationForm({ ...quotationForm, amount: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="currency">Currency</Label>
                          <Input
                            id="currency"
                            value={quotationForm.currency}
                            onChange={(e) => setQuotationForm({ ...quotationForm, currency: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="deliveryTime">Delivery Time</Label>
                          <Input
                            id="deliveryTime"
                            placeholder="e.g., 2-3 weeks"
                            value={quotationForm.deliveryTime}
                            onChange={(e) => setQuotationForm({ ...quotationForm, deliveryTime: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={quotationForm.notes}
                          onChange={(e) => setQuotationForm({ ...quotationForm, notes: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit">Submit Quotation</Button>
                        <Button type="button" variant="outline" onClick={() => setShowAddQuotation(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {pr.quotations && pr.quotations.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pr.quotations.map((quotation) => (
                  <Card key={quotation.id} className={quotation.status === "selected" ? "border-primary" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle>{quotation.supplierName}</CardTitle>
                        {quotation.status === "selected" && (
                          <Badge variant="default">
                            <Award className="w-3 h-3 mr-1" />
                            Awarded
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Amount</span>
                          <span>
                            {quotation.currency} {quotation.amount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Delivery Time</span>
                          <span className="text-sm">{quotation.deliveryTime}</span>
                        </div>
                      </div>
                      {quotation.notes && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Notes</p>
                          <p className="text-sm">{quotation.notes}</p>
                        </div>
                      )}
                      {userRole === "npd" && 
                       pr.status === "quotation_pending" && 
                       quotation.status !== "selected" && (
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedQuotationId(quotation.id);
                            setShowAwardDialog(true);
                          }}
                        >
                          <Award className="w-4 h-4 mr-2" />
                          Award Supplier
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No quotations submitted yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {userRole === "approver" && pr.status === "pending_approval" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setShowApproveDialog(true)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve PR
              </Button>
              <Button
                size="lg"
                variant="destructive"
                onClick={() => setShowRejectDialog(true)}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject PR
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Purchase Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve PR {pr.prNumber}? This will allow the NPD team to proceed with supplier quotations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Purchase Requisition</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting PR {pr.prNumber}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Award Supplier Dialog */}
      <AlertDialog open={showAwardDialog} onOpenChange={setShowAwardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Award Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to award this supplier? This action will complete the PR process.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedQuotationId("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAwardSupplier}>Award Supplier</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

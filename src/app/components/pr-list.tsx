import { Badge } from "./ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { FileText, Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";

export interface PurchaseRequisition {
  id: string;
  prNumber: string;
  type: "new_set" | "modification";
  title: string;
  description: string;
  requestedBy: string;
  department: string;
  date: string;
  status: "draft" | "pending_approval" | "approved" | "rejected" | "quotation_pending" | "awarded";
  items: {
    itemName: string;
    quantity: number;
    specifications: string;
  }[];
  quotations?: {
    id: string;
    supplierName: string;
    amount: number;
    currency: string;
    deliveryTime: string;
    status: "pending" | "submitted" | "selected";
    notes: string;
  }[];
  approver?: string;
  approvalDate?: string;
  rejectionReason?: string;
  awardedSupplier?: string;
}

interface PRListProps {
  purchaseRequisitions: PurchaseRequisition[];
  onViewDetails: (pr: PurchaseRequisition) => void;
  userRole: "npd" | "approver";
}

export function PRList({ purchaseRequisitions, onViewDetails, userRole }: PRListProps) {
  const getStatusBadge = (status: PurchaseRequisition["status"]) => {
    const statusConfig = {
      draft: { label: "Draft", variant: "secondary" as const, icon: FileText },
      pending_approval: { label: "Pending Approval", variant: "default" as const, icon: Clock },
      approved: { label: "Approved", variant: "default" as const, icon: CheckCircle },
      rejected: { label: "Rejected", variant: "destructive" as const, icon: XCircle },
      quotation_pending: { label: "Quotation Pending", variant: "default" as const, icon: Clock },
      awarded: { label: "Awarded", variant: "default" as const, icon: DollarSign },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getTypeBadge = (type: PurchaseRequisition["type"]) => {
    return (
      <Badge variant="outline">
        {type === "new_set" ? "New Set" : "Modification"}
      </Badge>
    );
  };

  const filteredPRs = userRole === "approver" 
    ? purchaseRequisitions.filter(pr => pr.status === "pending_approval")
    : purchaseRequisitions;

  return (
    <div className="space-y-4">
      {filteredPRs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {userRole === "approver" 
                ? "No purchase requisitions pending your approval."
                : "No purchase requisitions found. Create your first PR to get started."}
            </p>
          </CardContent>
        </Card>
      ) : (
        filteredPRs.map((pr) => (
          <Card key={pr.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CardTitle>{pr.prNumber}</CardTitle>
                    {getTypeBadge(pr.type)}
                  </div>
                  <p className="text-sm text-muted-foreground">{pr.title}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(pr.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requested By</p>
                    <p>{pr.requestedBy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Department</p>
                    <p>{pr.department}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p>{pr.date}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Items</p>
                    <p>{pr.items.length} item(s)</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => onViewDetails(pr)}>
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

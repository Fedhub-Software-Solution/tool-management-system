import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import type { Project, PR, ToolHandoverRecord, InventoryItem } from "./Dashboard";
import { FileText, FileSpreadsheet, Download } from "lucide-react";

type ReportType = "summary" | "projects" | "prs" | "handovers" | "inventory" | "budget";

interface GeneratedReportTableProps {
  reportType: ReportType;
  selectedFields: string[];
  filteredProjects: Project[];
  filteredPRs: PR[];
  filteredHandovers: ToolHandoverRecord[];
  filteredInventory: InventoryItem[];
  onExportExcel: () => void;
  onExportPDF: () => void;
}

export function GeneratedReportTable({
  reportType,
  selectedFields,
  filteredProjects,
  filteredPRs,
  filteredHandovers,
  filteredInventory,
  onExportExcel,
  onExportPDF,
}: GeneratedReportTableProps) {
  const getRecordCount = () => {
    switch (reportType) {
      case "projects":
        return filteredProjects.length;
      case "prs":
        return filteredPRs.length;
      case "handovers":
        return filteredHandovers.length;
      case "inventory":
        return filteredInventory.length;
      default:
        return 0;
    }
  };

  return (
    <Card className="shadow-md mb-6 border-2 border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Generated Report - {reportType.toUpperCase()}
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {getRecordCount()} records
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="max-h-[500px] overflow-auto">
            {reportType === "projects" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedFields.map((field) => (
                      <TableHead key={field} className="text-xs font-semibold">
                        {field}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      {selectedFields.includes("Project ID") && (
                        <TableCell className="text-xs">{project.id}</TableCell>
                      )}
                      {selectedFields.includes("Customer PO") && (
                        <TableCell className="text-xs">{project.customerPO}</TableCell>
                      )}
                      {selectedFields.includes("Part Number") && (
                        <TableCell className="text-xs">{project.partNumber}</TableCell>
                      )}
                      {selectedFields.includes("Tool Number") && (
                        <TableCell className="text-xs">{project.toolNumber}</TableCell>
                      )}
                      {selectedFields.includes("Price") && (
                        <TableCell className="text-xs">
                          ₹{project.price.toLocaleString()}
                        </TableCell>
                      )}
                      {selectedFields.includes("Target Date") && (
                        <TableCell className="text-xs">{project.targetDate}</TableCell>
                      )}
                      {selectedFields.includes("Status") && (
                        <TableCell className="text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                            {project.status}
                          </span>
                        </TableCell>
                      )}
                      {selectedFields.includes("Created By") && (
                        <TableCell className="text-xs">{project.createdBy}</TableCell>
                      )}
                      {selectedFields.includes("Created At") && (
                        <TableCell className="text-xs">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {reportType === "prs" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedFields.map((field) => (
                      <TableHead key={field} className="text-xs font-semibold">
                        {field}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPRs.map((pr) => (
                    <TableRow key={pr.id}>
                      {selectedFields.includes("PR ID") && (
                        <TableCell className="text-xs">{pr.id}</TableCell>
                      )}
                      {selectedFields.includes("Project ID") && (
                        <TableCell className="text-xs">{pr.projectId}</TableCell>
                      )}
                      {selectedFields.includes("PR Type") && (
                        <TableCell className="text-xs">{pr.prType}</TableCell>
                      )}
                      {selectedFields.includes("Items Count") && (
                        <TableCell className="text-xs">{pr.items.length}</TableCell>
                      )}
                      {selectedFields.includes("Suppliers") && (
                        <TableCell className="text-xs">
                          {pr.suppliers.join(", ")}
                        </TableCell>
                      )}
                      {selectedFields.includes("Status") && (
                        <TableCell className="text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs">
                            {pr.status}
                          </span>
                        </TableCell>
                      )}
                      {selectedFields.includes("Created By") && (
                        <TableCell className="text-xs">{pr.createdBy}</TableCell>
                      )}
                      {selectedFields.includes("Created At") && (
                        <TableCell className="text-xs">
                          {new Date(pr.createdAt).toLocaleDateString()}
                        </TableCell>
                      )}
                      {selectedFields.includes("Budget") && (
                        <TableCell className="text-xs">
                          $
                          {pr.quotations
                            ?.find(
                              (q) =>
                                q.status === "Selected" || q.supplier === pr.awardedSupplier
                            )
                            ?.price.toLocaleString() || 0}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {reportType === "handovers" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedFields.map((field) => (
                      <TableHead key={field} className="text-xs font-semibold">
                        {field}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHandovers.map((handover) => (
                    <TableRow key={handover.id}>
                      {selectedFields.includes("Handover ID") && (
                        <TableCell className="text-xs">{handover.id}</TableCell>
                      )}
                      {selectedFields.includes("Project ID") && (
                        <TableCell className="text-xs">{handover.projectId}</TableCell>
                      )}
                      {selectedFields.includes("PR ID") && (
                        <TableCell className="text-xs">{handover.prId}</TableCell>
                      )}
                      {selectedFields.includes("Tool Set") && (
                        <TableCell className="text-xs">{handover.toolSet}</TableCell>
                      )}
                      {selectedFields.includes("Spares Count") && (
                        <TableCell className="text-xs">
                          {handover.criticalSpares.length}
                        </TableCell>
                      )}
                      {selectedFields.includes("Status") && (
                        <TableCell className="text-xs">
                          <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 text-xs">
                            {handover.status}
                          </span>
                        </TableCell>
                      )}
                      {selectedFields.includes("Inspected By") && (
                        <TableCell className="text-xs">
                          {handover.inspectedBy || "N/A"}
                        </TableCell>
                      )}
                      {selectedFields.includes("Inspection Date") && (
                        <TableCell className="text-xs">
                          {handover.inspectionDate
                            ? new Date(handover.inspectionDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {reportType === "inventory" && (
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectedFields.map((field) => (
                      <TableHead key={field} className="text-xs font-semibold">
                        {field}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow key={item.id}>
                      {selectedFields.includes("Part Number") && (
                        <TableCell className="text-xs">{item.partNumber}</TableCell>
                      )}
                      {selectedFields.includes("Tool Number") && (
                        <TableCell className="text-xs">{item.toolNumber}</TableCell>
                      )}
                      {selectedFields.includes("Name") && (
                        <TableCell className="text-xs">{item.name}</TableCell>
                      )}
                      {selectedFields.includes("Quantity") && (
                        <TableCell className="text-xs">{item.quantity}</TableCell>
                      )}
                      {selectedFields.includes("Stock Level") && (
                        <TableCell className="text-xs">{item.stockLevel}</TableCell>
                      )}
                      {selectedFields.includes("Min Stock Level") && (
                        <TableCell className="text-xs">{item.minStockLevel}</TableCell>
                      )}
                      {selectedFields.includes("Status") && (
                        <TableCell className="text-xs">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              item.status === "In Stock"
                                ? "bg-green-100 text-green-700"
                                : item.status === "Low Stock"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {item.status}
                          </span>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {reportType === "budget" && (() => {
              const totalPlanned = filteredProjects.reduce((sum, p) => sum + p.price, 0);
              const totalActual = filteredPRs.reduce((sum, pr) => {
                if (pr.status === "Awarded" && pr.quotations) {
                  const quote = pr.quotations.find(
                    (q) => q.status === "Selected" || q.supplier === pr.awardedSupplier
                  );
                  return sum + (quote?.price || 0);
                }
                return sum;
              }, 0);
              const variance = totalActual - totalPlanned;
              const variancePercent = totalPlanned > 0 ? (variance / totalPlanned) * 100 : 0;

              return (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-semibold">Category</TableHead>
                      <TableHead className="text-xs font-semibold">Planned Budget</TableHead>
                      <TableHead className="text-xs font-semibold">Actual Budget</TableHead>
                      <TableHead className="text-xs font-semibold">Variance</TableHead>
                      <TableHead className="text-xs font-semibold">Variance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-xs font-medium">Overall</TableCell>
                      <TableCell className="text-xs">
                        ${totalPlanned.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        ${totalActual.toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={`text-xs font-medium ${
                          variance >= 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        ${Math.abs(variance).toLocaleString()}
                      </TableCell>
                      <TableCell
                        className={`text-xs font-medium ${
                          variance >= 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {variancePercent.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              );
            })()}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={onExportExcel}
            size="sm"
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
          <Button
            onClick={onExportPDF}
            size="sm"
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { ArrowLeft, Download, FileText } from "lucide-react";
import type { Project, PR } from "./Dashboard";
import {
  Chip,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

interface ProjectDetailViewProps {
  project: Project;
  prs: PR[];
  userRole: "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";
  onBack: () => void;
  onDownload: (project: Project) => void;
  onNavigateToPR?: (pr: PR) => void;
  onNavigateToQuotations?: (pr: PR) => void;
}

export function ProjectDetailView({
  project,
  prs,
  userRole,
  onBack,
  onDownload,
  onNavigateToPR,
  onNavigateToQuotations,
}: ProjectDetailViewProps) {
  const projectPRs = prs.filter((pr) => pr.projectId === project.id);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-500";
      case "Completed":
        return "bg-blue-500";
      case "On Hold":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 shadow-md">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-white hover:bg-white/20 h-9 px-3"
            onClick={onBack}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">Project Details</h2>
            <p className="text-sm text-indigo-100">{project.customerPO}</p>
          </div>
          <Button
            className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg text-sm py-2 px-4 h-9"
            onClick={() => onDownload(project)}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Project Information Card */}
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Box
              sx={{
                bgcolor: "#f8fafc",
                borderBottom: "2px solid #e2e8f0",
                px: 3,
                py: 2,
              }}
            >
              <h3 className="font-bold text-slate-800">
                Project Information
              </h3>
            </Box>
            <Box sx={{ p: 3 }}>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Project ID
                  </Label>
                  <p className="text-lg font-semibold text-slate-800">
                    {project.id}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Customer PO
                  </Label>
                  <p className="text-lg font-semibold text-indigo-600">
                    {project.customerPO}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Status
                  </Label>
                  <Badge
                    className={`${getStatusColor(
                      project.status
                    )} text-base px-4 py-1`}
                  >
                    {project.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-6">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Part Number
                  </Label>
                  <p className="text-lg font-semibold text-slate-800">
                    {project.partNumber}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Tool Number
                  </Label>
                  <p className="text-lg font-semibold text-slate-800">
                    {project.toolNumber}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Target Date
                  </Label>
                  <p className="text-lg font-semibold text-slate-800">
                    {new Date(project.targetDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {userRole === "Approver" && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Project Price
                    </Label>
                    <p className="text-3xl font-bold text-amber-600">
                      ₹{project.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-200">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Created By
                  </Label>
                  <p className="text-base font-medium text-slate-800">
                    {project.createdBy}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Created At
                  </Label>
                  <p className="text-base font-medium text-slate-800">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Box>
          </Paper>

          {/* Purchase Requisitions Card */}
          <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
            <Box
              sx={{
                bgcolor: "#f8fafc",
                borderBottom: "2px solid #e2e8f0",
                px: 3,
                py: 2,
              }}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-800">
                  Purchase Requisitions
                </h3>
                <Badge variant="outline" className="ml-2 bg-white">
                  {projectPRs.length} PR{projectPRs.length !== 1 ? "s" : ""}
                </Badge>
              </div>
            </Box>
            <Box sx={{ p: 3 }}>
              {projectPRs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                  <FileText className="w-16 h-16 text-slate-300 mx-auto mb-3" />
                  <p className="text-base font-medium text-slate-500">
                    No purchase requisitions created yet
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    PRs will appear here once they are created for this project
                  </p>
                </div>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            color: "#1e293b",
                            py: 1.5,
                          }}
                        >
                          PR #
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            color: "#1e293b",
                            py: 1.5,
                          }}
                        >
                          Type
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            color: "#1e293b",
                            py: 1.5,
                          }}
                        >
                          Status
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            color: "#1e293b",
                            py: 1.5,
                          }}
                        >
                          Created Date
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            color: "#1e293b",
                            py: 1.5,
                          }}
                        >
                          Created By
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projectPRs.map((pr) => (
                        <TableRow
                          key={pr.id}
                          sx={{
                            "&:nth-of-type(odd)": { bgcolor: "#fafafa" },
                            "&:hover": {
                              bgcolor: "#f1f5f9",
                              transition: "background-color 0.2s",
                            },
                          }}
                        >
                          <TableCell
                            sx={{
                              fontWeight: 600,
                              color: "#4f46e5",
                              fontSize: "0.8rem",
                              py: 1.5,
                              cursor: "pointer",
                              "&:hover": {
                                textDecoration: "underline",
                                color: "#3730a3",
                              },
                            }}
                            onClick={() => {
                              if (pr.status === "Awarded" && onNavigateToQuotations) {
                                onNavigateToQuotations(pr);
                              } else if (onNavigateToPR) {
                                onNavigateToPR(pr);
                              }
                            }}
                          >
                            {pr.id}
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <Chip
                              label={pr.prType}
                              size="small"
                              sx={{
                                bgcolor:
                                  pr.prType === "New Set"
                                    ? "#8b5cf6"
                                    : pr.prType === "Modification"
                                    ? "#f59e0b"
                                    : "#10b981",
                                color: "white",
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                height: 22,
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1.5 }}>
                            <Chip
                              label={pr.status}
                              size="small"
                              sx={{
                                bgcolor:
                                  pr.status === "Approved"
                                    ? "#10b981"
                                    : pr.status === "Awarded"
                                    ? "#3b82f6"
                                    : pr.status === "Pending Approval"
                                    ? "#f59e0b"
                                    : pr.status === "Rejected"
                                    ? "#ef4444"
                                    : "#6b7280",
                                color: "white",
                                fontWeight: 600,
                                fontSize: "0.7rem",
                                height: 22,
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              color: "#64748b",
                              fontSize: "0.8rem",
                              py: 1.5,
                            }}
                          >
                            {new Date(pr.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell
                            sx={{
                              fontSize: "0.8rem",
                              py: 1.5,
                              color: "#475569",
                            }}
                          >
                            {pr.createdBy}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </Paper>
        </div>
      </div>
    </div>
  );
}
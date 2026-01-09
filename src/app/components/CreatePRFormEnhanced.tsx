import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Trash2, Star, Search, X, AlertTriangle } from "lucide-react";
import type { Project, PRItem } from "./Dashboard";
import { Checkbox } from "./ui/checkbox";
import {
  TextField,
  InputAdornment,
  IconButton,
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
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

interface BOMItem {
  id: string;
  name: string;
  specification: string;
  unitPrice: number;
  quantity: number;
}

interface CreatePRFormEnhancedProps {
  projects: Project[];
  onSubmit: (formData: any, items: PRItem[], criticalSpares: { id: string; quantity: number }[]) => void;
  onCancel: () => void;
  initialData?: {
    projectId: string;
    prType: "New Set" | "Modification" | "Refurbished";
    suppliers: string[];
    items: PRItem[];
    criticalSpares?: { id: string; quantity: number }[];
    modRefReason?: string; // Add reason to initial data
  };
  isEditMode?: boolean;
  isViewMode?: boolean;
  suppliers?: { id: string; name: string; status: string }[];
  userRole?: "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";
}

export function CreatePRFormEnhanced({ projects, onSubmit, onCancel, initialData, isEditMode = false, isViewMode = false, suppliers, userRole }: CreatePRFormEnhancedProps) {
  const [formData, setFormData] = useState({
    projectId: initialData?.projectId || "",
    prType: initialData?.prType || (userRole === "Spares" ? "Modification" : "New Set") as "New Set" | "Modification" | "Refurbished",
    suppliers: initialData?.suppliers || ([] as string[]),
    toolNumber: "",
    partNumber: "",
  });

  const [items, setItems] = useState<PRItem[]>(initialData?.items || []);
  const [bomItems, setBomItems] = useState<BOMItem[]>([]);
  const [criticalSpares, setCriticalSpares] = useState<{ id: string; quantity: number }[]>(initialData?.criticalSpares || []);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [criticalSparesSearchQuery, setCriticalSparesSearchQuery] = useState("");
  const [showCriticalSparesDropdown, setShowCriticalSparesDropdown] = useState(false);
  const [modRefReason, setModRefReason] = useState(initialData?.modRefReason || ""); // Initialize with initial data reason

  const [currentItem, setCurrentItem] = useState({
    name: "",
    specification: "",
    quantity: "",
    requirements: "",
  });

  // BOM Database - Simulated based on tool numbers
  const bomDatabase: Record<string, BOMItem[]> = {
    "TN-9001": [
      { id: "BOM-001", name: "Base Plate", specification: "Steel SS304 - 200x150x20mm", unitPrice: 250, quantity: 1 },
      { id: "BOM-002", name: "Guide Pin", specification: "Hardened Steel - Ø12x100mm", unitPrice: 45, quantity: 4 },
      { id: "BOM-003", name: "Spring Assembly", specification: "High Tension - Ø25x80mm", unitPrice: 85, quantity: 2 },
      { id: "BOM-004", name: "Die Insert", specification: "Tungsten Carbide - Custom", unitPrice: 1200, quantity: 1 },
      { id: "BOM-005", name: "Stripper Plate", specification: "Tool Steel - 180x120x15mm", unitPrice: 320, quantity: 1 },
      { id: "BOM-006", name: "Punch Head", specification: "HSS M2 - Custom Profile", unitPrice: 450, quantity: 2 },
    ],
    "TN-9002": [
      { id: "BOM-007", name: "Punch Assembly", specification: "HSS M2 - Custom Profile", unitPrice: 850, quantity: 1 },
      { id: "BOM-008", name: "Holder Block", specification: "Aluminum 7075 - 100x80x50mm", unitPrice: 180, quantity: 2 },
      { id: "BOM-009", name: "Guide Bush", specification: "Bronze - Ø20x40mm", unitPrice: 65, quantity: 4 },
      { id: "BOM-010", name: "Retainer Ring", specification: "Spring Steel - Ø30mm", unitPrice: 15, quantity: 8 },
      { id: "BOM-011", name: "Backing Plate", specification: "Steel 1045 - 150x150x25mm", unitPrice: 280, quantity: 1 },
    ],
    "TN-9003": [
      { id: "BOM-012", name: "Core Pin", specification: "Stainless Steel - Ø8x120mm", unitPrice: 55, quantity: 6 },
      { id: "BOM-013", name: "Ejector Plate", specification: "Tool Steel H13 - 200x180x20mm", unitPrice: 420, quantity: 1 },
      { id: "BOM-014", name: "Guide Post", specification: "Hardened Steel - Ø16x150mm", unitPrice: 95, quantity: 4 },
      { id: "BOM-015", name: "Cavity Insert", specification: "Beryllium Copper - Custom", unitPrice: 1500, quantity: 2 },
      { id: "BOM-016", name: "Cooling Channel", specification: "Copper Pipe - Ø6x500mm", unitPrice: 45, quantity: 4 },
      { id: "BOM-017", name: "Mounting Bracket", specification: "Steel S45C - 80x60x10mm", unitPrice: 120, quantity: 4 },
    ],
    "TN-9004": [
      { id: "BOM-018", name: "Forming Die", specification: "Tool Steel D2 - Custom Shape", unitPrice: 980, quantity: 1 },
      { id: "BOM-019", name: "Guide Rail", specification: "Hardened Steel - 200x25x15mm", unitPrice: 145, quantity: 2 },
      { id: "BOM-020", name: "Cam Plate", specification: "Steel S45C - 150x100x20mm", unitPrice: 265, quantity: 1 },
      { id: "BOM-021", name: "Return Spring", specification: "High Tension - Ø30x100mm", unitPrice: 95, quantity: 4 },
      { id: "BOM-022", name: "Pressure Pin", specification: "Tungsten Carbide - Ø10x80mm", unitPrice: 175, quantity: 6 },
    ],
    "TN-9005": [
      { id: "BOM-023", name: "Trimming Blade", specification: "HSS M42 - Custom Edge", unitPrice: 560, quantity: 2 },
      { id: "BOM-024", name: "Locator Pin", specification: "Hardened Steel - Ø8x60mm", unitPrice: 35, quantity: 8 },
      { id: "BOM-025", name: "Die Block", specification: "Tool Steel A2 - 180x150x40mm", unitPrice: 425, quantity: 1 },
      { id: "BOM-026", name: "Shear Plate", specification: "Steel 1045 - 160x120x18mm", unitPrice: 195, quantity: 1 },
      { id: "BOM-027", name: "Support Pillar", specification: "Steel S45C - Ø40x150mm", unitPrice: 85, quantity: 4 },
    ],
    "TN-9006": [
      { id: "BOM-028", name: "Bending Die", specification: "Tool Steel D3 - Custom Angle", unitPrice: 1150, quantity: 1 },
      { id: "BOM-029", name: "Clamp Plate", specification: "Steel 1045 - 200x180x25mm", unitPrice: 310, quantity: 1 },
      { id: "BOM-030", name: "Guide Block", specification: "Bronze Alloy - 80x60x40mm", unitPrice: 155, quantity: 4 },
      { id: "BOM-031", name: "Lifter Pin", specification: "Hardened Steel - Ø12x120mm", unitPrice: 65, quantity: 6 },
      { id: "BOM-032", name: "Support Bracket", specification: "Aluminum 6061 - 100x80x30mm", unitPrice: 95, quantity: 4 },
    ],
    "TN-9007": [
      { id: "BOM-033", name: "Punch Set", specification: "HSS M2 - Multiple Profiles", unitPrice: 780, quantity: 1 },
      { id: "BOM-034", name: "Die Shoe", specification: "Cast Iron FC250 - 250x200x40mm", unitPrice: 340, quantity: 1 },
      { id: "BOM-035", name: "Spring Guide", specification: "Steel S45C - Ø35x100mm", unitPrice: 115, quantity: 4 },
      { id: "BOM-036", name: "Stop Block", specification: "Tool Steel O1 - 60x50x30mm", unitPrice: 125, quantity: 2 },
      { id: "BOM-037", name: "Wear Plate", specification: "Hardened Steel - 150x120x10mm", unitPrice: 185, quantity: 2 },
    ],
    "TN-9008": [
      { id: "BOM-038", name: "Progressive Die Set", specification: "Tool Steel Complex - Custom", unitPrice: 2200, quantity: 1 },
      { id: "BOM-039", name: "Pilot Pin", specification: "Tungsten Carbide - Ø6x80mm", unitPrice: 95, quantity: 8 },
      { id: "BOM-040", name: "Stripper Bolt", specification: "Alloy Steel - M12x80mm", unitPrice: 25, quantity: 12 },
      { id: "BOM-041", name: "Heel Block", specification: "Steel 1045 - 120x80x40mm", unitPrice: 165, quantity: 2 },
      { id: "BOM-042", name: "Guide Bushing", specification: "Bronze - Ø25x50mm", unitPrice: 75, quantity: 6 },
    ],
    "TN-9009": [
      { id: "BOM-043", name: "Blanking Punch", specification: "HSS M2 - Ø45mm Profile", unitPrice: 485, quantity: 2 },
      { id: "BOM-044", name: "Nest Plate", specification: "Tool Steel A2 - 180x160x20mm", unitPrice: 365, quantity: 1 },
      { id: "BOM-045", name: "Spring Pin", specification: "Spring Steel - Ø8x50mm", unitPrice: 18, quantity: 10 },
      { id: "BOM-046", name: "Retainer Plate", specification: "Steel 1045 - 160x140x15mm", unitPrice: 215, quantity: 1 },
      { id: "BOM-047", name: "Guide Post Set", specification: "Hardened Steel - Ø20x180mm", unitPrice: 135, quantity: 4 },
    ],
    "TN-9010": [
      { id: "BOM-048", name: "Cutting Die", specification: "Tool Steel D2 - Custom Edge", unitPrice: 925, quantity: 1 },
      { id: "BOM-049", name: "Pressure Pad", specification: "Urethane - 150x120x25mm", unitPrice: 145, quantity: 2 },
      { id: "BOM-050", name: "Die Set Base", specification: "Cast Iron FC250 - 300x250x50mm", unitPrice: 425, quantity: 1 },
      { id: "BOM-051", name: "Dowel Pin", specification: "Hardened Steel - Ø10x60mm", unitPrice: 22, quantity: 8 },
      { id: "BOM-052", name: "Ejector Rod", specification: "Steel S45C - Ø16x200mm", unitPrice: 95, quantity: 4 },
    ],
  };

  // Available Suppliers Database
  const availableSuppliers = suppliers ? suppliers.map(s => s.name) : [
    "Precision Tools Ltd.",
    "MetalWorks Industries",
    "Advanced Manufacturing Co.",
    "TechSteel Solutions",
    "ProTool Suppliers Inc.",
    "Elite Machinery Parts",
    "Global Tool Components",
    "Premier Industrial Supply",
    "Apex Engineering Systems",
    "MasterCraft Tools"
  ];

  // Filter suppliers based on search query
  const filteredSuppliers = availableSuppliers.filter(supplier =>
    supplier.toLowerCase().includes(supplierSearchQuery.toLowerCase()) &&
    !formData.suppliers.includes(supplier)
  );

  // Filter BOM items for critical spares search
  const filteredBOMForCriticalSpares = bomItems.filter(bomItem =>
    !criticalSpares.some(spare => spare.id === bomItem.id) &&
    (bomItem.id.toLowerCase().includes(criticalSparesSearchQuery.toLowerCase()) ||
     bomItem.name.toLowerCase().includes(criticalSparesSearchQuery.toLowerCase()))
  );

  // Load BOM when in edit mode with initial data
  useEffect(() => {
    if ((isEditMode || isViewMode) && initialData && initialData.projectId) {
      const project = projects.find(p => p.id === initialData.projectId);
      if (project) {
        setFormData(prev => ({
          ...prev,
          toolNumber: project.toolNumber,
          partNumber: project.partNumber,
        }));
        
        // Load BOM for all PR types
        const bom = bomDatabase[project.toolNumber] || [];
        setBomItems(bom);
      }
    }
  }, [isEditMode, isViewMode, initialData, projects]);

  // Add item to critical spares
  const handleAddCriticalSpare = (bomItemId: string) => {
    if (!criticalSpares.some(spare => spare.id === bomItemId)) {
      setCriticalSpares([...criticalSpares, { id: bomItemId, quantity: 1 }]);
    }
    setCriticalSparesSearchQuery("");
    setShowCriticalSparesDropdown(false);
  };

  // Remove item from critical spares
  const handleRemoveCriticalSpare = (bomItemId: string) => {
    setCriticalSpares(criticalSpares.filter(id => id.id !== bomItemId));
  };

  // Toggle critical spare from BOM table checkbox
  const handleToggleCriticalSpare = (bomItemId: string) => {
    if (criticalSpares.some(spare => spare.id === bomItemId)) {
      setCriticalSpares(criticalSpares.filter(id => id.id !== bomItemId));
    } else {
      setCriticalSpares([...criticalSpares, { id: bomItemId, quantity: 1 }]);
    }
  };

  // Handle project selection - auto-populate for New Set
  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setFormData({
        ...formData,
        projectId: projectId,
        toolNumber: project.toolNumber,
        partNumber: project.partNumber,
      });
      
      // Generate BOM based on tool number for all PR types
      const bom = bomDatabase[project.toolNumber] || [];
      setBomItems(bom);
      
      if (formData.prType === "New Set") {
        // Convert BOM to items with default quantity for New Set
        const generatedItems: PRItem[] = bom.map(bomItem => ({
          id: bomItem.id,
          name: bomItem.name,
          specification: bomItem.specification,
          quantity: bomItem.quantity,
          requirements: `Unit Price: ₹${bomItem.unitPrice}`,
          price: bomItem.unitPrice, // Add price field
        }));
        setItems(generatedItems);
      } else {
        // For Modification/Refurbished, clear items but keep BOM for selection
        setItems([]);
        setCriticalSpares([]);
      }
    }
  };

  // Handle PR Type change
  const handlePRTypeChange = (prType: "New Set" | "Modification" | "Refurbished") => {
    setFormData({
      ...formData,
      prType: prType,
    });
    
    // Clear items when changing PR type
    setItems([]);
    setCriticalSpares([]);
    
    // If project is already selected, reload BOM based on new type
    if (formData.projectId) {
      const project = projects.find(p => p.id === formData.projectId);
      if (project) {
        const bom = bomDatabase[project.toolNumber] || [];
        setBomItems(bom);
        
        if (prType === "New Set") {
          // Auto-add all items for New Set
          const generatedItems: PRItem[] = bom.map(bomItem => ({
            id: bomItem.id,
            name: bomItem.name,
            specification: bomItem.specification,
            quantity: bomItem.quantity,
            requirements: `Unit Price: ₹${bomItem.unitPrice}`,
            price: bomItem.unitPrice,
          }));
          setItems(generatedItems);
        }
      }
    }
  };

  // Add supplier from available list
  const handleSelectSupplier = (supplier: string) => {
    if (!formData.suppliers.includes(supplier)) {
      setFormData({
        ...formData,
        suppliers: [...formData.suppliers, supplier],
      });
    }
    setSupplierSearchQuery("");
    setShowSupplierDropdown(false);
  };

  // Remove supplier
  const handleRemoveSupplier = (supplier: string) => {
    setFormData({
      ...formData,
      suppliers: formData.suppliers.filter(s => s !== supplier),
    });
  };

  // Update BOM item quantity
  const handleUpdateBOMQuantity = (bomItemId: string, newQuantity: number) => {
    setItems(items.map(item => 
      item.id === bomItemId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Toggle BOM item selection for Modification/Refurbished
  const handleToggleBOMItem = (bomItem: BOMItem, isSelected: boolean) => {
    if (isSelected) {
      // Add item to selected items
      const newItem: PRItem = {
        id: bomItem.id,
        name: bomItem.name,
        specification: bomItem.specification,
        quantity: bomItem.quantity,
        requirements: `Unit Price: ₹${bomItem.unitPrice}`,
        price: bomItem.unitPrice,
      };
      setItems([...items, newItem]);
    } else {
      // Remove item from selected items
      setItems(items.filter(item => item.id !== bomItem.id));
    }
  };

  // Update quantity for Modification/Refurbished selected item
  const handleUpdateModRefQuantity = (bomItemId: string, newQuantity: number) => {
    setItems(items.map(item => 
      item.id === bomItemId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Add manual item (for Modification/Refurbished)
  const handleAddItem = () => {
    if (currentItem.name && currentItem.specification && currentItem.quantity) {
      const newItem: PRItem = {
        id: `ITEM-${Date.now()}`,
        name: currentItem.name,
        specification: currentItem.specification,
        quantity: parseInt(currentItem.quantity),
        requirements: currentItem.requirements,
      };
      setItems([...items, newItem]);
      setCurrentItem({
        name: "",
        specification: "",
        quantity: "",
        requirements: "",
      });
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    setCriticalSpares(criticalSpares.filter(spareId => spareId.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.suppliers.length === 0) {
      alert("Please select at least one supplier before submitting.");
      return;
    }
    // Validate reason for Modification/Refurbished PRs
    if ((formData.prType === "Modification" || formData.prType === "Refurbished") && !modRefReason.trim()) {
      alert(`Please provide a reason for ${formData.prType} before submitting.`);
      return;
    }
    onSubmit(formData, items, criticalSpares);
  };

  // Calculate total BOM cost
  const totalBOMCost = bomItems.reduce((sum, item) => {
    const itemData = items.find(i => i.id === item.id);
    const quantity = itemData?.quantity || item.quantity;
    return sum + (item.unitPrice * quantity);
  }, 0);

  // Calculate total cost for Modification/Refurbished based on selected items
  const modRefTotalCost = items.reduce((sum, item) => {
    const bomItem = bomItems.find(b => b.id === item.id);
    if (bomItem) {
      return sum + (bomItem.unitPrice * item.quantity);
    }
    return sum;
  }, 0);

  // Calculate Critical Spares cost (additional cost for spare inventory)
  const criticalSparesCost = criticalSpares.reduce((sum, spare) => {
    const bomItem = bomItems.find(item => item.id === spare.id);
    if (!bomItem) return sum;
    // Use the critical spare quantity, not the BOM quantity
    return sum + (bomItem.unitPrice * spare.quantity);
  }, 0);

  // Calculate overall subtotal based on PR type
  const overallSubtotal = formData.prType === "New Set" 
    ? (totalBOMCost + criticalSparesCost)
    : modRefTotalCost;

  // Calculate GST and Grand Total
  const gstAmount = overallSubtotal * 0.18; // 18% GST
  const grandTotal = overallSubtotal + gstAmount;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Project and PR Type Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="projectId">Select Project *</Label>
          <Select
            value={formData.projectId}
            onValueChange={handleProjectChange}
            required
            disabled={isViewMode}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.customerPO} - {project.partNumber}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="prType">PR Type *</Label>
          <Select
            value={formData.prType}
            onValueChange={(value: "New Set" | "Modification" | "Refurbished") =>
              handlePRTypeChange(value)
            }
            required
            disabled={isViewMode}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {userRole !== "Spares" && <SelectItem value="New Set">New Set</SelectItem>}
              <SelectItem value="Modification">Modification</SelectItem>
              <SelectItem value="Refurbished">Refurbished</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Supplier Selection - Moved here */}
      <div className="space-y-3">
        <Label>Select Suppliers * (Search and select from available suppliers)</Label>
        {!isViewMode && (
          <div className="relative">
            <TextField
              fullWidth
              placeholder="Search suppliers..."
              value={supplierSearchQuery}
              onChange={(e) => {
                setSupplierSearchQuery(e.target.value);
                setShowSupplierDropdown(true);
              }}
              onFocus={() => setShowSupplierDropdown(true)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: '#6b7280' }} />
                  </InputAdornment>
                ),
                endAdornment: supplierSearchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSupplierSearchQuery("");
                        setShowSupplierDropdown(false);
                      }}
                    >
                      <ClearIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              variant="outlined"
              size="small"
            />
            
            {/* Supplier Dropdown */}
            {showSupplierDropdown && filteredSuppliers.length > 0 && (
              <Paper
                elevation={3}
                sx={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  mt: 0.5,
                  zIndex: 1000,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {filteredSuppliers.map((supplier, idx) => (
                  <Box
                    key={idx}
                    onClick={() => handleSelectSupplier(supplier)}
                    sx={{
                      p: 1.5,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      '&:hover': {
                        backgroundColor: '#f1f5f9',
                      },
                      borderBottom: idx < filteredSuppliers.length - 1 ? '1px solid #e2e8f0' : 'none',
                    }}
                  >
                    {supplier}
                  </Box>
                ))}
              </Paper>
            )}
          </div>
        )}

        {/* Selected Suppliers */}
        {formData.suppliers.length > 0 && (
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Selected Suppliers ({formData.suppliers.length})</Label>
            <div className="flex flex-wrap gap-2">
              {formData.suppliers.map((supplier, idx) => (
                <Chip
                  key={idx}
                  label={supplier}
                  onDelete={!isViewMode ? () => handleRemoveSupplier(supplier) : undefined}
                  size="small"
                  sx={{
                    backgroundColor: '#dbeafe',
                    color: '#1e40af',
                    '& .MuiChip-deleteIcon': {
                      color: '#1e40af',
                      '&:hover': {
                        color: '#1e3a8a',
                      },
                    },
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {formData.suppliers.length === 0 && !isViewMode && (
          <p className="text-xs text-red-600">⚠️ Please select at least one supplier before submitting</p>
        )}
      </div>

      {/* Auto-populated Tool and Part Numbers for New Set */}
      {formData.prType === "New Set" && formData.toolNumber && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Auto-Populated Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-blue-700">Tool Number</Label>
              <p className="font-semibold text-blue-900">{formData.toolNumber}</p>
            </div>
            <div>
              <Label className="text-xs text-blue-700">Part Number</Label>
              <p className="font-semibold text-blue-900">{formData.partNumber}</p>
            </div>
          </div>
        </div>
      )}

      {/* No BOM Data Message for New Set */}
      {formData.prType === "New Set" && formData.toolNumber && bomItems.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-1">No BOM Data Available</h3>
              <p className="text-xs text-amber-800">
                Bill of Materials (BOM) data for Tool Number <strong>{formData.toolNumber}</strong> is not yet available in the system. 
                Please manually add the required items below.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BOM Section for New Set */}
      {formData.prType === "New Set" && bomItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Bill of Materials (BOM)</Label>
          </div>
          <TableContainer component={Paper} elevation={2} sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Item Code</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Specification</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Unit Price (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Subtotal (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#fef3c7' }}>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                      Critical Spare
                    </div>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#fef3c7' }}>
                    Critical Spare Qty
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bomItems.map((bomItem) => {
                  const itemData = items.find(i => i.id === bomItem.id);
                  const quantity = itemData?.quantity || bomItem.quantity;
                  const isCriticalSpare = criticalSpares.some(spare => spare.id === bomItem.id);
                  const criticalSpareData = criticalSpares.find(spare => spare.id === bomItem.id);
                  const criticalSpareQty = criticalSpareData?.quantity || 1;
                  return (
                    <TableRow key={bomItem.id} sx={{ '&:hover': { backgroundColor: '#f1f5f9' } }}>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>{bomItem.id}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{bomItem.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', color: '#64748b' }}>{bomItem.specification}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                        ₹{bomItem.unitPrice.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={quantity}
                          onChange={(e) => handleUpdateBOMQuantity(bomItem.id, parseInt(e.target.value) || 1)}
                          className="w-16 h-7 text-xs"
                          min="1"
                          disabled={isViewMode}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        ₹{(bomItem.unitPrice * quantity).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ backgroundColor: isCriticalSpare ? '#fef3c7' : 'transparent' }}>
                        <div className="flex items-center justify-center gap-1">
                          <Checkbox
                            checked={isCriticalSpare}
                            onCheckedChange={() => handleToggleCriticalSpare(bomItem.id)}
                            disabled={isViewMode}
                          />
                          {isCriticalSpare && (
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell sx={{ backgroundColor: isCriticalSpare ? '#fef3c7' : 'transparent' }}>
                        {isCriticalSpare && (
                          <Input
                            type="number"
                            value={criticalSpareQty}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              setCriticalSpares(criticalSpares.map(spare => 
                                spare.id === bomItem.id ? { ...spare, quantity: newQty } : spare
                              ));
                            }}
                            className="w-16 h-7 text-xs"
                            min="1"
                            disabled={isViewMode}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {!isViewMode && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveItem(bomItem.id)}
                            sx={{ color: '#ef4444' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Price Summary */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">BOM Subtotal:</span>
                <span className="text-sm font-semibold text-gray-900">₹{totalBOMCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              {criticalSpares.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-yellow-700 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                    Critical Spares Subtotal:
                  </span>
                  <span className="text-sm font-semibold text-yellow-700">₹{criticalSparesCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="border-t border-blue-300 pt-2 flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">Total Subtotal:</span>
                <span className="text-sm font-bold text-gray-900">₹{overallSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                <span className="text-sm font-semibold text-blue-700">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t-2 border-blue-400 pt-2 flex justify-between items-center">
                <span className="font-bold text-gray-900">Grand Total:</span>
                <span className="font-bold text-xl text-green-700">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Item Entry for Modification/Refurbished */}
      {formData.prType !== "New Set" && bomItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Select BOM Items for {formData.prType}</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Select items from the BOM and enter quantities
              </p>
            </div>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
              {items.length} Selected
            </Badge>
          </div>

          {/* BOM Selection Table */}
          <TableContainer component={Paper} elevation={2} sx={{ maxHeight: 400 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>
                    <div className="flex items-center gap-1">
                      Select
                    </div>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Item Code</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Item Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Specification</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Unit Price (₹)</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Qty</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', backgroundColor: '#f8fafc' }}>Subtotal (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bomItems.map((bomItem) => {
                  const itemData = items.find(i => i.id === bomItem.id);
                  const isSelected = !!itemData;
                  const quantity = itemData?.quantity || bomItem.quantity;
                  return (
                    <TableRow key={bomItem.id} sx={{ '&:hover': { backgroundColor: '#f1f5f9' }, backgroundColor: isSelected ? '#f0f9ff' : 'transparent' }}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleToggleBOMItem(bomItem, !!checked)}
                          disabled={isViewMode}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#2563eb' }}>{bomItem.id}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>{bomItem.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.7rem', color: '#64748b' }}>{bomItem.specification}</TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                        ₹{bomItem.unitPrice.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {isSelected && (
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleUpdateModRefQuantity(bomItem.id, parseInt(e.target.value) || 1)}
                            className="w-16 h-7 text-xs"
                            min="1"
                            disabled={isViewMode}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {isSelected && `₹${(bomItem.unitPrice * quantity).toLocaleString()}`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Price Summary for Modification/Refurbished */}
          {items.length > 0 && (
            <>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900">Subtotal:</span>
                    <span className="text-sm font-bold text-gray-900">₹{modRefTotalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">GST (18%):</span>
                    <span className="text-sm font-semibold text-purple-700">₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t-2 border-purple-400 pt-2 flex justify-between items-center">
                    <span className="font-bold text-gray-900">Grand Total:</span>
                    <span className="font-bold text-xl text-green-700">₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Reason Field for Modification/Refurbished */}
              <div className="space-y-2">
                <Label htmlFor="modRefReason" className="text-sm font-semibold flex items-center gap-1">
                  Reason for {formData.prType} {!isViewMode && <span className="text-red-600">*</span>}
                </Label>
                <Textarea
                  id="modRefReason"
                  value={modRefReason}
                  onChange={(e) => setModRefReason(e.target.value)}
                  placeholder={`Please provide a detailed reason for this ${formData.prType} request...`}
                  className="min-h-[100px] resize-none"
                  required={!isViewMode}
                  disabled={isViewMode}
                />
                {!modRefReason.trim() && !isViewMode && (
                  <p className="text-xs text-red-600">⚠️ Reason is mandatory for {formData.prType} PR</p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Form Actions */}
      {!isViewMode && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={items.length === 0 || formData.suppliers.length === 0}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            {isEditMode ? "Update PR" : "Create PR"}
          </Button>
        </div>
      )}

      {isViewMode && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Close
          </Button>
        </div>
      )}
    </form>
  );
}
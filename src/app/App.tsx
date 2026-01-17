import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Dashboard } from "./components/Dashboard";
import { LeftNav } from "./components/LeftNav";
import { ProfileDialog } from "./components/ProfileDialog";
import type { Project, PR, ToolHandoverRecord, InventoryItem, SparesRequest, Supplier } from "./components/Dashboard";
import { UserCircle, Building2, Sparkles, Settings, Bell, LogOut } from "lucide-react";
import { apiService } from "./services/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Badge } from "./components/ui/badge";

// NPD Workflow Application - v2.1 with Enhanced Spares KPI Cards
type UserRole = "Approver" | "NPD" | "Maintenance" | "Spares" | "Indentor";

function App() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Shared state across all roles - projects will be fetched from API
  const [projects, setProjects] = useState<Project[]>([]);

  // Fetch all projects for Dashboard stats when user is logged in
  useEffect(() => {
    const fetchAllProjects = async () => {
      if (!selectedRole || !apiService.isAuthenticated()) return;
      
      try {
        const response = await apiService.getProjects({ limit: 1000 }); // Get all for Dashboard stats
        const transformProject = (backendProject: any): Project => {
          return {
            id: backendProject.id,
            projectNumber: backendProject.projectNumber,
            customerPO: backendProject.customerPO,
            partNumber: backendProject.partNumber,
            toolNumber: backendProject.toolNumber,
            price: parseFloat(backendProject.price),
            targetDate: backendProject.targetDate,
            status: backendProject.status,
            description: backendProject.description,
            createdBy: typeof backendProject.createdBy === 'object' 
              ? `${backendProject.createdBy.firstName} ${backendProject.createdBy.lastName}`
              : backendProject.createdBy || 'Unknown',
            createdAt: backendProject.createdAt,
            updatedAt: backendProject.updatedAt,
          };
        };
        const transformedProjects = response.data.map(transformProject);
        setProjects(transformedProjects);
      } catch (err) {
        console.error('Error fetching projects for Dashboard:', err);
        // Keep empty array on error
      }
    };

    fetchAllProjects();
  }, [selectedRole]);

  const [prs, setPRs] = useState<PR[]>([
    // Awarded PR with complete workflow
    {
      id: "PR-2024-001",
      projectId: "PROJ-001",
      prType: "New Set",
      items: [
        {
          id: "ITEM-001",
          name: "Injection Mold Cavity",
          specification: "High-grade steel P20, hardness 28-32 HRC",
          quantity: 2,
          requirements: "Mirror finish, tolerance ±0.01mm",
          price: 37500
        },
        {
          id: "ITEM-002",
          name: "Core Pin Set",
          specification: "H13 steel, heat treated",
          quantity: 8,
          requirements: "Surface hardness 48-52 HRC",
          price: 3750
        },
        {
          id: "ITEM-003",
          name: "Ejector Pins",
          specification: "SKD61, diameter 6mm",
          quantity: 20,
          requirements: "Nitrided surface",
          price: 1100
        },
        {
          id: "ITEM-006",
          name: "Cooling Channels",
          specification: "Brass connectors, 8mm diameter",
          quantity: 6,
          requirements: "Leak-proof design",
          price: 2500
        },
        {
          id: "ITEM-007",
          name: "Guide Bushings",
          specification: "Bronze alloy, self-lubricating",
          quantity: 4,
          requirements: "Tolerance ±0.005mm",
          price: 1800
        },
        {
          id: "ITEM-008",
          name: "Return Springs",
          specification: "Stainless steel, 12mm OD",
          quantity: 10,
          requirements: "Load rating 150N",
          price: 850
        }
      ],
      suppliers: ["Precision Tools Ltd", "ABC Manufacturing", "Global Tooling Co"],
      status: "Awarded",
      createdBy: "NPD Team",
      createdAt: "2024-07-12T09:00:00Z",
      approverComments: "Approved for urgent production requirement",
      awardedSupplier: "Precision Tools Ltd",
      criticalSpares: [
        { id: "ITEM-002", quantity: 4 },  // Core Pin Set - 4 critical spares
        { id: "ITEM-003", quantity: 10 }  // Ejector Pins - 10 critical spares
      ],
      quotations: [
        {
          id: "QUOT-001",
          prId: "PR-2024-001",
          supplier: "Precision Tools Ltd",
          price: 118000,
          items: [
            {
              itemId: "ITEM-001",
              itemName: "Injection Mold Cavity",
              unitPrice: 35000,
              quantity: 2,
              totalPrice: 70000
            },
            {
              itemId: "ITEM-002",
              itemName: "Core Pin Set",
              unitPrice: 3500,
              quantity: 8,
              totalPrice: 28000
            },
            {
              itemId: "ITEM-003",
              itemName: "Ejector Pins",
              unitPrice: 1000,
              quantity: 20,
              totalPrice: 20000
            },
            {
              itemId: "ITEM-006",
              itemName: "Cooling Channels",
              unitPrice: 2500,
              quantity: 6,
              totalPrice: 15000
            },
            {
              itemId: "ITEM-007",
              itemName: "Guide Bushings",
              unitPrice: 1800,
              quantity: 4,
              totalPrice: 7200
            },
            {
              itemId: "ITEM-008",
              itemName: "Return Springs",
              unitPrice: 850,
              quantity: 10,
              totalPrice: 8500
            }
          ],
          deliveryTerms: "EXW Factory",
          deliveryDate: "2024-03-10",
          status: "Selected",
          notes: "Best quality and delivery time"
        },
        {
          id: "QUOT-002",
          prId: "PR-2024-001",
          supplier: "ABC Manufacturing",
          price: 125000,
          items: [
            {
              itemId: "ITEM-001",
              itemName: "Injection Mold Cavity",
              unitPrice: 38000,
              quantity: 2,
              totalPrice: 76000
            },
            {
              itemId: "ITEM-002",
              itemName: "Core Pin Set",
              unitPrice: 3200,
              quantity: 8,
              totalPrice: 25600
            },
            {
              itemId: "ITEM-003",
              itemName: "Ejector Pins",
              unitPrice: 1170,
              quantity: 20,
              totalPrice: 23400
            },
            {
              itemId: "ITEM-006",
              itemName: "Cooling Channels",
              unitPrice: 2600,
              quantity: 6,
              totalPrice: 15600
            },
            {
              itemId: "ITEM-007",
              itemName: "Guide Bushings",
              unitPrice: 1900,
              quantity: 4,
              totalPrice: 7600
            },
            {
              itemId: "ITEM-008",
              itemName: "Return Springs",
              unitPrice: 900,
              quantity: 10,
              totalPrice: 9000
            }
          ],
          deliveryTerms: "FOB Port",
          deliveryDate: "2024-03-12",
          status: "Evaluated",
          notes: "Higher price, similar quality"
        },
        {
          id: "QUOT-003",
          prId: "PR-2024-001",
          supplier: "Global Tooling Co",
          price: 130000,
          items: [
            {
              itemId: "ITEM-001",
              itemName: "Injection Mold Cavity",
              unitPrice: 40000,
              quantity: 2,
              totalPrice: 80000
            },
            {
              itemId: "ITEM-002",
              itemName: "Core Pin Set",
              unitPrice: 3600,
              quantity: 8,
              totalPrice: 28800
            },
            {
              itemId: "ITEM-003",
              itemName: "Ejector Pins",
              unitPrice: 1060,
              quantity: 20,
              totalPrice: 21200
            },
            {
              itemId: "ITEM-006",
              itemName: "Cooling Channels",
              unitPrice: 2700,
              quantity: 6,
              totalPrice: 16200
            },
            {
              itemId: "ITEM-007",
              itemName: "Guide Bushings",
              unitPrice: 2000,
              quantity: 4,
              totalPrice: 8000
            },
            {
              itemId: "ITEM-008",
              itemName: "Return Springs",
              unitPrice: 950,
              quantity: 10,
              totalPrice: 9500
            }
          ],
          deliveryTerms: "CIF",
          deliveryDate: "2024-03-15",
          status: "Rejected",
          notes: "Exceeded budget"
        }
      ]
    },
    // Approved PR with quotations
    {
      id: "PR-2024-002",
      projectId: "PROJ-002",
      prType: "Modification",
      items: [
        {
          id: "ITEM-004",
          name: "Modified Cooling Channel",
          specification: "Copper alloy inserts",
          quantity: 4,
          requirements: "Conformal cooling design",
          price: 12500
        },
        {
          id: "ITEM-005",
          name: "Slide Mechanism Update",
          specification: "Hydraulic assisted",
          quantity: 2,
          requirements: "150 bar pressure rating",
          price: 17500
        }
      ],
      suppliers: ["Precision Tools Ltd", "TechMold Systems"],
      status: "Sent To Supplier",
      createdBy: "NPD Team",
      createdAt: "2024-08-18T10:30:00Z",
      approverComments: "Approved for modification as per customer requirement",
      quotations: [
        {
          id: "QUOT-004",
          prId: "PR-2024-002",
          supplier: "Precision Tools Ltd",
          price: 82000,
          items: [
            {
              itemId: "ITEM-004",
              itemName: "Modified Cooling Channel",
              unitPrice: 15000,
              quantity: 4,
              totalPrice: 60000
            },
            {
              itemId: "ITEM-005",
              itemName: "Slide Mechanism Update",
              unitPrice: 11000,
              quantity: 2,
              totalPrice: 22000
            }
          ],
          deliveryTerms: "EXW Factory",
          deliveryDate: "2024-03-18",
          status: "Pending",
          notes: "Awaiting technical review"
        },
        {
          id: "QUOT-005",
          prId: "PR-2024-002",
          supplier: "TechMold Systems",
          price: 79000,
          items: [
            {
              itemId: "ITEM-004",
              itemName: "Modified Cooling Channel",
              unitPrice: 13500,
              quantity: 4,
              totalPrice: 54000
            },
            {
              itemId: "ITEM-005",
              itemName: "Slide Mechanism Update",
              unitPrice: 12500,
              quantity: 2,
              totalPrice: 25000
            }
          ],
          deliveryTerms: "FOB Port",
          deliveryDate: "2024-03-20",
          status: "Pending",
          notes: "Competitive pricing"
        }
      ]
    },
    // Pending Approval PR
    {
      id: "PR-2024-003",
      projectId: "PROJ-003",
      prType: "Refurbished",
      items: [
        {
          id: "ITEM-006",
          name: "Refurbished Mold Base",
          specification: "P20 steel, reconditioned",
          quantity: 1,
          requirements: "Re-machined and polished",
          price: 28000
        },
        {
          id: "ITEM-007",
          name: "New Guide Bushings",
          specification: "Bronze alloy",
          quantity: 12,
          requirements: "Standard tolerance",
          price: 800
        }
      ],
      suppliers: ["Refurb Tech Solutions", "Precision Tools Ltd"],
      status: "Submitted",
      createdBy: "NPD Team",
      createdAt: "2024-09-15T14:15:00Z"
    },
    // Awarded PR for different project
    {
      id: "PR-2024-004",
      projectId: "PROJ-004",
      prType: "New Set",
      items: [
        {
          id: "ITEM-008",
          name: "Die Casting Mold",
          specification: "H13 steel, complete set",
          quantity: 1,
          requirements: "Automotive grade quality",
          price: 145000
        },
        {
          id: "ITEM-009",
          name: "Runner System",
          specification: "Hot runner 4-zone",
          quantity: 1,
          requirements: "Temperature control ±2°C",
          price: 48000
        }
      ],
      suppliers: ["Global Tooling Co", "MoldTech Industries"],
      status: "Awarded",
      createdBy: "NPD Team",
      createdAt: "2024-10-28T11:00:00Z",
      approverComments: "Approved with priority handling",
      awardedSupplier: "MoldTech Industries",
      quotations: [
        {
          id: "QUOT-006",
          prId: "PR-2024-004",
          supplier: "MoldTech Industries",
          price: 62000,
          items: [
            {
              itemId: "ITEM-008",
              itemName: "Die Casting Mold",
              unitPrice: 45000,
              quantity: 1,
              totalPrice: 45000
            },
            {
              itemId: "ITEM-009",
              itemName: "Runner System",
              unitPrice: 17000,
              quantity: 1,
              totalPrice: 17000
            }
          ],
          deliveryTerms: "EXW Factory",
          deliveryDate: "2024-04-20",
          status: "Selected",
          notes: "Excellent track record"
        },
        {
          id: "QUOT-007",
          prId: "PR-2024-004",
          supplier: "Global Tooling Co",
          price: 68000,
          items: [
            {
              itemId: "ITEM-008",
              itemName: "Die Casting Mold",
              unitPrice: 48000,
              quantity: 1,
              totalPrice: 48000
            },
            {
              itemId: "ITEM-009",
              itemName: "Runner System",
              unitPrice: 20000,
              quantity: 1,
              totalPrice: 20000
            }
          ],
          deliveryTerms: "CIF",
          deliveryDate: "2024-04-22",
          status: "Evaluated",
          notes: "Higher cost"
        }
      ]
    },
    // Draft PR
    {
      id: "PR-2024-005",
      projectId: "PROJ-005",
      prType: "Modification",
      items: [
        {
          id: "ITEM-010",
          name: "Upgraded Ejection System",
          specification: "Pneumatic assisted",
          quantity: 1,
          requirements: "6 bar pressure",
          price: 22000
        }
      ],
      suppliers: ["TechMold Systems"],
      status: "Approved",
      createdBy: "NPD Team",
      createdAt: "2024-11-20T09:30:00Z"
    },
    {
      id: "PR-2024-006",
      projectId: "PROJ-001",
      prType: "New Set",
      items: [
        {
          id: "ITEM-006",
          itemCode: "IC-1001",
          name: "Core Plate",
          specification: "High-grade steel, heat-treated",
          price: 15000,
          quantity: 2,
          requirements: "Heat treatment required",
          isCriticalSpare: false
        }
      ],
      suppliers: ["Precision Tools Ltd", "TechMold Systems"],
      status: "Submitted for Approval",
      createdBy: "NPD Team",
      createdAt: "2024-10-05T11:00:00Z",
      quotations: [
        {
          id: "QUOT-010",
          prId: "PR-2024-006",
          supplier: "Precision Tools Ltd",
          price: 32000,
          items: [
            {
              itemId: "ITEM-006",
              itemName: "Core Plate",
              unitPrice: 16000,
              quantity: 2,
              totalPrice: 32000
            }
          ],
          deliveryTerms: "EXW Factory",
          deliveryDate: "2024-11-20",
          status: "Evaluated",
          notes: "Standard delivery time"
        },
        {
          id: "QUOT-011",
          prId: "PR-2024-006",
          supplier: "TechMold Systems",
          price: 29000,
          items: [
            {
              itemId: "ITEM-006",
              itemName: "Core Plate",
              unitPrice: 14500,
              quantity: 2,
              totalPrice: 29000
            }
          ],
          deliveryTerms: "FOB Port",
          deliveryDate: "2024-11-18",
          status: "Evaluated",
          notes: "Competitive pricing with faster delivery"
        }
      ]
    },
    {
      id: "PR-2024-007",
      projectId: "PROJ-002",
      prType: "Modification",
      items: [
        {
          id: "ITEM-007",
          itemCode: "IC-2002",
          name: "Cooling Channel Block",
          specification: "Aluminum alloy with conformal cooling",
          price: 8000,
          quantity: 3,
          requirements: "Advanced cooling design",
          isCriticalSpare: true
        }
      ],
      suppliers: ["TechMold Systems", "Precision Tools Ltd"],
      status: "Awarded",
      createdBy: "NPD Team",
      createdAt: "2024-07-10T13:20:00Z",
      approverComments: "Approved and awarded to TechMold Systems",
      awardedSupplier: "TechMold Systems"
    },
    // 2025 PRs for year filter testing
    {
      id: "PR-2025-001",
      projectId: "PROJ-001",
      prType: "New Set",
      items: [
        {
          id: "ITEM-010",
          name: "Precision Guide Rails",
          specification: "Hardened steel, linear motion",
          quantity: 4,
          requirements: "Ultra-smooth surface finish",
          price: 4500
        }
      ],
      suppliers: ["Precision Tools Ltd"],
      status: "Submitted for Approval",
      createdBy: "NPD Team",
      createdAt: "2025-01-15T10:00:00Z"
    },
    {
      id: "PR-2025-002",
      projectId: "PROJ-002",
      prType: "Modification",
      items: [
        {
          id: "ITEM-011",
          name: "Hydraulic Cylinders",
          specification: "High-pressure rated, 50mm bore",
          quantity: 2,
          requirements: "Chrome plated rod",
          price: 6200
        }
      ],
      suppliers: ["ABC Manufacturing"],
      status: "Approved",
      createdBy: "NPD Team",
      createdAt: "2025-02-20T14:30:00Z",
      approverComments: "Approved for production needs"
    },
    {
      id: "PR-2025-003",
      projectId: "PROJ-003",
      prType: "Refurbished",
      items: [
        {
          id: "ITEM-012",
          name: "Servo Motor Assembly",
          specification: "3kW, high torque",
          quantity: 1,
          requirements: "Factory refurbished with warranty",
          price: 8500
        }
      ],
      suppliers: ["Global Tooling Co"],
      status: "Submitted for Approval",
      createdBy: "NPD Team",
      createdAt: "2025-03-10T09:45:00Z"
    },
    {
      id: "PR-2025-004",
      projectId: "PROJ-004",
      prType: "New Set",
      items: [
        {
          id: "ITEM-013",
          name: "Sensor Array Kit",
          specification: "Proximity sensors, IP67 rated",
          quantity: 10,
          requirements: "Industrial grade with mounting",
          price: 3200
        }
      ],
      suppliers: ["TechMold Systems"],
      status: "Awarded",
      createdBy: "NPD Team",
      createdAt: "2025-04-05T11:15:00Z",
      approverComments: "Urgent requirement approved",
      awardedSupplier: "TechMold Systems"
    },
    {
      id: "PR-2025-005",
      projectId: "PROJ-005",
      prType: "Modification",
      items: [
        {
          id: "ITEM-014",
          name: "Control Panel Upgrade",
          specification: "PLC-based automation system",
          quantity: 1,
          requirements: "Touch screen HMI included",
          price: 15000
        }
      ],
      suppliers: ["Precision Tools Ltd", "ABC Manufacturing"],
      status: "Sent To Supplier",
      createdBy: "NPD Team",
      createdAt: "2025-05-12T13:00:00Z"
    },
    {
      id: "PR-2025-006",
      projectId: "PROJ-006",
      prType: "New Set",
      items: [
        {
          id: "ITEM-015",
          name: "Vacuum Pump Unit",
          specification: "Rotary vane, 100 CFM",
          quantity: 1,
          requirements: "Oil-free operation",
          price: 9800
        }
      ],
      suppliers: ["Global Tooling Co"],
      status: "Approved",
      createdBy: "NPD Team",
      createdAt: "2025-06-18T08:30:00Z",
      approverComments: "Approved for facility upgrade"
    },
    {
      id: "PR-2025-007",
      projectId: "PROJ-007",
      prType: "Refurbished",
      items: [
        {
          id: "ITEM-016",
          name: "Heating Elements",
          specification: "Cartridge heaters, 1kW each",
          quantity: 8,
          requirements: "High-temperature resistant",
          price: 2400
        }
      ],
      suppliers: ["TechMold Systems"],
      status: "Submitted for Approval",
      createdBy: "NPD Team",
      createdAt: "2025-07-22T15:45:00Z"
    },
    {
      id: "PR-2025-008",
      projectId: "PROJ-008",
      prType: "New Set",
      items: [
        {
          id: "ITEM-017",
          name: "Lubrication System",
          specification: "Automatic progressive distributor",
          quantity: 1,
          requirements: "Timer-based operation",
          price: 7200
        }
      ],
      suppliers: ["Precision Tools Ltd"],
      status: "Awarded",
      createdBy: "NPD Team",
      createdAt: "2025-08-30T10:20:00Z",
      approverComments: "Essential for machine maintenance",
      awardedSupplier: "Precision Tools Ltd"
    },
    {
      id: "PR-2025-009",
      projectId: "PROJ-009",
      prType: "Modification",
      items: [
        {
          id: "ITEM-018",
          name: "Safety Interlock Switches",
          specification: "Magnetic safety switches",
          quantity: 6,
          requirements: "Emergency stop integration",
          price: 1800
        }
      ],
      suppliers: ["ABC Manufacturing"],
      status: "Submitted for Approval",
      createdBy: "NPD Team",
      createdAt: "2025-09-14T12:00:00Z"
    },
    {
      id: "PR-2025-010",
      projectId: "PROJ-010",
      prType: "New Set",
      items: [
        {
          id: "ITEM-019",
          name: "Pneumatic Actuators",
          specification: "Double-acting cylinders, 63mm bore",
          quantity: 4,
          requirements: "Position sensors included",
          price: 5400
        }
      ],
      suppliers: ["Global Tooling Co", "TechMold Systems"],
      status: "Approved",
      createdBy: "NPD Team",
      createdAt: "2025-10-08T09:30:00Z",
      approverComments: "Approved for automation project"
    },
    {
      id: "PR-2025-011",
      projectId: "PROJ-011",
      prType: "Refurbished",
      items: [
        {
          id: "ITEM-020",
          name: "Gearbox Assembly",
          specification: "Helical gearbox, 10:1 ratio",
          quantity: 2,
          requirements: "Refurbished with new bearings",
          price: 11000
        }
      ],
      suppliers: ["Precision Tools Ltd"],
      status: "Sent To Supplier",
      createdBy: "NPD Team",
      createdAt: "2025-11-19T14:15:00Z"
    },
    {
      id: "PR-2025-012",
      projectId: "PROJ-012",
      prType: "New Set",
      items: [
        {
          id: "ITEM-021",
          name: "Temperature Controllers",
          specification: "PID controllers with digital display",
          quantity: 3,
          requirements: "Thermocouple type K input",
          price: 2700
        }
      ],
      suppliers: ["ABC Manufacturing"],
      status: "Awarded",
      createdBy: "NPD Team",
      createdAt: "2025-12-05T11:00:00Z",
      approverComments: "Year-end procurement approved",
      awardedSupplier: "ABC Manufacturing"
    }
  ]);

  const [handovers, setHandovers] = useState<ToolHandoverRecord[]>([
    // Pending handover
    {
      id: "HAND-002",
      projectId: "PROJ-004",
      prId: "PR-2024-004",
      toolSet: "TN-9004 Die Casting Mold Complete",
      allItems: [
        {
          id: "ITEM-008",
          name: "Die Casting Mold",
          specification: "H13 steel, heat treated",
          quantity: 1,
          requirements: "Hardness 48-52 HRC",
          price: 45000
        },
        {
          id: "ITEM-009",
          name: "Runner System",
          specification: "Hot runner, 4 nozzles",
          quantity: 1,
          requirements: "Temperature control ±2°C",
          price: 17000
        }
      ],
      criticalSpares: [
        {
          id: "SPARE-004",
          partNumber: "PN-34567",
          toolNumber: "TN-9004",
          name: "Hot Runner Nozzle",
          quantity: 4
        },
        {
          id: "SPARE-005",
          partNumber: "PN-34567",
          toolNumber: "TN-9004",
          name: "Temperature Sensor",
          quantity: 8
        }
      ],
      status: "Pending Inspection",
      remarks: "Awaiting maintenance team inspection"
    }
  ]);

  const [inventory, setInventory] = useState<InventoryItem[]>([
    // Items from approved handover HAND-001
    {
      id: "INV-001",
      partNumber: "PN-12345",
      toolNumber: "TN-9001",
      name: "Ejector Pin 6mm",
      quantity: 10,
      stockLevel: 10,
      minStockLevel: 5,
      status: "In Stock"
    },
    {
      id: "INV-002",
      partNumber: "PN-12345",
      toolNumber: "TN-9001",
      name: "Core Pin H13",
      quantity: 4,
      stockLevel: 4,
      minStockLevel: 2,
      status: "In Stock"
    },
    {
      id: "INV-003",
      partNumber: "PN-12345",
      toolNumber: "TN-9001",
      name: "Guide Bushing",
      quantity: 6,
      stockLevel: 3,
      minStockLevel: 3,
      status: "Low Stock"
    },
    // Additional inventory items
    {
      id: "INV-004",
      partNumber: "PN-67890",
      toolNumber: "TN-9002",
      name: "Cooling Channel Insert",
      quantity: 8,
      stockLevel: 2,
      minStockLevel: 4,
      status: "Low Stock"
    },
    {
      id: "INV-005",
      partNumber: "PN-67890",
      toolNumber: "TN-9002",
      name: "Hydraulic Cylinder",
      quantity: 6,
      stockLevel: 6,
      minStockLevel: 2,
      status: "In Stock"
    },
    {
      id: "INV-006",
      partNumber: "PN-34567",
      toolNumber: "TN-9004",
      name: "Bearing Assembly",
      quantity: 12,
      stockLevel: 1,
      minStockLevel: 4,
      status: "Low Stock"
    }
  ]);

  const [sparesRequests, setSparesRequests] = useState<SparesRequest[]>([
    // Fulfilled request
    {
      id: "REQ-001",
      requestedBy: "Production Line A",
      itemName: "Ejector Pin Set",
      partNumber: "PN-12345",
      toolNumber: "TN-9001",
      quantityRequested: 3,
      quantityFulfilled: 3,
      status: "Fulfilled",
      requestDate: "2024-02-18T08:30:00Z",
      purpose: "Replacement due to wear"
    },
    // Pending requests
    {
      id: "REQ-002",
      requestedBy: "Production Line B",
      itemName: "Ejector Pin Set",
      partNumber: "PN-12345",
      toolNumber: "TN-9001",
      quantityRequested: 2,
      quantityFulfilled: 0,
      status: "Pending",
      requestDate: "2024-02-20T10:15:00Z",
      purpose: "Production maintenance"
    },
    {
      id: "REQ-003",
      requestedBy: "Production Line C",
      itemName: "Cooling Channel Insert",
      partNumber: "PN-67890",
      toolNumber: "TN-9002",
      quantityRequested: 4,
      quantityFulfilled: 0,
      status: "Pending",
      requestDate: "2024-02-21T14:20:00Z",
      purpose: "Urgent replacement"
    },
    {
      id: "REQ-004",
      requestedBy: "Production Line A",
      itemName: "Bearing Assembly",
      partNumber: "PN-34567",
      toolNumber: "TN-9004",
      quantityRequested: 2,
      quantityFulfilled: 0,
      status: "Pending",
      requestDate: "2024-02-22T09:00:00Z",
      purpose: "Scheduled maintenance"
    },
    {
      id: "REQ-005",
      requestedBy: "Production Line D",
      itemName: "Ejector Pin Set",
      partNumber: "PN-12345",
      toolNumber: "TN-9001",
      quantityRequested: 5,
      quantityFulfilled: 3,
      status: "Fulfilled",
      requestDate: "2024-02-10T11:00:00Z",
      purpose: "Emergency repair"
    },
    {
      id: "REQ-006",
      requestedBy: "Production Line E",
      itemName: "Cooling Channel Insert",
      partNumber: "PN-67890",
      toolNumber: "TN-9002",
      quantityRequested: 3,
      quantityFulfilled: 0,
      status: "Rejected",
      requestDate: "2024-02-15T14:30:00Z",
      purpose: "Stock unavailable"
    }
  ]);

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([
    {
      id: "SUP-001",
      name: "TechMold Systems",
      code: "TMS-001",
      contactPerson: "Rajesh Kumar",
      email: "rajesh@techmold.com",
      phone: "+91-9876543210",
      address: "Plot 42, Industrial Area Phase 3",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411019",
      gstin: "27AABCT1234M1Z5",
      status: "Active",
      category: ["Tools & Dies", "Machinery"],
      rating: 4.5,
      totalOrders: 24,
      createdAt: "2023-01-15T10:00:00Z",
      notes: "Reliable supplier with excellent quality"
    },
    {
      id: "SUP-002",
      name: "Precision Tools Ltd",
      code: "PTL-002",
      contactPerson: "Amit Patel",
      email: "amit@precisiontools.com",
      phone: "+91-9123456789",
      address: "B-Wing, Tech Park",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560001",
      gstin: "29AACCP1234N1ZA",
      status: "Active",
      category: ["Components", "Spare Parts", "Tools & Dies"],
      rating: 4.2,
      totalOrders: 18,
      createdAt: "2023-03-20T14:30:00Z",
      notes: "Fast delivery, competitive pricing"
    },
    {
      id: "SUP-003",
      name: "Global Tooling Co",
      code: "GTC-003",
      contactPerson: "Sarah Williams",
      email: "sarah@globaltooling.com",
      phone: "+91-9988776655",
      address: "Sector 15, MIDC",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      gstin: "27AACGC1234P1Z8",
      status: "Active",
      category: ["Tools & Dies", "Raw Materials"],
      rating: 4.0,
      totalOrders: 15,
      createdAt: "2023-05-10T09:15:00Z"
    },
    {
      id: "SUP-004",
      name: "MoldTech Industries",
      code: "MTI-004",
      contactPerson: "Suresh Reddy",
      email: "suresh@moldtech.com",
      phone: "+91-9876123456",
      address: "Plot 28, Export Promotion Zone",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600001",
      gstin: "33AACMI1234Q1Z2",
      status: "Active",
      category: ["Tools & Dies", "Machinery", "Services"],
      rating: 4.7,
      totalOrders: 32,
      createdAt: "2022-11-05T11:20:00Z",
      notes: "Premium quality, ISO certified"
    },
    {
      id: "SUP-005",
      name: "Refurb Tech Solutions",
      code: "RTS-005",
      contactPerson: "Vikas Sharma",
      email: "vikas@refurbtech.com",
      phone: "+91-9123987654",
      address: "Industrial Estate, Zone C",
      city: "Coimbatore",
      state: "Tamil Nadu",
      pincode: "641001",
      gstin: "33AACRT1234R1Z9",
      status: "Active",
      category: ["Services", "Spare Parts"],
      rating: 3.8,
      totalOrders: 12,
      createdAt: "2023-07-18T15:45:00Z",
      notes: "Specializes in refurbishment"
    },
    {
      id: "SUP-006",
      name: "Steel Components Inc",
      code: "SCI-006",
      contactPerson: "Priya Desai",
      email: "priya@steelcomponents.com",
      phone: "+91-9876509876",
      address: "G-12, Heavy Industry Area",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380001",
      gstin: "24AACSC1234S1Z3",
      status: "Inactive",
      category: ["Raw Materials", "Components"],
      rating: 3.5,
      totalOrders: 8,
      createdAt: "2023-09-22T13:00:00Z",
      notes: "On hold due to quality issues"
    }
  ]);

  // Calculate pending counts for nav badges
  const getPendingCounts = () => {
    return {
      projects: projects.length,
      prs: prs.filter(pr => pr.status === "Pending Approval").length,
      quotations: prs.filter(pr => pr.status === "Submitted for Approval" || (pr.quotations && pr.quotations.some(q => q.status === "Pending"))).length,
      handovers: handovers.filter(h => h.status === "Pending Inspection").length,
      lowStock: inventory.filter(item => item.status === "Low Stock").length,
      requests: sparesRequests.filter(req => req.status === "Pending").length,
    };
  };

  const handleSwitchRole = () => {
    setSelectedRole(null);
    setActiveTab("dashboard");
    setEmail("");
    setPassword("");
    setError(null);
    apiService.logout();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await apiService.login(email, password);
      // Map API role to UserRole type
      const userRole = response.user.role as UserRole;
      setSelectedRole(userRole);
      setActiveTab("dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Invalid email or password. Please try again.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        
        <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-8 pt-10">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-2xl shadow-lg">
                  <Building2 className="w-14 h-14 text-white" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Tool Maintenance System
              </CardTitle>
              <p className="text-muted-foreground">
                Purchase Requisition Management Platform
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pb-10">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 border-2 hover:border-indigo-300 transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 border-2 hover:border-indigo-300 transition-colors"
                  required
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-base"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" />
                Complete workflow from project creation to spares management
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col overflow-hidden">
      {/* Header - Fixed Height */}
      <div className="h-[72px] bg-white border-b border-slate-200 shadow-sm z-20 flex-shrink-0">
        <div className="px-6 py-4 h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2.5 rounded-xl shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Tool Maintenance System
                </h1>
                <p className="text-sm text-muted-foreground">
                  Purchase Requisition Management
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative hover:bg-slate-100">
                    <Bell className="w-5 h-5 text-slate-600" />
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
                      3
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <div className="flex items-start gap-3 py-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                      <div>
                        <p className="font-medium text-sm">New PR Created</p>
                        <p className="text-xs text-muted-foreground">PR-2024-001 awaiting your approval</p>
                        <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <div className="flex items-start gap-3 py-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5" />
                      <div>
                        <p className="font-medium text-sm">Quotation Received</p>
                        <p className="text-xs text-muted-foreground">Supplier ABC submitted quote for PR-2024-002</p>
                        <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <div className="flex items-start gap-3 py-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5" />
                      <div>
                        <p className="font-medium text-sm">Low Stock Alert</p>
                        <p className="text-xs text-muted-foreground">Bearing-456 inventory below threshold</p>
                        <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Settings */}
              <Button variant="ghost" size="sm" className="hover:bg-slate-100">
                <Settings className="w-5 h-5 text-slate-600" />
              </Button>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-slate-100">
                    <UserCircle className="w-5 h-5 text-slate-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{selectedRole} User</p>
                      <p className="text-xs text-muted-foreground">{selectedRole.toLowerCase()}@company.com</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setProfileDialogOpen(true)}>
                    <UserCircle className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleSwitchRole}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Left Nav + Dashboard - Static Height */}
      <div className="flex flex-1 overflow-hidden">
        <LeftNav
          userRole={selectedRole}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSwitchRole={handleSwitchRole}
          pendingCount={getPendingCounts()}
        />
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <Dashboard
            userRole={selectedRole}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            projects={projects}
            setProjects={setProjects}
            prs={prs}
            setPRs={setPRs}
            handovers={handovers}
            setHandovers={setHandovers}
            inventory={inventory}
            setInventory={setInventory}
            sparesRequests={sparesRequests}
            setSparesRequests={setSparesRequests}
            suppliers={suppliers}
            setSuppliers={setSuppliers}
          />
        </main>
      </div>

      {/* Profile Dialog */}
      <ProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
        userRole={selectedRole}
      />
    </div>
  );
}

export default App;
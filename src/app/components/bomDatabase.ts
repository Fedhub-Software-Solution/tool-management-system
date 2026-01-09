export interface BOMItem {
  id: string;
  name: string;
  specification: string;
  unitPrice: number;
  quantity: number;
}

export const bomDatabase: Record<string, BOMItem[]> = {
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
  "TN-9011": [
    { id: "BOM-053", name: "Injection Mold Core", specification: "Tool Steel P20 - Custom Design", unitPrice: 1850, quantity: 1 },
    { id: "BOM-054", name: "Cavity Plate", specification: "Steel H13 - 220x180x35mm", unitPrice: 520, quantity: 1 },
    { id: "BOM-055", name: "Ejector Pin Set", specification: "Hardened Steel - Ø6x100mm", unitPrice: 45, quantity: 12 },
    { id: "BOM-056", name: "Cooling Manifold", specification: "Brass - Custom Configuration", unitPrice: 285, quantity: 1 },
    { id: "BOM-057", name: "Guide Bush Set", specification: "Bronze Alloy - Ø18x45mm", unitPrice: 68, quantity: 6 },
    { id: "BOM-058", name: "Sprue Bushing", specification: "Hardened Steel - Standard", unitPrice: 125, quantity: 1 },
  ],
  "TN-9012": [
    { id: "BOM-059", name: "Stamping Die Assembly", specification: "Tool Steel A2 - Progressive", unitPrice: 2450, quantity: 1 },
    { id: "BOM-060", name: "Stripping Plate", specification: "Tool Steel - 240x200x22mm", unitPrice: 385, quantity: 1 },
    { id: "BOM-061", name: "Guide Pin Assembly", specification: "Hardened Steel - Ø14x140mm", unitPrice: 85, quantity: 4 },
    { id: "BOM-062", name: "Spring Set", specification: "Heavy Duty - Ø32x120mm", unitPrice: 110, quantity: 6 },
    { id: "BOM-063", name: "Stop Pin", specification: "Tungsten Carbide - Ø8x70mm", unitPrice: 155, quantity: 4 },
    { id: "BOM-064", name: "Backing Plate", specification: "Steel S45C - 220x180x30mm", unitPrice: 295, quantity: 1 },
  ],
};
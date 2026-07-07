export interface Incident {
  id: string;
  summary: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  location: string;
  reportedAt: string;
  status: "active" | "resolving" | "resolved";
  sopSteps?: string[];
  volunteerBriefing?: string;
  paAnnouncement?: string;
  reporter: string;
}

export interface Gate {
  id: string;
  name: string;
  status: "open" | "closed" | "exit-only";
  loadFactor: number; // 0 to 100
  estimatedWaitTime: number; // in minutes
}

export interface NavNode {
  id: string;
  name: string;
  level: 1 | 2;
  x: number;
  y: number;
  type: "entrance" | "section" | "amenity" | "transport";
}

export interface NavPath {
  id: string;
  from: string;
  to: string;
  points: [number, number][]; // SVG coordinates
  distanceMeters: number;
  isAccessible: boolean;
}

export interface EcoItem {
  id: string;
  name: string;
  displayName: string;
  category: "Beverage" | "Food" | "Merchandise" | "Print";
  estimatedCO2: number;
}

export interface VolunteerShift {
  id: string;
  volunteerName: string;
  zone: string;
  role: string;
  status: "on-duty" | "resting" | "completed";
  nativeLanguage: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇲🇽" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "ar", name: "العربية", flag: "🇶🇦" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" }
];

export const STADIUM_NODES: NavNode[] = [
  // Level 1 Nodes
  { id: "gate-a", name: "Gate A (Main Entrance)", level: 1, x: 100, y: 350, type: "entrance" },
  { id: "gate-b", name: "Gate B (South Entrance)", level: 1, x: 400, y: 600, type: "entrance" },
  { id: "gate-c", name: "Gate C (West Entrance)", level: 1, x: 700, y: 350, type: "entrance" },
  { id: "gate-d", name: "Gate D (North Entrance)", level: 1, x: 400, y: 100, type: "entrance" },
  { id: "train", name: "World Cup Rail Terminal", level: 1, x: 400, y: 720, type: "transport" },
  { id: "rideshare", name: "Rideshare Hub (Lot E)", level: 1, x: 820, y: 550, type: "transport" },
  { id: "section-101", name: "Section 101 Seating", level: 1, x: 250, y: 350, type: "section" },
  { id: "section-115", name: "Section 115 Seating", level: 1, x: 400, y: 480, type: "section" },
  { id: "section-130", name: "Section 130 Seating", level: 1, x: 550, y: 350, type: "section" },
  { id: "section-145", name: "Section 145 Seating", level: 1, x: 400, y: 220, type: "section" },
  { id: "green-concession-1", name: "Eco-Eats Food Court", level: 1, x: 220, y: 480, type: "amenity" },
  { id: "green-concession-2", name: "Sustainable FIFA Shop", level: 1, x: 580, y: 220, type: "amenity" },
  { id: "first-aid-1", name: "Medical Center 104", level: 1, x: 220, y: 220, type: "amenity" },
  { id: "sensory-room", name: "Quiet Sensory Room 122", level: 1, x: 580, y: 480, type: "amenity" },

  // Level 2 Nodes (Upper Tier Seating & Suites)
  { id: "section-201", name: "Section 201 (Upper Deck)", level: 2, x: 200, y: 350, type: "section" },
  { id: "section-215", name: "Section 215 (Upper Deck)", level: 2, x: 400, y: 530, type: "section" },
  { id: "section-230", name: "Section 230 (Upper Deck)", level: 2, x: 600, y: 350, type: "section" },
  { id: "section-245", name: "Section 245 (Upper Deck)", level: 2, x: 400, y: 170, type: "section" },
  { id: "first-aid-2", name: "Medical Center 228", level: 2, x: 300, y: 170, type: "amenity" },
  { id: "vip-lounge", name: "Emirates Club Lounge", level: 2, x: 500, y: 530, type: "amenity" }
];

export const ECO_ITEMS: EcoItem[] = [
  { id: "beer-can", name: "Aluminum Beer Can", displayName: "Budweiser Aluminum Can", category: "Beverage", estimatedCO2: 0.28 },
  { id: "soda-cup", name: "Compostable Soda Cup", displayName: "Fanta Compostable Cup (PLA)", category: "Beverage", estimatedCO2: 0.12 },
  { id: "burger-wrapper", name: "Greaseproof Paper Wrapper", displayName: "Stadium Burger Paper Wrapper", category: "Food", estimatedCO2: 0.05 },
  { id: "nacho-tray", name: "Molded Fiber Nacho Tray", displayName: "Recyclable Fiber Nacho Tray", category: "Food", estimatedCO2: 0.18 },
  { id: "plastic-bottle", name: "PET Plastic Soda Bottle", displayName: "Coca-Cola PET 500ml Bottle", category: "Beverage", estimatedCO2: 0.35 },
  { id: "match-ticket", name: "Paper Match Ticket Stub", displayName: "Paper Match Ticket Stub", category: "Print", estimatedCO2: 0.02 },
  { id: "souvenir-cup", name: "Reusable World Cup Souvenir Cup", displayName: "FIFA Souvenir Plastic Cup", category: "Beverage", estimatedCO2: 0.42 },
  { id: "program-guide", name: "Printed Matchday Program", displayName: "Souvenir Tournament Program Guide", category: "Print", estimatedCO2: 0.15 }
];

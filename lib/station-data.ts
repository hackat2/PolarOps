export type StationId = "maitri" | "bharati";

export const stationNames: Record<StationId, string> = {
  maitri: "Maitri",
  bharati: "Bharati",
};

export const stationFacts: Record<StationId, { region: string; lat: string; lon: string; elevation: string; opened: string }> = {
  maitri: { region: "Schirmacher Oasis", lat: "70°46′S", lon: "11°44′E", elevation: "117 m", opened: "1989" },
  bharati: { region: "Larsemann Hills", lat: "69°24′S", lon: "76°11′E", elevation: "40 m", opened: "2012" },
};

export const fuelSeries = [
  { day: "01", actual: 82, forecast: null },
  { day: "04", actual: 80, forecast: null },
  { day: "07", actual: 78, forecast: null },
  { day: "10", actual: 75, forecast: null },
  { day: "13", actual: 74, forecast: null },
  { day: "16", actual: 68, forecast: 68 },
  { day: "19", actual: null, forecast: null },
  { day: "22", actual: null, forecast: null },
  { day: "25", actual: null, forecast: null },
  { day: "28", actual: null, forecast: null },
  { day: "31", actual: null, forecast: null },
];

export const buildings = [
  { name: "Living quarters", detail: "Thermal envelope · Block A", health: 96, icon: "home", status: "Nominal" },
  { name: "Science laboratory", detail: "Atmospheric research wing", health: 92, icon: "flask", status: "Nominal" },
  { name: "Generator shed", detail: "DG-01 · 850 kVA", health: 78, icon: "zap", status: "Watch" },
  { name: "Water treatment", detail: "RO plant · Unit 02", health: 88, icon: "droplet", status: "Nominal" },
];

export const inventory = [
  { item: "Diesel fuel", category: "Energy", stock: 68, unit: "% tank", days: 42, status: "Monitor" },
  { item: "RO membranes", category: "Water systems", stock: 8, unit: "units", days: 95, status: "Healthy" },
  { item: "Generator oil", category: "Maintenance", stock: 14, unit: "drums", days: 61, status: "Healthy" },
  { item: "Medical oxygen", category: "Medical", stock: 5, unit: "cylinders", days: 28, status: "Monitor" },
];

export const maintenance = [
  { equipment: "DG-01 alternator", building: "Generator shed", due: "14 Jun", priority: "High", owner: "Power systems" },
  { equipment: "RO-02 membrane flush", building: "Water treatment", due: "18 Jun", priority: "Routine", owner: "Life support" },
  { equipment: "Air handling filter", building: "Living quarters", due: "22 Jun", priority: "Routine", owner: "Facilities" },
];

export const demoPayload = {
  station: "maitri",
  fuel: 68,
  power: 742,
  temperature: -28.4,
  anomaly: 29,
  daysRemaining: 42,
  buildings,
  inventory,
  updatedAt: Date.now(),
};

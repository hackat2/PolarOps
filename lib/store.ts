import { create } from "zustand";
import type { StationId } from "./station-data";

export type Section =
  | "Overview"
  | "Infrastructure"
  | "Energy"
  | "Logistics"
  | "Environment"
  | "Scenarios"
  | "Operations"
  | "Assistant";

export const SECTIONS: Section[] = [
  "Overview",
  "Infrastructure",
  "Energy",
  "Environment",
  "Logistics",
  "Scenarios",
  "Operations",
  "Assistant",
];

interface AppState {
  station: StationId;
  section: Section;
  forecast: number[] | null;
  forecastStatus: "training" | "ready" | "error";
  queueCount: number;
  setStation: (id: StationId) => void;
  setSection: (s: Section) => void;
  setForecast: (f: number[] | null) => void;
  setForecastStatus: (s: "training" | "ready" | "error") => void;
  setQueueCount: (n: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  station: "maitri",
  section: "Overview",
  forecast: null,
  forecastStatus: "training",
  queueCount: 0,
  setStation: (station) => set({ station }),
  setSection: (section) => set({ section }),
  setForecast: (forecast) => set({ forecast }),
  setForecastStatus: (forecastStatus) => set({ forecastStatus }),
  setQueueCount: (queueCount) => set({ queueCount }),
}));

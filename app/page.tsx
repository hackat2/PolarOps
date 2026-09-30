"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BatteryCharging,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Cloud,
  CloudSnow,
  Compass,
  Database,
  Droplets,
  FlaskConical,
  Fuel,
  Gauge,
  HardDrive,
  Home,
  Layers3,
  MessageSquare,
  Package,
  Radio,
  Send,
  Shield,
  Ship,
  Snowflake,
  Thermometer,
  WifiOff,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { StationTwin } from "@/components/station-twin";
import {
  actionQueueSize,
  clearQueuedActions,
  loadSnapshot,
  queueAction,
  saveSnapshot,
} from "@/lib/offline-db";
import {
  buildings,
  demoPayload,
  fuelSeries,
  inventory,
  maintenance,
  stationFacts,
  stationNames,
  type StationId,
} from "@/lib/station-data";
import { useAppStore, SECTIONS, type Section } from "@/lib/store";

const navItems: { label: Section; icon: typeof Home; group: "monitor" | "manage" }[] = [
  { label: "Overview", icon: Layers3, group: "monitor" },
  { label: "Infrastructure", icon: Building2, group: "monitor" },
  { label: "Energy", icon: Zap, group: "monitor" },
  { label: "Environment", icon: Cloud, group: "monitor" },
  { label: "Logistics", icon: Package, group: "manage" },
  { label: "Scenarios", icon: Activity, group: "manage" },
  { label: "Operations", icon: Wrench, group: "manage" },
  { label: "Assistant", icon: MessageSquare, group: "manage" },
];

const climateSeries = [
  { day: "01", temp: -25, wind: 31 },
  { day: "04", temp: -27, wind: 27 },
  { day: "07", temp: -24, wind: 34 },
  { day: "10", temp: -29, wind: 39 },
  { day: "13", temp: -31, wind: 36 },
  { day: "16", temp: -28, wind: 29 },
  { day: "19", temp: -26, wind: 33 },
];

const scenarioOptions = [
  { name: "Generator outage", description: "Primary DG-01 offline · backup at 70%" },
  { name: "Severe cold event", description: "Ambient temperature drops by 12°C" },
  { name: "Delayed resupply", description: "Next vessel delayed by 14 days" },
];

const sectionDescriptions: Record<Section, string> = {
  Overview: "An operations picture of the Antarctic station network.",
  Infrastructure: "Building health, structural sensors, and upcoming maintenance.",
  Energy: "Generation mix, demand profile, and local fuel outlook.",
  Logistics: "Critical stocks, days of cover, and incoming resupply.",
  Environment: "Weather observations and geophysical instrument status.",
  Scenarios: "Explore cross-domain risks and estimated operational cost impact.",
  Operations: "Personnel readiness, maintenance windows, and station activity.",
  Assistant: "Ask questions about the currently selected station snapshot.",
};

function AnimatedValue({ value }: { value: string | number }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={String(value)}
        initial={{ opacity: 0, y: 7, filter: "blur(3px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
        transition={{ duration: 0.24, ease: "easeOut" }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  foot,
  trend,
  color,
}: {
  icon: typeof Home;
  label: string;
  value: string | number;
  unit?: string;
  foot: string;
  trend?: "up" | "down" | "warn";
  color?: string;
}) {
  return (
    <motion.div
      className="metric-card"
      style={{ "--glow": color ? `${color}22` : undefined, "--metric-color": color } as React.CSSProperties}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36 }}
    >
      <div className="metric-head">
        <span>{label}</span>
        <span className="metric-icon"><Icon size={14} /></span>
      </div>
      <div className="metric-value"><AnimatedValue value={value} />{unit && <span className="metric-unit">{unit}</span>}</div>
      <div className="metric-foot">
        <span>{foot}</span>
        {trend && <span className={trend === "warn" ? "trend-warn" : "trend-up"}>{trend === "down" ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}</span>}
      </div>
    </motion.div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel panel-pad ${className}`}>
      <div className="panel-head">
        <div>
          <h2 className="panel-title">{title}</h2>
          {subtitle && <p className="panel-subtitle">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function DataTooltip({ active, payload, label }: { active?: boolean; payload?: { color?: string; name?: string; value?: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>Day {label}</strong>
      {payload.filter((item) => item.value !== null && item.value !== undefined).map((item) => (
        <div key={item.name} style={{ color: item.color }}>
          {item.name === "actual" ? "Observed" : "Forecast"} · {item.value}%
        </div>
      ))}
    </div>
  );
}

function BuildingCards({ onFocus }: { onFocus?: (name: string) => void }) {
  const icons = [Home, FlaskConical, Zap, Droplets];
  return (
    <div className="building-grid">
      {buildings.map((building, index) => {
        const Icon = icons[index];
        return (
          <motion.button
            type="button"
            key={building.name}
            className="building-card"
            onClick={() => onFocus?.(building.name)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            style={{ textAlign: "left", cursor: onFocus ? "pointer" : "default" }}
          >
            <div className="building-top">
              <span className="building-icon"><Icon size={14} /></span>
              <span className={`status ${building.status === "Watch" ? "warning" : ""}`}><span className="pulse-dot" style={building.status === "Watch" ? { background: "var(--amber)" } : undefined} />{building.status}</span>
            </div>
            <p className="building-name">{building.name}</p>
            <p className="building-detail">{building.detail}</p>
            <div className="building-health">
              <span>Health</span><div className="mini-track"><div className="mini-fill" style={{ width: `${building.health}%`, background: building.health < 80 ? "var(--amber)" : undefined }} /></div><span>{building.health}%</span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

function FuelChart({ forecast }: { forecast: number[] | null }) {
  const chartData = fuelSeries.map((point, index) => {
    if (index < 6 || !forecast) return point;
    const stepIndex = (index - 6) * 3 + 2;
    return { ...point, forecast: forecast[stepIndex] ?? null };
  });
  return (
    <div className="chart-wrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 6, right: 7, bottom: 0, left: -19 }}>
          <defs>
            <linearGradient id="fuelFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#68d7e8" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#68d7e8" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#edbd78" stopOpacity={0.11} />
              <stop offset="100%" stopColor="#edbd78" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(173,207,225,.08)" vertical={false} />
          <XAxis dataKey="day" tick={{ fill: "#7892a2", fontSize: 9 }} axisLine={false} tickLine={false} />
          <YAxis domain={[40, 90]} tick={{ fill: "#7892a2", fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
          <Tooltip content={<DataTooltip />} />
          <Area type="monotone" dataKey="actual" name="actual" stroke="#68d7e8" strokeWidth={2} fill="url(#fuelFill)" connectNulls={false} dot={false} activeDot={{ r: 4, fill: "#68d7e8", stroke: "#071a2b", strokeWidth: 2 }} />
          <Area type="monotone" dataKey="forecast" name="forecast" stroke="#edbd78" strokeWidth={2} strokeDasharray="5 5" fill="url(#forecastFill)" connectNulls strokeLinecap="round" dot={false} activeDot={{ r: 4, fill: "#edbd78", stroke: "#071a2b", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function TwinCard({ onFocus }: { onFocus: (name: string) => void }) {
  return (
    <Panel title="Station digital twin" subtitle="Interactive site overview · synthetic model" action={<button className="icon-button" title="Orbit and inspect model"><Compass size={14} /></button>} className="twin-card">
      <div style={{ marginTop: 13 }}>
        <StationTwin onFocus={onFocus} />
        <div className="twin-caption"><span>Drag to rotate · scroll to zoom · click a hotspot</span><span className="tag blue"><span className="pulse-dot" />MODEL</span></div>
      </div>
    </Panel>
  );
}

function InventoryTable({ onAction }: { onAction: (kind: string, payload: unknown) => void }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Supply</th><th>Stock</th><th>Coverage</th><th>Status</th><th /></tr></thead>
        <tbody>
          {inventory.map((item) => (
            <tr key={item.item}>
              <td><div className="table-primary">{item.item}</div><div className="table-muted">{item.category}</div></td>
              <td>{item.stock} <span style={{ color: "#718b9a" }}>{item.unit}</span></td>
              <td><div className="progress-row"><span>{item.days}d</span><div className="mini-track"><div className="mini-fill" style={{ width: `${Math.min(item.days, 100)}%` }} /></div></div></td>
              <td><span className={`tag ${item.status === "Monitor" ? "amber" : ""}`}>{item.status}</span></td>
              <td><button className="link-button" onClick={() => onAction("inventory_review", { item: item.item })}>Review <ArrowRight size={11} /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityPanel() {
  const rows = [
    { icon: Wrench, title: "DG-01 vibration inspection", sub: "Generator shed · Maintenance window", time: "08:40" },
    { icon: Radio, title: "HF radio check complete", sub: "Communications · All channels nominal", time: "07:15" },
    { icon: Package, title: "Medical stores reconciliation", sub: "Supply ledger · 2 items flagged", time: "Yesterday" },
  ];
  return (
    <Panel title="Station activity" subtitle="Recent operational updates" action={<button className="link-button">View log <ArrowRight size={11} /></button>}>
      <div className="activity-list" style={{ marginTop: 8 }}>
        {rows.map(({ icon: Icon, title, sub, time }) => (
          <div className="activity-row" key={title}>
            <span className="activity-icon"><Icon size={13} /></span>
            <div><div className="activity-main">{title}</div><div className="activity-sub">{sub}</div></div>
            <span className="activity-time">{time}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function Overview({
  onFocus,
  onNavigate,
  onAction,
  station,
  forecast,
  forecastStatus,
}: {
  onFocus: (name: string) => void;
  onNavigate: (section: Section) => void;
  onAction: (kind: string, payload: unknown) => void;
  station: StationId;
  forecast: number[] | null;
  forecastStatus: "training" | "ready" | "error";
}) {
  return (
    <>
      <div className="data-note">
        <Database size={13} />
        <span><strong>Demo data</strong> · Fuel, power, building sensors, inventory, and personnel are synthetic. NCPOR live weather is not connected.</span>
      </div>
      <div className="section-header"><h2 className="section-title">Station at a glance</h2><span className="section-meta">Last local snapshot · just now</span></div>
      <div className="metrics-grid">
        <MetricCard icon={Fuel} label="Fuel reserves" value={68} unit="%" foot="42 days at current load" trend="warn" color="#e9b873" />
        <MetricCard icon={Zap} label="Power output" value={742} unit="kW" foot="DG-01 · 2 units online" trend="up" color="#68d7e8" />
        <MetricCard icon={Thermometer} label="Ambient temperature" value="−28.4" unit="°C" foot="Synthetic demo reading" color="#9cbeef" />
        <MetricCard icon={Shield} label="Cross-domain risk" value={29} unit="/100" foot="Moderate · stable 24h" trend="down" color="#edbd78" />
      </div>
      <div className="section-header"><h2 className="section-title">Resource outlook</h2><button className="link-button" onClick={() => onNavigate("Energy")}>Energy overview <ArrowRight size={12} /></button></div>
      <div className="content-grid">
        <Panel title="Fuel reserve forecast" subtitle="Tank capacity · synthetic input · 31-day outlook" action={<span className="forecast-badge"><Activity size={11} />LSTM · ON-DEVICE</span>}>
          <div className="text-micro" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, color: "#849baa" }}><span className="pulse-dot" style={{ background: "#68d7e8" }} />Observed <span style={{ marginLeft: 9 }} className="pulse-dot" /><span className="pulse-dot" style={{ background: "#edbd78" }} />Projected</div>
          <FuelChart forecast={forecast} />
          <div className="model-foot"><span>Forecast model: <strong>LSTM, on-device inference</strong></span><span>{forecastStatus === "ready" ? "Trained in browser · synthetic histories" : forecastStatus === "training" ? "Training on synthetic histories…" : "Model unavailable · synthetic only"}</span></div>
        </Panel>
        <Panel title="Risk watch" subtitle="Scenario-weighted operational indicators">
          <div className="risk-score">
            <div className="risk-ring"><Gauge size={21} /></div>
            <div><div className="risk-number"><AnimatedValue value={29} /><span style={{ fontSize: 16, color: "#a4b7c2" }}>/100</span></div><div className="risk-label">Moderate · no critical alerts</div></div>
          </div>
          <div className="risk-list">
            <div className="risk-row"><span>Fuel continuity</span><span>34%</span><div className="risk-track"><div className="risk-fill" style={{ width: "34%" }} /></div></div>
            <div className="risk-row"><span>Extreme cold exposure</span><span>22%</span><div className="risk-track"><div className="risk-fill" style={{ width: "22%" }} /></div></div>
            <div className="risk-row"><span>Equipment availability</span><span>31%</span><div className="risk-track"><div className="risk-fill" style={{ width: "31%" }} /></div></div>
          </div>
          <div className="text-micro" style={{ marginTop: "auto", paddingTop: 18, color: "#748e9e" }}>Illustrative risk indicators · not operational guidance</div>
        </Panel>
      </div>
      <div className="section-header"><h2 className="section-title">Infrastructure health</h2><button className="link-button" onClick={() => onNavigate("Infrastructure")}>All infrastructure <ArrowRight size={12} /></button></div>
      <BuildingCards onFocus={onFocus} />
      <div className="section-header"><h2 className="section-title">Station systems</h2><span className="section-meta">{stationNames[station]} · {stationFacts[station].region}</span></div>
      <div className="content-grid">
        <TwinCard onFocus={onFocus} />
        <div style={{ display: "grid", gap: 13 }}>
          <Panel title="Critical stock cover" subtitle="Estimated days at current consumption" action={<button className="link-button" onClick={() => onNavigate("Logistics")}>Ledger <ArrowRight size={11} /></button>}>
            <div style={{ marginTop: 7 }}><InventoryTable onAction={onAction} /></div>
          </Panel>
          <ActivityPanel />
        </div>
      </div>
    </>
  );
}

function Infrastructure({ onAction }: { onAction: (kind: string, payload: unknown) => void }) {
  return (
    <>
      <div className="data-note"><Database size={13} /><span><strong>Synthetic sensor feed</strong> · Structural and equipment condition readings are illustrative demo values, not connected station sensors.</span></div>
      <div className="section-header"><h2 className="section-title">Building systems</h2><span className="section-meta">4 monitored zones</span></div>
      <BuildingCards />
      <div className="section-header"><h2 className="section-title">Maintenance calendar</h2><span className="section-meta">Next 14 days</span></div>
      <div className="section-layout">
        <Panel title="Planned maintenance" subtitle="Equipment-linked work orders">
          <div className="table-wrap" style={{ marginTop: 9 }}>
            <table className="data-table">
              <thead><tr><th>Equipment</th><th>Location</th><th>Due</th><th>Priority</th><th>Owner</th></tr></thead>
              <tbody>{maintenance.map((item) => <tr key={item.equipment}>
                <td><div className="table-primary">{item.equipment}</div></td><td>{item.building}</td><td>{item.due}</td>
                <td><span className={`tag ${item.priority === "High" ? "amber" : "blue"}`}>{item.priority}</span></td><td>{item.owner}</td>
              </tr>)}</tbody>
            </table>
          </div>
        </Panel>
        <Panel title="Structural sensor feed" subtitle="Mock readings · latest sample">
          <div className="activity-list" style={{ marginTop: 8 }}>
            {[
              ["Living quarters", "Thermal envelope delta", "0.8°C", "Nominal"],
              ["Laboratory wing", "Roof load estimate", "1.2 kPa", "Nominal"],
              ["Generator shed", "Vibration RMS", "4.7 mm/s", "Watch"],
              ["Water treatment", "Pump bearing temp.", "61°C", "Nominal"],
            ].map(([zone, metric, value, status]) => <div className="activity-row" key={zone}>
              <span className="activity-icon"><Activity size={13} /></span><div><div className="activity-main">{zone}</div><div className="activity-sub">{metric}</div></div>
              <span className={`tag ${status === "Watch" ? "amber" : ""}`}>{value}</span>
            </div>)}
          </div>
          <button className="primary-button" style={{ marginTop: 15 }} onClick={() => onAction("inspection_requested", { source: "infrastructure" })}><Wrench size={13} />Log an inspection</button>
        </Panel>
      </div>
    </>
  );
}

function Energy({ onAction, forecast, forecastStatus }: { onAction: (kind: string, payload: unknown) => void; forecast: number[] | null; forecastStatus: "training" | "ready" | "error" }) {
  return (
    <>
      <div className="data-note"><Database size={13} /><span><strong>Synthetic energy telemetry</strong> · Forecast preview uses demo weights and generated inputs; it is not a validated operational forecast.</span></div>
      <div className="metrics-grid" style={{ marginTop: 14 }}>
        <MetricCard icon={Fuel} label="Diesel reserves" value={68} unit="%" foot="~42 days remaining" trend="warn" color="#e9b873" />
        <MetricCard icon={Zap} label="DG-01 output" value={448} unit="kW" foot="53% rated capacity" color="#68d7e8" />
        <MetricCard icon={BatteryCharging} label="DG-02 output" value={294} unit="kW" foot="35% rated capacity" color="#9cbeef" />
        <MetricCard icon={CloudSnow} label="Solar contribution" value={12} unit="kW" foot="Low polar winter yield" color="#edbd78" />
      </div>
      <div className="section-header"><h2 className="section-title">Fuel depletion outlook</h2><span className="section-meta">Daily reserve · percentage of tank</span></div>
      <div className="content-grid">
        <Panel title="31-day projected reserve" subtitle="Observed values through day 16 · synthetic observations" action={<span className="forecast-badge"><Activity size={11} />LSTM · ON-DEVICE</span>}>
          <FuelChart forecast={forecast} /><div className="model-foot"><span>Forecast model: <strong>LSTM, on-device inference</strong></span><span>{forecastStatus === "ready" ? "Browser-trained on synthetic histories · not field validated" : forecastStatus === "training" ? "Training on synthetic histories…" : "Model unavailable · synthetic only"}</span></div>
        </Panel>
        <Panel title="Operational outlook" subtitle="Derived from current demo snapshot">
          <div style={{ display: "grid", gap: 13, marginTop: 18 }}>
            <div className="impact-tile"><span>Estimated days to reserve threshold</span><strong>42 days</strong></div>
            <div className="impact-tile"><span>Mean daily consumption</span><strong>1.42 kL / day</strong></div>
            <div className="impact-tile"><span>Renewable share</span><strong>1.6%</strong></div>
          </div>
          <button className="primary-button" style={{ marginTop: 15 }} onClick={() => onAction("energy_review", { source: "energy" })}><CalendarDays size={13} />Review energy plan</button>
        </Panel>
      </div>
      <div className="section-header"><h2 className="section-title">Generation mix</h2><span className="section-meta">Sampled hourly · demo telemetry</span></div>
      <Panel title="Power demand and output" subtitle="7-day profile · kW">
        <div className="chart-wrap" style={{ height: 235 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={climateSeries.map((item, i) => ({ day: item.day, demand: 680 + (i % 3) * 54, output: 742 + Math.sin(i) * 35 }))} margin={{ top: 12, right: 10, bottom: 0, left: -12 }}>
              <CartesianGrid stroke="rgba(173,207,225,.08)" vertical={false} /><XAxis dataKey="day" tick={{ fill: "#7892a2", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#7892a2", fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#102b40", border: "1px solid #29485b", borderRadius: 8, fontSize: 10 }} />
              <Line type="monotone" dataKey="output" stroke="#68d7e8" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="demand" stroke="#9cbeef" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}

function Environment() {
  return (
    <>
      <div className="data-note"><Cloud size={13} /><span><strong>NCPOR live feed not connected</strong> · The readings below are explicitly synthetic. No live weather observation is being represented.</span></div>
      <div className="metrics-grid" style={{ marginTop: 14 }}>
        <MetricCard icon={Thermometer} label="Air temperature" value="−28.4" unit="°C" foot="Synthetic demo value" color="#9cbeef" />
        <MetricCard icon={Wind} label="Wind speed" value="34" unit="km/h" foot="Synthetic demo value" color="#68d7e8" />
        <MetricCard icon={Snowflake} label="Wind chill" value="−41" unit="°C" foot="Calculated from demo values" color="#9cbeef" />
        <MetricCard icon={Droplets} label="Relative humidity" value="61" unit="%" foot="Synthetic demo value" color="#68d7e8" />
      </div>
      <div className="section-header"><h2 className="section-title">Environmental monitoring</h2><span className="section-meta">7-day sample · illustrative only</span></div>
      <div className="content-grid">
        <Panel title="Temperature and wind" subtitle="Synthetic 7-day history">
          <div className="chart-wrap" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={climateSeries} margin={{ top: 12, right: 8, bottom: 0, left: -10 }}>
                <CartesianGrid stroke="rgba(173,207,225,.08)" vertical={false} /><XAxis dataKey="day" tick={{ fill: "#7892a2", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis yAxisId="temp" tick={{ fill: "#7892a2", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis yAxisId="wind" orientation="right" tick={{ fill: "#7892a2", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#102b40", border: "1px solid #29485b", borderRadius: 8, fontSize: 10 }} />
                <Line yAxisId="temp" type="monotone" dataKey="temp" name="Temperature °C" stroke="#68d7e8" strokeWidth={2} dot={false} /><Line yAxisId="wind" type="monotone" dataKey="wind" name="Wind km/h" stroke="#edbd78" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Geophysical instruments" subtitle="Instrument categories · feed status">
          <div className="activity-list" style={{ marginTop: 8 }}>
            <div className="activity-row"><span className="activity-icon"><Compass size={13} /></span><div><div className="activity-main">Magnetic field</div><div className="activity-sub">Fluxgate magnetometer · demo status</div></div><span className="tag amber">Not connected</span></div>
            <div className="activity-row"><span className="activity-icon"><Radio size={13} /></span><div><div className="activity-main">Atmospheric electricity</div><div className="activity-sub">Field mill · demo status</div></div><span className="tag amber">Not connected</span></div>
            <div className="activity-row"><span className="activity-icon"><CloudSnow size={13} /></span><div><div className="activity-main">Weather observation</div><div className="activity-sub">NCPOR station feed</div></div><span className="tag amber">Not connected</span></div>
          </div>
          <div className="text-micro" style={{ marginTop: 15, borderTop: "1px solid var(--line)", paddingTop: 12, color: "#8199a8", lineHeight: 1.7 }}>
            Configure source endpoints before using environmental data for planning. This demo does not imply access to station instrumentation.
          </div>
        </Panel>
      </div>
    </>
  );
}

function Logistics({ onAction }: { onAction: (kind: string, payload: unknown) => void }) {
  return (
    <>
      <div className="data-note"><Database size={13} /><span><strong>Synthetic logistics ledger</strong> · Stock quantities, consumption, and vessel schedules are demo values.</span></div>
      <div className="section-header"><h2 className="section-title">Critical inventory</h2><button className="primary-button" style={{ width: "auto", padding: "8px 12px" }} onClick={() => onAction("inventory_adjustment", { source: "logistics" })}><Package size={12} />Record movement</button></div>
      <Panel title="Stock ledger" subtitle="Coverage is calculated from demo stock and assumed usage">
        <div style={{ marginTop: 7 }}><InventoryTable onAction={onAction} /></div>
      </Panel>
      <div className="section-header"><h2 className="section-title">Resupply movements</h2><span className="section-meta">Illustrative schedule · vessel tracking not connected</span></div>
      <div className="section-layout">
        <Panel title="Incoming cargo" subtitle="Mock vessel movement">
          <div className="activity-list" style={{ marginTop: 8 }}>
            <div className="activity-row"><span className="activity-icon"><Ship size={13} /></span><div><div className="activity-main">M.V. Antarctic Gateway</div><div className="activity-sub">Demo movement · approach to Lützow-Holm Bay</div></div><span className="tag blue">En route</span></div>
            <div style={{ padding: "14px 3px 4px" }}>
              <div className="progress-row text-micro" style={{ color: "#95abb8" }}><span>Voyage progress</span><span style={{ marginLeft: "auto" }}>68%</span></div>
              <div className="mini-track" style={{ marginTop: 7, height: 5 }}><div className="mini-fill" style={{ width: "68%" }} /></div>
              <div className="twin-caption"><span>Departure · Cape Town</span><span>ETA · 22 days</span></div>
            </div>
          </div>
          <button className="primary-button" style={{ marginTop: 10 }} onClick={() => onAction("resupply_review", { vessel: "M.V. Antarctic Gateway" })}><Ship size={13} />Review resupply plan</button>
        </Panel>
        <Panel title="Readiness snapshot" subtitle="Selected consumable cover">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginTop: 13 }}>
            {inventory.map((item) => <div className="impact-tile" key={item.item}><span>{item.item}</span><strong>{item.days} days</strong></div>)}
          </div>
        </Panel>
      </div>
    </>
  );
}

function Scenarios({ onAction }: { onAction: (kind: string, payload: unknown) => void }) {
  const [selected, setSelected] = useState(scenarioOptions[0].name);
  const [result, setResult] = useState<{ risk: number; cost: number; airlift: number } | null>(null);

  function runScenario() {
    const selectedIndex = scenarioOptions.findIndex((item) => item.name === selected);
    const estimates = [
      { risk: 67, cost: 18400000, airlift: 24600000 },
      { risk: 48, cost: 9600000, airlift: 17400000 },
      { risk: 79, cost: 22100000, airlift: 30200000 },
    ];
    setResult(estimates[selectedIndex] ?? estimates[0]);
    onAction("scenario_run", { scenario: selected });
  }

  return (
    <>
      <div className="data-note"><AlertTriangle size={13} /><span><strong>Illustrative scenarios only</strong> · Presets use synthetic assumptions, not SCAR/READER event records or validated station cost models.</span></div>
      <div className="section-header"><h2 className="section-title">Cross-domain scenario studio</h2><span className="section-meta">Risk · resource impact · estimated INR</span></div>
      <div className="section-layout">
        <Panel title="Configure scenario" subtitle="Adjust a station disruption to explore possible downstream impact">
          <div className="sim-controls">
            <div><label className="form-label" htmlFor="scenario-select"><span>Disruption preset</span><strong>Synthetic</strong></label>
              <select className="select-input" id="scenario-select" value={selected} onChange={(event) => { setSelected(event.target.value); setResult(null); }}>
                {scenarioOptions.map((scenario) => <option key={scenario.name}>{scenario.name}</option>)}
              </select>
              <p className="text-micro" style={{ margin: "7px 0 0", color: "#748e9e" }}>{scenarioOptions.find((item) => item.name === selected)?.description}</p>
            </div>
            <div><div className="form-label"><span>Station</span><strong>Current selection</strong></div><div className="select-input" style={{ color: "#9cb2be" }}>Selected station · demo operating conditions</div></div>
            <button className="primary-button" onClick={runScenario}><Activity size={13} />Run impact assessment</button>
          </div>
        </Panel>
        <Panel title="Estimated impact" subtitle="Illustrative outputs · not a validated cost model">
          {result ? (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="impact-grid" style={{ marginTop: 18 }}>
                <div className="impact-tile"><span>Combined risk index</span><strong><AnimatedValue value={`${result.risk}/100`} /></strong></div>
                <div className="impact-tile"><span>Mitigate / wait</span><strong><AnimatedValue value={`₹${(result.cost / 100000).toFixed(0)}L`} /></strong></div>
                <div className="impact-tile"><span>Emergency airlift</span><strong><AnimatedValue value={`₹${(result.airlift / 100000).toFixed(0)}L`} /></strong></div>
              </div>
              <div className="text-micro" style={{ marginTop: 14, border: "1px solid rgba(237,189,120,.14)", borderRadius: 8, background: "rgba(237,189,120,.04)", padding: 11, color: "#b7a17f", lineHeight: 1.7 }}>
                Scenario outputs are fixed demo estimates to demonstrate the interaction. They are not live predictions, budget advice, or approved response guidance.
              </div>
            </motion.div>
          ) : <div className="empty-state" style={{ marginTop: 16 }}>Select a disruption and run the assessment<br />to view illustrative risk and rupee impacts.</div>}
        </Panel>
      </div>
      <div className="section-header"><h2 className="section-title">Impact pathways</h2><span className="section-meta">Illustrative dependency map</span></div>
      <div className="metrics-grid">
        <MetricCard icon={Zap} label="Energy continuity" value="Elevated" foot="Generator redundancy affected" trend="warn" color="#edbd78" />
        <MetricCard icon={Home} label="Habitat systems" value="Watch" foot="Thermal loads may rise" trend="warn" color="#9cbeef" />
        <MetricCard icon={Package} label="Critical inventory" value="42 days" foot="Fuel cover at current use" color="#68d7e8" />
        <MetricCard icon={Shield} label="Response posture" value="Review" foot="Human assessment required" color="#edbd78" />
      </div>
    </>
  );
}

function Operations({ onAction }: { onAction: (kind: string, payload: unknown) => void }) {
  return (
    <>
      <div className="data-note"><Database size={13} /><span><strong>Demo operations data</strong> · Personnel roster, activity log, work orders, and movements are synthetic placeholders.</span></div>
      <div className="metrics-grid" style={{ marginTop: 14 }}>
        <MetricCard icon={Building2} label="Station personnel" value={24} foot="Synthetic roster · all accounted" color="#68d7e8" />
        <MetricCard icon={Wrench} label="Open work orders" value={3} foot="1 elevated priority" trend="warn" color="#edbd78" />
        <MetricCard icon={Radio} label="Comms systems" value="Nominal" foot="Synthetic status · 4 systems" color="#91e0c1" />
        <MetricCard icon={CalendarDays} label="Next planned window" value="14 Jun" foot="DG-01 alternator inspection" color="#9cbeef" />
      </div>
      <div className="section-header"><h2 className="section-title">Maintenance schedule</h2><button className="primary-button" style={{ width: "auto", padding: "8px 12px" }} onClick={() => onAction("work_order_created", { source: "operations" })}><Wrench size={12} />New work order</button></div>
      <Panel title="Upcoming work" subtitle="Equipment-specific maintenance windows">
        <div className="table-wrap" style={{ marginTop: 7 }}>
          <table className="data-table"><thead><tr><th>Equipment</th><th>Location</th><th>Due date</th><th>Priority</th><th>Assigned team</th></tr></thead>
            <tbody>{maintenance.map((item) => <tr key={item.equipment}><td><div className="table-primary">{item.equipment}</div></td><td>{item.building}</td><td>{item.due}</td><td><span className={`tag ${item.priority === "High" ? "amber" : "blue"}`}>{item.priority}</span></td><td>{item.owner}</td></tr>)}</tbody>
          </table>
        </div>
      </Panel>
      <div className="section-header"><h2 className="section-title">Personnel readiness</h2><span className="section-meta">Aggregate view · synthetic data</span></div>
      <div className="section-layout">
        <Panel title="Team coverage" subtitle="Role groups · fictional demo roster">
          <div className="activity-list" style={{ marginTop: 8 }}>
            {[["Station leadership", "2 assigned", "Ready"], ["Engineering & power", "7 assigned", "Ready"], ["Science & field teams", "9 assigned", "Ready"], ["Medical & logistics", "6 assigned", "Ready"]].map(([role, count, status]) => <div className="activity-row" key={role}><span className="activity-icon"><Check size={13} /></span><div><div className="activity-main">{role}</div><div className="activity-sub">{count} · fictional assignment</div></div><span className="tag">{status}</span></div>)}
          </div>
        </Panel>
        <ActivityPanel />
      </div>
    </>
  );
}

function Assistant({ station, queuedCount }: { station: StationId; queuedCount: number }) {
  const [messages, setMessages] = useState<{ role: "assistant" | "user"; text: string }[]>([
    { role: "assistant", text: `I can summarize the local ${stationNames[station]} demo snapshot. Fuel reserves are at 68% (about 42 demo days at the assumed use rate); generator output is 742 kW. These are synthetic figures, not live station telemetry.` },
  ]);
  const [input, setInput] = useState("");

  useEffect(() => {
    setMessages([{ role: "assistant", text: `I can summarize the local ${stationNames[station]} demo snapshot. Fuel reserves are at 68% (about 42 demo days at the assumed use rate); generator output is 742 kW. These are synthetic figures, not live station telemetry.` }]);
  }, [station]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const question = input.trim();
    if (!question) return;
    const normalized = question.toLowerCase();
    const response = normalized.includes("fuel") || normalized.includes("margin")
      ? "The demo reserve is 68%, with an illustrative 42 days of cover. That estimate assumes the current synthetic consumption rate; this frontend-only demo does not ingest live tank or generator telemetry."
      : normalized.includes("weather") || normalized.includes("temperature") || normalized.includes("cold")
        ? "The current environment panel shows synthetic demo conditions only. A live NCPOR observation feed has not been connected, so it should not be used as a weather report."
        : normalized.includes("offline") || normalized.includes("network")
          ? `${queuedCount} action${queuedCount === 1 ? "" : "s"} are stored locally in this browser. No API backend is configured in this frontend-only demo, so they are retained for review but cannot be sent to a server.`
          : "I can summarize fuel, energy, environment, and offline status from the current local snapshot. This demo assistant uses simple local responses; no external LLM is configured.";
    setMessages((current) => [...current, { role: "user", text: question }, { role: "assistant", text: response }]);
    setInput("");
  }

  return (
    <>
      <div className="data-note"><MessageSquare size={13} /><span><strong>Local demo assistant</strong> · Responses summarize the visible demo snapshot with simple local logic; no external LLM is configured.</span></div>
      <div className="section-header"><h2 className="section-title">Station operations assistant</h2><span className="section-meta">Grounded in cached {stationNames[station]} demo values</span></div>
      <div className="section-layout">
        <Panel title="Ask about the station" subtitle="No network request is made from this chat">
          <div className="chat-box">
            <div className="chat-messages">
              {messages.map((message, index) => (
                <motion.div key={`${index}-${message.role}`} className={`chat-message ${message.role === "user" ? "user" : ""}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                  {message.text}
                </motion.div>
              ))}
            </div>
            <form className="chat-input-row" onSubmit={submit}>
              <input className="chat-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Ask about fuel, cold, or offline status…" aria-label="Ask a question" />
              <button className="send-button" type="submit" aria-label="Send message"><Send size={14} /></button>
            </form>
          </div>
        </Panel>
        <Panel title="Local snapshot context" subtitle="Cached in browser storage">
          <div className="activity-list" style={{ marginTop: 8 }}>
            <div className="activity-row"><span className="activity-icon"><Fuel size={13} /></span><div><div className="activity-main">Diesel reserve</div><div className="activity-sub">Synthetic demo metric</div></div><span className="tag amber">68%</span></div>
            <div className="activity-row"><span className="activity-icon"><Zap size={13} /></span><div><div className="activity-main">Power generation</div><div className="activity-sub">Synthetic demo metric</div></div><span className="tag blue">742 kW</span></div>
            <div className="activity-row"><span className="activity-icon"><Thermometer size={13} /></span><div><div className="activity-main">Temperature</div><div className="activity-sub">Synthetic demo metric</div></div><span className="tag blue">−28.4°C</span></div>
            <div className="activity-row"><span className="activity-icon"><HardDrive size={13} /></span><div><div className="activity-main">Pending local actions</div><div className="activity-sub">Not yet sent to a server</div></div><span className="tag">{queuedCount}</span></div>
          </div>
          <div className="text-micro" style={{ marginTop: 13, color: "#748e9e", lineHeight: 1.65 }}>Connect a secured LLM API and station data service to enable natural-language analysis beyond this local demo.</div>
        </Panel>
      </div>
    </>
  );
}

export default function HomePage() {
  const {
    station, setStation,
    section, setSection,
    forecast, setForecast,
    forecastStatus, setForecastStatus,
    queueCount, setQueueCount,
  } = useAppStore();
  const [online, setOnline] = useState(true);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const [swReady, setSwReady] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> } | null>(null);
  const [clock, setClock] = useState("");

  const facts = stationFacts[station];
  const titleForSection = section === "Overview" ? `${stationNames[station]} Station` : section;
  const savedTime = useMemo(() => lastSaved ? new Date(lastSaved).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "UTC", timeZoneName: "short" }) : "Loading local cache…", [lastSaved]);

  const refreshQueueCount = useCallback(async () => {
    const count = await actionQueueSize();
    setQueueCount(count);
  }, [setQueueCount]);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (SECTIONS.includes(hash as Section)) {
        setSection(hash as Section);
      }
    };
    if (window.location.hash) {
      onHashChange();
    } else {
      window.location.hash = section;
    }
    window.addEventListener("hashchange", onHashChange);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const key = parseInt(e.key, 10);
      if (!isNaN(key) && key >= 1 && key <= 8) {
        const targetSection = SECTIONS[key - 1];
        if (targetSection) {
          setSection(targetSection);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [setSection]);

  useEffect(() => {
    if (window.location.hash.replace("#", "") !== section) {
      window.location.hash = section;
    }
  }, [section]);

  useEffect(() => {
    setOnline(navigator.onLine);
    void refreshQueueCount();
    void loadSnapshot<typeof demoPayload>().then((snapshot) => {
      if (snapshot) setLastSaved(snapshot.savedAt);
    }).catch((error: unknown) => {
      console.error("Could not read the local station snapshot.", error);
      setToast("Local cache could not be read. Check browser storage permissions.");
    });

    const syncNetworkState = () => {
      setOnline(navigator.onLine);
      void refreshQueueCount();
      if (navigator.onLine) setToast("Connection restored. Local actions remain queued for server sync.");
    };
    window.addEventListener("online", syncNetworkState);
    window.addEventListener("offline", syncNetworkState);
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as Event & { prompt?: () => Promise<void>; userChoice?: Promise<{ outcome: string }> });
    };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js")
        .then(() => setSwReady(true))
        .catch((error: unknown) => {
          console.error("Service worker registration failed.", error);
          setToast("Offline app shell could not be registered on this browser.");
        });
    }
    const timer = window.setInterval(() => {
      setClock(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }));
    }, 30_000);
    setClock(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }));
    return () => {
      window.removeEventListener("online", syncNetworkState);
      window.removeEventListener("offline", syncNetworkState);
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.clearInterval(timer);
    };
  }, [refreshQueueCount]);

  useEffect(() => {
    const payload = { ...demoPayload, station, updatedAt: Date.now() };
    void saveSnapshot(payload).then(() => setLastSaved(Date.now())).catch((error: unknown) => {
      console.error("Could not save the local station snapshot.", error);
      setToast("Station snapshot could not be saved to browser storage.");
    });
  }, [station]);

  useEffect(() => {
    let cancelled = false;
    setForecastStatus("training");
    void import("@/lib/client-forecast")
      .then(({ trainAndForecast }) => trainAndForecast(demoPayload.fuel))
      .then((values) => {
        if (!cancelled) {
          setForecast(values);
          setForecastStatus("ready");
        }
      })
      .catch((error: unknown) => {
        console.error("On-device LSTM training or inference failed.", error);
        if (!cancelled) setForecastStatus("error");
      });
    return () => { cancelled = true; };
  }, [station]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const recordAction = useCallback(async (kind: string, payload: unknown) => {
    await queueAction(kind, { ...((payload && typeof payload === "object") ? payload : { value: payload }), station });
    await refreshQueueCount();
    setToast("Action saved on this device. Server sync requires the API service.");
  }, [refreshQueueCount, station]);

  function focusPanel(name: string) {
    if (name.toLowerCase().includes("generator")) setSection("Energy");
    else if (name.toLowerCase().includes("fuel")) setSection("Logistics");
    else if (name.toLowerCase().includes("comm")) setSection("Environment");
    else setSection("Infrastructure");
  }

  async function installApp() {
    if (!installPrompt?.prompt) return;
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    if (result?.outcome === "accepted") setToast("Polar Ops added to your device.");
    setInstallPrompt(null);
  }

  async function clearLocalQueue() {
    await clearQueuedActions();
    await refreshQueueCount();
    setToast("Local action queue cleared.");
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><Snowflake size={18} /></span>
          <div className="brand-copy"><div className="brand-name">polar<span style={{ color: "var(--cyan)" }}>ops</span></div><div className="brand-caption">Antarctic digital twin</div></div>
        </div>
        <div className="nav-label">Monitor</div>
        <nav className="nav-list" aria-label="Station dashboard">
          {navItems.filter((item) => item.group === "monitor").map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-button ${section === label ? "active" : ""}`} onClick={() => setSection(label)} title={label}>
              <Icon size={16} strokeWidth={1.8} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="nav-label" style={{ marginTop: 24 }}>Manage</div>
        <nav className="nav-list" aria-label="Station operations">
          {navItems.filter((item) => item.group === "manage").map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-button ${section === label ? "active" : ""}`} onClick={() => setSection(label)} title={label}>
              <Icon size={16} strokeWidth={1.8} /><span>{label}</span>{label === "Operations" && <span className="nav-count">03</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="station-card">
            <div className="station-card-head"><span>Station network</span><span className="station-live"><span className="pulse-dot" />2 stations</span></div>
            <div className="station-switch">
              {(Object.keys(stationNames) as StationId[]).map((id) => <button key={id} className={station === id ? "selected" : ""} onClick={() => setStation(id)}>{stationNames[id]}</button>)}
            </div>
          </div>
          <div className="profile"><span className="avatar">AR</span><div className="profile-copy"><div className="profile-name">A. Researcher</div><div className="profile-role">Station operations</div></div><ChevronDown size={13} style={{ marginLeft: "auto", color: "#718b9b" }} /></div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="crumb"><span>Station network</span><span style={{ margin: "0 8px", color: "#456274" }}>/</span><strong>{titleForSection}</strong></div>
          <div className="topbar-right">
            <div className="utc"><Radio size={12} /> {clock || "—"} UTC <span style={{ color: "#506c7d" }}>·</span> {facts.lat}, {facts.lon}</div>
            <button className="icon-button" title="Help and information" onClick={() => setToast("Polar Ops demo · local operations twin")}><CircleHelp size={14} /></button>
            <button className="icon-button" title="Notifications" onClick={() => setSection("Operations")}><Bell size={14} /></button>
            <div className={`offline-pill ${online ? "" : "offline"}`}><span className="pulse-dot" style={online ? undefined : { background: "var(--amber)" }} />{online ? "ONLINE" : "LOCAL EDGE MODE"}</div>
          </div>
        </header>
        <div className="content">
          {!online && <motion.div className="offline-banner" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}><div><WifiOff size={13} style={{ marginRight: 7, verticalAlign: "middle" }} /><strong>Local Edge Mode</strong><span> · Serving this cached app shell and browser snapshot; on-device charts continue to work.</span></div><span>{queueCount} queued</span></motion.div>}
          <div className="page-heading">
            <div><div className="eyebrow">Indian Antarctic Programme · {stationNames[station]}</div><h1>{titleForSection}</h1><p className="subtitle">{sectionDescriptions[section]}</p></div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {installPrompt && <button className="primary-button" style={{ width: "auto", padding: "8px 10px" }} onClick={() => void installApp()}><HardDrive size={12} />Install app</button>}
              <div className="date-chip"><CalendarDays size={13} />{facts.region}<span style={{ color: "#607b8c" }}>·</span> Est. {facts.opened}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
            {!online && <span className="tag amber"><WifiOff size={10} />Network disconnected</span>}
            <span className="tag blue"><HardDrive size={10} />{swReady ? "App shell cached" : "Preparing offline cache"}</span>
            <span className="tag"><Database size={10} />Local snapshot · {savedTime}</span>
            {queueCount > 0 && <button className="tag amber" onClick={() => void clearLocalQueue()} title="Clear local-only queued actions">{queueCount} local actions · clear</button>}
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={`${section}-${station}`} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.22 }}>
              {section === "Overview" && <Overview station={station} forecast={forecast} forecastStatus={forecastStatus} onFocus={focusPanel} onNavigate={setSection} onAction={(kind, payload) => void recordAction(kind, payload)} />}
              {section === "Infrastructure" && <Infrastructure onAction={(kind, payload) => void recordAction(kind, payload)} />}
              {section === "Energy" && <Energy forecast={forecast} forecastStatus={forecastStatus} onAction={(kind, payload) => void recordAction(kind, payload)} />}
              {section === "Logistics" && <Logistics onAction={(kind, payload) => void recordAction(kind, payload)} />}
              {section === "Environment" && <Environment />}
              {section === "Scenarios" && <Scenarios onAction={(kind, payload) => void recordAction(kind, payload)} />}
              {section === "Operations" && <Operations onAction={(kind, payload) => void recordAction(kind, payload)} />}
              {section === "Assistant" && <Assistant station={station} queuedCount={queueCount} />}
            </motion.div>
          </AnimatePresence>
          <footer className="text-micro" style={{ display: "flex", justifyContent: "space-between", gap: 15, marginTop: 24, borderTop: "1px solid var(--line)", paddingTop: 13, color: "#607b8a" }}>
            <span>Polar Ops · SIH 2026 · SIH26060</span><span>{online ? "Actions remain local until a backend is configured" : "Offline: locally stored snapshot · no server connection"}</span>
          </footer>
        </div>
      </main>
      <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 7 }}>{toast}</motion.div>}</AnimatePresence>
    </div>
  );
}

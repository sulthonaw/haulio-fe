export type TrafficLevel = "jammed" | "slow" | "free";

export interface Traffic {
  level: TrafficLevel;
  label: string;
  color?: "red" | "yellow" | "blue";
  source: string;
}

export interface Truck {
  id: string;
  name: string;
  vehicle_type: string;
  capacity_kg: number;
  fuel_pct: number;
  status: string;
  position: { name: string; lat: number; lon: number };
  traffic: Traffic;
  empty_return_risk: { probability: number; level: "low" | "medium" | "high"; reasons: string[] };
  eta: { eta_min: number; label: string };
  anomaly: { status: "normal" | "warning" | "critical"; score: number; signals: string[] };
}

export interface Recommendation {
  id: string;
  truck_id: string;
  truck_name: string;
  order_ids: string[];
  cargo_summary: string;
  is_multi_hop: boolean;
  capacity_pct: number;
  expected_empty_location: string;
  eta_final_delivery_min: number;
  distance_km: number;
  expected_margin_idr: number;
  margin_pct: number;
  minimum_viable_quote_idr: number;
  suggested_quote_idr: number;
  confidence: number;
  explanation: string[];
  status: "proposed" | "accepted" | "rejected";
}

export interface RouteOption {
  id: string;
  rank: number;
  kind: "recommended" | "alternative" | "fallback";
  label: string;
  coordinates: [number, number][];
  distance_km: number;
  static_eta_min: number;
  eta_p50_min: number;
  eta_p90_min: number;
  traffic: Traffic;
}

export interface Stop {
  kind: string;
  name: string;
  lat: number;
  lon: number;
  cargo?: string;
}

export interface RouteOptions {
  plan_id: string;
  truck_id: string;
  route_source: string;
  routes: RouteOption[];
  stops: Stop[];
  traffic_disclaimer: string;
}

export interface RegionProperties {
  name: string;
  truck_count: number;
  log_count: number;
  activity: number;
  activity_level: "high" | "medium" | "low" | "none";
  traffic: Record<TrafficLevel, number>;
}

export interface Regions {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: RegionProperties;
    geometry: GeoJSON.GeoJsonObject;
  }>;
  meta: { boundary_source: string; color_metric: string };
}

export interface Metrics {
  fleet_total: number;
  fleet_at_empty_risk: number;
  open_orders: number;
  recommendation_count: number;
  recoverable_margin_idr: number;
  google_routes_configured: boolean;
}

export interface GoogleTrafficResult {
  available: boolean;
  provider?: string;
  live_eta_min?: number;
  static_eta_min?: number;
  traffic_delay_min?: number;
  notice?: string;
  error?: string;
}

export function minutes(value: number): string {
  if (value <= 0) return "Now";
  const hours = Math.floor(value / 60);
  const remaining = value % 60;
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`;
}

export function rupiah(value: number): string {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)}m`;
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

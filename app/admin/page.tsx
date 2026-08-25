"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { Activity, Check, ChevronRight, CircleAlert, Container, MapPinned, Menu, RefreshCw, Truck, X } from "lucide-react";
import type { GoogleTrafficResult, Metrics, Recommendation, Regions, RouteOption, RouteOptions, TrafficLevel, Truck as TruckData } from "@/lib/operations";
import { minutes, rupiah } from "@/lib/operations";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const OperationsMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-semibold text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Loading Indonesia operations map…</div>,
});

type SidebarTab = "fleet" | "cargo" | "regions";
const TRAFFIC_COLOR: Record<TrafficLevel, string> = { jammed: "#e5484d", slow: "#eab308", free: "#2563eb" };

function trafficName(level: TrafficLevel): string {
  return level === "jammed" ? "Heavy jam" : level === "slow" ? "Moderate" : "Free flow";
}

function errorMessage(payload: unknown, fallback: string): string {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : fallback;
}

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { ...init, headers: { Accept: "application/json", "Content-Type": "application/json", ...init.headers }, cache: "no-store" });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error(errorMessage(payload, `Request failed (${response.status})`));
  return payload as T;
}

function TrafficBadge({ level }: { level: TrafficLevel }) {
  return <span className="inline-flex items-center whitespace-nowrap text-[11px] font-bold text-slate-500"><i className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: TRAFFIC_COLOR[level] }} />{trafficName(level)}</span>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg bg-slate-50 px-2.5 py-2"><span className="block text-[10px] font-bold text-slate-500">{label}</span><strong className="mt-0.5 block text-sm tracking-tight text-slate-900">{value}</strong></div>;
}

export default function Home() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [fleet, setFleet] = useState<TruckData[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [regions, setRegions] = useState<Regions | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [routeOptions, setRouteOptions] = useState<RouteOptions | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SidebarTab>("fleet");
  const [focusRegion, setFocusRegion] = useState<string | null>(null);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [trafficResult, setTrafficResult] = useState<GoogleTrafficResult | null>(null);
  const [checkingTraffic, setCheckingTraffic] = useState(false);
  const requestPlanRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const [nextMetrics, nextFleet, nextRecommendations, nextRegions] = await Promise.all([
        api<Metrics>("/metrics"),
        api<{ fleet: TruckData[] }>("/fleet"),
        api<{ recommendations: Recommendation[] }>("/recommendations"),
        api<Regions>("/regions"),
      ]);
      setMetrics(nextMetrics);
      setFleet(nextFleet.fleet);
      setRecommendations(nextRecommendations.recommendations);
      setRegions(nextRegions);
      setSelectedPlanId((current) => nextRecommendations.recommendations.some((plan) => plan.id === current) ? current : null);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not load the operations map.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const selectPlan = useCallback(async (planId: string) => {
    requestPlanRef.current = planId;
    setSelectedPlanId(planId);
    setRouteOptions(null);
    setSelectedRouteId(null);
    setTrafficResult(null);
    try {
      const nextRoutes = await api<RouteOptions>(`/recommendations/${encodeURIComponent(planId)}/route-options`);
      if (requestPlanRef.current !== planId) return;
      setRouteOptions(nextRoutes);
      setSelectedRouteId(nextRoutes.routes[0]?.id ?? null);
    } catch (error) {
      if (requestPlanRef.current === planId) setNotice(error instanceof Error ? error.message : "Road routes are unavailable.");
    }
  }, []);

  const inspectPlan = useCallback((planId: string) => { void selectPlan(planId); }, [selectPlan]);
  const chooseRoute = useCallback((route: RouteOption) => setSelectedRouteId(route.id), []);

  const runSimulation = useCallback(async () => {
    try {
      const result = await api<{ events: Array<{ accepted?: boolean }>; highlight_plan_id?: string | null }>("/simulation/tick", { method: "POST", body: "{}" });
      await refresh();
      if (result.highlight_plan_id) await selectPlan(result.highlight_plan_id);
      setNotice(`${result.events.filter((event) => event.accepted).length} trucks advanced. Showing a simulated live-traffic route.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Simulation update failed.");
    }
  }, [refresh, selectPlan]);

  const decide = useCallback(async (action: "accept" | "reject") => {
    if (!selectedPlanId) return;
    try {
      await api(`/recommendations/${encodeURIComponent(selectedPlanId)}/decision`, { method: "POST", body: JSON.stringify({ action }) });
      setNotice(`Plan ${action}ed by dispatcher.`);
      if (action === "reject") {
        requestPlanRef.current = null;
        setSelectedPlanId(null);
        setRouteOptions(null);
        setSelectedRouteId(null);
      }
      await refresh();
      if (action === "accept") void selectPlan(selectedPlanId);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Decision could not be saved.");
    }
  }, [refresh, selectPlan, selectedPlanId]);

  const checkGoogleTraffic = useCallback(async () => {
    if (!selectedPlanId) return;
    setCheckingTraffic(true);
    setTrafficResult(null);
    try {
      setTrafficResult(await api<GoogleTrafficResult>(`/recommendations/${encodeURIComponent(selectedPlanId)}/live-traffic`));
    } catch (error) {
      setTrafficResult({ available: false, error: error instanceof Error ? error.message : "Live traffic check failed." });
    } finally {
      setCheckingTraffic(false);
    }
  }, [selectedPlanId]);

  const selectedPlan = recommendations.find((plan) => plan.id === selectedPlanId) ?? null;
  const selectedRoute = routeOptions?.routes.find((route) => route.id === selectedRouteId) ?? routeOptions?.routes[0] ?? null;

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900">
      <OperationsMap regions={regions} fleet={fleet} recommendations={recommendations} selectedPlan={selectedPlan} routeOptions={routeOptions} focusRegion={focusRegion} onPlanSelect={inspectPlan} onRouteSelect={chooseRoute} />

      <header className="pointer-events-none fixed left-4 right-4 top-4 z-[1000] flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLeftOpen((current) => !current)}
          aria-label="Open operations list"
          aria-expanded={leftOpen}
          className="pointer-events-auto grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-md shadow-slate-900/10 hover:bg-slate-50 cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-md shadow-slate-900/10 backdrop-blur">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-[#041E41] p-1 shrink-0">
            <Image
              src="/logo-white.png"
              alt="Haulio Logo"
              width={24}
              height={24}
              className="h-auto w-full object-contain"
            />
          </div>
          <div><h1 className="text-sm font-extrabold tracking-tight leading-none">Haulio Control Center</h1><p className="text-[10px] font-semibold text-slate-500 mt-0.5">Indonesia backhaul operations</p></div>
        </div>
        <div className="flex-1" />
        <Link href="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-auto hidden sm:inline-flex bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm")}>Driver view</Link>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "pointer-events-auto hidden sm:inline-flex bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm")}>AI dashboard</Link>
        <span className="hidden rounded-full border border-slate-200 bg-white/95 px-3 py-2 text-[11px] font-bold text-slate-500 shadow-sm backdrop-blur sm:block">{routeOptions?.route_source ?? "Indonesia activity map"}</span>
        <Button
          onClick={() => void runSimulation()}
          className="pointer-events-auto hidden items-center gap-1.5 rounded-lg bg-blue-600 px-3 h-9 text-xs font-bold text-white shadow-md hover:bg-blue-700 sm:flex cursor-pointer"
        >
          <Activity className="h-3.5 w-3.5" /> Simulate live traffic
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => void refresh()}
          aria-label="Refresh dashboard"
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-md hover:bg-slate-50 cursor-pointer"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
        </Button>
      </header>

      <aside className={`fixed bottom-0 left-0 top-0 z-[1100] w-[min(390px,calc(100vw-24px))] overflow-y-auto border-r border-slate-200 bg-white shadow-2xl shadow-slate-900/20 transition-transform duration-200 ${leftOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-start justify-between border-b border-slate-100 px-5 pb-4 pt-6">
          <div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Dispatcher view</p><h2 className="mt-1 text-lg font-extrabold tracking-tight">Operations list</h2></div>
          <Button variant="outline" size="icon" onClick={() => setLeftOpen(false)} aria-label="Close operations list" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"><X className="h-4 w-4" /></Button>
        </div>
        <div className="grid grid-cols-3 gap-2 px-4 py-4"><Metric label="Fleet" value={metrics?.fleet_total ?? "—"} /><Metric label="At risk" value={metrics?.fleet_at_empty_risk ?? "—"} /><Metric label="Open cargo" value={metrics?.open_orders ?? "—"} /></div>
        <div className="mx-4 grid grid-cols-3 rounded-lg bg-slate-100 p-1">
          {([["fleet", "Fleet", Truck], ["cargo", "Cargo", Container], ["regions", "Regions", MapPinned]] as const).map(([tab, label, Icon]) => (
            <Button
              key={tab}
              variant="ghost"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex items-center justify-center gap-1 rounded-md px-1 py-2 text-[11px] font-bold transition h-8 cursor-pointer border-0",
                activeTab === tab ? "bg-white text-blue-700 shadow-sm hover:bg-white hover:text-blue-700" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </Button>
          ))}
        </div>

        <div className="px-3 pb-6 pt-3">
          {activeTab === "fleet" && <><p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Telemetry-backed truck positions</p>{fleet.map((truck) => {
            const plan = recommendations.find((item) => item.truck_id === truck.id);
            return <button key={truck.id} type="button" disabled={!plan} onClick={() => plan && inspectPlan(plan.id)} className={`mb-1.5 w-full rounded-lg border p-3 text-left transition ${plan?.id === selectedPlanId ? "border-blue-200 bg-blue-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50"} disabled:cursor-default disabled:hover:border-transparent disabled:hover:bg-transparent`}>
              <span className="flex items-start justify-between gap-3"><strong className="text-xs">{truck.name}</strong><TrafficBadge level={truck.traffic.level} /></span>
              <span className="mt-1.5 block text-[11px] leading-relaxed text-slate-500">{truck.position.name} · {Math.round(truck.fuel_pct)}% fuel<br /><b className={truck.empty_return_risk.level === "high" ? "text-red-600" : truck.empty_return_risk.level === "medium" ? "text-amber-600" : "text-emerald-600"}>{Math.round(truck.empty_return_risk.probability * 100)}% empty-return risk</b></span>
            </button>;
          })}</>}
          {activeTab === "cargo" && <><p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Ranked backhaul plans</p>{recommendations.map((plan) => <button key={plan.id} type="button" onClick={() => inspectPlan(plan.id)} className={`mb-1.5 w-full rounded-lg border p-3 text-left transition ${plan.id === selectedPlanId ? "border-blue-200 bg-blue-50" : "border-transparent hover:border-slate-200 hover:bg-slate-50"}`}><span className="flex items-start justify-between gap-2"><strong className="text-xs leading-snug">{plan.is_multi_hop ? "Multi-hop · " : ""}{plan.cargo_summary}</strong><b className="whitespace-nowrap text-[11px] text-blue-700">{rupiah(plan.expected_margin_idr)}</b></span><span className="mt-1.5 block text-[11px] text-slate-500">{plan.truck_name} · {plan.distance_km} km · {minutes(plan.eta_final_delivery_min)} ETA</span></button>)}</>}
          {activeTab === "regions" && <><p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Operating-area activity</p>{[...(regions?.features ?? [])].sort((a, b) => b.properties.activity - a.properties.activity).map((region) => <button key={region.properties.name} type="button" onClick={() => setFocusRegion(region.properties.name)} className="mb-1.5 w-full rounded-lg border border-transparent p-3 text-left transition hover:border-slate-200 hover:bg-slate-50"><span className="flex items-start justify-between gap-2"><strong className="text-xs">{region.properties.name}</strong><b className="text-[11px] text-blue-700">{region.properties.truck_count} truck(s)</b></span><span className="mt-1.5 block text-[11px] text-slate-500">{region.properties.log_count} telemetry logs · {region.properties.traffic.jammed} jammed / {region.properties.traffic.slow} moderate / {region.properties.traffic.free} free</span></button>)}</>}
        </div>
      </aside>

      <section className="pointer-events-none fixed bottom-5 right-5 z-[900] hidden w-44 rounded-xl border border-slate-200 bg-white/95 p-3 text-[11px] font-semibold leading-6 text-slate-500 shadow-lg backdrop-blur sm:block">
        <strong className="block text-slate-800">Traffic & activity</strong>
        <span className="flex items-center"><i className="mr-2 h-2 w-2 rounded-full bg-red-500" />Red · heavy jam</span><span className="flex items-center"><i className="mr-2 h-2 w-2 rounded-full bg-yellow-400" />Yellow · moderate</span><span className="flex items-center"><i className="mr-2 h-2 w-2 rounded-full bg-blue-600" />Blue · free flow</span><hr className="my-2 border-slate-200" /><p className="leading-4">Circular activity zones combine current trucks and telemetry logs. Zoom in for individual trucks.</p>
      </section>

      {selectedPlan && <section className="fixed bottom-5 left-5 z-[900] w-[min(390px,calc(100vw-40px))] rounded-xl border border-slate-200 bg-white/95 p-4 shadow-xl shadow-slate-900/15 backdrop-blur">
        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-600">{selectedPlan.status === "accepted" ? "Dispatcher-approved plan" : "Recommended backhaul"}</p><h2 className="mt-1 text-sm font-extrabold leading-snug">{selectedPlan.cargo_summary}</h2>
        <p className="mt-1 text-[11px] text-slate-500">{selectedPlan.truck_name} · {selectedRoute?.distance_km ?? selectedPlan.distance_km} km {selectedRoute && <><span className="px-1">·</span><TrafficBadge level={selectedRoute.traffic.level} /></>}</p>
        <div className="mt-3 grid grid-cols-3 gap-2"><Metric label="P50 ETA" value={selectedRoute ? minutes(selectedRoute.eta_p50_min) : minutes(selectedPlan.eta_final_delivery_min)} /><Metric label="Margin" value={rupiah(selectedPlan.expected_margin_idr)} /><Metric label="Routes" value={routeOptions?.routes.length ?? "…"} /></div>
        <div className="mt-3 flex justify-end gap-2">
          {selectedPlan.status === "proposed" && (
            <Button variant="outline" size="sm" onClick={() => void decide("reject")} className="rounded-lg border border-slate-200 px-3 h-8 text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer">
              Reject
            </Button>
          )}
          {selectedPlan.status === "proposed" && (
            <Button size="sm" onClick={() => void decide("accept")} className="rounded-lg bg-blue-600 px-3 h-8 text-[11px] font-bold text-white hover:bg-blue-700 cursor-pointer">
              <Check className="mr-1 inline h-3.5 w-3.5" />Accept
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setRightOpen(true)} className="rounded-lg border border-slate-200 px-3 h-8 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
            Show more
          </Button>
        </div>
      </section>}

      <aside className={`fixed bottom-0 right-0 top-0 z-[1100] w-[min(410px,calc(100vw-24px))] overflow-y-auto border-l border-slate-200 bg-white shadow-2xl shadow-slate-900/20 transition-transform duration-200 ${rightOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-start justify-between border-b border-slate-100 px-5 pb-4 pt-6"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Route intelligence</p><h2 className="mt-1 text-lg font-extrabold tracking-tight">{selectedPlan?.truck_name ?? "No route selected"}</h2></div><Button variant="outline" size="icon" onClick={() => setRightOpen(false)} aria-label="Close route detail" className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"><X className="h-4 w-4" /></Button></div>
        <div className="space-y-5 p-5">
          {!selectedPlan || !routeOptions ? <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-slate-600"><strong className="block text-slate-900">No route selected</strong><span className="mt-1 block text-xs">Select a truck or cargo plan from the operations list.</span></div> : <>
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4"><strong className="block text-sm">{selectedPlan.cargo_summary}</strong><span className="mt-1 block text-xs text-slate-500">{routeOptions.route_source}</span></div>
            <div><h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Road-route options</h3><div className="space-y-2">{routeOptions.routes.map((route) => <button key={route.id} type="button" onClick={() => setSelectedRouteId(route.id)} className={`w-full rounded-xl border p-3 text-left transition ${route.rank === 1 ? "border-blue-200 bg-blue-50/70" : "border-slate-200 bg-slate-50 opacity-80 hover:opacity-100"} ${selectedRouteId === route.id ? "ring-2 ring-blue-100" : ""}`}><span className="flex items-start justify-between gap-2"><strong className="text-xs">{route.label}</strong><TrafficBadge level={route.traffic.level} /></span><span className="mt-1.5 block text-[11px] leading-relaxed text-slate-500">{route.traffic.source}</span><span className="mt-2 flex gap-3 text-[11px] font-bold text-slate-700"><span>{route.distance_km} km</span><span>P50 {minutes(route.eta_p50_min)}</span><span>P90 {minutes(route.eta_p90_min)}</span></span></button>)}</div><p className="mt-2 text-[10px] leading-relaxed text-slate-400">{routeOptions.traffic_disclaimer}</p></div>
            <div><h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Economics & confidence</h3><div className="grid grid-cols-2 gap-2"><Metric label="Expected margin" value={rupiah(selectedPlan.expected_margin_idr)} /><Metric label="Minimum quote" value={rupiah(selectedPlan.minimum_viable_quote_idr)} /><Metric label="Capacity" value={`${selectedPlan.capacity_pct}%`} /><Metric label="Confidence" value={`${Math.round(selectedPlan.confidence * 100)}%`} /></div></div>
            <div><h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Google live traffic</h3><Button disabled={checkingTraffic} onClick={() => void checkGoogleTraffic()} className="w-full rounded-lg bg-blue-600 px-3 h-9 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 cursor-pointer">{checkingTraffic ? "Checking Google traffic…" : "Check Google live traffic"}</Button><p className={`mt-2 rounded-lg p-3 text-[11px] leading-relaxed ${trafficResult?.error ? "bg-red-50 text-red-700" : "bg-slate-50 text-slate-500"}`}>{trafficResult?.available && trafficResult.live_eta_min !== undefined ? `${trafficResult.provider}: live ETA ${minutes(trafficResult.live_eta_min)}; baseline ${minutes(trafficResult.static_eta_min ?? 0)}; ${trafficResult.traffic_delay_min ?? 0} minute(s) traffic delay. ${trafficResult.notice ?? ""}` : trafficResult?.error ?? "On-demand dispatcher confirmation only. Google traffic is not retained for model training."}</p></div>
            <div><h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Stops</h3><div className="space-y-2">{routeOptions.stops.map((stop) => <div key={`${stop.kind}-${stop.name}`} className="border-l-4 border-blue-600 bg-slate-50 px-3 py-2"><strong className="block text-[10px] uppercase tracking-wider text-blue-700">{stop.kind.replaceAll("_", " ")}</strong><span className="mt-0.5 block text-xs text-slate-600">{stop.name}{stop.cargo ? ` · ${stop.cargo}` : ""}</span></div>)}</div></div>
            <div><h3 className="mb-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">Why this match</h3><ul className="space-y-1.5">{selectedPlan.explanation.map((reason) => <li key={reason} className="flex gap-2 text-xs leading-relaxed text-slate-600"><ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />{reason}</li>)}</ul></div>
          </>}
        </div>
      </aside>

      {loading && <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[1200] mx-auto w-fit rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg">Loading DS/BE operations data…</div>}
      {notice && <div className="fixed bottom-5 right-5 z-[3000] flex max-w-sm items-start gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold leading-relaxed text-white shadow-xl"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-blue-300" />{notice}</div>}
    </main>
  );
}

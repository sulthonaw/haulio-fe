"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Bell, CheckCircle2, CircleAlert, Clock3, MapPin, PackageCheck, RefreshCw, Route, ShieldCheck, Truck } from "lucide-react";
import type { Recommendation, RouteOptions, Truck as TruckData } from "@/lib/operations";
import { minutes } from "@/lib/operations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type LoadState = {
  plan: Recommendation | null;
  truck: TruckData | null;
  route: RouteOptions | null;
};

function messageFrom(payload: unknown, fallback: string): string {
  return typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string" ? payload.error : fallback;
}

async function api<T>(path: string): Promise<T> {
  const response = await fetch("/api/v1" + path, { headers: { Accept: "application/json" }, cache: "no-store" });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error(messageFrom(payload, "We could not update your haul details."));
  return payload as T;
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex gap-3 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400">{label}</p>
        <p className="mt-0.5 truncate text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function AutoHaulUserPage() {
  const [data, setData] = useState<LoadState>({ plan: null, truck: null, route: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const [recommendationData, fleetData] = await Promise.all([
        api<{ recommendations: Recommendation[] }>("/recommendations"),
        api<{ fleet: TruckData[] }>("/fleet"),
      ]);
      const plan = recommendationData.recommendations.find((item) => item.status === "accepted") ?? recommendationData.recommendations[0] ?? null;
      const truck = plan ? fleetData.fleet.find((item) => item.id === plan.truck_id) ?? null : null;
      let route: RouteOptions | null = null;
      if (plan) {
        try {
          route = await api<RouteOptions>("/recommendations/" + encodeURIComponent(plan.id) + "/route-options");
        } catch {
          // The haul remains useful if a public demo router is temporarily slow.
          route = null;
        }
      }
      setData({ plan, truck, route });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not update your haul details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void refresh(); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const pickup = data.route?.stops.find((stop) => stop.kind === "pickup");
  const dropoff = data.route?.stops.filter((stop) => stop.kind === "dropoff").at(-1);
  const primaryRoute = data.route?.routes.find((route) => route.rank === 1) ?? data.route?.routes[0];
  const isAssigned = data.plan?.status === "accepted";

  return (
    <main className="min-h-dvh bg-slate-100 text-slate-900 sm:flex sm:items-center sm:justify-center sm:p-6 lg:p-8">
      <section className="relative min-h-dvh w-full max-w-md overflow-hidden bg-white shadow-2xl shadow-slate-900/10 sm:min-h-0 sm:rounded-[2rem] lg:min-h-[720px] lg:max-w-6xl">
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 lg:h-72" />
        <header className="relative flex items-center justify-between px-6 pb-8 pt-7 text-white lg:px-10 lg:pb-12 lg:pt-10">
          <div>
            <div className="flex items-center gap-2">
              <Image
                src="/logo-white.png"
                alt="Haulio Logo"
                width={80}
                height={20}
                className="h-5 w-auto object-contain brightness-200"
              />
              <span className="text-sm font-extrabold tracking-tight">Auto Haul</span>
            </div>
            <p className="mt-4 text-sm font-semibold text-blue-100">Your next return trip, handled for you.</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => void refresh()}
            aria-label="Refresh haul"
            className="h-10 w-10 rounded-xl bg-white/15 hover:bg-white/25 text-white cursor-pointer"
          >
            <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          </Button>
        </header>

        <div className="relative px-5 pb-24 lg:grid lg:grid-cols-2 lg:gap-6 lg:px-10">
          <Card className="rounded-2xl bg-white shadow-xl shadow-blue-950/15 lg:col-span-2 border-0 overflow-visible">
            <CardContent className="p-5 lg:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">{isAssigned ? "Your assigned return haul" : "Potential next haul"}</p>
                  <h1 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">{data.plan?.cargo_summary ?? (loading ? "Finding your next haul…" : "No haul is ready yet")}</h1>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "mt-0.5 shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold border-0",
                    isAssigned ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                  )}
                >
                  {isAssigned ? "Assigned" : "Auto matched"}
                </Badge>
              </div>

              {data.plan ? (
                <>
                  <p className="mt-3 text-sm leading-relaxed text-slate-500">
                    {isAssigned ? "Operations has prepared this cargo for your return journey." : "Our dispatcher is checking this cargo for your return journey. You do not need to choose a load."}
                  </p>
                  <Alert className="mt-4 flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2.5 text-xs font-bold text-blue-800 border-0">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <AlertDescription className="text-xs font-bold text-blue-800 leading-none">
                      We will confirm before you need to drive.
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <p className="mt-3 text-sm leading-relaxed text-slate-500">Keep your location and cargo status updated. We will notify you when Auto Haul finds a safe match.</p>
              )}
            </CardContent>
          </Card>

          {error && (
            <Alert className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 lg:col-span-2 lg:mt-0">
              <CircleAlert className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-xs leading-relaxed text-amber-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {data.plan && (
            <Card className="mt-5 rounded-2xl border border-slate-100 bg-white shadow-sm lg:mt-0">
              <CardContent className="px-4 py-0">
                <DetailRow icon={PackageCheck} label="Cargo you may haul" value={data.plan.cargo_summary} />
                <div className="border-t border-slate-100" />
                <DetailRow icon={MapPin} label="Pick up" value={pickup?.name ?? data.plan.expected_empty_location} />
                <div className="border-t border-slate-100" />
                <DetailRow icon={Route} label="Deliver to" value={dropoff?.name ?? "Route being prepared"} />
                <div className="border-t border-slate-100" />
                <DetailRow icon={Clock3} label="Estimated trip" value={primaryRoute ? minutes(primaryRoute.eta_p50_min) + " · " + primaryRoute.distance_km + " km" : minutes(data.plan.eta_final_delivery_min) + " estimated"} />
              </CardContent>
            </Card>
          )}

          <Card className="mt-5 rounded-2xl bg-slate-900 text-white lg:mt-0 border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10"><Truck className="h-5 w-5 text-blue-200" /></span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-400">Vehicle status</p>
                  <p className="truncate text-sm font-bold">{data.truck ? data.truck.name + " · " + data.truck.position.name : "Waiting for live vehicle status"}</p>
                </div>
              </div>
              {data.truck && <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[11px] font-semibold text-slate-300"><span>{data.truck.vehicle_type} · {data.truck.capacity_kg.toLocaleString("id-ID")} kg</span><span>{Math.round(data.truck.fuel_pct)}% fuel</span></div>}
            </CardContent>
          </Card>

          <Alert className="mt-5 flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 lg:col-span-2 lg:mt-0">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <AlertDescription className="text-xs leading-relaxed text-slate-600">
              <b className="text-slate-800">No load selection required.</b> Auto Haul matches cargo, route, timing, and vehicle capacity for you.
            </AlertDescription>
          </Alert>
        </div>

        <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto flex w-full max-w-md items-center justify-around border-t border-slate-100 bg-white px-5 py-3 text-[10px] font-bold text-slate-400 shadow-[0_-6px_20px_rgba(15,23,42,0.06)] sm:rounded-b-[2rem] lg:max-w-6xl">
          <span className="flex flex-col items-center gap-1 text-blue-600"><Truck className="h-4 w-4" />Auto Haul</span>
          <span className="flex flex-col items-center gap-1"><Route className="h-4 w-4" />My trip</span>
          <span className="flex flex-col items-center gap-1"><Bell className="h-4 w-4" />Updates</span>
        </nav>
      </section>
    </main>
  );
}

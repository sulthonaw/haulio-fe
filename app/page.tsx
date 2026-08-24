"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  Truck,
  MapPin,
  Clock,
  Navigation,
  ShieldCheck,
  Package,
  Info,
  Calendar,
  Layers,
  Container,
  User,
  PhoneCall,
  ChevronDown
} from "lucide-react";
import type { Location } from "@/components/Map";

// Dynamically import Map component to disable Server-Side Rendering (SSR) for Leaflet
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-screen h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading full street map...</p>
      </div>
    </div>
  ),
});

interface RouteStats {
  distance: string;
  duration: string;
}

// Define the Shipment Locations following Reusable best practices
const originLocation: Location = {
  lat: -6.1016,
  lng: 106.8858,
  name: "Jakarta Port (Tanjung Priok)",
  description: "Terminal 3 Cargo Yard",
  iconUrl: "/truck.png",
};

const destinationLocation: Location = {
  lat: -7.2023,
  lng: 112.7247,
  name: "Surabaya Hub (Tanjung Perak)",
  description: "Margomulyo Cargo Warehouse",
  iconUrl: "/pin.png",
};

export default function Home() {
  const [routeStats, setRouteStats] = useState<RouteStats | null>(null);

  // Track which collapsible sidebar section is currently expanded (can be null if all are closed)
  const [activeSection, setActiveSection] = useState<"route" | "cargo" | null>("route");

  // Wrap the state updater callback in a useCallback to maintain a stable reference
  const handleRouteLoaded = useCallback((stats: RouteStats) => {
    setRouteStats(stats);
  }, []);

  return (
    <main className="relative min-h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">

      {/* 1. Header Overlay (Integrating logo-white.png) */}
      <header className="fixed top-4 left-4 right-4 z-20 h-16 border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between rounded-xl shadow-lg shadow-zinc-250/10 dark:shadow-black/40">
        <div className="flex items-center gap-3">
          <img
            src="/logo-white.png"
            alt="Haulio Logo"
            className="h-7 w-auto object-contain brightness-0 dark:brightness-100"
          />
          <div className="border-l border-zinc-200 dark:border-zinc-800 pl-3 ml-1">
            <h1 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 leading-none">Haulio Control Center</h1>
            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 mt-0.5">Real-time Dispatcher</p>
          </div>
        </div>
      </header>

      {/* 2. Full-screen Map Layer */}
      <div className="fixed inset-0 w-screen h-screen z-0">
        <Map
          origin={originLocation}
          destination={destinationLocation}
          onRouteLoaded={handleRouteLoaded}
        />
      </div>

      {/* 3. Shipment Overlay Info Panel (Floating Bottom Left with custom-scrollbar) */}
      <div className="fixed bottom-4 left-4 z-10 w-[calc(100vw-32px)] sm:w-[380px] max-h-[calc(100vh-110px)] overflow-y-auto custom-scrollbar pointer-events-auto space-y-4 pr-2">

        {/* Route Details Card (Collapsible) */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl p-5 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xl shadow-zinc-250/10 dark:shadow-black/50">
          <button
            onClick={() => setActiveSection(activeSection === "route" ? null : "route")}
            className="w-full flex justify-between items-center text-left focus:outline-none cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-[9px] font-black tracking-widest uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/50 w-max mb-1.5">
                Active Shipment
              </span>
              <h2 className="text-md font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                Jakarta &rarr; Surabaya
              </h2>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-300 ${activeSection === "route" ? "transform rotate-180" : ""
                }`}
            />
          </button>

          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${activeSection === "route" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}>
            <div className="overflow-hidden">
              <div className="pt-4 space-y-4">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Trans-Java Toll Road Route
                </p>

                {/* Timeline Checkpoints */}
                <div className="space-y-5 relative before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-zinc-200 dark:before:bg-zinc-800">
                  {/* Origin (Jakarta) */}
                  <div className="flex gap-3.5 relative items-start">
                    <div className="z-10 flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 shadow-sm shrink-0">
                      <Truck className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Cargo Loading Port</span>
                      <h3 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">{originLocation.name}</h3>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">{originLocation.description}</span>
                    </div>
                  </div>

                  {/* Destination (Surabaya) */}
                  <div className="flex gap-3.5 relative items-start">
                    <div className="z-10 flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Cargo Discharge Area</span>
                      <h3 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 truncate">{destinationLocation.name}</h3>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">{destinationLocation.description}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800/80">
                  <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-0.5">
                      <Navigation className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-[10px] font-bold">Est. Distance</span>
                    </div>
                    <div className="text-sm font-black text-zinc-950 dark:text-white">
                      {routeStats ? routeStats.distance : "Calculating..."}
                    </div>
                  </div>

                  <div className="bg-zinc-50/50 dark:bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 mb-0.5">
                      <Clock className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-[10px] font-bold">Est. Duration</span>
                    </div>
                    <div className="text-sm font-black text-zinc-950 dark:text-white">
                      {routeStats ? routeStats.duration : "Calculating..."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cargo Telemetry Card (Collapsible) */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl p-5 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xl shadow-zinc-250/10 dark:shadow-black/50">
          <button
            onClick={() => setActiveSection(activeSection === "cargo" ? null : "cargo")}
            className="w-full flex justify-between items-center text-left focus:outline-none cursor-pointer"
          >
            <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-450 dark:text-zinc-400">
              Cargo & Fleet Telemetry
            </h3>
            <ChevronDown
              className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-300 ${activeSection === "cargo" ? "transform rotate-180" : ""
                }`}
            />
          </button>

          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${activeSection === "cargo" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}>
            <div className="overflow-hidden">
              <div className="pt-4 space-y-4">
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Container className="h-3.5 w-3.5 text-zinc-400" />
                      Cargo Type
                    </span>
                    <span className="font-bold text-zinc-850 dark:text-zinc-150">FCL 40&apos; High Cube</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-zinc-400" />
                      Commodity
                    </span>
                    <span className="font-bold text-zinc-850 dark:text-zinc-150">Automotive Spare Parts</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-zinc-400" />
                      Fleet Vehicle
                    </span>
                    <span className="font-bold text-zinc-850 dark:text-zinc-150">Hino Ranger (B 9140 UQY)</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                      Status
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50">
                      Ready to Dispatch
                    </span>
                  </div>
                </div>

                {/* Driver Profile */}
                <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-650 dark:text-zinc-350 font-bold border border-zinc-200 dark:border-zinc-700">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">Budi Santoso</h4>
                      <p className="text-[9px] text-zinc-500 dark:text-zinc-400">Class B-II General Driver</p>
                    </div>
                  </div>
                  <button className="p-1.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-650 dark:text-zinc-350 transition-colors cursor-pointer">
                    <PhoneCall className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Map Info Card */}
        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-xl p-3 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xl shadow-zinc-250/10 dark:shadow-black/50 flex items-start gap-2">
          <Info className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[10px] text-blue-900 dark:text-blue-300 leading-normal font-semibold">
            Map is fully interactive. Route computed live using OpenStreetMap telemetry.
          </p>
        </div>

      </div>
    </main>
  );
}

"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
  CubeIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  ChevronDownIcon
} from "@heroicons/react/24/outline";
import type { Location } from "@/components/Map";
import { Button } from "@/components/ui/button";

// Dynamically import Map component to disable Server-Side Rendering (SSR) for Leaflet
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Loading street map...</p>
      </div>
    </div>
  ),
});

interface RouteStats {
  distance: string;
  duration: string;
}

// Define the Shipment Locations
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
    <main className="relative min-h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">
      
      {/* 1. Header Overlay */}
      <header className="fixed top-4 left-4 right-4 z-20 h-16 border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-6 py-4 flex items-center justify-between rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <img 
            src="/logo-white.png" 
            alt="Haulio Logo" 
            className="h-7 w-auto object-contain brightness-0 dark:brightness-100" 
          />
          <div className="border-l border-zinc-200 dark:border-zinc-850 pl-3 ml-1">
            <h1 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 leading-none">Control Center</h1>
          </div>
        </div>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">
            Dashboard
          </Button>
        </Link>
      </header>

      {/* 2. Full-screen Map Layer */}
      <div className="fixed inset-0 w-full h-full z-0">
        <Map 
          origin={originLocation} 
          destination={destinationLocation} 
          onRouteLoaded={handleRouteLoaded} 
        />
      </div>

      {/* 3. Shipment Overlay Info Panel (Floating Bottom Left with custom-scrollbar) */}
      <div className="fixed bottom-4 left-4 z-10 w-[calc(100%-32px)] sm:w-[380px] max-h-[calc(100vh-110px)] overflow-y-auto custom-scrollbar pointer-events-auto space-y-3 pr-1.5">
        
        {/* Route Details Card (Collapsible) */}
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl p-4.5 border border-zinc-200 dark:border-zinc-800 shadow-md">
          <button 
            onClick={() => setActiveSection(activeSection === "route" ? null : "route")}
            className="w-full flex justify-between items-center text-left focus:outline-none cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest block mb-1">Active Shipment</span>
              <h2 className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-50">
                Jakarta &rarr; Surabaya
              </h2>
            </div>
            <ChevronDownIcon 
              className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-300 ${
                activeSection === "route" ? "transform rotate-180" : ""
              }`} 
            />
          </button>

          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            activeSection === "route" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}>
            <div className="overflow-hidden">
              <div className="pt-4 space-y-4">
                
                {/* Timeline Checkpoints */}
                <div className="space-y-4 relative before:absolute before:left-[13px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-zinc-200 dark:before:bg-zinc-800">
                  {/* Origin */}
                  <div className="flex gap-3.5 relative items-start">
                    <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-450 shrink-0">
                      <TruckIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Origin</span>
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate">{originLocation.name}</h3>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">{originLocation.description}</span>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex gap-3.5 relative items-start">
                    <div className="z-10 flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-650 dark:text-zinc-450 shrink-0">
                      <MapPinIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Destination</span>
                      <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate">{destinationLocation.name}</h3>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block mt-0.5">{destinationLocation.description}</span>
                    </div>
                  </div>
                </div>

                {/* Quick Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-850">
                    <div className="flex items-center gap-1.5 text-zinc-550 dark:text-zinc-400 mb-0.5">
                      <PaperAirplaneIcon className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="text-[10px] font-bold">Distance</span>
                    </div>
                    <div className="text-xs font-black text-zinc-900 dark:text-white">
                      {routeStats ? routeStats.distance : "Calculating..."}
                    </div>
                  </div>
                  
                  <div className="bg-zinc-50 dark:bg-zinc-950 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-850">
                    <div className="flex items-center gap-1.5 text-zinc-550 dark:text-zinc-400 mb-0.5">
                      <ClockIcon className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="text-[10px] font-bold">Duration</span>
                    </div>
                    <div className="text-xs font-black text-zinc-900 dark:text-white">
                      {routeStats ? routeStats.duration : "Calculating..."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cargo Telemetry Card (Collapsible) */}
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl p-4.5 border border-zinc-200 dark:border-zinc-800 shadow-md">
          <button 
            onClick={() => setActiveSection(activeSection === "cargo" ? null : "cargo")}
            className="w-full flex justify-between items-center text-left focus:outline-none cursor-pointer"
          >
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Cargo & Vehicle
            </h3>
            <ChevronDownIcon 
              className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-300 ${
                activeSection === "cargo" ? "transform rotate-180" : ""
              }`} 
            />
          </button>

          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
            activeSection === "cargo" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}>
            <div className="overflow-hidden">
              <div className="pt-4 space-y-4">
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-450 flex items-center gap-1.5">
                      <CubeIcon className="h-3.5 w-3.5 text-zinc-400" />
                      Cargo Type
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">FCL 40&apos; HC</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-450 flex items-center gap-1.5">
                      <CubeIcon className="h-3.5 w-3.5 text-zinc-400" />
                      Commodity
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">Spare Parts</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-450 flex items-center gap-1.5">
                      <TruckIcon className="h-3.5 w-3.5 text-zinc-400" />
                      Vehicle
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">Hino Ranger (B 9140 UQY)</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-450 flex items-center gap-1.5">
                      <ShieldCheckIcon className="h-3.5 w-3.5 text-zinc-550" />
                      Status
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                      Ready to Dispatch
                    </span>
                  </div>
                </div>

                {/* Driver Profile */}
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold border border-zinc-200 dark:border-zinc-700">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-extrabold text-zinc-900 dark:text-zinc-100">Budi Santoso</h4>
                      <p className="text-[9px] text-zinc-555 dark:text-zinc-400">Driver</p>
                    </div>
                  </div>
                  <button className="p-1.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer">
                    <PhoneIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

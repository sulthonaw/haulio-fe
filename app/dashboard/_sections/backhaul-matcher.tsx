"use client";

import { useState } from "react";
import { 
  BoltIcon, 
  MapIcon, 
  ClockIcon, 
  CurrencyDollarIcon, 
  ArrowUpRightIcon, 
  ShieldCheckIcon 
} from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";

interface BackhaulOrder {
  id: string;
  commodity: string;
  matchScore: number;
  origin: string;
  destination: string;
  weight: string;
  deviation: string;
  waitTime: string;
  revenue: string;
  rating: number;
}

export default function BackhaulMatcher() {
  const [assignedOrderId, setAssignedOrderId] = useState<string | null>(null);

  const backhaulOrders: BackhaulOrder[] = [
    {
      id: "BH-9081",
      commodity: "Finished Steel Pipes",
      matchScore: 96,
      origin: "Gresik, Surabaya",
      destination: "Cakung, Jakarta",
      weight: "24 Tons",
      deviation: "+12 km",
      waitTime: "1.5 hrs",
      revenue: "IDR 6.4M",
      rating: 4.9,
    },
    {
      id: "BH-7822",
      commodity: "FMCG Packaged Foods",
      matchScore: 85,
      origin: "Sidoarjo, Surabaya",
      destination: "Tanjung Priok, Jakarta",
      weight: "12 Tons",
      deviation: "+28 km",
      waitTime: "3.0 hrs",
      revenue: "IDR 5.1M",
      rating: 4.6,
    },
    {
      id: "BH-6204",
      commodity: "Structural Plywood",
      matchScore: 72,
      origin: "Kalianak, Surabaya",
      destination: "Bekasi, West Java",
      weight: "18 Tons",
      deviation: "+45 km",
      waitTime: "4.5 hrs",
      revenue: "IDR 4.3M",
      rating: 4.2,
    },
  ];

  const handleAssign = (orderId: string) => {
    setAssignedOrderId(orderId);
    setTimeout(() => {
      setAssignedOrderId(null);
    }, 3000);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">
      
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            <BoltIcon className="h-4.5 w-4.5 text-zinc-500" />
            Backhaul Recommendations
          </h2>
          <p className="text-[11px] text-zinc-500">Available return trip cargo matches</p>
        </div>
      </div>

      {/* Suggested Matches List */}
      <div className="space-y-3">
        {backhaulOrders.map((order) => {
          const isAssigned = assignedOrderId === order.id;
          return (
            <div 
              key={order.id}
              className={`border rounded-lg p-4 transition-all duration-300 relative overflow-hidden ${
                isAssigned 
                  ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5 shadow-sm"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/50"
              }`}
            >
              
              {/* Top Row (ID / rating / Match score) */}
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold">
                  <span>{order.id}</span>
                  <span>•</span>
                  <div className="flex items-center gap-0.5 text-amber-500">
                    <StarIcon className="h-3 w-3" />
                    {order.rating}
                  </div>
                </div>

                <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {order.matchScore}% Match
                </span>
              </div>

              {/* Middle Row (Commodity & Locations) */}
              <div className="space-y-1.5 mb-3">
                <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{order.commodity} ({order.weight})</h3>
                
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex flex-col gap-0.5">
                  <p className="truncate">
                    <span className="font-semibold text-zinc-750 dark:text-zinc-300">From:</span> {order.origin}
                  </p>
                  <p className="truncate">
                    <span className="font-semibold text-zinc-750 dark:text-zinc-300">To:</span> {order.destination}
                  </p>
                </div>
              </div>

              {/* Bottom Metrics and Button */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-200/65 dark:border-zinc-800/80">
                <div className="flex items-center gap-3 text-[10px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <MapIcon className="h-3.5 w-3.5" />
                    {order.deviation}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {order.waitTime}
                  </span>
                  <span className="flex items-center gap-0.5 font-bold text-zinc-800 dark:text-zinc-200">
                    <CurrencyDollarIcon className="h-3.5 w-3.5 text-zinc-400" />
                    {order.revenue}
                  </span>
                </div>

                <button
                  disabled={isAssigned || assignedOrderId !== null}
                  onClick={() => handleAssign(order.id)}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                    isAssigned 
                      ? "bg-emerald-600 text-white border-emerald-600 cursor-default"
                      : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white border-transparent cursor-pointer disabled:opacity-50"
                  }`}
                >
                  {isAssigned ? (
                    <>
                      <ShieldCheckIcon className="h-3 w-3" />
                      Assigned
                    </>
                  ) : (
                    <>
                      Assign
                      <ArrowUpRightIcon className="h-3 w-3" />
                    </>
                  )}
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}

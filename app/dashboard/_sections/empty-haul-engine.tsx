"use client";

import { ExclamationTriangleIcon, CpuChipIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";

export default function EmptyHaulEngine() {
  const riskScore = 74;
  const route = {
    origin: "Jakarta (Tanjung Priok)",
    destination: "Surabaya (Tanjung Perak)",
    riskLevel: "High Risk",
    riskColor: "text-amber-700 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50",
  };

  const featureImportance = [
    { name: "Outbound Cargo Volume Imbalance", value: 42 },
    { name: "Q3 Seasonal Container Import Rush", value: 28 },
    { name: "Historical Port Congestion Index", value: 18 },
    { name: "Operating Fuel Cost Deviation", value: 12 },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-5">

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            <CpuChipIcon className="h-4.5 w-4.5 text-zinc-500" />
            Empty Haul Risk
          </h2>
          <p className="text-[11px] text-zinc-500">Probability of returning without cargo</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${route.riskColor}`}>
          <ExclamationTriangleIcon className="h-3 w-3" />
          {route.riskLevel}
        </span>
      </div>

      {/* Main Stats (Gauge and stats) */}
      <div className="space-y-4">

        {/* Simple Flat Metric Bar */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-150 dark:border-zinc-850">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-semibold text-zinc-500">Risk Assessment</span>
            <span className="text-2xl font-black text-zinc-950 dark:text-white leading-none">{riskScore}%</span>
          </div>
          <div className="w-full bg-zinc-250 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>

        {/* Route Details */}
        <div className="space-y-1.5 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Route Corridor</span>
          <p className="font-bold text-zinc-800 dark:text-zinc-200">
            {route.origin} &rarr; {route.destination}
          </p>
        </div>

        {/* Warning Indicator */}
        <div className="flex gap-2 bg-amber-50/50 dark:bg-amber-950/10 p-3 border border-amber-100 dark:border-amber-900/30 rounded-lg">
          <ShieldExclamationIcon className="h-4.5 w-4.5 text-amber-600 dark:text-amber-500 shrink-0" />
          <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-normal">
            Surabaya outbound dispatch is down 32% to West Java. Availability of loaded cargo is highly congested.
          </p>
        </div>

      </div>

      {/* Feature Importance Section */}
      <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Key Risk Drivers</span>

        <div className="space-y-2">
          {featureImportance.map((feature, idx) => (
            <div key={idx} className="flex justify-between text-xs items-center">
              <span className="text-zinc-650 dark:text-zinc-350">{feature.name}</span>
              <span className="text-zinc-900 dark:text-zinc-150 font-bold">{feature.value}%</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

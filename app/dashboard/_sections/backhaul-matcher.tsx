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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm overflow-visible">
      {/* Header */}
      <CardHeader className="p-5 pb-0">
        <CardTitle className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5 font-heading">
          <BoltIcon className="h-4.5 w-4.5 text-zinc-500" />
          Backhaul Recommendations
        </CardTitle>
        <CardDescription className="text-[11px] text-zinc-500">
          Available return trip cargo matches
        </CardDescription>
      </CardHeader>

      {/* Suggested Matches List */}
      <CardContent className="p-5 pt-4 space-y-3">
        {backhaulOrders.map((order) => {
          const isAssigned = assignedOrderId === order.id;
          return (
            <Card
              key={order.id}
              className={cn(
                "border transition-all duration-300 relative overflow-hidden",
                isAssigned
                  ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5 shadow-sm"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50/40 dark:bg-zinc-900/50"
              )}
            >
              <CardContent className="p-4">
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

                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border-0"
                  >
                    {order.matchScore}% Match
                  </Badge>
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

                  <Button
                    disabled={isAssigned || assignedOrderId !== null}
                    onClick={() => handleAssign(order.id)}
                    className={cn(
                      "inline-flex items-center gap-1 px-3 h-8 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border cursor-pointer",
                      isAssigned
                        ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-600"
                        : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white border-transparent disabled:opacity-50"
                    )}
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
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}

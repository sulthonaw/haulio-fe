"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  CommandLineIcon,
  CheckCircleIcon,
  ShieldExclamationIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";

interface LogEntry {
  id: number;
  timestamp: string;
  engine: "Empty Haul" | "Backhaul Matcher" | "System Optimizer";
  event: string;
  status: "info" | "success" | "warning";
  details: string;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 1,
      timestamp: "10:48:12",
      engine: "Empty Haul",
      event: "Inference completed",
      status: "success",
      details: "Jakarta-Surabaya Risk classified: High Risk (74%)",
    },
    {
      id: 2,
      timestamp: "10:48:15",
      engine: "Backhaul Matcher",
      event: "Computed cosine similarity",
      status: "info",
      details: "Evaluated 12 active freight orders in Surabaya",
    },
    {
      id: 3,
      timestamp: "10:49:01",
      engine: "System Optimizer",
      event: "Route cost deviation updated",
      status: "info",
      details: "Toll road deviancy factor calculated (+12 km)",
    },
    {
      id: 4,
      timestamp: "10:49:45",
      engine: "Empty Haul",
      event: "Supply imbalance detected",
      status: "warning",
      details: "Outbound freight flow at Surabaya Tanjung Perak down 32%",
    },
    {
      id: 5,
      timestamp: "10:50:02",
      engine: "Backhaul Matcher",
      event: "Top matches ranked",
      status: "success",
      details: "Recommended BH-9081 (Finished Steel Pipes) as top match (96%)",
    },
  ]);

  useEffect(() => {
    const eventsPool = [
      {
        engine: "Empty Haul" as const,
        event: "Recalculated seasonal factor",
        status: "info" as const,
        details: "Q3 import container factor adjusted to 1.15x",
      },
      {
        engine: "Backhaul Matcher" as const,
        event: "Wait time coefficients adjusted",
        status: "info" as const,
        details: "Gresik loading yard wait time reduced to 1.5 hours",
      },
      {
        engine: "System Optimizer" as const,
        event: "Telemetry sync matched",
        status: "success" as const,
        details: "Truck Hino Ranger matched to empty return route",
      },
      {
        engine: "Empty Haul" as const,
        event: "Spot rate anomaly triggered",
        status: "warning" as const,
        details: "Return freight spot rates dropped 18% below base cost",
      },
      {
        engine: "Backhaul Matcher" as const,
        event: "Ranking embedding updated",
        status: "success" as const,
        details: "Re-ranked 8 incoming cargo items from Sidoarjo",
      },
    ];

    const interval = setInterval(() => {
      const randomEvent = eventsPool[Math.floor(Math.random() * eventsPool.length)];
      const now = new Date();
      const timeString = now.toTimeString().split(" ")[0]; // HH:MM:SS

      setLogs((prevLogs) => {
        const nextId = prevLogs.length > 0 ? Math.max(...prevLogs.map(l => l.id)) + 1 : 1;
        const newLog: LogEntry = {
          id: nextId,
          timestamp: timeString,
          ...randomEvent
        };
        const currentLogs = [newLog, ...prevLogs];
        return currentLogs.slice(0, 7);
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4 lg:col-span-3">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            <CommandLineIcon className="h-4.5 w-4.5 text-zinc-500" />
            Activity Logs
          </h2>
          <p className="text-[11px] text-zinc-500">Live diagnostics of matching events</p>
        </div>
      </div>

      {/* Table Section using shadcn Table */}
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-850">
        <Table>
          <TableHeader className="bg-zinc-50 dark:bg-zinc-950 text-xs">
            <TableRow>
              <TableHead className="w-[100px] font-bold text-zinc-500">Timestamp</TableHead>
              <TableHead className="w-[140px] font-bold text-zinc-500">AI Engine</TableHead>
              <TableHead className="w-[180px] font-bold text-zinc-500">Event</TableHead>
              <TableHead className="font-bold text-zinc-500">Details</TableHead>
              <TableHead className="w-[100px] text-right font-bold text-zinc-500">Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {logs.map((log) => {
              let statusColor = "";
              let statusIcon = null;

              if (log.status === "success") {
                statusColor = "text-emerald-700 dark:text-emerald-400";
                statusIcon = <CheckCircleIcon className="w-3.5 h-3.5" />;
              } else if (log.status === "warning") {
                statusColor = "text-amber-700 dark:text-amber-400";
                statusIcon = <ShieldExclamationIcon className="w-3.5 h-3.5" />;
              } else {
                statusColor = "text-zinc-600 dark:text-zinc-400";
                statusIcon = <InformationCircleIcon className="w-3.5 h-3.5" />;
              }

              return (
                <TableRow key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 border-b border-zinc-150 dark:border-zinc-800/80">
                  <TableCell className="font-mono text-[10px] text-zinc-450">{log.timestamp}</TableCell>
                  <TableCell className="font-bold text-zinc-700 dark:text-zinc-300">{log.engine}</TableCell>
                  <TableCell className="font-semibold text-zinc-900 dark:text-zinc-100">{log.event}</TableCell>
                  <TableCell className="text-zinc-500 dark:text-zinc-400">{log.details}</TableCell>
                  <TableCell className="text-right">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                      {statusIcon}
                      {log.status}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

    </div>
  );
}

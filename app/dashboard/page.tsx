"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeftIcon, CpuChipIcon } from "@heroicons/react/24/outline";
import EmptyHaulEngine from "./_sections/empty-haul-engine";
import BackhaulMatcher from "./_sections/backhaul-matcher";
import ActivityLogs from "./_sections/activity-logs";

export default function Dashboard() {
  return (
    <main className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-50">

      {/* Dashboard Top Header */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md px-6 py-4 flex items-center justify-between shadow-sm">

        {/* Logo and title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-850 text-zinc-650 dark:text-zinc-300 transition-colors mr-1 cursor-pointer"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <Image
            src="/logo-white.png"
            alt="Haulio Logo"
            width={112}
            height={28}
            className="h-7 w-auto object-contain brightness-0 dark:brightness-100"
          />
          <div className="border-l border-zinc-200 dark:border-zinc-850 pl-3 ml-1 hidden sm:block">
            <h1 className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 leading-none flex items-center gap-1">
              <CpuChipIcon className="h-3.5 w-3.5 text-zinc-500" />
              AI Intelligence
            </h1>
          </div>
        </div>
      </header>

      {/* Main Container Grid */}
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6">

        {/* Flat Overview Header */}
        <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            AI Dispatch & Analytics
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time decision support for empty haul risk assessment and backhaul optimization.
          </p>
        </div>

        {/* AI Analytics Row (1 Empty Haul risk card, 2 Backhaul matcher recommendations) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <EmptyHaulEngine />
          </div>
          <div className="lg:col-span-2">
            <BackhaulMatcher />
          </div>
        </div>

        {/* Live Logs Row (shadcn Table widget) */}
        <div className="grid grid-cols-1">
          <ActivityLogs />
        </div>

      </div>

    </main>
  );
}

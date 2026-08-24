"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import type { Recommendation, RegionProperties, Regions, RouteOption, RouteOptions, TrafficLevel, Truck } from "@/lib/operations";
import { minutes } from "@/lib/operations";

interface MapProps {
  regions: Regions | null;
  fleet: Truck[];
  recommendations: Recommendation[];
  selectedPlan: Recommendation | null;
  routeOptions: RouteOptions | null;
  focusRegion: string | null;
  onPlanSelect: (planId: string) => void;
  onRouteSelect: (route: RouteOption) => void;
}

const TRAFFIC_COLOR: Record<TrafficLevel, string> = {
  jammed: "#e5484d",
  slow: "#eab308",
  free: "#2563eb",
};

function activityColor(activity: number): string {
  if (activity >= 0.66) return "#0ea5a8";
  if (activity >= 0.3) return "#7dd3d5";
  if (activity > 0) return "#c7eef0";
  return "#e7eef3";
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function trafficLabel(level: TrafficLevel): string {
  return level === "jammed" ? "Heavy congestion" : level === "slow" ? "Moderate congestion" : "Free flow";
}

export default function Map({
  regions,
  fleet,
  recommendations,
  selectedPlan,
  routeOptions,
  focusRegion,
  onPlanSelect,
  onRouteSelect,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const regionsLayerRef = useRef<L.GeoJSON | null>(null);
  const fleetLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const planSelectRef = useRef(onPlanSelect);
  const routeSelectRef = useRef(onRouteSelect);

  useEffect(() => {
    planSelectRef.current = onPlanSelect;
    routeSelectRef.current = onRouteSelect;
  }, [onPlanSelect, onRouteSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false, preferCanvas: true }).setView([-2.35, 118.15], 5);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);
    mapRef.current = map;

    const resizeTimer = window.setTimeout(() => map.invalidateSize(), 80);
    return () => {
      window.clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      regionsLayerRef.current = null;
      fleetLayerRef.current = null;
      routeLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    regionsLayerRef.current?.remove();
    if (!regions) {
      regionsLayerRef.current = null;
      return;
    }

    const layer = L.geoJSON(regions as unknown as GeoJSON.GeoJsonObject, {
      style: (feature) => {
        const properties = feature?.properties as RegionProperties | undefined;
        const activity = properties?.activity ?? 0;
        return { color: "#aec1d0", weight: 0.65, opacity: 0.85, fillColor: activityColor(activity), fillOpacity: activity ? 0.63 : 0.35 };
      },
      onEachFeature: (feature, featureLayer) => {
        const properties = feature.properties as RegionProperties;
        featureLayer.bindTooltip(`${escapeHtml(properties.name)} · ${properties.truck_count} truck(s)`, { sticky: true, direction: "top" });
        featureLayer.on("mouseover", () => (featureLayer as L.Path).setStyle({ weight: 1.5, color: "#315f8e", fillOpacity: 0.8 }));
        featureLayer.on("mouseout", () => layer.resetStyle(featureLayer as L.Path));
        featureLayer.on("click", (event: L.LeafletMouseEvent) => {
          L.popup({ closeButton: false, offset: [0, -3] })
            .setLatLng(event.latlng)
            .setContent(`<div class="haulio-map-popup"><strong>${escapeHtml(properties.name)}</strong><p>${properties.truck_count} active truck(s)<br>${properties.log_count} accepted telemetry log(s)</p><hr><p>${properties.traffic.jammed} jammed · ${properties.traffic.slow} moderate · ${properties.traffic.free} free-flow</p></div>`)
            .openOn(map);
        });
      },
    }).addTo(map);
    regionsLayerRef.current = layer;
    return () => { layer.remove(); };
  }, [regions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    fleetLayerRef.current?.remove();
    const group = L.layerGroup().addTo(map);
    const planByTruck = new globalThis.Map(recommendations.map((plan) => [plan.truck_id, plan]));

    for (const truck of fleet) {
      const color = TRAFFIC_COLOR[truck.traffic.level];
      const icon = L.divIcon({
        className: "",
        html: `<div class="haulio-truck-pin" style="background:${color}"><span>▰</span></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 25],
      });
      const plan = planByTruck.get(truck.id);
      const marker = L.marker([truck.position.lat, truck.position.lon], { icon, title: truck.name });
      marker.bindPopup(`<div class="haulio-map-popup"><strong>${escapeHtml(truck.name)}</strong><p>${escapeHtml(truck.vehicle_type)} · ${truck.capacity_kg.toLocaleString("id-ID")} kg<br>${escapeHtml(truck.position.name)}</p><p><i class="haulio-traffic-dot" style="background:${color}"></i>${trafficLabel(truck.traffic.level)} · ${Math.round(truck.empty_return_risk.probability * 100)}% empty-return risk</p>${plan ? "<p class=\"haulio-popup-hint\">Click this truck to inspect its recommended backhaul.</p>" : ""}</div>`);
      marker.on("click", () => {
        if (plan) planSelectRef.current(plan.id);
      });
      marker.addTo(group);
    }
    fleetLayerRef.current = group;
    return () => { group.remove(); };
  }, [fleet, recommendations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    routeLayerRef.current?.remove();
    if (!selectedPlan || !routeOptions) {
      routeLayerRef.current = null;
      return;
    }

    const group = L.layerGroup().addTo(map);
    for (const option of [...routeOptions.routes].reverse()) {
      const primary = option.rank === 1;
      const line = L.polyline(option.coordinates.map(([lon, lat]) => [lat, lon] as L.LatLngTuple), {
        color: primary ? TRAFFIC_COLOR[option.traffic.level] : "#94a3b8",
        weight: primary ? 6 : 3.5,
        opacity: primary ? 0.94 : 0.58,
        dashArray: primary ? undefined : "8 9",
        lineCap: "round",
      });
      line.on("click", (event: L.LeafletMouseEvent) => {
        routeSelectRef.current(option);
        L.popup({ closeButton: true })
          .setLatLng(event.latlng)
          .setContent(`<div class="haulio-map-popup"><strong>${escapeHtml(option.label)}</strong><p><i class="haulio-traffic-dot" style="background:${TRAFFIC_COLOR[option.traffic.level]}"></i>${trafficLabel(option.traffic.level)}<br>${option.distance_km} km · P50 ${minutes(option.eta_p50_min)}<br>P90 ${minutes(option.eta_p90_min)}</p><hr><p>${escapeHtml(selectedPlan.cargo_summary)}</p></div>`)
          .openOn(map);
      });
      line.addTo(group);
    }
    routeOptions.stops.forEach((stop, index) => {
      L.circleMarker([stop.lat, stop.lon], {
        radius: 5.5,
        color: "#fff",
        weight: 2,
        fillColor: index === 0 ? "#2563eb" : "#0ea5a8",
        fillOpacity: 1,
      }).bindTooltip(`${stop.kind}: ${stop.name}`).addTo(group);
    });
    const primary = routeOptions.routes.find((route) => route.rank === 1);
    if (primary?.coordinates.length) {
      map.fitBounds(L.latLngBounds(primary.coordinates.map(([lon, lat]) => [lat, lon] as L.LatLngTuple)).pad(0.18), { maxZoom: 9, animate: false });
    }
    routeLayerRef.current = group;
    return () => { group.remove(); };
  }, [routeOptions, selectedPlan]);

  useEffect(() => {
    const map = mapRef.current;
    const regionLayer = regionsLayerRef.current;
    if (!map || !regionLayer || !focusRegion) return;
    const selectedLayer = regionLayer.getLayers().find((layer) => {
      const feature = (layer as L.GeoJSON & { feature?: { properties?: RegionProperties } }).feature;
      return feature?.properties?.name === focusRegion;
    }) as L.Polygon | undefined;
    if (selectedLayer) map.fitBounds(selectedLayer.getBounds().pad(0.2), { maxZoom: 7, animate: false });
  }, [focusRegion, regions]);

  return <div ref={containerRef} className="h-full w-full bg-slate-100" aria-label="Indonesia truck operations map" />;
}

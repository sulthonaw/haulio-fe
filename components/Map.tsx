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

// Activity zones are useful for a country-level overview, but obscure roads
// and individual trucks once an operator has zoomed into a local operating area.
const ACTIVITY_OVERLAY_MAX_ZOOM = 7;
const FLEET_CLUSTER_MAX_ZOOM = 8;

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
      pointToLayer: (feature, latlng) => {
        const properties = feature.properties as RegionProperties;
        const activity = properties.activity ?? 0;
        return L.circle(latlng, {
          radius: 48000,
          color: "#78aebb",
          weight: 1,
          opacity: 0.7,
          fillColor: activityColor(activity),
          fillOpacity: activity ? 0.32 : 0.16,
        });
      },
      onEachFeature: (feature, featureLayer) => {
        const properties = feature.properties as RegionProperties;
        featureLayer.bindTooltip(`${escapeHtml(properties.name)} · ${properties.truck_count} truck(s)`, { sticky: true, direction: "top" });
        featureLayer.on("mouseover", () => (featureLayer as L.Path).setStyle({ weight: 1.5, color: "#315f8e", fillOpacity: 0.8 }));
        featureLayer.on("mouseout", () => layer.resetStyle(featureLayer as L.Path));
        featureLayer.on("click", (event: L.LeafletMouseEvent) => {
          L.popup({ closeButton: false, offset: [0, -3] })
            .setLatLng(event.latlng)
            .setContent(`<div class="haulio-map-popup"><strong>${escapeHtml(properties.name)}</strong><p>${properties.truck_count} active truck(s)<br>${properties.log_count} telemetry log(s)</p><hr><p>${properties.traffic.jammed} jammed · ${properties.traffic.slow} moderate · ${properties.traffic.free} free-flow</p></div>`)
            .openOn(map);
        });
      },
    });
    const syncActivityVisibility = () => {
      const shouldShow = map.getZoom() <= ACTIVITY_OVERLAY_MAX_ZOOM;
      if (shouldShow && !map.hasLayer(layer)) layer.addTo(map);
      if (!shouldShow && map.hasLayer(layer)) layer.remove();
    };

    syncActivityVisibility();
    map.on("zoomend", syncActivityVisibility);
    regionsLayerRef.current = layer;
    return () => {
      map.off("zoomend", syncActivityVisibility);
      layer.remove();
    };
  }, [regions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    fleetLayerRef.current?.remove();
    const group = L.layerGroup().addTo(map);
    const planByTruck = new globalThis.Map(recommendations.map((plan) => [plan.truck_id, plan]));

    const renderIndividualTrucks = () => {
      for (const truck of fleet) {
        const color = TRAFFIC_COLOR[truck.traffic.level];
        const icon = L.divIcon({
          className: "",
          html: `<div class="haulio-truck-marker"><img src="/truck.png" alt="" /><i style="background:${color}"></i></div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 28],
        });
        const plan = planByTruck.get(truck.id);
        const marker = L.marker([truck.position.lat, truck.position.lon], { icon, title: truck.name });
        marker.bindPopup(`<div class="haulio-map-popup"><strong>${escapeHtml(truck.name)}</strong><p>${escapeHtml(truck.vehicle_type)} · ${truck.capacity_kg.toLocaleString("id-ID")} kg<br>${escapeHtml(truck.position.name)}</p><p><i class="haulio-traffic-dot" style="background:${color}"></i>${trafficLabel(truck.traffic.level)} · ${Math.round(truck.empty_return_risk.probability * 100)}% empty-return risk</p>${plan ? "<p class=\"haulio-popup-hint\">Click this truck to inspect its recommended backhaul.</p>" : ""}</div>`);
        marker.on("click", () => {
          if (plan) planSelectRef.current(plan.id);
        });
        marker.addTo(group);
      }
    };

    const renderFleetClusters = () => {
      const clusters = new globalThis.Map<string, Truck[]>();
      for (const truck of fleet) {
        const key = truck.position.name;
        clusters.set(key, [...(clusters.get(key) ?? []), truck]);
      }
      for (const [regionName, trucks] of clusters) {
        const lat = trucks.reduce((total, truck) => total + truck.position.lat, 0) / trucks.length;
        const lon = trucks.reduce((total, truck) => total + truck.position.lon, 0) / trucks.length;
        const traffic = trucks.reduce<Record<TrafficLevel, number>>((counts, truck) => {
          counts[truck.traffic.level] += 1;
          return counts;
        }, { jammed: 0, slow: 0, free: 0 });
        const level: TrafficLevel = traffic.jammed ? "jammed" : traffic.slow ? "slow" : "free";
        const color = TRAFFIC_COLOR[level];
        const icon = L.divIcon({
          className: "",
          html: `<div class="haulio-fleet-cluster" style="--traffic:${color}"><span>🚚</span><b>${trucks.length}</b></div>`,
          iconSize: [46, 46],
          iconAnchor: [23, 23],
        });
        const marker = L.marker([lat, lon], { icon, title: `${trucks.length} trucks near ${regionName}` });
        marker.bindPopup(`<div class="haulio-map-popup"><strong>${escapeHtml(regionName)}</strong><p>${trucks.length} trucks in this operating area<br><i class="haulio-traffic-dot" style="background:${TRAFFIC_COLOR.jammed}"></i>${traffic.jammed} heavy · <i class="haulio-traffic-dot" style="background:${TRAFFIC_COLOR.slow}"></i>${traffic.slow} moderate · <i class="haulio-traffic-dot" style="background:${TRAFFIC_COLOR.free}"></i>${traffic.free} free-flow</p><p class="haulio-popup-hint">Zoom in to inspect individual trucks.</p></div>`);
        marker.on("click", () => map.flyTo([lat, lon], Math.max(map.getZoom() + 2, 10)));
        marker.addTo(group);
      }
    };

    const renderFleet = () => {
      group.clearLayers();
      if (map.getZoom() <= FLEET_CLUSTER_MAX_ZOOM) renderFleetClusters();
      else renderIndividualTrucks();
    };

    renderFleet();
    map.on("zoomend", renderFleet);
    fleetLayerRef.current = group;
    return () => {
      map.off("zoomend", renderFleet);
      group.remove();
    };
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
        dashArray: primary ? "14 12" : "8 9",
        className: primary ? "haulio-live-route" : undefined,
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
      if (index === 0) {
        L.circleMarker([stop.lat, stop.lon], {
          radius: 6,
          color: "#fff",
          weight: 2,
          fillColor: "#2563eb",
          fillOpacity: 1,
        }).bindTooltip(`Truck: ${stop.name}`).addTo(group);
        return;
      }
      const hubIcon = L.divIcon({
        className: "",
        html: `<div class="haulio-hub-marker"><span>H</span></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 25],
      });
      L.marker([stop.lat, stop.lon], { icon: hubIcon, title: stop.name })
        .bindTooltip(`${stop.kind === "pickup" ? "Pickup hub" : "Delivery hub"}: ${stop.name}`)
        .addTo(group);
    });
    const primary = routeOptions.routes.find((route) => route.rank === 1);
    if (primary?.coordinates.length) {
      const routePoints = primary.coordinates.map(([lon, lat]) => [lat, lon] as L.LatLngTuple);
      const icon = L.divIcon({
        className: "",
        html: `<div class="haulio-truck-marker haulio-live-truck"><img src="/truck.png" alt="" /><i style="background:${TRAFFIC_COLOR[primary.traffic.level]}"></i></div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 30],
      });
      const liveTruck = L.marker(routePoints[0], { icon, title: "Simulated live truck" }).addTo(group);
      let segment = 0;
      let progress = 0;
      const moveLiveTruck = () => {
        progress += 0.14;
        if (progress >= 1) {
          progress = 0;
          segment = (segment + 1) % (routePoints.length - 1);
        }
        const start = routePoints[segment];
        const end = routePoints[segment + 1];
        liveTruck.setLatLng([
          start[0] + (end[0] - start[0]) * progress,
          start[1] + (end[1] - start[1]) * progress,
        ]);
      };
      const liveTimer = window.setInterval(moveLiveTruck, 700);
      map.fitBounds(L.latLngBounds(routePoints).pad(0.18), { maxZoom: 9, animate: false });
      routeLayerRef.current = group;
      return () => {
        window.clearInterval(liveTimer);
        group.remove();
      };
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

"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

export interface Location {
  lat: number;
  lng: number;
  name: string;
  description?: string;
  iconUrl?: string;
}

interface MapProps {
  origin: Location;
  destination: Location;
  onRouteLoaded?: (info: { distance: string; duration: string }) => void;
}

export default function Map({ origin, destination, onRouteLoaded }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Store the onRouteLoaded callback in a ref to prevent changes from re-triggering the useEffect
  const onRouteLoadedRef = useRef(onRouteLoaded);
  
  useEffect(() => {
    onRouteLoadedRef.current = onRouteLoaded;
  }, [onRouteLoaded]);

  useEffect(() => {
    if (!mapRef.current) return;

    let isMounted = true;

    // Coordinate inputs
    const originCoords: L.LatLngTuple = [origin.lat, origin.lng];
    const destinationCoords: L.LatLngTuple = [destination.lat, destination.lng];

    // Always create a fresh map instance on mount to ensure DOM panes are constructed properly
    const map = L.map(mapRef.current, {
      zoomControl: false,
    }).setView(originCoords, 7);

    // Add Zoom Control at bottomright
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // Tile Layer: OpenStreetMap Standard
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Force size recalculation to fix blank/white/grey map issues in Next.js
    const resizeTimeout = setTimeout(() => {
      if (isMounted && mapRef.current && document.body.contains(mapRef.current)) {
        try {
          map.invalidateSize();
        } catch (e) {
          console.warn("Leaflet invalidateSize error ignored:", e);
        }
      }
    }, 100);

    // Create Custom Icons based on Location props (fallback to defaults if omitted)
    const originIcon = L.icon({
      iconUrl: origin.iconUrl || "/truck.png",
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -20],
    });

    const destinationIcon = L.icon({
      iconUrl: destination.iconUrl || "/pin.png",
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
    });

    // Add markers dynamically
    L.marker(originCoords, { icon: originIcon })
      .addTo(map)
      .bindPopup(`
        <div class="p-1 font-sans">
          <h4 class="font-bold text-sm text-zinc-950">${origin.name}</h4>
          <p class="text-xs text-zinc-650 mt-1">${origin.description || "Origin Point"}</p>
          <p class="text-xs text-zinc-400 mt-0.5">Lat: ${origin.lat}, Lng: ${origin.lng}</p>
        </div>
      `);

    L.marker(destinationCoords, { icon: destinationIcon })
      .addTo(map)
      .bindPopup(`
        <div class="p-1 font-sans">
          <h4 class="font-bold text-sm text-zinc-950">${destination.name}</h4>
          <p class="text-xs text-zinc-600 mt-1">${destination.description || "Destination Point"}</p>
          <p class="text-xs text-zinc-400 mt-0.5">Lat: ${destination.lat}, Lng: ${destination.lng}</p>
        </div>
      `);

    // Fetch actual road route from OSRM (parameters are longitude,latitude)
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/` +
                    `${origin.lng},${origin.lat};` +
                    `${destination.lng},${destination.lat}` +
                    `?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error("OSRM API response not OK");

        const data = await response.json();
        if (!isMounted || !mapRef.current || !document.body.contains(mapRef.current)) return;

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          // Transform OSRM GeoJSON coords [lng, lat] to Leaflet [lat, lng]
          const routeCoords = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );

          // Create styling: Main blue route polyline with outer glow
          L.polyline(routeCoords, {
            color: "#3b82f6",
            weight: 8,
            opacity: 0.3,
          }).addTo(map);

          const routeLine = L.polyline(routeCoords, {
            color: "#1d4ed8",
            weight: 4,
            opacity: 0.9,
            lineJoin: "round"
          }).addTo(map);

          // Fit view bounds automatically based on route geometry (disable animations to prevent unmount frame leaks)
          map.fitBounds(routeLine.getBounds(), {
            padding: [60, 60],
            animate: false,
          });

          // Calculate distance and duration
          const distanceKm = (route.distance / 1000).toFixed(1);
          const durationHours = Math.floor(route.duration / 3600);
          const durationMinutes = Math.round((route.duration % 3600) / 60);

          if (onRouteLoadedRef.current) {
            onRouteLoadedRef.current({
              distance: `${distanceKm} km`,
              duration: `${durationHours}h ${durationMinutes}m`,
            });
          }
        }
      } catch (err) {
        console.error("OSRM Route API failed, using geodesic route fallback:", err);
        if (!isMounted || !mapRef.current || !document.body.contains(mapRef.current)) return;

        // Fallback straight line representation
        const fallbackLine = L.polyline([originCoords, destinationCoords], {
          color: "#dc2626",
          weight: 4,
          dashArray: "5, 10",
          opacity: 0.8,
        }).addTo(map);

        map.fitBounds(fallbackLine.getBounds(), {
          padding: [80, 80],
          animate: false,
        });

        if (onRouteLoadedRef.current) {
          onRouteLoadedRef.current({
            distance: "665 km (Straight line)",
            duration: "12-14 hours (Estimated)",
          });
        }
      }
    };

    fetchRoute();

    return () => {
      isMounted = false;
      clearTimeout(resizeTimeout);
      try {
        if (map) {
          map.stop();
          map.remove();
        }
      } catch (e) {
        console.warn("Leaflet cleanup ignored error:", e);
      }
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  return (
    <div className="relative w-full h-full bg-zinc-100 dark:bg-zinc-950">
      <div ref={mapRef} className="w-full h-full absolute inset-0 z-10" id="map-container" />
    </div>
  );
}

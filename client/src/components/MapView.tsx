import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DangerZone, SafePlace } from '../../../shared/types.js';
import { RouteResult } from '../services/routing.js';

interface MapViewProps {
  userLocation: [number, number];
  radiusKm: number;
  setRadiusKm?: (r: number) => void;
  dangerZones: DangerZone[];
  safePlaces: SafePlace[];
  routeResult?: RouteResult | null;
  onSelectSafePlaceForRoute?: (sp: SafePlace) => void;
  heightClass?: string;
}

export const MapView: React.FC<MapViewProps> = ({
  userLocation,
  radiusKm,
  setRadiusKm,
  dangerZones,
  safePlaces,
  routeResult,
  onSelectSafePlaceForRoute,
  heightClass = 'h-[500px]'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: userLocation,
        zoom: 14,
        zoomControl: true
      });

      // Public OpenStreetMap tile layer (Cached by Service Worker)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors | SafeStay'
      }).addTo(map);

      layersGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      // Map cleanup if component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map contents whenever props change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersGroupRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    // 1. User Location Marker & Accuracy/Safety Radius Circle
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-ping"></div>
          <div class="w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-[10px] font-black">
            ●
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const userMarker = L.marker(userLocation, { icon: userIcon }).bindPopup(`
      <div class="p-1 font-sans">
        <strong class="text-blue-600">Your Current Location</strong>
        <div class="text-xs text-gray-600 mt-1">Lat: ${userLocation[0].toFixed(4)}, Lng: ${userLocation[1].toFixed(4)}</div>
        <div class="text-[11px] text-gray-500 mt-0.5">Monitoring ${radiusKm} km crisis radius</div>
      </div>
    `);
    layers.addLayer(userMarker);

    // User Radius Circle (e.g. 5 km or adjustable)
    const radiusCircle = L.circle(userLocation, {
      radius: radiusKm * 1000,
      color: '#3b82f6',
      weight: 1.5,
      dashArray: '4, 8',
      fillColor: '#3b82f6',
      fillOpacity: 0.04
    });
    layers.addLayer(radiusCircle);

    // 2. Draw Danger Zones (Red, Amber, Green)
    dangerZones.forEach((zone) => {
      if (!zone.isActive) return;

      const isRed = zone.severity === 'red';
      const isAmber = zone.severity === 'amber';
      const color = isRed ? '#ef4444' : isAmber ? '#f59e0b' : '#10b981';

      if (zone.coordinates && zone.coordinates.length >= 3) {
        const polygon = L.polygon(zone.coordinates as L.LatLngExpression[], {
          color,
          weight: 2.5,
          fillColor: color,
          fillOpacity: isRed ? 0.28 : 0.18
        });

        polygon.bindPopup(`
          <div class="p-1 font-sans max-w-xs">
            <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase text-white ${
              isRed ? 'bg-red-600' : isAmber ? 'bg-amber-500 text-black' : 'bg-emerald-600'
            }">
              ${zone.hazardType.toUpperCase()} ${zone.severity.toUpperCase()} ALERT
            </span>
            <div class="font-bold text-sm text-gray-900 mt-1">${zone.name}</div>
            <div class="text-xs text-gray-700 mt-1 leading-snug">${zone.message}</div>
            <div class="text-[10px] text-gray-500 mt-1 border-t pt-1">
              Source: ${zone.source}
            </div>
          </div>
        `);
        layers.addLayer(polygon);
      } else if (zone.center && zone.radiusKm) {
        const circle = L.circle(zone.center as L.LatLngExpression, {
          radius: zone.radiusKm * 1000,
          color,
          weight: 2.5,
          fillColor: color,
          fillOpacity: isRed ? 0.28 : 0.18
        });
        circle.bindPopup(`
          <div class="p-1 font-sans max-w-xs">
            <div class="font-bold text-sm text-gray-900">${zone.name}</div>
            <div class="text-xs text-gray-700 mt-1">${zone.message}</div>
          </div>
        `);
        layers.addLayer(circle);
      }
    });

    // 3. Draw Safe Places (Shelters, Hospitals, High Ground, Rescue)
    safePlaces.forEach((sp) => {
      let iconColor = '#2563eb'; // blue for shelter
      let badge = '⛺';
      if (sp.type === 'hospital') {
        iconColor = '#dc2626';
        badge = '🏥';
      } else if (sp.type === 'high_ground') {
        iconColor = '#059669';
        badge = '⛰️';
      } else if (sp.type === 'rescue_center') {
        iconColor = '#d97706';
        badge = '🛡️';
      }

      const spIcon = L.divIcon({
        className: 'custom-safe-place',
        html: `
          <div style="background-color: ${iconColor};" class="w-7 h-7 rounded-full border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold hover:scale-110 transition-transform">
            ${badge}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const occupancyPct = Math.round((sp.currentOccupancy / sp.capacity) * 100);

      const marker = L.marker([sp.lat, sp.lng], { icon: spIcon });
      
      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans max-w-xs text-slate-900';
      popupContent.innerHTML = `
        <div class="text-[10px] uppercase font-bold text-slate-500">${sp.type.replace('_', ' ')}</div>
        <div class="font-bold text-sm text-slate-900 leading-snug">${sp.name}</div>
        <div class="text-xs text-slate-600 mt-0.5">${sp.address}</div>
        <div class="mt-2 text-xs">
          <div class="flex justify-between text-[11px] mb-1">
            <span>Occupancy:</span>
            <strong>${sp.currentOccupancy} / ${sp.capacity} (${occupancyPct}%)</strong>
          </div>
          <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
            <div class="bg-emerald-500 h-full rounded-full" style="width: ${Math.min(100, occupancyPct)}%"></div>
          </div>
        </div>
        <div class="mt-2 text-xs font-medium text-slate-700">
          Phone: <a href="tel:${sp.phone}" class="text-blue-600 underline font-bold">${sp.phone}</a>
        </div>
      `;

      if (onSelectSafePlaceForRoute) {
        const btn = document.createElement('button');
        btn.className = 'mt-2.5 w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-2 rounded-lg transition-colors';
        btn.innerText = 'Plan Safe Route Here';
        btn.onclick = () => {
          onSelectSafePlaceForRoute(sp);
          marker.closePopup();
        };
        popupContent.appendChild(btn);
      }

      marker.bindPopup(popupContent);
      layers.addLayer(marker);
    });

    // 4. Draw Route Polyline if present
    if (routeResult && routeResult.coordinates.length > 0) {
      const isRouteSafe = routeResult.isSafe;
      const routeColor = isRouteSafe ? '#10b981' : '#ef4444';

      const polyline = L.polyline(routeResult.coordinates as L.LatLngExpression[], {
        color: routeColor,
        weight: 5,
        opacity: 0.85
      });
      layers.addLayer(polyline);

      // If unsafe and alternate detour is available, show alternate dashed route
      if (!isRouteSafe && routeResult.alternateRoute && routeResult.alternateRoute.coordinates.length > 0) {
        const detourLine = L.polyline(routeResult.alternateRoute.coordinates as L.LatLngExpression[], {
          color: '#3b82f6',
          weight: 4,
          dashArray: '6, 8',
          opacity: 0.9
        });
        layers.addLayer(detourLine);
      }

      // Fit map bounds to encompass the route
      map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else {
      map.setView(userLocation, 14);
    }
  }, [userLocation, radiusKm, dangerZones, safePlaces, routeResult]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-700 shadow-xl bg-slate-900">
      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className={`w-full ${heightClass}`} />

      {/* Floating Radius Adjustment Slider */}
      {setRadiusKm && (
        <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white px-3 py-2 rounded-xl shadow-lg text-xs flex items-center gap-2.5">
          <span className="font-semibold text-slate-300">Safety Radar:</span>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-24 accent-blue-500 cursor-pointer"
          />
          <span className="font-bold text-blue-400 w-10 text-right">{radiusKm} km</span>
        </div>
      )}

      {/* Map Legend Pill */}
      <div className="absolute top-3 right-3 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white px-3 py-1.5 rounded-xl shadow-lg text-[11px] hidden sm:flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
          <span>Flood/Landslide Red</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span>Caution Amber</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
          <span>Shelter</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span>Safe Ridge</span>
        </div>
      </div>
    </div>
  );
};

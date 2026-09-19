import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Layers, MapPin, Compass, Navigation, Maximize2 } from 'lucide-react';

export default function GoogleMap({ processor, matches = [], selectedFarmId, onSelectFarm }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const circleRef = useRef(null);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite'

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const centerLat = processor?.location?.latitude || 30.9010;
    const centerLng = processor?.location?.longitude || 75.8573;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 9,
        scrollWheelZoom: false,
        attributionControl: false,
      });

      // Add Google Maps Roadmap Tiles
      const tileUrl =
        mapType === 'satellite'
          ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
          : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

      const tileLayer = L.tileLayer(tileUrl, {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      }).addTo(map);

      mapInstanceRef.current = { map, tileLayer };
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when mapType changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const { map, tileLayer } = mapInstanceRef.current;
    map.removeLayer(tileLayer);

    const newUrl =
      mapType === 'satellite'
        ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
        : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

    const newTileLayer = L.tileLayer(newUrl, {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    }).addTo(map);

    mapInstanceRef.current.tileLayer = newTileLayer;
  }, [mapType]);

  // Update Markers & Radius Circle when processor or matches change
  useEffect(() => {
    if (!mapInstanceRef.current || !processor) return;
    const { map } = mapInstanceRef.current;

    // Clear old markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    const pLat = Number(processor.location?.latitude);
    const pLng = Number(processor.location?.longitude);
    const radiusMeters = (Number(processor.max_distance_km) || 100) * 1000;

    if (isNaN(pLat) || isNaN(pLng)) return;

    // 1. Processor Plant Marker
    const processorIcon = L.divIcon({
      className: 'custom-processor-marker',
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 36px; height: 36px; background: rgba(37, 99, 235, 0.25); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="background: #1d4ed8; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 2.5px solid #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
            🏭
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const processorMarker = L.marker([pLat, pLng], { icon: processorIcon })
      .addTo(map)
      .bindPopup(`
        <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 2px;">
          <div style="font-weight: 800; color: #1e293b; font-size: 13px;">🏭 ${processor.company_name}</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">Demand: <strong>${processor.quantity_needed_tons * 10} Quintals (${processor.quantity_needed_tons} MT) ${processor.required_crop} (${processor.required_grade})</strong></div>
          <div style="color: #059669; font-size: 11px; font-weight: bold; margin-top: 2px;">Max Radius: ${processor.max_distance_km} km</div>
        </div>
      `);
    markersRef.current.push(processorMarker);

    // 2. Max Distance Boundary Circle
    const circle = L.circle([pLat, pLng], {
      radius: radiusMeters,
      color: '#059669',
      weight: 2,
      dashArray: '6, 6',
      fillColor: '#10b981',
      fillOpacity: 0.08,
    }).addTo(map);
    circleRef.current = circle;

    // 3. Farm Markers
    const bounds = L.latLngBounds([[pLat, pLng]]);

    matches.forEach((farm) => {
      const fLat = Number(farm.location?.latitude);
      const fLng = Number(farm.location?.longitude);
      if (isNaN(fLat) || isNaN(fLng)) return;

      bounds.extend([fLat, fLng]);

      let bgColor = '#f59e0b'; // moderate (amber)
      if (farm.compatibility_score >= 85) bgColor = '#10b981'; // optimal (emerald)
      if (!farm.is_within_radius) bgColor = '#ef4444'; // out of radius (red)

      const isSelected = selectedFarmId === farm.farmer_id;

      const farmIcon = L.divIcon({
        className: 'custom-farm-marker',
        html: `
          <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
            <div style="
              background: ${bgColor}; 
              color: #ffffff; 
              width: ${isSelected ? '30px' : '24px'}; 
              height: ${isSelected ? '30px' : '24px'}; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-size: ${isSelected ? '12px' : '10px'}; 
              font-weight: 800; 
              border: 2px solid #ffffff; 
              box-shadow: 0 3px 6px rgba(0,0,0,0.35);
              transition: all 0.2s ease;
            ">
              ${farm.rank}
            </div>
            <div style="
              background: rgba(15, 23, 42, 0.85); 
              color: #ffffff; 
              font-size: 9px; 
              font-weight: 700; 
              padding: 1px 4px; 
              border-radius: 4px; 
              margin-top: 2px; 
              white-space: nowrap;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            ">
              ${farm.compatibility_score}%
            </div>
          </div>
        `,
        iconSize: [32, 40],
        iconAnchor: [16, 20],
      });

      const farmMarker = L.marker([fLat, fLng], { icon: farmIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; min-width: 170px;">
            <div style="font-weight: 800; font-size: 13px; color: #0f172a;">#${farm.rank} ${farm.farmer_name}</div>
            <div style="display: inline-block; background: ${farm.compatibility_score >= 85 ? '#dcfce7' : '#fef3c7'}; color: ${farm.compatibility_score >= 85 ? '#166534' : '#92400e'}; padding: 2px 6px; border-radius: 4px; font-weight: 700; font-size: 10px; margin: 4px 0;">
              ${farm.compatibility_score}% Compatibility
            </div>
            <div style="color: #475569; font-size: 11px; margin-top: 2px;">📍 Distance: <strong>${farm.distance_km} km</strong></div>
            <div style="color: #475569; font-size: 11px;">🌱 Soil: <strong>${farm.soil_type}</strong> (${farm.total_acreage} Acres)</div>
          </div>
        `);

      farmMarker.on('click', () => {
        if (onSelectFarm) onSelectFarm(farm);
      });

      markersRef.current.push(farmMarker);
    });

    // Fit map bounds to show all markers comfortably
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [processor, matches, selectedFarmId]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col">
      {/* Map Control Bar */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-xs font-bold">
            🗺️
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Google Maps Agricultural GIS</span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.2 rounded-full font-mono border border-emerald-500/30">
                LIVE SAT-GPS
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              Center: {processor?.company_name || 'Consumer Hub'} &bull; Max Radius: {processor?.max_distance_km || 100} km
            </div>
          </div>
        </div>

        {/* Google Map Type Switcher */}
        <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMapType('roadmap')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              mapType === 'roadmap' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Google Road
          </button>
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              mapType === 'satellite' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
            }`}
          >
            Satellite / Hybrid
          </button>
        </div>
      </div>

      {/* Real Google Maps Tile Canvas */}
      <div ref={mapContainerRef} className="w-full h-[380px] z-0" />

      {/* Legend Footer */}
      <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-3 flex-wrap text-[11px]">
          <span className="flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block border border-white" /> Consumer Hub
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block border border-white" /> Optimal (85%+)
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block border border-white" /> Moderate
          </span>
          <span className="flex items-center gap-1 font-medium">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block border border-white" /> Out of Range
          </span>
        </div>
        <div className="text-[11px] font-mono text-emerald-700 font-bold hidden sm:block">
          {matches.length} Farms Plotted
        </div>
      </div>
    </div>
  );
}

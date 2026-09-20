import React, { useEffect, useRef, useState } from 'react';
import {
  Truck,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Gauge,
  Thermometer,
  Droplets,
  RotateCw,
  X,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Building2,
  ExternalLink
} from 'lucide-react';
import L from 'leaflet';

export default function DispatchTrackingModal({ delivery: initialDelivery, contract, onClose, onRefresh }) {
  const [delivery, setDelivery] = useState(initialDelivery || null);
  const [loading, setLoading] = useState(!initialDelivery);
  const [advancing, setAdvancing] = useState(false);
  const [error, setError] = useState(null);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const truckMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  // Fetch delivery details if needed or poll updates
  async function fetchDeliveryData() {
    try {
      let targetDeliveryId = delivery?.id;
      if (!targetDeliveryId && contract?.id) {
        const res = await fetch(`/api/deliveries?contract_id=${contract.id}`);
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          setDelivery(data.data[0]);
          return data.data[0];
        }
      } else if (targetDeliveryId) {
        const res = await fetch(`/api/deliveries/${targetDeliveryId}`);
        const data = await res.json();
        if (data.success && data.data) {
          setDelivery(data.data);
          return data.data;
        }
      }
    } catch (err) {
      console.error('Failed to fetch delivery telemetry:', err);
    } finally {
      setLoading(false);
    }
    return null;
  }

  useEffect(() => {
    fetchDeliveryData();
  }, [contract?.id]);

  // Advance checkpoint handler
  async function handleAdvanceStep() {
    if (!delivery?.id || advancing) return;
    setAdvancing(true);
    setError(null);
    try {
      const res = await fetch(`/api/deliveries/${delivery.id}/advance-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to advance route checkpoint');

      setDelivery(data.data);
      if (onRefresh) onRefresh(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setAdvancing(false);
    }
  }

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || !delivery) return;

    const farmLat = Number(delivery.farmer_location?.latitude) || 30.7046;
    const farmLng = Number(delivery.farmer_location?.longitude) || 75.8573;
    const procLat = Number(delivery.processor_location?.latitude) || 30.9010;
    const procLng = Number(delivery.processor_location?.longitude) || 75.8573;

    const truckLat = Number(delivery.current_latitude) || farmLat;
    const truckLng = Number(delivery.current_longitude) || farmLng;

    // Check if map already exists
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        scrollWheelZoom: true
      }).setView([truckLat, truckLng], 10);

      // Free standard OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(map);

      // Custom Origin Farm Icon
      const farmIcon = L.divIcon({
        className: 'origin-farm-icon',
        html: `
          <div style="background-color: #059669; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white; font-weight: bold; font-size: 16px;">
            🌾
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      // Custom Destination Silo Icon
      const siloIcon = L.divIcon({
        className: 'dest-silo-icon',
        html: `
          <div style="background-color: #4f46e5; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white; font-weight: bold; font-size: 16px;">
            🏭
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      // Custom Moving Truck Icon with pulsing radar beacon
      const truckIcon = L.divIcon({
        className: 'moving-truck-icon',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 44px; height: 44px; background: rgba(16, 185, 129, 0.35); border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: relative; background: #0f172a; color: #34d399; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid #34d399; box-shadow: 0 6px 14px rgba(0,0,0,0.4); font-size: 18px;">
              🚚
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      // Add Origin Marker
      L.marker([farmLat, farmLng], { icon: farmIcon })
        .addTo(map)
        .bindPopup(`<b>Origin: Farm Gate</b><br/>${delivery.farmer_name || 'Farmer Land'}<br/>${delivery.farmer_location?.address || 'Punjab Agri Belt'}`);

      // Add Destination Marker
      L.marker([procLat, procLng], { icon: siloIcon })
        .addTo(map)
        .bindPopup(`<b>Destination: Processing Mill Silo</b><br/>${delivery.processor_name || 'Agro Processor'}<br/>${delivery.processor_location?.address || 'Industrial Intake Hub'}`);

      // Route polyline
      const routePoints = [
        [farmLat, farmLng],
        [farmLat + (procLat - farmLat) * 0.33, farmLng + (procLng - farmLng) * 0.33],
        [farmLat + (procLat - farmLat) * 0.68, farmLng + (procLng - farmLng) * 0.68],
        [procLat, procLng]
      ];

      const polyline = L.polyline(routePoints, {
        color: '#059669',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8'
      }).addTo(map);

      routeLineRef.current = polyline;

      // Add Truck Marker
      const truckMarker = L.marker([truckLat, truckLng], { icon: truckIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <b style="color: #065f46;">🚚 Dispatched Freight Carrier</b><br/>
            <b>Driver:</b> ${delivery.driver_name || 'Jagtar Singh'}<br/>
            <b>Vehicle:</b> ${delivery.vehicle_number || 'PB-10-AZ-9981'}<br/>
            <b>Checkpoint:</b> ${delivery.current_checkpoint || 'In Transit'}<br/>
            <b>Speed:</b> ${delivery.speed_kmh} km/h | <b>ETA:</b> ${delivery.eta_minutes} mins
          </div>
        `)
        .openPopup();

      truckMarkerRef.current = truckMarker;
      mapInstanceRef.current = map;

      // Fit bounds to show entire route with padding
      const group = new L.featureGroup([
        L.marker([farmLat, farmLng]),
        L.marker([procLat, procLng]),
        truckMarker
      ]);
      map.fitBounds(group.getBounds().pad(0.2));
    } else {
      // Map exists, update truck position smoothly
      if (truckMarkerRef.current) {
        truckMarkerRef.current.setLatLng([truckLat, truckLng]);
        truckMarkerRef.current.setPopupContent(`
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4;">
            <b style="color: #065f46;">🚚 Dispatched Freight Carrier</b><br/>
            <b>Driver:</b> ${delivery.driver_name || 'Jagtar Singh'}<br/>
            <b>Vehicle:</b> ${delivery.vehicle_number || 'PB-10-AZ-9981'}<br/>
            <b>Checkpoint:</b> ${delivery.current_checkpoint || 'In Transit'}<br/>
            <b>Speed:</b> ${delivery.speed_kmh} km/h | <b>ETA:</b> ${delivery.eta_minutes} mins
          </div>
        `);
      }
      mapInstanceRef.current.panTo([truckLat, truckLng]);
    }

    // Leaflet map container dimension correction
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      // Cleanup on full unmount
    };
  }, [delivery]);

  // Clean up map when modal unmounts
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const checkpointsList = [
    {
      title: 'Farm Gate Dispatched',
      subtitle: 'Produce weighed, moisture sealed & loaded on truck',
      location: delivery?.farmer_location?.address || 'Ludhiana Farm Gate, Punjab'
    },
    {
      title: 'NH-44 Toll Plaza Checkpoint',
      subtitle: 'Fastag toll cleared, certified e-way bill checked',
      location: 'Khanna Bypass Highway'
    },
    {
      title: 'Grand Trunk Agro Corridor',
      subtitle: 'En route at steady highway cruise speed',
      location: 'Highway NH-44 Mile 128'
    },
    {
      title: 'Final Approach & Intake Queue',
      subtitle: 'Approaching processing facility industrial zone',
      location: 'Industrial Bypass Mandi Link'
    },
    {
      title: 'Arrived at Processing Mill Silo',
      subtitle: 'Final weighbridge tare verification & quality check',
      location: delivery?.processor_location?.address || 'Consumer Silo Intake Bay'
    }
  ];

  // Calculate current progress stage (0 to 4)
  const notesCount = delivery?.tracking_notes?.length || 1;
  const currentStage = delivery?.status === 'Delivered' ? 4 : Math.min(notesCount - 1, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/75 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-100 flex flex-col overflow-hidden my-auto max-h-[95vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-400/30">
              <Truck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Live Dispatch Location & Telemetry
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                  delivery?.status === 'Delivered'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse'
                }`}>
                  {delivery?.status || 'In Transit'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {contract?.crop || delivery?.crop || 'Agri Cargo'} &bull; Vehicle #{delivery?.vehicle_number || 'PB-10-AZ-9981'} &bull; Escrow 30% Verified
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchDeliveryData}
              title="Refresh GPS Telemetry"
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 text-xl font-bold cursor-pointer transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Real-time Telemetry Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Speed */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Gauge className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Current Speed</p>
                <p className="text-sm font-extrabold text-slate-800 font-mono">
                  {delivery?.speed_kmh ? `${delivery.speed_kmh} km/h` : '0 km/h'}
                </p>
              </div>
            </div>

            {/* ETA */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Estimated Arrival</p>
                <p className="text-sm font-extrabold text-slate-800 font-mono">
                  {delivery?.status === 'Delivered' ? 'Delivered' : `~${delivery?.eta_minutes ?? 35} mins`}
                </p>
              </div>
            </div>

            {/* IoT Cargo Temp */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Thermometer className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Cargo Temp</p>
                <p className="text-sm font-extrabold text-slate-800 font-mono">
                  23.5°C <span className="text-[10px] text-emerald-600 font-medium">Optimal</span>
                </p>
              </div>
            </div>

            {/* IoT Moisture */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Moisture Sensor</p>
                <p className="text-sm font-extrabold text-slate-800 font-mono">
                  11.8% <span className="text-[10px] text-emerald-600 font-medium">Safe</span>
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Leaflet GPS Map Container */}
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-inner relative">
            <div
              ref={mapContainerRef}
              style={{ height: '320px', width: '100%', zIndex: 1 }}
              className="bg-slate-100"
            />

            {/* Map Overlay Badge */}
            <div className="absolute top-3 right-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-slate-200 flex items-center gap-2 text-xs">
              <Navigation className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span className="font-mono text-[11px] font-bold text-slate-700">
                GPS: {Number(delivery?.current_latitude || 30.7046).toFixed(4)}°N, {Number(delivery?.current_longitude || 75.8573).toFixed(4)}°E
              </span>
            </div>

            {/* Active Checkpoint HUD Bar at bottom of map */}
            <div className="absolute bottom-3 left-3 right-3 z-10 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl text-white shadow-lg border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-slate-300 font-medium">Current Checkpoint:</span>
                <span className="font-bold text-white truncate">
                  {delivery?.current_checkpoint || 'Farm Gate Loading Bay, Punjab'}
                </span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold shrink-0 ml-2">
                Live Sat-Nav Active
              </span>
            </div>
          </div>

          {/* Driver & Logistics Info + Action */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Driver Profile */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between md:col-span-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-800 text-white font-black flex items-center justify-center text-sm shadow-md">
                  JS
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                    {delivery?.driver_name || 'Jagtar Singh'}
                  </h4>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <span>Ashok Leyland 16-Wheeler</span>
                    <span>&bull;</span>
                    <strong className="text-slate-700 font-mono">{delivery?.vehicle_number || 'PB-10-AZ-9981'}</strong>
                  </p>
                  <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                    Commercial Heavy Transport License Verified
                  </p>
                </div>
              </div>

              <a
                href={`tel:${delivery?.driver_phone || '+919814011223'}`}
                className="px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-xs shrink-0"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">{delivery?.driver_phone || '+91-98140-11223'}</span>
                <span className="sm:hidden">Call</span>
              </a>
            </div>

            {/* GPS Simulation Action */}
            <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Live GPS Simulator
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Test moving the truck forward along the route to next checkpoint.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAdvanceStep}
                disabled={advancing || delivery?.status === 'Delivered'}
                className={`mt-2 w-full py-2 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                  delivery?.status === 'Delivered'
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                {advancing ? (
                  <span>Updating GPS Ping...</span>
                ) : delivery?.status === 'Delivered' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Freight Delivered & Fulfilled</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Advance Route Checkpoint &rarr;</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stepper Timeline: Checkpoints */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald-700" />
              Dispatch Checkpoint Timeline
            </h4>

            <div className="space-y-3">
              {checkpointsList.map((cp, idx) => {
                const isPassed = idx < currentStage;
                const isCurrent = idx === currentStage;
                const isUpcoming = idx > currentStage;

                return (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition ${
                        isPassed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : isCurrent
                          ? 'bg-amber-500 border-amber-500 text-white animate-pulse'
                          : 'bg-white border-slate-300 text-slate-400'
                      }`}>
                        {isPassed ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      {idx < checkpointsList.length - 1 && (
                        <div className={`w-0.5 h-7 my-0.5 ${
                          isPassed ? 'bg-emerald-500' : 'bg-slate-200'
                        }`} />
                      )}
                    </div>

                    <div className="flex-1 pb-1">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-bold ${
                          isCurrent ? 'text-amber-800' : isPassed ? 'text-slate-800' : 'text-slate-400'
                        }`}>
                          {cp.title}
                          {isCurrent && (
                            <span className="ml-2 px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-md uppercase">
                              Current Location
                            </span>
                          )}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {cp.location}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {cp.subtitle}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Escrow Release & Settlement Info */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-extrabold text-emerald-950">
                Escrow Settlement Rule: 30% Advance Paid &bull; 70% Released on Delivery
              </p>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Upon vehicle arrival at the destination weighbridge and QA approval, the consumer confirms receipt to automatically release the remaining 70% balance directly into the farmer's verified bank account.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {delivery?.status === 'Delivered' ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Produce safely delivered & verified
              </span>
            ) : (
              <span>Telemetry refreshes automatically on GPS coordinate ping</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}

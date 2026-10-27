import React, { useState, useEffect } from 'react';
import {
  Truck,
  MapPin,
  Navigation,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Bell,
  RefreshCw,
  Compass,
  Layers,
  ArrowRight,
  ShieldAlert,
  Send,
  Zap,
  PhoneCall,
  Activity
} from 'lucide-react';
import { api } from '../../api/client';
import Badge from '../common/Badge';

export default function AiGpsTrackingPanel({ shipmentId = 'SHP-514975' }) {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [notificationSent, setNotificationSent] = useState(null);
  const [error, setError] = useState(null);

  const fetchTracking = async () => {
    try {
      const res = await api.getTrackingUpdates();
      if (res.success && res.data) {
        setTrackingData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to connect to telematics telemetry stream');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 6000); // 6s polling for real-time telemetry
    return () => clearInterval(interval);
  }, []);

  const handleSimulateDeviation = async () => {
    try {
      setSimulating(true);
      setError(null);
      const res = await api.simulateGpsDeviation({ shipmentId });
      if (res.success) {
        setTrackingData(prev => ({
          ...prev,
          telemetry: res.telemetry,
          activeAlerts: [res.alert, ...(prev?.activeAlerts || [])]
        }));
        setNotificationSent({
          title: '🚨 CRITICAL ALERT DISPATCHED TO DISPATCH CONTROL & OEM PORTAL',
          timestamp: new Date().toLocaleTimeString(),
          smsStatus: 'SENT TO LOGISTICS LEAD (+1-313-555-0194)',
          emailStatus: 'DISPATCHED TO compliance@bmwgroup.com & detroit-freight@dhl.com',
          coordinates: '48.3541° N, 11.7862° E',
          message: res.alert.message
        });
      }
    } catch (err) {
      setError(err.message || 'Deviation simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      await api.acknowledgeTrackingAlert({ alertId });
      setNotificationSent(null);
      fetchTracking();
    } catch (err) {
      console.error(err);
    }
  };

  const telemetry = trackingData?.telemetry || {
    status: 'ON_SCHEDULE',
    speedKmh: 68.4,
    currentLat: 48.1774,
    currentLng: 11.5583,
    corridorDeviationMeters: 0,
    lastPing: new Date().toISOString()
  };

  const isDeviated = telemetry.status === 'MISROUTED' || telemetry.corridorDeviationMeters > 1500;
  const activeAlerts = trackingData?.activeAlerts || [];
  const plannedRoute = trackingData?.plannedRoute || [];

  return (
    <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2 text-cyan-600 mb-1">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-mono uppercase font-bold tracking-wider">
              AI Telematics & High-Precision GPS Geofencing Engine
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Live Parcel GPS & Corridor Deviation Sentinel
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time automated tracking with instant anomaly notification if consignment deviates from authorized transit corridor.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleSimulateDeviation}
            disabled={simulating || isDeviated}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all shadow-xs ${
              isDeviated
                ? 'bg-rose-100 text-rose-800 border border-rose-300 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{simulating ? 'Simulating...' : isDeviated ? 'Breach Active' : 'Simulate GPS Corridor Breach'}</span>
          </button>

          <button
            onClick={fetchTracking}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title="Refresh Telemetry"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Push Notification Banner (When deviation is triggered) */}
      {notificationSent && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-500 text-rose-950 space-y-3 animate-fade-in shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm font-mono">
              <Bell className="w-5 h-5 animate-bounce" />
              <span>{notificationSent.title}</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-bold">
              {notificationSent.timestamp}
            </span>
          </div>

          <p className="text-xs text-slate-700 font-sans">
            {notificationSent.message}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-rose-200">
            <div className="flex items-center space-x-1.5 text-slate-700">
              <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>SMS Alert: <strong className="text-slate-900">{notificationSent.smsStatus}</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 text-slate-700">
              <Send className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span>Dispatch: <strong className="text-slate-900">{notificationSent.emailStatus}</strong></span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-mono text-rose-800">
              Last GPS coordinates locked at: <strong className="font-bold">{notificationSent.coordinates}</strong>
            </span>
            <button
              onClick={() => handleAcknowledge(activeAlerts[0]?.alertId)}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold transition-all"
            >
              Acknowledge & Clear Notification
            </button>
          </div>
        </div>
      )}

      {/* Real-time Telemetry Dashboard KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className={`p-3.5 rounded-2xl border transition-all ${
          isDeviated ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-[10px] uppercase text-slate-500 font-bold block">Status</span>
          <div className="flex items-center space-x-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${isDeviated ? 'bg-rose-600 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
            <strong className={`text-sm ${isDeviated ? 'text-rose-700' : 'text-emerald-700'}`}>
              {telemetry.status}
            </strong>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase text-slate-500 font-bold block">GPS Coordinates</span>
          <strong className="text-xs text-slate-900 mt-1 block font-mono">
            {telemetry.currentLat.toFixed(4)}° N, {telemetry.currentLng.toFixed(4)}° E
          </strong>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase text-slate-500 font-bold block">Transit Velocity</span>
          <strong className="text-sm text-slate-900 mt-1 block font-mono">
            {telemetry.speedKmh} km/h
          </strong>
        </div>

        <div className={`p-3.5 rounded-2xl border ${
          telemetry.corridorDeviationMeters > 0 ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-[10px] uppercase text-slate-500 font-bold block">Route Deviation</span>
          <strong className={`text-sm mt-1 block font-mono ${telemetry.corridorDeviationMeters > 0 ? 'text-rose-700' : 'text-slate-900'}`}>
            {(telemetry.corridorDeviationMeters / 1000).toFixed(2)} km
          </strong>
        </div>
      </div>

      {/* Visual GPS Waypoint Pipeline Map */}
      <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-4">
        <div className="flex items-center justify-between text-xs font-mono pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2 text-cyan-400 font-bold">
            <Compass className="w-4 h-4" />
            <span>Authorized Logistics Flight & Ground Corridor (Detroit &rarr; Munich)</span>
          </div>
          <span className="text-[10px] text-slate-400">Tolerance: 1.5 km Geofence</span>
        </div>

        <div className="relative pt-2 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {plannedRoute.map((wp, idx) => {
              const isCurrent = !isDeviated && idx === 3;
              const isBreached = isDeviated && idx === 3;

              return (
                <div
                  key={wp.step}
                  className={`p-3 rounded-xl border relative transition-all ${
                    isBreached
                      ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500 shadow-lg'
                      : isCurrent
                      ? 'bg-cyan-950/80 border-cyan-400 ring-1 ring-cyan-400'
                      : 'bg-slate-800/80 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="text-slate-400">Step {wp.step}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      wp.status === 'CLEARED' || wp.status === 'DEPARTED'
                        ? 'bg-emerald-900 text-emerald-300'
                        : isBreached
                        ? 'bg-rose-900 text-rose-300'
                        : 'bg-cyan-900 text-cyan-300'
                    }`}>
                      {isBreached ? 'DEV BREACH' : wp.status}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white leading-snug">{wp.name}</p>
                  <span className="text-[9px] font-mono text-slate-400 block mt-1">
                    {wp.lat.toFixed(2)}°N, {wp.lng.toFixed(2)}°E
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Deviation Warning Alert when parcel is lost/misrouted */}
        {isDeviated && (
          <div className="p-3.5 rounded-xl bg-rose-900/40 border border-rose-500 text-rose-200 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
              <div>
                <strong className="text-white block">GPS Geofence Violation Detected!</strong>
                <span>Parcel drift: 14.82 km north of A9 highway corridor near Munich North.</span>
              </div>
            </div>
            <span className="text-[10px] px-2.5 py-1 rounded bg-rose-600 text-white font-bold">
              SIGNAL TRACKED
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

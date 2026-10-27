import React, { useState, useEffect } from 'react';
import {
  Camera,
  Scan,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  Zap,
  Activity,
  Box,
  Truck,
  Eye,
  Sliders,
  Check
} from 'lucide-react';
import { api } from '../../api/client';

export default function MvtecVisionPanel({ onInspectionComplete }) {
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('mvtec-cable-cut-inner');
  const [autoQuarantine, setAutoQuarantine] = useState(true);
  const [inspecting, setInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [showMask, setShowMask] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadSamples() {
      try {
        const res = await api.getMvtecSamples();
        if (res.success && Array.isArray(res.data)) {
          setSamples(res.data);
        }
      } catch (err) {
        console.warn('Failed to load MVTec samples:', err);
      }
    }
    loadSamples();
  }, []);

  const currentSample = samples.find(s => s.id === selectedSampleId) || samples[0];

  const handleRunInspection = async () => {
    if (!currentSample) return;
    try {
      setInspecting(true);
      setError(null);
      const res = await api.runMvtecInspection({
        sampleId: currentSample.id,
        autoQuarantine,
        operator: 'MVTec Optical AI Sensor Bay 4'
      });
      if (res.success) {
        setInspectionResult(res);
        if (onInspectionComplete) {
          onInspectionComplete(res);
        }
      } else {
        throw new Error(res.error || 'Inspection failed');
      }
    } catch (err) {
      setError(err.message || 'Error executing MVTec AI vision inspection');
    } finally {
      setInspecting(false);
    }
  };

  return (
    <div className="industrial-card p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20">
            <Scan className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                MVTec AI Vision Anomaly Detection
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                BENCHMARK DATASET
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Optical inspection photos & defect segmentation masks linked directly to material batch genealogy & blast radius.
            </p>
          </div>
        </div>

        {/* Category Switcher Pill */}
        <div className="flex flex-wrap gap-1.5">
          {samples.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSelectedSampleId(s.id);
                setInspectionResult(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                selectedSampleId === s.id
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="capitalize">{s.category}</span>: {s.anomalyType.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {currentSample && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 5 COLS: Optical Inspection Photos & Anomaly Mask */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-cyan-600" />
                <span>Station Camera View</span>
              </span>

              {currentSample.maskPath && (
                <button
                  type="button"
                  onClick={() => setShowMask(!showMask)}
                  className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showMask ? 'Hide Anomaly Mask' : 'Show Anomaly Mask'}</span>
                </button>
              )}
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-md aspect-square flex items-center justify-center group">
              {/* Base Camera Image */}
              <img
                src={currentSample.imagePath}
                alt={currentSample.displayName}
                className="w-full h-full object-contain"
              />

              {/* Anomaly Segmentation Mask Overlay */}
              {showMask && currentSample.maskPath && (
                <img
                  src={currentSample.maskPath}
                  alt="Anomaly Segmentation Mask"
                  className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-75 filter drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                  style={{ filter: 'hue-rotate(300deg) saturate(3) brightness(1.2)' }}
                />
              )}

              {/* Status Badge Tag */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-xl text-xs font-mono font-bold backdrop-blur-md border shadow-sm flex items-center space-x-1.5 bg-slate-900/80 text-white border-slate-700">
                <span className={`w-2 h-2 rounded-full ${currentSample.severity === 'NORMAL' ? 'bg-emerald-400' : 'bg-rose-500 animate-ping'}`} />
                <span>ANOMALY: {currentSample.anomalyType.toUpperCase()}</span>
              </div>
            </div>

            <div className="text-center text-[11px] font-mono text-slate-400">
              MVTec Sample &bull; Resolution: 1024 &times; 1024 &bull; Camera Sensor: CMOS-Sony-IMX485
            </div>
          </div>

          {/* RIGHT 7 COLS: Real-Time Telemetry & Traceability Blast Radius Trigger */}
          <div className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase">Inspected Entity:</span>
                <span className="font-mono font-extrabold text-sm text-cyan-700">{currentSample.batchId}</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">{currentSample.displayName}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{currentSample.riskDescription}</p>
            </div>

            {/* Metric Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Severity</span>
                <span className={`text-base font-extrabold ${currentSample.severity === 'CRITICAL' ? 'text-rose-600' : (currentSample.severity === 'HIGH' ? 'text-amber-600' : 'text-emerald-600')}`}>
                  {currentSample.severity}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">AI Confidence</span>
                <span className="text-base font-extrabold text-slate-900">
                  {(currentSample.confidenceScore * 100).toFixed(1)}%
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Affected Pixels</span>
                <span className="text-base font-extrabold text-slate-900">
                  {currentSample.anomalyAreaPixels} px
                </span>
              </div>
            </div>

            {/* Downstream Traceability Mapping Preview */}
            <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-800 font-mono text-[11px] uppercase tracking-wider block">
                Connected Downstream Chain of Custody:
              </span>
              <div className="space-y-1.5 font-mono text-[11px] text-slate-600">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-600" />
                  <span><strong>Component:</strong> {currentSample.componentId} ({currentSample.componentName})</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span><strong>Assembly:</strong> {currentSample.assemblyId}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span><strong>Electric Motors:</strong> {currentSample.productIds.join(', ')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span><strong>Outbound Shipment:</strong> {currentSample.shipmentId}</span>
                </div>
              </div>
            </div>

            {/* Actions: Run AI Inspection & Calculate Blast Radius */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <label className="flex items-center space-x-2 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoQuarantine}
                  onChange={(e) => setAutoQuarantine(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Automatically trigger 8D containment & quarantine hold</span>
              </label>

              <button
                type="button"
                onClick={handleRunInspection}
                disabled={inspecting}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{inspecting ? 'Executing AI Traversal...' : 'Run Anomaly Inspection & Blast Radius'}</span>
              </button>
            </div>

            {/* Live Success Banner */}
            {inspectionResult && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Inspection Completed in {inspectionResult.traversalLatencyMs}ms</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-200 text-emerald-800">
                    BLAST RADIUS LOCKED
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Batch <strong>{inspectionResult.inspection.displayName}</strong> linked into genealogy database. Identified {inspectionResult.blastRadius.impactedProducts.length} motor(s) and {inspectionResult.blastRadius.impactedShipments.length} shipment(s).
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

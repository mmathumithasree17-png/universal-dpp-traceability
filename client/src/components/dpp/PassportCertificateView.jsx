import React from 'react';
import {
  QrCode,
  Zap,
  Leaf,
  ShieldCheck,
  Truck,
  Box,
  Layers,
  Cpu,
  History,
  Printer,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  ChevronRight,
  Wrench,
  MapPin,
} from 'lucide-react';
import Badge from '../common/Badge';
import QrCodeDisplay from './QrCodeDisplay';
import PassportTimeline from './PassportTimeline';

export default function PassportCertificateView({ passportData, onSelectRelated }) {
  if (!passportData) return null;

  const {
    product,
    assembly,
    components = [],
    materialBatches = [],
    shipment,
    manufacturingEvents = [],
    auditRecords = [],
    qualityInspections = [],
    reworkHistory = [],
    verification,
  } = passportData;

  const handlePrint = () => {
    window.print();
  };

  const isQuarantined = product.status === 'QUARANTINED';
  // Ensure QR code always encodes a reachable URL for phones on the network
  const qrValue = (() => {
    if (product.passportUrl && !product.passportUrl.includes('dpp.aerodrive.com')) {
      return product.passportUrl;
    }
    const lanIp = '10.1.0.173';
    const port = window.location.port || '5001';
    const host = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? `${lanIp}:${port}`
      : window.location.host;
    return `${window.location.protocol}//${host}/dpp?id=${product.passportId}`;
  })();

  return (
    <div className="space-y-6 printable-passport">
      {/* Top Header Card */}
      <div className={`industrial-card p-6 md:p-8 rounded-2xl relative overflow-hidden border ${
        isQuarantined ? 'border-rose-500/50 bg-rose-950/10' : 'border-cyan-500/40'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 font-bold">
                {product.passportId}
              </span>
              <Badge text={product.status} />
              <span className="text-[11px] font-mono text-slate-400">
                EU CIRPASS COMPLIANT &bull; ESPR 2024/1781
              </span>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                {product.modelName}
              </h1>
              <p className="text-sm font-mono text-cyan-400 mt-1">
                Serial Number: <strong className="text-white">{product.serialNumber}</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Category: {product.productCategory} &bull; Facility: {product.facilityLocation}
              </p>
            </div>

            {/* Quarantine alert if quarantined */}
            {isQuarantined && (
              <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/60 text-rose-200 text-xs font-mono space-y-1">
                <div className="flex items-center space-x-2 font-bold text-rose-300">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>QUALITY CONTAINMENT LOCK ACTIVE</span>
                </div>
                <p className="text-slate-300 font-sans">
                  {product.quarantineReason || 'Suspect anomaly detected in component material chain. Not cleared for commercial deployment.'}
                </p>
              </div>
            )}
          </div>

          {/* QR Code and Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-4 shrink-0">
            <QrCodeDisplay
              value={qrValue}
              passportId={product.passportId}
              modelName={product.modelName}
            />

            <button
              onClick={handlePrint}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-mono text-xs font-bold transition-all shadow-panel"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Specifications & Sustainability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical Specifications */}
        <div className="industrial-card p-5 rounded-xl border border-navy-700/80 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-800">
            <Zap className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Powertrain Technical Specifications
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800">
              <span className="text-[10px] font-mono text-slate-400">RATED POWER</span>
              <p className="text-base font-bold font-mono text-white mt-1">
                {product.specifications?.ratedPowerKw} kW
              </p>
            </div>
            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800">
              <span className="text-[10px] font-mono text-slate-400">MAX RPM</span>
              <p className="text-base font-bold font-mono text-white mt-1">
                {product.specifications?.maxRpm} RPM
              </p>
            </div>
            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800">
              <span className="text-[10px] font-mono text-slate-400">PEAK TORQUE</span>
              <p className="text-base font-bold font-mono text-white mt-1">
                {product.specifications?.peakTorqueNm} Nm
              </p>
            </div>
            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800">
              <span className="text-[10px] font-mono text-slate-400">NOMINAL VOLTAGE</span>
              <p className="text-base font-bold font-mono text-white mt-1">
                {product.specifications?.nominalVoltageV || 800} V
              </p>
            </div>
            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800">
              <span className="text-[10px] font-mono text-slate-400">EFFICIENCY CLASS</span>
              <p className="text-base font-bold font-mono text-emerald-400 mt-1">
                {product.specifications?.efficiencyRating}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800">
              <span className="text-[10px] font-mono text-slate-400">TOTAL WEIGHT</span>
              <p className="text-base font-bold font-mono text-white mt-1">
                {product.specifications?.totalWeightKg || 48.5} kg
              </p>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Cooling Method: <span className="text-slate-200">{product.specifications?.coolingMethod}</span>
          </div>
        </div>

        {/* ESG Circularity & EU Compliance */}
        <div className="industrial-card p-5 rounded-xl border border-navy-700/80 space-y-4">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-800">
            <Leaf className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              ESG Circularity & EU DPP Compliance
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800">
              <span className="text-[10px] font-mono text-slate-400">CARBON FOOTPRINT</span>
              <p className="text-base font-bold font-mono text-white mt-1">
                {product.sustainability?.totalCarbonFootprintKgCO2e} kg CO2e
              </p>
            </div>
            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800">
              <span className="text-[10px] font-mono text-slate-400">RECYCLED CONTENT</span>
              <p className="text-base font-bold font-mono text-cyan-300 mt-1">
                {product.sustainability?.recycledMaterialPercentage}%
              </p>
            </div>
            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800">
              <span className="text-[10px] font-mono text-slate-400">RECYCLABILITY RATE</span>
              <p className="text-base font-bold font-mono text-emerald-400 mt-1">
                {product.sustainability?.recyclabilityRatePercentage}%
              </p>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-400">Repairability Score:</span>
              <span className="font-mono font-semibold text-emerald-400">
                {product.sustainability?.repairabilityScore || 'Class A'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-navy-800">
              {(product.complianceCertificates || []).map((c) => (
                <span key={c} className="px-2 py-0.5 rounded bg-navy-900 border border-navy-700 text-[10px] font-mono text-slate-300">
                  ✓ {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Repair, Recycling & Trace Contact Address */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Repair & Circular Recycling */}
        <div className="industrial-card p-5 rounded-xl border border-navy-700/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-800">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Repair Guidelines & Circular Recycling Instructions
            </h2>
          </div>
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800 space-y-1">
              <span className="font-bold text-white font-mono text-[11px] block">MODULAR DISASSEMBLY & REPAIR PROTOCOL</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Stator hairpin subassembly easily separates via 4x M10 guide fixings. Rotor bearings disengage with standard hydraulic mechanical extraction (Tool #AP-PULL-12).
              </p>
              <div className="text-[10px] font-mono text-cyan-400 pt-1">
                Disassembly Reference: DOC-ESPR-DISASM-2026-V2 &bull; Design Life: 350,000 km
              </div>
            </div>
            <div className="p-3 rounded-lg bg-navy-950/80 border border-navy-800 space-y-1">
              <span className="font-bold text-emerald-400 font-mono text-[11px] block">END-OF-LIFE RECOVERY & MATERIAL RECLAMATION (97.2%)</span>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Rare earth NdFeB permanent magnets reclaimable via thermal demagnetization (350°C oven ramp). High-purity copper windings reclaimable via inert-gas induction melting.
              </p>
              <div className="text-[10px] font-mono text-emerald-300 pt-1">
                Authorized Circular Partner: CircuVolt European Recycling Facility, Essen, Germany
              </div>
            </div>
          </div>
        </div>

        {/* Trace Contact & Manufacturer Physical Address */}
        <div className="industrial-card p-5 rounded-xl border border-navy-700/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-800">
            <MapPin className="w-4 h-4 text-gold-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Manufacturer Trace Contact & Facility Address
            </h2>
          </div>
          <div className="p-4 rounded-lg bg-navy-950/80 border border-navy-800 space-y-3 text-xs">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-bold text-white font-mono text-sm block">AeroDrive Powertrains Inc.</span>
                <span className="text-slate-400 text-xs">Advanced Electric Propulsion Division</span>
              </div>
              <Badge text="AUTHORIZED OEM" size="xs" />
            </div>
            <div className="text-[11px] font-mono text-slate-300 space-y-1.5 pt-2 border-t border-navy-800">
              <p><strong className="text-slate-400">Manufacturing Facility:</strong> {product.facilityLocation || 'Gigafactory Cleanroom Plant 4 - Detroit, MI'}</p>
              <p><strong className="text-slate-400">Physical Address:</strong> 4800 Industrial Parkway, Cleanroom Sector 4B, Detroit, MI 48209, USA</p>
              <p><strong className="text-slate-400">Regulatory Lead:</strong> Dr. Elena Vance (Head of Provenance & CIRPASS Verification)</p>
              <p><strong className="text-slate-400">Official Contact:</strong> dpp-compliance@aerodrive.com &bull; Tel: +1 (313) 555-0194</p>
              <p><strong className="text-slate-400">EU Representative:</strong> AeroDrive Europe GmbH, Magna-Allee 12, 70567 Stuttgart (AEO: DE AEOF 104822)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Assembly & Logistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assembly Line Information */}
        <div className="industrial-card p-5 rounded-xl border border-navy-700/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-800">
            <Cpu className="w-4 h-4 text-gold-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Assembly Information & Quality Checks
            </h2>
          </div>

          {assembly ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-gold-400">{assembly.assemblyId}</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{assembly.assemblyName}</p>
                </div>
                <Badge text={assembly.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-navy-950 border border-navy-800">
                  <span className="text-slate-400 block">Assembly Line:</span>
                  <span className="text-white font-bold">{assembly.assemblyLine}</span>
                </div>
                <div className="p-2 rounded bg-navy-950 border border-navy-800">
                  <span className="text-slate-400 block">Operator:</span>
                  <span className="text-white font-bold">{assembly.operator}</span>
                </div>
                <div className="p-2 rounded bg-navy-950 border border-navy-800">
                  <span className="text-slate-400 block">Housing Torque:</span>
                  <span className="text-cyan-300 font-bold">{assembly.qualityChecks?.torqueCheckNm || 125.4} Nm</span>
                </div>
                <div className="p-2 rounded bg-navy-950 border border-navy-800">
                  <span className="text-slate-400 block">Insulation Resistance:</span>
                  <span className="text-emerald-400 font-bold">{assembly.qualityChecks?.insulationResistanceMOhm || 980} MΩ</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-mono">No assembly record connected.</p>
          )}
        </div>

        {/* Shipment Records & Destinations */}
        <div className="industrial-card p-5 rounded-xl border border-navy-700/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-800">
            <Truck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Logistics & Shipment Records
            </h2>
          </div>

          {shipment ? (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-emerald-400">{shipment.shipmentId}</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{shipment.destinationClient}</p>
                </div>
                <Badge text={shipment.shippingStatus} />
              </div>

              <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Carrier:</span>
                  <span className="text-white font-bold">{shipment.carrier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tracking Number:</span>
                  <span className="text-cyan-300 font-bold">{shipment.trackingNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Destination Address:</span>
                  <span className="text-slate-200 text-right truncate max-w-xs">{shipment.destinationAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dispatched Date:</span>
                  <span className="text-slate-200">{new Date(shipment.dispatchDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-lg bg-navy-950/60 border border-navy-800 text-center text-xs font-mono text-slate-400">
              <Truck className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              Not yet assigned to an active carrier shipment. (Stored in Factory Inventory Cleanroom).
            </div>
          )}
        </div>
      </div>

      {/* Connected Components & Raw Material Provenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Components */}
        <div className="industrial-card p-5 rounded-xl border border-navy-700/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-800">
            <Box className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Connected Sub-Components ({components.length})
            </h2>
          </div>

          <div className="space-y-2">
            {components.map((c) => (
              <div key={c.componentId} className="p-3 rounded-lg bg-navy-950/70 border border-navy-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-300">{c.componentId}</span>
                  <Badge text={c.status} size="xs" />
                </div>
                <p className="text-white font-medium mt-1">{c.componentName}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>SN: {c.serialNumber || 'N/A'}</span>
                  <span>Type: {c.componentType}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Source Material Batches */}
        <div className="industrial-card p-5 rounded-xl border border-navy-700/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-800">
            <Layers className="w-4 h-4 text-gold-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Source Raw Material Batches ({materialBatches.length})
            </h2>
          </div>

          <div className="space-y-2">
            {materialBatches.map((b) => (
              <div key={b.batchId} className="p-3 rounded-lg bg-navy-950/70 border border-navy-800 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-gold-400">{b.batchId}</span>
                  <Badge text={b.status} size="xs" />
                </div>
                <p className="text-white font-medium mt-1">{b.materialName}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Supplier: {b.supplierName}</span>
                  <span>Lot: {b.supplierLotNumber}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quality Inspections & Rework History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quality Inspections */}
        <div className="industrial-card p-5 rounded-xl border border-navy-700/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Quality Inspections & Verification Results
            </h2>
          </div>

          <div className="space-y-2 text-xs">
            {qualityInspections.map((insp, i) => (
              <div key={insp.inspectionId || i} className="p-3 rounded-lg bg-navy-950 border border-navy-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-300">{insp.inspectionId}</span>
                  <Badge text={insp.result} size="xs" />
                </div>
                <p className="text-slate-300 font-sans">{insp.notes}</p>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-navy-850">
                  <span>Inspector: {insp.inspector}</span>
                  <span>{insp.station}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rework History */}
        <div className="industrial-card p-5 rounded-xl border border-navy-700/80 space-y-3">
          <div className="flex items-center space-x-2 pb-2 border-b border-navy-800">
            <History className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Rework History & Containment Actions
            </h2>
          </div>

          {reworkHistory.length === 0 ? (
            <div className="p-6 rounded-lg bg-navy-950/60 border border-navy-800 text-center text-xs font-mono text-emerald-400">
              ✓ ZERO REWORKS REQUIRED. Passed first-time-through factory yield benchmarks.
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {reworkHistory.map((rwk, i) => (
                <div key={rwk.reworkId || i} className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-purple-300">{rwk.reworkId}</span>
                    <Badge text={rwk.result} size="xs" />
                  </div>
                  <p className="text-slate-300 font-sans">{rwk.actionTaken}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-navy-850">
                    <span>Tech: {rwk.technician}</span>
                    <span>Verified: {rwk.verifiedBy}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chronological Manufacturing Journey Timeline */}
      <div className="industrial-card p-6 rounded-xl border border-navy-700/80 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-navy-800">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                Manufacturing Journey Timeline
              </h2>
              <p className="text-xs text-slate-400">
                End-to-end chronological lifecycle telemetry from laser stamping to final customer dispatch.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            {manufacturingEvents.length} Events Tracked
          </span>
        </div>

        <PassportTimeline events={manufacturingEvents} />
      </div>

      {/* Audit & Integrity Cryptographic Proof (Clean Seal) */}
      <div className="industrial-card p-5 rounded-xl border border-cyan-500/30 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-navy-800">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Cryptographic Integrity & Tamper-Evident Verification
            </h2>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>AUTHENTICATED BY MES LEDGER</span>
          </span>
        </div>

        <div className="p-3 rounded-lg bg-navy-950 border border-navy-800 font-mono text-xs space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
            <span className="text-slate-400">Standard: {verification?.standard || 'EU ESPR / CIRPASS DPP-2024'}</span>
            <span className="text-cyan-400">Status: {verification?.signatureStatus || 'AUTHENTICATED'}</span>
          </div>
          <div className="text-[10px] text-slate-400 break-all">
            SHA-256 Provenance Hash: <strong className="text-white">{verification?.tamperEvidentHash}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { 
  Activity, 
  CheckCircle2, 
  AlertOctagon, 
  ShieldAlert, 
  Truck, 
  Box, 
  Cpu, 
  Zap, 
  Calendar, 
  Layers, 
  CheckCheck, 
  XCircle, 
  Wrench, 
  FileText,
  ArrowRight
} from 'lucide-react';
import Badge from '../common/Badge';

const EVENT_ICONS = {
  // Material events
  MATERIAL_RECEIVED: Box,
  MATERIAL_RECEIPT: Box,
  MATERIAL_INSPECTED: Layers,
  MATERIAL_APPROVED: CheckCircle2,
  MATERIAL_REJECTED: XCircle,
  // Component manufacturing events
  COMPONENT_MANUFACTURED: Cpu,
  COMPONENT_MACHINED: Cpu,
  COMPONENT_INSPECTED: Layers,
  STAMPING: Cpu,
  WINDING: Zap,
  IMPREGNATION: Activity,
  ROTOR_BALANCING: Activity,
  // Rework
  REWORK_STARTED: Wrench,
  REWORK_COMPLETED: CheckCheck,
  // Assembly
  ASSEMBLY_STARTED: Cpu,
  ASSEMBLY_COMPLETED: Cpu,
  FINAL_ASSEMBLY: Box,
  // Inspection & Testing
  FINAL_QUALITY_INSPECTION: CheckCircle2,
  DYNO_TESTING: Zap,
  // Product status
  PRODUCT_APPROVED: CheckCircle2,
  PRODUCT_QUARANTINED: ShieldAlert,
  QUARANTINE_TRIGGERED: ShieldAlert,
  // Shipping & Dispatch
  SHIPMENT_CREATED: Box,
  SHIPMENT_DISPATCHED: Truck,
  PACKAGING: Box,
  DISPATCH: Truck,
  // Defects & CAPA
  DEFECT_DISCOVERED: AlertOctagon,
  DEFECT_DETECTED: AlertOctagon,
  CORRECTIVE_ACTION_RECORDED: CheckCheck,
};

export default function PassportTimeline({ events = [] }) {
  if (!events || events.length === 0) {
    return (
      <div className="p-8 text-center text-xs font-mono text-slate-500 bg-navy-950/40 rounded-xl border border-navy-800">
        No shop floor timeline events registered for this unit yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-navy-700 before:to-emerald-500">
      {events.map((evt, idx) => {
        const Icon = EVENT_ICONS[evt.eventType] || Activity;
        const isAlert = evt.status === 'ALERT' || evt.status === 'FAILED' || evt.inspectionResult === 'FAILED' || evt.eventType.includes('QUARANTINE') || evt.eventType.includes('REJECTED') || evt.eventType.includes('DEFECT');
        const isSuccess = evt.status === 'SUCCESS' || evt.inspectionResult === 'PASSED';

        return (
          <div key={evt._id || evt.eventId || idx} className="relative group">
            {/* Timeline node icon */}
            <div
              className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-125 ${
                isAlert
                  ? 'bg-rose-950 border-rose-500 text-rose-400'
                  : isSuccess
                  ? 'bg-navy-900 border-cyan-400 text-cyan-300'
                  : 'bg-navy-900 border-slate-600 text-slate-400'
              }`}
            >
              <Icon className="w-3 h-3" />
            </div>

            {/* Event Content Card */}
            <div className={`p-4 rounded-xl border text-xs transition-all ${
              isAlert 
                ? 'bg-rose-950/20 border-rose-500/40' 
                : 'bg-navy-950/60 border-navy-800 hover:border-navy-700'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-navy-800/80">
                <div className="flex items-center space-x-2 flex-wrap">
                  <span className="font-mono font-bold text-cyan-400">{evt.eventId}</span>
                  <span className="font-semibold text-white uppercase">{evt.eventType}</span>
                  <Badge text={evt.status} size="xs" />
                  {evt.inspectionResult && evt.inspectionResult !== 'N/A' && (
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      evt.inspectionResult === 'PASSED'
                        ? 'bg-emerald-950/50 text-emerald-400 border-emerald-500/40'
                        : evt.inspectionResult === 'FAILED'
                        ? 'bg-rose-950/50 text-rose-400 border-rose-500/40'
                        : 'bg-amber-950/50 text-amber-400 border-amber-500/40'
                    }`}>
                      INSP: {evt.inspectionResult}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>{new Date(evt.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Status Transition Badge if available */}
              {(evt.previousStatus || evt.resultingStatus) && (
                <div className="mt-2 flex items-center space-x-2 text-[11px] font-mono">
                  <span className="text-slate-400">State Transition:</span>
                  <span className="px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300">
                    {evt.previousStatus || 'ORIGINAL'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                  <span className={`px-1.5 py-0.5 rounded border font-semibold ${
                    evt.resultingStatus === 'QUARANTINED' || evt.resultingStatus === 'DEFECTIVE'
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                      : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                  }`}>
                    {evt.resultingStatus}
                  </span>
                </div>
              )}

              {/* Remarks / Notes */}
              <div className="mt-2 text-slate-300 font-sans">
                {evt.remarks || evt.notes}
              </div>

              {/* Defect details if any */}
              {evt.defectDetails && (
                <div className="mt-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-[11px] font-mono leading-relaxed">
                  <strong className="text-rose-200">Defect Detail:</strong>{' '}
                  {typeof evt.defectDetails === 'object' ? (
                    <span>
                      {evt.defectDetails.anomalyType || evt.defectDetails.defectId || 'Flagged Non-Conformance'}
                      {evt.defectDetails.confidenceScore
                        ? ` (Confidence: ${(evt.defectDetails.confidenceScore * 100).toFixed(1)}%)`
                        : ''}
                      {evt.defectDetails.anomalyAreaPixels ? ` • Area: ${evt.defectDetails.anomalyAreaPixels}px` : ''}
                    </span>
                  ) : (
                    String(evt.defectDetails)
                  )}
                </div>
              )}

              {/* Station, Machine, Operator & Recorded Telemetry */}
              <div className="mt-2.5 pt-2 border-t border-navy-800/60 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-400 gap-2">
                <span>
                  Station: <strong className="text-white">{evt.station}</strong>
                  {evt.machine && evt.machine !== evt.station && (
                    <> &bull; Machine: <strong className="text-cyan-300">{evt.machine}</strong></>
                  )}
                  &bull; Operator: {evt.operator || 'Automated Line'}
                </span>

                {evt.supportingEvidence && (
                  <span className="flex items-center space-x-1 text-cyan-400">
                    <FileText className="w-3 h-3" />
                    <span>Evidence Attached</span>
                  </span>
                )}

                {evt.parametersRecorded && Object.keys(evt.parametersRecorded).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(evt.parametersRecorded).map(([k, v]) => (
                      <span key={k} className="px-1.5 py-0.5 rounded bg-navy-900 border border-navy-700 text-cyan-300">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import React, { useState } from 'react';
import {
  X,
  Database,
  Trash2,
  Upload,
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Layers,
  Box,
  Truck,
  QrCode,
} from 'lucide-react';
import { api } from '../../api/client';

const SAMPLE_TEMPLATE = {
  materialBatches: [
    {
      batchId: "MB-RAW-001",
      materialName: "High Purity Copper Rod 8mm",
      category: "Conductor",
      supplierName: "Apex Metallurgy",
      supplierLotNumber: "LOT-APX-001",
      quantity: 1000,
      unit: "kg",
      receivedDate: new Date().toISOString(),
      purityOrGrade: "99.99% Cu",
      certificateOfAnalysis: "COA-001",
      carbonFootprintKgCO2e: 120.5,
      status: "ACTIVE",
      qualityPassed: true,
      notes: "Raw material for motor stator windings"
    }
  ],
  components: [
    {
      componentId: "CMP-STATOR-001",
      componentName: "Precision Stator Core Assembly",
      componentType: "STATOR_CORE",
      materialBatches: [
        { batchId: "MB-RAW-001", quantityUsed: 45, unit: "kg" }
      ],
      productionDate: new Date().toISOString(),
      lineId: "LINE-STATOR-01",
      operatorId: "Tech-01",
      qualityCheckPassed: true,
      status: "APPROVED",
      serialNumber: "SN-STAT-001",
      notes: "Winding complete and tested"
    }
  ],
  assemblies: [
    {
      assemblyId: "ASM-MOTOR-001",
      assemblyName: "350kW EV Powertrain Subassembly",
      assemblyType: "POWERTRAIN",
      componentsUsed: [
        { componentId: "CMP-STATOR-001", componentName: "Precision Stator Core Assembly", componentType: "STATOR_CORE" }
      ],
      materialBatchesUsed: [
        { batchId: "MB-RAW-001", materialName: "High Purity Copper Rod 8mm" }
      ],
      assemblyLine: "MAIN-ASSEMBLY-01",
      workstation: "WS-FINAL",
      assembledAt: new Date().toISOString(),
      operator: "Assembly Lead",
      qualityChecks: { passedAll: true },
      status: "ASSEMBLED",
      notes: "Subassembly verified"
    }
  ],
  products: [
    {
      passportId: "DPP-EV-001",
      serialNumber: "SN-EV-MOTOR-001",
      modelName: "HyperDrive HP-350 Electric Motor",
      productCategory: "EV Powertrain / High-Performance Traction Motor",
      assemblyId: "ASM-MOTOR-001",
      facilityLocation: "Cleanroom Plant 1",
      manufacturedDate: new Date().toISOString(),
      specifications: {
        ratedPowerKw: 350,
        maxRpm: 20000,
        peakTorqueNm: 520,
        efficiencyRating: "IE5 Ultra-Premium",
        nominalVoltageV: 800,
        coolingMethod: "Direct Oil-Cooled",
        totalWeightKg: 48.5
      },
      sustainability: {
        totalCarbonFootprintKgCO2e: 165.2,
        recycledMaterialPercentage: 35.0,
        recyclabilityRatePercentage: 97.0,
        euBatteryDppCompliant: true,
        circularityIndex: 0.89,
        repairabilityScore: "Class A"
      },
      componentsUsed: [
        { componentId: "CMP-STATOR-001", componentName: "Precision Stator Core Assembly", componentType: "STATOR_CORE", serialNumber: "SN-STAT-001" }
      ],
      materialBatchesUsed: [
        { batchId: "MB-RAW-001", materialName: "High Purity Copper Rod 8mm", category: "Conductor", supplierName: "Apex Metallurgy" }
      ],
      complianceCertificates: ["ISO 9001", "EU ESPR 2024/1781"],
      status: "QC_APPROVED",
      qrPayload: "dpp://aerodrive/product/DPP-EV-001"
    }
  ],
  shipments: [
    {
      shipmentId: "SHP-2026-001",
      trackingNumber: "TRK-EXP-001",
      carrier: "DHL Express Freight",
      destinationClient: "Nordic EV Gigafactory",
      shippingStatus: "IN_TRANSIT",
      dispatchDate: new Date().toISOString(),
      productIds: ["DPP-EV-001"],
      notes: "Secured shipment consignment"
    }
  ],
  defects: [],
  manufacturingEvents: [
    {
      eventId: "EVT-001",
      eventType: "MATERIAL_INSPECTED",
      targetType: "MATERIAL_BATCH",
      targetId: "MB-RAW-001",
      timestamp: new Date().toISOString(),
      station: "LAB-INSPECTION-01",
      operator: "QC Specialist",
      inspectionResult: "PASSED",
      status: "SUCCESS",
      remarks: "Material verified within specification"
    }
  ]
};

export default function DatasetManagerModal({ isOpen, onClose, onSuccess, currentCounts }) {
  const [activeTab, setActiveTab] = useState('clear'); // 'clear' | 'import' | 'export' | 'seed'
  const [jsonText, setJsonText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen) return null;

  const handleClear = async () => {
    if (!window.confirm('Are you sure you want to completely remove the existing dataset? All batches, components, assemblies, products, and shipments will be wiped.')) {
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await api.clearDataset();
      if (res.success) {
        setStatusMessage('Dataset completely cleared. All counts reset to 0.');
        if (onSuccess) onSuccess('Dataset wiped successfully. Ready for new dataset.');
      } else {
        throw new Error(res.error || 'Failed to clear dataset');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error occurred while clearing database.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        JSON.parse(content); // Validate format
        setJsonText(content);
        setErrorMessage(null);
      } catch (err) {
        setErrorMessage('Uploaded file is not a valid JSON document.');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleTemplate = () => {
    setJsonText(JSON.stringify(SAMPLE_TEMPLATE, null, 2));
    setErrorMessage(null);
    setStatusMessage('Sample schema template loaded. You can edit the IDs and values before importing.');
  };

  const handleImport = async () => {
    if (!jsonText.trim()) {
      setErrorMessage('Please paste or upload a JSON dataset.');
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (err) {
      setErrorMessage('Invalid JSON syntax: ' + err.message);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const payload = {
        ...parsed,
        replaceExisting,
        actor: 'Manufacturing Lead',
      };
      const res = await api.importDataset(payload);
      if (res.success) {
        const counts = res.importedCounts || {};
        setStatusMessage(`Successfully imported: ${counts.products || 0} Products, ${counts.materialBatches || 0} Batches, ${counts.components || 0} Components, ${counts.shipments || 0} Shipments.`);
        if (onSuccess) onSuccess('New dataset imported successfully.');
      } else {
        throw new Error(res.error || 'Import failed');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error importing dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await api.exportDataset();
      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dataset_export_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatusMessage('Dataset successfully exported and downloaded.');
      } else {
        throw new Error('Export returned empty payload');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to export dataset.');
    } finally {
      setLoading(false);
    }
  };

  const handleReseedDefault = async () => {
    if (!window.confirm('Reset database to the standard electric motor demo factory records?')) {
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await api.reseedDatabase();
      if (res.success) {
        setStatusMessage('Default electric motor demo dataset restored.');
        if (onSuccess) onSuccess('Demo dataset successfully reloaded.');
      } else {
        throw new Error(res.message || 'Reseed failed');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error reloading demo dataset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 text-white flex items-center justify-center shadow-md shadow-cyan-600/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Dataset Management</h2>
              <p className="text-xs text-slate-500">Remove existing dataset, upload new records, or export JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-2 pt-2">
          <button
            onClick={() => { setActiveTab('clear'); setErrorMessage(null); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'clear'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>Remove Dataset</span>
          </button>

          <button
            onClick={() => { setActiveTab('import'); setErrorMessage(null); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'import'
                ? 'border-cyan-600 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Add / Import New Dataset</span>
          </button>

          <button
            onClick={() => { setActiveTab('export'); setErrorMessage(null); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Export Backup</span>
          </button>

          <button
            onClick={() => { setActiveTab('seed'); setErrorMessage(null); setStatusMessage(null); }}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 flex items-center space-x-1.5 transition-colors ${
              activeTab === 'seed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Demo Data</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: CLEAR DATASET */}
          {activeTab === 'clear' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
                <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Wipe All Existing Records</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  This will immediately remove all raw material batches, components, subassemblies, finished product passports, defect reports, and shipments from the database.
                </p>
              </div>

              {currentCounts && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center font-mono">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500">Products</div>
                    <div className="text-lg font-bold text-slate-900">{currentCounts.totalProducts || 0}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500">Batches</div>
                    <div className="text-lg font-bold text-slate-900">{currentCounts.totalBatches || 0}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500">Shipments</div>
                    <div className="text-lg font-bold text-slate-900">{currentCounts.totalShipments || 0}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-500">Defects</div>
                    <div className="text-lg font-bold text-rose-600">{currentCounts.totalDefects || 0}</div>
                  </div>
                </div>
              )}

              <button
                onClick={handleClear}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{loading ? 'Clearing Records...' : 'Clear All Manufacturing Data Now'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: IMPORT NEW DATASET */}
          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Paste JSON or Upload File:</label>
                <button
                  onClick={handleLoadSampleTemplate}
                  className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 hover:underline flex items-center space-x-1"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Insert Sample Schema Template</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100 cursor-pointer"
                />
              </div>

              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='Paste your dataset JSON here: { "materialBatches": [...], "components": [...], "assemblies": [...], "products": [...], "shipments": [...] }'
                className="w-full h-48 p-3 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="replaceCheck"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="replaceCheck" className="text-xs text-slate-600 font-medium cursor-pointer">
                  Replace all existing database records with this new dataset
                </label>
              </div>

              <button
                onClick={handleImport}
                disabled={loading || !jsonText.trim()}
                className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{loading ? 'Importing Dataset...' : 'Import Dataset Into Database'}</span>
              </button>
            </div>
          )}

          {/* TAB 3: EXPORT BACKUP */}
          {activeTab === 'export' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Download className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">Download Complete Database Backup</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Export all currently stored manufacturing genealogy records as a structured JSON file.
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{loading ? 'Exporting...' : 'Download JSON Dataset'}</span>
              </button>
            </div>
          )}

          {/* TAB 4: DEMO RESET */}
          {activeTab === 'seed' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm">Electric Motor Demo Dataset</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Restore the default connected electric motor manufacturing dataset with 8 products, 6 batches, and 5 shipments.
                </p>
              </div>
              <button
                onClick={handleReseedDefault}
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{loading ? 'Restoring...' : 'Restore Default Factory Demo Data'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

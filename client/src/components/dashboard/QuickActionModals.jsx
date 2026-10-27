import React, { useState, useEffect } from 'react';
import { X, Truck, QrCode, AlertTriangle, Activity, Box } from 'lucide-react';
import { api } from '../../api/client';

export default function QuickActionModals({ activeModal, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);

  useEffect(() => {
    if (activeModal === 'component') {
      api.getProducts().then(res => {
        if (res.success && res.data) setAvailableProducts(res.data);
      }).catch(err => console.error('Error loading products for component modal:', err));
    }
  }, [activeModal]);

  // Shipment Form State
  const [shipmentForm, setShipmentForm] = useState({
    originCompany: 'AeroDrive Powertrains Inc. (Detroit Gigafactory Plant 4)',
    destinationClient: 'BMW Group Powertrain Plant, Munich',
    destinationAddress: 'Petuelring 130, 80809 Munich, Germany',
    carrier: 'DHL Global Forwarding (Express Freight)',
    shippingStatus: 'IN_TRANSIT',
    productSerials: 'SN-MOT-2026-8801, SN-MOT-2026-8802',
    trackingNumber: 'TRK-DHL-EXP-' + Math.floor(100000 + Math.random() * 900000),
    notes: 'Direct shipment of validated UltraTorq-X500 traction motors.',
  });

  // Product Passport Form State
  const [productForm, setProductForm] = useState({
    passportId: 'DPP-EV500-2026-00' + Math.floor(4 + Math.random() * 90),
    serialNumber: 'SN-MOT-2026-88' + Math.floor(10 + Math.random() * 90),
    modelName: 'UltraTorq-X500 High-Efficiency EV Traction Motor',
    assemblyId: 'ASM-2026-0041',
    status: 'MANUFACTURED',
    ratedPowerKw: 350,
    maxRpm: 20000,
    peakTorqueNm: 520,
    totalCarbonFootprintKgCO2e: 184.2,
  });

  // Component Form State
  const [componentForm, setComponentForm] = useState({
    componentId: 'CMP-ROTOR-2026-0' + Math.floor(10 + Math.random() * 90),
    componentName: 'Dynamic Balance High-Speed Rotor Shaft Assembly',
    componentType: 'Rotor',
    serialNumber: 'SN-CMP-ROTOR-' + Math.floor(100 + Math.random() * 900),
    targetPassportId: 'ALL',
    lineId: 'Line 4B - Precision Powertrain Cell',
    operatorId: 'Component Specialist: Marcus Vance',
    materialBatchId: 'MB-MVTEC-CABLE-01',
    notes: '800V class dynamic balanced rotor shaft with NdFeB magnet retention sleeve.',
  });

  // Defect Form State
  const [defectForm, setDefectForm] = useState({
    title: 'Winding Insulation Resistance Drop under Dynamic Load',
    severity: 'HIGH',
    affectedBatchId: 'MB-COPPER-2026-088',
    rootCause: 'Microscopic enamel pinhole on copper wire outer insulation.',
    reportedBy: 'Shop Floor Dielectric Hi-Pot Tester',
    containmentAction: 'Quarantine copper spool buffer and inspect preceding 2 stator assemblies.',
  });

  // Event Form State
  const [eventForm, setEventForm] = useState({
    eventType: 'DYNO_TESTING',
    targetType: 'PRODUCT',
    targetId: 'DPP-EV500-2026-001',
    station: 'STATION-DYNO-TEST-BENCH-1',
    operator: 'Dyno Specialist: Dr. Maya Patel',
    status: 'SUCCESS',
    remarks: '400kW peak transient overload verification passed with zero thermal throttling.',
  });

  if (!activeModal) return null;

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const productList = shipmentForm.productSerials
        ? shipmentForm.productSerials.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const res = await api.createShipment({
        ...shipmentForm,
        products: productList
      });
      const createdId = res?.data?.shipmentId || 'latest';
      onSuccess(`Shipment ${createdId} created! Live QR verification generated.`);
      onClose();
      window.location.href = `/shipment-verify/${createdId}`;
    } catch (err) {
      setError(err.message || 'Failed to create shipment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await api.createProduct({
        passportId: productForm.passportId,
        serialNumber: productForm.serialNumber,
        modelName: productForm.modelName,
        assemblyId: productForm.assemblyId,
        status: productForm.status,
        specifications: {
          ratedPowerKw: Number(productForm.ratedPowerKw),
          maxRpm: Number(productForm.maxRpm),
          peakTorqueNm: Number(productForm.peakTorqueNm),
          efficiencyRating: 'IE5 Ultra-Premium',
        },
        sustainability: {
          totalCarbonFootprintKgCO2e: Number(productForm.totalCarbonFootprintKgCO2e),
          recycledMaterialPercentage: 35.5,
          recyclabilityRatePercentage: 97.0,
          euBatteryDppCompliant: true,
        },
        complianceCertificates: ['ISO 9001:2015', 'EU DPP Regulation 2024/1781'],
      });
      onSuccess('New Product Passport registered! Dashboard updated.');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create product passport');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDefect = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await api.createDefect(defectForm);
      onSuccess('Defect recorded and automated containment executed! Dashboard updated.');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to report defect');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateComponent = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await api.createComponent({
        componentId: componentForm.componentId,
        componentName: componentForm.componentName,
        componentType: componentForm.componentType,
        serialNumber: componentForm.serialNumber,
        passportId: componentForm.targetPassportId,
        lineId: componentForm.lineId,
        operatorId: componentForm.operatorId,
        materialBatches: componentForm.materialBatchId ? [{ batchId: componentForm.materialBatchId, materialName: 'Lineage Conductor Batch', quantityUsed: 1.5 }] : [],
        notes: componentForm.notes,
        status: 'AVAILABLE'
      });
      onSuccess(`Component ${componentForm.componentId} successfully added and bound to Digital Product Passport!`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create sub-component');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      await api.createEvent(eventForm);
      onSuccess('Manufacturing event logged! Dashboard updated.');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to log event');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            {activeModal === 'shipment' && <Truck className="w-5 h-5 text-emerald-600" />}
            {activeModal === 'product' && <QrCode className="w-5 h-5 text-cyan-600" />}
            {activeModal === 'component' && <Box className="w-5 h-5 text-blue-600" />}
            {activeModal === 'defect' && <AlertTriangle className="w-5 h-5 text-rose-600" />}
            {activeModal === 'event' && <Activity className="w-5 h-5 text-amber-600" />}
            <h2 className="text-sm font-bold font-mono text-slate-900 uppercase tracking-wider">
              {activeModal === 'shipment' && 'Dispatch New Shipment'}
              {activeModal === 'product' && 'Register Digital Product Passport'}
              {activeModal === 'component' && 'Add Sub-Component to DPP'}
              {activeModal === 'defect' && 'Log Defect & Blast Radius'}
              {activeModal === 'event' && 'Record Shop Floor Event'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Modal: New Shipment */}
        {activeModal === 'shipment' && (
          <form onSubmit={handleCreateShipment} className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-700 font-bold block mb-1">
                What company are we? (Originating Facility):
              </label>
              <input
                type="text"
                value={shipmentForm.originCompany}
                onChange={(e) => setShipmentForm({ ...shipmentForm, originCompany: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Destination Client / Company:</label>
                <input
                  type="text"
                  value={shipmentForm.destinationClient}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, destinationClient: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Carrier Name:</label>
                <input
                  type="text"
                  value={shipmentForm.carrier}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, carrier: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">
                What are the products? (Serial numbers, comma-separated):
              </label>
              <input
                type="text"
                value={shipmentForm.productSerials}
                onChange={(e) => setShipmentForm({ ...shipmentForm, productSerials: e.target.value })}
                placeholder="SN-MOT-2026-8801, SN-MOT-2026-8802"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                required
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">
                Each product's full 5-tier genealogy from raw materials will be automatically linked.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Tracking Number:</label>
                <input
                  type="text"
                  value={shipmentForm.trackingNumber}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, trackingNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Shipping Status:</label>
                <select
                  value={shipmentForm.shippingStatus}
                  onChange={(e) => setShipmentForm({ ...shipmentForm, shippingStatus: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
                >
                  <option value="PREPARING">PREPARING</option>
                  <option value="IN_TRANSIT">IN_TRANSIT</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Delivery Address:</label>
              <input
                type="text"
                value={shipmentForm.destinationAddress}
                onChange={(e) => setShipmentForm({ ...shipmentForm, destinationAddress: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 space-y-1">
              <span className="font-bold flex items-center space-x-1">
                <span>Auto-generates Live Custody Verification Checklist & QR Code:</span>
              </span>
              <p className="text-slate-600 text-[10px]">
                Upon creation, a QR code pointing to this consignment's live verification ledger is automatically generated. Whoever scans this QR can view the complete traceability history and tick off live checkpoints with recorded timestamps.
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-50 shadow-xs"
              >
                {submitting ? 'Creating...' : 'Confirm & Dispatch'}
              </button>
            </div>
          </form>
        )}

        {/* Modal: New Product Passport */}
        {activeModal === 'product' && (
          <form onSubmit={handleCreateProduct} className="space-y-3 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Passport ID:</label>
                <input
                  type="text"
                  value={productForm.passportId}
                  onChange={(e) => setProductForm({ ...productForm, passportId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Serial Number:</label>
                <input
                  type="text"
                  value={productForm.serialNumber}
                  onChange={(e) => setProductForm({ ...productForm, serialNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Model Name:</label>
              <input
                type="text"
                value={productForm.modelName}
                onChange={(e) => setProductForm({ ...productForm, modelName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Rated Power (kW):</label>
                <input
                  type="number"
                  value={productForm.ratedPowerKw}
                  onChange={(e) => setProductForm({ ...productForm, ratedPowerKw: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Status:</label>
                <select
                  value={productForm.status}
                  onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-cyan-600 focus:bg-white"
                >
                  <option value="MANUFACTURED">MANUFACTURED</option>
                  <option value="QC_APPROVED">QC_APPROVED</option>
                  <option value="IN_STORAGE">IN_STORAGE</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all disabled:opacity-50 shadow-xs"
              >
                {submitting ? 'Registering...' : 'Register DPP'}
              </button>
            </div>
          </form>
        )}

        {/* Modal: New Sub-Component */}
        {activeModal === 'component' && (
          <form onSubmit={handleCreateComponent} className="space-y-3 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Component ID:</label>
                <input
                  type="text"
                  value={componentForm.componentId}
                  onChange={(e) => setComponentForm({ ...componentForm, componentId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-700 font-bold block mb-1">Serial Number:</label>
                <input
                  type="text"
                  value={componentForm.serialNumber}
                  onChange={(e) => setComponentForm({ ...componentForm, serialNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Component Name:</label>
              <input
                type="text"
                value={componentForm.componentName}
                onChange={(e) => setComponentForm({ ...componentForm, componentName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Component Type:</label>
                <select
                  value={componentForm.componentType}
                  onChange={(e) => setComponentForm({ ...componentForm, componentType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="Rotor">Rotor (Shaft & Core)</option>
                  <option value="Stator">Stator (Hairpin Core)</option>
                  <option value="Housing">Housing Enclosure</option>
                  <option value="InverterModule">Inverter Module</option>
                  <option value="BearingSet">Bearing Set</option>
                  <option value="TerminalBusbar">Terminal Busbar</option>
                  <option value="Other">Other Component</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Target Product Passport:</label>
                <select
                  value={componentForm.targetPassportId}
                  onChange={(e) => setComponentForm({ ...componentForm, targetPassportId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="ALL">All Active Passports (Global)</option>
                  {availableProducts.map(p => (
                    <option key={p.passportId} value={p.passportId}>
                      {p.passportId} ({p.serialNumber})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Fabrication Line:</label>
                <input
                  type="text"
                  value={componentForm.lineId}
                  onChange={(e) => setComponentForm({ ...componentForm, lineId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Source Material Batch:</label>
                <input
                  type="text"
                  value={componentForm.materialBatchId}
                  onChange={(e) => setComponentForm({ ...componentForm, materialBatchId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Engineering Notes:</label>
              <input
                type="text"
                value={componentForm.notes}
                onChange={(e) => setComponentForm({ ...componentForm, notes: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-950">
              <span className="font-bold block">Automatic DPP Passport Integration:</span>
              <span className="text-blue-800 text-[10px]">
                Upon creation, this component will immediately bind to the selected Digital Product Passport and increment the Total Components metrics.
              </span>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-50 shadow-xs"
              >
                {submitting ? 'Adding Component...' : 'Add Component'}
              </button>
            </div>
          </form>
        )}

        {/* Modal: New Defect */}
        {activeModal === 'defect' && (
          <form onSubmit={handleCreateDefect} className="space-y-3 text-xs font-mono">
            <div>
              <label className="text-slate-600 font-semibold block mb-1">Defect Title:</label>
              <input
                type="text"
                value={defectForm.title}
                onChange={(e) => setDefectForm({ ...defectForm, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Affected Batch ID:</label>
                <input
                  type="text"
                  value={defectForm.affectedBatchId}
                  onChange={(e) => setDefectForm({ ...defectForm, affectedBatchId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Severity:</label>
                <select
                  value={defectForm.severity}
                  onChange={(e) => setDefectForm({ ...defectForm, severity: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                >
                  <option value="CRITICAL">CRITICAL</option>
                  <option value="HIGH">HIGH</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Root Cause:</label>
              <textarea
                value={defectForm.rootCause}
                onChange={(e) => setDefectForm({ ...defectForm, rootCause: e.target.value })}
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-rose-500 focus:bg-white"
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all disabled:opacity-50 shadow-xs"
              >
                {submitting ? 'Triggering...' : 'Lock & Quarantine'}
              </button>
            </div>
          </form>
        )}

        {/* Modal: New Event */}
        {activeModal === 'event' && (
          <form onSubmit={handleCreateEvent} className="space-y-3 text-xs font-mono">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Event Type:</label>
                <select
                  value={eventForm.eventType}
                  onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                >
                  <option value="DYNO_TESTING">DYNO_TESTING</option>
                  <option value="WINDING">WINDING</option>
                  <option value="IMPREGNATION">IMPREGNATION</option>
                  <option value="FINAL_ASSEMBLY">FINAL_ASSEMBLY</option>
                  <option value="PACKAGING">PACKAGING</option>
                  <option value="DISPATCH">DISPATCH</option>
                </select>
              </div>
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Target Identifier:</label>
                <input
                  type="text"
                  value={eventForm.targetId}
                  onChange={(e) => setEventForm({ ...eventForm, targetId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Station & Sensor:</label>
              <input
                type="text"
                value={eventForm.station}
                onChange={(e) => setEventForm({ ...eventForm, station: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="text-slate-600 font-semibold block mb-1">Remarks:</label>
              <textarea
                value={eventForm.remarks}
                onChange={(e) => setEventForm({ ...eventForm, remarks: e.target.value })}
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition-all disabled:opacity-50 shadow-xs"
              >
                {submitting ? 'Recording...' : 'Commit Event'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

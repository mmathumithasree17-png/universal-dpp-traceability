import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Truck,
  Building2,
  Barcode,
  CheckSquare,
  Clock,
  Plus,
  QrCode,
  CheckCircle2,
  ExternalLink,
  Copy,
  Layers,
  Box,
  Cpu,
  ShieldCheck,
  AlertCircle,
  Download,
  Printer
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../../api/client';
import { resolveReachableUrl } from '../../utils/urlHelper';

const INITIAL_CHECKLIST_STAGES = [
  {
    id: 'chk-raw-1',
    stage: 'RAW_MATERIAL',
    title: 'Raw Material Quality & CoA Verification',
    description: 'Supplier certificates of analysis verified; spectrographic chemical flux & alloy grade confirmed.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'Incoming metallographic inspection standard ISO 10474 3.1.'
  },
  {
    id: 'chk-comp-2',
    stage: 'COMPONENT',
    title: 'Component Machining & Stator Hairpin QC',
    description: 'Hairpin copper winding insulation verified; dynamic rotor shaft balance within G2.5 tolerance.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'NDT eddy-current & dimensional scans passed.'
  },
  {
    id: 'chk-asm-3',
    stage: 'ASSEMBLY',
    title: 'Powertrain Assembly & High-Voltage Integration',
    description: 'Automated assembly torque verified; 800V dielectric hi-pot test and internal coolant loop leak test passed.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'Cleanroom assembly cell sign-off.'
  },
  {
    id: 'chk-prod-4',
    stage: 'FINISHED_PRODUCT',
    title: 'Finished Product Dyno & DPP QR Registration',
    description: 'Full rated power dyno test passed with zero thermal throttling; serialized QR passport bound to physical casing.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'Digital Product Passport published.'
  },
  {
    id: 'chk-pack-5',
    stage: 'PACKAGING',
    title: 'Secure Packaging & Environmental Tamper Seals',
    description: 'Climate-controlled shock absorbent casing applied; nitrogen-purged moisture barrier and cryptographic seal tags locked.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'Ready for outbound freight transport.'
  },
  {
    id: 'chk-recv-6',
    stage: 'DELIVERY',
    title: 'Consignment Receipt & Custody Acceptance',
    description: 'Consignment received at destination facility; seal integrity verified and delivery acceptance signed.',
    checked: false,
    checkedAt: null,
    checkedBy: null,
    notes: 'Recipient confirmation.'
  }
];

export default function RecordShipmentModal({ isOpen, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Form Fields
  const [originCompany, setOriginCompany] = useState('AeroDrive Powertrains Inc.');
  const [originFacility, setOriginFacility] = useState('Gigafactory Cleanroom Plant 4 - Detroit, MI');
  const [destinationCompany, setDestinationCompany] = useState('BMW Group Powertrain Plant, Munich');
  const [destinationAddress, setDestinationAddress] = useState('Petuelring 130, 80809 Munich, Germany');
  const [carrier, setCarrier] = useState('DHL Global Forwarding (Express Freight)');
  const [trackingNumber, setTrackingNumber] = useState('TRK-DHL-EXP-' + Math.floor(100000 + Math.random() * 900000));
  const [shippingStatus, setShippingStatus] = useState('IN_TRANSIT');

  // Product Serial Numbers Selection
  const [selectedSerialNumbers, setSelectedSerialNumbers] = useState([]);
  const [customSerialInput, setCustomSerialInput] = useState('');

  // Checklist spanning raw material to finished product
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST_STAGES);
  const [newCheckTitle, setNewCheckTitle] = useState('');
  const [showAddCustomCheck, setShowAddCustomCheck] = useState(false);

  // Success QR State
  const [createdShipment, setCreatedShipment] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    if (createdShipment) {
      const url = resolveReachableUrl(createdShipment.qrPayload, `/shipment-verify/${createdShipment.shipmentId}`);
      
      // Generate Data URL for permanent <img> display & download
      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: { dark: '#060a12', light: '#ffffff' }
      }).then(dataUri => {
        setQrDataUrl(dataUri);
      }).catch(err => {
        console.error('Error generating QR Data URL:', err);
      });

      // Also render to canvas if mounted
      if (qrCanvasRef.current) {
        QRCode.toCanvas(qrCanvasRef.current, url, {
          width: 200,
          margin: 1.5,
          color: { dark: '#060a12', light: '#ffffff' }
        }, (err) => {
          if (err) console.error('Error rendering QR canvas:', err);
        });
      }
    }
  }, [createdShipment]);

  // Load available products from database
  useEffect(() => {
    if (!isOpen) {
      setCreatedShipment(null);
      setQrDataUrl('');
      return;
    }
    async function fetchProducts() {
      try {
        setLoadingProducts(true);
        const res = await api.getProducts();
        if (res.success && Array.isArray(res.data)) {
          setAvailableProducts(res.data);
          // If products exist, pre-select up to 2
          if (res.data.length > 0 && selectedSerialNumbers.length === 0) {
            setSelectedSerialNumbers(res.data.slice(0, 2).map(p => p.serialNumber || p.passportId));
          }
        }
      } catch (e) {
        console.warn('Could not load products for shipment:', e);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchProducts();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    setCreatedShipment(null);
    setQrDataUrl('');
    onClose();
  };

  // Toggle checklist item and record exact timestamp
  const handleToggleCheck = (id) => {
    setChecklist(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextChecked = !item.checked;
          return {
            ...item,
            checked: nextChecked,
            checkedAt: nextChecked ? new Date().toISOString() : null,
            checkedBy: nextChecked ? 'Shop Floor Quality Inspector' : null,
          };
        }
        return item;
      })
    );
  };

  // Add custom check to checklist
  const handleAddCustomCheck = (e) => {
    e.preventDefault();
    if (!newCheckTitle.trim()) return;
    const newId = `chk-custom-${Date.now()}`;
    const newCheck = {
      id: newId,
      stage: 'CUSTOM',
      title: newCheckTitle.trim(),
      description: 'Custom operator-defined verification check.',
      checked: true,
      checkedAt: new Date().toISOString(),
      checkedBy: 'Shop Floor Quality Inspector',
      notes: ''
    };
    setChecklist(prev => [...prev, newCheck]);
    setNewCheckTitle('');
    setShowAddCustomCheck(false);
  };

  // Toggle serial number selection
  const handleToggleSerial = (serial) => {
    if (selectedSerialNumbers.includes(serial)) {
      setSelectedSerialNumbers(selectedSerialNumbers.filter(s => s !== serial));
    } else {
      setSelectedSerialNumbers([...selectedSerialNumbers, serial]);
    }
  };

  // Add custom serial number manually
  const handleAddCustomSerial = (e) => {
    e.preventDefault();
    const val = customSerialInput.trim();
    if (val && !selectedSerialNumbers.includes(val)) {
      setSelectedSerialNumbers([...selectedSerialNumbers, val]);
      setCustomSerialInput('');
    }
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedSerialNumbers.length === 0) {
      setError('Please select or enter at least one product serial number for this shipment.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Match selected serials to product records if available
      const productsPayload = selectedSerialNumbers.map(serial => {
        const found = availableProducts.find(p => p.serialNumber === serial || p.passportId === serial);
        if (found) {
          return {
            passportId: found.passportId,
            serialNumber: found.serialNumber,
            modelName: found.modelName,
          };
        }
        return {
          passportId: serial.startsWith('DPP-') ? serial : `DPP-${serial}`,
          serialNumber: serial,
          modelName: 'AeroDrive Powertrain Motor',
        };
      });

      const payload = {
        originCompany,
        originFacility,
        destinationCompany,
        destinationClient: destinationCompany,
        destinationAddress,
        carrier,
        trackingNumber,
        shippingStatus,
        products: productsPayload,
        checklist,
        notes: `Consignment recorded from ${originCompany} to ${destinationCompany}.`,
      };

      const res = await api.createShipment(payload);
      if (res.success && res.data) {
        setCreatedShipment(res.data);
        const qrTarget = res.data.qrPayload || `${window.location.origin}/shipment-verify/${res.data.shipmentId}`;
        try {
          const urlData = await QRCode.toDataURL(qrTarget, {
            width: 320,
            margin: 2,
            color: { dark: '#060a12', light: '#ffffff' }
          });
          setQrDataUrl(urlData);
        } catch (qrErr) {
          console.error('Error generating QR DataURL in submit:', qrErr);
        }
        if (onSuccess) onSuccess(`Shipment ${res.data.shipmentId} registered successfully!`);
      } else {
        throw new Error(res.error || 'Failed to create shipment.');
      }
    } catch (err) {
      setError(err.message || 'Error recording shipment.');
    } finally {
      setSubmitting(false);
    }
  };

  const qrUrl = createdShipment
    ? (createdShipment.qrPayload || `${window.location.origin}/shipment-verify/${createdShipment.shipmentId}`)
    : '';

  const handleCopyLink = () => {
    if (!qrUrl) return;
    navigator.clipboard.writeText(qrUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col my-8 max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Record Consignment Shipment</h2>
              <p className="text-xs text-slate-500">
                Specify companies, attach product serials, perform raw-to-finish verification checks & generate QR
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* SUCCESS VIEW: Permanent High-Res QR Code & Verification Link */}
          {createdShipment ? (
            <div className="text-center py-4 space-y-5">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {createdShipment.shipmentId} DISPATCHED & VERIFIED
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  Consignment QR Generated Successfully!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Whoever scans this QR code will see the full end-to-end traceability of the products from raw material to finished product, and can tick verification checks live.
                </p>
              </div>

              {/* Large Printable QR Code Card */}
              <div className="max-w-xs mx-auto p-6 bg-white rounded-2xl border-2 border-emerald-300 shadow-xl space-y-3">
                <div className="flex justify-center p-3 bg-white rounded-xl min-h-[210px] items-center">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt={`QR Code for shipment ${createdShipment.shipmentId}`}
                      className="w-52 h-52 object-contain rounded-lg shadow-sm"
                    />
                  ) : (
                    <canvas ref={qrCanvasRef} className="rounded-lg shadow-xs" />
                  )}
                </div>
                <div className="text-center space-y-1">
                  <div className="font-mono font-bold text-slate-900 text-sm">{createdShipment.shipmentId}</div>
                  <div className="text-[11px] text-slate-500 font-mono">Carrier: {createdShipment.carrier}</div>
                  <div className="text-[10px] text-emerald-700 font-semibold uppercase tracking-wider">
                    Scan with Phone Camera to Inspect & Tick Checks
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <a
                  href={`/shipment-verify/${createdShipment.shipmentId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Traceability Page</span>
                </a>

                {qrDataUrl && (
                  <a
                    href={qrDataUrl}
                    download={`Consignment-${createdShipment.shipmentId}-QR.png`}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all shadow-xs"
                    title="Download high-resolution QR image for printing"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Download QR PNG</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all shadow-xs"
                  title="Print shipment verification badge"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  <span>Print Label</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition-all"
                >
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>{copiedLink ? 'Link Copied!' : 'Copy QR Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleClose}
                  className="inline-flex items-center px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all"
                >
                  <span>Done</span>
                </button>
              </div>
            </div>
          ) : (
            /* SHIPMENT REGISTRATION FORM */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SECTION 1: "WHAT COMPANY ARE WE?" & DESTINATION COMPANY */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Building2 className="w-4 h-4 text-cyan-600" />
                  <span>Company & Consignment Identification</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Origin Company (What company are we?) */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      What company are we? (Origin Manufacturer):
                    </label>
                    <input
                      type="text"
                      value={originCompany}
                      onChange={(e) => setOriginCompany(e.target.value)}
                      placeholder="e.g. AeroDrive Powertrains Inc."
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-semibold"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Facility: {originFacility}
                    </span>
                  </div>

                  {/* Destination Client */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Recipient / Destination Company:
                    </label>
                    <input
                      type="text"
                      value={destinationCompany}
                      onChange={(e) => setDestinationCompany(e.target.value)}
                      placeholder="e.g. BMW Group / Porsche AG / Rivian"
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-semibold"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                      Delivery Address: {destinationAddress}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Logistics Carrier:</label>
                    <input
                      type="text"
                      value={carrier}
                      onChange={(e) => setCarrier(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Tracking Number:</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Initial Status:</label>
                    <select
                      value={shippingStatus}
                      onChange={(e) => setShippingStatus(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2 text-slate-900 text-xs font-semibold"
                    >
                      <option value="PREPARING">PREPARING (In Staging)</option>
                      <option value="IN_TRANSIT">IN_TRANSIT (Dispatched)</option>
                      <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                      <option value="DELIVERED">DELIVERED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: "WHAT ARE THE PRODUCT(S) (SERIAL NUMBER)?" */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                    <Barcode className="w-4 h-4 text-blue-600" />
                    <span>What Are The Products? (Select by Serial Number)</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-blue-100 text-blue-800">
                    {selectedSerialNumbers.length} Product(s) Selected
                  </span>
                </div>

                {/* Available Products in Database */}
                <div>
                  <label className="block text-slate-600 font-medium mb-1.5">
                    Click products to attach to this shipment:
                  </label>
                  {loadingProducts ? (
                    <div className="text-slate-400 py-2">Loading manufactured product inventory...</div>
                  ) : availableProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                      {availableProducts.map((p) => {
                        const isSelected = selectedSerialNumbers.includes(p.serialNumber) || selectedSerialNumbers.includes(p.passportId);
                        return (
                          <div
                            key={p.passportId}
                            onClick={() => handleToggleSerial(p.serialNumber || p.passportId)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-mono font-bold text-xs block text-slate-900">
                                {p.serialNumber || p.passportId}
                              </span>
                              <span className="text-[10px] text-slate-500 truncate block">
                                {p.modelName}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-blue-600 focus:ring-blue-500 shrink-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">No existing products in database. Type a custom serial number below:</p>
                  )}
                </div>

                {/* Custom Serial Number Input */}
                <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={customSerialInput}
                    onChange={(e) => setCustomSerialInput(e.target.value)}
                    placeholder="Enter custom serial number (e.g. SN-MOT-2026-9901)"
                    className="flex-1 bg-white border border-slate-300 rounded-xl p-2 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSerial}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    + Add Serial
                  </button>
                </div>

                {/* Selected Badges */}
                {selectedSerialNumbers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedSerialNumbers.map(s => (
                      <span
                        key={s}
                        className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-mono text-xs font-bold"
                      >
                        <span>{s}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSerial(s)}
                          className="hover:text-rose-600"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: "CREATE A CHECK FOR SHIPMENT FROM RAW MATERIAL TO FINISHED PRODUCT" */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      <span>Traceability Verification Checklist (Raw Material &rarr; Finished Product)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Click to check off items. Every click records the exact verification timestamp.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomCheck(!showAddCustomCheck)}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Check</span>
                  </button>
                </div>

                {/* Add Custom Check Field */}
                {showAddCustomCheck && (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 space-y-2">
                    <label className="text-xs font-bold text-slate-700">New Quality Checkpoint Title:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCheckTitle}
                        onChange={(e) => setNewCheckTitle(e.target.value)}
                        placeholder="e.g. Rotor Vibration Spectrum & Bearing Acoustic Scan Passed"
                        className="flex-1 bg-white border border-slate-300 rounded-lg p-2 text-xs text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomCheck}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                      >
                        Save Check
                      </button>
                    </div>
                  </div>
                )}

                {/* Checklist Items */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleCheck(item.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                        item.checked
                          ? 'bg-emerald-50/80 border-emerald-300 text-slate-900 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => {}}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold text-xs ${item.checked ? 'text-emerald-900' : 'text-slate-900'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {item.stage}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                        
                        {/* RECORDED CHECKED TIME DISPLAY */}
                        {item.checked && item.checkedAt && (
                          <div className="mt-1.5 flex items-center space-x-1.5 text-[11px] font-mono text-emerald-700 font-semibold bg-emerald-100/60 px-2 py-0.5 rounded-md inline-flex">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span>Checked at: {new Date(item.checkedAt).toLocaleTimeString()} ({new Date(item.checkedAt).toLocaleDateString()})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{submitting ? 'Creating Shipment & QR...' : 'Record Shipment & Generate QR'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  QrCode,
  Search,
  Camera,
  Plus,
  Filter,
  AlertCircle,
  CheckCircle2,
  X,
  RefreshCw,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../api/client';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AlertBanner from '../components/common/AlertBanner';
import QrScannerModal from '../components/dpp/QrScannerModal';
import PassportCertificateView from '../components/dpp/PassportCertificateView';

export default function DppPage() {
  const { refreshTrigger, onDataRefreshed } = useOutletContext() || {};
  const [searchParams, setSearchParams] = useSearchParams();

  const [productsList, setProductsList] = useState([]);
  const [searchInput, setSearchInput] = useState(searchParams.get('id') || '');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState(searchParams.get('id') || '');
  const [passportData, setPassportData] = useState(null);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingPassport, setLoadingPassport] = useState(false);
  const [listError, setListError] = useState(null);
  const [passportError, setPassportError] = useState(null);

  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Load products list for the selector column
  const fetchProductsList = async () => {
    try {
      setLoadingList(true);
      setListError(null);
      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.getProducts(params);
      if (res.success && res.data) {
        setProductsList(res.data);
        // If no selectedId yet, default to first product
        if (!selectedId && res.data.length > 0) {
          const firstId = res.data[0].passportId;
          setSelectedId(firstId);
        }
      }
    } catch (err) {
      setListError(err.message || 'Failed to fetch Digital Product Passports');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchProductsList();
  }, [statusFilter, refreshTrigger]);

  // Load full passport payload for selectedId
  const loadFullPassport = async (idToFetch) => {
    if (!idToFetch) return;
    try {
      setLoadingPassport(true);
      setPassportError(null);
      const res = await api.getProductById(idToFetch);
      if (res.success && res.data) {
        setPassportData(res.data);
      } else {
        throw new Error(res.message || 'Passport record unavailable');
      }
    } catch (err) {
      setPassportError(err.message || `No product passport found for identifier: ${idToFetch}`);
      setPassportData(null);
    } finally {
      setLoadingPassport(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      loadFullPassport(selectedId);
    }
  }, [selectedId, refreshTrigger]);

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (!query) return;
    setSelectedId(query);
    setSearchParams({ id: query });
  };

  // Handle QR Scan Detection
  const handleScanSuccess = (decodedId, rawPayload) => {
    const raw = String(rawPayload || decodedId || '');
    if (decodedId?.startsWith('SHP-') || raw.includes('shipment-verify')) {
      const matchShp = decodedId?.startsWith('SHP-') ? decodedId : (raw.match(/SHP-[\w-]+/) || [])[0];
      if (matchShp) {
        window.location.href = `/shipment-verify/${matchShp}`;
        return;
      }
    }
    const cleanId = String(decodedId || '').trim();
    setSearchInput(cleanId);
    setSelectedId(cleanId);
    setSearchParams({ id: cleanId });
  };

  // Quick Select Product from list
  const handleSelectProduct = (prod) => {
    setSelectedId(prod.passportId);
    setSearchInput(prod.passportId);
    setSearchParams({ id: prod.passportId });
  };

  const handleResetSearch = () => {
    setSearchInput('');
    setPassportError(null);
    if (productsList.length > 0) {
      handleSelectProduct(productsList[0]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header & Search Control Bar */}
      <div className="industrial-card p-6 rounded-2xl border border-navy-700/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 mb-1">
              <QrCode className="w-5 h-5" />
              <span className="text-xs font-mono uppercase tracking-wider font-semibold">
                Universal Digital Product Passport (CIRPASS & ESPR)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Product Passport Registry & Inspection
            </h1>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Search by Passport ID or Serial Number, scan physical QR tokens with device camera, or inspect full supply chain provenance.
            </p>
          </div>

          {/* Search Field & Scanner Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Passport ID or Serial..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700/80 rounded-xl pl-9 pr-16 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-10 top-2.5 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-1.5 top-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-mono text-xs font-bold transition-all"
              >
                Go
              </button>
            </form>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold transition-all shadow-panel"
              title="Scan QR Code with camera or upload image"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Scan QR</span>
            </button>
          </div>
        </div>
      </div>

      {listError && <AlertBanner type="error" message={listError} />}

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Product Selector List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-xs font-mono uppercase text-slate-400">
              Passports ({productsList.length})
            </h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-navy-900 border border-navy-700 rounded px-2 py-1 text-[11px] font-mono text-slate-300 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Status</option>
              <option value="SHIPPED">Shipped</option>
              <option value="QUARANTINED">Quarantined</option>
              <option value="MANUFACTURED">Manufactured</option>
            </select>
          </div>

          {loadingList ? (
            <div className="p-6 text-center text-xs font-mono text-slate-500">Loading catalog...</div>
          ) : productsList.length === 0 ? (
            <div className="industrial-card p-6 text-center rounded-xl text-xs text-slate-500 font-mono">
              No products found.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
              {productsList.map((prod) => {
                const isSelected = selectedId === prod.passportId || selectedId === prod.serialNumber;
                const isQuarantined = prod.status === 'QUARANTINED';
                return (
                  <div
                    key={prod.passportId}
                    onClick={() => handleSelectProduct(prod)}
                    className={`industrial-card p-3.5 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/25 shadow-glow-cyan/20'
                        : isQuarantined
                        ? 'border-rose-500/30 hover:border-rose-500/60'
                        : 'border-navy-800 hover:border-navy-600'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono font-bold text-cyan-400 text-xs">{prod.passportId}</span>
                      <Badge text={prod.status} size="xs" />
                    </div>
                    <p className="text-xs font-semibold text-white mt-1 line-clamp-1">{prod.modelName}</p>
                    <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>SN: {prod.serialNumber}</span>
                      <span>{prod.specifications?.ratedPowerKw} kW</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Full Digital Product Passport Document */}
        <div className="lg:col-span-3">
          {loadingPassport ? (
            <LoadingSpinner text="Retrieving Authenticated Product Passport from Database..." size="lg" />
          ) : passportError ? (
            /* REQUIREMENT 9: Proper Not-Found Handling for Invalid Product IDs */
            <div className="industrial-card p-8 md:p-12 rounded-2xl border border-rose-500/40 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-xl font-bold font-mono text-white">
                  Passport Not Found
                </h2>
                <p className="text-xs text-rose-200/90 font-mono">
                  {passportError}
                </p>
                <p className="text-xs text-slate-400 font-sans">
                  The requested identifier was queried against all product passports, serial numbers, and assembly records in the persistent ledger, but yielded no valid record.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={handleResetSearch}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-mono text-xs font-bold transition-all"
                >
                  Return to Active Passports
                </button>
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-200 font-mono text-xs transition-all"
                >
                  Scan Another QR
                </button>
              </div>

              <div className="pt-4 border-t border-navy-800/80 max-w-sm mx-auto text-left text-xs font-mono text-slate-400">
                <span className="text-[10px] uppercase text-slate-500 block mb-1">Available Sample Identifiers:</span>
                <div className="flex flex-wrap gap-1.5">
                  {productsList.map((p) => (
                    <button
                      key={p.passportId}
                      onClick={() => handleSelectProduct(p)}
                      className="px-2 py-0.5 rounded bg-navy-950 border border-navy-700 text-cyan-300 text-[10px] hover:border-cyan-500"
                    >
                      {p.passportId}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : passportData ? (
            /* Digital Product Passport View */
            <PassportCertificateView
              passportData={passportData}
              onSelectRelated={(targetId) => {
                setSelectedId(targetId);
                setSearchInput(targetId);
              }}
            />
          ) : (
            <div className="industrial-card p-12 text-center rounded-2xl text-slate-400 font-mono text-xs">
              Select or search a Product Passport ID to inspect full provenance.
            </div>
          )}
        </div>
      </div>

      {/* QR Code Scanner / Camera / Image Upload Modal */}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}

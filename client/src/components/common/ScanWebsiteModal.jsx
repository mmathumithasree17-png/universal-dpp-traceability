import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Smartphone,
  Download,
  Copy,
  ExternalLink,
  Wifi,
  Globe,
  Monitor,
  CheckCircle2,
  AlertCircle,
  FileCode,
  RefreshCw,
  Share2,
  Network
} from 'lucide-react';
import QRCode from 'qrcode';
import { api } from '../../api/client';

const PRODUCTION_URL = 'https://universal-dpp-traceability.onrender.com';

export default function ScanWebsiteModal({ isOpen, onClose }) {
  const [networkInfo, setNetworkInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState('traceability'); // 'traceability' | 'dpp' | 'shipment' | 'dashboard'
  const [selectedMode, setSelectedMode] = useState('public'); // Default to public HTTPS cloud URL for instant phone loading
  const [customPublicUrl, setCustomPublicUrl] = useState(PRODUCTION_URL);
  const [qrPngDataUrl, setQrPngDataUrl] = useState('');
  const [qrSvgString, setQrSvgString] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  // Fetch network IP info on open
  useEffect(() => {
    if (!isOpen) return;
    async function fetchNetwork() {
      try {
        setLoading(true);
        setError(null);
        const res = await api.getNetworkInfo();
        const isPublicHost = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        if (isPublicHost) {
          setSelectedMode('public');
          setCustomPublicUrl(window.location.origin);
        } else if (res.success && res.publicUrl) {
          setCustomPublicUrl(res.publicUrl);
          setSelectedMode('public');
        } else {
          setCustomPublicUrl(PRODUCTION_URL);
          setSelectedMode('public');
        }
      } catch (err) {
        console.warn('Network info fetch fallback:', err);
        setCustomPublicUrl(PRODUCTION_URL);
        setSelectedMode('public');
      } finally {
        setLoading(false);
      }
    }
    fetchNetwork();
  }, [isOpen]);

  // Determine current active URL to encode into QR based on mode and page
  const getPagePath = () => {
    if (selectedPage === 'traceability') return '/traceability?id=DPP-EV500-2026-003&dir=backward';
    if (selectedPage === 'shipment') return '/shipment-verify/latest';
    if (selectedPage === 'dpp') return '/dpp?id=DPP-EV500-2026-003';
    return '/dashboard';
  };

  const currentTargetUrl = (() => {
    const path = getPagePath();
    const isPublicHost = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isPublicHost) {
      return `${window.location.origin}${path}`;
    }
    const base = customPublicUrl.trim() || PRODUCTION_URL;
    return base.replace(/\/+$/, '') + path;
  })();

  // Generate both PNG and SVG QR codes whenever destination URL changes
  useEffect(() => {
    if (!currentTargetUrl) return;

    let active = true;

    // Generate high-resolution PNG data URL (512px for crisp mobile scanning)
    QRCode.toDataURL(currentTargetUrl, {
      width: 480,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a', // Slate-900 high contrast
        light: '#ffffff', // Pure white quiet zone
      },
    })
      .then((dataUri) => {
        if (active) setQrPngDataUrl(dataUri);
      })
      .catch((err) => {
        console.error('Failed to generate QR PNG:', err);
      });

    // Generate SVG string for vector printing
    QRCode.toString(currentTargetUrl, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        if (active) setQrSvgString(svg);
      })
      .catch((err) => {
        console.error('Failed to generate QR SVG:', err);
      });

    return () => {
      active = false;
    };
  }, [currentTargetUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentTargetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadSvg = () => {
    if (!qrSvgString) return;
    const blob = new Blob([qrSvgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `universal-dpp-website-qr.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Scan to Open Website</h2>
              <p className="text-xs text-slate-500">
                Open live dashboard and DPP ledger on any mobile phone or tablet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Target Page Selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
              1. Choose Destination Page
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPage('traceability')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedPage === 'traceability'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <Network className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Product Traceability</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  Lineage & Provenance Tree
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPage('shipment')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedPage === 'shipment'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Shipment & Checks</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  /shipment-verify/latest
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPage('dashboard')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedPage === 'dashboard'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <Monitor className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Factory Dashboard</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  /dashboard
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedPage('dpp')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedPage === 'dpp'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-500'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  <span>Product Passport (DPP)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  /dpp
                </div>
              </button>
            </div>
          </div>

          {/* Destination Selector Tabs */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
              2. Choose Network Reachability
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedMode('lan')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedMode === 'lan'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Same Wi-Fi (LAN)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  {networkInfo?.lanIp ? `${networkInfo.lanIp}` : 'Auto-detected IP'}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('public')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedMode === 'public'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <Globe className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Public / Cloud URL</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Cloud or Tunnel
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMode('local')}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  selectedMode === 'local'
                    ? 'border-emerald-500 bg-emerald-50/70 text-emerald-950 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <Monitor className="w-3.5 h-3.5 text-slate-600" />
                  <span>This PC (Localhost)</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">
                  127.0.0.1
                </div>
              </button>
            </div>
          </div>

          {/* Custom Public URL Input if Public Mode is active */}
          {selectedMode === 'public' && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 animate-fade-in">
              <label className="text-xs font-semibold text-slate-700 block">
                Enter your Deployed or Tunnel URL:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://your-dpp-domain.com/dashboard"
                  value={customPublicUrl}
                  onChange={(e) => setCustomPublicUrl(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Use your ngrok, Cloudflare Tunnel, or production deployment address.
              </p>
            </div>
          )}

          {/* QR Code Presentation Box */}
          <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 flex flex-col items-center text-center space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
                Scan to Open Website
              </h3>
              <p className="text-xs text-slate-600 max-w-sm">
                Scan this QR code with your phone camera to open the website.
              </p>
            </div>

            {/* Crisp High-Contrast QR Code Card */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-lg inline-block">
              {loading ? (
                <div className="w-60 h-60 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
              ) : qrPngDataUrl ? (
                <img
                  src={qrPngDataUrl}
                  alt="Website QR Code"
                  className="w-56 h-56 object-contain rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Destination URL Display */}
            <div className="w-full max-w-md">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs font-mono shadow-xs">
                <span className="text-slate-800 truncate px-1 select-all" title={currentTargetUrl}>
                  {currentTargetUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 ml-2"
                  title="Copy Link to Clipboard"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick Wi-Fi Instruction for Mobile Users */}
            {selectedMode === 'lan' && (
              <div className="w-full max-w-md p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-left text-[11px] text-emerald-950 space-y-1">
                <div className="font-bold flex items-center space-x-1 text-emerald-900">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Wi-Fi Scanning Requirement:</span>
                </div>
                <p className="text-emerald-800 leading-relaxed">
                  Make sure your mobile phone is connected to the same Wi-Fi network as this computer. The development server listens on all network interfaces (<code className="font-mono font-bold">0.0.0.0:5001</code>).
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons: Download PNG, Download SVG, Copy Link, Open in Browser */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-200">
            <div className="flex flex-wrap gap-2">
              {qrPngDataUrl && (
                <a
                  href={qrPngDataUrl}
                  download="universal-dpp-website-qr.png"
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QR (PNG)</span>
                </a>
              )}

              {qrSvgString && (
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-bold text-xs transition-all shadow-xs"
                  title="Download vector SVG for high-resolution printing"
                >
                  <FileCode className="w-3.5 h-3.5 text-slate-600" />
                  <span>Download SVG</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium text-xs transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <a
                href={currentTargetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Link</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

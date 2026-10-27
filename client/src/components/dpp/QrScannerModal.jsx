import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Camera, Upload, X, AlertCircle, CheckCircle2, Search, Video, VideoOff } from 'lucide-react';

export default function QrScannerModal({ isOpen, onClose, onScanSuccess }) {
  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'upload' | 'manual'
  const [cameraError, setCameraError] = useState(null);
  const [cameraStream, setCameraStream] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [decoding, setDecoding] = useState(false);
  const [scanFeedback, setScanFeedback] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const fileInputRef = useRef(null);

  // Initialize camera when activeTab === 'camera'
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this browser or environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setCameraStream(stream);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', true);
        videoRef.current.play();
        requestAnimationFrame(tickScan);
      }
    } catch (err) {
      console.warn('Camera initialization notice:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in browser settings, or use Image Upload / Manual Entry below.');
      } else {
        setCameraError(`Camera unavailable: ${err.message}. You can upload a QR image or enter the Product ID manually.`);
      }
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
  };

  const handleDetectedCode = (codeStr) => {
    const raw = String(codeStr || '').trim();
    let extracted = raw;

    try {
      if (raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        extracted = parsed.passportId || parsed.serialNumber || parsed.shipmentId || raw;
      } else if (raw.includes('://') || raw.startsWith('http')) {
        const parsedUrl = new URL(raw);
        if (parsedUrl.searchParams.has('id')) {
          extracted = parsedUrl.searchParams.get('id');
        } else {
          const segments = parsedUrl.pathname.split('/').filter(Boolean);
          extracted = segments[segments.length - 1] || raw;
        }
      } else {
        const match = raw.match(/(DPP-[A-Za-z0-9-]+|SHP-[A-Za-z0-9-]+|SN-[A-Za-z0-9-]+)/);
        if (match) {
          extracted = match[0];
        }
      }
    } catch (e) {
      extracted = raw;
    }

    setScanFeedback(`Decoded: ${extracted}`);
    stopCamera();
    setTimeout(() => {
      onScanSuccess(extracted, raw);
      onClose();
    }, 500);
  };

  const tickScan = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        canvas.height = videoRef.current.videoHeight;
        canvas.width = videoRef.current.videoWidth;
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data) {
          handleDetectedCode(code.data);
          return;
        }
      }
    }
    animFrameIdRef.current = requestAnimationFrame(tickScan);
  };

  // Image Upload Handler
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDecoding(true);
    setCameraError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        setDecoding(false);

        if (code && code.data) {
          handleDetectedCode(code.data);
        } else {
          setCameraError('No valid QR code could be decoded from the uploaded image. Please try another image or enter ID manually.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    onScanSuccess(manualInput.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/85 backdrop-blur-md animate-fade-in">
      <div className="industrial-card p-6 rounded-2xl max-w-lg w-full space-y-4 border border-cyan-500/50 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-navy-800">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
              Scan Digital Product Passport QR
            </h2>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex space-x-1 bg-navy-950 p-1 rounded-lg border border-navy-800 text-xs font-mono">
          <button
            onClick={() => { setActiveTab('camera'); setCameraError(null); }}
            className={`flex-1 py-1.5 rounded flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'camera' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Device Camera</span>
          </button>
          <button
            onClick={() => { setActiveTab('upload'); stopCamera(); setCameraError(null); }}
            className={`flex-1 py-1.5 rounded flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'upload' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload QR Image</span>
          </button>
          <button
            onClick={() => { setActiveTab('manual'); stopCamera(); setCameraError(null); }}
            className={`flex-1 py-1.5 rounded flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'manual' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Manual ID</span>
          </button>
        </div>

        {scanFeedback && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-lg text-emerald-300 text-xs font-mono flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{scanFeedback}</span>
          </div>
        )}

        {cameraError && (
          <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-lg text-amber-200 text-xs font-sans flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>{cameraError}</span>
          </div>
        )}

        {/* Tab 1: Device Camera Stream */}
        {activeTab === 'camera' && (
          <div className="space-y-3">
            <div className="relative bg-navy-950 rounded-xl overflow-hidden aspect-video border border-navy-800 flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Scanning reticle overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-44 h-44 border-2 border-cyan-400/80 rounded-xl relative animate-pulse shadow-glow-cyan/30">
                  <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-300" />
                  <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-300" />
                  <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-300" />
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-300" />
                </div>
              </div>
            </div>
            <p className="text-[11px] font-mono text-center text-slate-400">
              Align camera over physical motor laser etch or printed DPP QR token.
            </p>
          </div>
        )}

        {/* Tab 2: Upload QR Image */}
        {activeTab === 'upload' && (
          <div className="space-y-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-8 border-2 border-dashed border-navy-700 hover:border-cyan-500 rounded-xl text-center cursor-pointer bg-navy-950/50 hover:bg-navy-900/60 transition-all"
            >
              <Upload className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="text-xs font-mono font-bold text-white">Click or Drag & Drop QR Image</p>
              <p className="text-[11px] text-slate-400 mt-1">Supports PNG, JPG, or SVG factory QR labels</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {decoding && (
              <p className="text-xs font-mono text-cyan-400 text-center animate-pulse">
                Analyzing cryptographic pixels...
              </p>
            )}
          </div>
        )}

        {/* Tab 3: Manual Product ID / Serial Entry */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1">
                Enter Product Passport ID or Serial Number:
              </label>
              <input
                type="text"
                placeholder="e.g. DPP-EV500-2026-001 or SN-MOT-2026-8801"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full bg-navy-950 border border-navy-700 rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                autoFocus
              />
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-mono text-slate-500 mr-1">Quick Select:</span>
              <button
                type="button"
                onClick={() => setManualInput('DPP-EV500-2026-001')}
                className="px-2 py-0.5 rounded bg-navy-900 border border-navy-800 text-[10px] font-mono text-cyan-400 hover:border-cyan-500"
              >
                DPP-EV500-2026-001 (Shipped)
              </button>
              <button
                type="button"
                onClick={() => setManualInput('DPP-EV500-2026-003')}
                className="px-2 py-0.5 rounded bg-navy-900 border border-navy-800 text-[10px] font-mono text-rose-400 hover:border-rose-500"
              >
                DPP-EV500-2026-003 (Quarantined)
              </button>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-navy-800">
              <button
                type="button"
                onClick={() => { stopCamera(); onClose(); }}
                className="px-4 py-2 rounded-lg bg-navy-800 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-navy-950 font-bold text-xs font-mono"
              >
                Inspect Passport
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

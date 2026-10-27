import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Printer, Check, Copy, ExternalLink, QrCode as QrIcon } from 'lucide-react';

export default function QrCodeDisplay({ value, passportId, modelName }) {
  const canvasRef = useRef(null);
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // Generate QR code whenever value changes
  useEffect(() => {
    if (!value) return;
    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: 180,
        margin: 1.5,
        color: {
          dark: '#060a12',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      },
      (err) => {
        if (!err && canvasRef.current) {
          setDataUrl(canvasRef.current.toDataURL('image/png'));
        }
      }
    );
  }, [value]);

  const handleDownloadPng = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `QR_${passportId || 'DPP'}.png`;
    a.click();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DPP QR Code - ${passportId}</title>
          <style>
            body { font-family: monospace; text-align: center; padding: 40px; }
            .card { border: 2px solid #000; padding: 24px; display: inline-block; border-radius: 8px; }
            h2 { margin: 0 0 8px 0; }
            p { margin: 4px 0; font-size: 14px; }
            img { margin: 16px 0; width: 220px; height: 220px; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>UNIVERSAL DIGITAL PRODUCT PASSPORT</h2>
            <p><strong>Passport ID:</strong> ${passportId}</p>
            <p><strong>Model:</strong> ${modelName || 'Electric Motor'}</p>
            <img src="${dataUrl}" alt="DPP QR" />
            <p>EU CIRPASS & ESPR COMPLIANT</p>
            <p>Scan to verify authentic manufacturer provenance.</p>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center p-4 bg-navy-950 rounded-xl border border-navy-800 text-center space-y-3">
      <div className="p-2 bg-white rounded-lg shadow-panel min-h-[190px] flex items-center justify-center">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`DPP QR ${passportId}`}
            className="w-[180px] h-[180px] object-contain rounded"
          />
        ) : (
          <canvas ref={canvasRef} className="rounded w-[180px] h-[180px]" />
        )}
      </div>

      <div className="w-full">
        <p className="text-[10px] font-mono uppercase text-slate-400">Cryptographic Identity URL (Scan to Verify)</p>
        <p className="text-xs font-mono text-cyan-300 truncate max-w-[220px] mx-auto mt-0.5 select-all" title={value}>
          {value}
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 w-full pt-1">
        <button
          onClick={handleDownloadPng}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-navy-850 hover:bg-navy-800 border border-navy-700 text-slate-200 text-[11px] font-mono transition-colors"
          title="Download high-resolution PNG QR"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Save PNG</span>
        </button>

        <button
          onClick={handlePrint}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-navy-850 hover:bg-navy-800 border border-navy-700 text-slate-200 text-[11px] font-mono transition-colors"
          title="Print official factory DPP label"
        >
          <Printer className="w-3.5 h-3.5 text-gold-400" />
          <span>Print Label</span>
        </button>

        <button
          onClick={handleCopyUrl}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded bg-navy-850 hover:bg-navy-800 border border-navy-700 text-slate-200 text-[11px] font-mono transition-colors"
          title="Copy Passport URL"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
          <span>{copied ? 'Copied' : 'Copy URL'}</span>
        </button>
      </div>
    </div>
  );
}

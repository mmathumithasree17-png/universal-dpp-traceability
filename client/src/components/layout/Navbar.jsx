import React, { useState } from 'react';
import { Menu, Database, RefreshCw, Radio, CheckCircle, Clock, Smartphone, QrCode } from 'lucide-react';
import { api } from '../../api/client';
import ScanWebsiteModal from '../common/ScanWebsiteModal';

export default function Navbar({ onToggleSidebar, dbStatus, onDataRefreshed }) {
  const [seeding, setSeeding] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const handleReseed = async () => {
    try {
      setSeeding(true);
      setFeedback(null);
      await api.reseedDatabase();
      setFeedback('Demo data reset successfully!');
      if (onDataRefreshed) onDataRefreshed();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      setFeedback(`Error: ${err.message}`);
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setSeeding(false);
    }
  };

  const isConnected = dbStatus?.isConnected ?? true;
  const dbMode = dbStatus?.mode === 'mongodb' ? 'MongoDB Direct' : 'Persistent File Ledger';

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-xs">
      {/* Left: Mobile Toggle & Title */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
            Industrial Cell: Plant #4 (Cleanroom Assembly)
          </span>
        </div>
      </div>

      {/* Right: DB Status Pill, Reseed, and Feedback */}
      <div className="flex items-center space-x-3">
        {feedback && (
          <span className="text-xs font-mono text-cyan-800 bg-cyan-50 px-3 py-1 rounded border border-cyan-200 animate-fade-in font-medium">
            {feedback}
          </span>
        )}

        {/* Database Live State */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono shadow-xs">
          <Database className="w-3.5 h-3.5 text-cyan-600" />
          <span className="text-slate-500 hidden lg:inline">STORAGE:</span>
          <span className={`font-semibold ${isConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
            {dbMode}
          </span>
        </div>

        {/* Scan to Open Website Button (Mobile Access QR) */}
        <button
          onClick={() => setIsQrModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-mono font-bold transition-all shadow-xs"
          title="Scan QR Code with phone to open website on mobile or another device"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">Scan to Open Website</span>
          <span className="sm:hidden">Scan QR</span>
        </button>

        {/* Quick Demo Data Seed Button */}
        <button
          onClick={handleReseed}
          disabled={seeding}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-mono font-medium transition-all disabled:opacity-50"
          title="Reload fresh electric motor demonstration dataset"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${seeding ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Reset Demo Data</span>
        </button>
      </div>

      {/* Website Mobile Access QR Modal */}
      <ScanWebsiteModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
      />
    </header>
  );
}

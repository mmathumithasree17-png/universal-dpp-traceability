import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { api } from '../../api/client';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dbStatus, setDbStatus] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await api.getHealth();
        if (res.database) {
          setDbStatus(res.database);
        }
      } catch (err) {
        setDbStatus({ isConnected: false, mode: 'error' });
      }
    }
    checkHealth();
  }, [refreshTrigger]);

  const handleDataRefreshed = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? 'md:ml-64' : 'md:ml-20'
        }`}
      >
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          dbStatus={dbStatus}
          onDataRefreshed={handleDataRefreshed}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet context={{ refreshTrigger, onDataRefreshed: handleDataRefreshed }} />
        </main>

        {/* Industrial Footer */}
        <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs font-mono text-slate-500">
          AI-POWERED UNIVERSAL DIGITAL PRODUCT PASSPORT (PS10) &bull; CLEAN INDUSTRIAL LIGHT THEME
        </footer>
      </div>
    </div>
  );
}

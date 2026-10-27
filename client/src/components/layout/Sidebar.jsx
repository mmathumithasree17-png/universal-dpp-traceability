import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  QrCode,
  GitFork,
  AlertTriangle,
  Activity,
  History,
  Network,
  Cpu,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckSquare,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Home Portal', path: '/', icon: Home },
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Consignment & Live Checks', path: '/shipment-verify/latest', icon: CheckSquare },
  { name: 'Digital Product Passport', path: '/dpp', icon: QrCode },
  { name: 'Genealogy Explorer', path: '/genealogy', icon: GitFork },
  { name: 'Defect Impact Analysis', path: '/defects', icon: AlertTriangle, highlight: true },
  { name: 'Event Management', path: '/events', icon: Activity },
  { name: 'Forward & Backward Traceability', path: '/traceability', icon: Network },
];

export default function Sidebar({ isOpen, setIsOpen }) {
  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-30 flex flex-col bg-white border-r border-slate-200 shadow-xs transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-200 bg-slate-50/80">
        <NavLink to="/" className="flex items-center space-x-3 overflow-hidden group">
          <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-600 shrink-0 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
            <Cpu className="w-5 h-5" />
          </div>
          {isOpen && (
            <div className="flex flex-col truncate">
              <span className="text-sm font-bold tracking-wider font-mono text-slate-900">
                AERODRIVE<span className="text-cyan-600">DPP</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">
                Smart Traceability v1.0
              </span>
            </div>
          )}
        </NavLink>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="hidden md:flex p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          title={isOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                  isActive
                    ? 'bg-cyan-50 text-cyan-800 border-l-4 border-cyan-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-l-4 border-transparent'
                }`
              }
              title={!isOpen ? item.name : undefined}
            >
              <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" />
              {isOpen && (
                <span className="ml-3 truncate font-sans text-xs font-semibold uppercase tracking-wide">
                  {item.name}
                </span>
              )}
              {item.highlight && isOpen && (
                <span className="ml-auto w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Industrial Spec Indicator */}
      {isOpen && (
        <div className="p-3.5 m-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center space-x-2 text-cyan-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-mono font-bold tracking-wide">CIRPASS & ESPR</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
            Compliant with EU Eco-Design & Digital Product Passport Standards (PS10).
          </p>
        </div>
      )}
    </aside>
  );
}

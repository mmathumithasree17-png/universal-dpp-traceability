import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode,
  GitFork,
  AlertTriangle,
  Activity,
  History,
  Network,
  Cpu,
  Layers,
  Box,
  Truck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Leaf,
  Lock,
  ExternalLink,
  ChevronRight,
  BarChart3,
  Search,
  LayoutDashboard,
  Compass,
} from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

  const capabilities = [
    {
      id: 'dpp',
      title: 'Digital Product Passport (DPP)',
      badge: 'EU CIRPASS Ready',
      icon: QrCode,
      color: 'blue',
      description:
        'Unique digital identity with QR serialization for every finished powertrain. Tri-mode lookup via device camera, image upload, or serial number. Contains complete BOM, repair manuals, and recycling guides.',
      link: '/dpp',
      features: ['Camera & Image QR Scan', 'ESPR 2024/1781 Carbon Footprint', 'Direct Component Provenance'],
    },
    {
      id: 'genealogy',
      title: '5-Tier Item Genealogy Mapping',
      badge: 'Interactive Graph',
      icon: GitFork,
      color: 'indigo',
      description:
        'Visual interactive graph mapping the complete 5-tier manufacturing chain: Material Batch → Component → Subassembly → Finished Motor → Logistics Consignment.',
      link: '/genealogy',
      features: ['Filter by Batch Category & Shipment', 'Upstream & Downstream Traversal', 'Red Quarantine Pulse Alerts'],
    },
    {
      id: 'defects',
      title: 'Sub-Second Defect Impact Traversal',
      badge: '< 1ms Blast Radius',
      icon: AlertTriangle,
      color: 'rose',
      description:
        'Instant multi-hop graph traversal engine. When a raw material or component defect is declared, it immediately identifies every affected unit, categorizing warehouse stock vs. shipped orders.',
      link: '/defects',
      features: ['Sub-Second Latency (< 10ms)', 'Zero False Positives & Duplicates', 'Automated 8D Containment Holds'],
    },
    {
      id: 'traceability',
      title: 'Bi-Directional Provenance Engine',
      badge: 'Multi-Tier Provenance',
      icon: Network,
      color: 'teal',
      description:
        'Trace manufacturing relationships symmetrically in both directions. Forward trace from supplier alloy lots to customer consignments; backward trace from product serials upstream to raw ore.',
      link: '/traceability',
      features: ['Forward Lot-to-Consignment Tracing', 'Backward Unit-to-Source Tracing', 'Detects Split & Shared Batches'],
    },
    {
      id: 'events',
      title: 'Shop Floor Event Telemetry',
      badge: '18 Lifecycle Events',
      icon: Activity,
      color: 'emerald',
      description:
        'Chronological lifecycle logging across 18 industrial milestones—from raw material receipt and hairpin winding to vacuum impregnation, dyno testing, and packaging dispatch.',
      link: '/events',
      features: ['Strict State Machine Transitions', 'Auto Status Cascading', 'Idempotent Submission Control'],
    },
    {
      id: 'audit',
      title: 'Tamper-Evident SHA-256 Audit Trail',
      badge: 'Cryptographic Ledger',
      icon: Lock,
      color: 'amber',
      description:
        'Server-side hash-linked cryptographic chain binding every creation, edit, and status change from Genesis to Block N. Instantly detects byte-level unauthorized alterations.',
      link: '/audit',
      features: ['Server-Calculated SHA-256 Hashes', 'Full-Chain Integrity Verification', 'Interactive Tamper Simulation Test'],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-cyan-100 selection:text-cyan-900">
      {/* Top Navigation Bar with Prominent Dashboard Portal Icon in Top Right */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo & System Subtitle */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-extrabold tracking-tight text-slate-900 font-mono">
                  AeroDrive <span className="text-cyan-600">DPP</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
                  PS10
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Smart Manufacturing Traceability & Digital Passport</p>
            </div>
          </Link>

          {/* Quick Nav Anchors */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#overview" className="hover:text-cyan-600 transition-colors">Overview</a>
            <a href="#capabilities" className="hover:text-cyan-600 transition-colors">What It Can Do</a>
            <a href="#workflow" className="hover:text-cyan-600 transition-colors">5-Tier Genealogy</a>
            <a href="#standards" className="hover:text-cyan-600 transition-colors">CIRPASS Compliance</a>
          </nav>

          {/* TOP RIGHT CORNER: Prominent Icon Button to Enter the Second Page (Dashboard) */}
          <div className="flex items-center space-x-3">
            <Link
              to="/dpp"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
              title="Quick QR Scanner"
            >
              <QrCode className="w-4 h-4 text-slate-600" />
              <span>Scan QR</span>
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-md shadow-cyan-600/25 transition-all hover:shadow-lg hover:shadow-cyan-600/35 hover:-translate-y-0.5"
              title="Enter Manufacturing Dashboard & Operations Hub"
            >
              <LayoutDashboard className="w-4 h-4 animate-pulse" />
              <span>Enter Dashboard</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Industrial Background Image */}
      <section id="overview" className="relative pt-12 pb-20 md:pt-16 md:pb-24 overflow-hidden border-b border-slate-200">
        {/* Subtle Industrial Background Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-multiply pointer-events-none"
          style={{ backgroundImage: "url('/images/factory-warehouse.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/85 to-slate-50/95 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Status Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-mono font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>LIVE INDUSTRIAL MES CONNECTED • ZERO-HARDCODING</span>
            </div>

            {/* Main Catchy Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
              Universal Digital Product Passport for <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-blue-700">Smart Product Traceability</span>
            </h1>

            {/* Explanatory Lead Paragraph */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              Track electric motor powertrains throughout their entire lifecycle—from raw material smelter batches and sub-component machining to final assembly, sub-second defect blast radius containment, and EU CIRPASS-ready digital passports.
            </p>

            {/* Direct Entry Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-7 py-3.5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-md shadow-slate-900/20 transition-all hover:-translate-y-0.5"
              >
                <LayoutDashboard className="w-4 h-4 text-cyan-400" />
                <span>Open Operational Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                to="/dpp"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-all hover:border-slate-400"
              >
                <QrCode className="w-4 h-4 text-cyan-600" />
                <span>Search or Scan Passport</span>
              </Link>
            </div>
          </div>

          {/* User-Provided Traceability Showcase Visual */}
          <div className="relative mt-12 max-w-4xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200/90 bg-white p-2.5">
            <div className="rounded-2xl overflow-hidden relative group">
              <img
                src="/images/dpp-showcase.jpg"
                alt="Digital Product Passport & End-to-End Smart Manufacturing Traceability"
                className="w-full h-auto object-cover max-h-[460px] rounded-2xl group-hover:scale-[1.01] transition-transform duration-500"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/85 via-slate-950/50 to-transparent p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-400 text-slate-950 uppercase tracking-wider">
                    Full Industrial Flow
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-100 mt-1">
                    Raw Materials &rarr; Component Machining &rarr; Assembly Line &rarr; Consignments &rarr; DPP QR Twin
                  </p>
                </div>
                <Link
                  to="/dpp"
                  className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-all shadow-sm"
                >
                  <QrCode className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Inspect Passport</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Platform Architecture & Core Functionality Overview */}
          <div className="mt-14 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-cyan-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center mb-3">
                <QrCode className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Digital Product Passport</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Unique serialized QR identity for every powertrain, compliant with EU ESPR 2024/1781 eco-design directives.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <GitFork className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">5-Tier Item Genealogy</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                End-to-end multi-tier graph linking raw material lots, machined components, assemblies, motors, and shipments.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-rose-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Instant Blast Radius</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Sub-second graph traversal engine that pinpoints all downstream affected units upon defect declaration.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Cryptographic Audit</h3>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Tamper-evident SHA-256 hash chains securing every state change, inspection event, and manufacturing record.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* "What It Can Do" Capabilities Section */}
      <section id="capabilities" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold font-mono tracking-wider uppercase text-cyan-600 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200">
              Core Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              What This System Does
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              A software-only industrial traceability architecture delivering end-to-end component genealogy, EU CIRPASS compliance, and real-time defect containment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <div
                  key={cap.id}
                  onClick={() => navigate(cap.link)}
                  className="bg-slate-50 hover:bg-white rounded-2xl p-6 border border-slate-200 hover:border-cyan-400 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-all">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        {cap.badge}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-cyan-700 transition-colors">
                      {cap.title}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {cap.description}
                    </p>

                    <div className="pt-2 border-t border-slate-200/80 space-y-1.5">
                      {cap.features.map((feat, i) => (
                        <div key={i} className="flex items-center space-x-2 text-[11px] text-slate-700 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 flex items-center text-xs font-bold text-cyan-600 group-hover:text-cyan-700">
                    <span>Open Module</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5-Tier Item Hierarchy Workflow Section */}
      <section id="workflow" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-bold font-mono tracking-wider uppercase text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              5-Tier Item Hierarchy
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Manufacturing Provenance Chain
            </h2>
            <p className="text-slate-600 text-sm">
              Every manufactured electric motor is tracked through an uninterrupted 5-stage chain of custody:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="font-bold text-sm text-slate-900">Material Batch</h4>
              <p className="text-xs text-slate-500">Neodymium magnets, OFHC copper, electrical steel.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-bold text-sm text-slate-900">Component</h4>
              <p className="text-xs text-slate-500">Hairpin stators, balanced rotor shafts, casing.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-bold text-sm text-slate-900">Assembly</h4>
              <p className="text-xs text-slate-500">350kW powertrain assembly line integration.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                4
              </div>
              <h4 className="font-bold text-sm text-slate-900">Finished Product</h4>
              <p className="text-xs text-slate-500">Serial stamped & Digital Product Passport bound.</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2 text-center">
              <div className="w-10 h-10 mx-auto rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                5
              </div>
              <h4 className="font-bold text-sm text-slate-900">Shipment</h4>
              <p className="text-xs text-slate-500">Consigned with tracking numbers to OEM plants.</p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/genealogy"
              className="inline-flex items-center space-x-2 text-sm font-bold text-cyan-700 hover:text-cyan-800"
            >
              <span>Explore Interactive Genealogy Graph Canvas</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Regulatory Standards & Compliance */}
      <section id="standards" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold font-mono uppercase text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                EU CIRPASS & Eco-Design Compliant
              </span>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Built for Global Regulatory Standards
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                Designed to comply with the European Union Eco-design for Sustainable Products Regulation (ESPR 2024/1781) and Battery/Powertrain DPP Specification v1.2.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-medium text-slate-700">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="block text-slate-900">Carbon Footprint</strong>
                  <span>Calculated per unit (kg CO2e)</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="block text-slate-900">Recyclability Rate</strong>
                  <span>97.2% material circular recovery</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="block text-slate-900">Repairability Score</strong>
                  <span>Class A modular stator disassembly</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <strong className="block text-slate-900">Physical Trace Address</strong>
                  <span>Direct OEM & EU legal operator contact</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">Ready to explore?</span>
                <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold">
                  v1.0 Live
                </span>
              </div>
              <h3 className="text-2xl font-extrabold tracking-tight">
                Access the Live Manufacturing Operations Center
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                Navigate directly to the second page to inspect real-time database counts, visual charts, live event activity, and sub-second defect blast-radius diagnostics.
              </p>
              <Link
                to="/dashboard"
                className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-md transition-all hover:scale-[1.02]"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Launch Operational Dashboard & All Modules</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Light Footer */}
      <footer className="bg-slate-100 border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>AI-POWERED UNIVERSAL DIGITAL PRODUCT PASSPORT (PS10) &bull; CLEAN INDUSTRIAL LIGHT THEME</span>
          <div className="flex items-center space-x-4 text-slate-600">
            <Link to="/dashboard" className="hover:text-cyan-700">Dashboard</Link>
            <Link to="/dpp" className="hover:text-cyan-700">Passports</Link>
            <Link to="/genealogy" className="hover:text-cyan-700">Genealogy</Link>
            <Link to="/defects" className="hover:text-cyan-700">Defects</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

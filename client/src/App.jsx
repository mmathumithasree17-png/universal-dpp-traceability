import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import DppPage from './pages/DppPage';
import GenealogyPage from './pages/GenealogyPage';
import DefectImpactPage from './pages/DefectImpactPage';
import EventManagementPage from './pages/EventManagementPage';
import AuditHistoryPage from './pages/AuditHistoryPage';
import TraceabilityPage from './pages/TraceabilityPage';
import ShipmentVerificationPage from './pages/ShipmentVerificationPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* First Page: Clean, Light-Themed Home Page Defining Platform Capabilities */}
        <Route path="/" element={<HomePage />} />

        {/* Public / Recipient Shipment Verification & Traceability Check Page */}
        <Route path="/shipment-verify/:id" element={<ShipmentVerificationPage />} />

        {/* Second Page and Operational Modules wrapped in AppLayout */}
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dpp" element={<DppPage />} />
          <Route path="genealogy" element={<GenealogyPage />} />
          <Route path="defects" element={<DefectImpactPage />} />
          <Route path="events" element={<EventManagementPage />} />
          <Route path="audit" element={<AuditHistoryPage />} />
          <Route path="traceability" element={<TraceabilityPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

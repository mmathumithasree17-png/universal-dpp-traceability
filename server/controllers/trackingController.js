const Shipment = require('../models/Shipment');
const Product = require('../models/Product');
const ManufacturingEvent = require('../models/ManufacturingEvent');
const AuditRecord = require('../models/AuditRecord');
const auditService = require('../services/auditService');

// In-memory real-time state for live telemetry & alerts
let activeDeviations = [];
let telemetrySimulation = {
  activeTrackingId: 'SHP-514975',
  currentLat: 48.1774,
  currentLng: 11.5583,
  speedKmh: 68.4,
  corridorDeviationMeters: 0,
  status: 'ON_SCHEDULE', // ON_SCHEDULE, MISROUTED, SIGNAL_LOST, HELD_RECALL
  lastPing: new Date().toISOString()
};

// Planned logistics transit corridor waypoints (Detroit Gigafactory -> BMW Munich Powertrain Plant)
const PLANNED_ROUTE = [
  { step: 1, name: 'AeroDrive Cleanroom Plant 4 (Detroit, MI)', lat: 42.3314, lng: -83.0458, status: 'DEPARTED' },
  { step: 2, name: 'Detroit Metro Air Logistics Port (DTW)', lat: 42.2162, lng: -83.3554, status: 'CLEARED' },
  { step: 3, name: 'Frankfurt Cargo City South (FRA)', lat: 50.0379, lng: 8.5622, status: 'TRANSIT' },
  { step: 4, name: 'A9 Logistics Corridor - Ingolstadt Gate', lat: 48.7665, lng: 11.4257, status: 'IN_TRANSIT' },
  { step: 5, name: 'BMW Group Powertrain Plant, Munich (Petuelring 130)', lat: 48.1774, lng: 11.5583, status: 'DESTINATION' }
];

async function getTrackingUpdates(req, res) {
  try {
    const allShipments = await Shipment.find({});
    const activeShipment = allShipments.find(s => s.shipmentId === telemetrySimulation.activeTrackingId) || allShipments[0] || null;

    return res.status(200).json({
      success: true,
      data: {
        activeShipment,
        telemetry: telemetrySimulation,
        plannedRoute: PLANNED_ROUTE,
        activeAlerts: activeDeviations,
        geofenceRadiusMeters: 1500, // standard 1.5km highway tolerance
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function getRouteWaypoints(req, res) {
  try {
    const { id } = req.params;
    const shipment = await Shipment.findOne({ $or: [{ shipmentId: id }, { trackingNumber: id }] });
    return res.status(200).json({
      success: true,
      data: {
        shipmentId: shipment ? shipment.shipmentId : id,
        plannedRoute: PLANNED_ROUTE,
        currentCoordinates: {
          lat: telemetrySimulation.currentLat,
          lng: telemetrySimulation.currentLng
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function simulateGpsDeviation(req, res) {
  try {
    const { shipmentId = 'SHP-514975', deviationType = 'MISROUTED_OFF_CORRIDOR' } = req.body;

    const shipment = await Shipment.findOne({ $or: [{ shipmentId }, { trackingNumber: shipmentId }] });
    const targetShipmentId = shipment ? shipment.shipmentId : shipmentId;

    // Simulate off-corridor drift (drifting 14.8 km away towards unauthorized warehouse)
    telemetrySimulation.activeTrackingId = targetShipmentId;
    telemetrySimulation.currentLat = 48.3541;
    telemetrySimulation.currentLng = 11.7862;
    telemetrySimulation.speedKmh = 0; // stopped
    telemetrySimulation.corridorDeviationMeters = 14820; // 14.8 km off corridor
    telemetrySimulation.status = 'MISROUTED';
    telemetrySimulation.lastPing = new Date().toISOString();

    const alertId = 'ALERT-GPS-' + Date.now().toString().slice(-6);
    const newAlert = {
      alertId,
      shipmentId: targetShipmentId,
      timestamp: new Date().toISOString(),
      type: 'GPS_CORRIDOR_BREACH',
      severity: 'CRITICAL',
      title: '🚨 CRITICAL: High-Value EV Powertrain Consignment Deviated From Authorized Route!',
      message: `Consignment ${targetShipmentId} breached planned logistics corridor by 14.8 km near Eching/Munich North bypass. Stationary for > 15 minutes. High probability of missed or stolen parcel.`,
      deviationDistanceKm: 14.82,
      coordinates: { lat: 48.3541, lng: 11.7862 },
      acknowledged: false,
      recommendedActions: [
        'Trigger instant tamper-evident digital quarantine on connected DPP units',
        'Dispatch emergency security liaison to coordinates (48.3541°N, 11.7862°E)',
        'Notify DHL Express Freight Security & BMW Plant Logistics Control Desk'
      ]
    };

    activeDeviations.unshift(newAlert);
    if (activeDeviations.length > 10) activeDeviations.pop();

    // Log critical event into tamper-evident audit ledger
    await ManufacturingEvent.create({
      eventId: 'EVT-GPS-DEV-' + Date.now().toString().slice(-6),
      eventType: 'QUARANTINE_TRIGGERED',
      targetType: 'SHIPMENT',
      targetId: targetShipmentId,
      description: `GPS Deviation Alert: Consignment ${targetShipmentId} missed authorized transit corridor by 14.8 km. AI automated containment initiated.`,
      operator: 'Automated AI Telematics Sentinel',
      facility: 'Munich A9 Geofence Zone',
      qualityGatePassed: false,
      anomalyDetected: true,
      digitalSignature: 'SIG-AI-GEO-DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      timestamp: new Date()
    });

    if (shipment) {
      await Shipment.updateOne(
        { _id: shipment._id },
        { shippingStatus: 'HELD_RECALL' }
      );
    }

    return res.status(200).json({
      success: true,
      alert: newAlert,
      telemetry: telemetrySimulation,
      message: 'GPS deviation alert triggered and broadcasted successfully.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

async function acknowledgeAlert(req, res) {
  try {
    const { alertId } = req.body;
    activeDeviations = activeDeviations.map(a => 
      a.alertId === alertId ? { ...a, acknowledged: true, acknowledgedAt: new Date().toISOString() } : a
    );

    // Reset simulation back to nominal
    telemetrySimulation.status = 'ON_SCHEDULE';
    telemetrySimulation.corridorDeviationMeters = 0;
    telemetrySimulation.currentLat = 48.1774;
    telemetrySimulation.currentLng = 11.5583;

    return res.status(200).json({
      success: true,
      message: 'Alert acknowledged and telemetry telemetry returned to nominal.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getTrackingUpdates,
  getRouteWaypoints,
  simulateGpsDeviation,
  acknowledgeAlert
};

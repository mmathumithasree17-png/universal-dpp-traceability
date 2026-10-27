const express = require('express');
const router = express.Router();
const {
  getTrackingUpdates,
  simulateGpsDeviation,
  acknowledgeAlert,
  getRouteWaypoints
} = require('../controllers/trackingController');

router.get('/updates', getTrackingUpdates);
router.get('/route/:id', getRouteWaypoints);
router.post('/simulate-deviation', simulateGpsDeviation);
router.post('/acknowledge-alert', acknowledgeAlert);

module.exports = router;

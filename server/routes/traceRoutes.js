const express = require('express');
const router = express.Router();
const {
  forwardTrace,
  backwardTrace,
  defectImpact,
} = require('../controllers/traceController');

// Forward Trace
router.get('/forward', forwardTrace);
router.get('/forward/:identifier', forwardTrace);

// Backward Trace
router.get('/backward', backwardTrace);
router.get('/backward/:identifier', backwardTrace);

// Real-time Defect Impact Calculation
router.get('/defect-impact/:batchId', defectImpact);

module.exports = router;

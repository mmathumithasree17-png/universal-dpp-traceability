const express = require('express');
const router = express.Router();
const {
  getAllShipments,
  getShipmentById,
  createShipment,
  getShipmentTraceability,
  updateShipmentChecklist,
} = require('../controllers/shipmentController');

router.get('/', getAllShipments);
router.get('/:id', getShipmentById);
router.get('/:id/traceability', getShipmentTraceability);
router.patch('/:id/checklist', updateShipmentChecklist);
router.post('/', createShipment);

module.exports = router;

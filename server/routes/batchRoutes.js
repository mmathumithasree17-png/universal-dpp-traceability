const express = require('express');
const router = express.Router();
const {
  getAllBatches,
  getBatchById,
  createBatch,
  quarantineBatch,
} = require('../controllers/batchController');

router.get('/', getAllBatches);
router.get('/:id', getBatchById);
router.post('/', createBatch);
router.post('/:id/quarantine', quarantineBatch);

module.exports = router;

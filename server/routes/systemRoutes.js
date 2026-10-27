const express = require('express');
const router = express.Router();
const {
  getHealth,
  getNetworkInfo,
  triggerSeed,
  clearDataset,
  importDataset,
  exportDataset,
} = require('../controllers/systemController');
const { getDashboardStats } = require('../controllers/statsController');

router.get('/health', getHealth);
router.get('/network', getNetworkInfo);
router.get('/stats', getDashboardStats);
router.post('/seed', triggerSeed);
router.post('/clear-dataset', clearDataset);
router.post('/import-dataset', importDataset);
router.get('/export-dataset', exportDataset);

module.exports = router;

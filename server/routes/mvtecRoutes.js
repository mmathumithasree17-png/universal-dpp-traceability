const express = require('express');
const router = express.Router();
const { getMvtecSamples, runMvtecInspection } = require('../controllers/mvtecController');

router.get('/samples', getMvtecSamples);
router.post('/inspect', runMvtecInspection);

module.exports = router;

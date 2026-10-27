const express = require('express');
const router = express.Router();
const {
  getAllDefects,
  getDefectById,
  evaluateImpactPreview,
  createAndExecuteDefect,
} = require('../controllers/defectController');

// GET all defects
router.get('/', getAllDefects);

// GET preview of defect blast radius without committing
router.get('/preview', evaluateImpactPreview);

// GET specific defect by ID
router.get('/:id', getDefectById);

// POST create and commit defect with automated containment and duplicate prevention
router.post('/', createAndExecuteDefect);

module.exports = router;

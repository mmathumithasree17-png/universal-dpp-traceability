const express = require('express');
const router = express.Router();
const { getGenealogyGraph } = require('../controllers/genealogyController');

// GET /api/genealogy/graph
router.get('/graph', getGenealogyGraph);

module.exports = router;

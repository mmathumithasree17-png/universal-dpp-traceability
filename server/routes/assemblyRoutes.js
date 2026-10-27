const express = require('express');
const router = express.Router();
const { getAllAssemblies, getAssemblyById, createAssembly } = require('../controllers/assemblyController');

router.get('/', getAllAssemblies);
router.post('/', createAssembly);
router.get('/:id', getAssemblyById);

module.exports = router;

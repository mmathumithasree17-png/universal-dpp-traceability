const express = require('express');
const router = express.Router();
const { getAllComponents, getComponentById, createComponent } = require('../controllers/componentController');

router.get('/', getAllComponents);
router.post('/', createComponent);
router.get('/:id', getComponentById);

module.exports = router;

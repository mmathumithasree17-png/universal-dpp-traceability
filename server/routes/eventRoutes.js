const express = require('express');
const router = express.Router();
const { getAllEvents, createEvent, getEventById, getTargetLookups } = require('../controllers/eventController');

router.get('/', getAllEvents);
router.get('/lookups', getTargetLookups);
router.get('/:id', getEventById);
router.post('/', createEvent);

module.exports = router;

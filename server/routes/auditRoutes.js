const express = require('express');
const router = express.Router();
const {
  getAllAuditRecords,
  verifyAuditIntegrity,
  getAuditRecordById,
  simulateTamper,
  restoreTamper,
  disallowAuditModification,
} = require('../controllers/auditController');

// Verification & Query routes
router.get('/', getAllAuditRecords);
router.get('/verify', verifyAuditIntegrity);
router.get('/:id', getAuditRecordById);

// Controlled Demo / Testing simulation endpoints
router.post('/tamper-demo', simulateTamper);
router.post('/restore-demo', restoreTamper);

// Guard against direct modification / deletion by normal users
router.post('/', disallowAuditModification);
router.put('/:id', disallowAuditModification);
router.patch('/:id', disallowAuditModification);
router.delete('/:id', disallowAuditModification);
router.delete('/', disallowAuditModification);

module.exports = router;

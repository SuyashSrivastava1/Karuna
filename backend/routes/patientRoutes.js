const express = require('express');
const router = express.Router();
const {
    getPatientTags, createPatientTag, updatePatientTag,
    deletePatientTag, getNextPatientId
} = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:siteId', protect, getPatientTags);
router.get('/:siteId/next-id', protect, getNextPatientId);  // for nurse auto-ID generation
router.post('/', protect, authorize('doctor', 'volunteer'), createPatientTag);  // nurses (volunteers) create tags
router.put('/:id', protect, authorize('doctor', 'volunteer'), updatePatientTag);
router.delete('/:id', protect, authorize('doctor'), deletePatientTag);

module.exports = router;

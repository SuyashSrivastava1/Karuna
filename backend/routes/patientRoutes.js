const express = require('express');
const router = express.Router();
const { getPatientTags, createPatientTag, updatePatientTag, deletePatientTag } = require('../controllers/patientController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:siteId', protect, getPatientTags);
router.post('/', protect, authorize('doctor'), createPatientTag);
router.put('/:id', protect, authorize('doctor'), updatePatientTag);
router.delete('/:id', protect, authorize('doctor'), deletePatientTag);

module.exports = router;

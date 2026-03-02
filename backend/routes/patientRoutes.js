const express = require('express');
const router = express.Router();
const { getPatientTags, createPatientTag } = require('../controllers/patientController');
const { protect } = require('../middleware/auth');

router.get('/:siteId', protect, getPatientTags);
router.post('/', protect, createPatientTag);

module.exports = router;

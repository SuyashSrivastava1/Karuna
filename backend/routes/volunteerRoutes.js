const express = require('express');
const router = express.Router();
const { assignVolunteerTrack } = require('../controllers/volunteerController');
const { protect } = require('../middleware/auth');

router.post('/assign', protect, assignVolunteerTrack);

module.exports = router;

const express = require('express');
const router = express.Router();
const { assignVolunteerTrack, getMyAssignment } = require('../controllers/volunteerController');
const { protect } = require('../middleware/auth');

router.post('/assign', protect, assignVolunteerTrack);
router.get('/me', protect, getMyAssignment);

module.exports = router;

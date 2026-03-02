const express = require('express');
const router = express.Router();
const { getSites, getSiteById, createSite, updateSite, joinSite, getSiteStats } = require('../controllers/siteController');
const { protect } = require('../middleware/auth');

router.get('/', getSites);
router.get('/:id', getSiteById);
router.get('/:id/stats', getSiteStats);
router.post('/', protect, createSite);
router.put('/:id', protect, updateSite);
router.post('/:id/join', protect, joinSite);

module.exports = router;

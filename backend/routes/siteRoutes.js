const express = require('express');
const router = express.Router();
const { getSites, getSiteById, createSite } = require('../controllers/siteController');
const { protect } = require('../middleware/auth');

router.get('/', getSites);
router.get('/:id', getSiteById);
router.post('/', protect, createSite);

module.exports = router;

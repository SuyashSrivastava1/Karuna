const express = require('express');
const router = express.Router();
const { createFlag, getFlagsBySite, updateFlag } = require('../controllers/flagController');
const { protect } = require('../middleware/auth');

router.get('/:siteId', protect, getFlagsBySite);
router.post('/', protect, createFlag);
router.put('/:id', protect, updateFlag);

module.exports = router;

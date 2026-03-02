const express = require('express');
const router = express.Router();
const { createDonation, getDonations, getDonationById, updateDonation } = require('../controllers/donationController');
const { protect } = require('../middleware/auth');

router.post('/', createDonation);
router.get('/', protect, getDonations);
router.get('/:id', protect, getDonationById);
router.put('/:id', protect, updateDonation);

module.exports = router;

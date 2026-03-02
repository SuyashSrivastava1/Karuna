const express = require('express');
const router = express.Router();
const { getOrders, createOrder, updateOrder, getPickupOrders } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.get('/:siteId', protect, getOrders);
router.get('/:siteId/pickup', protect, getPickupOrders);
router.post('/', protect, authorize('doctor'), createOrder);
router.put('/:id', protect, authorize('pharmacy'), updateOrder);

module.exports = router;

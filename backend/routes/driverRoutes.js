const express = require('express');
const router = express.Router();
const { updateStatus, getTasks } = require('../controllers/driverController');

router.put('/status', updateStatus);
router.get('/tasks', getTasks);

module.exports = router;

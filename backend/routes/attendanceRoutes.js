const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateJWT } = require('../middleware/auth');

router.use(authenticateJWT);

router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/', attendanceController.getAttendanceLogs);
router.get('/me', attendanceController.getMyAttendanceSummary);

module.exports = router;

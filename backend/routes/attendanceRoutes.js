const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

router.use(authenticateJWT);

router.post('/check-in', attendanceController.checkIn);
router.post('/check-out', attendanceController.checkOut);
router.get('/me', attendanceController.getMyAttendance);
router.get('/', requireRole(['admin', 'hr', 'manager']), attendanceController.getAllAttendance);

module.exports = router;

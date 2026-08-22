const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

router.use(authenticateJWT);

router.get('/analytics', reportController.getAnalyticsSummary);
router.get('/salary-slip/:employeeId', reportController.generateSalarySlip);
router.get('/attendance', reportController.getAttendanceReport);

module.exports = router;

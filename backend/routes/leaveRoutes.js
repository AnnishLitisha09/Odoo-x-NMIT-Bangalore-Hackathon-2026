const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticateJWT);

router.post('/', upload.single('attachment'), leaveController.applyLeave);
router.get('/', leaveController.getLeaveRequests);
router.patch('/:id/approve', requireRole(['admin', 'hr', 'manager']), leaveController.approveLeave);
router.patch('/:id/reject', requireRole(['admin', 'hr', 'manager']), leaveController.rejectLeave);

module.exports = router;

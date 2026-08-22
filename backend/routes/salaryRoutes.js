const express = require('express');
const router = express.Router();
const salaryController = require('../controllers/salaryController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

router.use(authenticateJWT);
router.use(requireRole(['admin', 'hr']));

router.get('/:id/salary', salaryController.getSalaryInfo);
router.put('/:id/salary', salaryController.updateSalaryInfo);

module.exports = router;

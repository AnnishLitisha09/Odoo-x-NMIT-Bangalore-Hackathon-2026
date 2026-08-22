const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateJWT);

// Only Admin/HR can create employees
router.post('/', requireRole(['admin', 'hr']), employeeController.createEmployee);

// Grid listing and detailed fetch
router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);

// Update route handles its own authorization rules
router.patch('/:id', employeeController.updateEmployee);

// Skill sub-routes
router.post('/:employeeId/skills', employeeController.addSkill);
router.delete('/:employeeId/skills/:id', employeeController.removeSkill);

// Certification sub-routes
router.post('/:employeeId/certifications', employeeController.addCertification);
router.delete('/:employeeId/certifications/:id', employeeController.removeCertification);

module.exports = router;

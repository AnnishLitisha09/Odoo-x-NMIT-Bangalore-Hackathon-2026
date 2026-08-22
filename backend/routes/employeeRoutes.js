const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticateJWT);

router.get('/', employeeController.getEmployees);
router.get('/:id', employeeController.getEmployeeById);
router.post('/', requireRole(['admin', 'hr']), upload.single('profile_picture'), employeeController.createEmployee);
router.patch('/:id', requireRole(['admin', 'hr']), employeeController.updateEmployee);

router.post('/:id/skills', employeeController.addSkill);
router.delete('/:id/skills/:skillId', employeeController.removeSkill);

router.post('/:id/certifications', upload.single('document'), employeeController.addCertification);
router.delete('/:id/certifications/:certId', employeeController.removeCertification);

module.exports = router;

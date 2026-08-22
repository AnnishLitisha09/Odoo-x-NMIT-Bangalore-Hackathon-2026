const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/login', authController.login);
router.post('/change-password', authenticateJWT, authController.changePassword);
router.post('/register', upload.single('logo'), authController.register);
router.get('/company', authController.getCompany);

module.exports = router;

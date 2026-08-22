const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const leaveController = require('../controllers/leaveController');
const { authenticateJWT, requireRole } = require('../middleware/auth');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for leave attachments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'leave-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed.'));
    }
  }
});

router.use(authenticateJWT);

// Create and List requests
router.post('/', upload.single('attachment'), leaveController.applyLeave);
router.get('/', leaveController.getLeaveRequests);

// Inline review actions (Admin/HR only)
router.patch('/:id/approve', requireRole(['admin', 'hr']), (req, res, next) => {
  req.body.action = 'approve';
  next();
}, leaveController.reviewLeaveRequest);

router.patch('/:id/reject', requireRole(['admin', 'hr']), (req, res, next) => {
  req.body.action = 'reject';
  next();
}, leaveController.reviewLeaveRequest);

module.exports = router;

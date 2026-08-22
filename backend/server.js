require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const sequelize       = require('./config/database');
const createDatabase  = require('./config/create-db');

const authRoutes       = require('./routes/authRoutes');
const employeeRoutes   = require('./routes/employeeRoutes');
const salaryRoutes     = require('./routes/salaryRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes      = require('./routes/leaveRoutes');

const { authenticateJWT, requireRole } = require('./middleware/auth');
const leaveController     = require('./controllers/leaveController');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/employees',   employeeRoutes);
app.use('/api/employees',   salaryRoutes);           // nested: /:id/salary
app.use('/api/attendance',  attendanceRoutes);
app.use('/api/leave-requests', leaveRoutes);

// Standalone endpoints outside module routers
app.get('/api/leave-balance/me',  authenticateJWT, leaveController.getMyLeaveBalance);
app.get('/api/leave-balance/all', authenticateJWT, requireRole(['admin', 'hr']), leaveController.getAllLeaveBalances);
app.put('/api/leave-balance/:employeeId', authenticateJWT, requireRole(['admin', 'hr']), leaveController.updateLeaveBalance);
app.get('/api/holidays',          authenticateJWT, leaveController.getHolidays);

// ─── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error.',
  });
});

// ─── Start ─────────────────────────────────────────────────────────────────────
async function start() {
  try {
    // Ensure the MySQL database exists before connecting
    await createDatabase();

    // Verify connection — schema is managed by Sequelize CLI migrations,
    // NOT by sequelize.sync() so we never accidentally alter/drop production data.
    await sequelize.authenticate();
    console.log(`✅  Database connected (${process.env.DB_NAME})`);

    app.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
      console.log(`    Run "npm run db:migrate && npm run db:seed" to initialise the schema.`);
    });
  } catch (err) {
    console.error('❌  Startup failed:', err.message);
    process.exit(1);
  }
}

start();

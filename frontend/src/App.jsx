import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RequireAuth, RequireAdminOrHr } from './components/RoleGuard';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ResetPassword from './pages/ResetPassword';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeDirectory from './pages/EmployeeDirectory';
import EmployeeProfile from './pages/EmployeeProfile';
import Attendance from './pages/Attendance';
import TimeOff from './pages/TimeOff';
import LeaveAllocation from './pages/LeaveAllocation';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"  element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Semi-public: authenticated but must reset password */}
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ── Employee routes ──────────────────────────────────── */}
          {/* Employee dashboard — employees land here after login */}
          <Route path="/home" element={<RequireAuth><EmployeeDashboard /></RequireAuth>} />

          {/* Self-profile — any authenticated user can view their own profile */}
          <Route path="/profile/me" element={<RequireAuth><EmployeeProfile /></RequireAuth>} />

          {/* ── Shared routes (role-filtered data inside) ─────────── */}
          <Route path="/attendance"   element={<RequireAuth><Attendance /></RequireAuth>} />
          <Route path="/timeoff"      element={<RequireAuth><TimeOff /></RequireAuth>} />

          {/* ── Admin / HR only routes ────────────────────────────── */}
          <Route path="/employees"    element={<RequireAuth><RequireAdminOrHr><EmployeeDirectory /></RequireAdminOrHr></RequireAuth>} />
          <Route path="/employees/:id" element={<RequireAuth><RequireAdminOrHr><EmployeeProfile /></RequireAdminOrHr></RequireAuth>} />
          <Route path="/timeoff/allocation" element={<RequireAuth><RequireAdminOrHr><LeaveAllocation /></RequireAdminOrHr></RequireAuth>} />

          {/* Legacy redirects */}
          <Route path="/time-off" element={<Navigate to="/timeoff" replace />} />
          <Route path="/"         element={<Navigate to="/employees" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

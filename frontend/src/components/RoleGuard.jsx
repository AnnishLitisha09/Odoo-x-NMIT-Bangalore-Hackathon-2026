import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Protects a route requiring authentication.
 * If mustResetPassword is true, always redirect to /reset-password.
 */
export function RequireAuth({ children }) {
  const { user, token, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--color-text-muted)', background: 'var(--color-bg)' }}>Loading…</div>;
  if (!user || !token) return <Navigate to="/login" replace />;
  if (user.mustResetPassword) return <Navigate to="/reset-password" replace />;
  return children;
}

/**
 * Protects a route requiring specific role(s).
 * roles: string | string[]
 * Redirects employees → /home, non-auth → /login
 */
export function RequireRole({ roles, children }) {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (!user || !token) return <Navigate to="/login" replace />;
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(user.role)) {
    // Employees go home; others go to login
    return <Navigate to={user.role === 'employee' ? '/home' : '/login'} replace />;
  }
  return children;
}

/**
 * Employee-only guard — redirects admin/hr to /employees
 */
export function RequireEmployee({ children }) {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (!user || !token) return <Navigate to="/login" replace />;
  if (user.mustResetPassword) return <Navigate to="/reset-password" replace />;
  if (['admin', 'hr'].includes(user.role)) return <Navigate to="/employees" replace />;
  return children;
}

/**
 * Admin/HR-only guard — redirects regular employees to /home
 */
export function RequireAdminOrHr({ children }) {
  const { user, token, loading } = useAuth();
  if (loading) return null;
  if (!user || !token) return <Navigate to="/login" replace />;
  if (user.mustResetPassword) return <Navigate to="/reset-password" replace />;
  if (!['admin', 'hr'].includes(user.role)) return <Navigate to="/home" replace />;
  return children;
}

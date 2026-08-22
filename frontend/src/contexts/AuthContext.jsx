import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hrms_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('hrms_user');
    const storedCompany = localStorage.getItem('hrms_company');
    if (stored && token) {
      try {
        const parsed = JSON.parse(stored);
        // Re-normalize in case old sessions didn't have flat employeeId
        const normalized = {
          ...parsed,
          employeeId: parsed.employeeId ?? parsed.employee?.id ?? null,
          firstName: parsed.firstName ?? parsed.employee?.firstName ?? null,
          lastName: parsed.lastName ?? parsed.employee?.lastName ?? null,
          profilePicUrl: parsed.profilePicUrl ?? parsed.employee?.profilePicUrl ?? null,
        };
        setUser(normalized);
        if (storedCompany) setCompany(JSON.parse(storedCompany));
      } catch { logout(); }
    }
    setLoading(false);
  }, []);

  function normalizeUser(u) {
    // Ensure employeeId is always a flat top-level field
    return {
      ...u,
      employeeId: u.employeeId ?? u.employee?.id ?? null,
      firstName: u.firstName ?? u.employee?.firstName ?? null,
      lastName: u.lastName ?? u.employee?.lastName ?? null,
      profilePicUrl: u.profilePicUrl ?? u.employee?.profilePicUrl ?? null,
    };
  }

  function login(data) {
    const { token: t, user: u, company: c } = data;
    const normalized = normalizeUser(u);
    localStorage.setItem('hrms_token', t);
    localStorage.setItem('hrms_user', JSON.stringify(normalized));
    localStorage.setItem('hrms_company', JSON.stringify(c));
    setToken(t);
    setUser(normalized);
    setCompany(c);
  }

  function logout() {
    localStorage.removeItem('hrms_token');
    localStorage.removeItem('hrms_user');
    localStorage.removeItem('hrms_company');
    setToken(null);
    setUser(null);
    setCompany(null);
  }

  function updateUser(partial) {
    setUser(prev => {
      const updated = { ...prev, ...partial };
      localStorage.setItem('hrms_user', JSON.stringify(updated));
      return updated;
    });
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'hr';

  return (
    <AuthContext.Provider value={{ user, company, token, loading, login, logout, updateUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

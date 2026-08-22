const BASE = '/api';

async function request(method, path, body, token, isFormData = false) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

// Auth API calls
export const apiLogin = (creds) => request('POST', '/auth/login', creds);
export const apiChangePassword = (body, token) => request('POST', '/auth/change-password', body, token);
export const apiRegister = (formData) => request('POST', '/auth/register', formData, null, true);

// Employee API calls
export const apiGetEmployees = (token, search = '') => request('GET', `/employees${search ? `?search=${search}` : ''}`, null, token);
export const apiGetEmployee = (id, token) => request('GET', `/employees/${id}`, null, token);
export const apiCreateEmployee = (body, token) => request('POST', '/employees', body, token);

// Attendance API calls
export const apiCheckIn = (token) => request('POST', '/attendance/check-in', {}, token);
export const apiCheckOut = (token) => request('POST', '/attendance/check-out', {}, token);
export const apiGetAttendance = (token, params = {}) => request('GET', `/attendance?${new URLSearchParams(params)}`, null, token);

// Leave API calls
export const apiApplyLeave = (formData, token) => request('POST', '/leave-requests', formData, token, true);
export const apiGetLeaveRequests = (token, params = {}) => request('GET', `/leave-requests?${new URLSearchParams(params)}`, null, token);
export const apiGetLeaveBalance = (token) => request('GET', '/leave-balance/me', null, token);

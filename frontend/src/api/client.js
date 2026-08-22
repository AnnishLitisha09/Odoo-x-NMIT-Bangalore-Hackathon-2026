const BASE = '/api';

function authHeaders(token) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

async function request(method, path, body, token, isFormData = false) {
  const headers = { Authorization: `Bearer ${token}` };
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

// Auth
export const apiLogin = (creds) =>
  request('POST', '/auth/login', creds);

export const apiChangePassword = (body, token) =>
  request('POST', '/auth/change-password', body, token);

export const apiRegister = (formData) =>
  request('POST', '/auth/register', formData, null, true);

export const apiGetCompany = () =>
  request('GET', '/auth/company');

// Employees
export const apiGetEmployees = (token, search = '') =>
  request('GET', `/employees${search ? `?search=${search}` : ''}`, null, token);

export const apiGetEmployee = (id, token) =>
  request('GET', `/employees/${id}`, null, token);

export const apiCreateEmployee = (body, token) =>
  request('POST', '/employees', body, token);

export const apiUpdateEmployee = (id, body, token) =>
  request('PATCH', `/employees/${id}`, body, token);

export const apiAddSkill = (empId, body, token) =>
  request('POST', `/employees/${empId}/skills`, body, token);

export const apiRemoveSkill = (empId, skillId, token) =>
  request('DELETE', `/employees/${empId}/skills/${skillId}`, null, token);

export const apiAddCertification = (empId, body, token) =>
  request('POST', `/employees/${empId}/certifications`, body, token);

export const apiRemoveCertification = (empId, certId, token) =>
  request('DELETE', `/employees/${empId}/certifications/${certId}`, null, token);

// Salary (admin only)
export const apiGetSalary = (empId, token) =>
  request('GET', `/employees/${empId}/salary`, null, token);

export const apiUpdateSalary = (empId, body, token) =>
  request('PUT', `/employees/${empId}/salary`, body, token);

// Attendance
export const apiCheckIn = (token) =>
  request('POST', '/attendance/check-in', {}, token);

export const apiCheckOut = (token) =>
  request('POST', '/attendance/check-out', {}, token);

export const apiGetAttendance = (token, { employeeId, date } = {}) => {
  const params = new URLSearchParams();
  if (employeeId) params.set('employeeId', employeeId);
  if (date) params.set('date', date);
  return request('GET', `/attendance?${params}`, null, token);
};

export const apiGetMyAttendance = (token, { from, to } = {}) => {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return request('GET', `/attendance/me?${params}`, null, token);
};

// Leave
export const apiApplyLeave = (formData, token) =>
  request('POST', '/leave-requests', formData, token, true);

export const apiGetLeaveRequests = (token, params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request('GET', `/leave-requests${q ? `?${q}` : ''}`, null, token);
};

export const apiApproveLeave = (id, body, token) =>
  request('PATCH', `/leave-requests/${id}/approve`, body, token);

export const apiRejectLeave = (id, body, token) =>
  request('PATCH', `/leave-requests/${id}/reject`, body, token);

export const apiGetLeaveBalance = (token) =>
  request('GET', '/leave-balance/me', null, token);

export const apiGetAllLeaveBalances = (token, year) =>
  request('GET', `/leave-balance/all${year ? `?year=${year}` : ''}`, null, token);

export const apiUpdateLeaveBalance = (employeeId, body, token) =>
  request('PUT', `/leave-balance/${employeeId}`, body, token);

export const apiGetHolidays = (token) =>
  request('GET', '/holidays', null, token);

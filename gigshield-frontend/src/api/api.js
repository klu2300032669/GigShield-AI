import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://gigshield-backend-rzzd.onrender.com/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gigshield_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: unwrap ApiResponse wrapper + handle 401 with token refresh
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry && 
        !originalRequest.url.includes('/login') && 
        !originalRequest.url.includes('/register')) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('gigshield_refresh_token');
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(`${API_BASE}/workers/refresh-token`, {
            refreshToken
          });

          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;

          localStorage.setItem('gigshield_access_token', accessToken);
          localStorage.setItem('gigshield_refresh_token', newRefreshToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          const retryResponse = await api(originalRequest);
          return retryResponse;
        } catch (refreshError) {
          console.error('Initial token refresh failed:', refreshError);
          // Refresh failed — soft logout (no page reload)
          localStorage.removeItem('gigshield_worker');
          localStorage.removeItem('gigshield_access_token');
          localStorage.removeItem('gigshield_refresh_token');
          // Dispatch a custom event so AuthContext can handle the logout
          window.dispatchEvent(new CustomEvent('gigshield:session-expired'));
          return Promise.reject(new Error('Session expired. Please login again.'));
        }
      } else {
        // No refresh token — soft logout
        localStorage.removeItem('gigshield_worker');
        localStorage.removeItem('gigshield_access_token');
        localStorage.removeItem('gigshield_refresh_token');
        window.dispatchEvent(new CustomEvent('gigshield:session-expired'));
        return Promise.reject(new Error('Session expired. Please login again.'));
      }
    }

    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// ---- Worker APIs ----
export const workerApi = {
  register: (data) => api.post('/workers/register', data),
  login: (data) => api.post('/workers/login', data),
  refreshToken: (refreshToken) => api.post('/workers/refresh-token', { refreshToken }),
  getWorker: (id) => api.get(`/workers/${id}`),
  updateWorker: (id, data) => api.put(`/workers/${id}`, data),
  getDashboard: (id) => api.get(`/workers/${id}/dashboard`),
  verifyEmail: (data) => api.post('/workers/verify-email', data),
  resetPassword: (data) => api.post('/workers/forgot-password', {
    email: data.email,
    otpCode: data.otpCode,
    newPassword: data.newPassword
  }),
  changePassword: (id, data) => api.post(`/workers/${id}/change-password`, data),
};

// ---- OTP APIs ----
export const otpApi = {
  sendOtp: (data) => api.post('/otp/send', data),
  verifyOtp: (email, otpCode) => api.post('/otp/verify', { email, otpCode }),
};

// ---- Policy APIs ----
export const policyApi = {
  getPlans: () => api.get('/policies/plans'),
  purchase: (data) => api.post('/policies/purchase', data),
  getWorkerPolicies: (workerId) => api.get(`/policies/worker/${workerId}`),
  cancel: (policyId) => api.put(`/policies/${policyId}/cancel`),
};

// ---- Claim APIs ----
export const claimApi = {
  triggerClaim: (data) => api.post('/claims/trigger', data),
  getWorkerClaims: (workerId) => api.get(`/claims/worker/${workerId}`),
  getClaimById: (claimId) => api.get(`/claims/${claimId}`),
};

// ---- Notification APIs ----
export const notificationApi = {
  getWorkerNotifications: (workerId) => api.get(`/notifications/worker/${workerId}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

// ---- Payout APIs ----
export const payoutApi = {
  getWorkerPayouts: (workerId) => api.get(`/payouts/worker/${workerId}`),
};

// ---- Environmental Event APIs ----
export const eventApi = {
  recordEvent: (data) => api.post('/events', data),
  getByCity: (city) => api.get(`/events/city/${city}`),
  getRecent: () => api.get('/events/recent'),
};

// ---- Admin APIs ----
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getWorkers: () => api.get('/admin/workers'),
  toggleWorkerStatus: (id) => api.put(`/admin/workers/${id}/toggle-status`),
  promoteWorker: (id) => api.put(`/admin/workers/${id}/promote`),
  deleteWorker: (id) => api.delete(`/admin/workers/${id}`),
  getClaims: () => api.get('/admin/claims'),
  approveClaim: (id) => api.put(`/admin/claims/${id}/approve`),
  rejectClaim: (id) => api.put(`/admin/claims/${id}/reject`),
  deleteClaim: (id) => api.delete(`/admin/claims/${id}`),
  getPayouts: () => api.get('/admin/payouts'),
  completePayout: (id, transactionRef) => api.put(`/admin/payouts/${id}/complete`, { transactionRef }),
  getEvents: () => api.get('/admin/events'),
  sendNotification: (data) => api.post('/admin/notifications/send', data),
  broadcastNotification: (data) => api.post('/admin/notifications/broadcast', data),
};

// ---- AI Service APIs (direct) ----
export const aiApi = {
  getHealth: () => axios.get('http://localhost:8000/health'),
  getModelInfo: () => axios.get('http://localhost:8000/model-info'),
  getMetrics: () => axios.get('http://localhost:8000/metrics'),
  analyzeFraud: (data) => axios.post('http://localhost:8000/detect-fraud', data),
};

// ---- Payment APIs ----
export const paymentApi = {
  createIntent: (data) => api.post('/payments/create-intent', data),
};

// ---- Invoice APIs ----
export const invoiceApi = {
  downloadPolicyInvoice: (policyId) => api.get(`/invoices/policy/${policyId}/download`, { responseType: 'blob' }),
  downloadClaimInvoice: (claimId) => api.get(`/invoices/claim/${claimId}/download`, { responseType: 'blob' }),
};

// ---- Messaging APIs ----
export const messageApi = {
  send: (data) => api.post('/messages/send', data),
  getAll: (workerId) => api.get(`/messages/${workerId}`),
  getInbox: (workerId) => api.get(`/messages/${workerId}/inbox`),
  markAsRead: (id) => api.put(`/messages/${id}/read`),
  getUnreadCount: (workerId) => api.get(`/messages/${workerId}/unread-count`),
};

// ---- Report APIs ----
export const reportApi = {
  downloadClaimsCsv: () => api.get('/reports/claims/csv', { responseType: 'blob' }),
  downloadClaimsPdf: () => api.get('/reports/claims/pdf', { responseType: 'blob' }),
};

// ---- Webhook APIs (admin) ----
export const webhookApi = {
  register: (data) => api.post('/webhooks/register', data),
  getAll: () => api.get('/webhooks'),
  deactivate: (id) => api.put(`/webhooks/${id}/deactivate`),
};

// ---- Admin Extended APIs ----
export const adminExtendedApi = {
  getAuditLogs: (page = 0, size = 20) => api.get(`/admin/audit-logs?page=${page}&size=${size}`),
  getChartData: () => api.get('/admin/analytics/chart-data'),
};


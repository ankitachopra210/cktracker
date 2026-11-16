import api from './api';

// Employees & Tasks
export const getEmployees = async (params = {}) => {
  return await api.get('/users/employees', { params });
};

export const createEmployee = async (data) => {
  return await api.post('/users/employees', data);
};

export const getTasks = async (params = {}) => {
  return await api.get('/users/tasks', { params });
};

export const createTask = async (data) => {
  return await api.post('/users/tasks', data);
};

export const updateTaskStatus = async (id, status) => {
  return await api.put(`/users/tasks/${id}/status`, { status });
};

// Analytics & Reports
export const getAnalyticsOverview = async () => {
  return await api.get('/analytics/overview');
};

export const getMonthlyRevenue = async () => {
  return await api.get('/analytics/monthly-revenue');
};

export const getStageDistribution = async () => {
  return await api.get('/analytics/stage-distribution');
};

export const getConversionFunnel = async () => {
  return await api.get('/analytics/conversion-funnel');
};

export const getBottlenecks = async () => {
  return await api.get('/analytics/bottlenecks');
};

// Support & Warranty
export const getSupportTickets = async (params = {}) => {
  return await api.get('/support/tickets', { params });
};

export const createSupportTicket = async (data) => {
  return await api.post('/support/tickets', data);
};

export const updateTicket = async (id, data) => {
  return await api.put(`/support/tickets/${id}`, data);
};

export const getWarranties = async () => {
  return await api.get('/support/warranties');
};

// Notifications
export const getNotifications = async () => {
  return await api.get('/notifications');
};

export const markNotificationRead = async (id) => {
  return await api.put(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async () => {
  return await api.put('/notifications/read-all');
};

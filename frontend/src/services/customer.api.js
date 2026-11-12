import api from './api';

export const getCustomers = async (params = {}) => {
  return await api.get('/customers', { params });
};

export const getCustomerById = async (id) => {
  return await api.get(`/customers/${id}`);
};

export const createCustomer = async (data) => {
  return await api.post('/customers', data);
};

export const updateCustomer = async (id, data) => {
  return await api.put(`/customers/${id}`, data);
};

export const logCustomerInteraction = async (id, data) => {
  return await api.post(`/customers/${id}/interactions`, data);
};

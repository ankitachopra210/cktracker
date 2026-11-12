import api from './api';

export const getInventory = async (params = {}) => {
  return await api.get('/inventory', { params });
};

export const getInventoryItemById = async (id) => {
  return await api.get(`/inventory/${id}`);
};

export const createInventoryItem = async (data) => {
  return await api.post('/inventory', data);
};

export const allocateStock = async (itemId, data) => {
  return await api.post(`/inventory/${itemId}/allocate`, data);
};

export const getSuppliers = async () => {
  return await api.get('/inventory/suppliers');
};

export const createSupplier = async (data) => {
  return await api.post('/inventory/suppliers', data);
};

export const createPurchaseOrder = async (data) => {
  return await api.post('/inventory/purchase-orders', data);
};

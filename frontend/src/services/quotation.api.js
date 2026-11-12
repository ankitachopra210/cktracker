import api from './api';

export const getProjectQuotations = async (projectId) => {
  return await api.get(`/quotations/project/${projectId}`);
};

export const getQuotationById = async (id) => {
  return await api.get(`/quotations/${id}`);
};

export const createQuotation = async (projectId, data) => {
  return await api.post(`/quotations/project/${projectId}`, data);
};

export const reviseQuotation = async (id, data) => {
  return await api.post(`/quotations/${id}/revise`, data);
};

export const submitQuotationDecision = async (id, decisionData) => {
  return await api.post(`/quotations/${id}/decision`, decisionData);
};

export const downloadQuotationPDF = async (id, quotationNumber = 'quotation') => {
  const token = localStorage.getItem('cktracker_token');
  const response = await fetch(`/api/quotations/${id}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download quotation PDF.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${quotationNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

export const sendQuotationEmail = async (id) => {
  return await api.post(`/quotations/${id}/send-email`);
};

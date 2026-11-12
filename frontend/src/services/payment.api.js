import api from './api';

export const getProjectPayments = async (projectId) => {
  return await api.get(`/payments/project/${projectId}`);
};

export const getPaymentSummary = async () => {
  return await api.get('/payments/summary');
};

export const recordPayment = async (data) => {
  return await api.post('/payments', data);
};

export const downloadReceiptPDF = async (paymentId, receiptNumber = 'receipt') => {
  const token = localStorage.getItem('cktracker_token');
  const response = await fetch(`/api/payments/${paymentId}/receipt-pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download receipt PDF.');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${receiptNumber}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

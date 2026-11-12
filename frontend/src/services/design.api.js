import api from './api';

export const getProjectDesigns = async (projectId) => {
  return await api.get(`/designs/project/${projectId}`);
};

export const getDesignById = async (id) => {
  return await api.get(`/designs/${id}`);
};

export const uploadDesign = async (projectId, data) => {
  return await api.post(`/designs/project/${projectId}`, data);
};

export const submitDesignDecision = async (id, decisionData) => {
  return await api.post(`/designs/${id}/decision`, decisionData);
};

import api from './api';

export const getProjects = async (params = {}) => {
  return await api.get('/projects', { params });
};

export const getProjectById = async (id) => {
  return await api.get(`/projects/${id}`);
};

export const createProject = async (data) => {
  return await api.post('/projects', data);
};

export const updateProject = async (id, data) => {
  return await api.put(`/projects/${id}`, data);
};

export const updateProjectStage = async (projectId, stageId, data) => {
  return await api.put(`/projects/${projectId}/stages/${stageId}`, data);
};

export const uploadStagePhoto = async (projectId, stageId, formData) => {
  return await api.post(`/projects/${projectId}/stages/${stageId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// src/services/leadService.js
import axios from 'axios';
import config from '../config';

const API_URL = `${config.API_URL}/leads`;

// Create axios instance with auth token
const authAxios = axios.create();

// Add a request interceptor
authAxios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Get all leads with optional filters
const getLeads = async (params = {}) => {
  const response = await authAxios.get(API_URL, { params });
  return response.data;
};

// Get single lead
const getLeadById = async (id) => {
  const response = await authAxios.get(`${API_URL}/${id}`);
  return response.data;
};

// Create new lead
const createLead = async (leadData) => {
  const response = await authAxios.post(API_URL, leadData);
  return response.data;
};

// Update lead
const updateLead = async (id, leadData) => {
  const response = await authAxios.put(`${API_URL}/${id}`, leadData);
  return response.data;
};

// Delete lead
const deleteLead = async (id) => {
  const response = await authAxios.delete(`${API_URL}/${id}`);
  return response.data;
};

// Delete multiple leads
const deleteMultipleLeads = async (ids) => {
  const response = await authAxios.delete(`${API_URL}/multiple`, { data: { ids } });
  return response.data;
};

// Upload CSV
const uploadLeadsCsv = async (file) => {
  const formData = new FormData();
  formData.append('csv', file);
  
  const response = await authAxios.post(`${API_URL}/upload`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  
  return response.data;
};

const leadService = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  deleteMultipleLeads,
  uploadLeadsCsv
};

export default leadService;
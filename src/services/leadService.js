// src/services/leadService.js
import axios from 'axios';
import config from '../config';

// Define Base URL using config
const BASE_URL = config.API_URL; // e.g., http://localhost:5000/api/crm

// Create axios instance with auth token
const authAxios = axios.create({
  baseURL: BASE_URL 
});

// Add a request interceptor
authAxios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure Content-Type is set for POST/PUT/PATCH unless it's FormData
    if (config.method && ['post', 'put', 'patch'].includes(config.method.toLowerCase())) {
       if (!(config.data instanceof FormData)) {
         config.headers['Content-Type'] = 'application/json';
       }
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Use paths relative to BASE_URL (which already includes /crm)
const getLeads = (params = {}) => authAxios.get('/leads', { params });
const getLeadById = (id) => authAxios.get(`/leads/${id}`);
const createLead = (leadData) => authAxios.post('/leads', leadData);
const updateLead = (id, leadData) => authAxios.put(`/leads/${id}`, leadData);
const deleteLead = (id) => authAxios.delete(`/leads/${id}`);
const deleteMultipleLeads = (ids) => authAxios.delete('/leads/multiple', { data: { ids } });
const uploadLeadsCsv = (formData) => authAxios.post('/leads/upload', formData, {
    headers: {
    'Content-Type': 'multipart/form-data',
  },
  });
const getWebsiteLeads = () => authAxios.get('/leads/website');
const assignLeadToAgent = (leadId, agentId) => authAxios.post(`/leads/assign/${leadId}`, { agentId });

// Get CRM users (agents)
// Remove the baseURL override, use the default base URL which includes /crm
const getAgents = () => authAxios.get('/users/agents'); 

// *** NEW: Service for updating status ***
const updateLeadStatus = (id, statusData) => authAxios.put(`/leads/${id}/status`, statusData); // statusData should be { status: '...', note: '...' }

const leadService = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  deleteMultipleLeads,
  uploadLeadsCsv,
  getWebsiteLeads,
  assignLeadToAgent,
  getAgents,
  updateLeadStatus
};

export default leadService;
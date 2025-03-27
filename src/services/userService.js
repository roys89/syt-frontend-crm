// src/services/userService.js
import axios from 'axios';
import config from '../config';

const API_URL = `${config.API_URL}/users`;

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

// Get all users
const getUsers = async () => {
  const response = await authAxios.get(API_URL);
  return response.data;
};

// Get single user
const getUserById = async (id) => {
  const response = await authAxios.get(`${API_URL}/${id}`);
  return response.data;
};

// Create new user
const createUser = async (userData) => {
  const response = await authAxios.post(API_URL, userData);
  return response.data;
};

// Update user
const updateUser = async (id, userData) => {
  const response = await authAxios.put(`${API_URL}/${id}`, userData);
  return response.data;
};

// Delete user
const deleteUser = async (id) => {
  const response = await authAxios.delete(`${API_URL}/${id}`);
  return response.data;
};

const userService = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};

export default userService;
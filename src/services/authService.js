// src/services/authService.js
import axios from 'axios';
import config from '../config';

const API_URL = `${config.API_URL}/auth`;

// Register user
const register = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error.response?.data || error.message);
    throw error;
  }
};

// Login user
const login = async (userData) => {
  try {
    console.log('Logging in with:', JSON.stringify(userData, null, 2));
    console.log('API URL:', `${API_URL}/login`);
    
    const response = await axios.post(`${API_URL}/login`, userData);
    console.log('Login response:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Login error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Get current user
const getCurrentUser = async () => {
  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token ? 'Present (not shown for security)' : 'Missing');
    
    if (!token) {
      throw new Error('Authentication token not found');
    }
    
    // Set up request config with auth header
    const config = {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
    
    // console.log('Making /me request with auth header');
    // console.log('Request URL:', `${API_URL}/me`);
    // console.log('Headers included:', JSON.stringify(config.headers, null, 2));
    
    // Make the API request
    const response = await axios.get(`${API_URL}/me`, config);
    
    console.log('User data retrieved successfully');
    return response.data.user;
  } catch (error) {
    console.error('getCurrentUser error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    if (error.response?.status === 401) {
      console.error('Auth error: Token may be invalid or expired');
    }
    
    throw error;
  }
};

// Create an axios instance with default auth header
const createAuthAxios = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.error('No token available for createAuthAxios');
    return axios.create();
  }
  
  console.log('Creating axios instance with auth token');
  const instance = axios.create({
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  // Add request interceptor to ensure token is always fresh
  instance.interceptors.request.use(
    config => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );
  
  return instance;
};

const authService = {
  register,
  login,
  getCurrentUser,
  createAuthAxios
};

export default authService;
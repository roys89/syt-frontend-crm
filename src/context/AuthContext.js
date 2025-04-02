// src/context/AuthContext.js
import axios from 'axios'; // Import axios
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import config from '../config'; // Import config for API_URL
import authService from '../services/authService';

// --- Create a dedicated axios instance for authenticated requests ---
const authAxios = axios.create({
  baseURL: config.API_URL // CORRECTED: Use API_URL from config for CRM backend
});

// Add a request interceptor to attach the token
authAxios.interceptors.request.use(
  (axiosConfig) => {
    const token = localStorage.getItem('token'); // Get token fresh from storage
    console.log('[authAxios Interceptor] Attaching token:', token ? 'Token found' : 'No token');
    if (token) {
      axiosConfig.headers.Authorization = `Bearer ${token}`;
    }
    // Important: return the modified config
    return axiosConfig;
  },
  (error) => {
    console.error('[authAxios Interceptor] Error:', error);
    return Promise.reject(error);
  }
);
// ------------------------------------------------------------------

export const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store token in both state and localStorage
  const storeToken = useCallback((newToken) => {
    console.log('Storing new token in state and localStorage');
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }, []);

  // Clear token from both state and localStorage
  const clearToken = useCallback(() => {
    console.log('Clearing token from state and localStorage');
    localStorage.removeItem('token');
    setToken(null);
  }, []);

  // Load user on initial render or when token changes
  useEffect(() => {
    const loadUser = async () => {
      console.log('Token changed, attempting to load user profile');
      
      if (!token) {
        console.log('No token found, skipping user load');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      
      try {
        console.log('Calling getCurrentUser with token');
        // Use the authAxios instance for internal calls too if appropriate
        // Or ensure authService uses the token internally
        const userData = await authService.getCurrentUser(); 
        console.log('User loaded successfully:', userData ? 'User data present' : 'No user data');
        
        if (userData) {
          setUser(userData);
          setIsAuthenticated(true);
          console.log('Authentication state updated: authenticated=true');
        } else {
          throw new Error('No user data returned');
        }
      } catch (err) {
        console.error('Error in loadUser effect:', err.message);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.log('Authentication error detected, clearing token');
          clearToken();
          setUser(null);
          setIsAuthenticated(false);
          setError('Session expired, please login again');
          toast.error('Session expired, please login again');
        } else {
          console.log('Non-auth error, keeping token');
          setError('Error loading profile');
          toast.error('Could not load your profile. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token, clearToken]);

  // Register user
  const register = async (formData) => {
    setLoading(true);
    try {
      const data = await authService.register(formData);
      storeToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Registration successful');
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (formData) => {
    console.log('Login function called with:', formData.email);
    setLoading(true);
    
    try {
      const data = await authService.login(formData);
      
      if (!data || !data.token) {
        console.error('Login response missing token:', data);
        throw new Error('Invalid login response: Missing token');
      }
      
      console.log('Login successful, storing token and user data');
      storeToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      toast.success('Login successful');
      return true;
    } catch (err) {
      console.error('Login function error:', err);
      const errorMessage = err.response?.data?.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    clearToken();
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  // Clear errors
  const clearErrors = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        clearErrors,
        authAxios // Provide the configured instance
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
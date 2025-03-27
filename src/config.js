// src/config.js
const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/crm',
  API_B2C_URL: 'http://localhost:5000/api',
};

export default config;
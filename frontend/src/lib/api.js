import axios from 'axios';

// The base URL can be defined in a .env file.
// In development, it typically falls back to a local endpoint or default.
// In production, REACT_APP_API_URL should be set to your backend's URL.
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;

// Determine API URL based on environment
const getApiUrl = () => {
  // Check if we're in production (deployed)
  if (window.location.hostname === 'gaminggarage.store' || window.location.hostname === 'www.gaminggarage.store') {
    return 'https://api.gaminggarage.store/api';
  }
  // Check for environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Default to localhost for development
  return 'http://localhost:5000/api';
};

export const API = getApiUrl();
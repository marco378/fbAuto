// src/lib/axios.js
import axios from "axios";

// Ensure the API URL always ends with /api
let API_URL = process.env.NEXT_PUBLIC_API_URL || "https://fbauto-production-4368.up.railway.app/api";

// If the URL doesn't end with /api, add it
if (!API_URL.endsWith('/api')) {
  API_URL = API_URL + '/api';
}

// Debug logging for development
if (typeof window !== 'undefined') {
  console.log('🔗 Frontend API URL:', API_URL);
  console.log('🔗 Original env var:', process.env.NEXT_PUBLIC_API_URL);
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // IMPORTANT: sends cookies to backend
});

export default axiosInstance;

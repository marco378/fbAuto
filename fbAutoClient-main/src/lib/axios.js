// src/lib/axios.js
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://fbauto-production-4368.up.railway.app/api";

// Debug logging for development
if (typeof window !== 'undefined') {
  console.log('🔗 Frontend API URL:', API_URL);
}

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // IMPORTANT: sends cookies to backend
});

export default axiosInstance;

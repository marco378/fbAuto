// src/lib/axios.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "https://fbauto.onrender.com/api",
  withCredentials: true, // IMPORTANT: sends cookies to backend
});

export default axiosInstance;

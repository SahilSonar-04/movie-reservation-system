import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 30000, // 30 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      if (status === 401) {
        // Token expired or invalid
        localStorage.removeItem("token");
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      } else if (status === 429) {
        // Rate limit exceeded
        console.error("Rate limit exceeded. Please try again later.");
      } else if (status >= 500) {
        // Server error
        console.error("Server error. Please try again later.");
      }

      // Return the error message from server
      return Promise.reject(error);
    } else if (error.request) {
      // Request made but no response
      console.error("Network error. Please check your connection.");
      return Promise.reject(new Error("Network error. Please check your connection."));
    } else {
      // Something else happened
      console.error("Request error:", error.message);
      return Promise.reject(error);
    }
  }
);

export default api;
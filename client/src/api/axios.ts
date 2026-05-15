import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "https://hacksprint-1-kodex1-0.onrender.com/api",
  withCredentials: true,
});

export default api;

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_BACKEND_URL,
});

export default api;

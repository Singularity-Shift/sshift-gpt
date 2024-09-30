import axios from 'axios';

const backend = axios.create({
  baseURL: process.env.API_BACKEND_URL,
});

export default backend;

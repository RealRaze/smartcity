import axios from 'axios';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
});

export const locationService = {
  pingLocation: async (userId, lat, lng) => {
    const response = await api.post('/location/ping', {
      user_id: userId,
      lat,
      lng
    });
    return response.data;
  },
  
  getMapData: async (userId) => {
    const response = await api.get(`/map/data?user_id=${userId}`);
    return response.data;
  },
  
  suggestLocation: async (locationData) => {
    const response = await api.post('/locations/suggest', locationData);
    return response.data;
  }
};

export const civicService = {
  reportIncident: async (reportData) => {
    const response = await api.post('/civic/report', reportData);
    return response.data;
  }
};

export const gamificationService = {
  getLeaderboard: async () => {
    const response = await api.get('/gamification/leaderboard');
    return response.data;
  }
};

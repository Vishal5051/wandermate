import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Activities endpoints
export const activitiesAPI = {
  getNearby: (lat, lng, radius, genderFilter) => 
    api.get('/activities/nearby', { params: { lat, lng, radius, gender_filter: genderFilter } }),
  getById: (id) => api.get(`/activities/${id}`),
  create: (data) => api.post('/activities', data),
  rsvp: (id) => api.post(`/activities/${id}/rsvp`),
  cancelRSVP: (id) => api.delete(`/activities/${id}/rsvp`),
  delete: (id) => api.delete(`/activities/${id}`),
};

// Users endpoints
export const usersAPI = {
  getProfile: () => api.get('/users/me'),
  getUserById: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.patch('/users/me', data),
  getMyActivities: () => api.get('/users/me/activities'),
};

// Private pins endpoints
export const pinsAPI = {
  getAll: (lat, lng, radius) => 
    api.get('/pins', { params: { lat, lng, radius } }),
  getById: (id) => api.get(`/pins/${id}`),
  create: (data) => api.post('/pins', data),
  update: (id, data) => api.patch(`/pins/${id}`, data),
  delete: (id) => api.delete(`/pins/${id}`),
};

// Recommendations endpoints
export const recommendationsAPI = {
  getNearby: (lat, lng, radius, category) =>
    api.get('/recommendations/nearby', { params: { lat, lng, radius, category } }),
  getById: (id) => api.get(`/recommendations/${id}`),
};

// Marketplace endpoints
export const marketplaceAPI = {
  getListings: (params) => api.get('/marketplace/listings', { params }),
  getById: (id) => api.get(`/marketplace/listings/${id}`),
  create: (data) => api.post('/marketplace/listings', data),
  update: (id, data) => api.patch(`/marketplace/listings/${id}`, data),
  delete: (id) => api.delete(`/marketplace/listings/${id}`),
  getVendor: (id) => api.get(`/marketplace/vendors/${id}`),
  getMyListings: () => api.get('/marketplace/my-listings'),
};

// Booking endpoints
export const bookingAPI = {
  create: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/my'),
  getVendorBookings: () => api.get('/bookings/vendor'),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  cancel: (id) => api.delete(`/bookings/${id}`),
};

// Travel Packages endpoints
export const packagesAPI = {
  getAll: (params) => api.get('/packages', { params }),
  getById: (id) => api.get(`/packages/${id}`),
  create: (data) => api.post('/packages', data),
  update: (id, data) => api.patch(`/packages/${id}`, data),
  delete: (id) => api.delete(`/packages/${id}`),
  book: (id, data) => api.post(`/packages/${id}/book`, data),
  getMyBookings: () => api.get('/packages/bookings/my'),
  getProviderBookings: () => api.get('/packages/bookings/provider'),
  updateBookingStatus: (id, status) => api.patch(`/packages/bookings/${id}/status`, { status }),
  getProviderProfile: () => api.get('/packages/provider/me'),
  updateProviderProfile: (data) => api.patch('/packages/provider/me', data),
  getProviderPackages: () => api.get('/packages/provider/packages'),
};

export default api;

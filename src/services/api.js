import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Создаем инстанс axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Добавляем таймаут для запросов
  timeout: 5000
});

// Перехватчик для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчик ответов для глобальной обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Обработка ошибок соединения
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.error('API Connection Error:', error.message);
      // Возвращаем "мягкую" ошибку вместо жесткого прерывания
      return Promise.resolve({
        data: { error: true, message: 'Нет соединения с сервером' },
        status: 503
      });
    }
    
    return Promise.reject(error);
  }
);

// Аутентификация
export const authService = {
  register: (userData) => api.post('/users/register', userData)
    .catch(error => {
      if (!error.response) return { data: { success: false, message: 'Сервер недоступен' } };
      return Promise.reject(error);
    }),
  login: (email, password) => api.post('/users/login', { email, password })
    .catch(error => {
      if (!error.response) return { data: { success: false, message: 'Сервер недоступен' } };
      return Promise.reject(error);
    }),
  getMe: () => api.get('/users/me')
    .catch(error => {
      if (!error.response) return { data: { user: null } };
      return Promise.reject(error);
    })
};

// Транспортные средства
export const vehicleService = {
  getVehicles: () => api.get('/vehicles')
    .catch(error => {
      if (!error.response) return { data: [] };
      return Promise.reject(error);
    }),
  getVehicle: (id) => api.get(`/vehicles/${id}`),
  createVehicle: (vehicleData) => api.post('/vehicles', vehicleData),
  updateVehicle: (id, vehicleData) => api.put(`/vehicles/${id}`, vehicleData),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}`)
};

// Смены
export const shiftService = {
  getShifts: (params) => api.get('/shifts', { params })
    .catch(error => {
      if (!error.response) return { data: [] };
      return Promise.reject(error);
    }),
  getShift: (id) => api.get(`/shifts/${id}`),
  createShift: (shiftData) => api.post('/shifts', shiftData),
  updateShift: (id, shiftData) => api.put(`/shifts/${id}`, shiftData),
  deleteShift: (id) => api.delete(`/shifts/${id}`)
};

// Топливо
export const fuelService = {
  getTransactions: (params) => api.get('/fuel', { params })
    .catch(error => {
      if (!error.response) return { data: [] };
      return Promise.reject(error);
    }),
  getTransaction: (id) => api.get(`/fuel/${id}`),
  createTransaction: (transactionData) => api.post('/fuel', transactionData),
  updateTransaction: (id, transactionData) => api.put(`/fuel/${id}`, transactionData),
  deleteTransaction: (id) => api.delete(`/fuel/${id}`)
};

export default api; 
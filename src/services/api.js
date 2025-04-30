import axios from 'axios';

const API_URL = 'http://89.169.170.164:5000/api';

// Создаем инстанс axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Увеличиваем таймаут для запросов
  timeout: 10000
});

// Перехватчик для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding token to request:', token.substring(0, 15) + '...');
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
    
    // Лог ошибок аутентификации
    if (error.response && error.response.status === 401) {
      console.error('Authentication Error:', error.response.data);
      // Можно добавить автоматический выход при ошибках авторизации
      // localStorage.removeItem('token');
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
  login: (username, password) => {
    console.log('Login attempt:', { username, passwordProvided: !!password });
    return api.post('/users/login', { username, password })
      .then(response => {
        if (response.data && response.data.token) {
          console.log('Login successful, token received');
        }
        return response;
      })
      .catch(error => {
        console.log('Login error:', error.response?.data);
        if (!error.response) return { data: { success: false, message: 'Сервер недоступен' } };
        return Promise.reject(error);
      });
  },
  getMe: () => api.get('/users/me')
    .then(response => {
      console.log('GetMe successful:', response.data.success);
      return response;
    })
    .catch(error => {
      console.error('GetMe error:', error.response?.data);
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
    .then(response => {
      console.log('🔍 API: Fuel transactions API response type:', typeof response.data);
      console.log('🔍 API: Fuel transactions structure:', Object.keys(response.data));
      console.log('🔍 API: Is data an array?', Array.isArray(response.data));
      
      let count = 0;
      let data = [];
      
      // Обработка различных форматов ответа
      if (Array.isArray(response.data)) {
        // Если сервер вернул массив
        data = response.data;
        count = data.length;
      } else if (response.data && response.data.data) {
        // Если сервер вернул объект с полем data
        data = response.data.data;
        count = response.data.count || data.length;
      } else if (response.data) {
        // Если сервер вернул другой формат
        data = response.data;
        count = 0;
      }
      
      console.log('Fuel transactions received:', count);
      
      // Возвращаем данные в ожидаемом клиентом формате
      return {
        data: data,
        count: count
      };
    })
    .catch(error => {
      console.error('🔥 API ERROR: Fuel transactions error:', error);
      console.error('🔥 API ERROR Details:', error.response?.data || error.message);
      
      // Пробуем альтернативный URL в случае ошибки
      if (error.response && error.response.status === 400) {
        console.log('🔍 API: Trying alternative URL /api/fuel/debug');
        return api.get('/fuel/debug').then(response => {
          console.log('🔍 API: Alternative request successful');
          return {
            data: Array.isArray(response.data) ? response.data : 
                 (response.data && response.data.data ? response.data.data : []),
            count: response.data.count || 0
          };
        }).catch(altError => {
          console.error('🔥 API ERROR: Alternative request failed:', altError);
          return { data: [] };
        });
      }
      
      // Возвращаем пустой массив в случае ошибки
      if (!error.response) return { data: [] };
      return Promise.reject(error);
    }),
  getTransaction: (id) => api.get(`/fuel/${id}`),
  createTransaction: (transactionData) => api.post('/fuel', transactionData),
  updateTransaction: (id, transactionData) => api.put(`/fuel/${id}`, transactionData),
  deleteTransaction: (id) => api.delete(`/fuel/${id}`)
};

export default api; 
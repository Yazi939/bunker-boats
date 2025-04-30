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
        // Если сервер вернул другой формат, преобразуем в массив
        if (typeof response.data === 'object' && !Array.isArray(response.data)) {
          // Если это объект, но не массив, проверим наличие success и других полей API
          if ('success' in response.data && 'data' in response.data) {
            data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
            count = response.data.count || data.length;
          } else {
            // Это может быть объект с транзакциями в виде свойств
            data = Object.values(response.data);
            count = data.length;
          }
        } else {
          data = response.data;
          count = 0;
        }
      }
      
      console.log('Fuel transactions received:', count);
      
      // Проверяем, что data действительно массив
      if (!Array.isArray(data)) {
        console.warn('🔶 API: Data is not an array after processing, converting...');
        data = data ? [data] : [];
      }
      
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
          let data = [];
          
          if (Array.isArray(response.data)) {
            data = response.data;
          } else if (response.data && response.data.data) {
            data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
          } else if (response.data) {
            // Если это объект, но не массив
            if (typeof response.data === 'object' && !Array.isArray(response.data)) {
              data = Object.values(response.data);
            } else {
              data = response.data ? [response.data] : [];
            }
          }
          
          // Проверяем, что data действительно массив
          if (!Array.isArray(data)) {
            console.warn('🔶 API: Debug data is not an array after processing, converting...');
            data = data ? [data] : [];
          }
          
          console.log('🔍 API: Debug endpoint processed data type:', typeof data);
          console.log('🔍 API: Debug endpoint is array?', Array.isArray(data));
          
          return {
            data: data,
            count: data.length
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
  createTransaction: (transactionData) => {
    console.log('🔧 API: Creating transaction with data:', JSON.stringify(transactionData, null, 2));
    
    // Клонируем данные для обработки
    const processedData = { ...transactionData };
    
    // Убедимся, что все необходимые поля присутствуют
    if (processedData.totalCost === undefined && processedData.volume !== undefined && processedData.price !== undefined) {
      processedData.totalCost = Number(processedData.volume) * Number(processedData.price);
      console.log('🔧 API: Calculated totalCost:', processedData.totalCost);
    }
    
    // ВАЖНО: Убедимся, что amount всегда присутствует и равен volume
    if (processedData.volume !== undefined && (processedData.amount === undefined || processedData.amount === null)) {
      processedData.amount = processedData.volume;
      console.log('🔧 API: Setting amount = volume:', processedData.amount);
    }
    
    // Убедимся, что timestamp в правильном формате
    if (processedData.timestamp && typeof processedData.timestamp === 'object') {
      processedData.timestamp = processedData.timestamp.getTime();
      console.log('🔧 API: Converted timestamp to number:', processedData.timestamp);
    }
    
    // Преобразуем undefined в null для JSON
    Object.keys(processedData).forEach(key => {
      if (processedData[key] === undefined) {
        processedData[key] = null;
      }
    });
    
    // ВАЖНО: Проверяем наличие критических полей для сервера
    if (processedData.amount === null || processedData.amount === undefined) {
      console.log('🔧 API: Critical field amount is missing, setting to 0');
      processedData.amount = 0;
    }
    
    // Заменяем значение userRole, так как сервер не ожидает это поле
    if (processedData.userRole) {
      delete processedData.userRole;
    }
    
    console.log('🔧 API: Processed data for POST request:', JSON.stringify(processedData, null, 2));
    
    // Для надежности сразу используем прямой метод создания
    return api.post('/fuel/direct', processedData)
      .then(response => {
        console.log('🔧 API: Transaction created successfully via direct API:', response.data);
        return response;
      })
      .catch(directError => {
        console.error('🔥 API ERROR: Direct create failed:', directError);
        
        // Попробуем стандартный метод как запасной вариант
        return api.post('/fuel', processedData)
          .then(response => {
            console.log('🔧 API: Transaction created successfully via standard API:', response.data);
            return response;
          })
          .catch(error => {
            console.error('🔥 API ERROR: Standard create failed:', error);
            console.error('🔥 API ERROR details:', error.response?.data);
            
            // Пробуем альтернативный URL в случае ошибки
            if (error.response && error.response.status === 400) {
              console.log('🔍 API: Trying debug endpoint');
              // Используем альтернативный URL /fuel/debug
              return api.post('/fuel/debug', processedData)
                .then(response => {
                  console.log('🔍 API: Debug endpoint request successful');
                  return response;
                })
                .catch(altError => {
                  console.error('🔥 API ERROR: Debug endpoint failed:', altError);
                  
                  // Последняя попытка - создать самую минимальную транзакцию
                  console.log('🔥 API: Last resort - creating minimal transaction');
                  const minimalData = {
                    type: 'purchase',
                    volume: processedData.volume || 0,
                    amount: processedData.volume || 0,  // Явно задаем amount
                    price: processedData.price || 0,
                    totalCost: processedData.totalCost || 0,
                    fuelType: processedData.fuelType || 'diesel',
                    date: new Date().toISOString(),
                    timestamp: Date.now()
                  };
                  
                  return api.post('/fuel/direct', minimalData)
                    .then(response => {
                      console.log('🔥 API: Minimal transaction created successfully');
                      return response;
                    })
                    .catch(finalError => {
                      console.error('🔥 API: All attempts failed:', finalError);
                      return Promise.reject(finalError);
                    });
                });
            }
            
            return Promise.reject(error);
          });
      });
  },
  updateTransaction: (id, transactionData) => api.put(`/fuel/${id}`, transactionData),
  deleteTransaction: (id) => api.delete(`/fuel/${id}`)
};

export default api; 
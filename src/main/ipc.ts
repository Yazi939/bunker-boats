import { ipcMain } from 'electron';
import { vehicleOperations, transactionOperations } from '../database/db';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

const storePath = path.join(app.getPath('userData'), 'store.json');

// Загрузка данных из файла
const loadStoreData = () => {
    try {
        if (fs.existsSync(storePath)) {
            const data = fs.readFileSync(storePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading store data:', error);
    }
    return {};
};

// Сохранение данных в файл
const saveStoreData = (data: any) => {
    try {
        fs.writeFileSync(storePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving store data:', error);
    }
};

// Обработчики для транспортных средств
ipcMain.handle('vehicles:getAll', async () => {
  try {
    return vehicleOperations.getAllVehicles();
  } catch (error) {
    console.error('Error in vehicles:getAll:', error);
    throw error;
  }
});

ipcMain.handle('vehicles:add', async (_, vehicle) => {
  try {
    return vehicleOperations.addVehicle(vehicle);
  } catch (error) {
    console.error('Error in vehicles:add:', error);
    throw error;
  }
});

ipcMain.handle('vehicles:update', async (_, vehicle) => {
  try {
    return vehicleOperations.updateVehicle(vehicle);
  } catch (error) {
    console.error('Error in vehicles:update:', error);
    throw error;
  }
});

ipcMain.handle('vehicles:delete', async (_, id) => {
  try {
    return vehicleOperations.deleteVehicle(id);
  } catch (error) {
    console.error('Error in vehicles:delete:', error);
    throw error;
  }
});

// Обработчики для транзакций
ipcMain.handle('transactions:getAll', async () => {
  try {
    return transactionOperations.getAllTransactions();
  } catch (error) {
    console.error('Error in transactions:getAll:', error);
    throw error;
  }
});

ipcMain.handle('transactions:add', async (_, transaction) => {
  try {
    return transactionOperations.addTransaction(transaction);
  } catch (error) {
    console.error('Error in transactions:add:', error);
    throw error;
  }
});

ipcMain.handle('transactions:getByDateRange', async (_, startDate, endDate) => {
  try {
    return transactionOperations.getTransactionsByDateRange(startDate, endDate);
  } catch (error) {
    console.error('Error in transactions:getByDateRange:', error);
    throw error;
  }
});

ipcMain.handle('transactions:getByFuelType', async (_, fuelType) => {
  try {
    return transactionOperations.getTransactionsByFuelType(fuelType);
  } catch (error) {
    console.error('Error in transactions:getByFuelType:', error);
    throw error;
  }
});

// Обработчики IPC
export const setupIpcHandlers = () => {
    // Локальное хранилище
    ipcMain.handle('load-store-data', () => loadStoreData());
    ipcMain.handle('save-store-data', (_, data) => saveStoreData(data));

    // Синхронизация с сервером
    ipcMain.handle('sync-data', async (_, { dataType, data }) => {
        try {
            const response = await fetch(`http://localhost:3000/api/sync/${dataType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ data })
            });
            return await response.json();
        } catch (error) {
            console.error('Sync error:', error);
            throw error;
        }
    });

    ipcMain.handle('get-synced-data', async (_, dataType) => {
        try {
            const response = await fetch(`http://localhost:3000/api/sync/${dataType}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Get synced data error:', error);
            throw error;
        }
    });
}; 
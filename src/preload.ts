import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
interface VehicleAPI {
  getAll: () => Promise<any[]>;
  add: (vehicle: any) => Promise<void>;
  update: (vehicle: any) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

interface TransactionAPI {
  getAll: () => Promise<any[]>;
  add: (transaction: any) => Promise<void>;
  getByDateRange: (startDate: number, endDate: number) => Promise<any[]>;
  getByFuelType: (fuelType: string) => Promise<any[]>;
}

interface SettingsAPI {
  get: () => Promise<any>;
  update: (settings: any) => Promise<void>;
}

interface FuelAPI {
  calculate: (data: { distance: number; consumption: number }) => Promise<any>;
}

// Create the API object
const api = {
  vehicles: {
    getAll: () => ipcRenderer.invoke('vehicles:getAll'),
    add: (vehicle: any) => ipcRenderer.invoke('vehicles:add', vehicle),
    update: (vehicle: any) => ipcRenderer.invoke('vehicles:update', vehicle),
    delete: (id: string) => ipcRenderer.invoke('vehicles:delete', id)
  },
  transactions: {
    getAll: () => ipcRenderer.invoke('transactions:getAll'),
    add: (transaction: any) => ipcRenderer.invoke('transactions:add', transaction),
    getByDateRange: (startDate: number, endDate: number) => 
      ipcRenderer.invoke('transactions:getByDateRange', startDate, endDate),
    getByFuelType: (fuelType: string) => 
      ipcRenderer.invoke('transactions:getByFuelType', fuelType)
  },
  settings: {
    get: () => ipcRenderer.invoke('get-settings'),
    update: (settings: any) => ipcRenderer.invoke('update-settings', settings)
  },
  fuel: {
    calculate: (data: { distance: number; consumption: number }) => 
      ipcRenderer.invoke('calculate-fuel', data)
  }
};

// Expose the API to the renderer process
try {
  contextBridge.exposeInMainWorld('electronAPI', api);
  console.log('Electron API exposed successfully');
} catch (error) {
  console.error('Failed to expose Electron API:', error);
} 
export interface ElectronAPI {
  transactions: {
    getAll: () => Promise<FuelTransaction[]>;
    add: (transaction: FuelTransaction) => Promise<FuelTransaction[]>;
    update: (transactions: FuelTransaction[]) => Promise<FuelTransaction[]>;
    delete: (id: string) => Promise<FuelTransaction[]>;
  };
  vehicles: {
    getAll: () => Promise<any[]>;
    add: (vehicle: any) => Promise<any[]>;
    update: (vehicle: any) => Promise<any[]>;
    delete: (id: string) => Promise<any[]>;
  };
  getTransactions?: () => Promise<FuelTransaction[]>;
  addTransaction?: (transaction: FuelTransaction) => Promise<FuelTransaction[]>;
  updateTransaction?: (transaction: FuelTransaction) => Promise<FuelTransaction[]>;
  deleteTransaction?: (id: string) => Promise<FuelTransaction[]>;
  getVehicles?: () => Promise<any[]>;
  addVehicle?: (vehicle: any) => Promise<any[]>;
  updateVehicle?: (vehicle: any) => Promise<any[]>;
  deleteVehicle?: (id: string) => Promise<any[]>;
  calculateFuel: (data: any) => Promise<any>;
  getAppVersion: () => string;
  isElectron: boolean;
  appReady: () => boolean;
  checkForUpdates?: () => void;
  installUpdate?: () => void;
  onUpdateStatus?: (callback: (status: string, info: any) => void) => void;
  onUpdateProgress?: (callback: (progress: any) => void) => void;
  login?: (credentials: any) => Promise<any>;
  logout?: () => Promise<void>;
  getCurrentUser?: () => Promise<any>;
  getData?: (key: string) => Promise<any>;
  setData?: (key: string, value: any) => Promise<void>;
  getSyncData?: (dataType: string) => Promise<any>;
  setSyncData?: (dataType: string, data: any) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export interface FuelTransaction {
  id?: number;
  key: string;
  type: 'purchase' | 'sale' | 'drain' | 'base_to_bunker' | 'bunker_to_base' | 'expense' | 'salary' | 'repair';
  volume: number;
  price: number;
  totalCost: number;
  date: string;
  timestamp: number;
  fuelType: string;
  supplier?: string;
  customer?: string;
  vessel?: string;
  source?: string;
  destination?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'deferred';
  userId?: string;
  userRole?: string;
  notes?: string;
  frozen?: boolean;
  frozenDate?: number;
  edited?: boolean;
  editTimestamp?: number;
} 
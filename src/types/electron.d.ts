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
  calculateFuel: (data: any) => Promise<any>;
  getAppVersion: () => string;
  isElectron: boolean;
  appReady: () => boolean;
  checkForUpdates?: () => void;
  installUpdate?: () => void;
  onUpdateStatus?: (callback: (status: string, info: any) => void) => void;
  onUpdateProgress?: (callback: (progress: any) => void) => void;
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
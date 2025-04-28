export interface FuelTransaction {
  key: string;
  type: 'purchase' | 'sale' | 'base_to_bunker' | 'bunker_to_base';
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
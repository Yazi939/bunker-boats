export const initialVehicles = [
  {
    key: '1',
    id: 'ТС-001',
    type: 'Катер',
    model: 'Yamaha AR240',
    fuelType: 'АИ-95',
    consumption: 45.2,
    lastRefuel: '2024-04-08'
  },
  {
    key: '2',
    id: 'ТС-002',
    type: 'Яхта',
    model: 'Azimut 54',
    fuelType: 'Дизель',
    consumption: 120.5,
    lastRefuel: '2024-04-07'
  },
  {
    key: '3',
    id: 'ТС-003',
    type: 'Баржа',
    model: 'River Master 85',
    fuelType: 'Дизель',
    consumption: 210.8,
    lastRefuel: '2024-04-08'
  }
];

export const initialTransactions = [
  {
    key: '1',
    type: 'purchase',
    volume: 1000,
    price: 50,
    totalCost: 50000,
    date: '2024-04-08',
    timestamp: 1712534400000,
    fuelType: 'diesel',
    supplier: 'ООО Топливо',
    paymentMethod: 'transfer'
  },
  {
    key: '2',
    type: 'sale',
    volume: 500,
    price: 60,
    totalCost: 30000,
    date: '2024-04-08',
    timestamp: 1712534400000,
    fuelType: 'diesel',
    customer: 'ИП Иванов',
    vessel: 'ТС-002',
    paymentMethod: 'cash'
  }
]; 
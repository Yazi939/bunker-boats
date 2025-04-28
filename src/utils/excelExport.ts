import * as XLSX from 'xlsx';

// Типы топлива
const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизельное топливо' },
  { value: 'gasoline_95', label: 'Бензин АИ-95' }
];

// Интерфейс для транзакций
interface FuelTransaction {
  key: string;
  type: 'purchase' | 'sale' | 'drain' | 'base_to_bunker' | 'bunker_to_base';
  volume: number;
  price: number;
  totalCost: number;
  date: string;
  timestamp: number;
  fuelType: string;
  supplier?: string;
  customer?: string;
  vessel?: string;
  frozen?: boolean;
  frozenDate?: number;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'deferred';
  userId?: string;
  userRole?: string;
  notes?: string;
  edited?: boolean;
  editTimestamp?: number;
}

// Интерфейс для данных по типам топлива
interface FuelTypeData {
  fuelType: string;
  fuelName: string;
  purchased: number;
  sold: number;
  drained: number;
  balance: number;
  purchaseCost: number;
  saleIncome: number;
  profit: number;
}

// Результат экспорта
interface ExportResult {
  success: boolean;
  fileName?: string;
  error?: string;
}

/**
 * Экспортирует данные учета топлива в Excel файл с рабочими формулами
 */
export const exportFuelDataToExcel = (
  transactions: FuelTransaction[],
  fuelTypeData: FuelTypeData[],
  totalPurchased: number,
  totalSold: number,
  totalDrained: number,
  totalPurchaseCost: number,
  totalSaleIncome: number,
  averagePurchasePrice: number,
  averageSalePrice: number,
  coefficient: number,
  profitMargin: number
): ExportResult => {
  try {
    // Создаем рабочую книгу Excel
    const workbook = XLSX.utils.book_new();
    
    // Преобразуем данные транзакций для первого листа
    const transactionData = transactions.map((item, index) => {
      let typeLabel;
      switch(item.type) {
        case 'purchase': typeLabel = 'Покупка'; break;
        case 'sale': typeLabel = 'Продажа'; break;
        case 'base_to_bunker': typeLabel = 'Перевод из базы в бункер'; break;
        case 'bunker_to_base': typeLabel = 'Перевод из бункера в базу'; break;
        default: typeLabel = item.type;
      }
      
      let paymentMethodLabel = '-';
      if (item.paymentMethod) {
        switch(item.paymentMethod) {
          case 'cash': paymentMethodLabel = 'Наличные'; break;
          case 'card': paymentMethodLabel = 'Терминал'; break;
          case 'transfer': paymentMethodLabel = 'Перевод'; break;
          case 'deferred': paymentMethodLabel = 'Отложенный платеж'; break;
        }
      }
      
      return {
        '№': index + 1,
        'Тип операции': typeLabel,
        'Тип топлива': FUEL_TYPES.find(t => t.value === item.fuelType)?.label || item.fuelType,
        'Объем (л)': item.volume,
        'Цена (₽/л)': item.type === 'drain' ? '-' : item.price,
        'Стоимость (₽)': item.type === 'drain' ? '-' : item.totalCost,
        'Дата': item.date,
        'Судно': item.vessel || '-',
        'Способ оплаты': item.type === 'sale' ? paymentMethodLabel : '-',
        'Поставщик/Клиент': item.type === 'purchase' ? item.supplier : item.customer,
        'Статус': item.frozen ? 'Заморожено' : 'Активно',
        'Примечания': item.notes || ''
      };
    });
    
    // Создаем первый лист с транзакциями
    const transactionsSheet = XLSX.utils.json_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Транзакции');
    
    // Преобразуем данные типов топлива для второго листа
    const fuelTypeSummary = fuelTypeData.map(type => ({
      'Тип топлива': type.fuelName,
      'Закуплено (л)': type.purchased,
      'Продано (л)': type.sold,
      'Слито (л)': type.drained,
      'Остаток (л)': type.balance,
      'Затраты на покупку (₽)': type.purchaseCost,
      'Доход от продажи (₽)': type.saleIncome,
      'Прибыль (₽)': type.profit
    }));
    
    // Создаем второй лист с данными по типам топлива
    const fuelTypeSheet = XLSX.utils.json_to_sheet(fuelTypeSummary);
    XLSX.utils.book_append_sheet(workbook, fuelTypeSheet, 'Топливо по типам');
    
    // Создаем третий лист с итоговой статистикой
    const summaryData = [
      { 'Показатель': 'Закуплено топлива (л)', 'Значение': totalPurchased },
      { 'Показатель': 'Продано топлива (л)', 'Значение': totalSold },
      { 'Показатель': 'Остаток топлива (л)', 'Значение': totalPurchased - totalSold },
      { 'Показатель': 'Затраты на закупку (₽)', 'Значение': totalPurchaseCost },
      { 'Показатель': 'Доход от продажи (₽)', 'Значение': totalSaleIncome },
      { 'Показатель': 'Прибыль (₽)', 'Значение': totalSaleIncome - totalPurchaseCost },
      { 'Показатель': 'Средняя цена закупки (₽/л)', 'Значение': averagePurchasePrice },
      { 'Показатель': 'Средняя цена продажи (₽/л)', 'Значение': averageSalePrice },
      { 'Показатель': 'Коэффициент', 'Значение': coefficient },
      { 'Показатель': 'Маржа (%)', 'Значение': profitMargin }
    ];
    
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Итоги');
    
    // Создаем файл Excel
    const fileName = `fuel_report_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    return {
      success: true,
      fileName
    };
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}; 
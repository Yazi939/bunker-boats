import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

// Типы финансовых операций
export enum TransactionType {
  EXPENSE = 'expense',
  INCOME = 'income'
}

// Категории расходов
export const EXPENSE_CATEGORIES = [
  { value: 'fuel', label: 'Топливо' },
  { value: 'maintenance', label: 'Обслуживание' },
  { value: 'salary', label: 'Зарплаты' },
  { value: 'taxes', label: 'Налоги' },
  { value: 'rent', label: 'Аренда' },
  { value: 'utilities', label: 'Коммунальные услуги' },
  { value: 'equipment', label: 'Оборудование' },
  { value: 'marketing', label: 'Маркетинг' },
  { value: 'other', label: 'Прочее' }
];

// Категории доходов
export const INCOME_CATEGORIES = [
  { value: 'sales', label: 'Продажи' },
  { value: 'services', label: 'Услуги' },
  { value: 'investments', label: 'Инвестиции' },
  { value: 'refunds', label: 'Возвраты' },
  { value: 'other', label: 'Прочее' }
];

// Интерфейс для финансовой операции
export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  timestamp: number;
  category: string;
  description: string;
  paymentMethod?: string;
  recipientOrPayer?: string;
  documentRef?: string;
  tags?: string[];
}

// Интерфейс для статистики по категориям
export interface CategoryStats {
  category: string;
  totalAmount: number;
  percentage: number;
  color: string;
}

// Функция для группировки транзакций по дате
export const groupTransactionsByDate = (transactions: FinancialTransaction[]) => {
  const grouped = new Map<string, FinancialTransaction[]>();
  
  transactions.forEach(transaction => {
    const dateKey = dayjs(transaction.timestamp).format('YYYY-MM-DD');
    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, []);
    }
    grouped.get(dateKey)?.push(transaction);
  });
  
  return grouped;
};

// Функция для группировки транзакций по категориям
export const groupTransactionsByCategory = (transactions: FinancialTransaction[]) => {
  const grouped = new Map<string, FinancialTransaction[]>();
  
  transactions.forEach(transaction => {
    if (!grouped.has(transaction.category)) {
      grouped.set(transaction.category, []);
    }
    grouped.get(transaction.category)?.push(transaction);
  });
  
  return grouped;
};

// Функция для группировки транзакций по месяцам
export const groupTransactionsByMonth = (transactions: FinancialTransaction[]) => {
  const grouped = new Map<string, FinancialTransaction[]>();
  
  transactions.forEach(transaction => {
    const monthKey = dayjs(transaction.timestamp).format('YYYY-MM');
    if (!grouped.has(monthKey)) {
      grouped.set(monthKey, []);
    }
    grouped.get(monthKey)?.push(transaction);
  });
  
  return grouped;
};

// Функция для получения статистики расходов по категориям
export const getExpenseStatsByCategory = (transactions: FinancialTransaction[]): CategoryStats[] => {
  const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  const groupedByCategory = groupTransactionsByCategory(expenses);
  const colors = ['#f5222d', '#fa541c', '#fa8c16', '#faad14', '#fadb14', '#a0d911', '#52c41a', '#13c2c2', '#1890ff', '#722ed1'];
  
  const stats: CategoryStats[] = [];
  let colorIndex = 0;
  
  groupedByCategory.forEach((categoryTransactions, category) => {
    const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const percentage = totalExpenses > 0 ? (categoryTotal / totalExpenses) * 100 : 0;
    
    stats.push({
      category,
      totalAmount: categoryTotal,
      percentage,
      color: colors[colorIndex % colors.length]
    });
    
    colorIndex++;
  });
  
  return stats.sort((a, b) => b.totalAmount - a.totalAmount);
};

// Функция для получения статистики доходов по категориям
export const getIncomeStatsByCategory = (transactions: FinancialTransaction[]): CategoryStats[] => {
  const incomes = transactions.filter(t => t.type === TransactionType.INCOME);
  const totalIncomes = incomes.reduce((sum, t) => sum + t.amount, 0);
  
  const groupedByCategory = groupTransactionsByCategory(incomes);
  const colors = ['#52c41a', '#a0d911', '#13c2c2', '#1890ff', '#722ed1', '#eb2f96', '#f5222d', '#fa541c', '#fa8c16', '#faad14'];
  
  const stats: CategoryStats[] = [];
  let colorIndex = 0;
  
  groupedByCategory.forEach((categoryTransactions, category) => {
    const categoryTotal = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
    const percentage = totalIncomes > 0 ? (categoryTotal / totalIncomes) * 100 : 0;
    
    stats.push({
      category,
      totalAmount: categoryTotal,
      percentage,
      color: colors[colorIndex % colors.length]
    });
    
    colorIndex++;
  });
  
  return stats.sort((a, b) => b.totalAmount - a.totalAmount);
};

// Функция для получения категории по ее значению
export const getCategoryLabel = (categoryValue: string): string => {
  const allCategories = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];
  const category = allCategories.find(c => c.value === categoryValue);
  return category ? category.label : categoryValue;
};

// Экспорт в Excel
export const exportTransactionsToExcel = (transactions: FinancialTransaction[]): void => {
  try {
    // Создаем рабочую книгу Excel
    const workbook = XLSX.utils.book_new();
    
    // Преобразуем данные транзакций
    const transactionData = transactions.map((item, index) => ({
      '№': index + 1,
      'Тип': item.type === TransactionType.EXPENSE ? 'Расход' : 'Доход',
      'Дата': item.date,
      'Сумма (₽)': item.amount,
      'Категория': getCategoryLabel(item.category),
      'Описание': item.description,
      'Метод оплаты': item.paymentMethod || '',
      'Получатель/Плательщик': item.recipientOrPayer || '',
      'Ссылка на документ': item.documentRef || '',
      'Теги': item.tags ? item.tags.join(', ') : ''
    }));
    
    // Создаем лист с транзакциями
    const transactionsSheet = XLSX.utils.json_to_sheet(transactionData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Транзакции');
    
    // Данные для сводного листа
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const incomes = transactions.filter(t => t.type === TransactionType.INCOME);
    
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncomes = incomes.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncomes - totalExpenses;
    
    const summaryData = [
      ['Финансовый отчет', '', ''],
      ['Дата формирования:', new Date().toLocaleString(), ''],
      ['', '', ''],
      ['Сводная информация', '', ''],
      ['Показатель', 'Значение (₽)', ''],
      ['Общие расходы', totalExpenses, ''],
      ['Общие доходы', totalIncomes, ''],
      ['Баланс', balance, ''],
      ['', '', ''],
      ['Расходы по категориям', '', '']
    ];
    
    // Добавляем данные по категориям расходов
    const expenseStats = getExpenseStatsByCategory(transactions);
    expenseStats.forEach(stat => {
      summaryData.push([
        getCategoryLabel(stat.category), 
        stat.totalAmount, 
        `${stat.percentage.toFixed(2)}%`
      ]);
    });
    
    summaryData.push(['', '', '']);
    summaryData.push(['Доходы по категориям', '', '']);
    
    // Добавляем данные по категориям доходов
    const incomeStats = getIncomeStatsByCategory(transactions);
    incomeStats.forEach(stat => {
      summaryData.push([
        getCategoryLabel(stat.category), 
        stat.totalAmount, 
        `${stat.percentage.toFixed(2)}%`
      ]);
    });
    
    // Создаем лист сводной информации
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Сводная информация');
    
    // Устанавливаем ширину столбцов
    const setCellWidths = (sheet: XLSX.WorkSheet) => {
      const columnWidths = [
        { wch: 25 },  // A
        { wch: 15 },  // B
        { wch: 15 },  // C
      ];
      sheet['!cols'] = columnWidths;
    };
    
    setCellWidths(transactionsSheet);
    setCellWidths(summarySheet);
    
    // Сохраняем файл
    XLSX.writeFile(workbook, 'financial_report.xlsx');
  } catch (error) {
    console.error('Ошибка при экспорте в Excel:', error);
  }
}; 
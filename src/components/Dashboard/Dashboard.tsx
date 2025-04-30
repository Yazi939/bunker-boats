// @ts-nocheck

import React, { useState, useEffect } from 'react';
import type { RadioChangeEvent } from 'antd/es/radio';
import type { ColumnsType } from 'antd/es/table';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  DatePicker,
  Radio,
  Space,
  Divider,
  Select,
  Alert,
  Button,
  Tag,
  Form,
  Input,
  Modal,
  message,
  Layout,
  InputNumber,
  Popconfirm
} from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined, FileExcelOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { getCurrentUser, checkPermission } from '../../utils/users';
import styles from './Dashboard.module.css';
import { calculateFuelBalances, calculateFuelStats } from '../../utils/fuelBalanceUtils';

const { Option } = Select;

// Добавляем объявление для window.api
declare global {
  interface Window {
    electronAPI?: any;
    api?: any;
  }
}

// Примеры тестовых транзакций
const mockTransactions: FuelTransaction[] = [
  {
    key: '1',
    type: 'purchase',
    volume: 1000,
    price: 50,
    totalCost: 50000,
    date: '2023-01-15',
    timestamp: 1673740800000,
    fuelType: 'diesel',
    supplier: 'ООО Нефтетрейд'
  },
  {
    key: '2',
    type: 'sale',
    volume: 500,
    price: 65,
    totalCost: 32500,
    date: '2023-01-20',
    timestamp: 1674172800000,
    fuelType: 'diesel',
    customer: 'ИП Иванов'
  }
];

// Типы топлива
const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизельное топливо' },
  { value: 'gasoline_95', label: 'Бензин АИ-95' }
];

// Данные для графика расхода топлива
const fuelData = [
  { name: 'Пн', расход: 340 },
  { name: 'Вт', расход: 420 },
  { name: 'Ср', расход: 380 },
  { name: 'Чт', расход: 450 },
  { name: 'Пт', расход: 520 },
  { name: 'Сб', расход: 300 },
  { name: 'Вс', расход: 280 },
];

// Данные для круговой диаграммы
const vehicleTypeData = [
  { name: 'Катера', value: 40 },
  { name: 'Яхты', value: 35 },
  { name: 'Баржи', value: 25 },
];

// Цвета для круговой диаграммы
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Данные для таблицы
interface VehicleData {
  key: string;
  id: string;
  type: string;
  model: string;
  fuelType: string;
  consumption: number;
  lastRefuel: string;
}

// Интерфейс для транзакций топлива
interface FuelTransaction {
  key: string;
  id?: string | number;
  type: 'purchase' | 'sale' | 'base_to_bunker' | 'bunker_to_base' | 'expense' | 'salary' | 'repair';
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
  amount?: number;
}

// Интерфейс для данных по типам топлива
interface FuelTypeData {
  fuelType: string;
  fuelName: string;
  purchased: number;
  sold: number;
  baseBalance: number;  // Остаток на базе
  bunkerBalance: number; // Остаток на бункеровщике
  purchaseCost: number;
  saleIncome: number;
  profit: number;
}

// Интерфейс для данных по периодам (месяцам/дням)
interface PeriodData {
  name: string;
  purchased: number;
  sold: number;
  profit: number;
  timestamp: number;
}

const vehiclesData: VehicleData[] = [
    {
      key: '1',
    id: 'ТС-001',
    type: 'Катер',
    model: 'Yamaha AR240',
    fuelType: 'АИ-95',
    consumption: 45.2,
    lastRefuel: '2024-04-08',
    },
    {
      key: '2',
    id: 'ТС-002',
    type: 'Яхта',
    model: 'Azimut 54',
    fuelType: 'Дизель',
    consumption: 120.5,
    lastRefuel: '2024-04-07',
  },
  {
    key: '3',
    id: 'ТС-003',
    type: 'Баржа',
    model: 'River Master 85',
    fuelType: 'Дизель',
    consumption: 210.8,
    lastRefuel: '2024-04-08',
  },
];

const columns: ColumnsType<VehicleData> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: 'Тип ТС',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: 'Модель',
    dataIndex: 'model',
    key: 'model',
  },
  {
    title: 'Тип топлива',
    dataIndex: 'fuelType',
    key: 'fuelType',
  },
  {
    title: 'Расход л/100км',
    dataIndex: 'consumption',
    key: 'consumption',
  },
  {
    title: 'Последняя заправка',
    dataIndex: 'lastRefuel',
    key: 'lastRefuel',
  },
];

// Функция группировки данных по месяцам
const groupByMonth = (transactions: FuelTransaction[]): PeriodData[] => {
  const monthMap = new Map<string, PeriodData>();
  
  transactions.forEach(t => {
    const date = new Date(t.timestamp);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthKey = `${year}-${month+1}`;
    const monthName = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        name: monthName,
        purchased: 0,
        sold: 0,
        profit: 0,
        timestamp: new Date(year, month, 1).getTime()
      });
    }
    
    const data = monthMap.get(monthKey)!;
    
    if (t.type === 'purchase') {
      data.purchased += t.volume;
      data.profit -= t.totalCost;
    } else {
      data.sold += t.volume;
      data.profit += t.totalCost;
    }
  });
  
  // Сортировка по времени
  return Array.from(monthMap.values())
    .sort((a, b) => a.timestamp - b.timestamp);
};

// Расчет процентного изменения между двумя значениями
const calculateChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / Math.abs(previous)) * 100;
};

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<string>('month');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filterFuelType, setFilterFuelType] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [fuelTypeData, setFuelTypeData] = useState<FuelTypeData[]>([]);
  const [periodData, setPeriodData] = useState<PeriodData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [vehicles, setVehicles] = useState<VehicleData[]>(vehiclesData);
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState<boolean>(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleData | null>(null);
  const [editForm] = Form.useForm();
  const [addForm] = Form.useForm();
  const currentUser = getCurrentUser();
  const canEditVehicles = currentUser?.role === 'admin';
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const iconProps = {
    className: "stat-icon",
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
    style: {
      fontSize: '12px',
      marginRight: '4px'
    }
  };

  // Обработчики фильтров
  const handlePeriodChange = (e: RadioChangeEvent) => {
    setPeriod(e.target.value);
  };
  
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };
  
  const handleFuelTypeChange = (value: string | null) => {
    setFilterFuelType(value);
  };
  
  const handleResetFilters = () => {
    setDateRange(null);
    setFilterFuelType(null);
  };

  // Фильтрация транзакций
  const filterTransactions = (transactions: FuelTransaction[]): FuelTransaction[] => {
    return transactions.filter(t => {
      let matchesDateRange = true;
      let matchesFuelType = true;
      
      // Фильтр по дате
      if (dateRange && dateRange[0] && dateRange[1]) {
        const transactionDate = t.timestamp;
        const startDate = dateRange[0].startOf('day').valueOf();
        const endDate = dateRange[1].endOf('day').valueOf();
        matchesDateRange = transactionDate >= startDate && transactionDate <= endDate;
      }
      
      // Фильтр по типу топлива
      if (filterFuelType) {
        matchesFuelType = t.fuelType === filterFuelType;
      }
      
      return matchesDateRange && matchesFuelType;
    });
  };

  // Загрузка данных из базы данных
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Check API and get transactions
      let allTransactions = [];
      
      // Приоритет 1: Проверяем доступность web API
      if (window.api && window.api.fuelService) {
        try {
          console.log('📊 Using web API fuelService');
          const response = await window.api.fuelService.getTransactions();
          if (response && response.data) {
            allTransactions = response.data;
            console.log('📊 Retrieved transactions from web API:', allTransactions.length);
          }
        } catch (webApiError) {
          console.error('📊 Web API error:', webApiError);
          message.warning('Ошибка при получении данных через API');
        }
      }
      // Приоритет 2: Пробуем использовать Electron API если web API не сработал
      else if (window.electronAPI) {
        try {
          // Check both API formats
          // @ts-ignore
          if (window.electronAPI.transactions?.getAll) {
            console.log('📊 Using window.electronAPI.transactions.getAll()');
            // @ts-ignore
            const result = await window.electronAPI.transactions.getAll();
            if (result && Array.isArray(result)) {
              allTransactions = result;
            } else if (result && result.data && Array.isArray(result.data)) {
              allTransactions = result.data;
            }
          // @ts-ignore
          } else if (window.electronAPI.getTransactions) {
            console.log('📊 Using window.electronAPI.getTransactions()');
            // @ts-ignore
            const result = await window.electronAPI.getTransactions();
            if (result && Array.isArray(result)) {
              allTransactions = result;
            } else if (result && result.data && Array.isArray(result.data)) {
              allTransactions = result.data;
            }
          }
        } catch (apiError) {
          console.error('📊 API error:', apiError);
          message.warning('Ошибка при получении данных из локального API');
        }
      } else {
        console.warn('📊 No API available');
      }
      
      // Если все еще нет данных, используем тестовые
      if (!allTransactions || allTransactions.length === 0) {
        console.warn('📊 No transactions found, using mock data');
        allTransactions = mockTransactions;
      }
      
      console.log('📊 Loaded transactions:', allTransactions.length);
      setTransactions(allTransactions);
      
      // Filter transactions based on the selected period and date range
      const filteredTransactions = filterTransactions(allTransactions);
      
      // Рассчитываем данные по типам топлива
      const typesData = FUEL_TYPES.map(fuelType => {
        const fuelTransactions = filteredTransactions.filter(
          (t: FuelTransaction) => t.fuelType === fuelType.value
        );
        const purchased = fuelTransactions
          .filter((t: FuelTransaction) => t.type === 'purchase')
          .reduce((sum: number, t: FuelTransaction) => sum + t.volume, 0);
        const sold = fuelTransactions
          .filter((t: FuelTransaction) => t.type === 'sale')
          .reduce((sum: number, t: FuelTransaction) => sum + t.volume, 0);
        const baseToBunker = fuelTransactions
          .filter((t: FuelTransaction) => t.type === 'base_to_bunker')
          .reduce((sum: number, t: FuelTransaction) => sum + t.volume, 0);
        const bunkerToBase = fuelTransactions
          .filter((t: FuelTransaction) => t.type === 'bunker_to_base')
          .reduce((sum: number, t: FuelTransaction) => sum + t.volume, 0);
        const purchaseCost = fuelTransactions
          .filter((t: FuelTransaction) => t.type === 'purchase')
          .reduce((sum: number, t: FuelTransaction) => sum + t.totalCost, 0);
        const saleIncome = fuelTransactions
          .filter((t: FuelTransaction) => t.type === 'sale')
          .reduce((sum: number, t: FuelTransaction) => sum + t.totalCost, 0);
        
        return {
          fuelType: fuelType.value,
          fuelName: fuelType.label,
          purchased,
          sold,
          baseBalance: purchased - sold - baseToBunker + bunkerToBase,
          bunkerBalance: baseToBunker - bunkerToBase - sold,
          purchaseCost,
          saleIncome,
          profit: saleIncome - purchaseCost
        };
      }).filter(data => data.purchased > 0 || data.sold > 0 || data.baseBalance > 0 || data.bunkerBalance > 0);
      
      setFuelTypeData(typesData);
      
      // Группируем транзакции по периодам
      const periodData = groupByMonth(filteredTransactions);
      setPeriodData(periodData);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      message.error('Не удалось загрузить данные');
      setTransactions([]);
      setFuelTypeData([]);
      setPeriodData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load vehicles from database
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        let dbVehicles = [];
        
        // Приоритет 1: Проверяем доступность web API
        if (window.api && window.api.vehicleService) {
          try {
            console.log('🚗 Using web API vehicleService');
            const response = await window.api.vehicleService.getVehicles();
            if (response && response.data) {
              dbVehicles = Array.isArray(response.data) ? response.data : 
                           (response.data.data ? response.data.data : []);
              console.log('🚗 Loaded vehicles from web API:', dbVehicles.length);
            }
          } catch (webError) {
            console.warn('🚗 Error loading vehicles from web API:', webError);
          }
        }
        // Приоритет 2: Пробуем использовать Electron API если web API не сработал
        else if (window.electronAPI) {
          try {
            // Пробуем разные форматы API
            // @ts-ignore
            if (window.electronAPI.vehicles && window.electronAPI.vehicles.getAll) {
              // Новый формат API (vehicles.getAll)
              console.log('🚗 Using window.electronAPI.vehicles.getAll()');
              // @ts-ignore
              const result = await window.electronAPI.vehicles.getAll();
              if (result && Array.isArray(result)) {
                dbVehicles = result;
              } else if (result && result.data && Array.isArray(result.data)) {
                dbVehicles = result.data;
              }
            // @ts-ignore
            } else if (window.electronAPI.getVehicles) {
              // Старый формат API (getVehicles)
              console.log('🚗 Using window.electronAPI.getVehicles()');
              // @ts-ignore
              const result = await window.electronAPI.getVehicles();
              if (result && Array.isArray(result)) {
                dbVehicles = result;
              } else if (result && result.data && Array.isArray(result.data)) {
                dbVehicles = result.data;
              }
            }
          } catch (apiError) {
            console.warn('🚗 Error loading vehicles from electronAPI:', apiError);
          }
        }
        
        // Если нет данных или произошла ошибка, используем тестовые данные
        if (!dbVehicles || dbVehicles.length === 0) {
          console.log('🚗 No vehicle data found, using mock data');
          setVehicles(vehiclesData); // Используем тестовые данные
          return;
        }

        console.log('🚗 Loaded vehicles:', dbVehicles.length);
        setVehicles(dbVehicles);
      } catch (error) {
        console.error('🚗 General error loading vehicles:', error);
        message.error('Не удалось загрузить список транспортных средств');
        setVehicles(vehiclesData); // Используем тестовые данные в случае ошибки
      }
    };
    
    loadVehicles();
  }, []);

  // Загрузка данных при первой загрузке и изменении фильтров
  useEffect(() => {
    loadData();
  }, [dateRange, filterFuelType, period]);

  // Для остатков и прибыли используем все незамороженные транзакции
  const stats = calculateFuelStats(transactions.filter(t => !t.frozen) as any);
  const { baseBalance, bunkerBalance, profit, frozenCost } = stats;
  
  const totalPurchased = transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.volume, 0);
    
  const totalSold = transactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.volume, 0);

  const totalBaseToBunker = transactions
    .filter(t => t.type === 'base_to_bunker')
    .reduce((sum, t) => sum + t.volume, 0);

  const totalBunkerToBase = transactions
    .filter(t => t.type === 'bunker_to_base')
    .reduce((sum, t) => sum + t.volume, 0);
    
  const totalPurchaseCost = transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.totalCost, 0);
    
  const totalSaleIncome = transactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.totalCost, 0);

  const totalProfit = totalSaleIncome - totalPurchaseCost;

  // Расчет данных для сравнения с предыдущим периодом
  const calculatePreviousPeriodData = () => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      const currentStart = dateRange[0].valueOf();
      const currentEnd = dateRange[1].valueOf();
      const periodLength = currentEnd - currentStart;
      
      // Расчёт предыдущего периода такой же длительности
      const previousStart = currentStart - periodLength;
      const previousEnd = currentStart - 1;
      
      const previousPeriodTransactions = transactions.filter(t => {
        return t.timestamp >= previousStart && t.timestamp <= previousEnd;
      });
      
      const previousPurchased = previousPeriodTransactions
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + t.volume, 0);
        
      const previousSold = previousPeriodTransactions
        .filter(t => t.type === 'sale')
        .reduce((sum, t) => sum + t.volume, 0);
        
      const previousPurchaseCost = previousPeriodTransactions
        .filter(t => t.type === 'purchase')
        .reduce((sum, t) => sum + t.totalCost, 0);
        
      const previousSaleIncome = previousPeriodTransactions
        .filter(t => t.type === 'sale')
        .reduce((sum, t) => sum + t.totalCost, 0);
      
      const previousProfit = previousSaleIncome - previousPurchaseCost;
      
      return {
        purchasedChange: calculateChange(totalPurchased, previousPurchased),
        soldChange: calculateChange(totalSold, previousSold),
        profitChange: calculateChange(totalProfit, previousProfit)
      };
    }
    
    return {
      purchasedChange: 0,
      soldChange: 0,
      profitChange: 0
    };
  };

  const { purchasedChange, soldChange, profitChange } = calculatePreviousPeriodData();
  
  // Данные для круговой диаграммы остатков топлива
  const fuelBalanceData = fuelTypeData.filter(data => data.bunkerBalance > 0);
  
  // Данные для графика транзакций по времени
  const getTransactionsTimeData = () => {
    if (periodData.length === 0) return [];
    
    return periodData.map(item => ({
      name: item.name,
      Покупка: item.purchased,
      Продажа: item.sold,
      Прибыль: item.profit
    }));
  };

  const transactionsTimeData = getTransactionsTimeData();

  const handleEditVehicle = (vehicle: VehicleData) => {
    setEditingVehicle(vehicle);
    editForm.setFieldsValue({
      id: vehicle.id,
      type: vehicle.type,
      model: vehicle.model,
      fuelType: vehicle.fuelType,
      consumption: vehicle.consumption,
      lastRefuel: vehicle.lastRefuel
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateVehicle = async (values: any) => {
    if (!editingVehicle) return;
    
    try {
      // Приоритет 1: Используем веб API
      if (window.api && window.api.vehicleService) {
        console.log('🚗 Updating vehicle using web API:', values);
        await window.api.vehicleService.updateVehicle(editingVehicle.id, values);
        message.success('Транспортное средство обновлено');
      }
      // Приоритет 2: Пробуем использовать Electron API
      // @ts-ignore
      else if (window.electronAPI?.vehicles?.update) {
        // @ts-ignore
        await window.electronAPI.vehicles.update({
          ...values,
          key: editingVehicle.key
        });
        message.success('Транспортное средство обновлено');
      // @ts-ignore
      } else if (window.electronAPI?.updateVehicle) {
        // @ts-ignore
        await window.electronAPI.updateVehicle({
          ...values,
          key: editingVehicle.key
        });
        message.success('Транспортное средство обновлено');
      } else {
        message.info('API для обновления не найден, будет использована симуляция');
        // Симулируем обновление в тестовых данных
        // Это просто для демонстрации в случае отсутствия API
      }
      
      // Получаем обновленный список ТС
      let updatedVehicles;
      // @ts-ignore
      if (window.electronAPI?.vehicles?.getAll) {
        // @ts-ignore
        updatedVehicles = await window.electronAPI.vehicles.getAll();
      // @ts-ignore
      } else if (window.electronAPI?.getVehicles) {
        // @ts-ignore
        updatedVehicles = await window.electronAPI.getVehicles();
      } else {
        throw new Error('API транспортных средств не инициализирован');
      }
      
      setVehicles(updatedVehicles);
      setIsEditModalVisible(false);
      setEditingVehicle(null);
    } catch (error) {
      console.error('Ошибка при обновлении ТС:', error);
      message.error('Не удалось обновить транспортное средство');
    }
  };

  const handleAddVehicle = async (values: any) => {
    try {
      const newVehicle = {
        id: values.id,
        type: values.type,
        model: values.model,
        fuelType: values.fuelType,
        consumption: parseFloat(values.consumption),
        lastRefuel: values.lastRefuel,
        key: String(Math.random())
      };
      
      // Приоритет 1: Используем веб API
      if (window.api && window.api.vehicleService) {
        console.log('🚗 Adding vehicle using web API:', values);
        const response = await window.api.vehicleService.createVehicle(values);
        
        // Обновляем список ТС
        if (response && response.data) {
          const createdVehicle = {
            ...response.data,
            key: response.data.id || String(Math.random())
          };
          setVehicles([...vehicles, createdVehicle]);
        } else {
          // Загружаем актуальный список транспортных средств
          try {
            const vehiclesResponse = await window.api.vehicleService.getVehicles();
            if (vehiclesResponse && vehiclesResponse.data) {
              const vehiclesList = Array.isArray(vehiclesResponse.data) ? 
                vehiclesResponse.data : (vehiclesResponse.data.data || []);
              setVehicles(vehiclesList);
            }
          } catch (error) {
            console.error('Error refreshing vehicles list:', error);
          }
        }
        message.success('Транспортное средство добавлено');
      }
      // Приоритет 2: Пробуем Electron API
      // @ts-ignore
      else if (window.electronAPI?.vehicles?.add) {
        // @ts-ignore
        await window.electronAPI.vehicles.add(newVehicle);
        
        // Получаем обновленный список ТС
        let updatedVehicles;
        // @ts-ignore
        if (window.electronAPI?.vehicles?.getAll) {
          // @ts-ignore
          updatedVehicles = await window.electronAPI.vehicles.getAll();
        // @ts-ignore
        } else if (window.electronAPI?.getVehicles) {
          // @ts-ignore
          updatedVehicles = await window.electronAPI.getVehicles();
        } else {
          throw new Error('API транспортных средств не инициализирован');
        }
        
        setVehicles(updatedVehicles);
        message.success('Транспортное средство добавлено');
      // @ts-ignore
      } else if (window.electronAPI?.addVehicle) {
        // @ts-ignore
        await window.electronAPI.addVehicle(newVehicle);
        
        // Получаем обновленный список ТС
        let updatedVehicles;
        // @ts-ignore
        if (window.electronAPI?.vehicles?.getAll) {
          // @ts-ignore
          updatedVehicles = await window.electronAPI.vehicles.getAll();
        // @ts-ignore
        } else if (window.electronAPI?.getVehicles) {
          // @ts-ignore
          updatedVehicles = await window.electronAPI.getVehicles();
        } else {
          throw new Error('API транспортных средств не инициализирован');
        }
        
        setVehicles(updatedVehicles);
        message.success('Транспортное средство добавлено');
      } else {
        message.info('API для добавления не найден, будет использована симуляция');
        // Симулируем добавление в локальные данные
        const mockVehicle = {
          ...newVehicle,
          id: `ТС-${Math.floor(Math.random() * 1000)}`
        };
        setVehicles([...vehicles, mockVehicle]);
      }
      
      setIsAddModalVisible(false);
      addForm.resetFields();
    } catch (error) {
      console.error('Ошибка при добавлении ТС:', error);
      message.error('Не удалось добавить транспортное средство');
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    Modal.confirm({
      title: 'Вы уверены, что хотите удалить это транспортное средство?',
      content: 'Это действие нельзя отменить.',
      okText: 'Да, удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          // Приоритет 1: Используем веб API
          if (window.api && window.api.vehicleService) {
            console.log('🚗 Deleting vehicle using web API:', id);
            await window.api.vehicleService.deleteVehicle(id);
            
            // Обновляем список ТС после удаления
            try {
              const vehiclesResponse = await window.api.vehicleService.getVehicles();
              if (vehiclesResponse && vehiclesResponse.data) {
                const vehiclesList = Array.isArray(vehiclesResponse.data) ? 
                  vehiclesResponse.data : (vehiclesResponse.data.data || []);
                setVehicles(vehiclesList);
              }
            } catch (error) {
              console.error('Error refreshing vehicles list:', error);
              // Удаляем ТС локально, если не удалось обновить с сервера
              setVehicles(vehicles.filter(v => v.id !== id));
            }
            message.success('Транспортное средство удалено');
          }
          // Приоритет 2: Пробуем Electron API
          // @ts-ignore
          else if (window.electronAPI?.vehicles?.delete) {
            // @ts-ignore
            await window.electronAPI.vehicles.delete(id);
            
            // Получаем обновленный список ТС
            let updatedVehicles;
            // @ts-ignore
            if (window.electronAPI?.vehicles?.getAll) {
              // @ts-ignore
              updatedVehicles = await window.electronAPI.vehicles.getAll();
            // @ts-ignore
            } else if (window.electronAPI?.getVehicles) {
              // @ts-ignore
              updatedVehicles = await window.electronAPI.getVehicles();
            } else {
              throw new Error('API транспортных средств не инициализирован');
            }
            
            setVehicles(updatedVehicles);
            message.success('Транспортное средство удалено');
          // @ts-ignore
          } else if (window.electronAPI?.deleteVehicle) {
            // @ts-ignore
            await window.electronAPI.deleteVehicle(id);
            
            // Получаем обновленный список ТС
            let updatedVehicles;
            // @ts-ignore
            if (window.electronAPI?.vehicles?.getAll) {
              // @ts-ignore
              updatedVehicles = await window.electronAPI.vehicles.getAll();
            // @ts-ignore
            } else if (window.electronAPI?.getVehicles) {
              // @ts-ignore
              updatedVehicles = await window.electronAPI.getVehicles();
            } else {
              throw new Error('API транспортных средств не инициализирован');
            }
            
            setVehicles(updatedVehicles);
            message.success('Транспортное средство удалено');
          } else {
            message.info('API для удаления не найден, удаляю локально');
            // Если нет API, удаляем локально
            setVehicles(vehicles.filter(v => v.id !== id));
          }
        } catch (error) {
          console.error('Ошибка при удалении ТС:', error);
          message.error('Не удалось удалить транспортное средство');
        }
      }
    });
  };

  // Update the columns to include an Actions column
  const vehicleColumns: ColumnsType<VehicleData> = [
    ...columns,
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />}
            size="small" 
            type="primary"
            onClick={() => handleEditVehicle(record)}
            disabled={!canEditVehicles}
            style={{ color: 'white' }}
          />
          <Button 
            icon={<DeleteOutlined />}
            size="small" 
            type="primary"
            danger
            onClick={() => handleDeleteVehicle(record.id)}
            disabled={!canEditVehicles}
          />
        </Space>
      ),
    },
  ];

  const iconStyle = { color: 'white' };
  const deleteIconStyle = { color: 'red' };

  return (
    <div className={styles.dashboard}>
      <Row gutter={16}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Active Users"
              value={11.28}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              prefix={<ArrowUpOutlined {...iconProps} />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Idle Users"
              value={9.3}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ArrowDownOutlined {...iconProps} />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <div className="fuel-management-panel">
        <h2>Управление расходом топлива</h2>
        <div className="fuel-stats">
          <div className="fuel-stat-item">
            <div className="fuel-stat-title">Остаток на базе</div>
            <div className="fuel-stat-value">{baseBalance.toFixed(2)} л</div>
            <div className="fuel-stat-change">
              <ArrowUpOutlined {...iconProps} style={{ ...iconProps.style, color: '#3f8600' }} /> +5.3%
            </div>
          </div>
          <div className="fuel-stat-item">
            <div className="fuel-stat-title">Остаток на бункеровщике</div>
            <div className="fuel-stat-value">{bunkerBalance.toFixed(2)} л</div>
            <div className="fuel-stat-change">
              <ArrowUpOutlined {...iconProps} style={{ ...iconProps.style, color: '#3f8600' }} /> +2.1%
            </div>
          </div>
          <div className="fuel-stat-item">
            <div className="fuel-stat-title">Затраты на топливо</div>
            <div className="fuel-stat-value">{totalPurchaseCost.toFixed(2)} ₽</div>
            <div className="fuel-stat-change negative">
              <ArrowDownOutlined {...iconProps} style={{ ...iconProps.style, color: '#cf1322' }} /> -2.1%
            </div>
          </div>
          <div className="fuel-stat-item">
            <div className="fuel-stat-title">Прибыль</div>
            <div className="fuel-stat-value">{(profit > 0 ? profit : 0).toFixed(2)} ₽</div>
            <div className="fuel-stat-change">
              <ArrowUpOutlined {...iconProps} style={{ ...iconProps.style, color: '#3f8600' }} /> +3.5%
            </div>
            <div style={{ color: '#1890ff', fontSize: 13, marginTop: 4 }}>
              Заморожено: {frozenCost.toFixed(2)} ₽
            </div>
          </div>
        </div>
      </div>

      <div className="statistics-card">
        <Card title="Статистика по расходу топлива" className="chart-card">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fuelData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#1890ff" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Распределение по типам ТС" className="chart-card">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={vehicleTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {vehicleTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="table-card">
        <div className="table-toolbar">
          <Space>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
            />
            <Select
              placeholder="Тип топлива"
              style={{ width: 200 }}
              options={FUEL_TYPES.map(type => ({ value: type.value, label: type.label }))}
              onChange={handleFuelTypeChange}
            />
            <Button type="primary" onClick={handleResetFilters}>
              Применить фильтр
            </Button>
          </Space>
        </div>
        <Table
          columns={columns}
          dataSource={vehicles}
          pagination={{ pageSize: 10 }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
};

export default Dashboard; 
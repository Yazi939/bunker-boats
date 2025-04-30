// @ts-nocheck

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Radio,
  Space,
  Select,
  Alert,
  Button,
  message,
  Divider,
  Typography,
  Spin
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  DollarOutlined
} from '@ant-design/icons';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import type { RadioChangeEvent } from 'antd/es/radio';
import type { Dayjs } from 'dayjs';
import styles from './Dashboard.module.css';

const { Option } = Select;
const { Title } = Typography;

// Типы топлива
const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизельное топливо' },
  { value: 'gasoline_95', label: 'Бензин АИ-95' }
];

// Цвета для диаграмм
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Примеры тестовых транзакций
const mockTransactions = [
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
  },
  {
    key: '3',
    type: 'salary',
    totalCost: 35000,
    date: '2023-01-25',
    timestamp: 1674604800000,
    notes: 'Зарплата экипажу'
  },
  {
    key: '4',
    type: 'expense',
    totalCost: 15000,
    date: '2023-01-22',
    timestamp: 1674345600000,
    notes: 'Ремонт оборудования'
  }
];

// Обновленная схема транзакций с добавлением заработной платы
interface FuelTransaction {
  key: string;
  id?: string | number;
  type: 'purchase' | 'sale' | 'base_to_bunker' | 'bunker_to_base' | 'expense' | 'salary' | 'repair';
  volume?: number;
  price?: number;
  totalCost: number;
  date: string;
  timestamp: number;
  fuelType?: string;
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

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<string>('month');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filterFuelType, setFilterFuelType] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Статистические данные
  const [fuelStats, setFuelStats] = useState({
    baseBalance: 0,
    bunkerBalance: 0,
    totalPurchased: 0,
    totalSold: 0,
    purchaseCost: 0,
    salesIncome: 0,
    profit: 0
  });

  // Данные по расходам
  const [expenseStats, setExpenseStats] = useState({
    salary: 0,
    repairs: 0,
    otherExpenses: 0,
    totalExpenses: 0
  });

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
    setPeriod('month');
  };

  // Фильтрация транзакций
  const filterTransactions = (allTransactions: FuelTransaction[]): FuelTransaction[] => {
    return allTransactions.filter(t => {
      let matchesDateRange = true;
      let matchesFuelType = true;
      
      // Фильтр по дате
      if (dateRange && dateRange[0] && dateRange[1]) {
        const transactionDate = t.timestamp;
        const startDate = dateRange[0].startOf('day').valueOf();
        const endDate = dateRange[1].endOf('day').valueOf();
        matchesDateRange = transactionDate >= startDate && transactionDate <= endDate;
      } else if (period !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        let startDate = today;
        
        if (period === 'month') {
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).getTime();
        } else if (period === 'week') {
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).getTime();
        } else if (period === 'day') {
          startDate = today;
        }
        
        matchesDateRange = t.timestamp >= startDate;
      }
      
      // Фильтр по типу топлива (только для транзакций с топливом)
      if (filterFuelType && t.fuelType) {
        matchesFuelType = t.fuelType === filterFuelType;
      }
      
      return matchesDateRange && matchesFuelType;
    });
  };

  // Загрузка данных
  const loadData = async () => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      let allTransactions = [];
      let apiAvailable = false;
      
      // Пробуем получить данные через API
      if (window.api && window.api.fuelService) {
        try {
          console.log('Получение транзакций через API');
          const response = await window.api.fuelService.getTransactions();
          if (response && response.data) {
            allTransactions = response.data;
            apiAvailable = true;
          }
        } catch (apiError) {
          console.error('Ошибка API:', apiError);
        }
      }
      
      // Если данных нет, используем тестовые
      if (!allTransactions || allTransactions.length === 0) {
        console.log('Используем тестовые данные');
        allTransactions = mockTransactions;
        
        if (!apiAvailable) {
          message.warning('Используются тестовые данные из-за недоступности API');
        }
      }
      
      setTransactions(allTransactions);
      
      // Фильтруем транзакции и рассчитываем статистику
      const filteredTransactions = filterTransactions(allTransactions);
      calculateStats(filteredTransactions);
      
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setApiError('Произошла ошибка при получении данных');
      setTransactions(mockTransactions);
      calculateStats(mockTransactions);
    } finally {
      setIsLoading(false);
    }
  };

  // Расчет статистики по транзакциям
  const calculateStats = (filteredTransactions: FuelTransaction[]) => {
    // Статистика по топливу
    const purchased = filteredTransactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + (t.volume || 0), 0);
      
    const sold = filteredTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.volume || 0), 0);
      
    const baseToBunker = filteredTransactions
      .filter(t => t.type === 'base_to_bunker')
      .reduce((sum, t) => sum + (t.volume || 0), 0);
      
    const bunkerToBase = filteredTransactions
      .filter(t => t.type === 'bunker_to_base')
      .reduce((sum, t) => sum + (t.volume || 0), 0);
      
    const purchaseCost = filteredTransactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + t.totalCost, 0);
      
    const salesIncome = filteredTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalCost, 0);

    // Статистика по расходам
    const salaryExpenses = filteredTransactions
      .filter(t => t.type === 'salary')
      .reduce((sum, t) => sum + t.totalCost, 0);
      
    const repairExpenses = filteredTransactions
      .filter(t => t.type === 'repair')
      .reduce((sum, t) => sum + t.totalCost, 0);
      
    const otherExpenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.type !== 'salary' && t.type !== 'repair')
      .reduce((sum, t) => sum + t.totalCost, 0);
      
    const totalExpenses = salaryExpenses + repairExpenses + otherExpenses;

    // Обновляем статистику по топливу
    setFuelStats({
      baseBalance: purchased - sold - baseToBunker + bunkerToBase,
      bunkerBalance: baseToBunker - bunkerToBase,
      totalPurchased: purchased,
      totalSold: sold,
      purchaseCost,
      salesIncome,
      profit: salesIncome - purchaseCost
    });

    // Обновляем статистику по расходам
    setExpenseStats({
      salary: salaryExpenses,
      repairs: repairExpenses,
      otherExpenses,
      totalExpenses
    });
  };

  // Данные для круговой диаграммы расходов
  const getExpenseChartData = () => {
    const data = [];
    
    if (expenseStats.salary > 0) {
      data.push({ name: 'Зарплаты', value: expenseStats.salary });
    }
    
    if (expenseStats.repairs > 0) {
      data.push({ name: 'Ремонт', value: expenseStats.repairs });
    }
    
    if (expenseStats.otherExpenses > 0) {
      data.push({ name: 'Прочие расходы', value: expenseStats.otherExpenses });
    }
    
    return data;
  };

  // Данные для графика топлива
  const getFuelChartData = () => {
    // Группируем транзакции по типам топлива
    const fuelTypes = {};
    
    transactions.forEach(t => {
      if (t.fuelType && (t.type === 'purchase' || t.type === 'sale')) {
        if (!fuelTypes[t.fuelType]) {
          fuelTypes[t.fuelType] = { 
            name: FUEL_TYPES.find(ft => ft.value === t.fuelType)?.label || t.fuelType,
            purchased: 0,
            sold: 0
          };
        }
        
        if (t.type === 'purchase') {
          fuelTypes[t.fuelType].purchased += t.volume || 0;
        } else if (t.type === 'sale') {
          fuelTypes[t.fuelType].sold += t.volume || 0;
        }
      }
    });
    
    return Object.values(fuelTypes);
  };

  // Загрузка данных при изменении фильтров
  useEffect(() => {
    loadData();
  }, [dateRange, filterFuelType, period]);

  // Форматирование цены
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className={styles.dashboard}>
      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Spin size="large" />
          <p>Загрузка данных...</p>
        </div>
      ) : (
        <>
          {apiError && (
            <Alert
              message="Ошибка загрузки данных"
              description={apiError}
              type="error"
              closable
              style={{ marginBottom: 16 }}
              onClose={() => setApiError(null)}
            />
          )}
          
          {/* Фильтры */}
          <Card title="Фильтры" className={styles.filtersCard} style={{ marginBottom: 16 }}>
            <Space wrap>
              <Radio.Group value={period} onChange={handlePeriodChange}>
                <Radio.Button value="all">Все время</Radio.Button>
                <Radio.Button value="month">Месяц</Radio.Button>
                <Radio.Button value="week">Неделя</Radio.Button>
                <Radio.Button value="day">День</Radio.Button>
              </Radio.Group>
              
              <DatePicker.RangePicker 
                value={dateRange} 
                onChange={handleDateRangeChange}
                allowClear
              />
              
              <Select
                placeholder="Тип топлива"
                allowClear
                style={{ width: 180 }}
                value={filterFuelType}
                onChange={handleFuelTypeChange}
              >
                {FUEL_TYPES.map(type => (
                  <Option key={type.value} value={type.value}>{type.label}</Option>
                ))}
              </Select>
              
              <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
                Сбросить
              </Button>
              
              <Button type="primary" icon={<ReloadOutlined />} onClick={loadData}>
                Обновить
              </Button>
            </Space>
          </Card>
          
          {/* Сводка по топливу */}
          <Title level={4}>Статистика по топливу</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Остаток на базе"
                  value={fuelStats.baseBalance}
                  precision={2}
                  suffix="л"
                  valueStyle={{ color: fuelStats.baseBalance > 0 ? '#3f8600' : '#cf1322' }}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Остаток на бункеровщике"
                  value={fuelStats.bunkerBalance}
                  precision={2}
                  suffix="л"
                  valueStyle={{ color: fuelStats.bunkerBalance > 0 ? '#3f8600' : '#cf1322' }}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Затраты на закупку"
                  value={fuelStats.purchaseCost}
                  formatter={value => formatPrice(value)}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<ArrowDownOutlined />}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Прибыль от продаж"
                  value={fuelStats.profit}
                  formatter={value => formatPrice(value)}
                  valueStyle={{ color: fuelStats.profit > 0 ? '#3f8600' : '#cf1322' }}
                  prefix={fuelStats.profit > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                />
              </Card>
            </Col>
          </Row>
          
          <Divider />
          
          {/* График по топливу */}
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} lg={12}>
              <Card title="Объемы по типам топлива">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={getFuelChartData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar name="Закуплено (л)" dataKey="purchased" fill="#0088FE" />
                    <Bar name="Продано (л)" dataKey="sold" fill="#00C49F" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            
            {/* График расходов */}
            <Col xs={24} lg={12}>
              <Card title="Структура расходов">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getExpenseChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {getExpenseChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatPrice(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
          
          {/* Сводка по расходам */}
          <Title level={4} style={{ marginTop: 24 }}>Расходы</Title>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Зарплаты"
                  value={expenseStats.salary}
                  formatter={value => formatPrice(value)}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<DollarOutlined />}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Ремонт"
                  value={expenseStats.repairs}
                  formatter={value => formatPrice(value)}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Прочие расходы"
                  value={expenseStats.otherExpenses}
                  formatter={value => formatPrice(value)}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Всего расходов"
                  value={expenseStats.totalExpenses}
                  formatter={value => formatPrice(value)}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<ArrowDownOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard; 
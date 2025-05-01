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

// Fuel types
const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизельное топливо' },
  { value: 'gasoline_95', label: 'Бензин АИ-95' }
];

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

// Transaction interface
interface FuelTransaction {
  key: string;
  id?: string | number;
  type: 'purchase' | 'sale' | 'expense' | 'salary' | 'repair';
  volume?: number;
  price?: number;
  totalCost: number;
  date: string;
  timestamp: number;
  fuelType?: string;
  supplier?: string;
  customer?: string;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'deferred';
  userId?: string;
  userRole?: string;
  notes?: string;
}

const Dashboard: React.FC = () => {
  const [period, setPeriod] = useState<string>('month');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [filterFuelType, setFilterFuelType] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Statistics data
  const [fuelStats, setFuelStats] = useState({
    totalBalance: 0,
    totalPurchased: 0,
    totalSold: 0,
    purchaseCost: 0,
    salesIncome: 0,
    profit: 0
  });

  // Expense data
  const [expenseStats, setExpenseStats] = useState({
    salary: 0,
    repairs: 0,
    otherExpenses: 0,
    totalExpenses: 0
  });

  // Filter handlers
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

  // Filter transactions
  const filterTransactions = (allTransactions: FuelTransaction[]): FuelTransaction[] => {
    return allTransactions.filter(t => {
      let matchesDateRange = true;
      let matchesFuelType = true;
      
      // Date filter
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
      
      // Fuel type filter
      if (filterFuelType && t.fuelType) {
        matchesFuelType = t.fuelType === filterFuelType;
      }
      
      return matchesDateRange && matchesFuelType;
    });
  };

  // Load data
  const loadData = async () => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      let allTransactions = [];
      
      // Try to get data via API
      if (window.api && window.api.fuelService) {
        try {
          const response = await window.api.fuelService.getTransactions();
          if (response && Array.isArray(response)) {
            allTransactions = response;
          } else if (response && response.data) {
            allTransactions = response.data;
          }
        } catch (apiError) {
          console.error('API Error:', apiError);
          setApiError('Failed to fetch transaction data');
        }
      }
      
      setTransactions(allTransactions);
      
      // Filter transactions and calculate statistics
      const filteredTransactions = filterTransactions(allTransactions);
      calculateStats(filteredTransactions);
      
    } catch (error) {
      console.error('Data loading error:', error);
      setApiError('An error occurred while loading data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (filteredTransactions: FuelTransaction[]) => {
    let totalPurchased = 0;
    let totalSold = 0;
    let purchaseCost = 0;
    let salesIncome = 0;
    let salary = 0;
    let repairs = 0;
    let otherExpenses = 0;
    
    filteredTransactions.forEach(transaction => {
      switch (transaction.type) {
        case 'purchase':
          totalPurchased += Number(transaction.volume || 0);
          purchaseCost += Number(transaction.totalCost || 0);
          break;
        case 'sale':
          totalSold += Number(transaction.volume || 0);
          salesIncome += Number(transaction.totalCost || 0);
          break;
        case 'salary':
          salary += Number(transaction.totalCost || 0);
          break;
        case 'repair':
          repairs += Number(transaction.totalCost || 0);
          break;
        case 'expense':
          otherExpenses += Number(transaction.totalCost || 0);
          break;
        default:
          break;
      }
    });
    
    const totalExpenses = salary + repairs + otherExpenses;
    const profit = salesIncome - purchaseCost - totalExpenses;
    const totalBalance = totalPurchased - totalSold;
    
    setFuelStats({
      totalBalance,
      totalPurchased,
      totalSold,
      purchaseCost,
      salesIncome,
      profit
    });
    
    setExpenseStats({
      salary,
      repairs,
      otherExpenses,
      totalExpenses
    });
  };

  // Get expense chart data
  const getExpenseChartData = () => {
    return [
      { name: 'Зарплата', value: expenseStats.salary },
      { name: 'Ремонт', value: expenseStats.repairs },
      { name: 'Прочие расходы', value: expenseStats.otherExpenses }
    ].filter(item => item.value > 0);
  };

  // Get fuel chart data
  const getFuelChartData = () => {
    return [
      { name: 'Закупки', value: fuelStats.purchaseCost },
      { name: 'Продажи', value: fuelStats.salesIncome },
      { name: 'Расходы', value: expenseStats.totalExpenses }
    ];
  };

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Load data on mount and when filters change
  useEffect(() => {
    loadData();
  }, [period, dateRange, filterFuelType]);

  return (
    <div className={styles.dashboardContainer}>
      <Title level={2}>Аналитика расходов на топливо и зарплаты</Title>
      
      {apiError && (
        <Alert 
          message="Ошибка" 
          description={apiError} 
          type="error" 
          showIcon 
          className={styles.errorAlert}
        />
      )}
      
      <div className={styles.filterContainer}>
        <Space wrap>
          <Radio.Group value={period} onChange={handlePeriodChange}>
            <Radio.Button value="day">День</Radio.Button>
            <Radio.Button value="week">Неделя</Radio.Button>
            <Radio.Button value="month">Месяц</Radio.Button>
            <Radio.Button value="all">Все время</Radio.Button>
          </Radio.Group>
          
          <DatePicker.RangePicker onChange={handleDateRangeChange} value={dateRange} />
          
          <Select
            allowClear
            placeholder="Тип топлива"
            style={{ width: 180 }}
            onChange={handleFuelTypeChange}
            value={filterFuelType}
          >
            {FUEL_TYPES.map(type => (
              <Option key={type.value} value={type.value}>{type.label}</Option>
            ))}
          </Select>
          
          <Button icon={<ReloadOutlined />} onClick={handleResetFilters}>
            Сбросить
          </Button>
        </Space>
      </div>
      
      <Spin spinning={isLoading}>
        <Row gutter={[16, 16]}>
          {/* Fuel Statistics */}
          <Col xs={24} lg={12}>
            <Card title="Финансовая статистика по топливу" className={styles.statsCard}>
              <Statistic
                title="Закупки топлива"
                value={formatPrice(fuelStats.purchaseCost)}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ArrowDownOutlined />}
              />
              <Statistic
                title="Продажи топлива"
                value={formatPrice(fuelStats.salesIncome)}
                valueStyle={{ color: '#3f8600' }}
                prefix={<ArrowUpOutlined />}
                className={styles.statItem}
              />
              <Divider />
              <Statistic
                title="Прибыль"
                value={formatPrice(fuelStats.profit)}
                valueStyle={{ color: fuelStats.profit >= 0 ? '#3f8600' : '#cf1322' }}
                prefix={fuelStats.profit >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              />
            </Card>
          </Col>
          
          {/* Expenses Statistics */}
          <Col xs={24} lg={12}>
            <Card title="Статистика расходов" className={styles.statsCard}>
              <Statistic
                title="Зарплата"
                value={formatPrice(expenseStats.salary)}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ArrowDownOutlined />}
              />
              <Statistic
                title="Ремонт и другие расходы"
                value={formatPrice(expenseStats.repairs + expenseStats.otherExpenses)}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ArrowDownOutlined />}
                className={styles.statItem}
              />
              <Divider />
              <Statistic
                title="Общие расходы"
                value={formatPrice(expenseStats.totalExpenses)}
                valueStyle={{ color: '#cf1322' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          
          {/* Expense Pie Chart */}
          <Col xs={24} lg={12}>
            <Card title="Структура расходов" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getExpenseChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
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
          
          {/* Finances Bar Chart */}
          <Col xs={24} lg={12}>
            <Card title="Финансовый баланс" className={styles.chartCard}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getFuelChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatPrice(value)} />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8">
                    {getFuelChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard; 
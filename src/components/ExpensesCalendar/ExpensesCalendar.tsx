import React, { useState, useEffect } from 'react';
import { Calendar, Card, Modal, Table, Tag, Typography, Space, Row, Col, Statistic, Select, DatePicker, Button, Divider, Form, InputNumber, message, Input } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { FuelTransaction } from '../../types/electron';
import { getCurrentUser } from '../../utils/users';
import './ExpensesCalendar.css';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизельное топливо' },
  { value: 'gasoline_95', label: 'Бензин АИ-95' }
];

// Список всех типов операций с топливом
const ALL_OPERATION_TYPES = [
  { value: 'purchase', label: 'Закупка', color: 'green' },
  { value: 'sale', label: 'Продажа', color: 'blue' },
  { value: 'base_to_bunker', label: 'На бункер', color: 'orange' },
  { value: 'bunker_to_base', label: 'С бункера', color: 'purple' },
  { value: 'expense', label: 'Общие расходы', color: 'magenta' },
  { value: 'salary', label: 'Зарплата', color: 'volcano' },
  { value: 'repair', label: 'Ремонт', color: 'geekblue' }
];

// Опции для селекта
const OPERATION_TYPE_OPTIONS = ALL_OPERATION_TYPES.map(type => ({
  value: type.value,
  label: type.label
}));

const ExpensesCalendar: React.FC = () => {
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<FuelTransaction[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedOperationTypes, setSelectedOperationTypes] = useState<string[]>([]);
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [form] = Form.useForm();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // Фильтрация транзакций по выбранным критериям
  const filteredTransactions = transactions.filter(t => {
    try {
      if (!t.date) return false;
      
      const transactionDate = new Date(t.date);
      
      const matchesDate = !dateRange || (
        dateRange[0] && dateRange[1] && 
        transactionDate >= dateRange[0].startOf('day').toDate() &&
        transactionDate <= dateRange[1].endOf('day').toDate()
      );
      
      const matchesOperation = selectedOperationTypes.length === 0 || 
        selectedOperationTypes.includes(t.type);
      
      const matchesFuel = selectedFuelTypes.length === 0 || 
        selectedFuelTypes.includes(t.fuelType);
      
      return matchesDate && matchesOperation && matchesFuel;
    } catch (error) {
      console.error('Error filtering transaction:', t, error);
      return false;
    }
  });

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    console.log('Component mounted, loading transactions...');
    loadTransactions();
  }, []);

  // Логирование изменений данных для отладки
  useEffect(() => {
    console.log('Transactions updated:', transactions.length);
  }, [transactions]);

  useEffect(() => {
    console.log('Filtered transactions updated:', filteredTransactions.length);
  }, [filteredTransactions]);

  // Функция загрузки транзакций с сервера
  const loadTransactions = async () => {
    try {
      console.log('Trying to fetch from server API...');
      try {
        // Получаем данные с сервера
        const response = await fetch('http://89.169.170.164:5000/api/fuel', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP error! status: ${response.status}, details:`, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const apiResponse = await response.json();
        
        if (apiResponse.success && Array.isArray(apiResponse.data)) {
          console.log('Received transactions from server API:', apiResponse.data.length);
          
          // Форматируем данные
          const formattedData = apiResponse.data.map((t: Record<string, any>) => ({
            ...t,
            id: t.id,
            key: String(t.id || Math.random()),
            date: t.date ? new Date(t.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          }));
          
          setTransactions(formattedData);
        } else {
          console.error('Invalid API response format:', apiResponse);
          throw new Error('Invalid API response format');
        }
      } catch (apiError) {
        console.error('Error fetching from server API:', apiError);
        useMockData();
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      useMockData();
    }
  };

  // Генерация тестовых данных
  const useMockData = () => {
    console.log('Generating mock transaction data...');
    
    const mockData: FuelTransaction[] = Array.from({ length: 30 }, (_, i) => {
      const operationType = ALL_OPERATION_TYPES[Math.floor(Math.random() * ALL_OPERATION_TYPES.length)].value as FuelTransaction['type'];
      const fuelType = FUEL_TYPES[Math.floor(Math.random() * FUEL_TYPES.length)].value;
      const volume = Math.floor(Math.random() * 1000) + 100;
      const price = Math.floor(Math.random() * 20) + 40;
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      return {
        key: String(i + 1),
        type: operationType,
        volume,
        price,
        totalCost: volume * price,
        date: date.toISOString().split('T')[0],
        timestamp: date.getTime(),
        fuelType
      } as FuelTransaction;
    });
    
    console.log('Generated mock data:', mockData.length);
    setTransactions(mockData);
  };

  // Расчет статистики
  const calculateStatistics = () => {
    const purchaseVolume = filteredTransactions
      .filter(t => t.type === 'purchase' && typeof t.volume === 'number' && !isNaN(t.volume))
      .reduce((sum, t) => sum + t.volume, 0);

    const purchaseCost = filteredTransactions
      .filter(t => t.type === 'purchase')
      .reduce((sum, t) => sum + (t.totalCost || 0), 0);

    const saleVolume = filteredTransactions
      .filter(t => t.type === 'sale' && typeof t.volume === 'number' && !isNaN(t.volume))
      .reduce((sum, t) => sum + t.volume, 0);

    const saleCost = filteredTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + (t.totalCost || 0), 0);

    const totalVolume = filteredTransactions
      .filter(t => typeof t.volume === 'number' && !isNaN(t.volume))
      .reduce((sum, t) => sum + t.volume, 0);

    const totalCost = filteredTransactions
      .reduce((sum, t) => sum + (t.totalCost != null ? t.totalCost : (t.price != null ? t.price : 0)), 0);

    // Расчёт прибыли и замороженных средств
    const avgPurchasePrice = purchaseVolume > 0 ? purchaseCost / purchaseVolume : 0;
    const soldCost = saleVolume * avgPurchasePrice;
    const profit = saleCost - soldCost;
    const frozenVolume = purchaseVolume - saleVolume;
    const frozenCost = frozenVolume * avgPurchasePrice;

    return {
      totalVolume,
      totalCost,
      purchaseVolume,
      purchaseCost,
      saleVolume,
      saleCost,
      profit,
      frozenCost
    };
  };

  // Подготовка данных для графиков
  const getChartData = () => {
    const dailyData = filteredTransactions.reduce((acc, t) => {
      const date = t.date;
      if (!acc[date]) {
        acc[date] = { date, volume: 0, cost: 0 };
      }
      acc[date].volume += t.volume || 0;
      acc[date].cost += t.totalCost || 0;
      return acc;
    }, {} as Record<string, { date: string; volume: number; cost: number }>);

    return Object.values(dailyData).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  // Данные для круговой диаграммы
  const getPieData = () => {
    return ALL_OPERATION_TYPES.map(type => ({
      name: type.label,
      value: filteredTransactions
        .filter(t => t.type === type.value)
        .reduce((sum, t) => sum + (t.volume || 0), 0),
      color: type.color
    })).filter(item => item.value > 0);
  };

  const statistics = calculateStatistics();
  const chartData = getChartData();
  const pieData = getPieData();

  // Обработчики для календаря
  const onPanelChange = (value: Dayjs, mode: string) => {
    console.log(value.format('YYYY-MM-DD'), mode);
  };

  const onSelect = (date: Dayjs) => {
    try {
      const localDate = date.startOf('day');
      const dateStr = localDate.format('YYYY-MM-DD');
      console.log('Selected date (local):', dateStr);
      
      const dayTransactions = transactions.filter(t => t.date === dateStr);
      
      console.log('Found transactions for date:', dayTransactions.length);
      setSelectedDate(localDate);
      setSelectedTransactions(dayTransactions);
      setIsModalVisible(true);
    } catch (error) {
      console.error('Error in onSelect:', error);
      message.error('Произошла ошибка при открытии модального окна');
    }
  };

  // Рендер ячеек календаря
  const dateCellRender = (date: Dayjs) => {
    try {
      const localDate = date.startOf('day');
      const dateStr = localDate.format('YYYY-MM-DD');
      
      const dayTransactions = transactions.filter(t => t.date === dateStr);
      
      if (dayTransactions.length === 0) {
        return null;
      }
      
      // Group by type
      const groups = dayTransactions.reduce((acc, t) => {
        if (!acc[t.type]) {
          acc[t.type] = [];
        }
        acc[t.type].push(t);
        return acc;
      }, {} as Record<string, FuelTransaction[]>);
      
      return (
        <ul className="transaction-list">
          {Object.entries(groups).map(([type, transactions]) => {
            const operationType = ALL_OPERATION_TYPES.find(t => t.value === type);
            const totalCost = transactions.reduce((sum, t) => sum + (t.totalCost || t.price || 0), 0);
            
            return (
              <li key={type}>
                <Tag color={operationType?.color || 'default'}>
                  {transactions.length} x {operationType?.label || type}: {totalCost.toFixed(0)} ₽
                </Tag>
              </li>
            );
          })}
        </ul>
      );
    } catch (error) {
      console.error('Error in dateCellRender:', error);
      return null;
    }
  };

  // Обработчик добавления новой операции
  const handleAddOperation = async (values: any) => {
    try {
      const { type, fuelType, volume, price, notes } = values;
      
      const date = selectedDate?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0];
      const timestamp = new Date(date).getTime();
      
      let totalCost;
      if (["expense", "salary", "repair"].includes(type)) {
        totalCost = price;
      } else {
        totalCost = volume * price;
      }
      
      // Убираем поля, которые не должны отправляться на сервер
      const newTransaction = {
        type: type,
        fuelType: fuelType || '',
        volume: Number(volume) || 0,
        price: Number(price) || 0,
        totalCost: Number(totalCost),
        date: date,
        notes: notes || '',
      };
      
      console.log('Creating new transaction:', newTransaction);
      
      try {
        const response = await fetch('http://89.169.170.164:5000/api/fuel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(newTransaction)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`HTTP error! status: ${response.status}, details:`, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Transaction created:', result);
        
        // Refresh transactions
        await loadTransactions();
        
        message.success('Операция успешно добавлена');
        setIsAddModalVisible(false);
        form.resetFields();
      } catch (error) {
        console.error('Error creating transaction:', error);
        message.error('Ошибка при добавлении операции');
      }
    } catch (error) {
      console.error('Error in handleAddOperation:', error);
      message.error('Произошла ошибка при добавлении операции');
    }
  };

  // Обработчик удаления операции
  const handleDeleteOperation = async (operationKey: string) => {
    try {
      const transaction = transactions.find(t => t.key === operationKey);
      if (!transaction) {
        message.error('Операция не найдена');
        return;
      }
      
      console.log('Deleting transaction:', transaction);
      
      try {
        const response = await fetch(`http://89.169.170.164:5000/api/fuel/${transaction.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Transaction deleted:', result);
        
        // Refresh transactions
        await loadTransactions();
        
        message.success('Операция успешно удалена');
        
        // Update selected transactions if modal is open
        if (isModalVisible && selectedDate) {
          const dateStr = selectedDate.format('YYYY-MM-DD');
          const updatedDayTransactions = transactions.filter(t => t.date === dateStr && t.key !== operationKey);
          setSelectedTransactions(updatedDayTransactions);
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
        message.error('Ошибка при удалении операции');
      }
    } catch (error) {
      console.error('Error in handleDeleteOperation:', error);
      message.error('Произошла ошибка при удалении операции');
    }
  };

  // Колонки для таблицы транзакций
  const columns: ColumnsType<FuelTransaction> = [
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        const operationType = ALL_OPERATION_TYPES.find(t => t.value === type);
        return (
          <Tag color={operationType?.color || 'default'}>
            {operationType?.label || type}
          </Tag>
        );
      }
    },
    {
      title: 'Топливо',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (fuelType) => {
        const fuelTypeObj = FUEL_TYPES.find(t => t.value === fuelType);
        return fuelTypeObj?.label || fuelType;
      }
    },
    {
      title: 'Объем (л)',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume) => volume ? volume.toFixed(2) : '-'
    },
    {
      title: 'Цена (₽/л)',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => {
        if (["expense", "salary", "repair"].includes(record.type)) {
          return '—';
        }
        return price ? price.toFixed(2) : '-';
      }
    },
    {
      title: 'Сумма (₽)',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (totalCost, record) => {
        if (["expense", "salary", "repair"].includes(record.type)) {
          return record.price ? record.price.toFixed(2) : '-';
        }
        return totalCost ? totalCost.toFixed(2) : '-';
      }
    },
    {
      title: 'Заметки',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true
    },
    {
      title: 'Действия',
      key: 'action',
      width: 70,
      render: (_, record) => (
        isAdmin && (
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteOperation(record.key)}
            title="Удалить операцию"
          />
        )
      )
    }
  ];

  return (
    <Card title="Календарь операций" className="calendar-card">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Space size={16} style={{ marginBottom: 16 }}>
            <RangePicker
              onChange={(dates) => {
                if (dates) {
                  setDateRange([dates[0], dates[1]]);
                } else {
                  setDateRange(null);
                }
              }}
              style={{ width: 300 }}
            />
            <Select<string[]>
              mode="multiple"
              placeholder="Типы операций"
              onChange={values => setSelectedOperationTypes(values)}
              style={{ width: 300 }}
              options={OPERATION_TYPE_OPTIONS}
            />
            <Select<string[]>
              mode="multiple"
              placeholder="Типы топлива"
              onChange={values => setSelectedFuelTypes(values)}
              style={{ width: 300 }}
              options={FUEL_TYPES}
            />
          </Space>
        </Col>

        <Col span={24} lg={16}>
          <div className="calendar-container">
            <Calendar
              dateCellRender={dateCellRender}
              onSelect={onSelect}
              onPanelChange={onPanelChange}
            />
          </div>
        </Col>

        <Col span={24} lg={8}>
          <Card title="Статистика" className="stats-card">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic title="Общий объем" value={statistics.totalVolume} suffix="л" precision={2} />
              </Col>
              <Col span={12}>
                <Statistic title="Общая сумма" value={statistics.totalCost} suffix="₽" precision={2} />
              </Col>
              <Col span={12}>
                <Statistic title="Закуплено" value={statistics.purchaseVolume} suffix="л" precision={2} />
              </Col>
              <Col span={12}>
                <Statistic title="Сумма закупок" value={statistics.purchaseCost} suffix="₽" precision={2} />
              </Col>
              <Col span={12}>
                <Statistic title="Продано" value={statistics.saleVolume} suffix="л" precision={2} />
              </Col>
              <Col span={12}>
                <Statistic title="Сумма продаж" value={statistics.saleCost} suffix="₽" precision={2} />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Прибыль"
                  value={statistics.profit}
                  suffix="₽"
                  precision={2}
                  valueStyle={{ color: statistics.profit >= 0 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Заморожено средств"
                  value={statistics.frozenCost}
                  suffix="₽"
                  precision={2}
                />
              </Col>
            </Row>
          </Card>

          <Divider />

          <Card title="Объем по операциям" className="pie-chart-card">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${Number(value).toFixed(2)} л`} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="График объемов и стоимости">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="volume" name="Объем (л)" fill="#8884d8" />
                <Bar yAxisId="right" dataKey="cost" name="Стоимость (₽)" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Modal
        title={selectedDate ? `Операции за ${selectedDate.format('DD.MM.YYYY')}` : 'Операции'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          isAdmin && (
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setIsAddModalVisible(true);
                form.setFieldsValue({ date: selectedDate });
              }}
            >
              Добавить операцию
            </Button>
          ),
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={800}
      >
        {selectedTransactions.length > 0 ? (
          <>
            <Table
              columns={columns}
              dataSource={selectedTransactions}
              rowKey="key"
              pagination={false}
              size="small"
            />
            <div style={{ marginTop: 16 }}>
              <Space>
                <Text strong>Итого за день:</Text>
                <Text>Объем: {selectedTransactions.filter(t => typeof t.volume === 'number' && !isNaN(t.volume)).reduce((sum, t) => sum + t.volume, 0).toFixed(2)} л</Text>
                <Text>Стоимость: {selectedTransactions.reduce((sum, t) => sum + (t.totalCost != null ? t.totalCost : (t.price != null ? t.price : 0)), 0).toFixed(2)} ₽</Text>
              </Space>
            </div>
          </>
        ) : (
          <Text>Нет операций за выбранную дату</Text>
        )}
      </Modal>

      <Modal
        title="Добавить операцию"
        open={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddOperation}
        >
          <Form.Item
            name="type"
            label="Тип операции"
            rules={[{ required: true, message: 'Выберите тип операции' }]}
          >
            <Select onChange={() => form.resetFields(["fuelType", "volume", "price", "notes"]) }>
              {ALL_OPERATION_TYPES.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  {type.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item shouldUpdate={(prev, curr) => prev.type !== curr.type} noStyle>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              if (["expense", "salary", "repair"].includes(type)) {
                return (
                  <>
                    <Form.Item
                      name="price"
                      label="Сумма (₽)"
                      rules={[{ required: true, message: 'Введите сумму' }]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      name="notes"
                      label="Описание"
                      rules={[{ required: true, message: 'Введите описание' }]}
                    >
                      <Input.TextArea rows={2} />
                    </Form.Item>
                  </>
                );
              }
              // Для топлива — старые поля
              return (
                <>
                  <Form.Item
                    name="fuelType"
                    label="Тип топлива"
                    rules={[{ required: true, message: 'Выберите тип топлива' }]}
                  >
                    <Select>
                      {FUEL_TYPES.map(type => (
                        <Select.Option key={type.value} value={type.value}>
                          {type.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item
                    name="volume"
                    label="Объем (л)"
                    rules={[{ required: true, message: 'Введите объем' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    name="price"
                    label="Цена (₽/л)"
                    rules={[{ required: true, message: 'Введите цену' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item
                    name="notes"
                    label="Описание"
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </>
              );
            }}
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Добавить
              </Button>
              <Button onClick={() => setIsAddModalVisible(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ExpensesCalendar;
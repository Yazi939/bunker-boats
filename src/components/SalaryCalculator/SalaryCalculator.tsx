import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Form, Input, Button, Select, Space, DatePicker, 
  Divider, Statistic, Row, Col, notification, Modal, Typography 
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, CalculatorOutlined, 
  SaveOutlined, CheckCircleOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// Интерфейс для капитанов
interface Captain {
  id: string;
  name: string;
  experience: number; // лет опыта
  baseRate: number; // рублей в час
  fuelBonus: number; // процент от экономии топлива
}

// Интерфейс для записи о рабочей смене
interface Shift {
  id: string;
  captainId: string;
  date: string;
  timestamp: number;
  hoursWorked: number;
  fuelSaved: number; // литров сэкономленного топлива
  fuelPrice: number; // стоимость литра топлива
  notes?: string;
}

// Интерфейс для расчета зарплаты
interface SalaryRecord {
  id: string;
  captainId: string;
  captainName: string;
  period: string;
  startDate: string;
  endDate: string;
  baseAmount: number;
  bonusAmount: number;
  totalAmount: number;
  isPaid: boolean;
  paymentDate?: string;
}

// Список капитанов (в реальном приложении это можно загрузить из API)
const CAPTAINS: Captain[] = [
  { id: 'c1', name: 'Иванов И.И.', experience: 5, baseRate: 300, fuelBonus: 10 },
  { id: 'c2', name: 'Петров П.П.', experience: 3, baseRate: 250, fuelBonus: 8 },
  { id: 'c3', name: 'Сидоров С.С.', experience: 7, baseRate: 350, fuelBonus: 12 },
  { id: 'c4', name: 'Кузнецов К.К.', experience: 2, baseRate: 220, fuelBonus: 5 },
];

const SalaryCalculator: React.FC = () => {
  const [form] = Form.useForm();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [selectedCaptain, setSelectedCaptain] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Загрузка данных из localStorage при первой загрузке
  useEffect(() => {
    const savedShifts = localStorage.getItem('captainShifts');
    const savedSalaries = localStorage.getItem('captainSalaries');
    
    if (savedShifts) {
      setShifts(JSON.parse(savedShifts));
    }
    
    if (savedSalaries) {
      setSalaries(JSON.parse(savedSalaries));
    }
  }, []);

  // Сохранение данных в localStorage при изменении
  useEffect(() => {
    localStorage.setItem('captainShifts', JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem('captainSalaries', JSON.stringify(salaries));
  }, [salaries]);

  // Фильтрация смен
  const filteredShifts = shifts.filter(shift => {
    let matchesDate = true;
    let matchesCaptain = true;
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      const shiftDate = shift.timestamp;
      const startDate = dateRange[0].startOf('day').valueOf();
      const endDate = dateRange[1].endOf('day').valueOf();
      matchesDate = shiftDate >= startDate && shiftDate <= endDate;
    }
    
    if (selectedCaptain) {
      matchesCaptain = shift.captainId === selectedCaptain;
    }
    
    return matchesDate && matchesCaptain;
  });

  // Обработчики фильтрации
  const handleDateRangeChange = (dates: any) => {
    setDateRange(dates);
  };

  const handleCaptainChange = (value: string | null) => {
    setSelectedCaptain(value);
  };

  const handleResetFilters = () => {
    setDateRange(null);
    setSelectedCaptain(null);
  };

  // Открытие модального окна для добавления/редактирования смены
  const showModal = (shift?: Shift) => {
    if (shift) {
      setEditingShift(shift);
      form.setFieldsValue({
        captainId: shift.captainId,
        date: dayjs(shift.date),
        hoursWorked: shift.hoursWorked,
        fuelSaved: shift.fuelSaved,
        fuelPrice: shift.fuelPrice,
        notes: shift.notes
      });
    } else {
      setEditingShift(null);
      form.resetFields();
      // Установка текущей даты по умолчанию
      form.setFieldsValue({
        date: dayjs(),
        fuelPrice: 50 // средняя цена по умолчанию
      });
    }
    setIsModalVisible(true);
  };

  // Обработка сохранения смены
  const handleSaveShift = () => {
    form.validateFields().then(values => {
      const formattedDate = values.date.format('YYYY-MM-DD');
      
      if (editingShift) {
        // Обновление существующей смены
        const updatedShifts = shifts.map(shift => 
          shift.id === editingShift.id ? {
            ...shift,
            captainId: values.captainId,
            date: formattedDate,
            timestamp: values.date.valueOf(),
            hoursWorked: parseFloat(values.hoursWorked),
            fuelSaved: parseFloat(values.fuelSaved),
            fuelPrice: parseFloat(values.fuelPrice),
            notes: values.notes
          } : shift
        );
        setShifts(updatedShifts);
      } else {
        // Добавление новой смены
        const newShift: Shift = {
          id: `shift-${Date.now()}`,
          captainId: values.captainId,
          date: formattedDate,
          timestamp: values.date.valueOf(),
          hoursWorked: parseFloat(values.hoursWorked),
          fuelSaved: parseFloat(values.fuelSaved),
          fuelPrice: parseFloat(values.fuelPrice),
          notes: values.notes
        };
        setShifts([...shifts, newShift]);
      }

      setIsModalVisible(false);
      form.resetFields();
      notification.success({
        message: editingShift ? 'Смена обновлена' : 'Смена добавлена',
        description: `Данные ${editingShift ? 'обновлены' : 'добавлены'} успешно`
      });
    });
  };

  // Удаление смены
  const handleDeleteShift = (id: string) => {
    setShifts(shifts.filter(shift => shift.id !== id));
    notification.info({
      message: 'Смена удалена',
      description: 'Запись о смене удалена из системы'
    });
  };

  // Расчет зарплаты для выбранного капитана за период
  const calculateSalary = () => {
    if (!dateRange || !dateRange[0] || !dateRange[1] || !selectedCaptain) {
      notification.warning({
        message: 'Недостаточно данных',
        description: 'Выберите капитана и период для расчета зарплаты'
      });
      return;
    }
    
    setIsCalculating(true);
    
    try {
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      const startTimestamp = dateRange[0].startOf('day').valueOf();
      const endTimestamp = dateRange[1].endOf('day').valueOf();
      
      // Отбор смен для выбранного капитана и периода
      const captainShifts = shifts.filter(shift => 
        shift.captainId === selectedCaptain && 
        shift.timestamp >= startTimestamp && 
        shift.timestamp <= endTimestamp
      );
      
      if (captainShifts.length === 0) {
        notification.warning({
          message: 'Нет данных',
          description: 'Для выбранного капитана и периода нет записей о сменах'
        });
        setIsCalculating(false);
        return;
      }
      
      const captain = CAPTAINS.find(c => c.id === selectedCaptain);
      
      if (!captain) {
        notification.error({
          message: 'Ошибка',
          description: 'Капитан не найден'
        });
        setIsCalculating(false);
        return;
      }
      
      // Расчет базовой суммы (часы * ставка)
      const totalHours = captainShifts.reduce((sum, shift) => sum + shift.hoursWorked, 0);
      const baseAmount = totalHours * captain.baseRate;
      
      // Расчет бонуса за экономию топлива
      let bonusAmount = 0;
      captainShifts.forEach(shift => {
        const fuelSavingValue = shift.fuelSaved * shift.fuelPrice; // стоимость сэкономленного топлива
        const bonus = fuelSavingValue * (captain.fuelBonus / 100); // процент от экономии
        bonusAmount += bonus;
      });
      
      // Общая сумма зарплаты
      const totalAmount = baseAmount + bonusAmount;
      
      // Создание записи о зарплате
      const newSalaryRecord: SalaryRecord = {
        id: `salary-${Date.now()}`,
        captainId: captain.id,
        captainName: captain.name,
        period: `${startDate} - ${endDate}`,
        startDate,
        endDate,
        baseAmount,
        bonusAmount,
        totalAmount,
        isPaid: false
      };
      
      setSalaries([...salaries, newSalaryRecord]);
      
      notification.success({
        message: 'Зарплата рассчитана',
        description: `Общая сумма: ${totalAmount.toFixed(2)} ₽`
      });
    } catch (error) {
      notification.error({
        message: 'Ошибка расчета',
        description: 'Произошла ошибка при расчете зарплаты'
      });
      console.error('Error calculating salary:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  // Отметка зарплаты как выплаченной
  const markAsPaid = (id: string) => {
    const updatedSalaries = salaries.map(salary => 
      salary.id === id ? {
        ...salary,
        isPaid: true,
        paymentDate: new Date().toISOString().split('T')[0]
      } : salary
    );
    
    setSalaries(updatedSalaries);
    
    notification.success({
      message: 'Зарплата выплачена',
      description: 'Запись о выплате обновлена'
    });
  };

  // Получение статистики по расходам
  const getTotalSalaryExpenses = () => {
    const paid = salaries
      .filter(s => s.isPaid)
      .reduce((sum, s) => sum + s.totalAmount, 0);
    
    const pending = salaries
      .filter(s => !s.isPaid)
      .reduce((sum, s) => sum + s.totalAmount, 0);
    
    return { paid, pending, total: paid + pending };
  };

  const { paid, pending, total } = getTotalSalaryExpenses();

  // Колонки для таблицы смен
  const shiftColumns: ColumnsType<Shift> = [
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => a.timestamp - b.timestamp,
    },
    {
      title: 'Капитан',
      key: 'captainId',
      render: (_, record) => {
        const captain = CAPTAINS.find(c => c.id === record.captainId);
        return captain ? captain.name : 'Неизвестный капитан';
      },
      filters: CAPTAINS.map(c => ({ text: c.name, value: c.id })),
      onFilter: (value, record) => record.captainId === value,
    },
    {
      title: 'Часы работы',
      dataIndex: 'hoursWorked',
      key: 'hoursWorked',
      render: (hours) => `${hours} ч`,
      sorter: (a, b) => a.hoursWorked - b.hoursWorked,
    },
    {
      title: 'Экономия топлива',
      dataIndex: 'fuelSaved',
      key: 'fuelSaved',
      render: (fuel) => `${fuel} л`,
      sorter: (a, b) => a.fuelSaved - b.fuelSaved,
    },
    {
      title: 'Цена топлива',
      dataIndex: 'fuelPrice',
      key: 'fuelPrice',
      render: (price) => `${price} ₽/л`,
    },
    {
      title: 'Стоимость экономии',
      key: 'savingValue',
      render: (_, record) => `${(record.fuelSaved * record.fuelPrice).toFixed(2)} ₽`,
      sorter: (a, b) => (a.fuelSaved * a.fuelPrice) - (b.fuelSaved * b.fuelPrice),
    },
    {
      title: 'Примечания',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<DeleteOutlined />} 
            onClick={() => handleDeleteShift(record.id)}
            danger
          />
          <Button 
            type="text" 
            icon={<CalculatorOutlined />} 
            onClick={() => showModal(record)}
          />
        </Space>
      ),
    },
  ];

  // Колонки для таблицы зарплат
  const salaryColumns: ColumnsType<SalaryRecord> = [
    {
      title: 'Капитан',
      dataIndex: 'captainName',
      key: 'captainName',
    },
    {
      title: 'Период',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: 'Базовая оплата',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      render: (amount) => `${amount.toFixed(2)} ₽`,
      sorter: (a, b) => a.baseAmount - b.baseAmount,
    },
    {
      title: 'Бонус за экономию',
      dataIndex: 'bonusAmount',
      key: 'bonusAmount',
      render: (amount) => `${amount.toFixed(2)} ₽`,
      sorter: (a, b) => a.bonusAmount - b.bonusAmount,
    },
    {
      title: 'Итого',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => `${amount.toFixed(2)} ₽`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, record) => (
        <span style={{ 
          color: record.isPaid ? '#52c41a' : '#faad14',
          fontWeight: 'bold'
        }}>
          {record.isPaid ? 'Выплачено' : 'Ожидает выплаты'}
        </span>
      ),
      filters: [
        { text: 'Выплачено', value: true },
        { text: 'Ожидает выплаты', value: false },
      ],
      onFilter: (value, record) => record.isPaid === value,
    },
    {
      title: 'Дата выплаты',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      render: (date) => date || '-',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<CheckCircleOutlined />}
          onClick={() => markAsPaid(record.id)}
          disabled={record.isPaid}
        >
          Отметить как выплаченную
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Title level={2}>Расчет зарплаты капитанов</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => showModal()}
          >
            Добавить смену
          </Button>
        </Space>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Общие расходы на зарплату"
              value={total}
              precision={2}
              suffix="₽"
              valueStyle={{ color: '#1890ff' }}
            />
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              Всего капитанов: {CAPTAINS.length}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Выплачено"
              value={paid}
              precision={2}
              suffix="₽"
              valueStyle={{ color: '#52c41a' }}
            />
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              Количество выплат: {salaries.filter(s => s.isPaid).length}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Ожидает выплаты"
              value={pending}
              precision={2}
              suffix="₽"
              valueStyle={{ color: pending > 0 ? '#faad14' : '#52c41a' }}
            />
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              Ожидающих выплат: {salaries.filter(s => !s.isPaid).length}
            </div>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <Space>
            <RangePicker 
              value={dateRange} 
              onChange={handleDateRangeChange}
              placeholder={['Начало', 'Конец']} 
            />
            <Select
              allowClear
              placeholder="Выберите капитана"
              style={{ width: 200 }}
              onChange={handleCaptainChange}
              value={selectedCaptain}
            >
              {CAPTAINS.map(captain => (
                <Option key={captain.id} value={captain.id}>{captain.name}</Option>
              ))}
            </Select>
            <Button onClick={handleResetFilters}>Сбросить фильтры</Button>
            <Button 
              type="primary" 
              onClick={calculateSalary}
              disabled={!dateRange || !selectedCaptain || isCalculating}
              loading={isCalculating}
              icon={<CalculatorOutlined />}
            >
              Рассчитать зарплату
            </Button>
          </Space>
        </div>

        <Table 
          dataSource={filteredShifts} 
          columns={shiftColumns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Divider>
        <Title level={4}>История расчетов зарплаты</Title>
      </Divider>

      <Table 
        dataSource={salaries} 
        columns={salaryColumns} 
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingShift ? "Редактировать смену" : "Добавить новую смену"}
        open={isModalVisible}
        onOk={handleSaveShift}
        onCancel={() => setIsModalVisible(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="captainId"
            label="Капитан"
            rules={[{ required: true, message: 'Выберите капитана' }]}
          >
            <Select placeholder="Выберите капитана">
              {CAPTAINS.map(captain => (
                <Option key={captain.id} value={captain.id}>{captain.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="date"
            label="Дата"
            rules={[{ required: true, message: 'Укажите дату' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="hoursWorked"
            label="Часы работы"
            rules={[{ required: true, message: 'Укажите количество часов' }]}
          >
            <Input type="number" min="0" step="0.5" placeholder="Введите количество часов" />
          </Form.Item>
          
          <Form.Item
            name="fuelSaved"
            label="Экономия топлива (л)"
            rules={[{ required: true, message: 'Укажите объем сэкономленного топлива' }]}
          >
            <Input type="number" min="0" step="0.1" placeholder="Введите объем экономии" />
          </Form.Item>
          
          <Form.Item
            name="fuelPrice"
            label="Цена топлива (₽/л)"
            rules={[{ required: true, message: 'Укажите цену топлива' }]}
          >
            <Input type="number" min="0" step="0.1" placeholder="Введите цену топлива" />
          </Form.Item>
          
          <Form.Item
            name="notes"
            label="Примечания"
          >
            <Input.TextArea rows={4} placeholder="Дополнительная информация" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SalaryCalculator; 
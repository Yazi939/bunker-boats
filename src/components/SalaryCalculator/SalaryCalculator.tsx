import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, DatePicker, Select, Table, Space, 
  Typography, Row, Col, message, Statistic, Tag, Radio
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SaveOutlined, DeleteOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getCurrentUser, checkPermission } from '../../utils/users';
import styles from './SalaryCalculator.module.css';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const IconProps = {
  onPointerEnterCapture: () => {},
  onPointerLeaveCapture: () => {}
};

interface Salary {
  id: string;
  employeeName: string;
  date: string;
  timestamp: number;
  shiftType: 'day' | 'night';
  hoursWorked: number;
  bonus: number;
  baseSalary: number;
  totalSalary: number;
  notes?: string;
}

const SalaryCalculator: React.FC = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [form] = Form.useForm();
  const currentUser = getCurrentUser();
  const canManageSalaries = checkPermission('canManageSalaries');
  
  // Базовые ставки оплаты
  const DAY_SHIFT_RATE = 5500; // Дневная смена, рублей
  const NIGHT_SHIFT_RATE = 6500; // Ночная смена, рублей
  const HOUR_RATE = 500; // Почасовая ставка
  
  // Load salaries from localStorage
  useEffect(() => {
    const savedSalaries = localStorage.getItem('salaries');
    if (savedSalaries) {
      setSalaries(JSON.parse(savedSalaries));
    }
  }, []);
  
  // Save salaries to localStorage when they change
  useEffect(() => {
    localStorage.setItem('salaries', JSON.stringify(salaries));
  }, [salaries]);
  
  const handleSubmit = (values: any) => {
    const { employeeName, date, shiftType, hoursWorked, notes } = values;
    const hoursWorkedNum = parseFloat(hoursWorked) || 0;
    const timestamp = date.valueOf();
    
    // Base salary based on shift type
    const baseSalary = shiftType === 'day' ? DAY_SHIFT_RATE : NIGHT_SHIFT_RATE;
    
    // Bonus for extra hours
    const standardHours = 8;
    const extraHours = Math.max(0, hoursWorkedNum - standardHours);
    const bonus = extraHours * HOUR_RATE;
    
    // Total salary = base + bonus
    const totalSalary = baseSalary + bonus;
    
    const newSalary: Salary = {
      id: `salary-${Date.now()}`,
      employeeName,
      date: date.format('YYYY-MM-DD'),
      timestamp,
      shiftType,
      hoursWorked: hoursWorkedNum,
      bonus,
      baseSalary,
      totalSalary,
      notes
    };
    
    setSalaries([...salaries, newSalary]);
    form.resetFields();
    message.success('Зарплата рассчитана и добавлена');
  };
  
  const handleDeleteSalary = (id: string) => {
    setSalaries(salaries.filter(salary => salary.id !== id));
    message.success('Запись зарплаты удалена');
  };
  
  // Filter salaries based on date range
  const filteredSalaries = salaries.filter(salary => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return true;
    
    const salaryDate = salary.timestamp;
    const startDate = dateRange[0].startOf('day').valueOf();
    const endDate = dateRange[1].endOf('day').valueOf();
    
    return salaryDate >= startDate && salaryDate <= endDate;
  });
  
  // Calculate totals
  const totalBaseSalary = filteredSalaries.reduce((sum, salary) => sum + salary.baseSalary, 0);
  const totalBonus = filteredSalaries.reduce((sum, salary) => sum + salary.bonus, 0);
  const totalSalary = filteredSalaries.reduce((sum, salary) => sum + salary.totalSalary, 0);
  const dayShifts = filteredSalaries.filter(salary => salary.shiftType === 'day').length;
  const nightShifts = filteredSalaries.filter(salary => salary.shiftType === 'night').length;
  
  const columns: ColumnsType<Salary> = [
    {
      title: 'Сотрудник',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: Salary, b: Salary) => a.timestamp - b.timestamp,
    },
    {
      title: 'Тип смены',
      dataIndex: 'shiftType',
      key: 'shiftType',
      render: (shiftType: 'day' | 'night') => (
        <Tag color={shiftType === 'day' ? 'blue' : 'purple'}>
          {shiftType === 'day' ? 'Дневная' : 'Ночная'}
        </Tag>
      ),
      filters: [
        { text: 'Дневная', value: 'day' },
        { text: 'Ночная', value: 'night' }
      ],
      onFilter: (value, record) => record.shiftType === value.toString(),
    },
    {
      title: 'Отработано часов',
      dataIndex: 'hoursWorked',
      key: 'hoursWorked',
      render: (val: number) => val.toFixed(1),
    },
    {
      title: 'Базовая ставка (₽)',
      dataIndex: 'baseSalary',
      key: 'baseSalary',
      render: (val: number) => val.toFixed(2),
    },
    {
      title: 'Бонус (₽)',
      dataIndex: 'bonus',
      key: 'bonus',
      render: (val: number) => val.toFixed(2),
    },
    {
      title: 'Итого (₽)',
      dataIndex: 'totalSalary',
      key: 'totalSalary',
      render: (val: number) => val.toFixed(2),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Salary) => (
        <Button 
          icon={<DeleteOutlined {...IconProps} />} 
          danger
          size="small" 
          onClick={() => handleDeleteSalary(record.id)}
          disabled={!checkPermission('canManageSalaries')}
        />
      ),
    },
  ];
  
  // If user doesn't have permission
  if (!canManageSalaries && currentUser?.role !== 'worker') {
    return (
      <Card>
        <Title level={4}>Доступ запрещен</Title>
        <p>У вас нет прав для расчёта заработной платы.</p>
      </Card>
    );
  }
  
  return (
    <div className={styles.salaryCalculator}>
      <Title level={3}>Расчёт заработной платы сотрудников</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Добавить рабочую смену" className={styles.addSalaryCard}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                date: dayjs(),
                shiftType: 'day',
                hoursWorked: 8
              }}
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="employeeName"
                    label="Имя сотрудника"
                    rules={[{ required: true, message: 'Введите имя сотрудника' }]}
                  >
                    <Input placeholder="Ф.И.О." />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="date"
                    label="Дата"
                    rules={[{ required: true, message: 'Укажите дату' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="shiftType"
                    label="Тип смены"
                    rules={[{ required: true, message: 'Выберите тип смены' }]}
                  >
                    <Radio.Group>
                      <Radio.Button value="day">Дневная</Radio.Button>
                      <Radio.Button value="night">Ночная</Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="hoursWorked"
                    label="Отработано часов"
                    rules={[{ required: true, message: 'Укажите количество часов' }]}
                  >
                    <Input type="number" min="0" step="0.5" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="notes" label="Примечания">
                    <Input placeholder="Дополнительная информация" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  icon={<CalculatorOutlined {...IconProps} />}
                >
                  Рассчитать и добавить
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="Общая статистика">
            <Statistic
              title="Суммарная заработная плата"
              value={totalSalary}
              precision={2}
              suffix="₽"
              valueStyle={{ color: '#3f8600' }}
            />
            <Statistic
              title="Базовая зарплата"
              value={totalBaseSalary}
              precision={2}
              suffix="₽"
              style={{ marginTop: 16 }}
            />
            <Statistic
              title="Бонусы"
              value={totalBonus}
              precision={2}
              suffix="₽"
              style={{ marginTop: 16 }}
            />
            <Divider />
            <Space>
              <Statistic title="Дневных смен" value={dayShifts} />
              <Statistic title="Ночных смен" value={nightShifts} />
            </Space>
          </Card>
        </Col>
      </Row>
      
      <Card title="Журнал расчёта зарплат" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
          <Space>
            <Text>Фильтр по периоду:</Text>
            <RangePicker onChange={(dates) => setDateRange(dates)} value={dateRange} />
            <Button 
              onClick={() => setDateRange(null)}
              style={{ marginLeft: 8 }}
            >
              Сбросить
            </Button>
          </Space>
        </Space>
        
        <Table 
          columns={columns} 
          dataSource={filteredSalaries} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
          summary={() => (
            <Table.Summary fixed>
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}><strong>Итого:</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={1}>
                  <strong>{totalBaseSalary.toFixed(2)}₽</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2}>
                  <strong>{totalBonus.toFixed(2)}₽</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3}>
                  <strong>{totalSalary.toFixed(2)}₽</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} />
              </Table.Summary.Row>
            </Table.Summary>
          )}
        />
      </Card>
    </div>
  );
};

export default SalaryCalculator; 
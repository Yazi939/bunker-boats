import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, DatePicker, Select, Table, Space, 
  Typography, Row, Col, message, Statistic, Tag, Radio
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { SaveOutlined, DeleteOutlined, CalculatorOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getCurrentUser, checkPermission } from '../../utils/users';
import styles from './ShiftManagement.module.css';

const { Option } = Select;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const IconProps = {
  onPointerEnterCapture: () => {},
  onPointerLeaveCapture: () => {}
};

interface Shift {
  id: string;
  employeeName: string;
  date: string;
  timestamp: number;
  shiftType: 'day' | 'night';
  fuelSaved: number;
  bonus: number;
  baseSalary: number;
  totalSalary: number;
  notes?: string;
}

const ShiftManagement: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [form] = Form.useForm();
  const currentUser = getCurrentUser();
  const canManageShifts = checkPermission('canManageShifts');
  
  // Базовые ставки оплаты
  const DAY_SHIFT_RATE = 5500; // Дневная смена, рублей
  const NIGHT_SHIFT_RATE = 6500; // Ночная смена, рублей
  const FUEL_SAVING_BONUS_RATE = 0.1; // 10% от стоимости сэкономленного топлива
  
  // Load shifts from localStorage
  useEffect(() => {
    const savedShifts = localStorage.getItem('shifts');
    if (savedShifts) {
      setShifts(JSON.parse(savedShifts));
    }
  }, []);
  
  // Save shifts to localStorage when they change
  useEffect(() => {
    localStorage.setItem('shifts', JSON.stringify(shifts));
  }, [shifts]);
  
  const handleSubmit = (values: any) => {
    const { employeeName, date, shiftType, fuelSaved, notes } = values;
    const fuelSavedNum = parseFloat(fuelSaved) || 0;
    const timestamp = date.valueOf();
    
    // Calculate bonus (10% of saved fuel value)
    const averageFuelPrice = 65; // Average fuel price
    const bonus = fuelSavedNum * averageFuelPrice * FUEL_SAVING_BONUS_RATE;
    
    // Base salary based on shift type
    const baseSalary = shiftType === 'day' ? DAY_SHIFT_RATE : NIGHT_SHIFT_RATE;
    
    // Total salary = base + bonus
    const totalSalary = baseSalary + bonus;
    
    const newShift: Shift = {
      id: `shift-${Date.now()}`,
      employeeName,
      date: date.format('YYYY-MM-DD'),
      timestamp,
      shiftType,
      fuelSaved: fuelSavedNum,
      bonus,
      baseSalary,
      totalSalary,
      notes
    };
    
    setShifts([...shifts, newShift]);
    form.resetFields();
    message.success('Смена добавлена и зарплата рассчитана');
  };
  
  const handleDeleteShift = (id: string) => {
    setShifts(shifts.filter(shift => shift.id !== id));
    message.success('Смена удалена');
  };
  
  // Filter shifts based on date range
  const filteredShifts = shifts.filter(shift => {
    if (!dateRange || !dateRange[0] || !dateRange[1]) return true;
    
    const shiftDate = shift.timestamp;
    const startDate = dateRange[0].startOf('day').valueOf();
    const endDate = dateRange[1].endOf('day').valueOf();
    
    return shiftDate >= startDate && shiftDate <= endDate;
  });
  
  // Calculate totals
  const totalBaseSalary = filteredShifts.reduce((sum, shift) => sum + shift.baseSalary, 0);
  const totalBonus = filteredShifts.reduce((sum, shift) => sum + shift.bonus, 0);
  const totalSalary = filteredShifts.reduce((sum, shift) => sum + shift.totalSalary, 0);
  const dayShifts = filteredShifts.filter(shift => shift.shiftType === 'day').length;
  const nightShifts = filteredShifts.filter(shift => shift.shiftType === 'night').length;
  
  const columns: ColumnsType<Shift> = [
    {
      title: 'Сотрудник',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      sorter: (a: Shift, b: Shift) => a.timestamp - b.timestamp,
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
      title: 'Сэкономлено топлива (л)',
      dataIndex: 'fuelSaved',
      key: 'fuelSaved',
      render: (val: number) => val.toFixed(2),
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
      render: (_: any, record: Shift) => (
        <Button 
          icon={<DeleteOutlined {...IconProps} />} 
          danger
          size="small" 
          onClick={() => handleDeleteShift(record.id)}
          disabled={!checkPermission('canManageShifts')}
        />
      ),
    },
  ];
  
  // If user doesn't have permission
  if (!canManageShifts && currentUser?.role !== 'worker') {
    return (
      <Card>
        <Title level={4}>Доступ запрещен</Title>
        <p>У вас нет прав для расчёта заработной платы.</p>
      </Card>
    );
  }
  
  return (
    <div className={styles.shiftManagement}>
      <Title level={3}>Расчёт заработной платы капитанов</Title>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Добавить рабочую смену" className={styles.addShiftCard}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                date: dayjs(),
                shiftType: 'day',
                fuelSaved: 0
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="employeeName"
                    label="Имя сотрудника"
                    rules={[{ required: true, message: 'Выберите сотрудника' }]}
                  >
                    <Select placeholder="Выберите капитана">
                      <Option value="Юра">Юра</Option>
                      <Option value="Вадим">Вадим</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="date"
                    label="Дата смены"
                    rules={[{ required: true, message: 'Выберите дату' }]}
                  >
                    <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item
                name="shiftType"
                label="Тип смены"
                rules={[{ required: true, message: 'Выберите тип смены' }]}
              >
                <Radio.Group>
                  <Radio.Button value="day">Дневная ({DAY_SHIFT_RATE} ₽)</Radio.Button>
                  <Radio.Button value="night">Ночная ({NIGHT_SHIFT_RATE} ₽)</Radio.Button>
                </Radio.Group>
              </Form.Item>
              
              <Form.Item
                name="fuelSaved"
                label="Сэкономлено топлива (л)"
                rules={[{ required: true, message: 'Введите объем сэкономленного топлива' }]}
              >
                <Input type="number" min="0" step="0.1" />
              </Form.Item>
              
              <Form.Item
                name="notes"
                label="Примечания"
              >
                <Input.TextArea rows={2} />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined {...IconProps} />}>
                  Добавить смену
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <CalculatorOutlined {...IconProps} />
                <span>Расчёт зарплаты</span>
              </Space>
            } 
            className={styles.statsCard}
          >
            <Statistic
              title="Дневные смены"
              value={dayShifts}
              suffix="смен"
              style={{ marginBottom: 16 }}
            />
            <Statistic
              title="Ночные смены"
              value={nightShifts}
              suffix="смен"
              style={{ marginBottom: 16 }}
            />
            <Statistic
              title="Базовая зарплата"
              value={totalBaseSalary}
              suffix="₽"
              precision={2}
              style={{ marginBottom: 16 }}
            />
            <Statistic
              title="Бонусы за экономию"
              value={totalBonus}
              suffix="₽"
              precision={2}
              style={{ marginBottom: 16 }}
            />
            <Statistic
              title="Итого зарплата"
              value={totalSalary}
              suffix="₽"
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Card 
        title="Учёт рабочих смен" 
        style={{ marginTop: 16 }}
        extra={
          <Space>
            <RangePicker 
              value={dateRange}
              onChange={(dates) => setDateRange(dates)}
            />
            <Button 
              type="default"
              onClick={() => setDateRange(null)}
              disabled={!dateRange}
            >
              Сбросить
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={filteredShifts}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default ShiftManagement; 
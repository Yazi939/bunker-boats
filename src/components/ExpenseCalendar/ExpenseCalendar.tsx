import React, { useState } from 'react';
import { 
  Calendar, Badge, Card, Row, Col, Statistic, Button, Modal, Form, 
  Input, Select, DatePicker, InputNumber, Space, Divider, Tag, Empty, 
  Typography, Tooltip, notification, Radio
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, EditOutlined, ExportOutlined, 
  CalendarOutlined, TagOutlined, FileOutlined
} from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import locale from 'antd/es/calendar/locale/ru_RU';
import {
  TransactionType, 
  FinancialTransaction, 
  EXPENSE_CATEGORIES, 
  INCOME_CATEGORIES,
  groupTransactionsByDate,
  getExpenseStatsByCategory,
  getIncomeStatsByCategory,
  getCategoryLabel,
  exportTransactionsToExcel
} from '../../utils/expenseUtils';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip
} from 'recharts';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

// Стили для компонентов
const styles = {
  expenseCalendar: { padding: '24px', backgroundColor: '#fff' },
  expenseEvent: { 
    padding: '4px 8px', 
    borderRadius: '4px', 
    marginBottom: '4px', 
    transition: 'all 0.3s',
    cursor: 'pointer'
  },
  expense: { 
    backgroundColor: '#fff1f0', 
    borderLeft: '3px solid #f5222d' 
  },
  income: { 
    backgroundColor: '#f6ffed', 
    borderLeft: '3px solid #52c41a' 
  },
  eventAmount: { fontWeight: 'bold' },
  negative: { color: '#ff4d4f' },
  positive: { color: '#52c41a' },
  statsCard: {
    marginBottom: '24px',
    textAlign: 'center',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
    transition: 'all 0.3s'
  },
  dateCell: {
    position: 'relative',
    height: '80px',
    padding: '4px 8px'
  },
  dateHasEvents: {
    position: 'relative'
  },
  captionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  categoryTag: {
    margin: '0 4px 4px 0'
  }
};

// Методы оплаты
const PAYMENT_METHODS = [
  { value: 'cash', label: 'Наличные' },
  { value: 'card', label: 'Банковская карта' },
  { value: 'transfer', label: 'Банковский перевод' },
  { value: 'online', label: 'Электронные деньги' },
  { value: 'check', label: 'Чек' },
  { value: 'other', label: 'Другое' }
];

const ExpenseCalendar: React.FC = () => {
  // Демо-данные для транзакций
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([
    {
      id: '1',
      type: TransactionType.EXPENSE,
      amount: 8500,
      date: '2023-10-01',
      timestamp: new Date('2023-10-01').getTime(),
      category: 'fuel',
      description: 'Заправка топливом',
      paymentMethod: 'card',
      recipientOrPayer: 'АЗС Лукойл'
    },
    {
      id: '2',
      type: TransactionType.INCOME,
      amount: 12000,
      date: '2023-10-05',
      timestamp: new Date('2023-10-05').getTime(),
      category: 'sales',
      description: 'Выручка за день',
      paymentMethod: 'cash'
    },
    {
      id: '3',
      type: TransactionType.EXPENSE,
      amount: 15000,
      date: '2023-10-10',
      timestamp: new Date('2023-10-10').getTime(),
      category: 'maintenance',
      description: 'Техническое обслуживание',
      paymentMethod: 'transfer',
      recipientOrPayer: 'Автосервис'
    },
    {
      id: '4',
      type: TransactionType.INCOME,
      amount: 45000,
      date: '2023-10-15',
      timestamp: new Date('2023-10-15').getTime(),
      category: 'services',
      description: 'Оплата за перевозки',
      paymentMethod: 'transfer',
      recipientOrPayer: 'ООО "Транзит"'
    },
    {
      id: '5',
      type: TransactionType.EXPENSE,
      amount: 30000,
      date: '2023-10-20',
      timestamp: new Date('2023-10-20').getTime(),
      category: 'salary',
      description: 'Выплата зарплаты водителям',
      paymentMethod: 'transfer'
    }
  ]);
  
  // Состояния
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [form] = Form.useForm();
  const [selectedTransactionType, setSelectedTransactionType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [detailsModalVisible, setDetailsModalVisible] = useState<boolean>(false);
  const [dateTransactions, setDateTransactions] = useState<FinancialTransaction[]>([]);
  
  // Группировка транзакций по датам для отображения в календаре
  const transactionsByDate = groupTransactionsByDate(transactions);
  
  // Рассчитываем общие суммы
  const totalExpenses = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpenses;
  
  // Данные для диаграмм
  const expenseStats = getExpenseStatsByCategory(transactions);
  const incomeStats = getIncomeStatsByCategory(transactions);
  
  // Обработчик выбора даты в календаре
  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
    const dateKey = date.format('YYYY-MM-DD');
    const dateTransactions = transactionsByDate.get(dateKey) || [];
    setDateTransactions(dateTransactions);
    setDetailsModalVisible(true);
  };
  
  // Открытие модального окна для добавления/редактирования транзакции
  const showTransactionModal = (transaction?: FinancialTransaction) => {
    if (transaction) {
      setEditingTransaction(transaction);
      setSelectedTransactionType(transaction.type);
      form.setFieldsValue({
        type: transaction.type,
        amount: transaction.amount,
        date: dayjs(transaction.date),
        category: transaction.category,
        description: transaction.description,
        paymentMethod: transaction.paymentMethod || undefined,
        recipientOrPayer: transaction.recipientOrPayer || undefined,
        documentRef: transaction.documentRef || undefined,
        tags: transaction.tags || undefined
      });
    } else {
      setEditingTransaction(null);
      setSelectedTransactionType(TransactionType.EXPENSE);
      form.resetFields();
      form.setFieldsValue({
        type: TransactionType.EXPENSE,
        date: selectedDate
      });
    }
    setIsModalVisible(true);
  };
  
  // Обработчик сохранения транзакции
  const handleSaveTransaction = () => {
    form.validateFields().then(values => {
      const { type, amount, date, category, description, paymentMethod, recipientOrPayer, documentRef, tags } = values;
      
      const transaction: FinancialTransaction = {
        id: editingTransaction ? editingTransaction.id : Date.now().toString(),
        type,
        amount,
        date: date.format('YYYY-MM-DD'),
        timestamp: date.valueOf(),
        category,
        description,
        paymentMethod,
        recipientOrPayer,
        documentRef,
        tags
      };
      
      if (editingTransaction) {
        // Обновление существующей транзакции
        setTransactions(prevTransactions => 
          prevTransactions.map(t => t.id === editingTransaction.id ? transaction : t)
        );
        notification.success({
          message: 'Транзакция обновлена',
          description: `${type === TransactionType.EXPENSE ? 'Расход' : 'Доход'} успешно обновлен`
        });
      } else {
        // Добавление новой транзакции
        setTransactions(prevTransactions => [...prevTransactions, transaction]);
        notification.success({
          message: 'Транзакция добавлена',
          description: `${type === TransactionType.EXPENSE ? 'Расход' : 'Доход'} успешно добавлен`
        });
      }
      
      setIsModalVisible(false);
      form.resetFields();
    });
  };
  
  // Обработчик удаления транзакции
  const handleDeleteTransaction = (id: string) => {
    setTransactions(prevTransactions => prevTransactions.filter(t => t.id !== id));
    notification.info({
      message: 'Транзакция удалена',
      description: 'Запись успешно удалена из календаря'
    });
    setDetailsModalVisible(false);
  };
  
  // Функция для отображения данных в ячейках календаря
  const dateCellRender = (date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD');
    const dateTransactions = transactionsByDate.get(dateKey) || [];
    
    if (dateTransactions.length === 0) {
      return null;
    }
    
    // Рассчитываем общую сумму доходов и расходов для даты
    const dayExpenses = dateTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const dayIncome = dateTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const dayBalance = dayIncome - dayExpenses;
    
    return (
      <div style={styles.dateCell}>
        {dayExpenses > 0 && (
          <div style={{...styles.expenseEvent, ...styles.expense}}>
            <span>Расходы: </span>
            <span style={{...styles.eventAmount, ...styles.negative}}>
              -{dayExpenses.toLocaleString()} ₽
            </span>
          </div>
        )}
        {dayIncome > 0 && (
          <div style={{...styles.expenseEvent, ...styles.income}}>
            <span>Доходы: </span>
            <span style={{...styles.eventAmount, ...styles.positive}}>
              +{dayIncome.toLocaleString()} ₽
            </span>
          </div>
        )}
        {(dayExpenses > 0 || dayIncome > 0) && (
          <div>
            <span>Баланс: </span>
            <span style={{...styles.eventAmount, ...(dayBalance >= 0 ? styles.positive : styles.negative)}}>
              {dayBalance >= 0 ? '+' : ''}{dayBalance.toLocaleString()} ₽
            </span>
          </div>
        )}
      </div>
    );
  };
  
  // Функция для добавления бейджа к дате календаря
  const dateFullCellRender = (date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD');
    const dateTransactions = transactionsByDate.get(dateKey) || [];
    
    // Рассчитываем общую сумму доходов и расходов для даты
    const dayExpenses = dateTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const dayIncome = dateTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Определяем цвет бейджа на основе баланса за день
    let badgeStatus: 'success' | 'error' | 'default' = 'default';
    if (dayIncome > dayExpenses) {
      badgeStatus = 'success';
    } else if (dayExpenses > 0) {
      badgeStatus = 'error';
    }
    
    const isWeekend = date.day() === 0 || date.day() === 6;
    const isToday = date.isSame(dayjs(), 'day');
    
    return (
      <div 
        style={{
          ...styles.dateCell,
          ...(dateTransactions.length > 0 ? styles.dateHasEvents : {}),
          backgroundColor: isWeekend ? '#f9f9f9' : '',
          border: isToday ? '1px solid #1890ff' : '',
          borderRadius: isToday ? '4px' : ''
        }}
      >
        <div style={{ padding: '8px', position: 'relative' }}>
          <div style={{ 
            textAlign: 'center', 
            fontWeight: isToday ? 'bold' : 'normal',
            color: isToday ? '#1890ff' : ''
          }}>
            {date.date()}
          </div>
          
          {dateTransactions.length > 0 && (
            <Badge 
              count={dateTransactions.length} 
              status={badgeStatus}
              style={{ position: 'absolute', top: '8px', right: '8px' }}
            />
          )}
          
          {dateCellRender(date)}
        </div>
      </div>
    );
  };
  
  return (
    <div style={styles.expenseCalendar}>
      <Row justify="space-between" align="middle" style={styles.captionRow}>
        <Title level={2}>Календарь доходов и расходов</Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => showTransactionModal()}
          >
            Добавить операцию
          </Button>
          <Button 
            icon={<ExportOutlined />} 
            onClick={() => exportTransactionsToExcel(transactions)}
          >
            Экспорт в Excel
          </Button>
        </Space>
      </Row>
      
      <Row gutter={[24, 24]}>
        <Col span={24} md={8}>
          <Card style={styles.statsCard}>
            <Statistic
              title="Общие расходы"
              value={totalExpenses}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
              suffix="₽"
            />
          </Card>
        </Col>
        <Col span={24} md={8}>
          <Card style={styles.statsCard}>
            <Statistic
              title="Общие доходы"
              value={totalIncome}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
              suffix="₽"
            />
          </Card>
        </Col>
        <Col span={24} md={8}>
          <Card style={styles.statsCard}>
            <Statistic
              title="Баланс"
              value={balance}
              precision={2}
              valueStyle={{ color: balance >= 0 ? '#3f8600' : '#cf1322' }}
              suffix="₽"
            />
          </Card>
        </Col>
      </Row>
      
      <Card style={{ marginTop: '24px' }}>
        <Calendar 
          locale={locale}
          fullscreen={true} 
          dateFullCellRender={dateFullCellRender}
          onSelect={handleDateSelect}
        />
      </Card>
      
      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col span={24} lg={12}>
          <Card title="Структура расходов">
            {expenseStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalAmount"
                    nameKey="category"
                    label={(entry) => `${getCategoryLabel(entry.category)}: ${entry.percentage.toFixed(1)}%`}
                  >
                    {expenseStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend formatter={(value) => getCategoryLabel(value)} />
                  <RechartsTooltip 
                    formatter={(value, name) => [`${value.toLocaleString()} ₽`, getCategoryLabel(name as string)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Нет данных о расходах" />
            )}
          </Card>
        </Col>
        <Col span={24} lg={12}>
          <Card title="Структура доходов">
            {incomeStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={incomeStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="totalAmount"
                    nameKey="category"
                    label={(entry) => `${getCategoryLabel(entry.category)}: ${entry.percentage.toFixed(1)}%`}
                  >
                    {incomeStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend formatter={(value) => getCategoryLabel(value)} />
                  <RechartsTooltip 
                    formatter={(value, name) => [`${value.toLocaleString()} ₽`, getCategoryLabel(name as string)]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="Нет данных о доходах" />
            )}
          </Card>
        </Col>
      </Row>
      
      {/* Модальное окно с деталями за выбранную дату */}
      <Modal
        title={`Операции за ${selectedDate.format('DD.MM.YYYY')}`}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
            setDetailsModalVisible(false);
            showTransactionModal();
          }}>
            Добавить операцию
          </Button>,
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Закрыть
          </Button>
        ]}
        width={700}
      >
        {dateTransactions.length > 0 ? (
          <div>
            {dateTransactions.map(transaction => (
              <Card 
                key={transaction.id}
                style={{ marginBottom: '16px' }}
                type="inner"
                title={
                  <Space>
                    <span>{transaction.type === TransactionType.EXPENSE ? 'Расход' : 'Доход'}</span>
                    <span style={{...styles.eventAmount, ...(transaction.type === TransactionType.EXPENSE ? styles.negative : styles.positive)}}>
                      {transaction.type === TransactionType.EXPENSE ? '-' : '+'}{transaction.amount.toLocaleString()} ₽
                    </span>
                  </Space>
                }
                extra={
                  <Space>
                    <Button 
                      icon={<EditOutlined />} 
                      onClick={() => {
                        setDetailsModalVisible(false);
                        showTransactionModal(transaction);
                      }} 
                    />
                    <Button 
                      icon={<DeleteOutlined />} 
                      danger 
                      onClick={() => handleDeleteTransaction(transaction.id)} 
                    />
                  </Space>
                }
              >
                <Row gutter={[16, 8]}>
                  <Col span={12}>
                    <Text strong>Категория:</Text> {getCategoryLabel(transaction.category)}
                  </Col>
                  <Col span={12}>
                    <Text strong>Метод оплаты:</Text> {transaction.paymentMethod ? 
                      PAYMENT_METHODS.find(m => m.value === transaction.paymentMethod)?.label || transaction.paymentMethod : 'Не указано'}
                  </Col>
                  {transaction.recipientOrPayer && (
                    <Col span={24}>
                      <Text strong>Получатель/Плательщик:</Text> {transaction.recipientOrPayer}
                    </Col>
                  )}
                  <Col span={24}>
                    <Text strong>Описание:</Text> {transaction.description}
                  </Col>
                  {transaction.documentRef && (
                    <Col span={24}>
                      <Text strong>Ссылка на документ:</Text> {transaction.documentRef}
                    </Col>
                  )}
                  {transaction.tags && transaction.tags.length > 0 && (
                    <Col span={24}>
                      <Text strong>Теги:</Text>{' '}
                      {transaction.tags.map(tag => (
                        <Tag key={tag} style={styles.categoryTag} color="blue">{tag}</Tag>
                      ))}
                    </Col>
                  )}
                </Row>
              </Card>
            ))}
          </div>
        ) : (
          <Empty description="Нет операций за выбранную дату" />
        )}
      </Modal>
      
      {/* Модальное окно для добавления/редактирования транзакции */}
      <Modal
        title={editingTransaction ? 'Редактировать операцию' : 'Добавить новую операцию'}
        open={isModalVisible}
        onOk={handleSaveTransaction}
        onCancel={() => setIsModalVisible(false)}
        okText={editingTransaction ? 'Обновить' : 'Добавить'}
        cancelText="Отмена"
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            type: TransactionType.EXPENSE,
            date: selectedDate
          }}
        >
          <Form.Item
            name="type"
            label="Тип операции"
            rules={[{ required: true, message: 'Выберите тип операции' }]}
          >
            <Radio.Group 
              onChange={(e) => setSelectedTransactionType(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value={TransactionType.EXPENSE}>Расход</Radio.Button>
              <Radio.Button value={TransactionType.INCOME}>Доход</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          <Form.Item
            name="amount"
            label="Сумма (₽)"
            rules={[{ required: true, message: 'Введите сумму' }]}
          >
            <InputNumber 
              style={{ width: '100%' }} 
              min={0.01} 
              step={0.01}
              precision={2}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
              placeholder="Введите сумму"
            />
          </Form.Item>
          
          <Form.Item
            name="date"
            label="Дата"
            rules={[{ required: true, message: 'Выберите дату' }]}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>
          
          <Form.Item
            name="category"
            label="Категория"
            rules={[{ required: true, message: 'Выберите категорию' }]}
          >
            <Select placeholder="Выберите категорию">
              {selectedTransactionType === TransactionType.EXPENSE ? (
                EXPENSE_CATEGORIES.map(category => (
                  <Option key={category.value} value={category.value}>{category.label}</Option>
                ))
              ) : (
                INCOME_CATEGORIES.map(category => (
                  <Option key={category.value} value={category.value}>{category.label}</Option>
                ))
              )}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Описание"
            rules={[{ required: true, message: 'Введите описание' }]}
          >
            <TextArea rows={3} placeholder="Введите описание операции" />
          </Form.Item>
          
          <Form.Item
            name="paymentMethod"
            label="Метод оплаты"
          >
            <Select placeholder="Выберите метод оплаты" allowClear>
              {PAYMENT_METHODS.map(method => (
                <Option key={method.value} value={method.value}>{method.label}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="recipientOrPayer"
            label={selectedTransactionType === TransactionType.EXPENSE ? "Получатель" : "Плательщик"}
          >
            <Input 
              placeholder={`Введите ${selectedTransactionType === TransactionType.EXPENSE ? "получателя" : "плательщика"}`} 
              prefix={<FileOutlined />}
            />
          </Form.Item>
          
          <Form.Item
            name="documentRef"
            label="Ссылка на документ"
          >
            <Input placeholder="Введите ссылку на документ или номер" prefix={<FileOutlined />} />
          </Form.Item>
          
          <Form.Item
            name="tags"
            label="Теги"
          >
            <Select 
              mode="tags" 
              placeholder="Добавьте теги" 
              tokenSeparators={[',']} 
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ExpenseCalendar; 
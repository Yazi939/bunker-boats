import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Table, Space, Typography, Row, Col, Divider, Select, DatePicker, Statistic, notification, Radio, Modal, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { FileExcelOutlined, DeleteOutlined, FilterOutlined, UserOutlined, CarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';
import { exportFuelDataToExcel } from '../../utils/excelExport';
import type { FuelTransaction } from '../../types/electron';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Иконки без событий pointer capture
const iconProps: AntdIconProps = {
  style: { color: 'white' }
};

const FUEL_TYPES = [
  { value: 'diesel', label: 'Дизельное топливо' },
  { value: 'gasoline_95', label: 'Бензин АИ-95' }
];

const BUNKER_VESSELS = [
  { value: 'fedorov', label: 'Фёдоров' }
];

// Добавим имя файла для экспорта Excel
const EXCEL_FILE_NAME = 'fuel_report.xlsx';

interface FuelTypeData {
  fuelType: string;
  fuelName: string;
  purchased: number;
  sold: number;
  drained: number;
  baseBalance: number;
  bunkerBalance: number;
  purchaseCost: number;
  saleIncome: number;
  profit: number;
}

const FuelTrading: React.FC = () => {
  const [transactions, setTransactions] = useState<FuelTransaction[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [filterFuelType, setFilterFuelType] = useState<string | null>(null);
  const [filterTransactionType, setFilterTransactionType] = useState<FuelTransaction['type'] | null>(null);
  const [form] = Form.useForm();
  const [lastKey, setLastKey] = useState(0);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FuelTransaction | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string }>({ id: '', role: '' });
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<FuelTransaction | null>(null);
  
  // Разрешённые типы операций для учёта топлива
  const allowedTypes = ['purchase', 'sale', 'base_to_bunker', 'bunker_to_base'];

  // Загрузка данных из electron-store при первой загрузке
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const result = await window.electronAPI.transactions.getAll();
        const fuelTransactions = result.filter(t => allowedTypes.includes(t.type));
        setTransactions(fuelTransactions);
        // Set last key based on the highest existing key
        const maxKey = fuelTransactions.reduce((max, t) => {
          const keyNum = parseInt(t.key.replace('transaction-', ''));
          return Math.max(max, keyNum);
        }, 0);
        setLastKey(maxKey);
      } catch (error) {
        console.error('Failed to load transactions:', error);
        notification.error({
          message: 'Ошибка загрузки',
          description: 'Не удалось загрузить данные транзакций'
        });
      }
    };
    loadTransactions();
  }, []);
  
  // Обновление данных в electron-store при изменении
  useEffect(() => {
    const saveTransactions = async () => {
      try {
        await window.electronAPI.transactions.update(transactions);
      } catch (error) {
        console.error('Failed to save transactions:', error);
        notification.error({
          message: 'Ошибка сохранения',
          description: 'Не удалось сохранить изменения'
        });
      }
    };
    if (transactions.length > 0) {
      saveTransactions();
    }
  }, [transactions]);
  
  // Фильтрация транзакций
  const filteredTransactions = transactions.filter(transaction => {
    let matchesDateRange = true;
    let matchesFuelType = true;
    let matchesTransactionType = true;
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      const transactionDate = new Date(transaction.timestamp).getTime();
      const startDate = dateRange[0].startOf('day').valueOf();
      const endDate = dateRange[1].endOf('day').valueOf();
      matchesDateRange = transactionDate >= startDate && transactionDate <= endDate;
    }
    
    if (filterFuelType) {
      matchesFuelType = transaction.fuelType === filterFuelType;
    }
    
    if (filterTransactionType) {
      matchesTransactionType = transaction.type === filterTransactionType;
    }
    
    return matchesDateRange && matchesFuelType && matchesTransactionType;
  });
  
  // Фильтрация транзакций с учетом замороженных для расчетов
  const activeTransactions = filteredTransactions.filter(t => !t.frozen);
  
  // Расчетные данные по активным транзакциям
  const totalPurchased = activeTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.volume, 0);
    
  const totalSold = activeTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.volume, 0);
  
  const totalDrained = activeTransactions
    .filter(t => t.type === 'drain')
    .reduce((sum, t) => sum + t.volume, 0);
    
  const totalPurchaseCost = activeTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.totalCost, 0);
    
  const totalSaleIncome = activeTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.totalCost, 0);
    
  const totalBaseToBunker = activeTransactions
    .filter(t => t.type === 'base_to_bunker')
    .reduce((sum, t) => sum + t.volume, 0);

  const totalBunkerToBase = activeTransactions
    .filter(t => t.type === 'bunker_to_base')
    .reduce((sum, t) => sum + t.volume, 0);

  const baseBalance = totalPurchased - totalSold - totalBaseToBunker + totalBunkerToBase;
    
  const avgPurchasePrice = totalPurchased > 0 ? totalPurchaseCost / totalPurchased : 0;
  const soldCost = totalSold * avgPurchasePrice;
  const profit = totalSaleIncome - soldCost;
  // Замороженные средства (стоимость нераспроданного топлива)
  const frozenVolume = totalPurchased - totalSold;
  const frozenCost = frozenVolume > 0 ? frozenVolume * avgPurchasePrice : 0;
    
  const averageSalePrice = totalSold > 0 
    ? totalSaleIncome / totalSold 
    : 0;
    
  const coefficient = avgPurchasePrice > 0 
    ? averageSalePrice / avgPurchasePrice 
    : 0;
  
  const profitMargin = coefficient > 0 
    ? (coefficient - 1) * 100
    : 0;
    
  // Данные по типам топлива
  const fuelTypeData = FUEL_TYPES.map(fuelType => {
    const fuelTransactions = filteredTransactions.filter(t => t.fuelType === fuelType.value);
    const purchased = fuelTransactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.volume, 0);
    const sold = fuelTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.volume, 0);
    const drained = fuelTransactions.filter(t => t.type === 'drain').reduce((sum, t) => sum + t.volume, 0);
    const baseToBunker = fuelTransactions.filter(t => t.type === 'base_to_bunker').reduce((sum, t) => sum + t.volume, 0);
    const bunkerToBase = fuelTransactions.filter(t => t.type === 'bunker_to_base').reduce((sum, t) => sum + t.volume, 0);
    const purchaseCost = fuelTransactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.totalCost, 0);
    const saleIncome = fuelTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.totalCost, 0);
    
    return {
      fuelType: fuelType.value,
      fuelName: fuelType.label,
      purchased,
      sold,
      drained,
      baseBalance: purchased - drained - baseToBunker + bunkerToBase,
      bunkerBalance: baseToBunker - bunkerToBase - sold,
      purchaseCost,
      saleIncome,
      profit: sold * (purchased > 0 ? purchaseCost / purchased : 0) > 0 ? saleIncome - sold * (purchaseCost / purchased) : 0
    } as FuelTypeData;
  }).filter(data => data.purchased > 0 || data.sold > 0 || data.drained > 0 || data.baseBalance > 0 || data.bunkerBalance > 0);

  const handleAddTransaction = async (values: any) => {
    const { type, volume, price, fuelType, supplier, customer, vessel, paymentMethod, notes, bunkerVessel } = values;
    const volNumber = parseFloat(volume);
    const priceNumber = parseFloat(price);
    const now = new Date();
    
    // Get user info from localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Check if user is trying to perform movement operations without admin rights
    if ((type === 'base_to_bunker' || type === 'bunker_to_base') && currentUser.role !== 'admin') {
      notification.error({
        message: 'Доступ запрещен',
        description: 'Только администраторы могут выполнять операции перемещения топлива'
      });
      return;
    }
    
    const newTransaction: FuelTransaction = {
      key: `transaction-${lastKey + 1}`,
      type,
      volume: volNumber,
      price: priceNumber,
      totalCost: volNumber * priceNumber,
      date: now.toLocaleString(),
      timestamp: now.getTime(),
      fuelType,
      supplier: type === 'purchase' ? supplier : undefined,
      customer: type === 'sale' ? customer : undefined,
      vessel: type === 'sale' ? vessel : bunkerVessel,
      paymentMethod: type === 'sale' ? paymentMethod : undefined,
      userId: currentUser.id,
      userRole: currentUser.role,
      frozen: false,
      notes: notes || undefined
    };
    
    try {
      const updatedTransactions = await window.electronAPI.transactions.add(newTransaction);
      // Фильтруем только allowedTypes
      setTransactions(updatedTransactions.filter(t => allowedTypes.includes(t.type)));
      setLastKey(lastKey + 1);
      form.resetFields();
      
      let message = '';
      if (type === 'purchase') message = 'Покупка добавлена';
      else if (type === 'sale') message = 'Продажа добавлена';
      else if (type === 'base_to_bunker') message = 'Перемещение с базы на бункеровщик добавлено';
      else if (type === 'bunker_to_base') message = 'Перемещение с бункеровщика на базу добавлено';
      
      notification.success({
        message: 'Операция добавлена',
        description: message
      });
    } catch (error) {
      notification.error({
        message: 'Ошибка',
        description: 'Не удалось добавить операцию'
      });
    }
  };

  const handleDeleteTransaction = async (key: string) => {
    try {
      const updatedTransactions = await window.electronAPI.transactions.delete(key);
      setTransactions(updatedTransactions.filter(t => allowedTypes.includes(t.type)));
      notification.success({
        message: 'Транзакция удалена',
        description: 'Запись успешно удалена из истории операций'
      });
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      notification.error({
        message: 'Ошибка удаления',
        description: 'Не удалось удалить транзакцию'
      });
    }
  };

  const exportToExcel = () => {
    const result = exportFuelDataToExcel(
      filteredTransactions,
      fuelTypeData,
      totalPurchased,
      totalSold,
      totalDrained,
      totalPurchaseCost,
      totalSaleIncome,
      avgPurchasePrice,
      averageSalePrice,
      coefficient,
      profitMargin
    );
    
    if (result.success) {
      notification.success({
        message: 'Данные экспортированы',
        description: `Отчет сохранен в файл ${result.fileName} с рабочими формулами`
      });
    } else {
      notification.error({
        message: 'Ошибка экспорта',
        description: `Не удалось экспортировать данные: ${result.error}`
      });
    }
  };

  const clearFilters = () => {
    setDateRange(null);
    setFilterFuelType(null);
    setFilterTransactionType(null);
  };

  const handleEditTransaction = (transaction: FuelTransaction) => {
    setEditingTransaction(transaction);
    editForm.setFieldsValue({
      type: transaction.type,
      fuelType: transaction.fuelType,
      volume: transaction.volume,
      price: transaction.price,
      supplier: transaction.supplier,
      customer: transaction.customer,
      vessel: transaction.vessel,
      paymentMethod: transaction.paymentMethod,
      bunkerVessel: transaction.vessel,
      notes: transaction.notes
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    editForm.validateFields().then(async values => {
      const { volume, price, supplier, customer, vessel, paymentMethod, notes } = values;
      const volNumber = parseFloat(volume);
      const priceNumber = parseFloat(price);
      
      if (editingTransaction) {
        const updatedTransaction: FuelTransaction = {
          ...editingTransaction,
          volume: volNumber,
          price: priceNumber,
          totalCost: editingTransaction.type === 'drain' ? 0 : volNumber * priceNumber,
          supplier: supplier || undefined,
          customer: customer || undefined,
          vessel: vessel || undefined,
          paymentMethod: paymentMethod || undefined,
          notes: notes || undefined,
          edited: true,
          editTimestamp: Date.now()
        };
        
        try {
          const updatedTransactions = await window.electronAPI.transactions.update(updatedTransaction);
          setTransactions(updatedTransactions.filter(t => allowedTypes.includes(t.type)));
          setEditModalVisible(false);
          setEditingTransaction(null);
          editForm.resetFields();
          
          notification.success({
            message: 'Транзакция изменена',
            description: 'Изменения сохранены успешно'
          });
        } catch (error) {
          console.error('Failed to update transaction:', error);
          notification.error({
            message: 'Ошибка',
            description: 'Не удалось сохранить изменения'
          });
        }
      }
    });
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingTransaction(null);
    editForm.resetFields();
  };

  const handleFreezeTransaction = (transaction: FuelTransaction) => {
    const updatedTransaction = {
      ...transaction,
      frozen: !transaction.frozen,
      frozenDate: transaction.frozen ? undefined : Date.now()
    };
    
    setTransactions(transactions.map(t => 
      t.key === transaction.key ? updatedTransaction : t
    ));
    
    notification.info({
      message: transaction.frozen ? 'Топливо разморожено' : 'Топливо заморожено',
      description: transaction.frozen 
        ? 'Топливо снова учитывается в остатках и влияет на прибыль' 
        : 'Топливо не учитывается в остатках и не влияет на прибыль'
    });
  };

  const showDeleteConfirm = (transaction: FuelTransaction) => {
    setTransactionToDelete(transaction);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;
    try {
      const updatedTransactions = await window.electronAPI.transactions.delete(transactionToDelete.key);
      setTransactions(updatedTransactions.filter(t => allowedTypes.includes(t.type)));
      setDeleteModalVisible(false);
      setTransactionToDelete(null);
      notification.success({
        message: 'Транзакция удалена',
        description: 'Запись успешно удалена из истории операций'
      });
    } catch (error) {
      notification.error({
        message: 'Ошибка удаления',
        description: 'Не удалось удалить транзакцию'
      });
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalVisible(false);
    setTransactionToDelete(null);
  };

  const columns: ColumnsType<FuelTransaction> = [
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        switch(type) {
          case 'purchase': return <Tag color="green">Покупка</Tag>;
          case 'sale': return <Tag color="volcano">Продажа</Tag>;
          case 'base_to_bunker': return <Tag color="blue">База → Бункер</Tag>;
          case 'bunker_to_base': return <Tag color="purple">Бункер → База</Tag>;
          default: return <Tag>{type}</Tag>;
        }
      },
      filters: [
        { text: 'Покупка', value: 'purchase' },
        { text: 'Продажа', value: 'sale' },
        ...(currentUser.role === 'admin' ? [
          { text: 'База → Бункер', value: 'base_to_bunker' },
          { text: 'Бункер → База', value: 'bunker_to_base' }
        ] : [])
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: 'Топливо',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (fuelType) => <b>{FUEL_TYPES.find(t => t.value === fuelType)?.label || fuelType}</b>,
      filters: FUEL_TYPES.map(type => ({ text: type.label, value: type.value })),
      onFilter: (value, record) => record.fuelType === value,
    },
    {
      title: 'Объем (л)',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume: number | undefined | null) => {
        if (volume === undefined || volume === null) return '-';
        return <b>{volume.toFixed(2)}</b>;
      },
      sorter: (a, b) => (a.volume || 0) - (b.volume || 0),
    },
    {
      title: 'Цена (₽/л)',
      dataIndex: 'price',
      key: 'price',
      render: (price: number | undefined | null, record) => {
        if (record.type === 'drain') return '-';
        if (price === undefined || price === null) return '-';
        return <span>{price.toFixed(2)}</span>;
      },
      sorter: (a, b) => (a.price || 0) - (b.price || 0),
    },
    {
      title: 'Стоимость (₽)',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (totalCost: number | undefined | null, record) => {
        if (record.type === 'drain') return '-';
        if (totalCost === undefined || totalCost === null) return '-';
        return <b style={{ color: '#1890ff' }}>{totalCost.toFixed(2)}</b>;
      },
      sorter: (a, b) => (a.totalCost || 0) - (b.totalCost || 0),
    },
    {
      title: 'Судно/Клиент/Поставщик',
      key: 'counterparty',
      render: (_: any, record: FuelTransaction) => {
        if (record.type === 'purchase') return <span><UserOutlined /> {record.supplier || '-'}</span>;
        if (record.type === 'sale') return <span><UserOutlined /> {record.customer || '-'} <CarOutlined style={{ marginLeft: 4 }} /> {record.vessel || '-'}</span>;
        if (record.type === 'base_to_bunker' || record.type === 'bunker_to_base') {
          return <span><CarOutlined /> {BUNKER_VESSELS.find(v => v.value === record.vessel)?.label || record.vessel || '-'}</span>;
        }
        return '-';
      },
    },
    {
      title: 'Оплата',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (payment, record) => {
        if (record.type !== 'sale' || !payment) return '-';
        switch(payment) {
          case 'cash': return 'Наличные';
          case 'card': return 'Терминал';
          case 'transfer': return 'Перевод';
          case 'deferred': return 'Отложенный платеж';
          default: return payment;
        }
      },
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, record) => {
        if (record.frozen) {
          return <Tag color="blue">Заморожено</Tag>;
        }
        if (record.edited) {
          return <Tag color="orange">Изменено</Tag>;
        }
        return <Tag color="green">Активно</Tag>;
      }
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => b.timestamp - a.timestamp, // Newer first
      defaultSortOrder: 'descend',
      render: (date) => <span style={{ color: '#888', fontSize: 13 }}>{date}</span>
    },
    {
      title: 'Примечания',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes?: string) => notes ? <span title={notes}><InfoCircleOutlined style={{ color: '#1890ff', marginRight: 4 }} />{notes.length > 20 ? notes.slice(0, 20) + '…' : notes}</span> : '-'
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_, record: FuelTransaction) => {
        // Check if transaction is within 24 hours and user is admin
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"role": "worker"}');
        const isAdmin = currentUser.role === 'admin';
        const canEdit = isAdmin && (Date.now() - record.timestamp < 24 * 60 * 60 * 1000);
        return (
          <Space>
            {canEdit && (
              <Button 
                size="small"
                type="primary"
                onClick={() => handleEditTransaction(record)}
              >
                Изменить
              </Button>
            )}
            {isAdmin && (
              <Button 
                size="small"
                type={record.frozen ? "default" : "dashed"}
                onClick={() => handleFreezeTransaction(record)}
              >
                {record.frozen ? 'Разморозить' : 'Заморозить'}
              </Button>
            )}
            {isAdmin && (
              <Button 
                size="small"
                icon={<DeleteOutlined />} 
                danger
                onClick={() => showDeleteConfirm(record)}
              />
            )}
          </Space>
        );
      },
    },
  ];

  const advancedColumns = [
    ...columns.slice(0, -1),
    columns[columns.length - 1] // Последний столбец (действия)
  ];

  useEffect(() => {
    // If no user exists in localStorage, create a default admin
    if (!localStorage.getItem('currentUser')) {
      localStorage.setItem('currentUser', JSON.stringify({
        id: 'admin1',
        name: 'Администратор',
        role: 'admin'
      }));
    }
  }, []);

  // Load current user from localStorage
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{"id": "", "role": ""}');
    setCurrentUser(user);
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <Row justify="space-between" align="middle">
        <Title level={2}>Учет топлива</Title>
        <Space>
          <Button
            icon={<FileExcelOutlined 
              onPointerEnterCapture={() => {}} 
              onPointerLeaveCapture={() => {}} 
            />}
            onClick={exportToExcel}
          >
            Экспорт данных
          </Button>
        </Space>
      </Row>
      
      <Row gutter={[24, 24]}>
        <Col span={24} lg={10}>
          <Card title="Добавить операцию" style={{ marginBottom: 20 }}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleAddTransaction}
            >
              <Form.Item
                name="type"
                label="Тип операции"
                rules={[{ required: true, message: 'Выберите тип операции' }]}
              >
                <Select placeholder="Выберите тип операции">
                  <Option value="purchase">Покупка топлива</Option>
                  <Option value="sale">Продажа топлива</Option>
                  {currentUser.role === 'admin' && (
                    <>
                      <Option value="base_to_bunker">Перемещение с базы на бункеровщик</Option>
                      <Option value="bunker_to_base">Перемещение с бункеровщика на базу</Option>
                    </>
                  )}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="fuelType"
                label="Тип топлива"
                rules={[{ required: true, message: 'Выберите тип топлива' }]}
              >
                <Select placeholder="Выберите тип топлива">
                  {FUEL_TYPES.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="volume"
                label="Объем топлива (л)"
                rules={[{ required: true, message: 'Введите объем' }]}
              >
                <Input type="number" min="0" step="0.01" placeholder="Введите объем" />
              </Form.Item>
              
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
              >
                {({ getFieldValue }) => {
                  const type = getFieldValue('type');
                  return (type === 'purchase' || type === 'sale') ? (
                    <Form.Item
                      name="price"
                      label="Цена (₽/л)"
                      rules={[{ required: true, message: 'Введите цену' }]}
                    >
                      <Input type="number" min="0" step="0.01" placeholder="Введите цену" />
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
              >
                {({ getFieldValue }) => {
                  const type = getFieldValue('type');
                  return type === 'purchase' ? (
                    <Form.Item name="supplier" label="Поставщик">
                      <Input placeholder="Укажите поставщика" />
                    </Form.Item>
                  ) : null;
                }}
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
              >
                {({ getFieldValue }) => {
                  const type = getFieldValue('type');
                  return type === 'sale' ? (
                    <>
                      <Form.Item name="customer" label="Покупатель">
                        <Input placeholder="Укажите покупателя" />
                      </Form.Item>
                      <Form.Item name="vessel" label="Название катера" rules={[{ required: true, message: 'Укажите название катера' }]}>
                        <Input placeholder="Укажите название катера" />
                      </Form.Item>
                      <Form.Item name="paymentMethod" label="Способ оплаты" rules={[{ required: true, message: 'Укажите способ оплаты' }]}>
                        <Select placeholder="Выберите способ оплаты">
                          <Option value="cash">Наличные</Option>
                          <Option value="card">Терминал</Option>
                          <Option value="transfer">Перевод</Option>
                          <Option value="deferred">Отложенный платеж</Option>
                        </Select>
                      </Form.Item>
                    </>
                  ) : null;
                }}
              </Form.Item>

              <Form.Item name="notes" label="Примечания">
                <Input.TextArea rows={2} placeholder="Дополнительные примечания" />
              </Form.Item>
              
              {/* Добавляем поле выбора бункеровщика */}
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
              >
                {({ getFieldValue }) => {
                  const type = getFieldValue('type');
                  if (type === 'base_to_bunker' || type === 'bunker_to_base') {
                    return (
                      <Form.Item
                        name="bunkerVessel"
                        label="Бункеровщик"
                        rules={[{ required: true }]}
                      >
                        <Select placeholder="Выберите бункеровщик">
                          {BUNKER_VESSELS.map(vessel => (
                            <Option key={vessel.value} value={vessel.value}>{vessel.label}</Option>
                          ))}
                        </Select>
                      </Form.Item>
                    );
                  }
                  return null;
                }}
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Добавить
                </Button>
              </Form.Item>
            </Form>
          </Card>
          
          <Card title="Статистика">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic 
                  title="Куплено" 
                  value={totalPurchased} 
                  precision={2}
                  suffix="л" 
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Продано" 
                  value={totalSold} 
                  precision={2}
                  suffix="л" 
                />
              </Col>
              <Col span={24}>
                <Statistic 
                  title="Прибыль" 
                  value={profit} 
                  precision={2}
                  prefix="₽" 
                  valueStyle={{ color: profit > 0 ? '#3f8600' : '#cf1322' }}
                />
                <div style={{ color: '#1890ff', fontSize: 13, marginTop: 4 }}>
                  Заморожено: {frozenCost.toFixed(2)} ₽
                </div>
              </Col>
            </Row>
            
            <Divider style={{ margin: '12px 0' }} />
            
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic 
                  title="Коэффициент" 
                  value={coefficient} 
                  precision={2}
                  valueStyle={{ color: coefficient > 1 ? '#3f8600' : '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Маржа"
                  value={profitMargin.toFixed(2)}
                  precision={2}
                  valueStyle={{ color: profitMargin > 0 ? '#3f8600' : '#cf1322' }}
                  suffix="%"
                />
              </Col>
            </Row>

            {fuelTypeData.length > 0 && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <Title level={5}>По типам топлива</Title>
                {fuelTypeData.map(data => (
                  <div key={data.fuelType} style={{ marginBottom: 24 }}>
                    <Text strong style={{ fontSize: '16px', display: 'block', marginBottom: '12px' }}>{data.fuelName}</Text>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Statistic 
                          title="Остаток на базе"
                          value={data.baseBalance}
                          precision={2}
                          suffix="л"
                          valueStyle={{ color: data.baseBalance > 0 ? '#3f8600' : '#cf1322' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="Остаток на бункеровщике"
                          value={data.bunkerBalance}
                          precision={2}
                          suffix="л"
                          valueStyle={{ color: data.bunkerBalance > 0 ? '#3f8600' : '#cf1322' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="Прибыль"
                          value={data.profit}
                          precision={2}
                          prefix="₽"
                          valueStyle={{ color: data.profit > 0 ? '#3f8600' : '#cf1322' }}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic 
                          title="Объем продаж"
                          value={data.sold}
                          precision={2}
                          suffix="л"
                        />
                      </Col>
                    </Row>
                  </div>
                ))}
              </>
            )}
          </Card>
        </Col>
        
        <Col span={24} lg={14}>
          <Card 
            title="История операций" 
            extra={
              <Space>
                <Button 
                  icon={<FilterOutlined 
                    onPointerEnterCapture={() => {}} 
                    onPointerLeaveCapture={() => {}} 
                  />} 
                  onClick={() => clearFilters()}
                  disabled={!dateRange && !filterFuelType && !filterTransactionType}
                >
                  Сбросить фильтры
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text>Период:</Text>
                  <RangePicker 
                    style={{ width: '100%', marginTop: 4 }} 
                    value={dateRange}
                    onChange={setDateRange}
                  />
                </Col>
                <Col span={6}>
                  <Text>Тип топлива:</Text>
                  <Select 
                    style={{ width: '100%', marginTop: 4 }} 
                    placeholder="Все типы"
                    allowClear
                    value={filterFuelType}
                    onChange={setFilterFuelType}
                  >
                    {FUEL_TYPES.map(option => (
                      <Option key={option.value} value={option.value}>{option.label}</Option>
                    ))}
                  </Select>
                </Col>
                <Col span={6}>
                  <Text>Тип операции:</Text>
                  <Select 
                    style={{ width: '100%', marginTop: 4 }} 
                    placeholder="Все операции"
                    allowClear
                    value={filterTransactionType}
                    onChange={(value) => setFilterTransactionType(value as FuelTransaction['type'] | null)}
                  >
                    <Option value="purchase">Покупка</Option>
                    <Option value="sale">Продажа</Option>
                    {currentUser.role === 'admin' && (
                      <>
                        <Option value="base_to_bunker">Перемещение с базы на бункеровщик</Option>
                        <Option value="bunker_to_base">Перемещение с бункеровщика на базу</Option>
                      </>
                    )}
                  </Select>
                </Col>
              </Row>
            </Space>
            
            <Table 
              columns={advancedMode ? advancedColumns : columns} 
              dataSource={filteredTransactions} 
              pagination={{ pageSize: 10 }}
              scroll={{ x: 'max-content' }}
              rowClassName={() => 'fuel-table-row'}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Редактировать операцию"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={handleCancelEdit}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="type"
            label="Тип операции"
            rules={[{ required: true }]}
          >
            <Select disabled>
              <Option value="purchase">Покупка топлива</Option>
              <Option value="sale">Продажа топлива</Option>
              <Option value="base_to_bunker">Перемещение с базы на бункеровщик</Option>
              <Option value="bunker_to_base">Перемещение с бункеровщика на базу</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="fuelType"
            label="Тип топлива"
            rules={[{ required: true }]}
          >
            <Select disabled>
              {FUEL_TYPES.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="volume"
            label="Объем топлива (л)"
            rules={[{ required: true }]}
          >
            <Input type="number" min="0" step="0.01" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return (type === 'purchase' || type === 'sale') ? (
                <Form.Item
                  name="price"
                  label="Цена (₽/л)"
                  rules={[{ required: true, message: 'Введите цену' }]}
                >
                  <Input type="number" min="0" step="0.01" placeholder="Введите цену" />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return type === 'purchase' ? (
                <Form.Item name="supplier" label="Поставщик">
                  <Input />
                </Form.Item>
              ) : null;
            }}
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return type === 'sale' ? (
                <>
                  <Form.Item name="customer" label="Покупатель">
                    <Input />
                  </Form.Item>
                  <Form.Item name="vessel" label="Название катера" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="paymentMethod" label="Способ оплаты" rules={[{ required: true }]}>
                    <Select>
                      <Option value="cash">Наличные</Option>
                      <Option value="card">Терминал</Option>
                      <Option value="transfer">Перевод</Option>
                      <Option value="deferred">Отложенный платеж</Option>
                    </Select>
                  </Form.Item>
                </>
              ) : null;
            }}
          </Form.Item>

          <Form.Item name="notes" label="Примечания">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Подтвердите удаление операции"
        open={deleteModalVisible}
        onOk={handleConfirmDelete}
        onCancel={handleCancelDelete}
        okText="Удалить"
        cancelText="Отмена"
        okButtonProps={{ danger: true }}
      >
        {transactionToDelete && (
          <div>
            <p>Вы действительно хотите удалить эту операцию?</p>
            <ul>
              <li><b>Тип:</b> {(() => {
                switch(transactionToDelete.type) {
                  case 'purchase': return 'Покупка';
                  case 'sale': return 'Продажа';
                  case 'base_to_bunker': return 'Перемещение с базы на бункеровщик';
                  case 'bunker_to_base': return 'Перемещение с бункеровщика на базу';
                  default: return transactionToDelete.type;
                }
              })()}</li>
              <li><b>Топливо:</b> {FUEL_TYPES.find(t => t.value === transactionToDelete.fuelType)?.label || transactionToDelete.fuelType}</li>
              <li><b>Объем:</b> {transactionToDelete.volume} л</li>
              <li><b>Дата:</b> {typeof transactionToDelete.date === 'string' ? transactionToDelete.date : ''}</li>
            </ul>
          </div>
        )}
      </Modal>

      <style jsx>{`
      .fuel-table-row {
        height: 48px !important;
        font-size: 15px;
      }
      `}</style>
    </div>
  );
};

export default FuelTrading; 
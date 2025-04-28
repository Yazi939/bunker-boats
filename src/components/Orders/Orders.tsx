import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Table, Tag, Input, Space, Typography, Modal, 
  Form, DatePicker, Select, InputNumber, message, Badge
} from 'antd';
import { 
  ShoppingCartOutlined, PlusOutlined, SearchOutlined,
  EditOutlined, DeleteOutlined, ExportOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getCurrentUser, checkPermission } from '../../utils/users';
import styles from './Orders.module.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Статусы заказа
const ORDER_STATUSES = [
  { value: 'new', label: 'Новый', color: 'blue' },
  { value: 'processing', label: 'В обработке', color: 'orange' },
  { value: 'completed', label: 'Выполнен', color: 'green' },
  { value: 'canceled', label: 'Отменен', color: 'red' }
];

interface Order {
  id: string;
  customerName: string;
  customerContact: string;
  vesselName: string;
  fuelType: string;
  volume: number;
  price: number;
  totalCost: number;
  status: string;
  createdAt: string;
  timestamp: number;
  deliveryDate?: string;
  deliveryTimestamp?: number;
  notes?: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  
  const currentUser = getCurrentUser();
  const canManageOrders = checkPermission('canManageOrders');
  
  // Load orders from localStorage
  useEffect(() => {
    const savedOrders = localStorage.getItem('orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }
  }, []);
  
  // Save orders to localStorage when they change
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);
  
  const handleAddOrder = () => {
    setEditingOrder(null);
    form.resetFields();
    form.setFieldsValue({
      status: 'new',
      createdAt: dayjs()
    });
    setModalVisible(true);
  };
  
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    form.setFieldsValue({
      customerName: order.customerName,
      customerContact: order.customerContact,
      vesselName: order.vesselName,
      fuelType: order.fuelType,
      volume: order.volume,
      price: order.price,
      status: order.status,
      createdAt: dayjs(order.timestamp),
      deliveryDate: order.deliveryTimestamp ? dayjs(order.deliveryTimestamp) : undefined,
      notes: order.notes
    });
    setModalVisible(true);
  };
  
  const handleDeleteOrder = (id: string) => {
    Modal.confirm({
      title: 'Удаление заказа',
      content: 'Вы уверены, что хотите удалить этот заказ?',
      okText: 'Да',
      okType: 'danger',
      cancelText: 'Нет',
      onOk() {
        setOrders(orders.filter(order => order.id !== id));
        message.success('Заказ удален');
      }
    });
  };
  
  const handleSubmit = (values: any) => {
    const { 
      customerName, customerContact, vesselName, fuelType,
      volume, price, status, createdAt, deliveryDate, notes
    } = values;
    
    const volumeNum = parseFloat(volume);
    const priceNum = parseFloat(price);
    const totalCost = volumeNum * priceNum;
    
    if (editingOrder) {
      // Update existing order
      const updatedOrder = {
        ...editingOrder,
        customerName,
        customerContact,
        vesselName,
        fuelType,
        volume: volumeNum,
        price: priceNum,
        totalCost,
        status,
        createdAt: createdAt.format('YYYY-MM-DD'),
        timestamp: createdAt.valueOf(),
        deliveryDate: deliveryDate ? deliveryDate.format('YYYY-MM-DD') : undefined,
        deliveryTimestamp: deliveryDate ? deliveryDate.valueOf() : undefined,
        notes
      };
      
      setOrders(orders.map(order => 
        order.id === editingOrder.id ? updatedOrder : order
      ));
      
      message.success('Заказ обновлен');
    } else {
      // Create new order
      const newOrder: Order = {
        id: `order-${Date.now()}`,
        customerName,
        customerContact,
        vesselName,
        fuelType,
        volume: volumeNum,
        price: priceNum,
        totalCost,
        status,
        createdAt: createdAt.format('YYYY-MM-DD'),
        timestamp: createdAt.valueOf(),
        deliveryDate: deliveryDate ? deliveryDate.format('YYYY-MM-DD') : undefined,
        deliveryTimestamp: deliveryDate ? deliveryDate.valueOf() : undefined,
        notes
      };
      
      setOrders([newOrder, ...orders]); // New orders go at the top
      message.success('Заказ добавлен');
    }
    
    setModalVisible(false);
  };
  
  // Filter orders based on search text
  const filteredOrders = orders.filter(order => {
    if (!searchText) return true;
    
    const searchLower = searchText.toLowerCase();
    return (
      order.customerName.toLowerCase().includes(searchLower) ||
      order.vesselName.toLowerCase().includes(searchLower) ||
      order.customerContact.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower)
    );
  });
  
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: 'Клиент',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: 'Контакт',
      dataIndex: 'customerContact',
      key: 'customerContact',
    },
    {
      title: 'Судно',
      dataIndex: 'vesselName',
      key: 'vesselName',
    },
    {
      title: 'Топливо',
      dataIndex: 'fuelType',
      key: 'fuelType',
      render: (fuelType: string) => {
        if (fuelType === 'diesel') return 'Дизельное топливо';
        if (fuelType === 'gasoline_95') return 'Бензин АИ-95';
        return fuelType;
      },
      filters: [
        { text: 'Дизельное топливо', value: 'diesel' },
        { text: 'Бензин АИ-95', value: 'gasoline_95' }
      ],
      onFilter: (value: string, record: Order) => record.fuelType === value,
    },
    {
      title: 'Объем (л)',
      dataIndex: 'volume',
      key: 'volume',
      render: (volume: number) => volume.toFixed(2),
    },
    {
      title: 'Стоимость (₽)',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (totalCost: number) => totalCost.toFixed(2),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusInfo = ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
        return <Tag color={statusInfo.color}>{statusInfo.label}</Tag>;
      },
      filters: ORDER_STATUSES.map(status => ({ text: status.label, value: status.value })),
      onFilter: (value: string, record: Order) => record.status === value,
    },
    {
      title: 'Дата создания',
      dataIndex: 'createdAt',
      key: 'createdAt',
    },
    {
      title: 'Дата доставки',
      dataIndex: 'deliveryDate',
      key: 'deliveryDate',
      render: (date: string) => date || '-',
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: Order) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEditOrder(record)}
            disabled={!canManageOrders && currentUser?.role !== 'worker'}
          />
          {canManageOrders && (
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger
              onClick={() => handleDeleteOrder(record.id)}
            />
          )}
        </Space>
      ),
    },
  ];
  
  // Counts by status
  const newOrders = orders.filter(o => o.status === 'new').length;
  const processingOrders = orders.filter(o => o.status === 'processing').length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  
  return (
    <div className={styles.orders}>
      <div className={styles.header}>
        <Title level={3}>
          <ShoppingCartOutlined /> Управление заказами
        </Title>
        
        <Space className={styles.headerActions}>
          <Space>
            <Badge count={newOrders} offset={[5, 0]}>
              <Tag color="blue" style={{ marginRight: 4 }}>Новые: {newOrders}</Tag>
            </Badge>
            <Tag color="orange">В обработке: {processingOrders}</Tag>
            <Tag color="green">Выполнено: {completedOrders}</Tag>
          </Space>
          
          <Input.Search
            placeholder="Поиск заказов"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            allowClear
            style={{ width: 250 }}
          />
          
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAddOrder}
            disabled={!canManageOrders && currentUser?.role !== 'worker'}
          >
            Новый заказ
          </Button>
        </Space>
      </div>
      
      <Card>
        <Table 
          dataSource={filteredOrders} 
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      <Modal
        title={editingOrder ? 'Редактировать заказ' : 'Новый заказ'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div className={styles.formGrid}>
            <Form.Item
              name="customerName"
              label="Имя клиента"
              rules={[{ required: true, message: 'Введите имя клиента' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="customerContact"
              label="Контактная информация"
              rules={[{ required: true, message: 'Введите контактную информацию' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="vesselName"
              label="Название судна"
              rules={[{ required: true, message: 'Введите название судна' }]}
            >
              <Input />
            </Form.Item>
            
            <Form.Item
              name="fuelType"
              label="Тип топлива"
              rules={[{ required: true, message: 'Выберите тип топлива' }]}
            >
              <Select>
                <Option value="diesel">Дизельное топливо</Option>
                <Option value="gasoline_95">Бензин АИ-95</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="volume"
              label="Объем (л)"
              rules={[{ required: true, message: 'Введите объем' }]}
            >
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="price"
              label="Цена за литр (₽)"
              rules={[{ required: true, message: 'Введите цену' }]}
            >
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="status"
              label="Статус"
              rules={[{ required: true, message: 'Выберите статус' }]}
            >
              <Select>
                {ORDER_STATUSES.map(status => (
                  <Option key={status.value} value={status.value}>{status.label}</Option>
                ))}
              </Select>
            </Form.Item>
            
            <Form.Item
              name="createdAt"
              label="Дата создания"
              rules={[{ required: true, message: 'Выберите дату создания' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="deliveryDate"
              label="Дата доставки"
              className={styles.spanFull}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
            
            <Form.Item
              name="notes"
              label="Примечания"
              className={styles.spanFull}
            >
              <TextArea rows={3} />
            </Form.Item>
          </div>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingOrder ? 'Сохранить' : 'Добавить'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Отмена
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Orders; 
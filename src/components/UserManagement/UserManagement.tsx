import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Form, Input, Select, Modal, Space, Typography, message, Tag } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { User, UserRole, getCurrentUser, rolePermissions } from '../../utils/users';
import styles from './UserManagement.module.css';

const { Option } = Select;
const { Title } = Typography;

const IconProps = {
  onPointerEnterCapture: () => {},
  onPointerLeaveCapture: () => {}
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const currentUser = getCurrentUser();
  
  useEffect(() => {
    // Load users from localStorage
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    }
  }, []);
  
  // Save users to localStorage when they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users]);
  
  const handleAddUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };
  
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      username: user.username,
      role: user.role,
      password: user.password,
    });
    setModalVisible(true);
  };
  
  const handleDeleteUser = (userId: string) => {
    // Prevent deleting your own account
    if (userId === currentUser?.id) {
      message.error('Вы не можете удалить свой аккаунт');
      return;
    }
    
    Modal.confirm({
      title: 'Удаление пользователя',
      content: 'Вы уверены, что хотите удалить данного пользователя?',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk() {
        setUsers(users.filter(user => user.id !== userId));
        message.success('Пользователь удален');
      },
    });
  };
  
  const handleSubmit = (values: any) => {
    const { name, username, password, role } = values;
    
    if (editingUser) {
      // Update existing user
      setUsers(users.map(user => 
        user.id === editingUser.id ? { ...user, name, username, password, role } : user
      ));
      message.success('Пользователь обновлен');
    } else {
      // Create new user
      const newId = `user${Date.now()}`;
      setUsers([...users, { id: newId, name, username, password, role }]);
      message.success('Пользователь добавлен');
    }
    
    setModalVisible(false);
  };
  
  const columns = [
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Логин',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: UserRole) => {
        let color = '';
        let label = '';
        
        switch (role) {
          case 'admin':
            color = 'red';
            label = 'Администратор';
            break;
          case 'moderator':
            color = 'blue';
            label = 'Модератор';
            break;
          case 'worker':
            color = 'green';
            label = 'Работник';
            break;
        }
        
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space>
          <Button 
            icon={<EditOutlined {...IconProps} />} 
            size="small" 
            onClick={() => handleEditUser(record)}
          />
          <Button 
            icon={<DeleteOutlined {...IconProps} />} 
            size="small" 
            danger 
            onClick={() => handleDeleteUser(record.id)}
            disabled={record.id === currentUser?.id}
          />
        </Space>
      ),
    },
  ];
  
  // Check if user has permission
  if (!currentUser || !rolePermissions[currentUser.role].canAddUsers) {
    return (
      <Card>
        <Title level={4}>Доступ запрещен</Title>
        <p>У вас нет прав для управления пользователями.</p>
      </Card>
    );
  }
  
  return (
    <div className={styles.userManagement}>
      <Card
        title="Управление пользователями"
        extra={
          <Button 
            type="primary" 
            icon={<UserAddOutlined {...IconProps} />} 
            onClick={handleAddUser}
          >
            Добавить пользователя
          </Button>
        }
      >
        <Table 
          dataSource={users} 
          columns={columns} 
          rowKey="id" 
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      <Modal
        title={editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Имя"
            rules={[{ required: true, message: 'Введите имя пользователя' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="username"
            label="Логин"
            rules={[{ required: true, message: 'Введите логин' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="Пароль"
            rules={[{ required: !editingUser, message: 'Введите пароль' }]}
          >
            <Input.Password placeholder={editingUser ? '(Не изменять)' : 'Введите пароль'} />
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Роль"
            rules={[{ required: true, message: 'Выберите роль' }]}
          >
            <Select>
              <Option value="admin">Администратор</Option>
              <Option value="moderator">Модератор</Option>
              <Option value="worker">Работник</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'Сохранить' : 'Добавить'}
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

export default UserManagement; 
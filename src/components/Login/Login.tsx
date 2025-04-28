import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { loginUser } from '../../utils/users';
import './Login.css';

const { Title } = Typography;

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');

    const user = loginUser(values.username, values.password);
    
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('Неверный логин или пароль');
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <Title level={2} className="login-title">Вход в систему</Title>
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'Пожалуйста, введите логин' }]}
          >
            <Input 
              prefix={<span className="login-icon"><UserOutlined /></span>} 
              placeholder="Логин" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Пожалуйста, введите пароль' }]}
          >
            <Input.Password
              prefix={<span className="login-icon"><LockOutlined /></span>}
              placeholder="Пароль"
              size="large"
            />
          </Form.Item>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              block
            >
              Войти
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 
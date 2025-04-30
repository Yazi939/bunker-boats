import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../../services/api';
import './Login.css';

const { Title } = Typography;

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      // Логин через сервер
      const response = await authService.login(values.username, values.password);
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        // Получаем пользователя с сервера
        const me = await authService.getMe();
        if (me.data && me.data.user) {
          localStorage.setItem('currentUser', JSON.stringify(me.data.user));
          onLoginSuccess(me.data.user);
        } else {
          setError('Ошибка получения данных пользователя');
        }
      } else {
        setError('Неверный логин или пароль');
      }
    } catch (e) {
      setError('Ошибка авторизации');
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
            rules={[{ required: true, message: 'Пожалуйста, введите имя пользователя' }]}
          >
            <Input 
              prefix={<span className="login-icon"><UserOutlined /></span>} 
              placeholder="Имя пользователя" 
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
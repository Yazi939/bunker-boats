import React from 'react';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import { DashboardOutlined, CalculatorOutlined, BulbOutlined, ShoppingCartOutlined, DollarOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

const { Sider } = Layout;

interface SidebarProps {
  onThemeChange: (isDark: boolean) => void;
  isDarkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onThemeChange, isDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Определение активного ключа на основе текущего пути
  const getActiveKey = () => {
    const path = location.pathname;
    if (path === '/calculator') return '2';
    if (path === '/fuel-trading') return '3';
    if (path === '/salary-calculator') return '4';
    if (path === '/expense-calendar') return '5';
    return '1'; // По умолчанию Dashboard
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '1',
      icon: React.createElement(DashboardOutlined),
      label: 'Панель управления',
      onClick: () => navigate('/'),
    },
    {
      key: '2',
      icon: React.createElement(CalculatorOutlined),
      label: 'Калькулятор',
      onClick: () => navigate('/calculator'),
    },
    {
      key: '3',
      icon: React.createElement(ShoppingCartOutlined),
      label: 'Учет топлива',
      onClick: () => navigate('/fuel-trading'),
    },
    {
      key: '4',
      icon: React.createElement(DollarOutlined),
      label: 'Зарплаты',
      onClick: () => navigate('/salary-calculator'),
    },
    {
      key: '5',
      icon: React.createElement(CalendarOutlined),
      label: 'Календарь трат',
      onClick: () => navigate('/expense-calendar'),
    },
    {
      key: '6',
      icon: React.createElement(BulbOutlined),
      label: isDarkMode ? 'Светлая тема' : 'Тёмная тема',
      onClick: () => onThemeChange(!isDarkMode),
    },
  ];

  return (
    <Sider 
      breakpoint="lg" 
      collapsedWidth="0" 
      theme="dark"
      style={{ background: '#001529' }}
    >
      <div className="sidebar-logo">
        <Logo />
      </div>
      <Menu
        theme="dark"
        mode="inline"
        defaultSelectedKeys={[getActiveKey()]}
        selectedKeys={[getActiveKey()]}
        items={menuItems}
        style={{ background: '#001529' }}
      />
    </Sider>
  );
};

export default Sidebar; 
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import type { MenuProps } from 'antd';
import { 
  DashboardOutlined, PartitionOutlined, TeamOutlined, 
  ShoppingCartOutlined, ScheduleOutlined, CalendarOutlined,
  LogoutOutlined, UserOutlined, SettingOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, DownOutlined
} from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { initializeUsers, getCurrentUser, logoutUser } from './utils/users';
import Dashboard from './components/Dashboard/Dashboard';
import FuelTrading from './components/FuelTrading/FuelTrading';
import UserManagement from './components/UserManagement/UserManagement';
import ShiftManagement from './components/ShiftManagement/ShiftManagement';
import Orders from './components/Orders/Orders';
import Login from './components/Login/Login';
import Preloader from './components/Preloader/Preloader';
import ExpensesCalendar from './components/ExpensesCalendar/ExpensesCalendar';
import './App.css';

const { Header, Content, Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

interface User {
  name: string;
  role: string;
  id: string;
}

const iconProps = {
  style: { color: 'white' }
};

const adminMenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined className="white-icon" />,
    label: 'Дашборд',
  },
  {
    key: 'fuel',
    icon: <PartitionOutlined className="white-icon" />,
    label: 'Топливо',
  },
  {
    key: 'orders',
    icon: <ShoppingCartOutlined className="white-icon" />,
    label: 'Заказы',
  },
  {
    key: 'expenses',
    icon: <CalendarOutlined className="white-icon" />,
    label: 'Календарь расходов',
  },
  {
    key: 'users',
    icon: <TeamOutlined className="white-icon" />,
    label: 'Пользователи',
  },
  {
    key: 'shifts',
    icon: <ScheduleOutlined className="white-icon" />,
    label: 'Смены',
  },
];

const userMenuItems: MenuItem[] = [
  {
    key: 'fuel',
    icon: <PartitionOutlined className="white-icon" />,
    label: 'Топливо',
  },
  {
    key: 'orders',
    icon: <ShoppingCartOutlined className="white-icon" />,
    label: 'Заказы',
  },
];

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<string>('fuel');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 767;
      setIsMobile(mobile);
      if (!mobile) {
        setCollapsed(false);
        setShowOverlay(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    if (loading) {
      setShowLoader(true);
    } else {
      // showLoader теперь скрывается только после onFinish
    }
    return () => {
      clearTimeout(hideTimeout);
    };
  }, [loading]);

  useEffect(() => {
    const initApp = async () => {
      await initializeUsers();
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setIsLoggedIn(true);
      }
      setLoading(false);
    };
    initApp();
  }, []);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    setCurrentView(e.key);
    if (isMobile) {
      setCollapsed(true);
      setShowOverlay(false);
    }
  };

  const handleUserMenuClick: MenuProps['onClick'] = async (e) => {
    if (e.key === 'logout') {
      await logoutUser();
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentView('fuel');
    }
  };

  const toggleMenu = () => {
    setCollapsed(!collapsed);
    setShowOverlay(!showOverlay);
  };

  const renderContent = () => {
    if (showLoader) {
      return <Preloader loading={loading} onFinish={() => setShowLoader(false)} />;
    }

    if (!isLoggedIn) {
      return <Login onLoginSuccess={(user: User) => {
        setIsLoggedIn(true);
        setCurrentUser(user);
        setCurrentView('fuel');
      }} />;
    }

    switch (currentView) {
      case 'dashboard':
        return currentUser?.role === 'admin' ? <Dashboard /> : null;
      case 'fuel':
        return <FuelTrading />;
      case 'expenses':
        return currentUser?.role === 'admin' ? <ExpensesCalendar /> : null;
      case 'users':
        return currentUser?.role === 'admin' ? <UserManagement /> : null;
      case 'shifts':
        return currentUser?.role === 'admin' ? <ShiftManagement /> : null;
      case 'orders':
        return <Orders />;
      default:
        return <FuelTrading />;
    }
  };

  const dropdownMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      icon: <SettingOutlined className="white-icon" />,
      label: 'Настройки',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined className="white-icon" />,
      label: 'Выход',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile && showOverlay && (
        <div className="mobile-menu-overlay visible" onClick={toggleMenu} />
      )}
      <Sider
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="0"
        className={`main-sidebar ${collapsed ? 'ant-layout-sider-collapsed' : ''}`}
        trigger={null}
        style={{ height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0 }}
      >
        <div className="logo">
          {!collapsed && <span>FUEL Manager</span>}
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          defaultSelectedKeys={['fuel']}
          selectedKeys={[currentView]}
          onClick={handleMenuClick}
          items={currentUser?.role === 'admin' ? adminMenuItems : userMenuItems}
        />
        <div className="sidebar-footer" style={{ width: collapsed ? 80 : 200 }}>
          <Dropdown menu={{ items: dropdownMenuItems, onClick: handleUserMenuClick }} placement="topRight">
            <Space>
              <Avatar icon={<UserOutlined className="white-icon" />} />
              {!collapsed && (
                <>
                  <span style={{ color: 'white' }}>{currentUser?.name || 'Пользователь'}</span>
                  <DownOutlined className="white-icon" />
                </>
              )}
            </Space>
          </Dropdown>
        </div>
      </Sider>
      
      <Layout style={{ marginLeft: collapsed ? 0 : isMobile ? 0 : 200 }}>
        <Header className="site-layout-background" style={{ padding: 0, background: '#001529' }}>
          <Button
            type="text"
            icon={collapsed ? 
              <MenuUnfoldOutlined className="white-icon" /> : 
              <MenuFoldOutlined className="white-icon" />
            }
            onClick={toggleMenu}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default App; 
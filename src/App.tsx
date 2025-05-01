import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import type { MenuProps } from 'antd';
import { 
  DashboardOutlined, PartitionOutlined, TeamOutlined, 
  ShoppingCartOutlined, CalendarOutlined,
  LogoutOutlined, UserOutlined, SettingOutlined,
  MenuUnfoldOutlined, MenuFoldOutlined, DownOutlined
} from '@ant-design/icons';
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon';
import { authService } from './services/api';
import Dashboard from './components/Dashboard/Dashboard';
import FuelTrading from './components/FuelTrading/FuelTrading';
import UserManagement from './components/UserManagement/UserManagement';
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

const iconStyle: AntdIconProps = { 
  className: 'white-icon' 
};

// @ts-ignore
const adminMenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    // @ts-ignore
    icon: <DashboardOutlined className="white-icon" />,
    label: 'Дашборд',
  },
  {
    key: 'fuel',
    // @ts-ignore
    icon: <PartitionOutlined className="white-icon" />,
    label: 'Топливо',
  },
  {
    key: 'orders',
    // @ts-ignore
    icon: <ShoppingCartOutlined className="white-icon" />,
    label: 'Заказы',
  },
  {
    key: 'expenses',
    // @ts-ignore
    icon: <CalendarOutlined className="white-icon" />,
    label: 'Календарь расходов',
  },
  {
    key: 'users',
    // @ts-ignore
    icon: <TeamOutlined className="white-icon" />,
    label: 'Пользователи',
  },
];

// @ts-ignore
const userMenuItems: MenuItem[] = [
  {
    key: 'dashboard',
    // @ts-ignore
    icon: <DashboardOutlined className="white-icon" />,
    label: 'Дашборд',
  },
  {
    key: 'fuel',
    // @ts-ignore
    icon: <PartitionOutlined className="white-icon" />,
    label: 'Топливо',
  },
  {
    key: 'orders',
    // @ts-ignore
    icon: <ShoppingCartOutlined className="white-icon" />,
    label: 'Заказы',
  },
];

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
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
    let hideTimeout: NodeJS.Timeout | undefined;

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
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const me = await authService.getMe();
          if (me.data && me.data.user) {
            setCurrentUser(me.data.user);
        setIsLoggedIn(true);
          } else {
            setCurrentUser(null);
            setIsLoggedIn(false);
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
          }
        } catch {
          setCurrentUser(null);
          setIsLoggedIn(false);
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
        }
      } else {
        setCurrentUser(null);
        setIsLoggedIn(false);
      }
      setLoading(false);
    };
    checkAuth();
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
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      setIsLoggedIn(false);
      setCurrentUser(null);
      setCurrentView('dashboard');
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
        setCurrentView('dashboard');
      }} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'fuel':
        return <FuelTrading />;
      case 'expenses':
        return currentUser?.role === 'admin' ? <ExpensesCalendar /> : null;
      case 'users':
        return currentUser?.role === 'admin' ? <UserManagement /> : null;
      case 'orders':
        return <Orders />;
      default:
        return <Dashboard />;
    }
  };

  // @ts-ignore
  const dropdownMenuItems: MenuProps['items'] = [
    {
      key: 'settings',
      // @ts-ignore
      icon: <SettingOutlined className="white-icon" />,
      label: 'Настройки',
    },
    {
      key: 'logout',
      // @ts-ignore
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
          defaultSelectedKeys={['dashboard']}
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
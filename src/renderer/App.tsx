import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Dropdown, Avatar, Space } from 'antd';
import type { MenuProps } from 'antd';
import { 
  DashboardOutlined, PartitionOutlined, TeamOutlined, 
  ShoppingCartOutlined, ScheduleOutlined,
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
import './App.css';

const { Header, Content, Sider } = Layout;

const iconProps: Partial<AntdIconProps> = {
  style: { color: 'white' }
};

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const renderContent = () => {
    // Implementation of renderContent function
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsed={collapsed}
        breakpoint="lg"
        collapsedWidth="0"
        className="main-sidebar"
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
          items={sideMenuItems}
        />
        <div className="sidebar-footer" style={{ width: collapsed ? 80 : 200 }}>
          <Dropdown menu={{ items: userMenuItems }} placement="topRight">
            <Space>
              <Avatar icon={<UserOutlined {...iconProps} />} />
              {!collapsed && (
                <>
                  <span style={{ color: 'white' }}>{currentUser?.name || 'Пользователь'}</span>
                  <DownOutlined style={{ color: 'white' }} />
                </>
              )}
            </Space>
          </Dropdown>
        </div>
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 0 : 200, transition: 'margin-left 0.2s' }}>
        <Header className="site-layout-background" style={{ padding: 0, background: '#001529' }}>
          <Button
            type="text"
            icon={collapsed ? 
              <MenuUnfoldOutlined style={{ color: 'white' }} /> : 
              <MenuFoldOutlined style={{ color: 'white' }} />
            }
            onClick={() => setCollapsed(!collapsed)}
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
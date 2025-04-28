import React from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';

const { Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
  onThemeChange: (isDark: boolean) => void;
  isDarkMode: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, onThemeChange, isDarkMode }) => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar onThemeChange={onThemeChange} isDarkMode={isDarkMode} />
      <Layout>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 
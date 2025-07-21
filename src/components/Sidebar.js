import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ExperimentOutlined,
  BugOutlined,
  SettingOutlined,
  BarChartOutlined,
  ReloadOutlined,
  BuildOutlined
} from '@ant-design/icons';

const { Sider } = Layout;

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Overview',
    },
    {
      key: '/test-monitoring',
      icon: <ExperimentOutlined />,
      label: 'Test Monitoring',
    },
    {
      key: '/bug-tracking',
      icon: <BugOutlined />,
      label: 'Bug Tracking',
    },
    {
      key: '/service-analysis',
      icon: <SettingOutlined />,
      label: 'Service Analysis',
    },
    {
      key: '/historical-trends',
      icon: <BarChartOutlined />,
      label: 'Historical Trends',
    },
    {
      key: '/jenkins-jobs',
      icon: <BuildOutlined />,
      label: 'Jenkins Jobs',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const refreshData = () => {
    window.location.reload();
  };

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={setCollapsed}
      className="sidebar-menu"
      theme="light"
      width={250}
    >
      <div style={{ 
        padding: '16px', 
        textAlign: 'center', 
        borderBottom: '1px solid #f0f0f0',
        marginBottom: '8px'
      }}>
        <h2 style={{ 
          margin: 0, 
          color: '#1890ff', 
          fontSize: collapsed ? '16px' : '20px',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'QA' : 'QA Dashboard'}
        </h2>
      </div>
      
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
      
      <div style={{ 
        position: 'absolute', 
        bottom: '16px', 
        left: '50%', 
        transform: 'translateX(-50%)' 
      }}>
        <ReloadOutlined 
          style={{ 
            fontSize: '18px', 
            color: '#1890ff', 
            cursor: 'pointer' 
          }}
          onClick={refreshData}
          title="Refresh Data"
        />
      </div>
    </Sider>
  );
};

export default Sidebar;
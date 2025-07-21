import React from 'react';
import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';

const MetricCard = ({ 
  title, 
  value, 
  prefix, 
  suffix, 
  trend, 
  trendValue, 
  loading = false,
  color = '#1890ff'
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend) {
      case 'up':
        return <ArrowUpOutlined className="trend-up" />;
      case 'down':
        return <ArrowDownOutlined className="trend-down" />;
      default:
        return <MinusOutlined className="trend-stable" />;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#52c41a';
      case 'down':
        return '#ff4d4f';
      default:
        return '#1890ff';
    }
  };

  return (
    <Card className="metric-card" loading={loading}>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color }}
      />
      {trend && trendValue && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginTop: '8px',
          color: getTrendColor(),
          fontSize: '12px'
        }}>
          {getTrendIcon()}
          <span style={{ marginLeft: '4px' }}>{trendValue}</span>
        </div>
      )}
    </Card>
  );
};

export default MetricCard;
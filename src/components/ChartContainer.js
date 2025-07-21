import React from 'react';
import { Card, Spin, Alert } from 'antd';

const ChartContainer = ({ 
  title, 
  children, 
  loading = false, 
  error = null,
  extra = null,
  height = 400
}) => {
  return (
    <Card 
      title={title}
      extra={extra}
      className="chart-container"
      bodyStyle={{ height, padding: '24px' }}
    >
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert
          message="Error Loading Chart"
          description={error}
          type="error"
          showIcon
        />
      ) : (
        children
      )}
    </Card>
  );
};

export default ChartContainer;
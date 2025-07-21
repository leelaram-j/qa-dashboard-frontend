import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Button, message, Tabs } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import MetricCard from '../components/MetricCard';
import ChartContainer from '../components/ChartContainer';
import { dashboardApi, testResultsApi } from '../services/api';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const Overview = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [trends, setTrends] = useState(null);
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, trendsRes, testResultsRes] = await Promise.all([
        dashboardApi.getMetrics(),
        dashboardApi.getTrends(30),
        testResultsApi.getRecent(7)
      ]);

      setMetrics(metricsRes.data);
      setTrends(trendsRes.data);
      setTestResults(testResultsRes.data);
    } catch (error) {
      message.error('Failed to load dashboard data');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
    message.success('Data refreshed');
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 90) return '#52c41a';
    if (rate >= 70) return '#faad14';
    return '#ff4d4f';
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const formatTrendData = (dailyMetrics) => {
    return dailyMetrics?.map(metric => ({
      date: new Date(metric.date).toLocaleDateString(),
      successRate: metric.successRate,
      totalTests: metric.totalTests,
      bugsCreated: metric.bugsCreated,
      bugsResolved: metric.bugsResolved
    })) || [];
  };

  const formatBugStatusData = (bugsByStatus) => {
    return Object.entries(bugsByStatus || {}).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };

  const formatTestTypeData = (testResultsByType) => {
    return Object.entries(testResultsByType || {}).map(([type, count]) => ({
      type,
      count
    }));
  };

  return (
    <div>
      <div className="dashboard-header">
        <Title level={1} className="dashboard-title">
          🔍 QA Comprehensive Dashboard
        </Title>
        <Paragraph className="dashboard-subtitle">
          Monitor tests, track bugs, and analyze services across your development pipeline
        </Paragraph>
      </div>

      <div style={{ marginBottom: '24px', textAlign: 'right' }}>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={handleRefresh}
          loading={loading}
        >
          Refresh Data
        </Button>
      </div>

      {/* Key Metrics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Tests (7 days)"
            value={metrics?.totalTests || 0}
            loading={loading}
            color="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Success Rate"
            value={metrics?.successRate?.toFixed(1) || 0}
            suffix="%"
            loading={loading}
            color={getSuccessRateColor(metrics?.successRate || 0)}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Open Bugs"
            value={metrics?.openBugs || 0}
            loading={loading}
            color="#ff4d4f"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Services Monitored"
            value={metrics?.servicesMonitored || 0}
            loading={loading}
            color="#52c41a"
          />
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} lg={12}>
          <ChartContainer title="Test Results Trend" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatTrendData(trends?.dailyMetrics)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="#8884d8" 
                  name="Success Rate (%)"
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalTests" 
                  stroke="#82ca9d" 
                  name="Total Tests"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Col>
        <Col xs={24} lg={12}>
          <ChartContainer title="Bug Status Distribution" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={formatBugStatusData(metrics?.bugsByStatus)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {formatBugStatusData(metrics?.bugsByStatus).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Col>
      </Row>

      {/* Detailed Analysis */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <ChartContainer title="Test Performance by Type" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formatTestTypeData(metrics?.testResultsByType)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Test Count" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Col>
      </Row>

      {/* Recent Activity Tabs */}
      <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
        <Col xs={24}>
          <ChartContainer title="Recent Activity" loading={loading}>
            <Tabs defaultActiveKey="tests">
              <TabPane tab="Recent Test Results" key="tests">
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {testResults.length > 0 ? (
                    testResults.slice(0, 10).map((test, index) => (
                      <div key={index} style={{ 
                        padding: '12px', 
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <strong>{test.jobName}</strong>
                          <div style={{ color: '#666', fontSize: '12px' }}>
                            Build #{test.buildNumber} • {test.testType}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={test.result === 'SUCCESS' ? 'status-success' : 'status-failed'}>
                            {test.result}
                          </span>
                          <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                            {new Date(test.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
                      No recent test results available
                    </div>
                  )}
                </div>
              </TabPane>
              <TabPane tab="Bug Trends" key="bugs">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={formatTrendData(trends?.dailyMetrics)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="bugsCreated" 
                      stroke="#ff4d4f" 
                      name="Bugs Created"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="bugsResolved" 
                      stroke="#52c41a" 
                      name="Bugs Resolved"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabPane>
            </Tabs>
          </ChartContainer>
        </Col>
      </Row>
    </div>
  );
};

export default Overview;
import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Button, Select, DatePicker, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import MetricCard from '../components/MetricCard';
import ChartContainer from '../components/ChartContainer';
import { dashboardApi } from '../services/api';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar
} from 'recharts';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const HistoricalTrends = () => {
  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState(null);
  const [period, setPeriod] = useState('3 months');
  const [dateRange, setDateRange] = useState([
    moment().subtract(3, 'months'),
    moment()
  ]);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const days = getPeriodInDays(period);
      const response = await dashboardApi.getTrends(days);
      setTrends(response.data);
    } catch (error) {
      message.error('Failed to load historical trends data');
      console.error('Error fetching trends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodInDays = (period) => {
    switch (period) {
      case '1 month':
        return 30;
      case '3 months':
        return 90;
      case '6 months':
        return 180;
      case '1 year':
        return 365;
      default:
        return 90;
    }
  };

  const handlePeriodChange = (value) => {
    setPeriod(value);
    const days = getPeriodInDays(value);
    setDateRange([
      moment().subtract(days, 'days'),
      moment()
    ]);
  };

  const formatTrendData = () => {
    if (!trends?.dailyMetrics) return [];
    
    return trends.dailyMetrics.map(metric => ({
      date: moment(metric.date).format('MMM DD'),
      fullDate: metric.date,
      successRate: metric.successRate,
      totalTests: metric.totalTests,
      passedTests: metric.passedTests,
      failedTests: metric.failedTests,
      bugsCreated: metric.bugsCreated,
      bugsResolved: metric.bugsResolved,
      netBugChange: metric.bugsCreated - metric.bugsResolved
    }));
  };

  const getTestVolumeData = () => {
    return formatTrendData().map(item => ({
      date: item.date,
      totalTests: item.totalTests,
      passedTests: item.passedTests,
      failedTests: item.failedTests
    }));
  };

  const getBugTrendData = () => {
    return formatTrendData().map(item => ({
      date: item.date,
      created: item.bugsCreated,
      resolved: item.bugsResolved,
      netChange: item.netBugChange
    }));
  };

  const getCorrelationData = () => {
    return formatTrendData().map(item => ({
      date: item.date,
      testFailures: item.failedTests,
      bugsCreated: item.bugsCreated,
      successRate: item.successRate
    }));
  };

  const calculateTrendMetrics = () => {
    const data = formatTrendData();
    if (data.length < 14) return null;

    const recentData = data.slice(-7);
    const previousData = data.slice(-14, -7);

    const recentAvgSuccess = recentData.reduce((sum, d) => sum + d.successRate, 0) / recentData.length;
    const previousAvgSuccess = previousData.reduce((sum, d) => sum + d.successRate, 0) / previousData.length;

    const recentAvgTests = recentData.reduce((sum, d) => sum + d.totalTests, 0) / recentData.length;
    const previousAvgTests = previousData.reduce((sum, d) => sum + d.totalTests, 0) / previousData.length;

    const recentBugs = recentData.reduce((sum, d) => sum + d.bugsCreated, 0);
    const previousBugs = previousData.reduce((sum, d) => sum + d.bugsCreated, 0);

    return {
      successRateTrend: recentAvgSuccess - previousAvgSuccess,
      testVolumeTrend: recentAvgTests - previousAvgTests,
      bugTrend: recentBugs - previousBugs,
      recentAvgSuccess,
      previousAvgSuccess,
      recentAvgTests,
      previousAvgTests
    };
  };

  const metrics = calculateTrendMetrics();

  const getTrendIcon = (value) => {
    if (value > 0) return 'up';
    if (value < 0) return 'down';
    return 'stable';
  };

  const getTrendColor = (value) => {
    if (value > 0) return '#52c41a';
    if (value < 0) return '#ff4d4f';
    return '#1890ff';
  };

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">📊 Historical Trends Analysis</Title>
      </div>

      {/* Controls */}
      <div className="filters-section">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Select
              placeholder="Select Period"
              value={period}
              onChange={handlePeriodChange}
              style={{ width: '100%' }}
            >
              <Option value="1 month">1 Month</Option>
              <Option value="3 months">3 Months</Option>
              <Option value="6 months">6 Months</Option>
              <Option value="1 year">1 Year</Option>
            </Select>
          </Col>
          <Col xs={24} sm={8}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              disabled
            />
          </Col>
          <Col xs={24} sm={4}>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
              block
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </div>

      {/* Trend Metrics */}
      {metrics && (
        <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Success Rate Trend"
              value={metrics.recentAvgSuccess.toFixed(1)}
              suffix="%"
              trend={getTrendIcon(metrics.successRateTrend)}
              trendValue={`${metrics.successRateTrend >= 0 ? '+' : ''}${metrics.successRateTrend.toFixed(1)}%`}
              loading={loading}
              color={getTrendColor(metrics.successRateTrend)}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Test Volume Trend"
              value={Math.round(metrics.recentAvgTests)}
              trend={getTrendIcon(metrics.testVolumeTrend)}
              trendValue={`${metrics.testVolumeTrend >= 0 ? '+' : ''}${Math.round(metrics.testVolumeTrend)}`}
              loading={loading}
              color="#1890ff"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Bug Trend (7 days)"
              value={Math.abs(Math.round(metrics.bugTrend))}
              trend={getTrendIcon(-metrics.bugTrend)} // Negative bug trend is good
              trendValue={`${metrics.bugTrend >= 0 ? '+' : ''}${Math.round(metrics.bugTrend)}`}
              loading={loading}
              color={metrics.bugTrend <= 0 ? '#52c41a' : '#ff4d4f'}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <MetricCard
              title="Trend Direction"
              value={trends?.trendDirection || 'stable'}
              loading={loading}
              color={
                trends?.trendDirection === 'improving' ? '#52c41a' :
                trends?.trendDirection === 'declining' ? '#ff4d4f' : '#1890ff'
              }
            />
          </Col>
        </Row>
      )}

      {/* Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24}>
          <ChartContainer title="Test Success Rate Trends" loading={loading} height={400}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'successRate' ? `${value.toFixed(1)}%` : value,
                    name === 'successRate' ? 'Success Rate' : name
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="successRate" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  name="Success Rate (%)"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} lg={12}>
          <ChartContainer title="Test Volume Trends" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={getTestVolumeData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="totalTests" 
                  fill="#8884d8" 
                  stroke="#8884d8"
                  fillOpacity={0.3}
                  name="Total Tests"
                />
                <Bar dataKey="passedTests" fill="#82ca9d" name="Passed Tests" />
                <Bar dataKey="failedTests" fill="#ff7300" name="Failed Tests" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Col>
        <Col xs={24} lg={12}>
          <ChartContainer title="Bug Creation vs Resolution" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={getBugTrendData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="created" 
                  fill="#ff4d4f" 
                  stroke="#ff4d4f"
                  fillOpacity={0.3}
                  name="Bugs Created"
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  fill="#52c41a" 
                  stroke="#52c41a"
                  fillOpacity={0.3}
                  name="Bugs Resolved"
                />
                <Line 
                  type="monotone" 
                  dataKey="netChange" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  name="Net Change"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <ChartContainer title="Test Failures vs Bug Creation Correlation" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={getCorrelationData()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="testFailures" 
                  fill="#ff7300" 
                  name="Test Failures"
                  opacity={0.8}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="bugsCreated" 
                  stroke="#ff4d4f" 
                  strokeWidth={3}
                  name="Bugs Created"
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Col>
      </Row>

      {/* Insights */}
      {trends && (
        <Row gutter={[24, 24]} style={{ marginTop: '32px' }}>
          <Col xs={24}>
            <ChartContainer title="Trend Insights" loading={loading}>
              <div style={{ padding: '20px' }}>
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: 'center' }}>
                      <h4>Current Trend</h4>
                      <div style={{ 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        color: 
                          trends.trendDirection === 'improving' ? '#52c41a' :
                          trends.trendDirection === 'declining' ? '#ff4d4f' : '#1890ff'
                      }}>
                        {trends.trendDirection?.toUpperCase() || 'STABLE'}
                      </div>
                      <p style={{ color: '#666', marginTop: '8px' }}>
                        {trends.trendDirection === 'improving' ? '📈 Quality is improving' :
                         trends.trendDirection === 'declining' ? '📉 Quality needs attention' :
                         '📊 Quality is stable'}
                      </p>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: 'center' }}>
                      <h4>Recent Performance</h4>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                        {trends.recentAverage?.toFixed(1) || 0}%
                      </div>
                      <p style={{ color: '#666', marginTop: '8px' }}>
                        Average success rate (last 7 days)
                      </p>
                    </div>
                  </Col>
                  <Col xs={24} md={8}>
                    <div style={{ textAlign: 'center' }}>
                      <h4>Previous Performance</h4>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#666' }}>
                        {trends.previousAverage?.toFixed(1) || 0}%
                      </div>
                      <p style={{ color: '#666', marginTop: '8px' }}>
                        Average success rate (previous 7 days)
                      </p>
                    </div>
                  </Col>
                </Row>
              </div>
            </ChartContainer>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default HistoricalTrends;
import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Button, Select, Checkbox, Table, Tag, message, Tabs } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import MetricCard from '../components/MetricCard';
import ChartContainer from '../components/ChartContainer';
import { testResultsApi } from '../services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const TestMonitoring = () => {
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [filters, setFilters] = useState({
    testTypes: ['Unit Tests', 'Integration Tests', 'System Tests'],
    jobStatus: 'All',
    autoRefresh: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval;
    if (filters.autoRefresh) {
      interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    }
    return () => clearInterval(interval);
  }, [filters.autoRefresh]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resultsRes, metricsRes] = await Promise.all([
        testResultsApi.getRecent(7),
        testResultsApi.getMetrics(7)
      ]);

      setTestResults(resultsRes.data);
      setMetrics(metricsRes.data);
    } catch (error) {
      message.error('Failed to load test monitoring data');
      console.error('Error fetching test data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getFilteredResults = () => {
    let filtered = testResults;

    if (filters.testTypes.length > 0) {
      filtered = filtered.filter(result => filters.testTypes.includes(result.testType));
    }

    if (filters.jobStatus === 'Success Only') {
      filtered = filtered.filter(result => result.result === 'SUCCESS');
    } else if (filters.jobStatus === 'Failed Only') {
      filtered = filtered.filter(result => result.result !== 'SUCCESS');
    }

    return filtered;
  };

  const filteredResults = getFilteredResults();

  const getSuccessRate = (results) => {
    if (results.length === 0) return 0;
    const successful = results.filter(r => r.result === 'SUCCESS').length;
    return (successful / results.length) * 100;
  };

  const getAverageDuration = (results) => {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + (r.duration || 0), 0);
    return total / results.length / 1000; // Convert to seconds
  };

  const getDurationByType = () => {
    const durationMap = {};
    filteredResults.forEach(result => {
      const type = result.testType;
      if (!durationMap[type]) {
        durationMap[type] = [];
      }
      durationMap[type].push(result.duration || 0);
    });

    return Object.entries(durationMap).map(([type, durations]) => ({
      type,
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length / 1000
    }));
  };

  const getFailuresByType = () => {
    const failures = filteredResults.filter(r => r.result !== 'SUCCESS');
    const failureMap = {};
    failures.forEach(result => {
      const type = result.testType;
      failureMap[type] = (failureMap[type] || 0) + 1;
    });

    return Object.entries(failureMap).map(([type, count]) => ({
      name: type,
      value: count
    }));
  };

  const columns = [
    {
      title: 'Job Name',
      dataIndex: 'jobName',
      key: 'jobName',
      sorter: (a, b) => a.jobName.localeCompare(b.jobName),
    },
    {
      title: 'Build',
      dataIndex: 'buildNumber',
      key: 'buildNumber',
      sorter: (a, b) => a.buildNumber - b.buildNumber,
    },
    {
      title: 'Type',
      dataIndex: 'testType',
      key: 'testType',
      filters: [
        { text: 'Unit Tests', value: 'Unit Tests' },
        { text: 'Integration Tests', value: 'Integration Tests' },
        { text: 'System Tests', value: 'System Tests' },
        { text: 'Load Tests', value: 'Load Tests' },
        { text: 'Service Tests', value: 'Service Tests' },
      ],
      onFilter: (value, record) => record.testType === value,
    },
    {
      title: 'Result',
      dataIndex: 'result',
      key: 'result',
      render: (result) => (
        <Tag color={result === 'SUCCESS' ? 'green' : 'red'}>
          {result}
        </Tag>
      ),
      filters: [
        { text: 'SUCCESS', value: 'SUCCESS' },
        { text: 'FAILURE', value: 'FAILURE' },
        { text: 'UNSTABLE', value: 'UNSTABLE' },
      ],
      onFilter: (value, record) => record.result === value,
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${((duration || 0) / 1000).toFixed(1)}s`,
      sorter: (a, b) => (a.duration || 0) - (b.duration || 0),
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => moment(timestamp).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">🧪 Test Monitoring Dashboard</Title>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8}>
            <Select
              mode="multiple"
              placeholder="Filter by Test Type"
              value={filters.testTypes}
              onChange={(value) => handleFilterChange('testTypes', value)}
              style={{ width: '100%' }}
            >
              <Option value="Unit Tests">Unit Tests</Option>
              <Option value="Integration Tests">Integration Tests</Option>
              <Option value="System Tests">System Tests</Option>
              <Option value="Load Tests">Load Tests</Option>
              <Option value="Service Tests">Service Tests</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Job Status"
              value={filters.jobStatus}
              onChange={(value) => handleFilterChange('jobStatus', value)}
              style={{ width: '100%' }}
            >
              <Option value="All">All</Option>
              <Option value="Success Only">Success Only</Option>
              <Option value="Failed Only">Failed Only</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Checkbox
              checked={filters.autoRefresh}
              onChange={(e) => handleFilterChange('autoRefresh', e.target.checked)}
            >
              Auto Refresh
            </Checkbox>
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

      {/* Key Metrics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Test Runs"
            value={filteredResults.length}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Overall Success Rate"
            value={getSuccessRate(filteredResults).toFixed(1)}
            suffix="%"
            loading={loading}
            color={getSuccessRate(filteredResults) >= 90 ? '#52c41a' : '#ff4d4f'}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Failed Tests"
            value={filteredResults.filter(r => r.result !== 'SUCCESS').length}
            loading={loading}
            color="#ff4d4f"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Avg Duration"
            value={getAverageDuration(filteredResults).toFixed(1)}
            suffix="s"
            loading={loading}
          />
        </Col>
      </Row>

      {/* Analysis Tabs */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24}>
          <ChartContainer title="Test Performance Analysis" loading={loading}>
            <Tabs defaultActiveKey="duration">
              <TabPane tab="Duration Analysis" key="duration">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getDurationByType()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)}s`, 'Avg Duration']} />
                    <Bar dataKey="avgDuration" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </TabPane>
              <TabPane tab="Failure Analysis" key="failures">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getFailuresByType()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getFailuresByType().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </TabPane>
            </Tabs>
          </ChartContainer>
        </Col>
      </Row>

      {/* Detailed Results Table */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <ChartContainer 
            title="Detailed Test Results" 
            loading={loading}
            extra={
              <Button icon={<DownloadOutlined />} size="small">
                Export CSV
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={filteredResults}
              rowKey={(record) => `${record.jobName}-${record.buildNumber}`}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 800 }}
            />
          </ChartContainer>
        </Col>
      </Row>
    </div>
  );
};

export default TestMonitoring;
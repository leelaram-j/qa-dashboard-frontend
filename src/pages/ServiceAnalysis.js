import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Button, Select, Table, Tag, message, Progress, Tabs } from 'antd';
import { ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import MetricCard from '../components/MetricCard';
import ChartContainer from '../components/ChartContainer';
import { servicesApi, repositoriesApi } from '../services/api';
import {
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

const ServiceAnalysis = () => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [recentCommits, setRecentCommits] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [filters, setFilters] = useState({
    coverage: 'All Services',
    minTests: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesRes, reposRes, commitsRes, metricsRes] = await Promise.all([
        servicesApi.getWithTestCoverage(),
        repositoriesApi.getAll(),
        repositoriesApi.getRecentCommits(14),
        servicesApi.getMetrics()
      ]);

      setServices(servicesRes.data || []);
      setRepositories(reposRes.data || []);
      setRecentCommits(commitsRes.data || []);
      setMetrics(metricsRes.data || {});
    } catch (error) {
      message.error('Failed to load service analysis data');
      console.error('Error fetching service data:', error);
      // Set empty data to prevent undefined errors
      setServices([]);
      setRepositories([]);
      setRecentCommits([]);
      setMetrics({});
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      await servicesApi.sync();
      await repositoriesApi.sync();
      message.success('Data sync initiated');
      setTimeout(fetchData, 2000); // Refresh after 2 seconds
    } catch (error) {
      message.error('Failed to sync data');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const getFilteredServices = () => {
    let filtered = services;

    if (filters.coverage === 'Covered Only') {
      filtered = filtered.filter(service => service.testCount > 0);
    } else if (filters.coverage === 'Uncovered Only') {
      filtered = filtered.filter(service => service.testCount === 0);
    }

    if (filters.minTests > 0) {
      filtered = filtered.filter(service => service.testCount >= filters.minTests);
    }

    return filtered;
  };

  const filteredServices = getFilteredServices();

  const getServicesWithTests = () => {
    return services.filter(service => service.testCount > 0).length;
  };

  const getTotalTestCount = () => {
    return services.reduce((sum, service) => sum + (service.testCount || 0), 0);
  };

  const getCoveragePercentage = () => {
    if (services.length === 0) return 0;
    return (getServicesWithTests() / services.length) * 100;
  };

  const getTestCoverageData = () => {
    return services
      .sort((a, b) => (b.testCount || 0) - (a.testCount || 0))
      .slice(0, 10)
      .map(service => ({
        name: service.name,
        testCount: service.testCount || 0
      }));
  };

  const getLanguageDistribution = () => {
    const distribution = {};
    repositories.forEach(repo => {
      const language = repo.language || 'Unknown';
      distribution[language] = (distribution[language] || 0) + 1;
    });
    return Object.entries(distribution).map(([language, count]) => ({
      name: language,
      value: count
    }));
  };

  const getRepositoryActivity = () => {
    const activityMap = {};
    recentCommits.forEach(commit => {
      const repo = commit.repository;
      activityMap[repo] = (activityMap[repo] || 0) + 1;
    });
    return Object.entries(activityMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([repo, commits]) => ({
        repository: repo,
        commits
      }));
  };

  const calculateHealthScore = (service) => {
    let score = 0;
    
    // Test coverage factor (0-40 points)
    if (service.testCount > 0) {
      score += Math.min(40, service.testCount * 2);
    }
    
    // Repository activity factor (0-30 points)
    if (service.lastUpdated) {
      const daysSinceUpdate = moment().diff(moment(service.lastUpdated), 'days');
      if (daysSinceUpdate <= 7) {
        score += 30;
      } else if (daysSinceUpdate <= 30) {
        score += 20;
      } else if (daysSinceUpdate <= 90) {
        score += 10;
      }
    }
    
    // Documentation factor (0-30 points) - simplified
    score += 15; // Default moderate score
    
    return score;
  };

  const getHealthCategory = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const getHealthDistribution = () => {
    const distribution = { Excellent: 0, Good: 0, Fair: 0, Poor: 0 };
    services.forEach(service => {
      const score = calculateHealthScore(service);
      const category = getHealthCategory(score);
      distribution[category]++;
    });
    return Object.entries(distribution).map(([category, count]) => ({
      name: category,
      value: count
    }));
  };

  const serviceColumns = [
    {
      title: 'Service',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Repository',
      dataIndex: 'repository',
      key: 'repository',
    },
    {
      title: 'Test Count',
      dataIndex: 'testCount',
      key: 'testCount',
      render: (count) => count || 0,
      sorter: (a, b) => (a.testCount || 0) - (b.testCount || 0),
    },
    {
      title: 'Coverage Status',
      key: 'coverage',
      render: (_, record) => (
        <Tag color={record.testCount > 0 ? 'green' : 'red'}>
          {record.testCount > 0 ? '✅ Covered' : '❌ No Tests'}
        </Tag>
      ),
      filters: [
        { text: 'Covered', value: 'covered' },
        { text: 'No Tests', value: 'uncovered' },
      ],
      onFilter: (value, record) => {
        return value === 'covered' ? record.testCount > 0 : record.testCount === 0;
      },
    },
    {
      title: 'Health Score',
      key: 'health',
      render: (_, record) => {
        const score = calculateHealthScore(record);
        const category = getHealthCategory(score);
        const color = {
          'Excellent': '#52c41a',
          'Good': '#1890ff',
          'Fair': '#faad14',
          'Poor': '#ff4d4f'
        }[category];
        
        return (
          <div>
            <Progress 
              percent={score} 
              size="small" 
              strokeColor={color}
              format={() => `${score}/100`}
            />
            <Tag color={color} style={{ marginTop: '4px' }}>{category}</Tag>
          </div>
        );
      },
      sorter: (a, b) => calculateHealthScore(a) - calculateHealthScore(b),
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      render: (date) => date ? moment(date).format('YYYY-MM-DD') : 'Unknown',
      sorter: (a, b) => {
        const dateA = a.lastUpdated ? new Date(a.lastUpdated) : new Date(0);
        const dateB = b.lastUpdated ? new Date(b.lastUpdated) : new Date(0);
        return dateA - dateB;
      },
    },
  ];

  const commitColumns = [
    {
      title: 'Repository',
      dataIndex: 'repository',
      key: 'repository',
    },
    {
      title: 'Hash',
      dataIndex: 'hash',
      key: 'hash',
      render: (hash) => <code>{hash}</code>,
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
    },
    {
      title: 'Author',
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">🔧 Service Analysis Dashboard</Title>
      </div>

      {/* Controls */}
      <div className="filters-section">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <Select
              placeholder="Filter by Coverage"
              value={filters.coverage}
              onChange={(value) => handleFilterChange('coverage', value)}
              style={{ width: '100%' }}
            >
              <Option value="All Services">All Services</Option>
              <Option value="Covered Only">Covered Only</Option>
              <Option value="Uncovered Only">Uncovered Only</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Select
              placeholder="Minimum Test Count"
              value={filters.minTests}
              onChange={(value) => handleFilterChange('minTests', value)}
              style={{ width: '100%' }}
            >
              <Option value={0}>Any</Option>
              <Option value={5}>5+ Tests</Option>
              <Option value={10}>10+ Tests</Option>
              <Option value={20}>20+ Tests</Option>
            </Select>
          </Col>
          <Col xs={24} sm={6}>
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
          <Col xs={24} sm={6}>
            <Button
              icon={<SyncOutlined />}
              onClick={handleSync}
              block
            >
              Sync Data
            </Button>
          </Col>
        </Row>
      </div>

      {/* Key Metrics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Services"
            value={services.length}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Repositories"
            value={repositories.length}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Services with Tests"
            value={getServicesWithTests()}
            loading={loading}
            color="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Test Count"
            value={getTotalTestCount()}
            loading={loading}
            color="#1890ff"
          />
        </Col>
      </Row>

      {/* Analysis Tabs */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24}>
          <ChartContainer title="Service Analysis" loading={loading}>
            <Tabs defaultActiveKey="coverage">
              <TabPane tab="Test Coverage" key="coverage">
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={16}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getTestCoverageData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="testCount" fill="#8884d8" name="Test Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col xs={24} lg={8}>
                    <div style={{ padding: '20px' }}>
                      <div style={{ marginBottom: '20px' }}>
                        <h4>Coverage Summary</h4>
                        <Progress
                          percent={getCoveragePercentage()}
                          format={(percent) => `${percent?.toFixed(1)}%`}
                          strokeColor="#52c41a"
                        />
                        <p style={{ marginTop: '8px', color: '#666' }}>
                          {getServicesWithTests()} of {services.length} services have tests
                        </p>
                      </div>
                      <div>
                        <h4>Best Coverage</h4>
                        {services.length > 0 && (
                          <p>
                            <strong>{services.reduce((max, service) => 
                              (service.testCount || 0) > (max.testCount || 0) ? service : max
                            ).name}</strong>
                            <br />
                            {services.reduce((max, service) => 
                              (service.testCount || 0) > (max.testCount || 0) ? service : max
                            ).testCount || 0} tests
                          </p>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="Repository Metrics" key="repos">
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getLanguageDistribution()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getLanguageDistribution().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col xs={24} lg={12}>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getRepositoryActivity()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="repository" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="commits" fill="#82ca9d" name="Commits (14 days)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Col>
                </Row>
              </TabPane>
              <TabPane tab="Service Health" key="health">
                <Row gutter={[24, 24]}>
                  <Col xs={24} lg={12}>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getHealthDistribution()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getHealthDistribution().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col xs={24} lg={12}>
                    <div style={{ padding: '20px' }}>
                      <h4>Health Insights</h4>
                      {getHealthDistribution().map(({ name, value }) => (
                        <div key={name} style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>{name}</span>
                            <strong>{value} services</strong>
                          </div>
                          <Progress
                            percent={(value / services.length) * 100}
                            showInfo={false}
                            strokeColor={{
                              'Excellent': '#52c41a',
                              'Good': '#1890ff',
                              'Fair': '#faad14',
                              'Poor': '#ff4d4f'
                            }[name]}
                          />
                        </div>
                      ))}
                    </div>
                  </Col>
                </Row>
              </TabPane>
            </Tabs>
          </ChartContainer>
        </Col>
      </Row>

      {/* Data Tables */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <ChartContainer title="Service Details" loading={loading}>
            <Table
              columns={serviceColumns}
              dataSource={filteredServices}
              rowKey="name"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 800 }}
            />
          </ChartContainer>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col xs={24}>
          <ChartContainer title="Recent Repository Activity (14 days)" loading={loading}>
            <Table
              columns={commitColumns}
              dataSource={recentCommits.slice(0, 20)}
              rowKey={(record) => `${record.repository}-${record.hash}`}
              pagination={false}
              scroll={{ x: 600 }}
            />
          </ChartContainer>
        </Col>
      </Row>
    </div>
  );
};

export default ServiceAnalysis;
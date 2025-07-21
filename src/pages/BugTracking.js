import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Button, Select, Table, Tag, message, Tabs, Progress } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import MetricCard from '../components/MetricCard';
import ChartContainer from '../components/ChartContainer';
import { bugsApi } from '../services/api';
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

const BugTracking = () => {
  const [loading, setLoading] = useState(true);
  const [bugs, setBugs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [filters, setFilters] = useState({
    priority: ['Critical', 'High', 'Medium', 'Low'],
    status: ['Open', 'In Progress'],
    assignee: 'All',
    project: 'ALL'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, bugsRes, metricsRes] = await Promise.all([
        bugsApi.getProjects(),
        bugsApi.getRecent(30, filters.project),
        bugsApi.getMetrics(30, filters.project)
      ]);

      setProjects(projectsRes.data || []);
      setBugs(bugsRes.data || []);
      setMetrics(metricsRes.data);
    } catch (error) {
      message.error('Failed to load bug tracking data');
      console.error('Error fetching bug data:', error);
      // Set empty data to prevent undefined errors
      setProjects([]);
      setBugs([]);
      setMetrics({});
    } finally {
      setLoading(false);
    }
  };

  const fetchBugsForProject = async (selectedProject) => {
    setLoading(true);
    try {
      const [bugsRes, metricsRes] = await Promise.all([
        bugsApi.getRecent(30, selectedProject),
        bugsApi.getMetrics(30, selectedProject)
      ]);

      setBugs(bugsRes.data || []);
      setMetrics(metricsRes.data);
    } catch (error) {
      message.error('Failed to load bugs for selected project');
      console.error('Error fetching project bug data:', error);
      setBugs([]);
      setMetrics({});
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));

    // If project filter changes, fetch new data
    if (key === 'project') {
      fetchBugsForProject(value);
    }
  };

  const getFilteredBugs = () => {
    let filtered = bugs;

    if (filters.priority.length > 0) {
      filtered = filtered.filter(bug => filters.priority.includes(bug.priority));
    }

    if (filters.status.length > 0) {
      filtered = filtered.filter(bug => filters.status.includes(bug.status));
    }

    if (filters.assignee === 'Assigned Only') {
      filtered = filtered.filter(bug => bug.assignee && bug.assignee !== 'Unassigned');
    } else if (filters.assignee === 'Unassigned Only') {
      filtered = filtered.filter(bug => !bug.assignee || bug.assignee === 'Unassigned');
    }

    return filtered;
  };

  const filteredBugs = getFilteredBugs();

  const getCriticalHighCount = () => {
    return filteredBugs.filter(bug => ['Critical', 'High'].includes(bug.priority)).length;
  };

  const getUnassignedCount = () => {
    return filteredBugs.filter(bug => !bug.assignee || bug.assignee === 'Unassigned').length;
  };

  const getAverageAge = () => {
    if (filteredBugs.length === 0) return 0;
    const totalAge = filteredBugs.reduce((sum, bug) => {
      const age = moment().diff(moment(bug.created), 'days');
      return sum + age;
    }, 0);
    return totalAge / filteredBugs.length;
  };

  const getPriorityDistribution = () => {
    const distribution = {};
    filteredBugs.forEach(bug => {
      distribution[bug.priority] = (distribution[bug.priority] || 0) + 1;
    });
    return Object.entries(distribution).map(([priority, count]) => ({
      name: priority,
      value: count
    }));
  };

  const getStatusDistribution = () => {
    const distribution = {};
    filteredBugs.forEach(bug => {
      distribution[bug.status] = (distribution[bug.status] || 0) + 1;
    });
    return Object.entries(distribution).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };

  const getAgeByPriority = () => {
    const ageMap = {};
    filteredBugs.forEach(bug => {
      const priority = bug.priority;
      const age = moment().diff(moment(bug.created), 'days');
      if (!ageMap[priority]) {
        ageMap[priority] = [];
      }
      ageMap[priority].push(age);
    });

    return Object.entries(ageMap).map(([priority, ages]) => ({
      priority,
      avgAge: ages.reduce((sum, age) => sum + age, 0) / ages.length
    }));
  };

  const getOldBugs = () => {
    return filteredBugs.filter(bug => {
      const age = moment().diff(moment(bug.created), 'days');
      return age > 30;
    });
  };

  const getProjectDistribution = () => {
    const distribution = {};
    filteredBugs.forEach(bug => {
      const project = bug.project || 'Unknown';
      distribution[project] = (distribution[project] || 0) + 1;
    });
    return Object.entries(distribution).map(([project, count]) => ({
      project,
      count
    }));
  };

  const columns = [
    {
      title: 'Key',
      dataIndex: 'bugKey',
      key: 'bugKey',
      sorter: (a, b) => a.bugKey.localeCompare(b.bugKey),
    },
    {
      title: 'Summary',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
      render: (text) => (
        <span title={text}>
          {text.length > 60 ? `${text.substring(0, 60)}...` : text}
        </span>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const color = {
          'Critical': 'red',
          'High': 'orange',
          'Medium': 'blue',
          'Low': 'green'
        }[priority] || 'default';
        return <Tag color={color}>{priority}</Tag>;
      },
      filters: [
        { text: 'Critical', value: 'Critical' },
        { text: 'High', value: 'High' },
        { text: 'Medium', value: 'Medium' },
        { text: 'Low', value: 'Low' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = {
          'Open': 'red',
          'In Progress': 'blue',
          'Resolved': 'green',
          'Closed': 'gray'
        }[status] || 'default';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      render: (project, record) => (
        <span>
          <strong>{project}</strong>
          <br />
          <small style={{ color: '#666' }}>{record.projectName}</small>
        </span>
      ),
    },
    {
      title: 'Assignee',
      dataIndex: 'assignee',
      key: 'assignee',
      render: (assignee) => assignee || 'Unassigned',
    },
    {
      title: 'Age (days)',
      key: 'age',
      render: (_, record) => {
        const age = moment().diff(moment(record.created), 'days');
        return (
          <span style={{ color: age > 30 ? '#ff4d4f' : 'inherit' }}>
            {age}
          </span>
        );
      },
      sorter: (a, b) => {
        const ageA = moment().diff(moment(a.created), 'days');
        const ageB = moment().diff(moment(b.created), 'days');
        return ageA - ageB;
      },
    },
    {
      title: 'Created',
      dataIndex: 'created',
      key: 'created',
      render: (created) => moment(created).format('YYYY-MM-DD'),
      sorter: (a, b) => new Date(a.created) - new Date(b.created),
    },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">🐛 Bug Tracking Dashboard</Title>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <Select
              placeholder="Select Project"
              value={filters.project}
              onChange={(value) => handleFilterChange('project', value)}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
            >
              <Option value="ALL">All Projects</Option>
              {projects.map(project => (
                <Option key={project.key} value={project.key}>
                  {project.key} - {project.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={5}>
            <Select
              mode="multiple"
              placeholder="Filter by Priority"
              value={filters.priority}
              onChange={(value) => handleFilterChange('priority', value)}
              style={{ width: '100%' }}
            >
              <Option value="Critical">Critical</Option>
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Col>
          <Col xs={24} sm={5}>
            <Select
              mode="multiple"
              placeholder="Filter by Status"
              value={filters.status}
              onChange={(value) => handleFilterChange('status', value)}
              style={{ width: '100%' }}
            >
              <Option value="Open">Open</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Resolved">Resolved</Option>
              <Option value="Closed">Closed</Option>
              <Option value="Done">Done</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              placeholder="Assignee Filter"
              value={filters.assignee}
              onChange={(value) => handleFilterChange('assignee', value)}
              style={{ width: '100%' }}
            >
              <Option value="All">All</Option>
              <Option value="Assigned Only">Assigned Only</Option>
              <Option value="Unassigned Only">Unassigned Only</Option>
            </Select>
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

      {/* Project Context */}
      {filters.project && filters.project !== 'ALL' && (
        <Row style={{ marginBottom: '16px' }}>
          <Col xs={24}>
            <div style={{ 
              padding: '12px 16px', 
              backgroundColor: '#f6f8fa', 
              borderRadius: '6px',
              border: '1px solid #e1e8ed'
            }}>
              <span style={{ color: '#666', fontSize: '14px' }}>
                📊 Showing bugs for project: 
                <strong style={{ color: '#1890ff', marginLeft: '8px' }}>
                  {projects.find(p => p.key === filters.project)?.name || filters.project}
                </strong>
              </span>
            </div>
          </Col>
        </Row>
      )}

      {/* Key Metrics */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Total Open Bugs"
            value={filteredBugs.length}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Critical/High Priority"
            value={getCriticalHighCount()}
            loading={loading}
            color="#ff4d4f"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Unassigned"
            value={getUnassignedCount()}
            loading={loading}
            color="#faad14"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title="Avg Age (days)"
            value={getAverageAge().toFixed(1)}
            loading={loading}
            color={getAverageAge() > 14 ? '#ff4d4f' : '#52c41a'}
          />
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24} lg={12}>
          <ChartContainer title="Bug Status Distribution" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getStatusDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getStatusDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Col>
        <Col xs={24} lg={12}>
          <ChartContainer title="Priority Distribution" loading={loading}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getPriorityDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getPriorityDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Col>
      </Row>

      {/* Analysis */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px' }}>
        <Col xs={24}>
          <ChartContainer title="Bug Analysis" loading={loading}>
            <Tabs defaultActiveKey="age">
              <TabPane tab="Average Age by Priority" key="age">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getAgeByPriority()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toFixed(1)} days`, 'Average Age']} />
                    <Bar dataKey="avgAge" fill="#ff4d4f" />
                  </BarChart>
                </ResponsiveContainer>
              </TabPane>
              <TabPane tab="Project Distribution" key="projects">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getProjectDistribution()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="project" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1890ff" />
                  </BarChart>
                </ResponsiveContainer>
              </TabPane>
              <TabPane tab="Old Bugs (>30 days)" key="old">
                <div style={{ padding: '20px' }}>
                  {getOldBugs().length > 0 ? (
                    <div>
                      <p style={{ color: '#faad14', marginBottom: '16px' }}>
                        ⚠️ {getOldBugs().length} bugs are older than 30 days
                      </p>
                      <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {getOldBugs().slice(0, 10).map((bug, index) => (
                          <div key={index} style={{ 
                            padding: '12px', 
                            borderBottom: '1px solid #f0f0f0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <strong>{bug.bugKey}</strong>
                              <div style={{ color: '#666', fontSize: '12px' }}>
                                {bug.summary.length > 50 ? `${bug.summary.substring(0, 50)}...` : bug.summary}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <Tag color="red">{bug.priority}</Tag>
                              <div style={{ color: '#666', fontSize: '12px', marginTop: '4px' }}>
                                {moment().diff(moment(bug.created), 'days')} days old
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#52c41a', padding: '40px' }}>
                      ✅ No bugs older than 30 days!
                    </div>
                  )}
                </div>
              </TabPane>
            </Tabs>
          </ChartContainer>
        </Col>
      </Row>

      {/* Bug Details Table */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <ChartContainer 
            title="Bug Details" 
            loading={loading}
            extra={
              <Button icon={<DownloadOutlined />} size="small">
                Export Report
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={filteredBugs}
              rowKey="bugKey"
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

export default BugTracking;
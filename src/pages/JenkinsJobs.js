import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  message,
  Tooltip,
  Typography
} from 'antd';
import {
  PlayCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;
// const { TabPane } = Tabs; // Removed unused import
const { Title } = Typography;

const JenkinsJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState('all');
  const [loading, setLoading] = useState(false);
  const [triggerModalVisible, setTriggerModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobParameters, setJobParameters] = useState({});
  const [form] = Form.useForm();

  const API_BASE_URL = 'http://localhost:8080/api';

  useEffect(() => {
    fetchJobs();
    fetchEnvironments();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, selectedEnvironment]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/jenkins/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching Jenkins jobs:', error);
      message.error('Failed to fetch Jenkins jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchEnvironments = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/jenkins/environments`);
      setEnvironments(response.data);
    } catch (error) {
      console.error('Error fetching environments:', error);
    }
  };

  const fetchJobParameters = async (jobName) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/jenkins/jobs/${jobName}/parameters`);
      setJobParameters(response.data);
    } catch (error) {
      console.error('Error fetching job parameters:', error);
      message.error('Failed to fetch job parameters');
    }
  };

  const filterJobs = () => {
    if (selectedEnvironment === 'all') {
      setFilteredJobs(jobs);
    } else {
      setFilteredJobs(jobs.filter(job => job.environment === selectedEnvironment));
    }
  };

  const getStatusIcon = (result) => {
    switch (result) {
      case 'SUCCESS':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'FAILURE':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'UNSTABLE':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getStatusColor = (result) => {
    switch (result) {
      case 'SUCCESS':
        return 'success';
      case 'FAILURE':
        return 'error';
      case 'UNSTABLE':
        return 'warning';
      default:
        return 'processing';
    }
  };

  const handleTriggerJob = (job) => {
    setSelectedJob(job);
    fetchJobParameters(job.name);
    setTriggerModalVisible(true);
    form.resetFields();
    form.setFieldsValue({
      environment: job.environment,
      branch: job.branch || 'main',
      reason: 'Triggered from QA Dashboard'
    });
  };

  const submitTriggerJob = async (values) => {
    try {
      const triggerRequest = {
        jobName: selectedJob.name,
        environment: values.environment,
        branch: values.branch,
        parameters: values.parameters || {},
        reason: values.reason
      };

      const response = await axios.post(`${API_BASE_URL}/jenkins/jobs/trigger`, triggerRequest);
      
      if (response.data.success) {
        message.success(`Job ${selectedJob.name} triggered successfully!`);
        setTriggerModalVisible(false);
        fetchJobs(); // Refresh jobs list
      } else {
        message.error(response.data.message || 'Failed to trigger job');
      }
    } catch (error) {
      console.error('Error triggering job:', error);
      message.error('Failed to trigger job');
    }
  };

  const columns = [
    {
      title: 'Job Name',
      dataIndex: 'displayName',
      key: 'displayName',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.name}</div>
        </div>
      ),
    },
    {
      title: 'Environment',
      dataIndex: 'environment',
      key: 'environment',
      render: (environment) => (
        <Tag color={
          environment === 'production' ? 'red' :
          environment === 'staging' ? 'orange' :
          environment === 'qa' ? 'blue' : 'green'
        }>
          {environment.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'lastBuildResult',
      key: 'status',
      render: (result) => (
        <Space>
          {getStatusIcon(result)}
          <Tag color={getStatusColor(result)}>{result}</Tag>
        </Space>
      ),
    },
    {
      title: 'Last Build',
      dataIndex: 'lastBuildNumber',
      key: 'lastBuild',
      render: (buildNumber, record) => (
        <div>
          <div>#{buildNumber}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.lastBuildTime ? new Date(record.lastBuildTime).toLocaleString() : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
      render: (branch) => <Tag>{branch || 'main'}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Trigger Job">
            <Button 
              type="primary" 
              icon={<PlayCircleOutlined />}
              size="small"
              disabled={!record.buildable}
              onClick={() => handleTriggerJob(record)}
            >
              Trigger
            </Button>
          </Tooltip>
          <Tooltip title="Job Configuration">
            <Button 
              icon={<SettingOutlined />}
              size="small"
              onClick={() => window.open(record.url, '_blank')}
            >
              Config
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const getEnvironmentStats = () => {
    const stats = {};
    environments.forEach(env => {
      const envJobs = jobs.filter(job => job.environment === env);
      stats[env] = {
        total: envJobs.length,
        success: envJobs.filter(job => job.lastBuildResult === 'SUCCESS').length,
        failure: envJobs.filter(job => job.lastBuildResult === 'FAILURE').length,
        unstable: envJobs.filter(job => job.lastBuildResult === 'UNSTABLE').length
      };
    });
    return stats;
  };

  const environmentStats = getEnvironmentStats();

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Jenkins Jobs</Title>
        <Space>
          <Select
            value={selectedEnvironment}
            onChange={setSelectedEnvironment}
            style={{ width: 150 }}
          >
            <Option value="all">All Environments</Option>
            {environments.map(env => (
              <Option key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1)}</Option>
            ))}
          </Select>
          <Button 
            icon={<ReloadOutlined />}
            onClick={fetchJobs}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {/* Environment Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        {environments.map(env => (
          <Col span={6} key={env}>
            <Card>
              <Statistic
                title={env.charAt(0).toUpperCase() + env.slice(1)}
                value={environmentStats[env]?.total || 0}
                suffix="jobs"
              />
              <div style={{ marginTop: '8px' }}>
                <Space>
                  <Tag color="success">{environmentStats[env]?.success || 0} Success</Tag>
                  <Tag color="error">{environmentStats[env]?.failure || 0} Failed</Tag>
                  {environmentStats[env]?.unstable > 0 && (
                    <Tag color="warning">{environmentStats[env].unstable} Unstable</Tag>
                  )}
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Jobs Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredJobs}
          rowKey="name"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Trigger Job Modal */}
      <Modal
        title={`Trigger Job: ${selectedJob?.displayName}`}
        visible={triggerModalVisible}
        onCancel={() => setTriggerModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={submitTriggerJob}
        >
          <Form.Item
            name="environment"
            label="Environment"
            rules={[{ required: true, message: 'Please select an environment' }]}
          >
            <Select>
              {environments.map(env => (
                <Option key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1)}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="branch"
            label="Branch"
            rules={[{ required: true, message: 'Please enter a branch name' }]}
          >
            <Input placeholder="main" />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Trigger Reason"
          >
            <TextArea rows={2} placeholder="Reason for triggering this job..." />
          </Form.Item>

          {/* Dynamic Parameters */}
          {Object.keys(jobParameters).length > 0 && (
            <div>
              <Title level={4}>Job Parameters</Title>
              {Object.entries(jobParameters).map(([key, param]) => (
                <Form.Item
                  key={key}
                  name={['parameters', key]}
                  label={key.replace(/_/g, ' ')}
                  initialValue={param.default}
                >
                  {param.type === 'choice' ? (
                    <Select>
                      {param.choices.map(choice => (
                        <Option key={choice} value={choice}>{choice}</Option>
                      ))}
                    </Select>
                  ) : param.type === 'boolean' ? (
                    <Switch defaultChecked={param.default} />
                  ) : param.type === 'text' ? (
                    <TextArea rows={2} />
                  ) : (
                    <Input />
                  )}
                </Form.Item>
              ))}
            </div>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default JenkinsJobs;
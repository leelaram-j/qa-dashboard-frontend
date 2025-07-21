import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './components/Sidebar';
import Overview from './pages/Overview';
import TestMonitoring from './pages/TestMonitoring';
import BugTracking from './pages/BugTracking';
import ServiceAnalysis from './pages/ServiceAnalysis';
import HistoricalTrends from './pages/HistoricalTrends';
import JenkinsJobs from './pages/JenkinsJobs';

const { Content } = Layout;

function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <Layout>
        <Content className="content-area">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/test-monitoring" element={<TestMonitoring />} />
            <Route path="/bug-tracking" element={<BugTracking />} />
            <Route path="/service-analysis" element={<ServiceAnalysis />} />
            <Route path="/historical-trends" element={<HistoricalTrends />} />
            <Route path="/jenkins-jobs" element={<JenkinsJobs />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
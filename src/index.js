import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import App from './App';
import 'antd/dist/reset.css';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

const theme = {
  token: {
    colorPrimary: '#FF6B6B',
    colorSuccess: '#4ECDC4',
    colorWarning: '#FFA07A',
    colorError: '#FF6B6B',
    colorInfo: '#98D8C8',
    borderRadius: 8,
  },
};

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider theme={theme}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);
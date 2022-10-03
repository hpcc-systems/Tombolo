import { Spin } from 'antd';
import React from 'react';

const WithSpinner = ({ children, loading }) => {
  if (loading) return <Spin size="large" spinning={true} style={{ display: 'block', textAlign: 'center' }} />;
  return children;
};

export default WithSpinner;

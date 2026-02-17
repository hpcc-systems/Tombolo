import { Spin } from 'antd';
import React from 'react';

type Props = { children: React.ReactNode; loading?: boolean };

const WithSpinner: React.FC<Props> = ({ children, loading }) => {
  if (loading) return <Spin size="large" spinning={true} style={{ display: 'block', textAlign: 'center' }} />;
  return <>{children}</>;
};

export default WithSpinner;

import React from 'react';
import { Card } from 'antd';
import logo from '../../images/logo.png';

const BasicLayout = ({ content, width }) => {
  if (window.location.pathname === '/register' || window.location.pathname === '/') {
    width = '40rem';
  }
  return (
    <div className="basicLayout">
      <Card className="basicLayoutCard" style={{ maxWidth: width }}>
        <div style={{ width: 'fit-content', margin: '0 auto', marginBottom: '1rem' }}>
          <img src={logo} />
        </div>
        <div>{content}</div>
      </Card>
    </div>
  );
};

export default BasicLayout;

import React from 'react';

const BasicLayout = (content) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f0f2f5',
      }}>
      <Card title={<img src={logo} />} style={{ width: '50%', textAlign: 'center' }}>
        <h2>{content}</h2>
      </Card>
    </div>
  );
};

export default BasicLayout;

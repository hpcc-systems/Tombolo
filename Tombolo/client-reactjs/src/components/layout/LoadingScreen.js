import React from 'react';
import { Card, Spin } from 'antd';
import logo from '../../images/logo.png';

const LoadingScreen = ({ isConnected, statusRetrieved, message }) => {
  return (
    <>
      {/* Loading screens to communicate loading sequence */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: '#f0f2f5',
        }}>
        {!isConnected && statusRetrieved ? (
          <Card title={<img src={logo} />} style={{ width: '50%', textAlign: 'center' }}>
            <h2>
              Tombolo has encountered a network issue, please refresh the page. If the issue persists, contact your
              system administrator.
            </h2>
          </Card>
        ) : (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: '100%',
            }}>
            <div style={{ width: '100%', marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
              <img src={logo} />
            </div>
            <Spin size="large" />
            <div style={{ width: '100%', marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
              <h2>{message}</h2>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LoadingScreen;

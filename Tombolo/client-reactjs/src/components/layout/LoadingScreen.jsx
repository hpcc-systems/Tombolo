import React from 'react';
import { Card, Spin, Button } from 'antd';
import logo from '../../images/logo.png';

import styles from './layout.module.css';
import { ReloadOutlined } from '@ant-design/icons';

const LoadingScreen = ({ isConnected, statusRetrieved, message }) => {
  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <>
      {/* Loading screens to communicate a loading sequence */}
      <div className={styles.loadingScreenContainer}>
        {!isConnected && statusRetrieved ? (
          <Card title={<img src={logo} alt="logo" />} className={styles.errorCard}>
            <h2>
              Tombolo has encountered a network issue, please refresh the page. If the issue persists, contact your
              system administrator.
            </h2>
            <Button type="primary" onClick={refreshPage}>
              <ReloadOutlined />
              Refresh
            </Button>
          </Card>
        ) : (
          <div className={styles.infoDiv}>
            <div className={styles.logo}>
              <img src={logo} alt="logo" />
            </div>
            <Spin size="large" />
            <div className={styles.msg}>
              <h2>{message}</h2>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LoadingScreen;

import React from 'react';
import { Card } from 'antd';
import logo from '../../images/logo.png';

import styles from './common.module.css';

const BasicLayout = ({ content, width }) => {
  return (
    <div className={styles.basicLayout}>
      <Card className={styles.basicLayoutCard} style={{ maxWidth: width }}>
        <div className={styles.basicLayoutCardContent}>
          <img src={logo} />
        </div>
        <div>{content}</div>
      </Card>
    </div>
  );
};

export default BasicLayout;

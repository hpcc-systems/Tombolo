import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import styles from './common.module.css';

const Fallback: React.FC = () => {
  const DELAY = 500; // 500ms
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), DELAY);
    return () => clearTimeout(timer);
  }, []);

  return !visible ? null : (
    <div className={styles.fallbackSpinContainer}>
      <Spin size="large" />
    </div>
  );
};

export default Fallback;

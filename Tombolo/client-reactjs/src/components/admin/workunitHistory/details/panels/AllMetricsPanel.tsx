import React from 'react';
import { Card, Empty } from 'antd';
import styles from '../../workunitHistory.module.css';

interface Props {
  wu: any;
  details: any[];
}

const AllMetricsPanel: React.FC<Props> = ({ wu, details }) => {
  return (
    <div>
      {details.length === 0 ? (
        <Card>
          <Empty description="No metrics available" />
        </Card>
      ) : (
        <Card className={styles.cardMarginBottom16}>All metrics table placeholder</Card>
      )}
    </div>
  );
};

export default AllMetricsPanel;

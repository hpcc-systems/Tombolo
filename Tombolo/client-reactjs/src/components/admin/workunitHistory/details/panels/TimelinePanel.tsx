import React from 'react';
import { Card, Empty } from 'antd';
import styles from '../../workunitHistory.module.css';

interface Props {
  wu: any;
  details: any[];
}

const TimelinePanel: React.FC<Props> = ({ wu, details }) => {
  return (
    <div>
      {/* Placeholder implementation copied from original JSX - keep behaviour identical */}
      {details.length === 0 ? (
        <Card>
          <Empty description="No details available for timeline" />
        </Card>
      ) : (
        <Card className={styles.cardMarginBottom16}>Timeline visualization placeholder</Card>
      )}
    </div>
  );
};

export default TimelinePanel;

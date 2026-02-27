import React from 'react';
import { Card } from 'antd';
import styles from '../../workunitHistory.module.css';

interface Props {
  clusterId: string;
  wuid: string;
  clusterName?: string;
}

const SqlPanel: React.FC<Props> = ({ clusterId, wuid }) => {
  return (
    <div>
      <Card className={styles.cardMarginBottom16}>
        SQL details placeholder for {wuid} on {clusterId}
      </Card>
    </div>
  );
};

export default SqlPanel;

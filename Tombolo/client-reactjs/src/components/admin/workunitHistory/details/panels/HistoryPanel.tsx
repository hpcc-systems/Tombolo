import React, { useEffect, useState } from 'react';
import { Card, Empty } from 'antd';
import styles from '../../workunitHistory.module.css';

interface Props {
  wu: any;
  clusterId?: string;
  clusterName?: string;
}

const HistoryPanel: React.FC<Props> = ({ wu }) => {
  const [historyData, setHistoryData] = useState<any[]>([]);

  useEffect(() => {
    // Original implementation fetched previous runs; keep placeholder behaviour
    setHistoryData([]);
  }, [wu]);

  return (
    <div>
      {historyData.length === 0 ? (
        <Card>
          <Empty description="No previous runs found" />
        </Card>
      ) : (
        <Card className={styles.cardMarginBottom16}>Previous runs table placeholder</Card>
      )}
    </div>
  );
};

export default HistoryPanel;

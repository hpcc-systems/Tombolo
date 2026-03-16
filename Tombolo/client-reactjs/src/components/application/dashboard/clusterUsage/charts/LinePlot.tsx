import React, { useState, useEffect } from 'react';
import { Line } from '@ant-design/plots';
import dayjs from 'dayjs';

interface Props {
  clusterUsageHistory: any[];
}

const LinePlot: React.FC<Props> = ({ clusterUsageHistory }) => {
  const [config, setConfig] = useState<any>({
    data: clusterUsageHistory,
    padding: 'auto',
    xField: 'date',
    yField: 'usage',
    xAxis: { tickCount: clusterUsageHistory?.length },
  });

  useEffect(() => {
    setConfig((prev: any) => ({
      ...prev,
      data: (clusterUsageHistory || []).map((usage: any) => ({
        date: dayjs(usage.date).format('MM-DD-YY'),
        usage: usage.maxUsage,
      })),
    }));
  }, [clusterUsageHistory]);

  return <Line {...config} />;
};

export default LinePlot;

import React, { useState, useEffect } from 'react';
import { Line } from '@ant-design/plots';
const moment = require('moment');

function LinePlot({ clusterUsageHistory }) {
  const [config, setConfig] = useState({
    data: clusterUsageHistory,
    padding: 'auto',
    xField: 'date',
    yField: 'usage',
    // width: '200px',
    xAxis: {
      tickCount: clusterUsageHistory.length,
    },
  });

  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      data: clusterUsageHistory.map((usage) => ({
        date: moment(usage.date).format('MM-DD-YY'),
        usage: usage.maxUsage,
      })),
    }));
  }, [clusterUsageHistory]);

  return <Line {...config} />;
}

export default LinePlot;

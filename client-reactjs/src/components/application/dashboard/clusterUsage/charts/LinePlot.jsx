import React, { useState, useEffect } from 'react';
import { Line } from '@ant-design/plots';
const moment = require('moment');

function LinePlot({ clusterUsageHistory }) {
  const [config, setConfig] = useState({
    data: clusterUsageHistory,
    padding: 'auto',
    xField: 'date',
    yField: 'usage',
    xAxis: {
      tickCount: 5,
    },
  });

  useEffect(() => {
    setConfig((prev) => ({
      ...prev,
      data: clusterUsageHistory.map((usage) => ({
        date: moment(usage.date).format('MM/DD/YY h:mm A'),
        usage: usage.maxUsage,
      })),
    }));
  }, [clusterUsageHistory]);

  return <Line {...config} />;
}

export default LinePlot;

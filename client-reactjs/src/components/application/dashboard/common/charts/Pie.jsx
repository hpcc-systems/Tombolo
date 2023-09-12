import React, { useState, useEffect } from 'react';
import { Pie } from '@ant-design/plots';

function PieChar({ metrics }) {
  const [config, setConfig] = useState({
    appendPadding: 15,
    data: [],
    angleField: 'value',
    colorField: 'type',
    radius: 1,
    label: {
      type: 'inner',
      content: '{percentage}',
    },
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
  });

  useEffect(() => {
    if (metrics.length > 0) {
      const filteredMetrics = [];
      metrics.filter((metric) => {
        if (metric.title !== 'Total') {
          filteredMetrics.push({ type: metric.title, value: metric.description });
        }
      });
      setConfig((prev) => ({ ...prev, data: filteredMetrics }));
    }
  }, [metrics]);

  return <Pie {...config} />;
}

export default PieChar;

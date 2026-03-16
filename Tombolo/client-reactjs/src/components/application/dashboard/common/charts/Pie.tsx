import React, { useState, useEffect } from 'react';
import { Pie } from '@ant-design/plots';

interface Props {
  metrics?: any[];
}

const PieChar: React.FC<Props> = ({ metrics = [] }) => {
  const [config, setConfig] = useState<any>({
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
      const filteredMetrics: any[] = [];
      metrics.filter((metric: any) => {
        if (metric.title !== 'Total') {
          filteredMetrics.push({ type: metric.title, value: metric.description });
        }
      });
      setConfig((prev: any) => ({ ...prev, data: filteredMetrics }));
    }
  }, [metrics]);

  return <Pie {...config} />;
};

export default PieChar;

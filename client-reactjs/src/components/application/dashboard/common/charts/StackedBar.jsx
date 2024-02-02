import React, { useEffect, useState } from 'react';
import { Column } from '@ant-design/plots';

function StackedBar({ stackBarData }) {
  const [config, setConfig] = useState({
    data: [],
    isStack: true,
    xField: 'x',
    yField: 'y',
    seriesField: 'z',
    label: {
      position: 'middle',
      // 'top', 'bottom', 'middle'
      layout: [
        {
          type: 'interval-adjust-position',
        },
        {
          type: 'interval-hide-overlap',
        },
        {
          type: 'adjust-color',
        },
      ],
    },
  });

  useEffect(() => {
    if (stackBarData) {
      setConfig((prev) => ({ ...prev, data: stackBarData }));
    }
  }, [stackBarData]);

  return (
    <>
      <Column {...config} width={800} />
    </>
  );
}

export default StackedBar;

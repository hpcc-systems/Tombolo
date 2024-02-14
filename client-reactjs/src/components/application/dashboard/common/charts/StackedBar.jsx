import React, { useEffect, useState } from 'react';
import { Column } from '@ant-design/plots';

function StackedBar({ stackBarData }) {
  console.log(stackBarData);
  const [config, setConfig] = useState({
    data: [],
    isStack: true,
    xField: 'x',
    yField: 'y',
    seriesField: 'z',
    stack: {
      groupBy: ['x'],
      series: false,
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

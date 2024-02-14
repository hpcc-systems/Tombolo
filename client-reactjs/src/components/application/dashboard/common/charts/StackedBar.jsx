import React, { useEffect, useState } from 'react';
import { Column } from '@ant-design/plots';

function StackedBar({ stackBarData }) {
  const [config, setConfig] = useState({
    data: [],
    xField: 'x',
    yField: 'y',
    colorField: 'z',
    stack: true,
    sort: {
      reverse: true,
      by: 'y',
    },
    axis: {
      y: { labelFormatter: '~s' },
      x: {
        labelSpacing: 4,
        style: {
          labelTransform: 'rotate(90)',
        },
      },
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

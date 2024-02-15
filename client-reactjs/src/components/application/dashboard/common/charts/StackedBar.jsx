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
      y: {
        labelFormatter: '~s',
        labelFontSize: 14,
        labelFillOpacity: 0.85,
        labelStroke: '#000000d9',

        style: {
          fontSize: '2rem',
        },
      },
      x: {
        labelFontSize: 14,
        labelFillOpacity: 0.85,
        labelStroke: '#000000d9',

        labelSpacing: 4,
        style: {},
      },
    },
    legend: {
      color: {
        itemLabelFontSize: 14,
        itemLabelFillOpacity: 1,
        itemLabelFill: '#000000d9',
        size: 100,
        autoWrap: true,
        maxRows: 3,
        cols: 6,
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

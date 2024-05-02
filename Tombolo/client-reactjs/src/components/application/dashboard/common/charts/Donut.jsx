import React, { useEffect, useState } from 'react';
import { Pie } from '@ant-design/plots';

function Donut({ donutData, title }) {
  const [config, setConfig] = useState({
    data: donutData,
    angleField: 'value',
    colorField: 'type',
    paddingRight: 80,
    innerRadius: 0.6,
    label: {
      text: 'value',
      style: {
        fontWeight: '700',
        fontSize: '1.5rem',
      },
    },
    legend: {
      color: {
        title: false,
        position: 'right',
        rowPadding: 0,
      },
    },
    annotations: [
      {
        type: 'text',
        style: {
          text: title,
          x: '50%',
          y: '50%',
          textAlign: 'center',
          fontSize: 40,
          fontStyle: 'bold',
        },
      },
    ],
  });

  useEffect(() => {
    if (donutData) setConfig((prev) => ({ ...prev, data: donutData }));
  }, [donutData]);

  useEffect(() => {
    if (title) {
      setConfig((prev) => ({
        ...prev,
        annotations: [
          {
            type: 'text',
            style: {
              text: title,
              x: '50%',
              y: '50%',
              textAlign: 'center',
              fontSize: 40,
              fontStyle: 'bold',
            },
          },
        ],
      }));
    }
  }, [title]);

  return <Pie {...config} />;
}

export default Donut;

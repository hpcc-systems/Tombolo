import React, { useEffect, useState } from 'react';
import { Pie } from '@ant-design/plots';

interface Props {
  donutData?: any[];
  title?: string;
}

const Donut: React.FC<Props> = ({ donutData = [], title }) => {
  const [config, setConfig] = useState<any>({
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
    if (donutData) setConfig((prev: any) => ({ ...prev, data: donutData }));
  }, [donutData]);

  useEffect(() => {
    if (title) {
      setConfig((prev: any) => ({
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
};

export default Donut;

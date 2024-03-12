/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable unused-imports/no-unused-imports */
import React from 'react';
import { Gauge } from '@ant-design/plots';

const MeterGauge = ({ data }) => {
  //Gauge color
  const gaugeColor = (maxUsage) => {
    if (maxUsage <= 50) {
      return 'green';
    }
    if (maxUsage > 50 && maxUsage < 75) {
      return 'orange';
    }
    if (maxUsage >= 75 && maxUsage <= 100) {
      return 'red';
    }
  };

  const config = {
    width: 300,
    height: 300,
    fill: 'black',
    data: {
      target: data.maxUsage,
      total: 100,
      name: 'Usage',
      threshold: [data.maxUsage, 100],
    },
    scale: {
      color: {
        range: [gaugeColor(data.maxUsage), 'grey'],
      },
      fontSize: 24,
      fill: 'black',
    },
    style: {
      textContent: (target) => `\n${target}%\n${data.engines}`,
      fontSize: 24,
      fontFill: '',
      textSize: 24,
    },
  };

  return (
    <>
      <Gauge {...config} />
    </>
  );
};

export default MeterGauge;

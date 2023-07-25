/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable unused-imports/no-unused-imports */
import React from 'react';
import { Gauge } from '@ant-design/plots';
import { Popover } from 'antd';

const MeterGauge = ({ data }) => {
  // data.maxUsage = Math.floor(Math.random() * 100);

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
    percent: data.maxUsage / 100,
    innerRadius: 0.8,
    range: {
      color: gaugeColor(data.maxUsage),
    },
    indicator: {
      pointer: {
        style: {
          stroke: '#D0D0D0',
        },
      },
      pin: {
        style: {
          stroke: '#D0D0D0',
        },
      },
    },
    axis: {
      label: {
        formatter(v) {
          return Number(v) * 100;
        },
      },
      subTickLine: {
        count: 3,
      },
    },
    statistic: {
      title: {
        formatter: () => {
          return `${data.maxUsage} %`;
        },
        style: () => {
          return {
            fontSize: '16px',
          };
        },
      },
      content: {
        offsetY: 36,
        style: {
          fontSize: '18px',
          color: '#01060d',
        },
        formatter: () => data.name,
      },
    },
  };
  return (
    <Popover
      placement="left"
      content={
        <div>
          <div>Max : {data.maxUsage} % </div>
          <div>Mean: {data.meanUsage} % </div>
        </div>
      }>
      <Gauge {...config} style={{ width: '250px', height: '250px', padding: '20px' }} />
      <></>
    </Popover>
  );
};

export default MeterGauge;

/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable unused-imports/no-unused-imports */
import React from 'react';
import { Gauge } from '@ant-design/plots';
import { Popover } from 'antd';

const MeterGauge = ({ data }) => {
  const config = {
    percent: data.maxUsage / 100,
    type: 'meter',
    innerRadius: 0.75,
    range: {
      ticks: [0, 1 / 3, 2 / 3, 1],
      color: ['#30BF78', '#FAAD14', '#F4664A'],
    },
    indicator: {
      pointer: {
        style: {
          stroke: '#1890ff',
        },
      },
      pin: {
        style: {
          stroke: '#1890ff',
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
        count: 0,
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
          fontSize: '14px',
          color: '#4B535E',
        },
        formatter: () => data.name,
      },
    },
  };
  return (
    <Popover
      content={
        <div>
          <div>Max : {data.maxUsage} % </div>
          <div>Mean: {data.meanUsage} % </div>
        </div>
      }>
      <Gauge {...config} style={{ width: '200px', height: '200px', padding: '20px' }} />
      {/* Bug in antd -  fragment below is required for Pop over to work. */}
      <></>
    </Popover>
  );
};

export default MeterGauge;

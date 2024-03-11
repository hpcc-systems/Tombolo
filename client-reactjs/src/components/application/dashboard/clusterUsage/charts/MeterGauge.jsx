/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable unused-imports/no-unused-imports */
import React from 'react';
import { Gauge } from '@ant-design/plots';
import { Popover } from 'antd';

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
    autoFit: true,
    data: {
      target: 159,
      total: 400,
      name: 'score',
      thresholds: [100, 200, 400],
    },
    legend: false,
    scale: {
      color: {
        range: ['#F4664A', '#FAAD14', 'green'],
      },
    },
    style: {
      textContent: (target, total) => `得分：${target}\n占比：${(target / total) * 100}%`,
    },
  };

  return (
    <Popover
      placement="left"
      content={
        <div>
          <div>Max : {data.maxUsage} % </div>
          <div>Mean: {data.meanUsage} % </div>
          <div>Engine: {data.engines}</div>

          {data.engines.length > 1 ? (
            <>
              <hr />
              <>
                {data.engines.map((engine) => {
                  return <div key={engine}> {engine}</div>;
                })}
              </>
            </>
          ) : null}
        </div>
      }>
      <Gauge {...config} style={{ width: '250px', height: '250px', padding: '20px' }} />

      {data.engines.length > 1 ? (
        <>
          <hr />
          <>
            {data.engines.map((engine) => {
              return <div key={engine}> {engine}</div>;
            })}
          </>
        </>
      ) : null}
    </Popover>
  );
};

export default MeterGauge;

/* eslint-disable prettier/prettier */
import React from 'react';
import { Resizable } from 're-resizable';
// import Pie from './Pie';
import StackedBar from './StackedBar';
import Donut from './Donut';

function WorkUnitCharts({ metrics, stackBarData, groupDataBy, donutData }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
      <Resizable style={{ border: '1px solid lightgray', marginRight: '10px' }}>
        <div style={{ padding: '20px' }}>
          <h3 className="chartLabel">{donutData[donutData.length - 1]?.title}</h3>
          {<Donut donutData={donutData} />}
        </div>
      </Resizable>

      <Resizable style={{ border: '1px solid lightgray', marginRight: '10px' }}>
        <div style={{ padding: '20px' }}>
          <h3 className="chartLabel">{metrics[metrics.length - 1]?.title}</h3>
          {<Donut donutData={metrics} />}{' '}
        </div>
      </Resizable>

      <Resizable style={{ border: '1px solid lightgray', margin: '10px' }}>
        <div style={{ padding: '20px' }}>
          <h3 className="chartLabel">{stackBarData[stackBarData.length - 1]?.title}</h3>
          {<StackedBar stackBarData={stackBarData} groupDataBy={groupDataBy} />}
        </div>
      </Resizable>
    </div>
  );
}

export default WorkUnitCharts;

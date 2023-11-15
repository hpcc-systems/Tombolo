/* eslint-disable prettier/prettier */
import React from 'react';
import { Resizable } from 're-resizable';
import Pie from './Pie';
import StackedBar from './StackedBar';
import Donut from './Donut';

function WorkUnitCharts({ metrics, stackBarData, groupDataBy, donutData }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
      <Resizable style={{ border: '1px solid lightgray', margin: '10px' }}>
        <div style={{ padding: '20px' }}>{<Donut donutData={donutData} />} </div>
      </Resizable>

      <Resizable style={{ border: '1px solid lightgray', margin: '10px' }}>
        <div style={{ padding: '20px' }}>{<Pie metrics={metrics} />} </div>
      </Resizable>

      <Resizable style={{ border: '1px solid lightgray', margin: '10px' }}>
        <div style={{ padding: '20px' }}>{<StackedBar stackBarData={stackBarData} groupDataBy={groupDataBy} />} </div>
      </Resizable>
    </div>
  );
}

export default WorkUnitCharts;

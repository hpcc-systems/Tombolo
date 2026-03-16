import React from 'react';
import { Resizable } from 're-resizable';
import PieChar from './Pie';
import StackedBar from './StackedBar';
import Donut from './Donut';

interface Props {
  metrics?: any[];
  stackBarData?: any[];
  groupDataBy?: string;
  donutData?: any[];
}

const NotificationCharts: React.FC<Props> = ({
  metrics = [],
  stackBarData = [],
  groupDataBy = 'day',
  donutData = [],
}) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
      <Resizable style={{ border: '1px solid lightgray', margin: '10px' }}>
        <div style={{ padding: '20px' }}>{<Donut donutData={donutData} />}</div>
      </Resizable>

      <Resizable style={{ border: '1px solid lightgray', margin: '10px' }}>
        <div style={{ padding: '20px' }}>{<StackedBar stackBarData={stackBarData} groupDataBy={groupDataBy} />}</div>
      </Resizable>

      <Resizable style={{ border: '1px solid lightgray', margin: '10px' }}>
        <div style={{ padding: '20px' }}>{<PieChar metrics={metrics} />}</div>
      </Resizable>
    </div>
  );
};

export default NotificationCharts;

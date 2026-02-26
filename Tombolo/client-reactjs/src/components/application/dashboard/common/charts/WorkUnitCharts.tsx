import React from 'react';
import { Resizable } from 're-resizable';
import StackedBar from './StackedBar';
import Donut from './Donut';

interface Props {
  metrics?: any[];
  stackBarData?: any[];
  groupDataBy?: string;
  donutData?: any[];
  titles?: any;
}

const WorkUnitCharts: React.FC<Props> = ({
  metrics = [],
  stackBarData = [],
  groupDataBy = 'day',
  donutData = [],
  titles = {},
}) => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
      <Resizable style={{ border: '1px solid lightgray', marginRight: '10px' }}>
        <div style={{ padding: '20px' }}>
          <h3 className="chartLabel">{titles?.initial}</h3>
          {<Donut donutData={donutData} title={titles?.initialInner} />}
        </div>
      </Resizable>

      <Resizable style={{ border: '1px solid lightgray', marginRight: '10px' }}>
        <div style={{ padding: '20px' }}>
          <h3 className="chartLabel">{titles?.final}</h3>
          {<Donut donutData={metrics} title={titles?.finalInner} />}{' '}
        </div>
      </Resizable>

      <Resizable style={{ border: '1px solid lightgray', margin: '10px' }}>
        <div style={{ padding: '20px' }}>
          <h3 className="chartLabel">{titles?.stack}</h3>
          {<StackedBar stackBarData={stackBarData} groupDataBy={groupDataBy} />}
        </div>
      </Resizable>
    </div>
  );
};

export default WorkUnitCharts;

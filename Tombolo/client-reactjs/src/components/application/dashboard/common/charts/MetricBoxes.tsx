import React from 'react';
import { Card } from 'antd';
import startCase from 'lodash/startCase';

interface Props {
  metrics: any[];
  bordered?: boolean;
  builds?: any[];
  headStyle?: React.CSSProperties;
}

const MetricBoxes: React.FC<Props> = ({ metrics = [], bordered = false }) => {
  return (
    <div style={{ display: 'flex' }}>
      {metrics.map(metric => {
        const { title } = metric;
        return (
          <Card
            key={metric.title}
            title={startCase(title)}
            style={{ textAlign: 'center', marginRight: '25px' }}
            bordered={bordered}>
            <span style={{ fontSize: '2rem', fontWeight: '700' }}> {metric.description}</span>
          </Card>
        );
      })}
    </div>
  );
};

export default MetricBoxes;

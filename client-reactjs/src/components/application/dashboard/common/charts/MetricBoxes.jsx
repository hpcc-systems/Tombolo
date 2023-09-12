import React from 'react';
import { Card } from 'antd';
import _ from 'lodash';

function MetricBoxes({ metrics }) {
  return (
    <div style={{ display: 'flex' }}>
      {metrics.map((metric) => {
        const { title } = metric;
        return (
          <Card key={metric.title} title={_.startCase(title)} style={{ textAlign: 'center', marginRight: '25px' }}>
            <span style={{ fontSize: '25px', fontWeight: '700' }}> {metric.description}</span>
          </Card>
        );
      })}
    </div>
  );
}

export default MetricBoxes;

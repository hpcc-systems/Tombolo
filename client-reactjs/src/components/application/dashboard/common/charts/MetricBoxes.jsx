import React from 'react';
import { Card } from 'antd';
import _ from 'lodash';

function MetricBoxes({ metrics, bordered, headStyle }) {
  return (
    <div style={{ display: 'flex' }}>
      {metrics.map((metric) => {
        const { title } = metric;
        return (
          <Card
            key={metric.title}
            title={_.startCase(title)}
            style={{ textAlign: 'center', marginRight: '25px' }}
            bordered={bordered}
            headStyle={headStyle}>
            <span style={{ fontSize: '2rem', fontWeight: '700' }}> {metric.description}</span>
          </Card>
        );
      })}
    </div>
  );
}

export default MetricBoxes;

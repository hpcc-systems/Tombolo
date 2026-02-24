import React from 'react';
import { Pie } from '@ant-design/charts';

const NotificationCountByOriginDonut: React.FC<any> = ({ data = [] }: any) => {
  const config = {
    appendPadding: 10,
    data,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: { type: 'inner', offset: '-50%' },
    interactions: [{ type: 'element-active' }],
  };
  return <Pie {...config} />;
};

export default NotificationCountByOriginDonut;

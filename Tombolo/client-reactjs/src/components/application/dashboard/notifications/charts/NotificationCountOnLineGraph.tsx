import React from 'react';
import { Line } from '@ant-design/charts';

const NotificationCountOnLineGraph: React.FC<any> = ({ data = [] }: any) => {
  const config = { data, xField: 'date', yField: 'count', smooth: true };
  return <Line {...config} />;
};

export default NotificationCountOnLineGraph;

import React from 'react';
import { Area } from '@ant-design/charts';

const NotificationCountByProductsInGraph: React.FC<any> = ({ data = [] }: any) => {
  const config = { data, xField: 'product', yField: 'count', seriesField: 'date', smooth: true };
  return <Area {...config} />;
};

export default NotificationCountByProductsInGraph;

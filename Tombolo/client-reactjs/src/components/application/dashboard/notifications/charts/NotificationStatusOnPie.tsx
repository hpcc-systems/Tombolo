import React from 'react';
import { Pie } from '@ant-design/charts';

const NotificationStatusOnPie: React.FC<any> = ({ data = [] }: any) => {
  const config = { data, angleField: 'value', colorField: 'status', radius: 0.8 };
  return <Pie {...config} />;
};

export default NotificationStatusOnPie;

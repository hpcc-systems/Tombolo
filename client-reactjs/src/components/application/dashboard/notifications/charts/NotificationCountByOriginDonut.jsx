// Package imports
import React from 'react';
import { Pie } from '@ant-design/plots';

const NotificationCountByOriginDonut = ({ sentNotifications }) => {
  // Prepare the data
  const originCounts = {};
  sentNotifications.forEach((notification) => {
    if (originCounts[notification.notificationOrigin]) {
      originCounts[notification.notificationOrigin] += 1;
    } else {
      originCounts[notification.notificationOrigin] = 1;
    }
  });

  const data = [];
  Object.keys(originCounts).forEach((origin) => {
    data.push({ origin: origin, count: originCounts[origin] });
  });

  // Configure the chart
  const config = {
    appendPadding: 10,
    data: data,
    angleField: 'count',
    colorField: 'origin',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      type: 'spider',
      offset: '50%',
      content: '{name}\n{value}',
      style: {
        textAlign: 'center',
      },
    },
    interactions: [{ type: 'element-active' }],
  };
  // JSX to render the donut chart
  return <Pie {...config} />;
};

export default NotificationCountByOriginDonut;

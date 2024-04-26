// Package imports
import React from 'react';
import { Pie } from '@ant-design/plots';

const NotificationCountByOriginDonut = ({ sentNotifications, monitorings }) => {
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
    const originName = monitorings.find((monitoring) => monitoring.id === origin)?.name || origin;
    data.push({ origin: originName, count: originCounts[origin] });
  });

  // Configure the chart
  const config = {
    data: data,
    angleField: 'count',
    colorField: 'origin',
    // paddingRight: 80,
    radius: 0.7,
    innerRadius: 0.5,
    // radius: 1,
    // paddingTop: 0,
    label: {
      position: 'spider',
      // text: 'count',
      text: (d) => `${d.count} - ${d.origin}`,
      offset: 50,
    },
    legend: {
      color: {
        title: false,
        position: 'right',
        rowPadding: 5,
      },
    },
    interactions: [{ type: 'element-active' }],
  };
  // JSX to render the donut chart
  return <Pie {...config} />;
};

export default NotificationCountByOriginDonut;

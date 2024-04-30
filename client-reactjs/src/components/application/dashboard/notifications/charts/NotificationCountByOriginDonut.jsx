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
    radius: 0.7,
    innerRadius: 0.5,

    label: {
      position: 'spider',
      text: (d) => `${d.origin} (${d.count})`,
      transform: [
        {
          type: 'overlapHide',
        },
      ],
    },
    tooltip: {
      title: 'origin',
    },
    legend: {
      color: {
        title: false,
        position: 'right',
        rowPadding: 5,
      },
    },
    interactions: [{ type: 'element-active' }],
    annotations: [
      {
        type: 'text',
        style: {
          text: `${sentNotifications?.length}`,
          x: '50%',
          y: '50%',
          textAlign: 'center',
          fontSize: 40,
          fontStyle: 'bold',
        },
      },
    ],
  };
  // JSX to render the donut chart
  return <Pie {...config} />;
};

export default NotificationCountByOriginDonut;

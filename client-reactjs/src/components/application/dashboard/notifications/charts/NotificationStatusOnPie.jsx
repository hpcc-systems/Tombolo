// Package imports
import React from 'react';
import { Pie } from '@ant-design/plots';

function NotificationStatusOnPie({ sentNotifications }) {
  // Count the status occurrences
  const statusCounts = sentNotifications.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  // Transform the counts into the format needed for the chart
  const chartData = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));

  // Configuration
  const config = {
    appendPadding: 10,
    data: chartData,
    angleField: 'count',
    colorField: 'status',
    radius: 0.75,
    label: {
      position: 'spider',
      labelHeight: 50,
      // text: 'count',
      text: (d) => `${d.count} - ${d.status}`,

      style: {
        fontSize: 14,
      },
    },

    legend: {
      color: {
        position: 'right',
        rowPadding: 5,
      },
    },

    interactions: [
      {
        type: 'element-selected',
      },
      {
        type: 'element-active',
      },
    ],
  };

  // JSX to render the pie chart
  return <Pie {...config} />;
}

export default NotificationStatusOnPie;

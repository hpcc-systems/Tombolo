import React from 'react';
import { Line } from '@ant-design/plots';

function NotificationCountOnLineGraph({ sentNotifications }) {
  // Get the date 14 days ago
  const date14DaysAgo = new Date();
  date14DaysAgo.setDate(date14DaysAgo.getDate() - 14);

  // Create an array of all dates within the past 14 days
  const dates = [];
  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  dates.reverse();

  // Initialize the count of each date to 0
  const dailyCounts = dates.reduce((acc, curr) => {
    acc[curr] = 0;
    return acc;
  }, {});

  // Count the notifications sent each day
  sentNotifications.forEach((notification) => {
    const date = notification.createdAt.split('T')[0];
    if (Object.prototype.hasOwnProperty.call(dailyCounts, date)) {
      dailyCounts[date]++;
    }
  });

  // Transform the counts into the format needed for the chart
  const chartData = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

  // Configuration
  const config = {
    data: chartData,
    xField: 'date',
    yField: 'count',
    meta: {
      count: {
        tickInterval: 2,
      },
    },
    point: {
      size: 5,
      shape: 'diamond',
      style: {
        fill: 'white',
        lineWidth: 2,
      },
      tooltip: {
        showMarkers: true,
      },
      interactions: [
        {
          type: 'marker-active',
        },
      ],
    },
    label: {
      position: 'top',
    },
  };

  return <Line {...config} />;
}

export default NotificationCountOnLineGraph;

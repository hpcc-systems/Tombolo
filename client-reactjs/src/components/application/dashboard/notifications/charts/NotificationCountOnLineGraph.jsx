/* eslint-disable unused-imports/no-unused-imports */
/* eslint-disable unused-imports/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Line } from '@ant-design/plots';

function NotificationCountOnLineGraph({ sentNotifications, dashBoardFilter }) {
  const [goBackToDays, setGoBackToDays] = useState(14);

  useEffect(() => {
    if (dashBoardFilter.filterBy === 'days') {
      setGoBackToDays(dashBoardFilter.days);
    }
  }, [dashBoardFilter]);

  // Get the date goBackToDays days ago
  const date14DaysAgo = new Date();
  date14DaysAgo.setDate(date14DaysAgo.getDate() - goBackToDays);

  // Create an array of all dates within the past goBackToDays days
  const dates = [];
  if (dashBoardFilter.filterBy === 'days') {
    for (let i = 0; i < goBackToDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
  } else {
    const { range } = dashBoardFilter;
    let currentDate = new Date(range[1]); // start from date2

    while (currentDate >= range[0]) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() - 1); // go back one day
    }
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

  // Iterate through chart data and convert date to short date
  chartData.forEach((data) => {
    const date = new Date(data.date);
    data.date = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  });

  // Configuration
  const config = {
    data: chartData,
    xField: 'date',
    yField: 'count',

    point: {
      shapeField: 'diamond',
      sizeField: 4,
    },
    label: {
      position: 'right',
      style: {
        padding: 10,
      },
    },
  };

  return <Line {...config} />;
}

export default NotificationCountOnLineGraph;

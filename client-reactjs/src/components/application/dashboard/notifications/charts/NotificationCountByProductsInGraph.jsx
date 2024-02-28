//Package imports
import React from 'react';
import { Column } from '@ant-design/charts';

function NotificationCountByProductsInGraph({ sentNotifications }) {
  // Prepare the data
  const chartData = [];
  sentNotifications.forEach((notification) => {
    if (notification.metaData && notification.metaData.asrSpecificMetaData) {
      const category = notification.metaData.asrSpecificMetaData.productCategory;
      const status = notification.status;
      chartData.push({ category, status, count: 1 });
    }
  });

  // Calculate the number of unique categories
  const uniqueCategories = new Set(chartData.map((data) => data.category)).size;

  const config = {
    data: chartData,
    isStack: true,
    xField: 'category',
    yField: 'count',
    seriesField: 'status',
    columnWidthRatio: uniqueCategories < 3 ? 0.2 : 0.6, // Done this to avoid column being too wide when there are few categories
    meta: {
      count: {
        tickInterval: 5,
      },
    },
    label: {
      position: 'middle',
      layout: [
        {
          type: 'interval-adjust-position',
        },
        {
          type: 'interval-hide-overlap',
        },
        {
          type: 'adjust-color',
        },
      ],
    },
  };

  return <Column {...config} />;
}

export default NotificationCountByProductsInGraph;

//Package imports
import React from 'react';
import { Column } from '@ant-design/charts';

function NotificationCountByProductsInGraph({ sentNotifications }) {
  // Prepare the data
  let chartData = [];
  sentNotifications.forEach((notification) => {
    if (notification.metaData && notification.metaData.asrSpecificMetaData) {
      const category = notification.metaData.asrSpecificMetaData.productCategory;
      const status = notification.status;
      chartData.push({ category, status, count: 1 });
    }
  });

  let data = Object.values(
    chartData.reduce((acc, { category, status, count }) => {
      let key = `${category}|${status}`;
      if (!acc[key]) {
        acc[key] = { category, status, count };
      } else {
        acc[key].count += count;
      }
      return acc;
    }, {})
  );

  const config = {
    data: data,
    xField: 'category',
    yField: 'count',
    stack: true,
    colorField: 'status',
    columnWidthRatio: 0.1,
    autoFit: true,

    style: {
      maxWidth: 150,
    },
    label: {
      position: 'inside',
      text: (d) => `${d.count}`,
      textBaseline: 'middle',
    },
    legend: {
      color: {
        title: false,
        position: 'right',
        rowPadding: 5,
      },
    },
  };

  return <Column {...config} />;
}

export default NotificationCountByProductsInGraph;

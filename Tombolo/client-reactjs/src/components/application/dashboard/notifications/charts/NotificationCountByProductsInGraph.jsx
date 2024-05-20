//Package imports
import React from 'react';
import { Column } from '@ant-design/charts';

function NotificationCountByProductsInGraph({ sentNotifications, productCategories }) {
  // Prepare the data
  let chartData = [];
  sentNotifications.forEach((notification) => {
    if (notification.metaData && notification.metaData.asrSpecificMetaData) {
      const category = notification.metaData.asrSpecificMetaData.productCode || 'ACU';
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

  // replace ids of the products by its name
  data.forEach((d) => {
    d.category = productCategories.find((product) => product.id === d.category)?.name || d.category;
  });

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

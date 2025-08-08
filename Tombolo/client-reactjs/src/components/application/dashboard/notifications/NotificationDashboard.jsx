// Package imports
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Empty } from 'antd';

// Local Imports
import NotificationStatusOnPie from './charts/NotificationStatusOnPie';
import NotificationCountOnLineGraph from './charts/NotificationCountOnLineGraph';
import NotificationCountByProductsInGraph from './charts/NotificationCountByProductsInGraph';
import NotificationCountByOriginDonut from './charts/NotificationCountByOriginDonut';
import styles from './notifications.module.css';

function NotificationDashboard({ sentNotifications, dashBoardFilter, monitorings, productCategories }) {
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const allIntegrations = useSelector((state) => state.application.integrations);

  const integrationCodes = allIntegrations.map((integration) => integration.name);

  // Effects
  useEffect(() => {
    let filtered;
    if (dashBoardFilter.filterBy === 'days') {
      const date = new Date();
      date.setDate(date.getDate() - dashBoardFilter.days);
      filtered = sentNotifications.filter((notification) => new Date(notification.createdAt) > date);
    }
    if (dashBoardFilter.filterBy === 'range' && dashBoardFilter.range[0] != null && dashBoardFilter.range[1] != null) {
      const rangeStart = new Date(dashBoardFilter.range[0]).getTime();
      const rangeEnd = new Date(dashBoardFilter.range[1]).getTime();
      filtered = sentNotifications.filter((notification) => {
        const createdAt = new Date(notification.createdAt).getTime();
        return createdAt >= rangeStart && createdAt <= rangeEnd;
      });
    }

    setFilteredNotifications(filtered);
  }, [dashBoardFilter, sentNotifications]);

  return (
    <div className={styles.notifications_dashboard}>
      {filteredNotifications.length === 0 ? (
        <div className={styles.notifications_dashboard__empty_charts}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <>
          <div className={styles.notifications_chart_card}>
            <div className={styles.notifications_chart_title}>Notification Count by Origin </div>
            <NotificationCountByOriginDonut sentNotifications={filteredNotifications} monitorings={monitorings} />
          </div>
          <div className={styles.notifications_chart_card}>
            <div className={styles.notifications_chart_title}>Distribution of Notifications by Status</div>
            <NotificationStatusOnPie sentNotifications={filteredNotifications} />
          </div>

          <div className={styles.notifications_chart_card}>
            <div className={styles.notifications_chart_title}>Notification Count by Day </div>
            <NotificationCountOnLineGraph sentNotifications={filteredNotifications} dashBoardFilter={dashBoardFilter} />
          </div>

          {integrationCodes.includes('ASR') && (
            <div className={styles.notifications_chart_card}>
              <div className={styles.notifications_chart_title}>Notifications by Product with Status Count</div>
              <NotificationCountByProductsInGraph
                sentNotifications={filteredNotifications}
                productCategories={productCategories}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default NotificationDashboard;

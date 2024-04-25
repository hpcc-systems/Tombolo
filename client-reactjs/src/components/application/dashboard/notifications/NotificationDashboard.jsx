// Package imports
import React, { useState, useEffect } from 'react';
import { Empty } from 'antd';

// Local Imports
import NotificationStatusOnPie from './charts/NotificationStatusOnPie';
import NotificationCountOnLineGraph from './charts/NotificationCountOnLineGraph';
import NotificationCountByProductsInGraph from './charts/NotificationCountByProductsInGraph';
import NotificationCountByOriginDonut from './charts/NotificationCountByOriginDonut';

function NotificationDashboard({ sentNotifications, dashBoardFilter }) {
  const [filteredNotifications, setFilteredNotifications] = useState([]);

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
    <div className="notifications_dashboard">
      {filteredNotifications.length === 0 ? (
        <div className="notifications_dashboard__empty_charts">
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </div>
      ) : (
        <>
          <div className="notifications_chart_card">
            <div className="notifications_chart_title">Notification Count by Origin </div>
            <NotificationCountByOriginDonut sentNotifications={filteredNotifications} />
          </div>
          <div className="notifications_chart_card">
            <div className="notifications_chart_title">Distribution of Notifications by Status</div>
            <NotificationStatusOnPie sentNotifications={filteredNotifications} />
          </div>

          <div className="notifications_chart_card">
            <div className="notifications_chart_title">Notification Count by Day </div>
            <NotificationCountOnLineGraph sentNotifications={filteredNotifications} dashBoardFilter={dashBoardFilter} />
          </div>

          <div className="notifications_chart_card">
            <div className="notifications_chart_title">Notifications by Product with Status Count</div>
            <NotificationCountByProductsInGraph sentNotifications={filteredNotifications} />
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationDashboard;

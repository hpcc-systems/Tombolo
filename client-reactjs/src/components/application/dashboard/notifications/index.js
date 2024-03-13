import React, { useEffect, useState } from 'react';
import { Tabs, Empty, Spin, Button, Space } from 'antd';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import dayjs from 'dayjs';

import NotificationsTable from './NotificationsTable';
import NotificationCharts from '../common/charts/NotificationCharts';
import Filters from './Filters';
import MetricBoxes from '../common/charts/MetricBoxes';
import '../common/css/index.css';
import { authHeader, handleError } from '../../../common/AuthHeader.js';
import { camelToTitleCase } from '../../../common/CommonUtil';
import ExportMenu from '../ExportMenu/ExportMenu';
import BulkActions from './BulkActions';

function Index() {
  const [notifications, setNotifications] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [stackBarData, setStackBarData] = useState([]);
  const [donutData, setDonutData] = useState([]);
  const [groupDataBy, setGroupDataBy] = useState('day');
  const [selectedNotificationsForBulkAction, setSelectedNotificationForBulkAction] = useState([]);
  const [bulkActionModalVisible, setBulkActionModalVisibility] = useState(false);
  const [updatedNotificationInDb, setUpdatedNotificationInDb] = useState(null);

  const {
    application: { applicationId },
  } = useSelector((item) => item.applicationReducer);

  // Default filters to fetch notifications
  const [defaultFilters, setDefaultFilters] = useState({
    monitoringType: ['jobMonitoring', 'file', 'cluster', 'superFile', 'megaphone', 'orbitMonitoring'],
    monitoringStatus: ['notified', 'triage', 'completed', 'inProgress'],
    dateRange: [dayjs().subtract(15, 'days'), dayjs()],
    applicationId,
  });

  useEffect(() => {
    const groupedData = notifications.map((notification) => {
      const weekStart = dayjs(notification.createdAt).startOf('week').format('MM/DD/YY');
      const weekEnd = dayjs(notification.createdAt).endOf('week').format('MM/DD/YY');
      const updatedItem = { ...notification };
      updatedItem.createdAt = `${weekStart} - ${weekEnd}`;
      return updatedItem;
    });

    setStackBarData(groupedData);
  }, [groupDataBy]);

  // When component loads create filter to load initial data
  useEffect(() => {
    if (applicationId) {
      filterAndFetchNotifications(defaultFilters);
    }
  }, [applicationId]);

  // When notification changes run
  useEffect(() => {
    if (notifications.length > 0) {
      const newMetrics = []; // Pie and card data
      const newStackBarData = []; // Stack bar Data
      const newDonutData = []; // Donut data

      newMetrics.push({ title: 'Total', description: notifications.length });

      const notificationCountByStatus = {};
      const notificationCountByMonitoringType = {};

      //---------------------------------------
      let data;
      switch (groupDataBy) {
        case 'week':
          data = notifications.map((notification) => {
            const weekStart = dayjs(notification.createdAt).startOf('week').format('MM/DD/YY');
            const weekEnd = dayjs(notification.createdAt).endOf('week').format('MM/DD/YY');
            const updatedItem = { ...notification };
            updatedItem.createdAt = `${weekStart} - ${weekEnd}`;
            return updatedItem;
          });
          break;

        case 'month':
          data = notifications.map((notification) => {
            const updatedItem = { ...notification };
            updatedItem.createdAt = dayjs(dayjs(notification.createdAt).utc(), 'MM/DD/YYYY').format('MMMM YYYY');
            return updatedItem;
          });
          break;

        case 'quarter':
          data = notifications.map((notification) => {
            const updatedItem = { ...notification };
            const date = dayjs.utc(notification.createdAt);
            const year = date.year();
            const quarter = Math.ceil((date.month() + 1) / 3);
            updatedItem.createdAt = `${year} - Q${quarter}`;
            return updatedItem;
          });
          break;

        case 'year':
          data = notifications.map((notification) => {
            const updatedItem = { ...notification };
            const date = dayjs.utc(notification.createdAt);
            const year = date.year();
            updatedItem.createdAt = year;
            return updatedItem;
          });
          break;

        default:
          data = notifications;
      }
      //---------------------------------------
      data.forEach((notification) => {
        if (notificationCountByStatus[notification?.status]) {
          const newCount = notificationCountByStatus[notification.status] + 1;
          notificationCountByStatus[notification.status] = newCount;
        } else {
          notificationCountByStatus[notification?.status] = 1;
        }

        if (groupDataBy == 'day') {
          newStackBarData.push({
            x: notification.createdAt.split('T')[0],
            y: 1,
            z: camelToTitleCase(notification.status),
          });
        } else {
          newStackBarData.push({ x: notification.createdAt, y: 1, z: camelToTitleCase(notification?.status) });
        }

        // notificationCountByMonitoringType;
        const { monitoring_type } = notification;
        if (notificationCountByMonitoringType[monitoring_type]) {
          notificationCountByMonitoringType[monitoring_type] = notificationCountByMonitoringType[monitoring_type] + 1;
        } else {
          notificationCountByMonitoringType[monitoring_type] = 1;
        }
      });

      //---------------------------------------
      for (let key in notificationCountByStatus) {
        newMetrics.push({ title: camelToTitleCase(key), description: notificationCountByStatus[key] });
      }
      //---------------------------------------
      for (let key in notificationCountByMonitoringType) {
        newDonutData.push({ type: camelToTitleCase(key), value: notificationCountByMonitoringType?.[key] });
      }
      //---------------------------------------

      setMetrics(newMetrics);
      setStackBarData(newStackBarData);
      setDonutData(newDonutData);
    }
  }, [notifications, groupDataBy]);

  //Get list of file monitorings that matches a filter
  const filterAndFetchNotifications = async (filters) => {
    try {
      setLoadingData(true);
      const payload = {
        method: 'GET',
        header: authHeader(),
      };
      const queryData = JSON.stringify({ ...filters, applicationId });

      const response = await fetch(`/api/notifications/read/filteredNotifications?queryData=${queryData}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      message.error('Failed to fetch notifications');
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div>
      <Tabs
        type="card"
        tabBarExtraContent={
          <Space>
            <Button
              type="primary"
              ghost
              disabled={selectedNotificationsForBulkAction.length > 0 ? false : true}
              onClick={() => {
                setBulkActionModalVisibility(true);
              }}>
              Actions
            </Button>
            <ExportMenu />
          </Space>
        }>
        <Tabs.TabPane key="1" tab="Notifications">
          <NotificationsTable
            applicationId={applicationId}
            setSelectedNotificationForBulkAction={setSelectedNotificationForBulkAction}
            updatedNotificationInDb={updatedNotificationInDb}
          />
          {bulkActionModalVisible ? (
            <BulkActions
              setBulkActionModalVisibility={setBulkActionModalVisibility}
              selectedNotificationsForBulkAction={selectedNotificationsForBulkAction}
              setUpdatedNotificationInDb={setUpdatedNotificationInDb}
            />
          ) : null}
        </Tabs.TabPane>
        <Tabs.TabPane key="2" tab="Dashboard">
          <Filters
            applicationId={applicationId}
            setNotifications={setNotifications}
            setLoadingData={setLoadingData}
            groupDataBy={groupDataBy}
            setGroupDataBy={setGroupDataBy}
            setDefaultFilters={setDefaultFilters}
          />

          {notifications.length > 0 ? (
            <div className="notifications__charts">
              <MetricBoxes metrics={metrics} notifications={notifications} />
              <NotificationCharts
                metrics={metrics}
                stackBarData={stackBarData}
                setGroupDataBy={setGroupDataBy}
                groupDataBy={groupDataBy}
                donutData={donutData}
              />
            </div>
          ) : loadingData ? (
            <div style={{ width: '82%', textAlign: 'center', marginTop: '50px' }}>
              <Spin />
            </div>
          ) : (
            <Empty style={{ marginTop: '150px', width: '82%' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default Index;

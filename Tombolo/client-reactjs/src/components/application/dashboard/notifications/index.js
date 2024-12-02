// Package imports
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Tabs, Space, message } from 'antd';

import SentNotificationsTable from './NotificationsTable';
import NotificationDashboard from './NotificationDashboard';
import NotificationActions from './BulkActions';
import { getAllSentNotifications, getAllMonitorings, getAllDomains, getAllProductCategories } from './notificationUtil';
import NotificationDetailsModal from './NotificationDetailsModal';
import CreateNotificationModal from './CreateNotificationModal';
import UpdateNotificationModal from './UpdateNotification';
import NotificationTableFilters from './NotificationTableFilters';
import NotificationsSearch from './NotificationsSearch';
import NotificationDashboardFilter from './NotificationDashboardFilter';
import './notifications.css';

const Index = () => {
  //Local states
  const [sentNotifications, setSentNotifications] = useState([]);
  const [monitorings, setMonitorings] = useState([]);
  const [filteredNotification, setFilteredNotification] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [selectedNotificationsIds, setSelectedNotificationsIds] = useState([]);
  const [displayNotificationDetailsModal, setDisplayNotificationDetailsModal] = useState(false);
  const [displayCreateNotificationModal, setDisplayCreateNotificationModal] = useState(false);
  const [displayUpdateModal, setDisplayUpdateModal] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [activeTab, setActiveTabKey] = useState('1');
  const [dashBoardFilter, setDashBoardFilter] = useState({
    filterBy: 'days',
    days: 14,
    range: [null, null],
    filterLabel: 'Last 14 days',
  });
  const [domains, setDomains] = useState([]);
  const [productCategories, setProductCategories] = useState([]);

  //Redux
  const { applicationId } = useSelector((state) => state.applicationReducer.application);

  // When the component loads
  useEffect(() => {
    if (!applicationId) return;

    //Get all sent notifications
    (async () => {
      try {
        const data = await getAllSentNotifications({ applicationId });
        setSentNotifications(data);
      } catch (error) {
        message.error('Unable to fetch  notifications');
      }
    })();
  }, [applicationId]);

  // When component loads check if filters visibility is set in local storage
  useEffect(() => {
    const filtersVisibility = localStorage.getItem('filtersVisible');
    if (filtersVisibility) {
      setFiltersVisible(filtersVisibility === 'true');
    }

    // Get all activity types [monitoring types]
    (async () => {
      try {
        const response = await getAllMonitorings();
        setMonitorings(response);
      } catch (error) {
        message.error('Failed to fetch activity types');
      }
    })();

    // Get all domains
    (async () => {
      try {
        const response = await getAllDomains();
        setDomains(response);
      } catch (error) {
        message.error('Failed to fetch domains');
      }
    })();

    // Get all product categories
    (async () => {
      try {
        const response = await getAllProductCategories();
        setProductCategories(response);
      } catch (error) {
        message.error('Failed to fetch product categories');
      }
    })();
  }, []);

  useEffect(() => {
    // Calculate the number of matched string instances
    if (searchTerm) {
      let instanceCount = 0;
      sentNotifications.forEach((notification) => {
        const searchableNotificationId = notification?.searchableNotificationId.toLocaleLowerCase();
        const modifiedBy = JSON.stringify(notification?.updatedBy?.name || '').toLocaleLowerCase();
        // const contacts = JSON.stringify(notification?.recipients || '').toLocaleLowerCase();

        if (searchableNotificationId.includes(searchTerm)) {
          instanceCount++;
        }

        if (modifiedBy.includes(searchTerm)) {
          instanceCount++;
        }
        // if (contacts.includes(searchTerm)) {
        //   instanceCount++;
        // }
      });

      setMatchCount(instanceCount);
    } else {
      setMatchCount(0);
    }

    //When the filters change or sentNotifications change calculate the filtered notifications
    const filteredNotifications = sentNotifications.filter((notification) => {
      let isFiltered = true;

      const searchableNotificationId = notification?.searchableNotificationId.toLocaleLowerCase();
      const modifiedBy = JSON.stringify(notification?.updatedBy?.name || '').toLocaleLowerCase();
      const contacts = JSON.stringify(notification?.recipients || '').toLocaleLowerCase();

      // if search term matches searchableNotificationId or  modifiedBy display only those if search term is null do not run this logic
      if (searchTerm) {
        isFiltered =
          isFiltered &&
          (searchableNotificationId.includes(searchTerm) ||
            modifiedBy.includes(searchTerm) ||
            contacts.includes(searchTerm));
      }

      //Filter by created date
      if (filters.createdBetween) {
        isFiltered =
          isFiltered &&
          new Date(notification.createdAt) >= filters.createdBetween[0] &&
          new Date(notification.createdAt) <= filters.createdBetween[1];
      }

      //Filter by origin
      if (filters.origin) {
        isFiltered = isFiltered && notification.notificationOrigin === filters.origin;
      }

      //Filter by status
      if (filters.status) {
        isFiltered = isFiltered && notification.status === filters.status;
      }

      //Filter by domain
      if (filters.domain) {
        isFiltered = isFiltered && notification?.metaData?.asrSpecificMetaData?.domain === filters.domain;
      }

      //Filter by product
      if (filters.product) {
        isFiltered = isFiltered && notification?.metaData?.asrSpecificMetaData?.productCategory === filters.product;
      }

      return isFiltered;
    });

    setFilteredNotification(filteredNotifications);
  }, [sentNotifications, filters, searchTerm]);

  // Handle Tab change function
  const handleTabChange = (key) => {
    setActiveTabKey(key);
  };

  return (
    <div>
      <Tabs
        defaultActiveKey={activeTab}
        className="notification-tabs"
        onChange={handleTabChange}
        tabBarExtraContent={
          <Space size="small">
            {activeTab === '1' && (
              <>
                <NotificationsSearch
                  width="600px"
                  setSearchTerm={setSearchTerm}
                  matchCount={matchCount}
                  searchTerm={searchTerm}
                />
                <NotificationActions
                  selectedNotificationsIds={selectedNotificationsIds}
                  setSelectedNotificationsIds={setSelectedNotificationsIds}
                  setNotifications={setSentNotifications}
                  setDisplayCreateNotificationModal={setDisplayCreateNotificationModal}
                  setDisplayUpdateModal={setDisplayUpdateModal}
                  setFiltersVisible={setFiltersVisible}
                  filtersVisible={filtersVisible}
                />
              </>
            )}
            {activeTab === '2' && (
              <NotificationDashboardFilter setDashBoardFilter={setDashBoardFilter} dashBoardFilter={dashBoardFilter} />
            )}

            {/* <ExportMenu /> */}
          </Space>
        }
        items={[
          {
            label: 'Logged Notifications',
            key: '1',
            children: (
              <>
                {filtersVisible && (
                  <NotificationTableFilters
                    filters={filters}
                    setFilters={setFilters}
                    sentNotifications={sentNotifications}
                    monitorings={monitorings}
                    domains={domains}
                    productCategories={productCategories}
                  />
                )}

                <SentNotificationsTable
                  sentNotifications={filteredNotification}
                  setSentNotifications={setSentNotifications}
                  selectedNotificationsIds={selectedNotificationsIds}
                  setSelectedNotificationsIds={setSelectedNotificationsIds}
                  setSelectedNotification={setSelectedNotification}
                  setDisplayNotificationDetailsModal={setDisplayNotificationDetailsModal}
                  setDisplayUpdateModal={setDisplayUpdateModal}
                  filters={filters}
                  searchTerm={searchTerm}
                  monitorings={monitorings}
                />
              </>
            ),
          },
          {
            label: 'Dashboard',
            key: '2',
            children: (
              <>
                {/* When tab are switched, the canvas size of the charts change causing the charts to resize for unknown reason. As a result, the charts are 
                not displayed properly. Re-rendering all the charts when user is in tab 2 and ejecting them when user moves to different tab as workaround to fix the issue. */}
                {activeTab === '2' && (
                  <NotificationDashboard
                    sentNotifications={sentNotifications}
                    dashBoardFilter={dashBoardFilter}
                    monitorings={monitorings}
                    productCategories={productCategories}
                  />
                )}
              </>
            ),
          },
        ]}></Tabs>

      {displayNotificationDetailsModal && (
        <NotificationDetailsModal
          selectedNotification={selectedNotification}
          displayNotificationDetailsModal={displayNotificationDetailsModal}
          setDisplayNotificationDetailsModal={setDisplayNotificationDetailsModal}
          setSelectedNotification={setSelectedNotification}
          monitorings={monitorings}
          domains={domains}
          productCategories={productCategories}
          setDisplayUpdateModal={setDisplayUpdateModal}
          setSelectedNotificationsIds={setSelectedNotificationsIds}
        />
      )}

      {displayCreateNotificationModal && (
        <CreateNotificationModal
          displayCreateNotificationModal={displayCreateNotificationModal}
          setDisplayCreateNotificationModal={setDisplayCreateNotificationModal}
          setNotifications={setSentNotifications}
          setSentNotifications={setSentNotifications}
          monitorings={monitorings}
        />
      )}

      {displayUpdateModal && (
        <UpdateNotificationModal
          displayUpdateModal={displayUpdateModal}
          setDisplayUpdateModal={setDisplayUpdateModal}
          selectedNotificationsIds={selectedNotificationsIds}
          setSelectedNotification={setSelectedNotification}
          setSentNotifications={setSentNotifications}
          sentNotifications={sentNotifications}
          setSelectedNotificationsIds={setSelectedNotificationsIds}
          selectedNotification={selectedNotification}
        />
      )}
    </div>
  );
};

export default Index;

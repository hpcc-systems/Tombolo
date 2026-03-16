import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Tabs, Space } from 'antd';

import { getRoleNameArray } from '../../../common/AuthUtil';
import { handleError } from '@/components/common/handleResponse';
import SentNotificationsTable from './NotificationsTable';
import NotificationDashboard from './NotificationDashboard';
import NotificationActions from './BulkActions';
import notificationsService from '@/services/notifications.service';
import asrService from '@/services/asr.service';
import monitoringTypeService from '@/services/monitoringType.service';
import NotificationDetailsModal from './NotificationDetailsModal';
import CreateNotificationModal from './CreateNotificationModal';
import UpdateNotificationModal from './UpdateNotification';
import NotificationTableFilters from './NotificationTableFilters';
import NotificationsSearch from './NotificationsSearch';
import NotificationDashboardFilter from './NotificationDashboardFilter';

const Index: React.FC = () => {
  const [sentNotifications, setSentNotifications] = useState<any[]>([]);
  const [monitorings, setMonitorings] = useState<any[]>([]);
  const [filteredNotification, setFilteredNotification] = useState<any[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [selectedNotificationsIds, setSelectedNotificationsIds] = useState<any[]>([]);
  const [displayNotificationDetailsModal, setDisplayNotificationDetailsModal] = useState(false);
  const [displayCreateNotificationModal, setDisplayCreateNotificationModal] = useState(false);
  const [displayUpdateModal, setDisplayUpdateModal] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(true);
  const [filters, setFilters] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [matchCount, setMatchCount] = useState(0);
  const [activeTab, setActiveTabKey] = useState('1');
  const [dashBoardFilter, setDashBoardFilter] = useState<any>({
    filterBy: 'days',
    days: 14,
    range: [null, null],
    filterLabel: 'Last 14 days',
  });
  const [domains, setDomains] = useState<any[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);

  const roleArray = getRoleNameArray();
  const isReader = roleArray.includes('reader') && roleArray.length === 1;

  const applicationId = useSelector((state: any) => state.application.application.applicationId);

  useEffect(() => {
    if (!applicationId) return;

    (async () => {
      try {
        const data = await notificationsService.getAllSentNotifications(applicationId);
        setSentNotifications(data);
      } catch (_error) {
        handleError('Unable to fetch  notifications');
      }
    })();
  }, [applicationId]);

  useEffect(() => {
    const filtersVisibility = localStorage.getItem('filtersVisible');
    if (filtersVisibility) setFiltersVisible(filtersVisibility === 'true');

    (async () => {
      try {
        const response = await monitoringTypeService.getAll();
        setMonitorings(response);
      } catch (_error) {
        handleError('Failed to fetch activity types');
      }
    })();

    (async () => {
      try {
        const response = await asrService.getAllDomains();
        setDomains(response);
      } catch (_error) {
        handleError('Failed to fetch domains');
      }
    })();

    (async () => {
      try {
        const response = await asrService.getAllProductCategories();
        setProductCategories(response);
      } catch (_error) {
        handleError('Failed to fetch product categories');
      }
    })();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      let instanceCount = 0;
      sentNotifications.forEach((notification: any) => {
        const searchableNotificationId = notification?.searchableNotificationId.toLocaleLowerCase();
        const modifiedBy = JSON.stringify(notification?.updatedBy?.name || '').toLocaleLowerCase();

        if (searchableNotificationId.includes(searchTerm)) instanceCount++;
        if (modifiedBy.includes(searchTerm)) instanceCount++;
      });

      setMatchCount(instanceCount);
    } else setMatchCount(0);

    const filteredNotifications = sentNotifications.filter((notification: any) => {
      let isFiltered = true;

      const searchableNotificationId = notification?.searchableNotificationId.toLocaleLowerCase();
      const modifiedBy = JSON.stringify(notification?.updatedBy?.name || '').toLocaleLowerCase();
      const contacts = JSON.stringify(notification?.recipients || '').toLocaleLowerCase();

      if (searchTerm) {
        isFiltered =
          isFiltered &&
          (searchableNotificationId.includes(searchTerm) ||
            modifiedBy.includes(searchTerm) ||
            contacts.includes(searchTerm));
      }

      if (filters.createdBetween) {
        isFiltered =
          isFiltered &&
          new Date(notification.createdAt) >= filters.createdBetween[0] &&
          new Date(notification.createdAt) <= filters.createdBetween[1];
      }

      if (filters.origin) isFiltered = isFiltered && notification.notificationOrigin === filters.origin;
      if (filters.status) isFiltered = isFiltered && notification.status === filters.status;
      if (filters.domain)
        isFiltered = isFiltered && notification?.metaData?.asrSpecificMetaData?.domain === filters.domain;
      if (filters.product)
        isFiltered = isFiltered && notification?.metaData?.asrSpecificMetaData?.productCategory === filters.product;

      return isFiltered;
    });

    setFilteredNotification(filteredNotifications);
  }, [sentNotifications, filters, searchTerm]);

  const handleTabChange = (key: string) => setActiveTabKey(key);

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
                  isReader={isReader}
                />
              </>
            )}
            {activeTab === '2' && (
              <NotificationDashboardFilter setDashBoardFilter={setDashBoardFilter} dashBoardFilter={dashBoardFilter} />
            )}
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
                  isReader={isReader}
                />
              </>
            ),
          },
          {
            label: 'Dashboard',
            key: '2',
            children: (
              <>
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

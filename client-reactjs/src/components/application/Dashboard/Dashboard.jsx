import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import BreadCrumbs from '../../common/BreadCrumbs';
import Text from '../../common/Text';
import { Button, Menu, Dropdown, message } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { authHeader, handleError } from '../../common/AuthHeader.js';

import { CSVLink, CSVDownload } from 'react-csv';

const csvData = [
  ['firstname', 'lastname', 'email'],
  ['Ahmed', 'Tomi', 'ah@smthing.co.com'],
  ['Raed', 'Labes', 'rl@smthing.co.com'],
  ['Yezzi', 'Min l3b', 'ymin@cocococo.com'],
];
<CSVLink data={csvData}>Download me</CSVLink>;
// or
<CSVDownload data={csvData} target="_blank" />;

function Dashboard() {
  const {
    application: { applicationId },
  } = useSelector((state) => state.applicationReducer);

  const [notifications, setNotifications] = useState();
  const [csvData, setCsvData] = useState(null);
  const [jsonData, setJsonData] = useState(null);

  //need this to simulate click
  const csvRef = useRef(null);
  const jsonRef = useRef(null);

  useEffect(() => {}, [notifications, csvData, jsonData, csvRef]);

  const handleMenuClick = async (e) => {
    await exportData(e.key);

    //simulate click if CSV is chosen
    if (csvRef && csvRef.current && csvRef.current.link && e.key === 'CSV') {
      csvRef.current.link.click();
    }

    //simulate click is json is chosen
    if (jsonRef && e.key === 'JSON') {
      jsonRef.current.click();
    }

    setCsvData(null);
    setJsonData(null);
  };

  const exportData = async (type) => {
    const data = await getNotifications();

    let output = [];
    data.map((notification) => {
      output.push({
        ID: notification.id,
        MonitoringID: notification.monitoring_id,
        Channel: notification.notification_channel,
        Reason: notification.notification_reason,
        Status: notification.status,
        Created: notification.createdAt,
        Deleted: notification.deletedAt,
      });
    });

    if (type === 'CSV') {
      await setCsvData(output);
      return;
    }

    if (type === 'JSON') {
      await setJsonData(output);
      return;
    }
  };

  //Get list of all file monitoring
  const getNotifications = async () => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      const response = await fetch(`/api/notifications/read/${applicationId}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();

      setNotifications(data);
      return data;
    } catch (error) {
      message.error('Failed to fetch notifications');
    }
  };

  const menu = (
    <Menu onClick={(e) => handleMenuClick(e)}>
      <Menu.Item key="CSV">
        <i className="fa fa-lg fa-file"></i> {<Text text="CSV" />}
      </Menu.Item>
      <Menu.Item key="JSON">
        <i className="fa  fa-lg fa-file-text-o"></i> {<Text text="JSON" />}
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      <BreadCrumbs
        extraContent={
          <>
            <Dropdown overlay={menu}>
              <Button type="primary" icon={<DownOutlined />}>
                {<Text text="Export Data" />}
              </Button>
            </Dropdown>
          </>
        }
      />
      {csvData ? (
        <CSVLink
          filename={'Tombolo-Notifications.csv'}
          className="ant-btn ant-btn-primary hidden"
          data={csvData}
          target="_blank"
          ref={csvRef}
        />
      ) : null}

      {jsonData ? (
        <a
          href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(jsonData))}`}
          className="ant-btn ant-btn-primary hidden"
          download="tombolo-notifications.json"
          link={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(jsonData))}`}
          id="jsonRef"
          ref={jsonRef}>
          Download
        </a>
      ) : null}
    </>
  );
}

export default Dashboard;

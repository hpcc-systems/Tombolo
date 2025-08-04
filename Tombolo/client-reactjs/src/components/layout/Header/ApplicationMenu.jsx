import React from 'react';
import { Dropdown, Space, Tooltip } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

import styles from '../layout.module.css';

const ApplicationMenu = ({ applications, selected, handleApplicationChange }) => {
  //build application list for dropdown
  const getApplicationItems = (applications) => {
    if (applications && applications.length > 0) {
      return applications.map((app) => ({ key: app.id, label: app.title }));
    } else {
      return [];
    }
  };

  return (
    <Dropdown
      menu={{
        items: getApplicationItems(applications),
        onClick: (e) => {
          handleApplicationChange(e.key);
        },
      }}
      placement="bottom"
      trigger={['click']}>
      <Tooltip title="Select an Application" placement="right">
        <Space className={styles.appMenuSpace}>
          <AppstoreOutlined />
          <span> {selected}</span>
        </Space>
      </Tooltip>
    </Dropdown>
  );
};

export default ApplicationMenu;

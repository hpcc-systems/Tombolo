import React from 'react';
import { Dropdown, Space, Tooltip } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

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
        <Space
          style={{
            color: 'white',
            border: '1px solid white',
            cursor: 'pointer',
            padding: '0 4px',
            borderRadius: '3px',
            maxHeight: '32px',
            minWidth: '200px',
          }}>
          <AppstoreOutlined />
          <span> {selected}</span>
        </Space>
      </Tooltip>
    </Dropdown>
  );
};

export default ApplicationMenu;

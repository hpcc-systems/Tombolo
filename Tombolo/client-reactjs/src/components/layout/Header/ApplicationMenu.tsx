import React from 'react';
import { Dropdown, Space, Tooltip } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import styles from '../layout.module.css';
import type { ApplicationUI } from '@tombolo/shared';

interface Props {
  applications: ApplicationUI[];
  selected: string;
  handleApplicationChange: (value: string) => void;
}

const ApplicationMenu: React.FC<Props> = ({ applications, selected, handleApplicationChange }) => {
  const getApplicationItems = (apps: ApplicationUI[]) => {
    if (apps && apps.length > 0) {
      return apps.map(app => ({ key: app.id, label: app.title }));
    }
    return [];
  };

  return (
    <Dropdown
      menu={{
        items: getApplicationItems(applications),
        onClick: (e: any) => {
          handleApplicationChange(e.key as string);
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

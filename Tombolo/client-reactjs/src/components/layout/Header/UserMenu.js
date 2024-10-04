import React from 'react';
import { Button, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';

const UserMenu = ({ handleLogOut, authenticationReducer }) => {
  const handleUserActionMenuClick = (e) => {
    if (e.key == 1) {
      window.location.href = '/myaccount';
    } else if (e.key == 2) {
      handleLogOut();
    }
  };

  const menuItems = [
    { key: '1', label: 'My Account' },
    { key: '2', label: 'Logout' },
  ];

  return (
    <Dropdown
      menu={{
        items: menuItems,
        onClick: (e) => handleUserActionMenuClick(e),
      }}
      trigger={['click']}>
      <Button shape="round">
        <i className="fa fa-lg fa-user-circle"></i>
        <span style={{ paddingLeft: '5px' }}>
          {authenticationReducer.firstName + ' ' + authenticationReducer.lastName} <DownOutlined />
        </span>
      </Button>
    </Dropdown>
  );
};

export default UserMenu;

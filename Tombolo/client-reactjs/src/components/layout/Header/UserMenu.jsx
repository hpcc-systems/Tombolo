import React, { useState } from 'react';
import { Button, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import history from '../../common/History';
import { getUser } from '../../common/userStorage';

const UserMenu = ({ handleLogOut }) => {
  //set user from local storage initially
  const [user, setUser] = useState(getUser());

  //listen for user storage event
  window.addEventListener('userStorage', () => {
    let newUser = getUser();
    if (newUser !== user) {
      setUser(newUser);
    }
  });

  const handleUserActionMenuClick = (e) => {
    if (e.key === '1') {
      history.push('/myaccount');
    } else if (e.key === '2') {
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
          {user.firstName + ' ' + user.lastName} <DownOutlined />
        </span>
      </Button>
    </Dropdown>
  );
};

export default UserMenu;

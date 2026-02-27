import React, { useState, useEffect } from 'react';
import { Button, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import history from '../../common/History';
import { getUser } from '../../common/userStorage';

interface Props {
  handleLogOut: () => void;
}

const UserMenu: React.FC<Props> = ({ handleLogOut }) => {
  const [user, setUser] = useState<any>(getUser());

  useEffect(() => {
    const handler = () => {
      const newUser = getUser();
      if (newUser !== user) setUser(newUser);
    };
    window.addEventListener('userStorage', handler);
    return () => window.removeEventListener('userStorage', handler);
  }, [user]);

  const handleUserActionMenuClick = (e: any) => {
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
        onClick: (e: any) => handleUserActionMenuClick(e),
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

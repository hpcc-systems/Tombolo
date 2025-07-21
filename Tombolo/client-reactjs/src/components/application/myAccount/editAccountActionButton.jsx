import React from 'react';
import { Dropdown, Button, Menu } from 'antd';
import { DownOutlined } from '@ant-design/icons';

const EditAccountActionButton = ({ setChangePasswordModalVisible, user, setEditing }) => {
  if (user.registrationMethod === 'azure') {
    return null;
  }

  const menu = (
    <Menu>
      <Menu.Item key="changePassword" onClick={() => setChangePasswordModalVisible(true)}>
        Change Password
      </Menu.Item>
      <Menu.Item key="updatePersonalInfo" onClick={() => setEditing(true)}>
        Update Personal Info
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={menu} placement="bottomRight" trigger={['click']}>
      <Button type="primary" icon={<DownOutlined />}>
        Account Actions
      </Button>
    </Dropdown>
  );
};

export default EditAccountActionButton;

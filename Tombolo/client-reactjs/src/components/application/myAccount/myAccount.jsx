import React, { useState } from 'react';
import { Divider } from 'antd';

import ChangePasswordModal from './changePasswordModal';
import EditAccountActionButton from './editAccountActionButton';
import MyAccountTable from './myAccountTable';
import MyAccountInfo from './myAccountInfo';
import BreadCrumbs from '../../common/BreadCrumbs';

const MyAccount = () => {
  const user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@test.com',
    roles: ['Admin', 'User'],
    applications: ['Tombolo1', 'Dev2'],
  };

  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);

  console.log(changePasswordModalVisible);

  return (
    <>
      <BreadCrumbs
        extraContent={<EditAccountActionButton setChangePasswordModalVisible={setChangePasswordModalVisible} />}
      />
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          width: '80%',
          margin: '0 auto',
          textAlign: 'center',
          justifyContent: 'center',
        }}>
        <h1>My Account</h1>
        <ChangePasswordModal
          changePasswordModalVisible={changePasswordModalVisible}
          setChangePasswordModalVisible={setChangePasswordModalVisible}
        />
        <MyAccountInfo user={user} />

        <Divider>Session Management</Divider>
        <MyAccountTable />
      </div>
    </>
  );
};

export default MyAccount;
import React, { useState } from 'react';
import { Divider } from 'antd';

import ChangePasswordModal from './changePasswordModal';
import EditAccountActionButton from './editAccountActionButton';
import MyAccountTable from './myAccountTable';
import MyAccountInfo from './myAccountInfo';
import BreadCrumbs from '../../common/BreadCrumbs';
import { getUser } from '../../common/userStorage';

const MyAccount = () => {
  //get user from local storage
  const user = getUser();

  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);

  return (
    <>
      <BreadCrumbs
        extraContent={
          <EditAccountActionButton setChangePasswordModalVisible={setChangePasswordModalVisible} user={user} />
        }
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
        <MyAccountTable user={user} />
      </div>
    </>
  );
};

export default MyAccount;

import React, { useState } from 'react';
import { Divider } from 'antd';

import ChangePasswordModal from './changePasswordModal';
import EditAccountActionButton from './editAccountActionButton';
import MyAccountTable from './myAccountTable';
import MyAccountInfo from './myAccountInfo';
import BreadCrumbs from '../../common/BreadCrumbs';
import { getUser } from '../../common/userStorage';
import './myAccount.css';

const MyAccount = () => {
  //get user from local storage
  const user = getUser();

  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [editing, setEditing] = useState(false);

  return (
    <>
      <BreadCrumbs
        extraContent={
          <EditAccountActionButton
            setChangePasswordModalVisible={setChangePasswordModalVisible}
            user={user}
            setEditing={setEditing}
          />
        }
      />
      <div className="my-account">
        <Divider orientation="left"> Personal Information </Divider>

        <ChangePasswordModal
          changePasswordModalVisible={changePasswordModalVisible}
          setChangePasswordModalVisible={setChangePasswordModalVisible}
        />
        <MyAccountInfo user={user} editing={editing} setEditing={setEditing} />

        <Divider orientation="left"> Active Sessions </Divider>
        <MyAccountTable user={user} />
      </div>
    </>
  );
};

export default MyAccount;

import React from 'react';
import { Button, Divider } from 'antd';
import MyAccountForm from './myAccountForm';
import MyAccountTable from './myAccountTable';
import MyAccountInfo from './myAccountInfo';
import BreadCrumbs from '../../common/BreadCrumbs';

const myAccount = () => {
  const user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'johndoe@test.com',
    roles: ['Admin', 'User'],
    applications: ['Tombolo1', 'Dev2'],
  };
  const logout = () => {
    // Add your logic to logout the user here
    alert('logout code fires here');
  };
  return (
    <>
      <BreadCrumbs
        extraContent={
          <>
            <Button type="primary" onClick={logout}>
              Logout
            </Button>
          </>
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

        <MyAccountInfo user={user} />
        <Divider>Edit Info</Divider>
        <MyAccountForm />
        <Divider>Session Management</Divider>
        <MyAccountTable />
      </div>
    </>
  );
};

export default myAccount;

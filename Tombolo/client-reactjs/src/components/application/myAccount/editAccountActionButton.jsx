import React from 'react';
import { Button } from 'antd';

const EditAccountActionButton = ({ setChangePasswordModalVisible, user }) => {
  if (user.registrationMethod === 'azure') {
    return null;
  }
  return (
    <Button
      type="primary"
      onClick={() => {
        setChangePasswordModalVisible(true);
      }}>
      Change Password
    </Button>
  );
};

export default EditAccountActionButton;

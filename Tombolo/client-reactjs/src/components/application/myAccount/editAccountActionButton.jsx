import React from 'react';
import { Button } from 'antd';

const EditAccountActionButton = ({ setChangePasswordModalVisible }) => {
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

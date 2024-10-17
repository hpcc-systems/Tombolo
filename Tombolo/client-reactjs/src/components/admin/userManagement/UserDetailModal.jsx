import React, { useEffect, useState } from 'react';
import { Modal, Descriptions, Button } from 'antd';
import { startCase } from 'lodash';
import { useSelector } from 'react-redux';

function UserDetailModal({ displayUserDetailsModal, setDisplayUserDetailsModal, selectedUser, roles }) {
  const [_selectedUserRoles, setSelectedUserRoles] = useState([]);
  const { applications: allApps } = useSelector((state) => state.applicationReducer);

  // Close model
  const closeModel = () => {
    setDisplayUserDetailsModal(false);
  };

  useEffect(() => {
    if (selectedUser && selectedUser.roles) {
      setSelectedUserRoles(selectedUser.roles.map((role) => role.role));
    }
  }, [selectedUser, allApps]);

  return (
    <Modal
      open={displayUserDetailsModal}
      width={800}
      destroyOnClose
      onCancel={closeModel}
      footer={[
        <Button key="close" type="primary" size="small" onClick={closeModel}>
          Close
        </Button>,
      ]}>
      <Descriptions column={1} bordered={true} size="small" className="userManageMent_tiny-description">
        <Descriptions.Item label="First Name">{selectedUser?.firstName}</Descriptions.Item>
        <Descriptions.Item label="Last Name">{selectedUser?.lastName}</Descriptions.Item>
        <Descriptions.Item label="Email">{selectedUser?.email}</Descriptions.Item>
        <Descriptions.Item label="Registration Method">{startCase(selectedUser?.registrationMethod)}</Descriptions.Item>
        <Descriptions.Item label="Registration Status">{startCase(selectedUser?.registrationStatus)}</Descriptions.Item>
        <Descriptions.Item label="Verified">{selectedUser?.verifiedUser === false ? 'No' : 'Yes'}</Descriptions.Item>
        {selectedUser?.verifiedAt && (
          <Descriptions.Item label="Verified At">{selectedUser?.verifiedAt}</Descriptions.Item>
        )}
        {selectedUser?.lastLoggedAt && (
          <Descriptions.Item label="Last Logged At">{selectedUser?.lastLoggedAt}</Descriptions.Item>
        )}
        {selectedUser && (
          <Descriptions.Item label="Roles">
            {selectedUser.roles
              .map((su) => {
                const roleDetails = roles.find((r) => r.id === su.roleId);
                return roleDetails ? startCase(roleDetails.roleName) : null;
              })
              .sort()
              .join(',')}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Applications">
          {selectedUser?.applications
            ?.map((ua) => {
              console.log(ua.application_id);
              const app = allApps.find((a) => a.id === ua.application_id);
              return app ? app.title : null;
            })
            .map((app) => app)
            .join(', ')}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">{selectedUser?.createdAt}</Descriptions.Item>
        <Descriptions.Item label="Updated At">{selectedUser?.updatedAt}</Descriptions.Item>
      </Descriptions>
    </Modal>
  );
}

export default UserDetailModal;

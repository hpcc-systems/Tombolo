// Libraries
import React, { useState } from 'react';
import { Modal, Form, message, Tabs, Button, Space, Badge } from 'antd';

// Local imports
import { updateUser, updateUserRoles, updateUserApplications } from './Utils';
import EditUserBasicTab from './EditUserBasicTab';
import EditUserRolesTab from './EditUserRolesTab';
import EditUserApplicationsTab from './EditUsersApplicationTab';

function EditUserModel({
  displayEditUserModal,
  setDisplayEditUserModal,
  selectedUser,
  setSelectedUser,
  setUsers,
  setFilteredUsers,
  roles,
}) {
  // Form hook
  const [basicUserDetailsForm] = Form.useForm();
  const [userRolesForm] = Form.useForm();
  const [userApplicationsForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [unsavedFields, setUnsavedFields] = useState({ userDetails: [], roles: [], applications: [] });
  const [displayUnsavedDataWarning, setDisplayUnsavedDataWarning] = useState(false);
  const [tabsToMarkUnsaved, setTabsToMarkUnsaved] = useState([]);

  // Handle the closing of the modal
  const handleCancel = ({ force }) => {
    setTabsToMarkUnsaved([]);

    if (
      (unsavedFields.userDetails.length !== 0 ||
        unsavedFields.roles.length !== 0 ||
        unsavedFields.applications.length !== 0) &&
      !force
    ) {
      setDisplayUnsavedDataWarning(true);
      if (unsavedFields.userDetails.length !== 0) setTabsToMarkUnsaved((prev) => [...prev, '1']);
      if (unsavedFields.roles.length !== 0) setTabsToMarkUnsaved((prev) => [...prev, '2']);
      if (unsavedFields.applications.length !== 0) setTabsToMarkUnsaved((prev) => [...prev, '3']);
      return;
    }

    setDisplayEditUserModal(false);
    basicUserDetailsForm.resetFields();
    userRolesForm.resetFields();
    userApplicationsForm.resetFields();
    setSelectedUser(null);
    setUnsavedFields({ userDetails: [], roles: [], applications: [] });
  };

  // Update user
  const handleUpdateBasicUserInfo = async () => {
    try {
      try {
        await basicUserDetailsForm.validateFields();
      } catch (err) {
        message.error('Failed to update user');
        return;
      }

      const fieldValues = basicUserDetailsForm.getFieldsValue();
      const { firstName, lastName, registrationMethod, registrationStatus, verifiedUser } = fieldValues;

      // Compare any changes to the selected user
      if (
        firstName === selectedUser.firstName &&
        lastName === selectedUser.lastName &&
        registrationMethod === selectedUser.registrationMethod &&
        registrationStatus === selectedUser.registrationStatus &&
        verifiedUser === selectedUser.verifiedUser
      ) {
        message.info('No changes detected');
        return;
      }

      // Update user
      await updateUser({ userId: selectedUser.id, updatedUser: fieldValues });
      setTabsToMarkUnsaved((prev) => prev.filter((tab) => tab !== '1'));
      setUnsavedFields((prev) => ({ ...prev, userDetails: [] }));

      // Update users array
      setUsers((prev) => {
        const updatedUsers = prev.map((user) => {
          if (user.id === selectedUser.id) {
            return { ...user, ...fieldValues };
          }
          return user;
        });
        return updatedUsers;
      });

      // Update filtered users array
      setFilteredUsers((prev) => {
        const updatedUsers = prev.map((user) => {
          if (user.id === selectedUser.id) {
            return { ...user, ...fieldValues };
          }
          return user;
        });
        return updatedUsers;
      });

      message.success('User updated successfully');
    } catch (err) {
      message.error(err.message);
      return;
    }
  };

  // Update user roles
  const handleUpdateUserRoles = async () => {
    try {
      // use async await to check if the userRolesForm is valid
      await userRolesForm.validateFields();

      // Existing role ids
      const existingRoleIds = selectedUser.roles.map((role) => role.roleId);
      const newRoleIds = userRolesForm.getFieldsValue().roles;

      // Check if there are any changes
      if (existingRoleIds.length === newRoleIds.length && existingRoleIds.every((id) => newRoleIds.includes(id))) {
        message.info('No changes detected');
        return;
      }

      await updateUserRoles({ userId: selectedUser.id, roles: newRoleIds });
      setTabsToMarkUnsaved((prev) => prev.filter((tab) => tab !== '2'));
      setUnsavedFields((prev) => ({ ...prev, roles: [] }));

      // roles must be in the form of an array of objects
      const newUserRolesObj = newRoleIds.map((roleId) => {
        return {
          roleId,
        };
      });

      // Update the users
      setUsers((prev) => {
        const updatedUsers = prev.map((user) => {
          if (user.id === selectedUser.id) {
            return { ...user, roles: newUserRolesObj };
          }
          return user;
        });
        return updatedUsers;
      });

      // Update the filtered users
      setFilteredUsers((prev) => {
        const updatedUsers = prev.map((user) => {
          if (user.id === selectedUser.id) {
            return { ...user, roles: newUserRolesObj };
          }
          return user;
        });
        return updatedUsers;
      });

      message.success('User roles updated successfully');
    } catch (err) {
      message.error('Failed to update user roles');
    }
  };

  // Handle user applications
  const handleUpdateUserApplications = async () => {
    try {
      // Proceed if only the form is touched
      await userApplicationsForm.validateFields();

      // Check if there are any changes
      const existingApplications = selectedUser.applications.map((app) => app.application_id);
      const newApplications = userApplicationsForm.getFieldsValue().applications;

      const added = newApplications.filter((app) => !existingApplications.includes(app));
      const removed = existingApplications.filter((app) => !newApplications.includes(app));

      if (added.length === 0 && removed.length === 0) {
        message.info('No changes detected');
        return;
      }

      // request to update user applications
      const updatedData = await updateUserApplications({
        userId: selectedUser.id,
        applications: userApplicationsForm.getFieldsValue().applications,
      });
      setTabsToMarkUnsaved((prev) => prev.filter((tab) => tab !== '3'));
      setUnsavedFields((prev) => ({ ...prev, applications: [] }));

      const oldKeptRoles = selectedUser.applications.filter((app) => !removed.includes(app.application_id));
      const allRoles = [...oldKeptRoles, ...updatedData];
      // Update the state, filteredUsers and users
      setUsers((prev) => {
        const updatedUsers = prev.map((user) => {
          if (user.id === selectedUser.id) {
            return { ...user, applications: [...allRoles] };
          }
          return user;
        });
        return updatedUsers;
      });

      // Update the filtered users
      setFilteredUsers((prev) => {
        const updatedUsers = prev.map((user) => {
          if (user.id === selectedUser.id) {
            return { ...user, applications: [...allRoles] };
          }
          return user;
        });
        return updatedUsers;
      });

      message.success('User applications updated successfully');
    } catch (err) {
      message.error('Failed to update user applications');
    }
  };

  // Keeps track of the save button text and function
  const [saveButton, setSaveButton] = useState({
    text: 'Update User Details',
    function: handleUpdateBasicUserInfo,
  });
  // Handle tab click
  const handleTabClick = (key) => {
    setActiveTab(key);

    if (key === '1') {
      setSaveButton({ text: 'Update User Details', function: handleUpdateBasicUserInfo });
    } else if (key === '2') {
      setSaveButton({ text: 'Update User Roles', function: handleUpdateUserRoles });
    } else if (key === '3') {
      setSaveButton({ text: 'Update User Applications', function: handleUpdateUserApplications });
    }
  };

  // Tab items
  const tabItems = [
    {
      label: 'User Details',
      key: '1',
      icon: tabsToMarkUnsaved.includes('1') && <Badge color="#fa8c16" />,
      children: (
        <EditUserBasicTab
          selectedUser={selectedUser}
          basicUserDetailsForm={basicUserDetailsForm}
          setUnsavedFields={setUnsavedFields}
        />
      ),
    },
    {
      label: 'Roles',
      key: '2',
      icon: tabsToMarkUnsaved.includes('2') && <Badge color="#fa8c16" />,

      children: (
        <EditUserRolesTab
          selectedUser={selectedUser}
          userRolesForm={userRolesForm}
          roles={roles}
          setUnsavedFields={setUnsavedFields}
        />
      ),
    },
    {
      label: 'Applications',
      key: '3',
      icon: tabsToMarkUnsaved.includes('3') && <Badge color="#fa8c16" />,
      children: (
        <EditUserApplicationsTab
          selectedUser={selectedUser}
          userApplicationsForm={userApplicationsForm}
          setUnsavedFields={setUnsavedFields}
        />
      ),
    },
  ];

  return (
    <Modal
      open={displayEditUserModal}
      width={800}
      okText={saveButton.text}
      maskClosable={false}
      onOk={saveButton.function}
      onCancel={() => handleCancel({ force: false })}
      cancelButtonProps={{
        danger:
          unsavedFields.userDetails.length !== 0 ||
          unsavedFields.roles.length !== 0 ||
          unsavedFields.applications.length !== 0,
      }}>
      {displayUnsavedDataWarning && (
        <div className="editUser__modal-overlay">
          <div className="editUser__modal-overlay-content">
            <p>
              {`You have unsaved changes. Click "Keep Editing" to return and save your changes, or click "Discard Changes" to cancel and close this warning.`}
            </p>

            <div>
              <Space size="small">
                <Button danger type="primary" onClick={() => handleCancel({ force: true })}>
                  Discard Changes
                </Button>
                <Button type="primary" onClick={() => setDisplayUnsavedDataWarning(false)}>
                  {' '}
                  Keep Editing{' '}
                </Button>
              </Space>
            </div>
          </div>
        </div>
      )}
      <Tabs items={tabItems} defaultActiveKey={activeTab} onChange={handleTabClick} />
    </Modal>
  );
}

export default EditUserModel;

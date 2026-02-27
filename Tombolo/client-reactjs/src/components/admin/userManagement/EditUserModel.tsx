import React, { useState } from 'react';
import { Modal, Form, Tabs, Button, Space, Badge } from 'antd';

import { handleSuccess, handleError } from '@/components/common/handleResponse';
import usersService from '@/services/users.service';
import EditUserBasicTab from './EditUserBasicTab';
import EditUserRolesTab from './EditUserRolesTab';
import EditUsersApplicationTab from './EditUsersApplicationTab';
import styles from './userManagement.module.css';

interface Props {
  displayEditUserModal: boolean;
  setDisplayEditUserModal: (v: boolean) => void;
  selectedUser: any;
  setSelectedUser: (u: any) => void;
  setUsers: (updater: (prev: any[]) => any[]) => void;
  setFilteredUsers: (updater: (prev: any[]) => any[]) => void;
  roles: any[];
}

const EditUserModel: React.FC<Props> = ({
  displayEditUserModal,
  setDisplayEditUserModal,
  selectedUser,
  setSelectedUser,
  setUsers,
  setFilteredUsers,
  roles,
}) => {
  const [basicUserDetailsForm] = Form.useForm();
  const [userRolesForm] = Form.useForm();
  const [userApplicationsForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState('1');
  const [unsavedFields, setUnsavedFields] = useState({ userDetails: [], roles: [], applications: [] });
  const [displayUnsavedDataWarning, setDisplayUnsavedDataWarning] = useState(false);
  const [tabsToMarkUnsaved, setTabsToMarkUnsaved] = useState<string[]>([]);

  const handleCancel = ({ force }: { force?: boolean }) => {
    setTabsToMarkUnsaved([]);

    if (
      (unsavedFields.userDetails.length !== 0 ||
        unsavedFields.roles.length !== 0 ||
        unsavedFields.applications.length !== 0) &&
      !force
    ) {
      setDisplayUnsavedDataWarning(true);
      if (unsavedFields.userDetails.length !== 0) setTabsToMarkUnsaved(prev => [...prev, '1']);
      if (unsavedFields.roles.length !== 0) setTabsToMarkUnsaved(prev => [...prev, '2']);
      if (unsavedFields.applications.length !== 0) setTabsToMarkUnsaved(prev => [...prev, '3']);
      return;
    }

    setDisplayEditUserModal(false);
    basicUserDetailsForm.resetFields();
    userRolesForm.resetFields();
    userApplicationsForm.resetFields();
    setSelectedUser(null);
    setUnsavedFields({ userDetails: [], roles: [], applications: [] });
  };

  const handleUpdateBasicUserInfo = async () => {
    try {
      try {
        await basicUserDetailsForm.validateFields();
      } catch (_err) {
        handleError('Failed to update user');
        return;
      }

      const fieldValues = basicUserDetailsForm.getFieldsValue();
      const { firstName, lastName, registrationMethod, registrationStatus, verifiedUser } = fieldValues;

      if (
        firstName === selectedUser.firstName &&
        lastName === selectedUser.lastName &&
        registrationMethod === selectedUser.registrationMethod &&
        registrationStatus === selectedUser.registrationStatus &&
        verifiedUser === selectedUser.verifiedUser
      ) {
        handleSuccess('No changes detected');
        return;
      }

      await usersService.update({ userId: selectedUser.id, userData: fieldValues });
      setTabsToMarkUnsaved(prev => prev.filter(tab => tab !== '1'));
      setUnsavedFields(prev => ({ ...prev, userDetails: [] }));

      setUsers((prev: any[]) => prev.map(user => (user.id === selectedUser.id ? { ...user, ...fieldValues } : user)));
      setFilteredUsers((prev: any[]) =>
        prev.map(user => (user.id === selectedUser.id ? { ...user, ...fieldValues } : user))
      );

      handleSuccess('User updated successfully');
    } catch (err: any) {
      handleError(err.message);
      return;
    }
  };

  const handleUpdateUserRoles = async () => {
    try {
      await userRolesForm.validateFields();

      const existingRoleIds = selectedUser.roles.map((role: any) => role.roleId);
      const newRoleIds = userRolesForm.getFieldsValue().roles;

      if (existingRoleIds.length === newRoleIds.length && existingRoleIds.every((id: any) => newRoleIds.includes(id))) {
        handleSuccess('No changes detected');
        return;
      }

      await usersService.updateRoles({ userId: selectedUser.id, roles: newRoleIds });
      setTabsToMarkUnsaved(prev => prev.filter(tab => tab !== '2'));
      setUnsavedFields(prev => ({ ...prev, roles: [] }));

      const newUserRolesObj = newRoleIds.map((roleId: any) => ({ roleId }));

      setUsers((prev: any[]) =>
        prev.map(user => (user.id === selectedUser.id ? { ...user, roles: newUserRolesObj } : user))
      );
      setFilteredUsers((prev: any[]) =>
        prev.map(user => (user.id === selectedUser.id ? { ...user, roles: newUserRolesObj } : user))
      );

      handleSuccess('User roles updated successfully');
    } catch (_err) {
      handleError('Failed to update user roles');
    }
  };

  const handleUpdateUserApplications = async () => {
    try {
      await userApplicationsForm.validateFields();

      const existingApplications = selectedUser.applications.map((app: any) => app.application_id);
      const newApplications = userApplicationsForm.getFieldsValue().applications;

      const added = newApplications.filter((app: any) => !existingApplications.includes(app));
      const removed = existingApplications.filter((app: any) => !newApplications.includes(app));

      if (added.length === 0 && removed.length === 0) {
        handleSuccess('No changes detected');
        return;
      }

      const updatedData = await usersService.updateApplications({
        userId: selectedUser.id,
        applications: userApplicationsForm.getFieldsValue().applications,
      });
      setTabsToMarkUnsaved(prev => prev.filter(tab => tab !== '3'));
      setUnsavedFields(prev => ({ ...prev, applications: [] }));

      const oldKeptRoles = selectedUser.applications.filter((app: any) => !removed.includes(app.application_id));
      const allRoles = [...oldKeptRoles, ...updatedData];

      setUsers((prev: any[]) =>
        prev.map(user => (user.id === selectedUser.id ? { ...user, applications: [...allRoles] } : user))
      );
      setFilteredUsers((prev: any[]) =>
        prev.map(user => (user.id === selectedUser.id ? { ...user, applications: [...allRoles] } : user))
      );

      handleSuccess('User applications updated successfully');
    } catch (_err) {
      handleError('Failed to update user applications');
    }
  };

  const [saveButton, setSaveButton] = useState({ text: 'Update User Details', function: handleUpdateBasicUserInfo });

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    if (key === '1') setSaveButton({ text: 'Update User Details', function: handleUpdateBasicUserInfo });
    else if (key === '2') setSaveButton({ text: 'Update User Roles', function: handleUpdateUserRoles });
    else if (key === '3') setSaveButton({ text: 'Update User Applications', function: handleUpdateUserApplications });
  };

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
        <EditUsersApplicationTab
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
        <div className={styles.editUser__modalOverlay}>
          <div className={styles.editUser__modalOverlayContent}>
            <p>{`You have unsaved changes. Click "Keep Editing" to return and save your changes, or click "Discard Changes" to cancel and close this warning.`}</p>
            <div>
              <Space size="small">
                <Button danger type="primary" onClick={() => handleCancel({ force: true })}>
                  Discard Changes
                </Button>
                <Button type="primary" onClick={() => setDisplayUnsavedDataWarning(false)}>
                  Keep Editing
                </Button>
              </Space>
            </div>
          </div>
        </div>
      )}
      <Tabs items={tabItems} defaultActiveKey={activeTab} onChange={handleTabClick} />
    </Modal>
  );
};

export default EditUserModel;

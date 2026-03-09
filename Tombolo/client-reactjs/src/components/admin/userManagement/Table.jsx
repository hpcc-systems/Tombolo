// Imports from libraries
import React from 'react';
import { Table, Tooltip, Popconfirm, Tag, Popover } from 'antd';
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  LockFilled,
  UnlockOutlined,
  KeyOutlined,
  DownOutlined,
} from '@ant-design/icons';

// Local imports
import { handleSuccess, handleError } from '@/components/common/handleResponse';
import usersService from '@/services/users.service';
import styles from './userManagement.module.css';

const UserManagementTable = ({
  users,
  setSelectedUser,
  setDisplayUserDetailsModal,
  setSelectedRows,
  filteringUsers,
  setDisplayEditUserModal,
  setUsers,
  setFilteredUsers,
  roles,
}) => {
  // Rest password
  const handlePasswordReset = async ({ id }) => {
    try {
      await usersService.resetPassword({ id });
      handleSuccess('Password reset successfully');
    } catch (err) {
      handleError('Failed to reset password');
    }
  };

  // Unlock user account
  const handleAccountUnlock = async ({ id }) => {
    try {
      await usersService.unlockAccount({ id });

      // Update the user in the table
      setUsers(prev =>
        prev.map(user => {
          if (user.id === id) {
            return {
              ...user,
              accountLocked: {
                isLocked: false,
                lockedReason: [],
              },
            };
          }
          return user;
        })
      );

      // If filters are applied, update the filtered users as well
      setFilteredUsers(prev =>
        prev.map(user => {
          if (user.id === id) {
            return {
              ...user,
              accountLocked: {
                isLocked: false,
                lockedReason: [],
              },
            };
          }
          return user;
        })
      );
      handleSuccess('User account unlocked successfully');
    } catch (err) {
      handleError('Failed to unlock user account');
    }
  };

  // Const handle user deletion - display message and setUsers and filteredUsers
  const handleDeleteUser = async ({ id }) => {
    try {
      await usersService.delete({ id });
      setUsers(prev => prev.filter(user => user.id !== id));
      setFilteredUsers(prev => prev.filter(user => user.id !== id));
      handleSuccess('User deleted successfully');
    } catch (err) {
      handleError('Failed to delete user');
    }
  };

  // Columns for the table
  const columns = [
    {
      title: '',
      key: record => record.id,
      width: 1,
      render: record =>
        record.accountLocked &&
        record.accountLocked.isLocked && (
          <Tooltip title="Account Locked">
            <LockFilled style={{ color: 'var(--danger)' }} />{' '}
          </Tooltip>
        ),
    },
    Table.SELECTION_COLUMN,
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Roles',
      dataIndex: 'roles',
      key: 'roles',
      render: userRoles => {
        const currentRoles = [];
        userRoles.map(role => {
          const userRoleId = role.roleId;
          roles.map(role => {
            if (role.id === userRoleId) {
              currentRoles.push(role);
            }
          });
        });

        return currentRoles
          .sort((a, b) => a.roleName.localeCompare(b.roleName))
          .map(role => <Tag key={role.id}>{role.roleName}</Tag>);
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <>
          <Tooltip title="View  Details">
            <EyeOutlined style={{ color: 'var(--primary)', marginRight: 15 }} onClick={() => viewUserDetails(record)} />
          </Tooltip>
          <Tooltip title="Edit user">
            <EditOutlined style={{ color: 'var(--primary)', marginRight: 15 }} onClick={() => editUser(record)} />
          </Tooltip>
          <Popconfirm
            title={
              <>
                <div style={{ fontWeight: 'bold' }}>{`Delete ${record.firstName} ${record.lastName}`} </div>
                <div style={{ maxWidth: 400 }}>This action will delete all user related data.</div>
              </>
            }
            onConfirm={() => {
              handleDeleteUser({ id: record.id });
            }}
            okText="Continue"
            okButtonProps={{ danger: true }}
            cancelText="Close"
            cancelButtonProps={{ type: 'primary', ghost: true }}
            style={{ width: '500px !important' }}>
            <Tooltip title="Delete user">
              <DeleteOutlined style={{ color: 'var(--primary)', marginRight: 15 }} />
            </Tooltip>
          </Popconfirm>

          <Popover
            placement="bottom"
            content={
              <div
                style={{ display: 'flex', flexDirection: 'column', color: 'var(--primary)', cursor: 'pointer' }}
                className={styles.userManagementTable__hidden_actions}>
                <div style={{ color: 'var(--primary)' }}>
                  <Popconfirm
                    title={
                      <>
                        <div style={{ fontWeight: 'bold' }}>{`Reset Password`} </div>
                        <div style={{ maxWidth: 460 }}>
                          {`Clicking "Yes" will send a password reset link to `}
                          <Tooltip title={`${record.firstName} ${record.lastName}`}>
                            <span style={{ color: 'var(--primary)' }}>{record.email}</span>
                          </Tooltip>{' '}
                          via email. Do you want to continue?`
                        </div>
                      </>
                    }
                    onConfirm={() => handlePasswordReset({ id: record.id })}
                    okText="Yes"
                    okButtonProps={{ danger: true }}
                    cancelText="No"
                    cancelButtonProps={{ type: 'primary', ghost: true }}
                    style={{ width: '500px !important' }}>
                    <div style={{ marginBottom: '8px' }}>
                      <KeyOutlined style={{ marginRight: 7 }} /> Reset Password
                    </div>
                  </Popconfirm>

                  {record.accountLocked && record.accountLocked.isLocked && (
                    <Popconfirm
                      title={
                        <>
                          <div style={{ fontWeight: 'bold' }}>{`Unlock Account`} </div>
                          <div style={{ maxWidth: 460 }}>
                            {`Clicking 'Yes' will unlock the user's account. Do you want to continue?`}
                          </div>
                        </>
                      }
                      onConfirm={() => {
                        handleAccountUnlock({ id: record.id });
                      }}
                      okText="Yes"
                      okButtonProps={{ danger: true }}
                      cancelText="No"
                      cancelButtonProps={{ type: 'primary', ghost: true }}
                      style={{ width: '500px !important' }}>
                      <div>
                        <UnlockOutlined style={{ marginRight: 10 }} />
                        Unlock Account
                      </div>
                    </Popconfirm>
                  )}
                </div>
              </div>
            }>
            <span style={{ color: 'var(--secondary)' }}>
              More <DownOutlined style={{ fontSize: '10px' }} />
            </span>
          </Popover>
        </>
      ),
    },
  ];

  // When eye icon is clicked, display the user details modal
  const viewUserDetails = record => {
    setSelectedUser(record);
    setDisplayUserDetailsModal(true);
  };

  // When edit icon is clicked, display the add  user modal and set the selected user
  const editUser = record => {
    setSelectedUser(record);
    setDisplayEditUserModal(true);
  };

  return (
    <Table
      dataSource={users}
      loading={filteringUsers}
      columns={columns}
      rowKey="id"
      size="small"
      rowSelection={{
        type: 'checkbox',
        onChange: (_selectedRowKeys, selectedRowsData) => {
          setSelectedRows(selectedRowsData);
        },
      }}
      pagination={{ pageSize: 20 }}
    />
  );
};

export default UserManagementTable;

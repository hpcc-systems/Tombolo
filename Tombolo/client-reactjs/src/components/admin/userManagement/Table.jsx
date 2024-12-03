import React from 'react';
import { Table, Tooltip, Popconfirm, message, Tag } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

import { deleteUser } from './Utils.js';

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
  // Const handle user deletion - display message and setUsers and filteredUsers
  const handleDeleteUser = async ({ id }) => {
    try {
      await deleteUser({ id });
      setUsers((prev) => prev.filter((user) => user.id !== id));
      setFilteredUsers((prev) => prev.filter((user) => user.id !== id));
      message.success('User deleted successfully');
    } catch (err) {
      message.error('Failed to delete user');
    }
  };
  // Columns for the table
  const columns = [
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
      render: (userRoles) => {
        const currentRoles = [];
        userRoles.map((role) => {
          const userRoleId = role.roleId;
          roles.map((role) => {
            if (role.id === userRoleId) {
              currentRoles.push(role);
            }
          });
        });

        return currentRoles
          .sort((a, b) => a.roleName.localeCompare(b.roleName))
          .map((role) => <Tag key={role.id}>{role.roleName}</Tag>);
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
        </>
      ),
    },
  ];

  // When eye icon is clicked, display the user details modal
  const viewUserDetails = (record) => {
    setSelectedUser(record);
    setDisplayUserDetailsModal(true);
  };

  // When edit icon is clicked, display the add  user modal and set the selected user
  const editUser = (record) => {
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

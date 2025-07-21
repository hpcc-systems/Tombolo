import React from 'react';
import { Menu, Dropdown, Button, message, Popconfirm } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { bulkDeleteUsers } from './Utils';

const UserManagementActionButton = ({
  handleAddUserButtonClick,
  selectedRows,
  setSelectedRows,
  setUsers,
  setBulkEditModalVisibility,
  setFilteredUsers,
}) => {
  const deleteSelected = async () => {
    try {
      const ids = selectedRows.map((row) => row.id);
      await bulkDeleteUsers({ ids });
      setSelectedRows([]);
      setUsers((prev) => prev.filter((user) => !ids.includes(user.id)));
      setFilteredUsers((prev) => prev.filter((user) => !ids.includes(user.id)));
      message.success('Selected users deleted successfully');
    } catch (err) {
      message.error('Unable to delete selected users');
      console.log(err);
    }
  };

  const handleMenuSelection = (key) => {
    if (key === '1') {
      handleAddUserButtonClick();
    } else if (key === '2') {
      setBulkEditModalVisibility(true);
    }
  };

  return (
    <Dropdown
      dropdownRender={() => (
        <Menu onClick={({ key }) => handleMenuSelection(key)}>
          <Menu.Item key="1">Add User </Menu.Item>

          {/* <Menu.Item key="2" disabled={selectedRows.length < 2}>
            Bulk Edit
          </Menu.Item> */}
          <Menu.Item key="3" disabled={selectedRows.length < 2}>
            <Popconfirm
              title={`Are you sure you want to delete  selected ${selectedRows.length} users? `}
              okButtonProps={{ type: 'primary', danger: true }}
              okText="Delete"
              onConfirm={deleteSelected}>
              Bulk Delete
            </Popconfirm>
          </Menu.Item>
        </Menu>
      )}>
      <Button type="primary">
        User Actions <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default UserManagementActionButton;

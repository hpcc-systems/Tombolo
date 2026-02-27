import React from 'react';
import { Menu, Dropdown, Button, Popconfirm } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { handleSuccess, handleError } from '@/components/common/handleResponse';
import usersService from '@/services/users.service';

interface Props {
  handleAddUserButtonClick: () => void;
  selectedRows: any[];
  setSelectedRows: (rows: any[]) => void;
  setUsers: (updater: (prev: any[]) => any[]) => void;
  setFilteredUsers: (updater: (prev: any[]) => any[]) => void;
}

const UserManagementActionButton: React.FC<Props> = ({
  handleAddUserButtonClick,
  selectedRows,
  setSelectedRows,
  setUsers,
  setFilteredUsers,
}) => {
  const deleteSelected = async () => {
    try {
      const ids = selectedRows.map(row => row.id);
      await usersService.bulkDelete({ ids });
      setSelectedRows([]);
      setUsers((prev: any[]) => prev.filter((user: any) => !ids.includes(user.id)));
      setFilteredUsers((prev: any[]) => prev.filter((user: any) => !ids.includes(user.id)));
      handleSuccess('Selected users deleted successfully');
    } catch (_err) {
      handleError('Unable to delete selected users');
    }
  };

  const handleMenuSelection = (key: string) => {
    if (key === '1') {
      handleAddUserButtonClick();
    }
  };

  return (
    <Dropdown
      dropdownRender={() => (
        <Menu onClick={({ key }) => handleMenuSelection(key as string)}>
          <Menu.Item key="1">Add User </Menu.Item>
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

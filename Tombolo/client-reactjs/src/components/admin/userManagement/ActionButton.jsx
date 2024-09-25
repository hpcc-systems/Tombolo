import React from 'react';
import { Menu, Dropdown, Button, message, Popconfirm } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { handleDeleteUser } from './Utils';

const UserManagementActionButton = ({
  handleAddUserButtonClick,
  selectedRows,
  setSelectedRows,
  setUsers,
  setBulkEditModalVisibility,
  setFiltersVisible,
  filtersVisible,
}) => {
  const deleteSelected = async () => {
    try {
      //delete code fires here
      alert('delete code fires here');
      console.log(setSelectedRows, setUsers, handleDeleteUser);
    } catch (err) {
      message.error('Unable to delete selected job monitorings');
    }
  };

  const handleMenuSelection = (key) => {
    if (key === '1') {
      handleAddUserButtonClick();
    } else if (key === '2') {
      setBulkEditModalVisibility(true);
    } else if (key === '4') {
      changeFilterVisibility();
    }
  };

  //Change filter visibility
  const changeFilterVisibility = () => {
    localStorage.setItem('userFiltersVisible', !filtersVisible);
    setFiltersVisible((prev) => !prev);
  };

  return (
    <Dropdown
      dropdownRender={() => (
        <Menu onClick={({ key }) => handleMenuSelection(key)}>
          <Menu.Item key="1">Add User </Menu.Item>

          <Menu.Item key="2" disabled={selectedRows.length < 2}>
            Bulk Edit
          </Menu.Item>
          <Menu.Item key="3" disabled={selectedRows.length < 2}>
            <Popconfirm
              title={`Are you sure you want to delete  selected ${selectedRows.length} monitorings?. `}
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

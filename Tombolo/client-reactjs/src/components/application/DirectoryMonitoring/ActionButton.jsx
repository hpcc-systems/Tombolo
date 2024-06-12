import React from 'react';
import { Menu, Dropdown, Button, message, Popconfirm } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { handleBulkDeleteDirectoryMonitorings } from './Utils';

const ActionButton = ({
  handleAddDirectoryMonitoringButtonClick,
  selectedRows,
  setSelectedRows,
  setDirectoryMonitorings,
  setBulkEditModalVisibility,
  setBulkApprovalModalVisibility,
}) => {
  const deleteSelected = async () => {
    try {
      const selectedRowIds = selectedRows.map((row) => row.id);
      const res = await handleBulkDeleteDirectoryMonitorings({ selectedDirectoryMonitorings: selectedRowIds });
      setDirectoryMonitorings((prev) =>
        prev.filter((directoryMonitoring) => !selectedRowIds.includes(directoryMonitoring.id))
      );
      setSelectedRows([]);

      if (res) {
        message.success('Selected directory monitorings deleted successfully');
      }
    } catch (err) {
      console.log(err);
      message.error('Unable to delete selected directory monitorings');
    }
  };

  const handleMenuSelection = (key) => {
    if (key === '1') {
      handleAddDirectoryMonitoringButtonClick();
    } else if (key === '2') {
      setBulkEditModalVisibility(true);
    } else if (key === '3') {
      setBulkApprovalModalVisibility(true);
    }
  };

  return (
    <Dropdown
      dropdownRender={() => (
        <Menu onClick={({ key }) => handleMenuSelection(key)}>
          <Menu.Item key="1">Add Directory Monitoring</Menu.Item>

          <Menu.Item key="2" disabled={selectedRows.length < 2}>
            Bulk Edit
          </Menu.Item>
          <Menu.Item key="3" disabled={selectedRows.length < 2}>
            Bulk Approve or Reject
          </Menu.Item>
          <Menu.Item key="4" disabled={selectedRows.length < 2}>
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
        Directory Monitoring Actions <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default ActionButton;

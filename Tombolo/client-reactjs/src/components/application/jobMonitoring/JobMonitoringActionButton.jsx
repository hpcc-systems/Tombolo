import React from 'react';
import { Menu, Dropdown, Button, message, Popconfirm } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { handleBulkDeleteJobMonitorings } from './jobMonitoringUtils';

const JobMonitoringActionButton = ({
  handleAddJobMonitoringButtonClick,
  selectedRows,
  setSelectedRows,
  setJobMonitorings,
  setBulkEditModalVisibility,
}) => {
  const deleteSelected = async () => {
    try {
      const selectedRowIds = selectedRows.map((row) => row.id);
      await handleBulkDeleteJobMonitorings({ selectedJobMonitorings: selectedRowIds });
      setJobMonitorings((prev) => prev.filter((jobMonitoring) => !selectedRowIds.includes(jobMonitoring.id)));
      setSelectedRows([]);
    } catch (err) {
      message.error('Unable to delete selected job monitorings');
    }
  };

  const handleMenuSelection = (key) => {
    if (key === '1') {
      handleAddJobMonitoringButtonClick();
    } else if (key === '2') {
      setBulkEditModalVisibility(true);
    }
  };

  return (
    <Dropdown
      dropdownRender={() => (
        <Menu onClick={({ key }) => handleMenuSelection(key)}>
          <Menu.Item key="1">Add Job Monitoring</Menu.Item>

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
        Job Monitoring Actions <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default JobMonitoringActionButton;

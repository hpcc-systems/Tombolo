import React, { useState } from 'react';
import { Menu, Dropdown, Button, message, Popconfirm, Popover, Form, Select, Card, Badge } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { handleBulkDeleteJobMonitorings, toggleJobMonitoringStatus } from './jobMonitoringUtils';

const { Option } = Select;
const JobMonitoringActionButton = ({
  handleAddJobMonitoringButtonClick,
  selectedRows,
  setSelectedRows,
  setJobMonitorings,
  setBulkEditModalVisibility,
  setFiltersVisible,
  filtersVisible,
  isReader,
  setDisplayAddRejectModal,
}) => {
  const [bulkStartPauseForm] = Form.useForm(); // Form Instance

  const [expandActionsDrawer, setExpandActionsDrawer] = useState(false); // Drawer state

  // Handle bulk delete
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

  // Bulk start/pause job monitorings
  const bulkStartPauseJobMonitorings = async () => {
    try {
      const action = bulkStartPauseForm.getFieldValue('action'); // Ensure correct usage of bulkStartPauseForm
      const selectedRowIds = selectedRows.map((row) => row.id);
      const updatedMonitorings = await toggleJobMonitoringStatus({ ids: selectedRowIds, action });
      setJobMonitorings((prev) =>
        prev.map((monitoring) => updatedMonitorings.find((updated) => updated.id === monitoring.id) || monitoring)
      );
      message.success(`Selected ${action === 'start' ? 'Job Monitorings started' : 'Job Monitorings paused'}`);
    } catch (err) {
      message.error('Unable to start/pause selected job monitorings');
    }
  };

  // Handle menu selection
  const handleMenuSelection = (key) => {
    if (key === '1') {
      handleAddJobMonitoringButtonClick();
      setExpandActionsDrawer(false);
    } else if (key === '2') {
      setBulkEditModalVisibility(true);
      setExpandActionsDrawer(false);
    } else if (key === '4') {
      changeFilterVisibility();
      setExpandActionsDrawer(false);
    } else if (key === '5') {
      setDisplayAddRejectModal(true);
      setExpandActionsDrawer(false);
    }
  };

  //Change filter visibility
  const changeFilterVisibility = () => {
    localStorage.setItem('jMFiltersVisible', !filtersVisible);
    setFiltersVisible((prev) => !prev);
  };

  // Handle dropdown open change
  const handleDropDownOpenChange = (nextOpen, info) => {
    if (info.source === 'trigger' || nextOpen) {
      setExpandActionsDrawer(nextOpen);
    }
  };

  // Define menu items
  const menuItems = [
    {
      key: '1',
      label: 'Add Job Monitoring',
    },
    {
      key: '2',
      label: 'Bulk Edit',
      disabled: selectedRows.length < 2,
    },
    {
      key: 'bulkStartPause',
      label: (
        <Popover
          placement="left"
          content={
            <Card size="small">
              <Form layout="vertical" form={bulkStartPauseForm}>
                <Form.Item label="Select Action" name="action" required>
                  <Select style={{ width: '18rem' }}>
                    <Option value="start">
                      <Badge color="green" style={{ marginRight: '1rem' }}></Badge>
                      {`Start selected ${selectedRows.length} Job Monitoring`}
                    </Option>
                    <Option value="pause">
                      <Badge color="red" style={{ marginRight: '1rem' }}></Badge>
                      {`Pause selected ${selectedRows.length} Job Monitoring`}
                    </Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button type="primary" style={{ width: '100%' }} onClick={bulkStartPauseJobMonitorings}>
                    Apply
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          }
          trigger="click">
          <a>Bulk start/pause</a>
        </Popover>
      ),
      disabled: selectedRows.length < 2,
    },
    {
      key: '5',
      label: 'Bulk Approve / Reject',
      disabled: selectedRows.length < 2,
    },
    {
      key: '3',
      label: (
        <Popconfirm
          title={`Are you sure you want to delete selected ${selectedRows.length} monitorings?. `}
          okButtonProps={{ type: 'primary', danger: true }}
          okText="Delete"
          onConfirm={deleteSelected}>
          Bulk Delete
        </Popconfirm>
      ),
      disabled: selectedRows.length < 2,
    },
    {
      key: '4',
      label: filtersVisible ? 'Hide filters' : 'Show filters',
    },
  ];

  return (
    <Dropdown
      disabled={isReader}
      trigger={['click']}
      onOpenChange={handleDropDownOpenChange}
      open={expandActionsDrawer}
      dropdownRender={() => <Menu items={menuItems} onClick={({ key }) => handleMenuSelection(key)} />}>
      <Button type="primary">
        Job Monitoring Actions <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default JobMonitoringActionButton;

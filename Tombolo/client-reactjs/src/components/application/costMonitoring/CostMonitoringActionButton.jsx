import React, { useState } from 'react';
import { Menu, Dropdown, Button, message, Popconfirm, Popover, Form, Select, Card, Badge } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { handleBulkDeleteCostMonitorings, toggleCostMonitoringStatus } from './costMonitoringUtils';

const { Option } = Select;

const CostMonitoringActionButton = ({
  handleAddCostMonitoringButtonClick,
  selectedRows,
  setSelectedRows,
  setCostMonitorings,
  setBulkEditModalVisibility,
  setFiltersVisible,
  filtersVisible,
  isReader,
  setDisplayAddRejectModal,
}) => {
  const [bulkStartPauseForm] = Form.useForm(); // Form Instance
  const [expandActionsDrawer, setExpandActionsDrawer] = useState(false); // Drawer state

  const actionValue = Form.useWatch('action', bulkStartPauseForm);

  // Handle bulk delete
  const deleteSelected = async () => {
    try {
      const selectedRowIds = selectedRows.map((row) => row.id);
      await handleBulkDeleteCostMonitorings(selectedRowIds);
      setCostMonitorings((prev) => prev.filter((costMonitoring) => !selectedRowIds.includes(costMonitoring.id)));
      setSelectedRows([]);
      message.success('Selected cost monitorings deleted successfully');
    } catch (err) {
      message.error('Unable to delete selected cost monitorings');
    }
  };

  // Bulk start/pause cost monitorings
  const bulkStartPauseCostMonitorings = async () => {
    try {
      const selectedRowIds = selectedRows.map((row) => row.id);

      // Check if all selected monitorings are approved
      const unapprovedMonitorings = selectedRows.filter((row) => row.approvalStatus !== 'Approved');
      if (unapprovedMonitorings.length > 0) {
        message.error('All selected cost monitorings must be in approved state before they can be started');
        return;
      }

      // Update monitorings in state
      const updatedMonitorings = await toggleCostMonitoringStatus(selectedRowIds, actionValue);
      const updatedMonitoringsMap = new Map(updatedMonitorings.map((item) => [item.id, item]));
      setCostMonitorings((prev) => prev.map((monitoring) => updatedMonitoringsMap.get(monitoring.id) || monitoring));

      message.success(`Selected cost monitorings ${actionValue === 'start' ? 'started' : 'paused'} successfully`);
      setExpandActionsDrawer(false);
    } catch (err) {
      message.error('Unable to start/pause selected cost monitorings');
    }
  };

  // Handle menu selection
  const handleMenuSelection = (key) => {
    if (key === '1') {
      handleAddCostMonitoringButtonClick();
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

  // Change filter visibility
  const changeFilterVisibility = () => {
    localStorage.setItem('cMFiltersVisible', !filtersVisible);
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
      label: 'Add Cost Monitoring',
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
                  <Select style={{ width: '20rem' }} placeholder="Choose action">
                    <Option value="start">
                      <Badge color="green" style={{ marginRight: '1rem' }}></Badge>
                      {`Start selected ${selectedRows.length} Cost Monitoring${selectedRows.length > 1 ? 's' : ''}`}
                    </Option>
                    <Option value="pause">
                      <Badge color="red" style={{ marginRight: '1rem' }}></Badge>
                      {`Pause selected ${selectedRows.length} Cost Monitoring${selectedRows.length > 1 ? 's' : ''}`}
                    </Option>
                  </Select>
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    style={{ width: '100%' }}
                    onClick={bulkStartPauseCostMonitorings}
                    disabled={!actionValue}>
                    Apply
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          }
          trigger="click"
          onVisibleChange={(visible) => {
            if (!visible) {
              bulkStartPauseForm.resetFields();
            }
          }}>
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
          title={
            <>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {`Delete ${selectedRows.length} cost monitoring${selectedRows.length > 1 ? 's' : ''}?`}
              </div>
              <div style={{ maxWidth: 400 }}>
                This action will delete all related data including notifications generated by these cost monitorings. If
                you would like to keep the data, you can deactivate the monitorings instead.
              </div>
            </>
          }
          onConfirm={deleteSelected}
          okText="Delete"
          okButtonProps={{ type: 'primary', danger: true }}
          cancelText="Cancel"
          cancelButtonProps={{ type: 'default' }}
          placement="topRight">
          <span style={{ color: 'var(--danger)' }}>Bulk Delete</span>
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
      dropdownRender={() => <Menu items={menuItems} onClick={({ key }) => handleMenuSelection(key)} />}
      placement="bottomRight">
      <Button type="primary" disabled={isReader}>
        Cost Monitoring Actions <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default CostMonitoringActionButton;

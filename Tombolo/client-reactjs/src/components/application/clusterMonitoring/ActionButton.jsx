import React from 'react';
import { Menu, Dropdown, Button, message, Popconfirm, Popover, Form, Card, Select, Badge } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { deleteClusterMonitoring, toggleClusterMonitoringActiveStatus } from './clusterMonitoringUtils';

const { Option } = Select;

const ActionButton = ({
  setDisplayAddEditModal,
  //   // handleAddNewLzMonitoringBtnClick,
  selectedRows,
  setSelectedRows,
  setClusterMonitoring,
  setBulkEditModalVisibility,
  setApproveRejectModal,
  isReader,
  clusterMonitoring,
}) => {
  const [bulkStartPauseForm] = Form.useForm(); // Form Instance

  const deleteSelected = async () => {
    try {
      const selectedRowIds = selectedRows.map((row) => row.id);
      const res = await deleteClusterMonitoring(selectedRowIds);
      setClusterMonitoring((prev) =>
        prev.filter((landingZoneMonitoring) => !selectedRowIds.includes(landingZoneMonitoring.id))
      );

      if (!res.errors) {
        message.success('Selected cluster monitoring deleted successfully');
        setSelectedRows([]);
      } else {
        throw new Error(res.errors[0].message);
      }
    } catch (err) {
      message.error(err.message);
    }
  };

  const handleMenuSelection = (key) => {
    if (key === '1') {
      setDisplayAddEditModal(true);
    } else if (key === '2') {
      setBulkEditModalVisibility(true);
    } else if (key === '3') {
      setApproveRejectModal(true);
    }
  };

  // Bulk start/pause job monitoring
  const bulkStartPauseClusterMonitoring = async () => {
    try {
      const action = bulkStartPauseForm.getFieldValue('action'); // Ensure correct usage of bulkStartPauseForm
      if (action === 'start') {
        const selectedIncludesUnApprovedMonitoring = selectedRows.some((row) => row.approvalStatus !== 'approved');
        if (selectedIncludesUnApprovedMonitoring) {
          message.error('Selected job monitoring must be approved before starting');
          return;
        }
      }
      const startMonitoring = action === 'start' ? true : false;
      const selectedRowIds = selectedRows.map((row) => row.id);
      await toggleClusterMonitoringActiveStatus({ ids: selectedRowIds, isActive: startMonitoring });
      const updatedLandingZoneMonitoring = clusterMonitoring.map((lz) => {
        if (selectedRowIds.includes(lz.id)) {
          return { ...lz, isActive: startMonitoring };
        }
        return lz;
      });
      setClusterMonitoring(updatedLandingZoneMonitoring);
      message.success(`Selected ${action === 'start' ? 'Job Monitoring started' : 'Job Monitoring paused'}`);
    } catch (err) {
      message.error('Unable to start/pause selected job monitoring');
    }
  };

  // Action button menu items
  const menuItems = [
    {
      key: '1',
      label: 'Add New',
    },
    {
      key: '2',
      label: 'Bulk Edit',
      disabled: selectedRows.length < 2,
    },
    {
      key: '3',
      label: 'Bulk Approve or Reject',
      disabled: selectedRows.length < 2,
    },
    {
      key: '6',
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
                  <Button type="primary" style={{ width: '100%' }} onClick={bulkStartPauseClusterMonitoring}>
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
      key: '4',
      label: (
        <Popconfirm
          title={`Are you sure you want to delete selected ${selectedRows.length} monitoring?`}
          okButtonProps={{ type: 'primary', danger: true }}
          okText="Delete"
          onConfirm={deleteSelected}>
          Bulk Delete
        </Popconfirm>
      ),
      disabled: selectedRows.length < 2,
    },
    //     {
    //       key: '5',
    //       label: filtersVisible ? 'Hide filters' : 'Show filters',
    //     },
  ];

  return (
    <Dropdown
      disabled={isReader}
      dropdownRender={() => <Menu onClick={({ key }) => handleMenuSelection(key)} items={menuItems} />}>
      <Button type="primary">
        Cluster Monitoring Actions <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default ActionButton;

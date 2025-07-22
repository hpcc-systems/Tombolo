import React from 'react';
import { Menu, Dropdown, Button, message, Popconfirm } from 'antd';
import { DownOutlined } from '@ant-design/icons';

import { handleLzBulkDelete } from './Utils';

const ActionButton = ({
  handleAddNewLzMonitoringBtnClick,
  selectedRows,
  setSelectedRows,
  setLandingZoneMonitoring,
  setBulkEditModalVisibility,
  setBulkApprovalModalVisibility,
  isReader,
}) => {
  const deleteSelected = async () => {
    try {
      const selectedRowIds = selectedRows.map((row) => row.id);
      const res = await handleLzBulkDelete({ ids: selectedRowIds });
      setLandingZoneMonitoring((prev) =>
        prev.filter((landingZoneMonitoring) => !selectedRowIds.includes(landingZoneMonitoring.id))
      );
      setSelectedRows([]);

      if (res) {
        message.success('Selected landing zone monitorings deleted successfully');
      }
    } catch (err) {
      message.error('Unable to delete selected landing zone monitorings: ' + err);
    }
  };

  const handleMenuSelection = (key) => {
    if (key === '1') {
      handleAddNewLzMonitoringBtnClick();
    } else if (key === '2') {
      setBulkEditModalVisibility(true);
    } else if (key === '3') {
      setBulkApprovalModalVisibility(true);
    }
  };

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
      key: '4',
      label: (
        <Popconfirm
          title={`Are you sure you want to delete selected ${selectedRows.length} monitorings?`}
          okButtonProps={{ type: 'primary', danger: true }}
          okText="Delete"
          onConfirm={deleteSelected}>
          Bulk Delete
        </Popconfirm>
      ),
      disabled: selectedRows.length < 2,
    },
  ];

  return (
    <Dropdown
      disabled={isReader}
      dropdownRender={() => <Menu onClick={({ key }) => handleMenuSelection(key)} items={menuItems} />}>
      <Button type="primary">
        Landing Zone Monitoring Actions <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default ActionButton;

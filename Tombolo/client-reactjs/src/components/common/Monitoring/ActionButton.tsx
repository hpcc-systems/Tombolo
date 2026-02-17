import React, { useState } from 'react';
import { Menu, Dropdown, Button, Popconfirm, Popover, Form, Select, Card, Badge } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { handleError } from '@/components/common/handleResponse';

const { Option } = Select;

const MonitoringActionButton: React.FC<any> = ({
  label = 'Monitoring Actions',
  isReader = false,
  placement = 'bottomLeft',
  selectedRows = [],
  onAdd,
  onBulkEdit,
  onBulkApproveReject,
  onBulkDelete,
  onBulkStartPause,
  onToggleFilters,
  filtersStorageKey,
  showBulkApproveReject = false,
  showFiltersToggle = false,
  buttonType = 'primary',
  buttonDisabled,
}) => {
  const [bulkStartPauseForm] = Form.useForm();
  const [open, setOpen] = useState(false);

  const count = selectedRows?.length || 0;
  const disabledMulti = count < 2;

  const handleMenuSelection = (key: any) => {
    if (key === 'add' && onAdd) onAdd();
    if (key === 'bulkEdit' && onBulkEdit) onBulkEdit();
    if (key === 'bulkApproveReject' && onBulkApproveReject) onBulkApproveReject();
    if (key === 'toggleFilters' && onToggleFilters) {
      try {
        if (filtersStorageKey) {
          const current = localStorage.getItem(filtersStorageKey);
          localStorage.setItem(filtersStorageKey, String(!(current === 'true')));
        }
      } catch (_) {
        // ignore
      }
      onToggleFilters();
    }
    setOpen(false);
  };

  const deleteSelected = async () => {
    try {
      const ids = selectedRows.map((r: any) => r.id);
      await onBulkDelete?.(ids);
    } catch (err) {
      handleError('Unable to delete selected items');
    }
  };

  const bulkStartPause = async () => {
    try {
      const action = bulkStartPauseForm.getFieldValue('action');
      const ids = selectedRows.map((r: any) => r.id);
      await onBulkStartPause?.({ ids, action });
      setOpen(false);
    } catch (_) {
      handleError('Unable to start/pause selected items');
    }
  };

  const bulkStartPausePopover = (
    <Popover
      placement="left"
      content={
        <Card size="small">
          <Form layout="vertical" form={bulkStartPauseForm}>
            <Form.Item label="Select Action" name="action" required>
              <Select style={{ width: '20rem' }} placeholder="Choose action">
                <Option value="start">
                  <Badge color="green" style={{ marginRight: '1rem' }} />
                  Start selected {count}
                </Option>
                <Option value="pause">
                  <Badge color="red" style={{ marginRight: '1rem' }} />
                  Pause selected {count}
                </Option>
              </Select>
            </Form.Item>
            <Form.Item>
              <Button type="primary" style={{ width: '100%' }} onClick={bulkStartPause}>
                Apply
              </Button>
            </Form.Item>
          </Form>
        </Card>
      }
      trigger="click"
      onOpenChange={visible => {
        if (!visible) bulkStartPauseForm.resetFields();
      }}>
      <a>Bulk start/pause</a>
    </Popover>
  );

  const menuItems: any[] = [
    { key: 'add', label: 'Add New' },
    { key: 'bulkEdit', label: 'Bulk Edit', disabled: disabledMulti },
    { key: 'bulkStartPause', label: bulkStartPausePopover, disabled: disabledMulti },
    ...(showBulkApproveReject
      ? [{ key: 'bulkApproveReject', label: 'Bulk Approve / Reject', disabled: disabledMulti }]
      : []),
    {
      key: 'bulkDelete',
      label: (
        <Popconfirm
          title={`Are you sure you want to delete selected ${count} monitoring${count === 1 ? '' : 's'}?`}
          okButtonProps={{ type: 'primary', danger: true }}
          okText="Delete"
          onConfirm={deleteSelected}>
          <span style={{ color: 'var(--danger)' }}>Bulk Delete</span>
        </Popconfirm>
      ),
      disabled: disabledMulti,
    },
    ...(showFiltersToggle ? [{ key: 'toggleFilters', label: 'Show/Hide filters' }] : []),
  ];

  return (
    <Dropdown
      disabled={buttonDisabled ?? isReader}
      trigger={['click']}
      open={open}
      onOpenChange={(nextOpen: boolean, info: any) => {
        if (!info || info.source === 'trigger' || nextOpen) setOpen(nextOpen);
      }}
      popupRender={() => <Menu items={menuItems as any} onClick={({ key }) => handleMenuSelection(key)} />}
      placement={placement}>
      <Button type={buttonType} disabled={buttonDisabled ?? isReader}>
        {label} <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default MonitoringActionButton;

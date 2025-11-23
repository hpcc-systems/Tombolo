import React, { useState } from 'react';
import { Menu, Dropdown, Button, Popconfirm, Popover, Form, Select, Card, Badge } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { handleError, handleSuccess } from '@/components/common/handleResponse';

/**
 * Shared Monitoring Action Button
 *
 * Consolidates common action menu patterns used across Job, Cost, and Landing Zone monitoring pages.
 * It intentionally does NOT cover Cluster Monitoring yet (per prior request to skip it).
 *
 * Behavior highlights:
 * - Add new item
 * - Bulk Edit (disabled until 2+ rows are selected)
 * - Bulk Approve/Reject (optional via prop)
 * - Bulk Start/Pause using a Popover with a small form to select the action
 * - Bulk Delete using a Popconfirm (disabled until 2+ rows are selected)
 * - Optional Filters toggle with optional persistence via localStorage
 *
 * Props are kept generic so hosting pages can provide the exact handlers they need.
 *
 * @component
 * @param {Object} props
 * @param {string} [props.label='Monitoring Actions'] - The button label displayed next to the chevron.
 * @param {boolean} [props.isReader=false] - When true, disables the entire dropdown (read-only permission).
 * @param {'bottomLeft'|'bottomRight'|'topLeft'|'topRight'} [props.placement='bottomLeft'] - Dropdown placement.
 * @param {Array<Object>} [props.selectedRows=[]] - Currently selected rows; each row should include an `id` field.
 *
 * Handlers (all optional; if omitted, the corresponding menu item simply does nothing):
 * @param {Function} [props.onAdd] - Called when Add is chosen.
 * @param {Function} [props.onBulkEdit] - Called when Bulk Edit is chosen (requires 2+ selected rows).
 * @param {Function} [props.onBulkApproveReject] - Called when Bulk Approve/Reject is chosen (requires 2+ selected rows).
 * @param {Function} [props.onBulkDelete] - Called when Bulk Delete is confirmed. Receives array of selected ids.
 * @param {Function} [props.onBulkStartPause] - Called when Apply is clicked in the Bulk start/pause popover. Receives { ids, action }.
 * @param {Function} [props.onToggleFilters] - Called when Filters toggle is chosen.
 *
 * Feature toggles:
 * @param {boolean} [props.showBulkApproveReject=false] - Show the Bulk Approve/Reject menu item.
 * @param {boolean} [props.showFiltersToggle=false] - Show the Show/Hide filters menu item.
 * @param {string} [props.filtersStorageKey] - Optional localStorage key to persist filters visibility when toggled.
 *
 * Button appearance:
 * @param {'default'|'primary'|'dashed'|'link'|'text'} [props.buttonType='primary'] - Antd button type.
 * @param {boolean} [props.buttonDisabled] - Optional override to disable the button (defaults to `isReader`).
 */

const { Option } = Select;

const MonitoringActionButton = ({
  // Common button props
  label = 'Monitoring Actions',
  isReader = false,
  placement = 'bottomLeft',

  // Selection / state control
  selectedRows = [],

  // Handlers for external actions
  onAdd, // () => void
  onBulkEdit, // () => void
  onBulkApproveReject, // () => void
  onBulkDelete, // (ids: string[]) => Promise|void
  onBulkStartPause, // ({ ids: string[], action: 'start'|'pause' }) => Promise|void
  onToggleFilters, // () => void

  // Local storage key for filters visibility (optional)
  filtersStorageKey,

  // UI features toggles
  showBulkApproveReject = false,
  showFiltersToggle = false,
  buttonType = 'primary',
  buttonDisabled, // optional override
}) => {
  const [bulkStartPauseForm] = Form.useForm();
  const [open, setOpen] = useState(false);

  const count = selectedRows?.length || 0;
  const disabledMulti = count < 2;

  const handleMenuSelection = (key) => {
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
        // ignore persistence errors (e.g., private mode)
      }
      onToggleFilters();
    }
    setOpen(false);
  };

  const deleteSelected = async () => {
    try {
      const ids = selectedRows.map((r) => r.id);
      await onBulkDelete?.(ids);
    } catch (err) {
      handleError('Unable to delete selected items');
    }
  };

  const bulkStartPause = async () => {
    try {
      const action = bulkStartPauseForm.getFieldValue('action');
      const ids = selectedRows.map((r) => r.id);
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
      onOpenChange={(visible) => {
        if (!visible) bulkStartPauseForm.resetFields();
      }}>
      <a>Bulk start/pause</a>
    </Popover>
  );

  const menuItems = [
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
      onOpenChange={(nextOpen, info) => {
        if (!info || info.source === 'trigger' || nextOpen) setOpen(nextOpen);
      }}
      popupRender={() => <Menu items={menuItems} onClick={({ key }) => handleMenuSelection(key)} />}
      placement={placement}>
      <Button type={buttonType} disabled={buttonDisabled ?? isReader}>
        {label} <DownOutlined />
      </Button>
    </Dropdown>
  );
};

export default MonitoringActionButton;

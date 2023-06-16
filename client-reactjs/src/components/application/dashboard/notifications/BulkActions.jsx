import React, { useState, useEffect } from 'react';
import { Modal, Select, Form, Button, message, Input } from 'antd';
import { authHeader } from '../../../common/AuthHeader';
import { monitoringStatusOptions } from './monitoringStatusOptions.js';
import { v4 as uuidv4 } from 'uuid';
import { useForm } from 'antd/lib/form/Form';

const { TextArea } = Input;

function BulkActions({ selectedNotificationsForBulkAction, setBulkActionModalVisibility, setUpdatedNotificationInDb }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [footerBtn, setFooterBtn] = useState(null);

  const ids = selectedNotificationsForBulkAction.map((notification) => notification.id);
  const [actionForm] = useForm();

  const actions = [
    { label: `Delete notification${ids.length > 1 ? 's' : ''}`, value: 'delete' },
    { label: `Update status${ids.length > 1 ? 'es' : ''}`, value: 'update' },
    { label: `Update comment${ids.length > 1 ? 's' : ''}`, value: 'updateComment' },
  ];

  //Change footer buttons when status or actions change
  useEffect(() => {
    const btn = updateFooterBtns(selectedAction);
    setFooterBtn(btn);

    // If single notification selected, populate comment
    if (selectedNotificationsForBulkAction.length == 1) {
      actionForm.setFieldsValue({ comment: selectedNotificationsForBulkAction[0].comment });
    }
  }, [selectedStatus, selectedAction]);

  //Cancel btn
  const cancelBtn = (
    <Button
      type="primary"
      onClick={() => {
        setBulkActionModalVisibility(false);
      }}>
      Cancel
    </Button>
  );

  // func to update footer btns
  const updateFooterBtns = (selectedAction) => {
    switch (selectedAction) {
      case 'update':
        if (selectedStatus) {
          return (
            <Button type="primary" onClick={updateNotifications}>{`Update ${ids.length} Notification${
              ids.length > 1 ? 's' : ''
            }`}</Button>
          );
        } else {
          return cancelBtn;
        }
      case 'delete':
        return (
          <Button type="primary" onClick={deleteNotifications}>{`Delete ${ids.length} Notification${
            ids.length > 1 ? 's' : ''
          }`}</Button>
        );

      case 'updateComment':
        return (
          <Button type="primary" onClick={updateNotifications}>{`Update ${ids.length} comment${
            ids.length > 1 ? 's' : ''
          }`}</Button>
        );

      default:
        return cancelBtn;
    }
  };

  //Update notifications
  const updateNotifications = async () => {
    const payload = actionForm.getFieldsValue();
    console.log(payload);
    try {
      const config = {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify({ notifications: ids, ...payload }),
      };
      const response = await fetch(`/api/notifications/read`, config);
      if (!response.ok) throw new Error(response.statusText);
      const data = await response.json();
      if (!data.success) throw new Error('Failed to update');
      message.success('Update successful');
      setUpdatedNotificationInDb(uuidv4());
      setBulkActionModalVisibility(false);
    } catch (err) {
      message.error('Failed to update');
    }
  };

  //Delete notifications
  const deleteNotifications = async () => {
    try {
      const config = {
        method: 'DELETE',
        headers: authHeader(),
        body: JSON.stringify({ notifications: ids }),
      };
      const response = await fetch(`/api/notifications/read`, config);
      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      if (!data.success) throw new Error('Failed to delete');
      message.success('Successfully deleted');
      setUpdatedNotificationInDb(uuidv4());
      setBulkActionModalVisibility(false);
    } catch (err) {
      message.error('Failed to delete');
    }
  };

  return (
    <Modal
      visible={true}
      title="Actions"
      footer={footerBtn}
      destroyOnClose
      onCancel={() => {
        setBulkActionModalVisibility(false);
      }}>
      <Form layout="vertical" name="action" form={actionForm}>
        <Form.Item label="Select Action">
          <Select
            options={actions}
            onChange={(selection) => {
              setSelectedAction(null);
              setSelectedAction(selection);
            }}
          />
        </Form.Item>
        {selectedAction === 'update' ? (
          <Form.Item label="New status" name="status">
            <Select options={monitoringStatusOptions} onChange={(selection) => setSelectedStatus(selection)} />
          </Form.Item>
        ) : null}

        {selectedAction === 'updateComment' ? (
          <Form.Item label="comment" name="comment">
            <TextArea rows={3} />
          </Form.Item>
        ) : null}
      </Form>
    </Modal>
  );
}

export default BulkActions;

import React, { useState, useEffect } from 'react';
import { DownOutlined } from '@ant-design/icons';
import { Modal, Form, Select, Input, DatePicker, Button, Dropdown, Menu, Alert, List, Space, Card } from 'antd';
import dayjs from 'dayjs';

import { handleSuccess, handleError } from '@/components/common/handleResponse';
import { statuses } from './notificationUtil';
import notificationsService from '@/services/notifications.service';
import { getUser } from '../../../common/userStorage';

const { Option } = Select;
const { TextArea } = Input;

interface Props {
  displayUpdateModal: boolean;
  setDisplayUpdateModal: (v: boolean) => void;
  selectedNotificationsIds: any[];
  setSelectedNotificationsIds: (ids: any[]) => void;
  setSentNotifications: (s: any[]) => void;
  sentNotifications: any[];
  selectedNotification: any;
  setSelectedNotification: (n: any) => void;
}

const UpdateNotificationModal: React.FC<Props> = ({
  displayUpdateModal,
  setDisplayUpdateModal,
  selectedNotificationsIds,
  setSelectedNotificationsIds,
  setSentNotifications,
  sentNotifications,
  selectedNotification,
  setSelectedNotification,
}) => {
  const [form] = Form.useForm();
  const [actions, setActions] = useState<any>({
    status: 'Select action',
    jiraTickets: 'Select action',
    comment: 'Select action',
    resolutionDateTime: 'Select action',
  });
  const [updateStep, setUpdateStep] = useState(1);
  const [warningMessages, setWarningMessages] = useState<any[]>([]);

  const user = getUser();

  useEffect(() => {
    if (selectedNotificationsIds.length === 1) {
      const selectedNotificationDetails = sentNotifications.find(n => n.id === selectedNotificationsIds[0]);
      if (selectedNotificationDetails.resolutionDateTime)
        selectedNotificationDetails.resolutionDateTime = dayjs(selectedNotificationDetails.resolutionDateTime);
      if (selectedNotificationDetails.metaData?.asrSpecificMetaData?.jiraTickets)
        selectedNotificationDetails.jiraTickets = selectedNotificationDetails.metaData.asrSpecificMetaData.jiraTickets;
      form.setFieldsValue(selectedNotificationDetails);
    } else {
      form.resetFields();
    }
  }, [selectedNotificationsIds]);

  const generateWarningMessage = () => {
    const actionsCopy = { ...actions };
    for (let key in actionsCopy) {
      if (actionsCopy[key] === 'Select action' || actionsCopy[key] === 'None') delete actionsCopy[key];
    }
    if (Object.keys(actionsCopy).length === 0) return;

    const warnings: string[] = [];
    for (let key in actionsCopy) {
      switch (key) {
        case 'status':
          warnings.push(`${actionsCopy[key]} status for all selected notifications`);
          break;
        case 'jiraTickets':
          warnings.push(`${actionsCopy[key]} jira ticket(s) for all selected notifications`);
          break;
        case 'comment':
          warnings.push(`${actionsCopy[key]} comment(s) for all selected notifications`);
          break;
        case 'resolutionDateTime':
          warnings.push(`${actionsCopy[key]} resolution date for all selected notifications`);
          break;
        default:
          break;
      }
    }
    return warnings;
  };

  const defaultActions = () => {
    const actionsCopy = { ...actions };
    Object.keys(actionsCopy).forEach(k => (actionsCopy[k] = 'Select action'));
    return actionsCopy;
  };

  const handleActionChange = async ({ newAction, formItem }: any) => {
    if (newAction !== 'Update' || newAction !== 'Delete') {
      if (formItem === 'jiraTickets') form.setFieldsValue({ [formItem]: [] });
      else form.setFieldsValue({ [formItem]: undefined });
    }
    setActions({ ...actions, [formItem]: newAction });
  };

  const updateNotifications = async () => {
    try {
      form.validateFields();
    } catch (_err) {
      return;
    }

    try {
      const actionCopy = { ...actions };
      const fieldsToDelete: any = {};
      const fieldsToUpdate: any = {};
      for (let key in actionCopy) {
        if (actionCopy[key] === 'Delete' && key === 'jiraTickets') fieldsToUpdate[key] = [];
        else if (actionCopy[key] === 'Delete') fieldsToDelete[key] = null;
        else if (actionCopy[key] === 'Update') fieldsToUpdate[key] = form.getFieldValue(key);
        else continue;
      }

      let payload: any;
      if (selectedNotificationsIds.length === 1) payload = { ...form.getFieldsValue(true) };
      else payload = { ...fieldsToDelete, ...fieldsToUpdate };

      payload.updatedBy = { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email };
      payload.updatedAt = new Date();
      payload.ids = selectedNotificationsIds;

      const responseData = await notificationsService.updateMultipleNotifications(selectedNotificationsIds, payload);
      const updatedIds = responseData.map((notification: any) => notification.id);
      const allUpdatedNotifications: any[] = [];

      sentNotifications.forEach(notification => {
        if (updatedIds.includes(notification.id))
          allUpdatedNotifications.push(responseData.find((r: any) => r.id === notification.id));
        else allUpdatedNotifications.push(notification);
      });

      handleSuccess('Notifications updated successfully');
      setSentNotifications(allUpdatedNotifications);

      setActions(defaultActions());
      setUpdateStep(1);
      setDisplayUpdateModal(false);

      if (selectedNotificationsIds.length === 1) setSelectedNotificationsIds([]);
    } catch (_err) {
      handleError('Failed to save updated notification(s)');
    } finally {
      form.resetFields();
    }
  };

  const handleUpdateCancel = () => {
    form.resetFields();
    setActions(defaultActions());
    setUpdateStep(1);
    setSelectedNotification(null);
    setDisplayUpdateModal(false);
    if (selectedNotificationsIds.length === 1) setSelectedNotificationsIds([]);
  };

  const generateMenu = ({ menuItems, formItem }: any) => (
    <Menu onClick={e => handleActionChange({ newAction: e.key, formItem })}>
      {menuItems.map((menuItem: any) => (
        <Menu.Item typeof="link" key={menuItem}>
          {menuItem}
        </Menu.Item>
      ))}
    </Menu>
  );

  const generateSelectActionButton = ({ formItem }: any) => {
    const currentAction = actions[formItem];
    let btn: any = {};
    if (currentAction === 'None') {
      btn.label = 'No Action';
      btn.color = 'var(--primary)';
    } else if (currentAction === 'Select action') {
      btn.label = currentAction;
      btn.color = 'var(--primary)';
    } else {
      btn = { label: `${currentAction}`, color: 'var(--danger)' };
    }
    return (
      <Button size="small" type="link" style={{ color: btn.color, width: '110px' }}>
        {btn.label}
        <DownOutlined />
      </Button>
    );
  };

  const updateStep1 = (
    <Card>
      <Form form={form} layout="vertical">
        <Form.Item
          name="status"
          required={actions.status === 'Update' ? true : false}
          rules={[{ required: actions.status === 'Update', message: 'Status is required' }]}
          label={
            <div style={{ display: 'flex', width: '100vw', justifyContent: 'space-between' }}>
              <div>Status</div>
              {selectedNotificationsIds.length != 1 && (
                <Dropdown overlay={() => generateMenu({ menuItems: ['Update', 'None'], formItem: 'status' })}>
                  {generateSelectActionButton({ formItem: 'status', formLabel: 'status' })}
                </Dropdown>
              )}
            </div>
          }>
          <Select placeholder="Status" disabled={selectedNotificationsIds.length != 1 && actions.status != 'Update'}>
            {statuses.map((status, index) => (
              <Option key={index} value={status}>
                {status}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="jiraTickets"
          required={actions.jiraTickets === 'Update' ? true : false}
          rules={[{ required: actions.jiraTickets === 'Update', message: 'Jira Tickets are required' }]}
          label={
            <div style={{ display: 'flex', width: '100vw', justifyContent: 'space-between' }}>
              <div>Jira Ticket(s)</div>
              {selectedNotificationsIds.length != 1 && (
                <Dropdown
                  overlay={() => generateMenu({ menuItems: ['Update', 'Delete', 'None'], formItem: 'jiraTickets' })}>
                  {generateSelectActionButton({ formItem: 'jiraTickets', formLabel: 'ticket(s)' })}
                </Dropdown>
              )}
            </div>
          }>
          <Select
            mode="tags"
            placeholder="Coma separated - Jira Tickets"
            disabled={selectedNotificationsIds.length != 1 && actions.jiraTickets != 'Update'}
            tokenSeparators={[',']}
          />
        </Form.Item>
        <Form.Item
          name="comment"
          required={actions.comment === 'Update' ? true : false}
          rules={[{ required: actions.comment === 'Update', message: 'Comment is required' }]}
          label={
            <div style={{ display: 'flex', width: '100vw', justifyContent: 'space-between' }}>
              <div>Comment</div>
              {selectedNotificationsIds.length != 1 && (
                <Dropdown
                  overlay={() => generateMenu({ menuItems: ['Update', 'Delete', 'None'], formItem: 'comment' })}>
                  {generateSelectActionButton({ formItem: 'comment', formLabel: 'comment(s)' })}
                </Dropdown>
              )}
            </div>
          }>
          <TextArea
            placeholder="Comment"
            maxLength={300}
            autoSize={{ minRows: 3, maxRows: 6 }}
            style={{ resize: 'none' }}
            disabled={selectedNotificationsIds.length != 1 && actions.comment != 'Update'}
          />
        </Form.Item>

        <Form.Item
          name="resolutionDateTime"
          required={actions.resolutionDateTime === 'Update' ? true : false}
          rules={[{ required: actions.resolutionDateTime === 'Update', message: 'Resolution Date is required' }]}
          label={
            <div style={{ display: 'flex', width: '100vw', justifyContent: 'space-between' }}>
              <div>Resolution Date</div>
              {selectedNotificationsIds.length != 1 && (
                <Dropdown
                  overlay={() =>
                    generateMenu({ menuItems: ['Update', 'Delete', 'None'], formItem: 'resolutionDateTime' })
                  }>
                  {generateSelectActionButton({ formItem: 'resolutionDateTime', formLabel: 'date(s)' })}
                </Dropdown>
              )}
            </div>
          }>
          <DatePicker
            style={{ width: '100%' }}
            format="MM/DD/YYYY HH:mm"
            showTime={{ format: 'HH:mm' }}
            placeholder="Resolution Date"
            disabled={selectedNotificationsIds.length != 1 && actions.resolutionDateTime != 'Update'}
          />
        </Form.Item>
      </Form>
    </Card>
  );

  const updateStep2 = () => {
    let message =
      selectedNotificationsIds.length > 1
        ? `You are about to update ${selectedNotificationsIds.length} notifications. This action is irreversible. Review before proceeding`
        : `You are about to update 1 notification. This action is irreversible. Review before proceeding`;
    return (
      <Card>
        <Alert message={message} type="warning" showIcon />
        {warningMessages?.length > 0 && (
          <List
            size="small"
            bordered={false}
            dataSource={warningMessages}
            renderItem={(item, index) => <List.Item>{`${index + 1}. ${item}`}</List.Item>}
          />
        )}
      </Card>
    );
  };

  const handleStepChange = async (step: number) => {
    if (step === 2) {
      const allFormFieldsAndValues = form.getFieldsValue(true);
      const fieldNames = Object.keys(allFormFieldsAndValues);
      const fieldsTouched = fieldNames.filter(fieldName => form.isFieldTouched(fieldName));

      if (fieldsTouched.length === 0) {
        handleSuccess('No change detected');
        return;
      }

      let actionsSelected = false;
      for (let key in actions) {
        if (actions[key] !== 'Select action' && actions[key] !== 'None') {
          actionsSelected = true;
          break;
        }
      }

      if (!actionsSelected && selectedNotificationsIds.length > 1) {
        handleError('Select an action for at least one field');
        return;
      }

      try {
        await form.validateFields();
      } catch (_err) {
        return;
      }
      const warnings = generateWarningMessage();
      setWarningMessages(warnings as any[]);
      setUpdateStep(step);
    }

    if (step === 1) setUpdateStep(step);
  };

  const generateFooterButtons = () => {
    if (updateStep === 1) {
      return (
        <Space>
          <Button key="cancel" type="primary" ghost onClick={handleUpdateCancel}>
            Close
          </Button>
          <Button key="continue" type="primary" onClick={() => handleStepChange(2)}>
            Continue
          </Button>
        </Space>
      );
    }

    if (updateStep === 2) {
      return (
        <Space>
          <Button onClick={() => handleStepChange(1)}>Back</Button>
          <Button type="primary" onClick={updateNotifications}>
            Update
          </Button>
        </Space>
      );
    }
  };

  const title =
    selectedNotificationsIds.length === 1
      ? `Update  (${selectedNotification.searchableNotificationId})`
      : `Update ${selectedNotificationsIds.length} Notifications`;

  return (
    <Modal
      open={displayUpdateModal}
      title={title}
      maskClosable={false}
      width={700}
      onCancel={handleUpdateCancel}
      okText="Continue"
      onOk={updateNotifications}
      footer={generateFooterButtons()}>
      {updateStep === 1 && updateStep1}
      {updateStep === 2 && updateStep2()}
    </Modal>
  );
};

export default UpdateNotificationModal;

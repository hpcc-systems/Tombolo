// Packages
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DownOutlined } from '@ant-design/icons';
import { Modal, Form, Select, Input, DatePicker, Button, message, Dropdown, Menu, Alert, List, Space } from 'antd';
import dayjs from 'dayjs';

//Local Imports
import { statuses } from './notificationUtil';
import { updateMultipleNotifications } from './notificationUtil';

const { Option } = Select;
const { TextArea } = Input;

const UpdateNotificationModal = ({
  displayUpdateModal,
  setDisplayUpdateModal,
  selectedNotificationsIds,
  setSentNotifications,
  sentNotifications,
  setSelectedNotificationsIds,
}) => {
  const [form] = Form.useForm();
  const [actions, setActions] = useState({
    status: 'Select action',
    jiraTickets: 'Select action',
    comment: 'Select action',
    resolutionDateTime: 'Select action',
  });
  const [updateStep, setUpdateStep] = useState(1);
  const [warningMessages, setWarningMessages] = useState([]);

  //Redux
  const { user } = useSelector((state) => state.authenticationReducer);

  // Effects
  useEffect(() => {
    if (selectedNotificationsIds.length === 1) {
      const selectedNotificationDetails = sentNotifications.find((n) => n.id === selectedNotificationsIds[0]);
      if (selectedNotificationDetails.resolutionDateTime) {
        selectedNotificationDetails.resolutionDateTime = dayjs(selectedNotificationDetails.resolutionDateTime);
      }

      if (selectedNotificationDetails.metaData?.asrSpecificMetaData?.jiraTickets) {
        selectedNotificationDetails.jiraTickets = selectedNotificationDetails.metaData.asrSpecificMetaData.jiraTickets;
      }
      form.setFieldsValue(selectedNotificationDetails);
    } else {
      form.resetFields();
    }
  }, [selectedNotificationsIds]);

  //Generate warning message
  const generateWarningMessage = () => {
    const actionsCopy = { ...actions };
    for (let key in actionsCopy) {
      if (actionsCopy[key] === 'Select action' || actionsCopy[key] === 'None') {
        delete actionsCopy[key];
      }
    }
    if (Object.keys(actionsCopy).length === 0) {
      return;
    }

    const warnings = [];
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

  // Reset all actions to default
  const defaultActions = () => {
    const actionsCopy = { ...actions };
    Object.keys(actionsCopy).forEach((k) => {
      actionsCopy[k] = 'Select action';
    });
    return actionsCopy;
  };

  //Const handle action changes
  const handleActionChange = async ({ newAction, formItem }) => {
    if (newAction !== 'Update' || newAction !== 'Delete') {
      if (formItem === 'jiraTickets') {
        form.setFieldsValue({ [formItem]: [] }); // If formItem takes array empty it. nullifying won't work
      } else {
        form.setFieldsValue({ [formItem]: undefined });
      }
    }
    setActions({ ...actions, [formItem]: newAction });
  };

  // Update notification function
  const updateNotifications = async () => {
    try {
      form.validateFields();
    } catch (err) {
      return;
    }

    try {
      const actionCopy = { ...actions };
      const fieldsToDelete = {};
      const fieldsToUpdate = {};
      for (let key in actionCopy) {
        if (actionCopy[key] === 'Delete' && key === 'jiraTickets') {
          fieldsToUpdate[key] = []; // If formItem takes array empty it. nullifying won't work
        } else if (actionCopy[key] === 'Delete') {
          fieldsToDelete[key] = null;
        } else if (actionCopy[key] === 'Update') {
          fieldsToUpdate[key] = form.getFieldValue(key);
        } else {
          continue;
        }
      }

      // Payload
      let payload;
      if (selectedNotificationsIds.length === 1) {
        payload = { ...form.getFieldsValue(true) };
      } else {
        payload = { ...fieldsToDelete, ...fieldsToUpdate };
      }

      // Add updatedBy and updated At
      payload.updatedBy = { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email };
      payload.updatedAt = new Date();
      payload.ids = selectedNotificationsIds;

      // Make api request to update notification
      const responseData = await updateMultipleNotifications({ data: payload });
      const updatedIds = responseData.map((notification) => notification.id);
      const allUpdatedNotifications = [];

      // Set sentNotifications with updated data
      sentNotifications.forEach((notification) => {
        if (updatedIds.includes(notification.id)) {
          allUpdatedNotifications.push(responseData.find((r) => r.id === notification.id));
        } else {
          allUpdatedNotifications.push(notification);
        }
      });

      message.success('Notifications updated successfully');
      setSentNotifications(allUpdatedNotifications);

      // Reset sate and form fields
      setActions(defaultActions());
      setUpdateStep(1);
      setDisplayUpdateModal(false);

      // If more than 1 selected don't clear, user may want to take additional actions
      if (selectedNotificationsIds.length === 1) {
        setSelectedNotificationsIds([]);
      }
    } catch (err) {
      console.error(err);
      message.error('Enter updated information');
    } finally {
      form.resetFields();
    }
  };

  // When cancel button is clicked or closed modal with X
  const handleUpdateCancel = () => {
    form.resetFields();
    setActions(defaultActions());
    setUpdateStep(1);
    // setSelectedNotification(null);
    setDisplayUpdateModal(false);
    // If more than 1 selected don't clear, user may want to take additional actions
    if (selectedNotificationsIds.length === 1) {
      setSelectedNotificationsIds([]);
    }
  };

  //Generate menu
  const generateMenu = ({ menuItems, formItem }) => {
    return (
      <Menu onClick={(e) => handleActionChange({ newAction: e.key, formItem })}>
        {menuItems.map((menuItem) => (
          <Menu.Item typeof="link" key={menuItem}>
            {menuItem}
          </Menu.Item>
        ))}
      </Menu>
    );
  };

  //Generate select action button
  const generateSelectActionButton = ({ formItem }) => {
    const currentAction = actions[formItem];
    let btn = {};
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

  // update step 1 - get user inputs
  const updateStep1 = (
    <div>
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
    </div>
  );

  // update step 2 - confirm update
  const updateStep2 = () => {
    let message;
    if (selectedNotificationsIds.length > 1) {
      message = `You are about to update ${selectedNotificationsIds.length} notifications. This action is irreversible. Review before proceeding`;
    } else {
      message = `You are about to update 1 notification. This action is irreversible. Review before proceeding`;
    }
    return (
      <div>
        <Alert message={message} type="warning" showIcon />
        {warningMessages?.length > 0 && (
          <List
            size="small"
            bordered={false}
            dataSource={warningMessages}
            renderItem={(item, index) => <List.Item>{`${index + 1}. ${item}`}</List.Item>}
          />
        )}
      </div>
    );
  };

  // Handle step change
  const handleStepChange = async (step) => {
    if (step === 2) {
      // List of fields
      const allFormFieldsAndValues = form.getFieldsValue(true);
      const fieldNames = Object.keys(allFormFieldsAndValues);

      // Check if any of these fields were touched
      const fieldsTouched = fieldNames.filter((fieldName) => form.isFieldTouched(fieldName));

      if (fieldsTouched.length === 0) {
        message.info('No change detected');
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
        message.error('Select an action for at least one field');
        return;
      }

      try {
        await form.validateFields();
      } catch (err) {
        return;
      }
      const warnings = generateWarningMessage();
      setWarningMessages(warnings);
      setUpdateStep(step);
    }

    if (step === 1) {
      setUpdateStep(step);
    }
  };

  //Generate footer buttons
  const generateFooterButtons = () => {
    if (updateStep === 1) {
      return (
        <Space>
          <Button key="cancel" onClick={handleUpdateCancel}>
            Cancel
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

  return (
    <Modal
      open={displayUpdateModal}
      title={`Update ${selectedNotificationsIds.length} Notifications`}
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

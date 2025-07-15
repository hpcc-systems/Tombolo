import React, { useState } from 'react';
import { Modal, Form, Button, message, Input, Select, Checkbox } from 'antd';
import { handleBulkApproveDirectoryMonitorings, getAllDirectoryMonitorings } from './Utils';

const { useForm } = Form;

const BulkApprovalModal = ({
  bulkApprovalModalVisibility,
  setBulkApprovalModalVisibility,
  selectedRows,
  user,
  applicationId,
  setDirectoryMonitorings,
}) => {
  const [form] = useForm();

  const [action, setAction] = useState('');

  // When cancel button is clicked
  const handleCancel = () => {
    setBulkApprovalModalVisibility(false);
    setAction('');
    form.resetFields();
  };

  // When reject or accepted is clicked
  const handleSubmit = async () => {
    try {
      await form.validateFields();
    } catch (error) {
      message.error(error);
    }

    try {
      const formData = form.getFieldsValue();

      formData.approvalStatus = action;
      formData.approved = true;
      formData.approvedAt = new Date();
      formData.approvedBy = JSON.stringify({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });

      if (formData.active === undefined) {
        formData.active = false;
      }

      const response = await handleBulkApproveDirectoryMonitorings({
        selectedDirectoryMonitorings: selectedRows,
        formData,
      });

      if (response.error) {
        message.error('Error saving your response');
      } else {
        message.success('Your response has been saved');
        form.resetFields();
        const allDirectoryMonitorings = await getAllDirectoryMonitorings({ applicationId });

        setDirectoryMonitorings(allDirectoryMonitorings);
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setBulkApprovalModalVisibility(false);
      setAction('');
    }
  };
  return (
    <Modal
      open={bulkApprovalModalVisibility}
      onCancel={handleCancel}
      // closable={false}
      maskClosable={false}
      width={600}
      footer={
        <>
          <Button key="reject" type="primary" danger onClick={() => handleCancel()}>
            Cancel
          </Button>
          <Button key="accepted" type="primary" onClick={() => handleSubmit()}>
            Submit
          </Button>
        </>
      }>
      <div style={{ padding: '5px' }}>
        <Form form={form} layout="vertical">
          <Form.Item
            label="Comments"
            name="approvalNote"
            rules={[
              { required: true, message: 'Please enter comments' },
              { min: 4, message: 'Comments must be at least 4 characters' },
              { max: 200, message: 'Comments cannot exceed 200 characters' },
            ]}>
            <Input.TextArea rows={3} maxLength={200} showCount placeholder="Comments" />
          </Form.Item>
          <Form.Item label="Action" name="action" rules={[{ required: true, message: 'Please select an action' }]}>
            <Select
              placeholder="Select an action"
              initialValue={'Please Select an Action'}
              onChange={(e) => {
                setAction(e);
              }}
              style={{ width: '100%' }}>
              <Select.Option value="Approved">Approve</Select.Option>
              <Select.Option value="Rejected">Reject</Select.Option>
            </Select>
          </Form.Item>

          {action === 'Approved' && (
            <Form.Item label="Start monitoring now?" valuePropName="checked" name="active">
              <Checkbox defaultChecked={false}></Checkbox>
              {/* <Select placeholder="Select an action" initialValue={'Please make a selection'} style={{ width: '100%' }}>
                <Select.Option value={true}>Yes</Select.Option>
                <Select.Option value={false}>No</Select.Option>
              </Select> */}
            </Form.Item>
          )}
        </Form>
      </div>
    </Modal>
  );
};

export default BulkApprovalModal;

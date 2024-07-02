import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Tooltip, Select, Checkbox } from 'antd';
import { Constants } from '../../common/Constants.js';
import { approveSelectedMonitoring, handleBulkApproveDirectoryMonitorings } from './Utils.js';

const ApproveRejectModal = ({
  id,
  displayAddRejectModal,
  setDisplayAddRejectModal,
  setSelectedMonitoring,
  user,
  selectedMonitoring,
  fetchAllDirectoryMonitorings,
  selectedRows,
}) => {
  const [form] = Form.useForm();
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [monitoringEvaluated, setMonitoringEvaluated] = useState(false);
  const [action, setAction] = useState('');
  const [active, setActive] = useState(false);

  //When component mounts check if monitoring is already evaluated
  useEffect(() => {
    if (selectedMonitoring) {
      if (selectedMonitoring?.approvalStatus !== 'Pending') {
        setMonitoringEvaluated(true);
      } else {
        setMonitoringEvaluated(false);
      }
    }
  }, [selectedMonitoring]);

  // When cancel button is clicked
  const handleCancel = () => {
    setDisplayAddRejectModal(false);
    form.resetFields();
    setSelectedMonitoring(null);
  };

  // When reject or accepted is clicked
  const handleSubmit = async () => {
    setSavingEvaluation(true);
    let fromErr = false;
    try {
      await form.validateFields();
    } catch (error) {
      fromErr = true;
    }

    if (fromErr) {
      setSavingEvaluation(false);
      return;
    }

    try {
      const formData = form.getFieldsValue();
      formData.id = id;
      formData.approvalStatus = action;
      formData.approved = action === 'Rejected' ? false : true;
      formData.approvedAt = new Date();
      formData.approvedBy = JSON.stringify({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });

      formData.active = active;

      let response = null;

      if (selectedRows && !selectedMonitoring) {
        response = await handleBulkApproveDirectoryMonitorings({
          selectedDirectoryMonitorings: selectedRows,
          formData,
        });
      } else {
        response = await approveSelectedMonitoring({ updatedData: formData });
      }

      if (response.error) {
        message.error('Error saving your response');
      } else {
        message.success('Your response has been saved');
        form.resetFields();
        setSelectedMonitoring(null);
        setDisplayAddRejectModal(false);
        setMonitoringEvaluated(false);
        setAction('');
        setActive(false);
        fetchAllDirectoryMonitorings();
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setSavingEvaluation(false);
    }
  };

  return (
    <Modal
      open={displayAddRejectModal}
      onCancel={handleCancel}
      // closable={false}
      maskClosable={false}
      width={600}
      footer={
        !monitoringEvaluated
          ? [
              <Button key="cancel" onClick={handleCancel} disabled={savingEvaluation}>
                Cancel
              </Button>,
              <Button key="accepted" type="primary" onClick={() => handleSubmit()} disabled={savingEvaluation}>
                Submit
              </Button>,
            ]
          : [
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>,
              <Button key="modify" type="primary" danger onClick={() => setMonitoringEvaluated(false)}>
                Modify
              </Button>,
            ]
      }>
      <div style={{ padding: '5px' }}>
        {monitoringEvaluated && selectedMonitoring ? (
          <div style={{ marginTop: '15px' }}>
            This monitoring was{' '}
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{selectedMonitoring?.approvalStatus}</span> by{' '}
            <Tooltip title={<div>{JSON.parse(selectedMonitoring?.approvedBy)?.email}</div>}>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                {JSON.parse(selectedMonitoring?.approvedBy)?.name}{' '}
              </span>
            </Tooltip>
            on {new Date(selectedMonitoring?.approvedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}.
          </div>
        ) : (
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
                <Form.Item valuePropName="checked" name="active">
                  <label style={{ marginRight: '1rem' }}> Start monitoring now? </label>
                  <Checkbox defaultChecked={false} onChange={(e) => setActive(e.target.checked)}></Checkbox>
                </Form.Item>
              )}
            </Form>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ApproveRejectModal;

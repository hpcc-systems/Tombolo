import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Tooltip } from 'antd';

import { authHeader } from '../../common/AuthHeader.js';
import { Constants } from '../../common/Constants';

const ApproveRejectModal = ({
  id,
  displayAddRejectModal,
  setDisplayAddRejectModal,
  setSelectedMonitoring,
  user,
  selectedMonitoring,
  setJobMonitorings,
}) => {
  const [form] = Form.useForm();
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [monitoringEvaluated, setMonitoringEvaluated] = useState(false);

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
  const handleSubmit = async ({ action }) => {
    setSavingEvaluation(true);
    let fromErr = false;
    try {
      await form.validateFields();
    } catch (error) {
      fromErr = true;
    }

    if (fromErr) {
      console.log('Form error');
      return;
    }

    try {
      const formData = form.getFieldsValue();
      formData.id = id;
      formData.approvalStatus = action;
      formData.approvedBy = JSON.stringify({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });
      const payload = {
        method: 'PATCH',
        header: authHeader(),
        body: JSON.stringify(formData),
      };

      const response = await fetch(`/api/jobmonitoring/evaluate`, payload);

      if (!response.ok) {
        message.error('Error saving your response');
      } else {
        message.success('Your response has been saved');
        form.resetFields();
        setSelectedMonitoring(null);
        setDisplayAddRejectModal(false);
        setJobMonitorings((prev) => {
          const index = prev.findIndex((item) => item.id === id);
          prev[index] = {
            ...prev[index],
            approvalStatus: action,
            approvedBy: JSON.stringify({
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
            }),
            approvedAt: new Date(),
            approverComment: formData.approverComment,
          };
          return [...prev];
        });
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setSavingEvaluation(false);
    }
  };

  return (
    <Modal
      visible={displayAddRejectModal}
      onCancel={handleCancel}
      // closable={false}
      maskClosable={false}
      width={600}
      footer={
        !monitoringEvaluated
          ? [
              <Button
                key="reject"
                type="primary"
                danger
                onClick={() => handleSubmit({ action: 'Rejected' })}
                disabled={savingEvaluation}>
                Reject
              </Button>,
              <Button
                key="accepted"
                type="primary"
                onClick={() => handleSubmit({ action: 'Approved' })}
                disabled={savingEvaluation}>
                Approve
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
      <>
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
          <Form form={form} layout="vertical">
            <Form.Item
              label="Comments"
              name="approverComment"
              rules={[
                { required: true, message: 'Please enter comments' },
                { min: 3, message: 'Comments must be at least 3 characters' },
                { max: 200, message: 'Comments cannot exceed 200 characters' },
              ]}>
              <Input.TextArea rows={3} maxLength={200} showCount placeholder="Comments" />
            </Form.Item>
          </Form>
        )}
      </>
    </Modal>
  );
};

export default ApproveRejectModal;

import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Tooltip } from 'antd';

import { Constants } from '../../common/Constants.js';

import { approveSelectedMonitoring } from './Utils.js';

const ApproveRejectModal = ({
  id,
  displayAddRejectModal,
  setDisplayAddRejectModal,
  setSelectedMonitoring,
  user,
  selectedMonitoring,
  setDirectoryMonitorings,
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
      setSavingEvaluation(false);
      return;
    }

    try {
      const formData = form.getFieldsValue();
      formData.id = id;
      formData.approvalStatus = action;
      formData.approved = true;
      formData.approvedAt = new Date();
      formData.approvedBy = JSON.stringify({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      });

      const response = await approveSelectedMonitoring({ updatedData: formData });
      console.log(response);
      if (response.error) {
        message.error('Error saving your response');
      } else {
        message.success('Your response has been saved');
        form.resetFields();
        setSelectedMonitoring(null);
        setDisplayAddRejectModal(false);
        setDirectoryMonitorings((prev) => {
          const index = prev.findIndex((item) => item.id === id);
          prev[index] = {
            ...prev[index],
            approvalStatus: action,
            active: action === 'rejected' ? false : prev[index].active,
            approvedBy: JSON.stringify({
              id: user.id,
              name: `${user.firstName} ${user.lastName}`,
              email: user.email,
            }),
            approvedAt: new Date(),
            approvalNote: formData.approvalNote,
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
      open={displayAddRejectModal}
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
          </Form>
        )}
      </div>
    </Modal>
  );
};

export default ApproveRejectModal;

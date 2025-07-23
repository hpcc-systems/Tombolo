import React, { useEffect, useState } from 'react';
import { Button, Checkbox, Form, Input, message, Modal, Select, Tooltip } from 'antd';

import { authHeader } from '../../common/AuthHeader.js';
import { Constants } from '../../common/Constants';

const CostMonitoringApproveRejectModal = ({
  id,
  displayAddRejectModal,
  setDisplayAddRejectModal,
  setSelectedMonitoring,
  user,
  selectedMonitoring,
  setCostMonitorings,
  selectedRows,
}) => {
  const [form] = Form.useForm();
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [monitoringEvaluated, setMonitoringEvaluated] = useState(false);
  const [isActive, setIsActive] = useState(true);

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

  // Handle action change
  const handleActionChange = (value) => {
    if (value === 'Rejected') {
      setIsActive(false);
    } else {
      setIsActive(true);
    }
  };

  // Monitor changes to the approvalStatus field
  useEffect(() => {
    form.setFieldsValue({
      isActive: form.getFieldValue('approvalStatus') !== 'Rejected',
    });
  }, [form.getFieldValue('approvalStatus')]);

  const handleCancel = () => {
    setDisplayAddRejectModal(false);
    form.resetFields();
    setSelectedMonitoring(null);
  };

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
      if (selectedRows.length > 0) {
        formData.ids = selectedRows.map((row) => row.id);
      } else {
        formData.ids = [id];
      }
      formData.isActive = formData.isActive || false;
      const approverObj = {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
      };

      const payload = {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ ...formData, approvedBy: approverObj }),
      };

      const response = await fetch(`/api/costMonitoring/evaluate`, payload);

      if (!response.ok) {
        message.error('Error saving your response');
      } else {
        message.success('Your response has been saved');
        form.resetFields();
        setSelectedMonitoring(null);
        setDisplayAddRejectModal(false);
        setCostMonitorings((prev) => {
          return prev.map((item) => {
            if (formData.ids.includes(item.id)) {
              return {
                ...item,
                approvalStatus: formData.approvalStatus,
                isActive: formData.approvalStatus === 'Rejected' ? false : formData.isActive,
                approvedBy: approverObj,
                approvedAt: new Date(),
                approverComment: formData.approverComment,
              };
            }
            return item;
          });
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
      maskClosable={false}
      width={600}
      title={selectedRows.length > 0 ? 'Bulk Approve/Reject Cost Monitoring' : 'Approve/Reject Cost Monitoring'}
      footer={
        !monitoringEvaluated
          ? [
              <Button key="cancel" onClick={handleCancel}>
                Cancel
              </Button>,
              <Button key="save" type="primary" onClick={handleSubmit} disabled={savingEvaluation}>
                Save
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
            This cost monitoring was{' '}
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{selectedMonitoring?.approvalStatus}</span> by{' '}
            <Tooltip title={<div>{selectedMonitoring?.approvedBy ? selectedMonitoring?.approvedBy?.email : ''}</div>}>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                {selectedMonitoring?.approvedBy ? selectedMonitoring?.approvedBy?.name : ''}{' '}
              </span>
            </Tooltip>
            on {new Date(selectedMonitoring?.approvedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}.
          </div>
        ) : (
          <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
            {selectedRows.length > 0 && (
              <div style={{ marginBottom: '16px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
                <strong>Bulk Action:</strong> You are about to approve/reject {selectedRows.length} cost monitoring(s).
              </div>
            )}
            <Form.Item
              label="Action"
              name="approvalStatus"
              rules={[{ required: true, message: 'Please select an action' }]}>
              <Select placeholder="Select an action" onChange={handleActionChange}>
                <Select.Option value="Approved">Approve</Select.Option>
                <Select.Option value="Rejected">Reject</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="Comments"
              name="approverComment"
              rules={[
                { required: true, message: 'Please enter comments' },
                { min: 4, message: 'Comments must be at least 4 characters' },
                { max: 200, message: 'Comments cannot exceed 200 characters' },
              ]}>
              <Input.TextArea rows={3} maxLength={200} showCount placeholder="Comments" />
            </Form.Item>
            <Form.Item name="isActive" valuePropName={isActive ? 'checked' : 'unchecked'}>
              <Checkbox disabled={!isActive}>Start monitoring</Checkbox>
            </Form.Item>
          </Form>
        )}
      </div>
    </Modal>
  );
};

export default CostMonitoringApproveRejectModal;

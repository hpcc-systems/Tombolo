// Libraries
import React, { useState, useEffect } from 'react';
import { Modal, Button, Tooltip, Form, Select, Input, Checkbox, message } from 'antd';

// local imports
import { Constants } from '../../common/Constants';
import { evaluateClusterMonitoring } from './clusterMonitoringUtils.js';

// Component for Approve/Reject Modal
function ApproveRejectModal({
  displayApproveRejectModal,
  setApproveRejectModal,
  selectedRows,
  selectedMonitoring,
  setSelectedMonitoring,
  setClusterMonitoring,
}) {
  // Local States
  const [form] = Form.useForm();
  const [monitoringEvaluated, setMonitoringEvaluated] = useState(false);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [isActive, setIsActive] = useState(true);

  //When component mounts check if monitoring is already evaluated
  useEffect(() => {
    if (selectedMonitoring) {
      if (selectedMonitoring?.approvalStatus !== 'pending') {
        setMonitoringEvaluated(true);
      } else {
        setMonitoringEvaluated(false);
      }
    }
  }, [selectedMonitoring]);

  // Handle Cancel
  const handleCancel = () => {
    setApproveRejectModal(false);
    setSavingEvaluation(false);
  };

  // Handle Submit
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
        formData.ids = [selectedMonitoring.id];
      }
      formData.isActive = formData.isActive || false;

      const response = await evaluateClusterMonitoring(formData);

      const updatedMonitoring = response.data;
      setClusterMonitoring((prevMonitoring) => {
        const updatedIds = updatedMonitoring.map((mon) => mon.id);
        return prevMonitoring.map((mon) =>
          updatedIds.includes(mon.id) ? updatedMonitoring.find((updatedMon) => updatedMon.id === mon.id) || mon : mon
        );
      });

      message.success('Your response has been saved');
      form.resetFields();
      setSelectedMonitoring(null);
      setApproveRejectModal(false);
    } catch (error) {
      message.error(error.message);
    } finally {
      setSavingEvaluation(false);
    }
  };

  // Handle Action Change
  const handleActionChange = (value) => {
    if (value === 'rejected') {
      setIsActive(false);
    } else {
      setIsActive(true);
    }
  };
  return (
    <Modal
      open={displayApproveRejectModal}
      onCancel={handleCancel}
      maskClosable={false}
      width={600}
      title={selectedRows.length > 0 ? 'Bulk Approve/Reject Cluster Monitoring' : 'Approve/Reject Cost Monitoring'}
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
            This Cluster monitoring was{' '}
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{selectedMonitoring?.approvalStatus}</span> by{' '}
            <Tooltip title={<div>{selectedMonitoring?.approver ? selectedMonitoring?.approver?.email : ''}</div>}>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                {selectedMonitoring?.approver
                  ? `${selectedMonitoring?.approver?.firstName} ${selectedMonitoring?.approver?.lastName}`
                  : ''}{' '}
              </span>
            </Tooltip>
            on {new Date(selectedMonitoring?.approvedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}.
          </div>
        ) : (
          <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
            <Form.Item
              label="Action"
              name="approvalStatus"
              rules={[{ required: true, message: 'Please select an action' }]}>
              <Select placeholder="Select an action" onChange={handleActionChange}>
                <Select.Option value="approved">Approve</Select.Option>
                <Select.Option value="rejected">Reject</Select.Option>
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
}

export default ApproveRejectModal;

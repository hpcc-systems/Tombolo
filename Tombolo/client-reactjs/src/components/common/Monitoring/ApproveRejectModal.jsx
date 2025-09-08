import { useState, useEffect } from 'react';
import { Modal, Button, Tooltip, Form, Select, Input, Checkbox, message } from 'antd';

/**
 * Shared Approve/Reject Modal for monitoring types
 * @param {object} props
 * @param {boolean} props.visible
 * @param {function} props.onCancel
 * @param {object} props.selectedMonitoring
 * @param {function} props.setSelectedMonitoring
 * @param {array} props.selectedRows
 * @param {function} props.setMonitoring
 * @param {string} [props.monitoringTypeLabel]
 * @param {function(any): Promise<any>} props.evaluateMonitoring
 * @param {function(): Promise<void> | undefined} props.onSuccess
 * @param {import('react').ReactNode} modalProps
 */
const ApproveRejectModal = ({
  visible,
  onCancel,
  selectedMonitoring,
  setSelectedMonitoring,
  selectedRows = [],
  setMonitoring,
  monitoringTypeLabel = 'Monitoring',
  evaluateMonitoring,
  onSuccess,
  ...modalProps
}) => {
  const [form] = Form.useForm();
  const [monitoringEvaluated, setMonitoringEvaluated] = useState(false);
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (selectedMonitoring) {
      const status = selectedMonitoring?.approvalStatus;
      const hasApprover = !!selectedMonitoring?.approver;
      // Consider evaluated only when explicitly approved or rejected AND approver exists
      if ((status === 'approved' || status === 'rejected') && hasApprover) {
        setMonitoringEvaluated(true);
      } else {
        setMonitoringEvaluated(false);
      }
    } else {
      setMonitoringEvaluated(false);
    }
  }, [selectedMonitoring]);

  const handleCancel = () => {
    onCancel();
    setSavingEvaluation(false);
  };

  const handleSubmit = async () => {
    setSavingEvaluation(true);
    let formErr = false;
    try {
      await form.validateFields();
    } catch (error) {
      formErr = true;
    }
    if (formErr) {
      setSavingEvaluation(false);
      return;
    }
    try {
      const formData = form.getFieldsValue();
      if (selectedRows.length > 0) {
        formData.ids = selectedRows.map((row) => row.id);
      } else if (selectedMonitoring?.id) {
        formData.ids = [selectedMonitoring.id];
      }
      // Ensure isActive is false when rejecting
      if (formData.approvalStatus === 'rejected') {
        formData.isActive = false;
      } else {
        formData.isActive = !!formData.isActive;
      }

      // Extensibility: expects a setMonitoring function to update the list after evaluation
      // You should pass an async function via props to handle the evaluation and update
      if (typeof evaluateMonitoring === 'function') {
        const response = await evaluateMonitoring(formData);
        const updatedMonitoring = response?.data;
        if (Array.isArray(updatedMonitoring)) {
          // When API returns an array of updated items
          setMonitoring((prevMonitoring) => {
            const updatedIds = updatedMonitoring.map((mon) => mon.id);
            return prevMonitoring.map((mon) =>
              updatedIds.includes(mon.id)
                ? updatedMonitoring.find((updatedMon) => updatedMon.id === mon.id) || mon
                : mon
            );
          });
          message.success(response?.message || 'Your response has been saved');
          form.resetFields();
          // If a single item was selected, keep the modal display consistent by updating it as well
          if (selectedMonitoring && updatedMonitoring.length === 1) {
            setSelectedMonitoring(updatedMonitoring[0]);
          } else {
            setSelectedMonitoring(null);
          }
          onCancel();
        } else if (updatedMonitoring && typeof updatedMonitoring === 'object') {
          // When API returns a single updated object in data
          const updatedObj = updatedMonitoring;
          if (typeof setMonitoring === 'function') {
            setMonitoring((prevMonitoring) =>
              Array.isArray(prevMonitoring)
                ? prevMonitoring.map((mon) => (mon.id === updatedObj.id ? updatedObj : mon))
                : prevMonitoring
            );
          }
          // Update the selected item in-place so UI reflects latest values without refetch
          if (selectedMonitoring && selectedMonitoring.id === updatedObj.id) {
            setSelectedMonitoring(updatedObj);
          }
          message.success(response?.message || 'Your response has been saved');
          form.resetFields();
          onCancel();
        } else if (response?.success || typeof response === 'string') {
          // If response is a success object or a string message, show success and close
          message.success(
            response?.message || (typeof response === 'string' ? response : 'Your response has been saved')
          );
          if (onSuccess) {
            await onSuccess();
          }
          form.resetFields();
          setSelectedMonitoring(null);
          onCancel();
        } else {
          message.error('Evaluation did not return a valid array or object.');
        }
      } else {
        message.error('No evaluation handler provided.');
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setSavingEvaluation(false);
    }
  };

  const handleActionChange = (value) => {
    if (value === 'rejected') {
      setIsActive(false);
      // Also ensure the form value reflects disabled/false state
      form.setFieldsValue({ isActive: false });
    } else {
      setIsActive(true);
      // Default to true when not rejected, unless user unchecks
      const current = form.getFieldValue('isActive');
      if (typeof current === 'undefined') {
        form.setFieldsValue({ isActive: true });
      }
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={handleCancel}
      maskClosable={false}
      width={600}
      title={
        selectedRows.length > 0 ? `Bulk Approve/Reject ${monitoringTypeLabel}` : `Approve/Reject ${monitoringTypeLabel}`
      }
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
      }
      {...modalProps}>
      <div style={{ padding: '5px' }}>
        {monitoringEvaluated && selectedMonitoring && selectedMonitoring?.approver ? (
          <div style={{ marginTop: '15px' }}>
            This monitoring was{' '}
            <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{selectedMonitoring?.approvalStatus}</span> by{' '}
            <Tooltip title={<div>{selectedMonitoring?.approver ? selectedMonitoring?.approver?.email : ''}</div>}>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                {selectedMonitoring?.approver
                  ? `${selectedMonitoring?.approver?.firstName} ${selectedMonitoring?.approver?.lastName}`
                  : ''}{' '}
              </span>
            </Tooltip>
            {selectedMonitoring?.approvedAt && (
              <> on {new Date(selectedMonitoring?.approvedAt).toLocaleDateString('en-US')}</>
            )}
            .
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
            <Form.Item name="isActive" valuePropName="checked">
              <Checkbox disabled={!isActive}>Start monitoring</Checkbox>
            </Form.Item>
          </Form>
        )}
      </div>
    </Modal>
  );
};

export default ApproveRejectModal;

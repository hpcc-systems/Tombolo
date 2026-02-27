import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Modal, Button, Tooltip, Form, Select, Input, Checkbox } from 'antd';
import { APPROVAL_STATUS } from '@/components/common/Constants';
import { handleError, handleSuccess } from '@/components/common/handleResponse';

const { TextArea } = Input;

const ApproveRejectModal: FC<any> = ({
  visible,
  onCancel,
  selectedMonitoring,
  setSelectedMonitoring,
  selectedRows = [],
  setMonitoring,
  monitoringTypeLabel = 'Monitoring',
  evaluateMonitoring,
  onSuccess,
  onSubmit,
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
      if ((status === APPROVAL_STATUS.APPROVED || status === APPROVAL_STATUS.REJECTED) && hasApprover) {
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
    } catch (_error) {
      formErr = true;
    }
    if (formErr) {
      setSavingEvaluation(false);
      return;
    }
    try {
      const formData = form.getFieldsValue();
      if (selectedRows.length > 0) {
        formData.ids = selectedRows.map((row: any) => row.id);
      } else if (selectedMonitoring?.id) {
        formData.ids = [selectedMonitoring.id];
      }
      if (formData.approvalStatus === APPROVAL_STATUS.REJECTED) {
        formData.isActive = false;
      } else {
        formData.isActive = !!formData.isActive;
      }

      if (onSubmit) {
        await onSubmit(formData);
        return;
      }

      if (typeof evaluateMonitoring === 'function') {
        const response = await evaluateMonitoring(formData);
        const updatedMonitoring = response?.data || response;
        if (Array.isArray(updatedMonitoring) && setMonitoring) {
          setMonitoring((prevMonitoring: any[]) => {
            const updatedIds = updatedMonitoring.map((mon: any) => mon.id);
            return prevMonitoring.map(mon =>
              updatedIds.includes(mon.id) ? updatedMonitoring.find((u: any) => u.id === mon.id) || mon : mon
            );
          });
          handleSuccess(response?.message || 'Your response has been saved');
          form.resetFields();
          if (selectedMonitoring && updatedMonitoring.length === 1) {
            setSelectedMonitoring(updatedMonitoring[0]);
          } else {
            setSelectedMonitoring(null);
          }
          onCancel();
        } else if (updatedMonitoring && typeof updatedMonitoring === 'object') {
          const updatedObj = updatedMonitoring;
          if (typeof setMonitoring === 'function') {
            setMonitoring((prevMonitoring: any) =>
              Array.isArray(prevMonitoring)
                ? prevMonitoring.map(mon => (mon.id === updatedObj.id ? updatedObj : mon))
                : prevMonitoring
            );
          }
          if (selectedMonitoring && selectedMonitoring.id === updatedObj.id) {
            setSelectedMonitoring(updatedObj);
          }
          handleSuccess(response?.message || 'Your response has been saved');
          form.resetFields();
          onCancel();
        } else if (response?.success || typeof response === 'string') {
          handleSuccess(
            response?.message || (typeof response === 'string' ? response : 'Your response has been saved')
          );
          if (onSuccess) await onSuccess();
          form.resetFields();
          setSelectedMonitoring(null);
          onCancel();
        } else {
          handleError('Evaluation did not return a valid array or object.');
        }
      } else {
        handleError('No evaluation handler provided.');
      }
    } catch (error: any) {
      handleError(error?.message);
    } finally {
      setSavingEvaluation(false);
    }
  };

  const handleActionChange = (value: any) => {
    if (value === APPROVAL_STATUS.REJECTED) {
      setIsActive(false);
      form.setFieldsValue({ isActive: false });
    } else {
      setIsActive(true);
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
              <TextArea rows={3} maxLength={200} showCount placeholder="Comments" />
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

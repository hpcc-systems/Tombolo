/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message, Tooltip, Select, Checkbox } from 'antd';
import { Constants } from '../../common/Constants.js';
import { approveSelectedMonitoring } from './Utils';
import { flattenObject } from '../../common/CommonUtil';
import {
  identifyErroneousTabs,
  getAllLzMonitorings,
  updateMonitoring,
  isScheduleUpdated,
  createLandingZoneMonitoring, //TODO WIP
} from './Utils';

const ApproveRejectModal = ({
  id,
  displayAddRejectModal,
  setDisplayAddRejectModal,
  setSelectedMonitoring,
  selectedMonitoring,
  selectedRows,
  applicationId,
  setLandingZoneMonitoring,
}) => {
  const [form] = Form.useForm();
  const [savingEvaluation, setSavingEvaluation] = useState(false);
  const [monitoringEvaluated, setMonitoringEvaluated] = useState(false);
  const [action, setAction] = useState('');
  const [active, setActive] = useState(false);

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
      let response = null;
      let selectedRowsIds;

      if (selectedRows && !selectedMonitoring) {
        selectedRowsIds = selectedRows.map((row) => {
          return row.id;
        });
        response = await approveSelectedMonitoring({
          ...formData,
          ids: selectedRowsIds,
        });
      } else {
        formData.ids = [id];
        response = await approveSelectedMonitoring(formData);
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
        const updatedLzMonitoringData = await getAllLzMonitorings({ applicationId });
        const flattenedData = updatedLzMonitoringData.map((monitoring) => flattenObject(monitoring));

        setLandingZoneMonitoring(flattenedData);
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
            <Tooltip title={<div>{selectedMonitoring['approver.email']}</div>}>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                {selectedMonitoring['approver.firstName']} {selectedMonitoring['approver.lastName']}
              </span>
            </Tooltip>{' '}
            on {new Date(selectedMonitoring?.approvedAt).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS)}.
          </div>
        ) : (
          <div style={{ padding: '5px' }}>
            <Form form={form} layout="vertical">
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
              <Form.Item
                label="Action"
                name="approvalStatus"
                rules={[{ required: true, message: 'Please select an action' }]}>
                <Select
                  placeholder="Select an action"
                  initialValue={'Please Select an Action'}
                  onChange={(e) => {
                    setAction(e);
                  }}
                  style={{ width: '100%' }}>
                  <Select.Option value="approved">Approve</Select.Option>
                  <Select.Option value="rejected">Reject</Select.Option>
                </Select>
              </Form.Item>

              {action === 'approved' && (
                <Form.Item valuePropName="checked" name="isActive">
                  <Checkbox defaultChecked={false} onChange={(e) => setActive(e.target.checked)}>
                    Start monitoring now
                  </Checkbox>
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

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Checkbox, Card, Form, Input } from 'antd';

import './jobMonitoring.css';
import SchedulePicker from './SchedulePicker';
import AsrSpecificMonitoringDetails from './AsrSpecificMonitoringDetails';

function JobMonitoringTab({
  intermittentScheduling,
  setIntermittentScheduling,
  completeSchedule,
  setCompleteSchedule,
  form,
  cron,
  setCron,
  cronMessage,
  setCronMessage,
  erroneousScheduling,
  monitoringScope,
}) {
  const [activateMonitoring, setActivateMonitoring] = useState(false);

  //Redux
  const {
    applicationReducer: { integrations },
  } = useSelector((state) => state);

  const asrIntegration = integrations?.find((integration) => integration.name === 'ASR') !== undefined;

  return (
    <div>
      {/* Cluster wide monitoring does not require scheduling because all you are doing is monitoring the new work units in cluster that meet notification conditions */}
      {monitoringScope === 'ClusterWideMonitoring' ? null : (
        <Card className="modal-card" style={{ border: '1px solid #dadada' }}>
          <SchedulePicker
            intermittentScheduling={intermittentScheduling}
            setIntermittentScheduling={setIntermittentScheduling}
            completeSchedule={completeSchedule}
            setCompleteSchedule={setCompleteSchedule}
            cron={cron}
            setCron={setCron}
            cronMessage={cronMessage}
            setCronMessage={setCronMessage}
          />
          {erroneousScheduling && (
            <div style={{ color: 'var(--danger)', textAlign: 'center' }}>Please select schedule for the job</div>
          )}
        </Card>
      )}

      <Card className="modal-card-2" style={{ border: '1px solid #dadada' }}>
        {asrIntegration && <AsrSpecificMonitoringDetails form={form} />}
        <Form form={form} layout="vertical" initialValues={{ isActive: false }}>
          {/* conditionally render this field if ASR is disabled */}
          {!asrIntegration && (
            <Form.Item
              label="Maximum Build Time / Threshold (in mins)"
              name="threshold"
              required={form.getFieldValue('notificationCondition')?.includes('ThresholdExceeded')}
              rules={[
                {
                  validator: async (_, value) => {
                    if (form.getFieldValue('notificationCondition')?.includes('ThresholdExceeded')) {
                      if (!value) {
                        return Promise.reject(new Error('This field is required'));
                      } else if (!(parseInt(value) > 0 && parseInt(value) < 1440)) {
                        return Promise.reject(new Error('Threshold should be between 0 and 1440'));
                      }
                    }
                  },
                },
              ]}>
              <Input type="number" min={1} max={1440} style={{ width: '50%' }} placeholder="Threshold (in minutes)" />
            </Form.Item>
          )}

          <Form.Item
            name="isActive"
            valuePropName="checked"
            extra={
              activateMonitoring ? (
                <div style={{ marginTop: '-10px', marginLeft: '20px', color: 'var(--primary)' }}>
                  (Note: Monitoring will only become active upon approval)
                </div>
              ) : null
            }>
            <Checkbox checked={activateMonitoring} onChange={(e) => setActivateMonitoring(e.target.checked)}>
              {' '}
              Activate Job Monitoring{' '}
            </Checkbox>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default JobMonitoringTab;

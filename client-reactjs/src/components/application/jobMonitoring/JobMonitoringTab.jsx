import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Checkbox, Card, Form, TimePicker } from 'antd';

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
  selectedCluster,
}) {
  const [activateMonitoring, setActivateMonitoring] = useState(false);
  const [clusterOffset, setClusterOffset] = useState(null);

  useEffect(() => {
    if (selectedCluster?.timezone_offset === null || selectedCluster?.timezone_offset === undefined) return;
    const offSet = selectedCluster.timezone_offset / 60;
    if (offSet == 0) {
      setClusterOffset('UTC');
    } else {
      setClusterOffset(`UTC ${offSet}`);
    }
  }, [selectedCluster]);

  //Redux
  const {
    applicationReducer: {
      application: { applicationId },
      integrations,
    },
  } = useSelector((state) => state);

  const asrIntegration = integrations.some(
    (integration) => integration.name === 'ASR' && integration.application_id === applicationId
  );

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
        {asrIntegration && <AsrSpecificMonitoringDetails form={form} clusterOffset={clusterOffset} />}
        <Form form={form} layout="vertical" initialValues={{ isActive: false }}>
          {/* conditionally render this field if ASR is disabled */}
          {!asrIntegration && (
            <Form.Item label="Expected Run/Completion Time (HH:MM) " name="expectedRunCompletionTime">
              <TimePicker style={{ width: '50%' }} format="HH:mm" suffixIcon={clusterOffset} />
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

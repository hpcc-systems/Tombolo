import React, { useState, useEffect } from 'react';
import { Card, Form, TimePicker, Row, Col, Select } from 'antd';
import SchedulePicker from '../../jobMonitoring/SchedulePicker';

const { Option } = Select;

function MonitoringTab({
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
  selectedCluster,
}) {
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

  return (
    <div>
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
          <div style={{ color: '#ff4d4f', textAlign: 'center' }}>Please select schedule for the directory</div>
        )}
      </Card>

      <Card className="modal-card-2" style={{ border: '1px solid #dadada' }}>
        <Form form={form} layout="vertical">
          {/* Always render below fields*/}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Expected Start Time (HH:MM) "
                name="expectedStartTime"
                rules={[{ required: true, message: 'Expected start time is a required' }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" suffixIcon={clusterOffset} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Expected Completion Time (HH:MM) "
                name="expectedCompletionTime"
                rules={[{ required: true, message: 'Expected completion time is a required' }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" suffixIcon={clusterOffset} />
              </Form.Item>
            </Col>
          </Row>

          <Col span={12}>
            <Form.Item
              label="Require Complete"
              name="requireComplete"
              rules={[{ required: true, message: 'Please select one option' }]}>
              <Select placeholder="Require complete">
                <Option key="yes" value={true}>
                  Yes
                </Option>
                <Option key="no" value={false}>
                  No
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Form>
      </Card>
    </div>
  );
}

export default MonitoringTab;

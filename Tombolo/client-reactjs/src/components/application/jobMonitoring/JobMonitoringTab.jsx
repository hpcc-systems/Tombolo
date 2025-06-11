import React, { useState, useEffect, useRef } from 'react';
import { Card, Form, TimePicker, Row, Col, Select, InputNumber } from 'antd';

import './jobMonitoring.css';
import SchedulePicker from './SchedulePicker';

const { Option } = Select;

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
  const [clusterOffset, setClusterOffset] = useState(null);
  const isFirstRender = useRef(true);

  // Generating cluster offset string to display in time picker
  useEffect(() => {
    if (selectedCluster?.timezone_offset === null || selectedCluster?.timezone_offset === undefined) return;
    const offSet = selectedCluster.timezone_offset / 60;
    if (offSet == 0) {
      setClusterOffset('UTC');
    } else {
      setClusterOffset(`UTC ${offSet}`);
    }
  }, [selectedCluster]);

  // When intermittent scheduling is changed, clear Expected start and end time
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false; // Set to false after the first render
    } else {
      form.setFieldsValue({ expectedStartTime: null, expectedCompletionTime: null });
    }
  }, [intermittentScheduling]);

  // Function to disable specific hours
  const getDisabledTime = (type) => {
    if (type === 'morning') {
      return {
        disabledHours: () => [...Array(24).keys()].filter((hour) => hour >= 12), // Disable afternoon hours
        disabledMinutes: () => [], // No minutes are disabled
      };
    } else if (type === 'afternoon') {
      return {
        disabledHours: () => [...Array(24).keys()].filter((hour) => hour < 12), // Disable morning hours
        disabledMinutes: () => [], // No minutes are disabled
      };
    }
    return {
      disabledHours: () => [], // Enable all hours
      disabledMinutes: () => [], // No minutes are disabled
    };
  };
  // Custom validation rule to compare times
  // Higher-order validation function to compare times with additional parameters
  const validateCompletionTime = (runWindow) => (_, value) => {
    const startTime = form.getFieldValue('expectedStartTime');

    if (runWindow !== 'overnight') {
      if (startTime && value && value.isBefore(startTime)) {
        return Promise.reject(new Error(`Completion time cannot be earlier than start time.`));
      }
    }
    return Promise.resolve();
  };

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
            <div style={{ color: '#ff4d4f', textAlign: 'center' }}>Please select schedule for the job</div>
          )}
        </Card>
      )}

      <Card className="modal-card-2" style={{ border: '1px solid #dadada' }}>
        <Form form={form} layout="vertical">
          {/* Always render below fields*/}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Expected Start Time (HH:MM) "
                name="expectedStartTime"
                rules={[{ required: true, message: 'Expected start time is a required' }]}>
                <TimePicker
                  placeholder={intermittentScheduling?.runWindow === 'overnight' ? 'Previous Day' : 'Select Time'}
                  disabledTime={() =>
                    getDisabledTime(
                      intermittentScheduling?.runWindow === 'overnight'
                        ? 'afternoon'
                        : intermittentScheduling?.runWindow
                    )
                  }
                  style={{ width: '100%' }}
                  format="HH:mm"
                  suffixIcon={clusterOffset}
                  addon={() => (intermittentScheduling?.runWindow === 'overnight' ? <div>Previous Day</div> : null)}
                  showNow={false}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Expected Completion Time (HH:MM) "
                name="expectedCompletionTime"
                rules={[
                  { required: true, message: 'Expected completion time is a required' },
                  { validator: (_, value) => validateCompletionTime(intermittentScheduling?.runWindow)(_, value) },
                ]}>
                <TimePicker
                  disabledTime={() =>
                    getDisabledTime(
                      intermittentScheduling?.runWindow === 'overnight' ? 'morning' : intermittentScheduling?.runWindow
                    )
                  }
                  style={{ width: '100%' }}
                  format="HH:mm"
                  suffixIcon={clusterOffset}
                  showNow={false}
                  addon={() => (intermittentScheduling?.runWindow === 'overnight' ? <div>Current Day</div> : null)}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
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

            <Col span={12}>
              <Form.Item
                label=" Max execution time (in minutes)"
                name="maxExecutionTime"
                rules={[{ required: false, message: 'Please select one option' }]}>
                <InputNumber type="number" style={{ width: '100%' }} min={1}></InputNumber>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}

export default JobMonitoringTab;

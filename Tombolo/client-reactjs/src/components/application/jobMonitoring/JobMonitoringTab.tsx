import React, { useEffect, useState } from 'react';
import { Card, Form, TimePicker, Row, Col, Select, InputNumber } from 'antd';
import type { FormInstance } from 'antd';

import styles from './jobMonitoring.module.css';
import SchedulePicker from './SchedulePicker';

const { Option } = Select;

interface Props {
  intermittentScheduling: any;
  setIntermittentScheduling: (v: any) => void;
  completeSchedule: any[];
  setCompleteSchedule: (v: any[] | ((p: any[]) => any[])) => void;
  form: FormInstance<any>;
  cron?: string;
  setCron?: (v: string) => void;
  cronMessage?: any;
  setCronMessage?: (v: any) => void;
  erroneousScheduling?: boolean;
  monitoringScope?: string;
  selectedCluster?: any;
  isEditing?: boolean;
}

const JobMonitoringTab: React.FC<Props> = ({
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
  isEditing,
}) => {
  const [clusterOffset, setClusterOffset] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCluster?.timezone_offset === null || selectedCluster?.timezone_offset === undefined) return;
    const offSet = selectedCluster.timezone_offset / 60;
    if (offSet === 0) {
      setClusterOffset('UTC');
    } else {
      setClusterOffset(`UTC ${offSet}`);
    }
  }, [selectedCluster]);

  const getDisabledTime = (type: any) => {
    if (type === 'morning') {
      return {
        disabledHours: () => [...Array(24).keys()].filter(hour => hour >= 12),
        disabledMinutes: () => [],
      };
    } else if (type === 'afternoon') {
      return {
        disabledHours: () => [...Array(24).keys()].filter(hour => hour < 12),
        disabledMinutes: () => [],
      };
    }
    return { disabledHours: () => [], disabledMinutes: () => [] };
  };

  const validateCompletionTime = (runWindow: any) => (_: any, value: any) => {
    const startTime = form.getFieldValue('expectedStartTime');

    if (runWindow !== 'overnight') {
      if (startTime && value && value.isBefore && value.isBefore(startTime)) {
        return Promise.reject(new Error(`Completion time cannot be earlier than start time.`));
      }
    }
    return Promise.resolve();
  };

  return (
    <div>
      {monitoringScope === 'ClusterWideMonitoring' ? null : (
        <Card className={styles.modalCard}>
          <SchedulePicker
            intermittentScheduling={intermittentScheduling}
            setIntermittentScheduling={setIntermittentScheduling}
            completeSchedule={completeSchedule}
            setCompleteSchedule={setCompleteSchedule}
            cron={cron}
            setCronMessage={setCronMessage}
            isEditing={isEditing}
          />
          {erroneousScheduling && <div className={styles.erroneousScheduling}>Please select schedule for the job</div>}
        </Card>
      )}

      <Card className={styles.modalCard2}>
        <Form form={form} layout="vertical">
          {intermittentScheduling.frequency !== 'anytime' && (
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
                    renderExtraFooter={() =>
                      intermittentScheduling?.runWindow === 'overnight' ? <div>Previous Day</div> : null
                    }
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
                        intermittentScheduling?.runWindow === 'overnight'
                          ? 'morning'
                          : intermittentScheduling?.runWindow
                      )
                    }
                    style={{ width: '100%' }}
                    format="HH:mm"
                    suffixIcon={clusterOffset}
                    renderExtraFooter={() =>
                      intermittentScheduling?.runWindow === 'overnight' ? <div>Current Day</div> : null
                    }
                    showNow={false}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

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
                <InputNumber type="number" style={{ width: '100%' }} min={1} placeholder="Max execution time" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default JobMonitoringTab;

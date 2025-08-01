import React, { useState, useEffect } from 'react';
import { Card, Form, TimePicker, InputNumber, Row, Col } from 'antd';
import SchedulePicker from '../../jobMonitoring/SchedulePicker';
import AsrSpecificMonitoring from './ASRSpecificMonitoring';
import { useSelector } from 'react-redux';

import styles from '../directoryMonitoring.module.css';

function MonitoringTab({
  intermittentScheduling,
  setIntermittentScheduling,
  completeSchedule,
  setCompleteSchedule,
  form,
  cron,
  // setCron,
  // cronMessage,
  setCronMessage,
  erroneousScheduling,
  selectedCluster,
  domains,
  productCategories,
  setSelectedDomain,
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
      <Card className={styles.modalCard}>
        <SchedulePicker
          intermittentScheduling={intermittentScheduling}
          setIntermittentScheduling={setIntermittentScheduling}
          completeSchedule={completeSchedule}
          setCompleteSchedule={setCompleteSchedule}
          cron={cron}
          // setCron={setCron}
          // cronMessage={cronMessage}
          setCronMessage={setCronMessage}
        />
        {erroneousScheduling && (
          <div className={styles.erroneousScheduling}>Please select schedule for the directory</div>
        )}
      </Card>

      <Card className={styles.modalCard2}>
        {asrIntegration && (
          <AsrSpecificMonitoring
            form={form}
            clusterOffset={clusterOffset}
            domains={domains}
            productCategories={productCategories}
            setSelectedDomain={setSelectedDomain}
          />
        )}
      </Card>
      <Card className={styles.modalCard2}>
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Expected File Move By Time (HH:MM)"
                name="expectedMoveByTime"
                rules={[{ required: false, message: 'Expected start time is a required' }]}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" suffixIcon={clusterOffset} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Minimum File Count" name="minimumFileCount" rules={[{ required: false }]}>
                <InputNumber style={{ width: '100%' }} defaultValue={0} max={32768} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Maxiumum File Count" name="maximumFileCount" rules={[{ required: false }]}>
                <InputNumber style={{ width: '100%' }} defaultValue={0} max={32768} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
}

export default MonitoringTab;

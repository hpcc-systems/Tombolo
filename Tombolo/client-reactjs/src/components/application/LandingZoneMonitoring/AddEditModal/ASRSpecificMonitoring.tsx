import React from 'react';
import { Form, Card, Row, Col, Input, InputNumber } from 'antd';

function ASRSpecificMonitoring({ form }: any) {
  return (
    <Form form={form} layout="vertical">
      <Card size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="ASR Threshold"
              name="asrThreshold"
              rules={[{ required: true, message: 'Required field' }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="ASR Directory" name="asrDirectory">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
}

export default ASRSpecificMonitoring;

import React from 'react';
import { Form, Card, Row, Col, Input, Switch } from 'antd';

function ASRSpecificNotification({ form }: any) {
  return (
    <Form form={form} layout="vertical">
      <Card size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="ASR Notify" name="asrNotify" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="ASR Message" name="asrMessage">
              <Input />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
}

export default ASRSpecificNotification;

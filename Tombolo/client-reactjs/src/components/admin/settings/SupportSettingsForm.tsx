import React from 'react';
import { Form, Input, Row, Col } from 'antd';
import type { FormInstance } from 'antd';

interface SupportSettings {
  supportUrl?: string;
  supportEmail?: string;
  metaData?: any;
}

interface SupportSettingsFormProps {
  supportSettingsForm: FormInstance;
  instanceSettings: SupportSettings;
}

const SupportSettingsForm: React.FC<SupportSettingsFormProps> = ({ supportSettingsForm, instanceSettings }) => {
  return (
    <Form
      form={supportSettingsForm}
      layout="vertical"
      initialValues={{ supportUrl: instanceSettings?.supportUrl, supportEmail: instanceSettings?.supportEmail }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Support URL" name="supportUrl" rules={[{ type: 'url', message: 'Enter a valid URL' }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="Support Email"
            name="supportEmail"
            rules={[{ type: 'email', message: 'Enter a valid email' }]}>
            <Input />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default SupportSettingsForm;

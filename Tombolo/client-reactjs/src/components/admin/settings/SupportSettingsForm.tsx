import React from 'react';
import { Form, Select, Row, Col, Typography } from 'antd';
import type { FormInstance } from 'antd';

const { Text } = Typography;

const ROLE_OPTIONS = [
  { label: 'Owner', value: 'owner' },
  { label: 'Administrator', value: 'administrator' },
  { label: 'Contributor', value: 'contributor' },
  { label: 'Reader', value: 'reader' },
];

interface SupportSettings {
  metaData?: {
    supportEmailRecipientsRoles?: string[];
    supportEmailRecipients?: string[];
    accessRequestEmailRecipientsRoles?: string[];
    accessRequestEmailRecipientsEmail?: string[];
  };
}

interface SupportSettingsFormProps {
  supportSettingsForm: FormInstance;
  instanceSettings: SupportSettings;
}

const SupportSettingsForm: React.FC<SupportSettingsFormProps> = ({ supportSettingsForm, instanceSettings }) => {
  const metaData = instanceSettings?.metaData ?? {};

  return (
    <Form
      form={supportSettingsForm}
      layout="vertical"
      initialValues={{
        supportEmailRecipientsRoles: metaData.supportEmailRecipientsRoles ?? [],
        supportEmailRecipients: metaData.supportEmailRecipients ?? [],
        accessRequestEmailRecipientsRoles: metaData.accessRequestEmailRecipientsRoles ?? [],
        accessRequestEmailRecipientsEmail: metaData.accessRequestEmailRecipientsEmail ?? [],
      }}>
      <Text strong>Who receives support emails (e.g., password resets, application issues)</Text>
      <Row gutter={16} style={{ marginTop: 12 }}>
        <Col span={12}>
          <Form.Item label="Roles" name="supportEmailRecipientsRoles">
            <Select mode="multiple" placeholder="Select roles" options={ROLE_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Email addresses" name="supportEmailRecipients" rules={[{ type: 'array' }]}>
            <Select mode="tags" placeholder="Enter email addresses" tokenSeparators={[',']} />
          </Form.Item>
        </Col>
      </Row>
      <Text strong>Who receives access request emails (e.g., application access, role access)</Text>
      <Row gutter={16} style={{ marginTop: 12 }}>
        <Col span={12}>
          <Form.Item label="Roles" name="accessRequestEmailRecipientsRoles">
            <Select mode="multiple" placeholder="Select roles" options={ROLE_OPTIONS} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Email addresses" name="accessRequestEmailRecipientsEmail" rules={[{ type: 'array' }]}>
            <Select mode="tags" placeholder="Enter email addresses" tokenSeparators={[',']} />
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default SupportSettingsForm;

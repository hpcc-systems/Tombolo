import React from 'react';
import { Form, Card, Row, Col, Select, InputNumber, Input, Switch } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import InfoDrawer from '../../../common/InfoDrawer';

const { Option } = Select;

function NotificationTab({ form, showNotificationDrawerSetter }: any) {
  const [showUserGuide, setShowUserGuide] = React.useState(false);
  const [selectedUserGuideName, setSelectedUserGuideName] = React.useState('');

  return (
    <Form form={form} layout="vertical">
      <Card size="small">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Notify on" name="notifyOn" rules={[{ required: true, message: 'Required field' }]}>
              <Select>
                <Option value="thresholdExceeded">Threshold Exceeded</Option>
                <Option value="fileDropped">File Dropped</Option>
                <Option value="fileCountExceeded">File Count Exceeded</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={
                <>
                  <span>Notification Type</span>
                  <InfoCircleOutlined
                    style={{ marginLeft: '.5rem', color: 'var(--primary)' }}
                    onClick={() => {
                      setShowUserGuide(true);
                      setSelectedUserGuideName('notificationTypes');
                    }}
                  />
                </>
              }
              name="notificationType"
              rules={[{ required: true, message: 'Required field' }]}>
              <Select>
                <Option value="email">Email</Option>
                <Option value="slack">Slack</Option>
                <Option value="webhook">Webhook</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="To (Email)" name="toEmail" rules={[{ type: 'email', message: 'Invalid email' }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Frequency (mins)"
              name="frequency"
              rules={[{ required: true, message: 'Required field' }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Enabled" name="enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Message Template" name="template">
              <Input.TextArea rows={3} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <InfoDrawer
        open={showUserGuide}
        onClose={() => setShowUserGuide(false)}
        width="500px"
        content={selectedUserGuideName}
      />
    </Form>
  );
}

export default NotificationTab;

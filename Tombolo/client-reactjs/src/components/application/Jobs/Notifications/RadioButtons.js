import React from 'react';
import { Form, Button, Space, Radio } from 'antd';
import Text from '../../../common/Text';
function NotifyField({ showDetails, enableEdit, notifyStatus, setShowDetails, setNotifyStatus }) {
  const notificationOptions = [
    { label: <Text text="Never" />, value: 'Never' },
    { label: <Text text="Only on success" />, value: 'Only on success' },
    { label: <Text text="Only on failure" />, value: 'Only on failure' },
    { label: <Text text="Always" />, value: 'Always' },
  ];

  return (
    <Form.Item label={<Text text="Notify" />}>
      <Space>
        <Form.Item name="notify" className={enableEdit ? null : 'read-only-input'}>
          <Radio.Group>
            {notificationOptions.map((option) => (
              <Radio
                key={option.value}
                value={option.value}
                onChange={(e) => (setNotifyStatus ? setNotifyStatus(e.target.value) : null)}>
                {option.label}
              </Radio>
            ))}
          </Radio.Group>
        </Form.Item>
        {!enableEdit && notifyStatus !== 'Never' && (
          <Button onClick={() => setShowDetails((prev) => !prev)}>
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        )}
      </Space>
    </Form.Item>
  );
}

export default NotifyField;

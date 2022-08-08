import React from 'react';
import { Form, Button, Space, Radio } from 'antd';

const notificationOptions = [
  { label: 'Never', value: 'Never' },
  { label: 'Only on success', value: 'Only on success' },
  { label: 'Only on failure', value: 'Only on failure' },
  { label: 'Always', value: 'Always' },
];

function NotifyField({ showDetails, enableEdit, notifyStatus, setShowDetails, setNotifyStatus }) {
  return (
    <Form.Item label="Notify">
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

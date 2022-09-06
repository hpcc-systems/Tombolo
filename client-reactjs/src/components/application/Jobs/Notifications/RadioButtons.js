import React from 'react';
import { Form, Button, Space, Radio } from 'antd';
import { useTranslation } from 'react-i18next';

function NotifyField({ showDetails, enableEdit, notifyStatus, setShowDetails, setNotifyStatus }) {
  const { t } = useTranslation(['common']); // t for translate -> getting namespaces relevant to this file

  const notificationOptions = [
    { label: t('Never', { ns: 'common' }), value: 'Never' },
    { label: t('Only on success', { ns: 'common' }), value: 'Only on success' },
    { label: t('Only on failure', { ns: 'common' }), value: 'Only on failure' },
    { label: t('Always', { ns: 'common' }), value: 'Always' },
  ];

  return (
    <Form.Item label={t('Notify', { ns: 'common' })}>
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

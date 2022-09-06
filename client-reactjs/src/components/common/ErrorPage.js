import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Button, Typography } from 'antd';

const ErrorPage = ({ message }) => {
  const { t } = useTranslation(['common']);
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Alert
        type="error"
        showIcon
        message={message ? null : 'Failed to authenticate'}
        description={
          <>
            <Typography.Title level={4}>{t('Something went wrong, please refresh the page')}</Typography.Title>
            {!message ? null : (
              <Typography.Paragraph
                style={{ maxWidth: '400px' }}
                ellipsis={{
                  rows: 2,
                  expandable: true,
                  symbol: 'more',
                }}
                copyable
                code
                type="danger">
                Error: {message}
              </Typography.Paragraph>
            )}
            <Button type="primary" onClick={() => window.location.reload()}>
              {t('Refresh', { ns: 'common' })}
            </Button>
          </>
        }
      />
    </div>
  );
};

export default ErrorPage;

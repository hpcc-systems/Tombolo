import React from 'react';
import { Alert, Button, Typography } from 'antd';
import Text from '../common/Text';

import styles from './common.module.css';

const ErrorPage = ({ message }) => {
  return (
    <div className={styles.errorPageContainer}>
      <Alert
        type="error"
        showIcon
        message={message ? null : 'Failed to authenticate'}
        description={
          <>
            <Typography.Title level={4}>
              {<Text text="Something went wrong, please refresh the page" />}
            </Typography.Title>
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
              {<Text text="Refresh" />}
            </Button>
          </>
        }
      />
    </div>
  );
};

export default ErrorPage;

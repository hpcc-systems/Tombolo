import React from 'react';
import { Typography } from 'antd';

type Props = { value?: React.ReactNode; children?: React.ReactNode } & Record<string, any>;

const ReadOnlyField: React.FC<Props> = ({ value, children, ...rest }) => (
  <Typography.Text {...rest} style={{ paddingLeft: '11px' }} className="ant-form-text">
    {value || children}
  </Typography.Text>
);

export default ReadOnlyField;

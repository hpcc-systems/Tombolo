import React from 'react';
import { Space, Typography } from 'antd';
import ReactMarkdown from 'react-markdown';

const ConstraintDescription = ({ record }) => {
  return (
    <>
      <Space align="baseline">
        <Typography.Text>Short Description : </Typography.Text>
        <span className="ant-form-text">{record.short_description}</span>
      </Space>
      <br />
      <Space align="baseline">
        <Typography.Text>Description : </Typography.Text>
        <ReactMarkdown source={record.description} />
      </Space>
    </>
  );
};

export default ConstraintDescription;

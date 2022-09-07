import React from 'react';
import { Col, Row, Typography } from 'antd';
import ReactMarkdown from 'react-markdown';

const ConstraintDescription = ({ record }) => {
  return (
    <>
      {!record.inherited ? null : <Field name="Inherited" description={record.inherited} />}
      <Field name="Summary" description={record.short_description} />
      <Field name="Description" description={<ReactMarkdown source={record.description} />} />
    </>
  );
};

export default ConstraintDescription;

const Field = ({ name, description }) => {
  return (
    <Row>
      <Col span={2}>
        <Typography.Text italic strong>
          {name} :
        </Typography.Text>
      </Col>
      <Col span={22}>
        <Typography.Text style={{ display: 'inline-block', marginLeft: '5px' }} disabled={!description}>
          {description || 'N/A'}
        </Typography.Text>
      </Col>
    </Row>
  );
};

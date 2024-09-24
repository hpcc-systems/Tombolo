import React from 'react';
import { Card, Typography, Row, Col, Input } from 'antd';

const { Text } = Typography;

const MyAccountInfo = ({ user }) => {
  console.log(user);
  const { firstName, lastName, email, roles, applications } = user;

  return (
    <div style={{ width: '100%' }}>
      <Card style={{ width: '50%', margin: '0 auto', textAlign: 'left' }}>
        <Row gutter={16}>
          <Col span={12}>
            <Text>First Name:</Text>
            <Input disabled placeholder={firstName}></Input>
          </Col>
          <Col span={12}>
            <Text>Last Name:</Text>

            <Input disabled placeholder={lastName}></Input>
          </Col>
        </Row>
        <Text>Email:</Text>
        <Input disabled placeholder={email}></Input>
        <Row gutter={16}>
          <Col span={12}>
            <Text>Roles:</Text>
            <Input disabled placeholder={roles.join(', ')}></Input>
          </Col>
          <Col span={12}>
            <Text>Applications:</Text>
            <Input disabled placeholder={applications.join(', ')}></Input>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default MyAccountInfo;

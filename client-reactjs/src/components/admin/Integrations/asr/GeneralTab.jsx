/* eslint-disable unused-imports/no-unused-vars */
/* eslint-disable unused-imports/no-unused-imports */
import React from 'react';
import { Divider, Space, List } from 'antd';
import { CheckSquareFilled } from '@ant-design/icons';
import '../integrations.css';

const data = ['john_doe@test.com', 'jane_doe@test.com'];
const channels = ['https:www.channel1.com', 'https:www.channel2.com'];

function GeneralTab({ integrationDetails }) {
  return (
    <>
      <div>
        <Space>
          <CheckSquareFilled style={{ color: 'var(--primary)', fontWeight: '800' }} />
          <span>Severity 3 alerts are activated</span>
        </Space>
        <div>
          <List
            size="small"
            header={<div style={{ fontWeight: '500', background: 'var(--light)' }}>Severity 3 Notification Emails</div>}
            bordered
            dataSource={data}
            style={{ width: '450px' }}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <div>
          <Space>
            <CheckSquareFilled style={{ color: 'var(--primary)', fontWeight: '800' }} />
            <span>Megaphone alerts are activated</span>
          </Space>
        </div>
        <List
          size="small"
          header={
            <div style={{ fontWeight: '500', background: 'var(--light)' }}>Megaphone alerts notification emails</div>
          }
          bordered
          dataSource={data}
          style={{ width: '450px' }}
          renderItem={(item) => <List.Item>{item}</List.Item>}
        />
        <div style={{ marginTop: '10px' }}>
          <List
            size="small"
            header={<div style={{ fontWeight: '500', background: 'var(--light)' }}>Teams channel </div>}
            bordered
            dataSource={channels}
            style={{ width: '450px' }}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </div>
      </div>
    </>
  );
}

export default GeneralTab;

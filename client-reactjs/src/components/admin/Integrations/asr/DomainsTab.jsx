/* eslint-disable unused-imports/no-unused-imports */
/* eslint-disable unused-imports/no-unused-vars */
import React, { useState } from 'react';
import { Table, Tag, Space, Popconfirm, Modal, Form, Select, Button } from 'antd';
import { EyeOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

const DomainsTab = () => {
  const [visible, setVisible] = useState(false);
  const [viewData, setViewData] = useState(null);

  const data = [
    {
      key: '1',
      domainName: 'Domain 1',
      activityType: [
        'Activity 1',
        'Activity 2',
        'Activity 3',
        'Activity 4',
        'Activity 1',
        'Activity 2',
        'Activity 3',
        'Activity 4',
      ],
      createdBy: 'User 1',
      updatedBy: 'User 2',
    },
    {
      key: '2',
      domainName: 'Domain 2',
      activityType: ['Activity 1', 'Activity 2', 'Activity 3', 'Activity 4'],
      createdBy: 'User 1',
      updatedBy: 'User 2',
    },
    {
      key: '3',
      domainName: 'Domain 3',
      activityType: ['Activity 1', 'Activity 2', 'Activity 3', 'Activity 4'],
      createdBy: 'User 1',
      updatedBy: 'User 2',
    },
    // Add more data here
  ];

  const columns = [
    {
      title: 'Domain Name',
      dataIndex: 'domainName',
      key: 'domainName',
      width: '15%',
    },
    {
      title: 'Activity Type',
      dataIndex: 'activityType',
      key: 'activityType',
      render: (tags) => (
        <>
          {tags.slice(0, 5).map((tag) => (
            <Tag color="blue" key={tag}>
              {tag}
            </Tag>
          ))}
          {tags.length > 5 && <Tag color="blue">+{tags.length - 5} more</Tag>}
        </>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <Space size="middle">
          <EyeOutlined onClick={() => handleView(record)} />
          <EditOutlined onClick={() => handleEdit(record)} />
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record)}>
            <DeleteOutlined type="delete" />
          </Popconfirm>
        </Space>
      ),
      width: '10%',
    },
  ];

  // row selection
  const rowSelection = {};

  const handleView = (record) => {
    setViewData(record);
    setVisible(true);
  };

  const handleEdit = (record) => {
    // Handle edit here
  };

  const handleDelete = (record) => {
    // Handle delete here
  };

  return (
    <>
      <Table columns={columns} dataSource={data} size="small" rowSelection={rowSelection} />
      <Modal open={visible} onCancel={() => setVisible(false)} footer={null}>
        <p>Domain Name: {viewData?.domainName}</p>
        <p>Activity Types: {viewData?.activityType.join(', ')}</p>
        <p>Created by: {viewData?.createdBy}</p>
        <p>Updated by: {viewData?.updatedBy}</p>
      </Modal>
    </>
  );
};

export default DomainsTab;

/* eslint-disable unused-imports/no-unused-vars */
import React, { useState } from 'react';
import { Table, Tag, Space, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

const ProductsTab = () => {
  const [visible, setVisible] = useState(false);
  const [viewData, setViewData] = useState(null);

  const data = [
    {
      key: '1',
      productName: 'Product 1',
      domains: ['Domain 1', 'Domain 2', 'Domain 3', 'Domain 4', 'Domain 5', 'Domain 6'],
      createdBy: 'User 1',
      updatedBy: 'User 2',
      // Add more data here
    },
    {
      key: '1',
      productName: 'Product 1',
      domains: ['Domain 1', 'Domain 2', 'Domain 3', 'Domain 4', 'Domain 5', 'Domain 6'],
      createdBy: 'User 1',
      updatedBy: 'User 2',
      // Add more data here
    },
    {
      key: '1',
      productName: 'Product 1',
      domains: ['Domain 1', 'Domain 2', 'Domain 3', 'Domain 4', 'Domain 5', 'Domain 6'],
      createdBy: 'User 1',
      updatedBy: 'User 2',
      // Add more data here
    },
    {
      key: '1',
      productName: 'Product 1',
      domains: ['Domain 1', 'Domain 2', 'Domain 3', 'Domain 4', 'Domain 5', 'Domain 6'],
      createdBy: 'User 1',
      updatedBy: 'User 2',
      // Add more data here
    },
  ];

  const columns = [
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      width: '15%',
    },
    {
      title: 'Domains',
      dataIndex: 'domains',
      key: 'domains',
      render: (tags) => (
        <>
          {tags.slice(0, 4).map((tag, i) => (
            <Tag color="blue" key={i}>
              {tag}
            </Tag>
          ))}
          {tags.length > 4 && <Tag color="blue">+{tags.length - 4} more</Tag>}
        </>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (text, record) => (
        <Space size="middle">
          {/* <EyeOutlined onClick={() => handleView(record)} /> */}
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
      <Table rowSelection={true} columns={columns} dataSource={data} size="small" />
    </>
  );
};

export default ProductsTab;

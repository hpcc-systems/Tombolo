import React from 'react';
import { Table, Space, Tooltip, message, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { authHeader, handleError } from '../../../common/AuthHeader.js';
// import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const DashboardApiTable = ({ keys, getKeys, active }) => {
  const { Text } = Typography;

  const deleteKey = async (id) => {
    try {
      const payload = {
        method: 'DELETE',
        headers: authHeader(),
      };

      const response = await fetch(`/api/key/${id}`, payload);
      if (!response.ok) {
        handleError(response);
      } else {
        await getKeys();
        message.success('Key Deleted');
      }

      return;
    } catch (error) {
      message.error('Failed to Delete key');
    }
  };

  useEffect(() => {
    getKeys();
  }, []);

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Created', dataIndex: 'formattedCreatedAt' },
    {
      title: 'Expires in',
      dataIndex: 'daysToExpire',
      render: (_, record) => {
        return <>{record.expired ? <Text type="danger">Expired</Text> : <Text>{record.daysToExpire}</Text>}</>;
      },
    },
    {
      title: 'Expired',
      dataIndex: 'expired',
      key: 'expired',
      filters: [
        {
          text: '0',
          value: 0,
        },
        {
          text: '1',
          value: 1,
        },
      ],
      onFilter: (value, record) => (record.expired === value) === false,
      defaultFilteredValue: [active],
      filterIcon: (filtered) => <div>{filtered}</div>,
      render: (_, record) => {
        return <>{record.expired ? <Text>Yes</Text> : <Text>No</Text>}</>;
      },
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <a>
            <Tooltip title="Delete Key">
              <DeleteOutlined
                onClick={() => {
                  deleteKey(record.id);
                }}
              />
            </Tooltip>
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        size="small"
        style={{ marginTop: '1rem' }}
        columns={columns}
        dataSource={keys}
        rowKey={(record) => record.id}
        pagination={false}
        expandable={{
          expandedRowRender: (record) => (
            <p
              style={{
                marginLeft: '3rem',
              }}>
              Expiration Date: {record.expirationDate}
              <br />
              Notes: {record.Notes ? <>{record.Notes}</> : <>No Notes Found</>}
            </p>
          ),
        }}
      />
    </>
  );
};

export default DashboardApiTable;

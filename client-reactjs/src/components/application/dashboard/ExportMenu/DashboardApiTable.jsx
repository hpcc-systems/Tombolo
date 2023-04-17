import React from 'react';
import { Table, Space, Tooltip, message } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { authHeader, handleError } from '../../../common/AuthHeader.js';

// import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const DashboardApiTable = ({ keys, getKeys }) => {
  const deleteKey = async (id) => {
    try {
      const payload = {
        method: 'DELETE',
        header: authHeader(),
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
    { title: 'Expires in', dataIndex: 'daysToExpire' },
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

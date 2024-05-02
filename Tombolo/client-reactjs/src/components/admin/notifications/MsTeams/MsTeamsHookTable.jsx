import React from 'react';
import { Table, Tooltip, Button, message, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

import { authHeader } from '../../../common/AuthHeader';
import { Constants } from '../../../common/Constants';

const MsTeamsHookTable = ({ hooks, editHook, setHooks, setShowHooksDetailModal, setSelectedHook }) => {
  // When view hook details button is clicked
  const handleViewHookDetailsBtnClick = (record) => {
    setSelectedHook(record);
    setShowHooksDetailModal(true);
  };
  //Columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'URL',
      dataIndex: 'url',
      render: (text) => (
        <Tooltip title={text}>
          <span>{text.length > 100 ? `${text.slice(0, 80)}...` : text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
    },
    {
      title: 'Approved By',
      dataIndex: 'approvedBy',
    },
    {
      title: 'Last Modified By',
      dataIndex: 'lastModifiedBy',
    },
    {
      title: 'Last Modified On',
      dataIndex: 'updatedAt',
      render: (text, _record) =>
        new Date(text).toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +
        ' @ ' +
        new Date(text).toLocaleTimeString('en-US'),
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewHookDetailsBtnClick(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => editHook(record)} />
          <Popconfirm
            title="Are you sure you want to delete this hook?"
            onConfirm={() => deleteTeamsHook(record)}
            okText="Yes"
            cancelText="No">
            <Button type="link" icon={<DeleteOutlined />} />
          </Popconfirm>
        </>
      ),
    },
  ];

  // Function to delete a Teams Hook
  const deleteTeamsHook = async (record) => {
    try {
      const payload = {
        method: 'DELETE',
        headers: authHeader(),
      };
      const response = await fetch(`/api/teamsHook/${record.id}`, payload);
      if (!response.ok) {
        throw Error('Failed to delete Teams Hook');
      }
      const newHooksList = hooks.filter((h) => h.id !== record.id);
      setHooks(newHooksList);
      message.success('Teams Hook deleted successfully');
    } catch (err) {
      message.err(err.message);
    }
  };

  return (
    <Table
      columns={columns}
      dataSource={hooks}
      size="small"
      rowKey={(record) => record.id}
      pagination={hooks.length > 14 ? { pageSize: 14 } : false}
    />
  );
};

export default MsTeamsHookTable;

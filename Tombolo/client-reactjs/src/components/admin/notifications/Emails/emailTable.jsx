import React from 'react';
import { Table, Button, Tooltip, message, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

import { authHeader } from '../../../common/AuthHeader';
import { Constants } from '../../../common/Constants';

const EmailTable = ({ groups, editGroup, setGroups, setShowGroupsDetailModal, setSelectedGroup }) => {
  // When view group details button is clicked
  const handleViewGroupDetailsBtnClick = (record) => {
    setSelectedGroup(record);
    setShowGroupsDetailModal(true);
  };
  //Columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
    },
    {
      title: 'Emails',
      dataIndex: 'emails',
      render: (emails) => (
        <Tooltip title={emails.emails}>
          {emails.emails.map((email) => (
            <span key={email}>{email}, </span>
          ))}
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
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewGroupDetailsBtnClick(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => editGroup(record)} />
          <Popconfirm
            title="Are you sure you want to delete this group?"
            onConfirm={() => deleteEmailsGroup(record)}
            okText="Yes"
            cancelText="No">
            <Button type="link" icon={<DeleteOutlined />} />
          </Popconfirm>
        </>
      ),
    },
  ];

  // Function to delete a Emails Group
  const deleteEmailsGroup = async (record) => {
    try {
      const payload = {
        method: 'DELETE',
        headers: authHeader(),
      };
      const response = await fetch(`/api/emailGroup/${record.id}`, payload);
      if (!response.ok) {
        throw Error('Failed to delete Emails Group');
      }
      const newGroupsList = groups.filter((h) => h.id !== record.id);
      setGroups(newGroupsList);
      message.success('Emails Group deleted successfully');
    } catch (err) {
      message.err(err.message);
    }
  };

  return (
    <Table
      columns={columns}
      dataSource={groups}
      size="small"
      rowKey={(record) => record.id}
      pagination={groups.length > 14 ? { pageSize: 14 } : false}
    />
  );
};

export default EmailTable;

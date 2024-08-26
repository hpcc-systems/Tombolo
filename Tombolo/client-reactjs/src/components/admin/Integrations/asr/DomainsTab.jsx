// Package imports
import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Popconfirm, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';

//Local Imports
import { deleteDomain } from './asr-integration-util';

const DomainsTab = ({ domains, setSelectedDomain, setDomainModalOpen }) => {
  const [domainData, setDomainData] = useState([]);

  // Table columns
  const columns = [
    {
      title: 'Domain Name',
      dataIndex: 'name',
      width: '12%',
    },
    {
      title: 'Severity Threshold',
      dataIndex: 'severityThreshold',
      width: '10%',
    },
    {
      title: 'Severity Alert Recipients',
      dataIndex: 'severityAlertRecipients',
      render: (recipients) => <>{recipients.map((r, i) => `${i < recipients.length - 1 ? r + ', ' : r}`)}</>,
      width: '38%',
    },
    {
      title: 'Activity Type',
      dataIndex: 'activityTypes',
      width: '30%',
      render: (tags) => (
        <>
          {tags.map(
            (tag, i) =>
              tag.name && (
                <Tag color="blue" key={i} size="small">
                  {tag.name}
                </Tag>
              )
          )}
        </>
      ),
    },
    {
      title: 'Actions',
      key: 'action',
      render: (text, record) => (
        <Space size="middle">
          <EditOutlined style={{ color: 'var(--primary)' }} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this domain?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            okButtonProps={{ type: 'primary', danger: true }}>
            <DeleteOutlined style={{ color: 'var(--primary)' }} type="delete" />
          </Popconfirm>
        </Space>
      ),
      width: '10%',
    },
  ];

  // Effect
  useEffect(() => {
    if (domains) {
      const domainAndActivityTypes = [];
      domains.forEach((d) => {
        domainAndActivityTypes.push({
          name: d.name,
          id: d.id,
          severityThreshold: d.severityThreshold,
          severityAlertRecipients: d.severityAlertRecipients || [],
          activityType: { id: d['monitoringTypes.id'], name: d['monitoringTypes.name'] },
        });
      });

      const organizedData = domainAndActivityTypes.reduce((acc, item) => {
        // Find an existing entry for the current id
        const existingEntry = acc.find((entry) => entry.id === item.id);

        if (existingEntry) {
          // If an entry exists, add the current activityType to its activityTypes array
          existingEntry.activityTypes.push(item.activityType);
        } else {
          // If no entry exists, create a new one with the current item's id, name, and activityType
          acc.push({
            id: item.id,
            name: item.name,
            severityThreshold: item.severityThreshold,
            severityAlertRecipients: item.severityAlertRecipients || [],
            activityTypes: [item.activityType],
          });
        }

        return acc;
      }, []);

      setDomainData(organizedData);
    }
  }, [domains]);

  // When edit icon is clicked
  const handleEdit = (record) => {
    setSelectedDomain(record);
    setDomainModalOpen(true);
  };

  // Handle when delete icon is clicked
  const handleDelete = async (record) => {
    try {
      await deleteDomain({ id: record.id });
      message.success('Domain deleted successfully');
      setDomainData((prev) => prev.filter((d) => d.id !== record.id));
    } catch (err) {
      message.error('Failed to delete domain');
    }
  };

  return (
    <>
      <Table columns={columns} dataSource={domainData} size="small" rowKey={(record) => record.id} />
    </>
  );
};

export default DomainsTab;

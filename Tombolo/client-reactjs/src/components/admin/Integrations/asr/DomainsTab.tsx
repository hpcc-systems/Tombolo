import React, { useState, useEffect } from 'react';
import { Table, Tag, Space, Popconfirm } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { handleError, handleSuccess } from '../../../common/handleResponse';
import asrService from '@/services/asr.service';

interface Props {
  domains?: any[];
  setSelectedDomain?: (d: any) => void;
  setDomainModalOpen?: (open: boolean) => void;
}

const DomainsTab: React.FC<Props> = ({ domains = [], setSelectedDomain, setDomainModalOpen }) => {
  const [domainData, setDomainData] = useState<any[]>([]);

  useEffect(() => {
    if (domains) {
      const domainAndActivityTypes: any[] = [];
      domains.forEach((d: any) => {
        domainAndActivityTypes.push({
          name: d.name,
          region: d.region,
          id: d.id,
          severityThreshold: d.severityThreshold,
          severityAlertRecipients: d.severityAlertRecipients || [],
          activityType: { id: d['monitoringTypes.id'], name: d['monitoringTypes.name'] },
        });
      });

      const organizedData = domainAndActivityTypes.reduce((acc: any[], item: any) => {
        const existingEntry = acc.find(entry => entry.id === item.id);
        if (existingEntry) {
          existingEntry.activityTypes.push(item.activityType);
        } else {
          acc.push({
            id: item.id,
            name: item.name,
            region: item.region,
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

  const handleEdit = (record: any) => {
    setSelectedDomain && setSelectedDomain(record);
    setDomainModalOpen && setDomainModalOpen(true);
  };

  const handleDelete = async (record: any) => {
    try {
      await asrService.deleteDomain({ id: record.id });
      handleSuccess('Domain deleted successfully');
      setDomainData(prev => prev.filter(d => d.id !== record.id));
    } catch (_err) {
      handleError('Failed to delete domain');
    }
  };

  const columns = [
    { title: 'Domain Name', dataIndex: 'name', width: '11%' },
    { title: 'Region', dataIndex: 'region', width: '4%' },
    { title: 'Severity Threshold', dataIndex: 'severityThreshold', width: '9%' },
    {
      title: 'Severity Alert Recipients',
      dataIndex: 'severityAlertRecipients',
      render: (recipients: string[]) => <>{recipients.map((r, i) => `${i < recipients.length - 1 ? r + ', ' : r}`)}</>,
      width: '38%',
    },
    {
      title: 'Activity Type',
      dataIndex: 'activityTypes',
      width: '30%',
      render: (tags: any[]) => (
        <>
          {tags.map(
            (tag, i) =>
              tag.name && (
                <Tag color="blue" key={i}>
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
      render: (_: any, record: any) => (
        <Space size="middle">
          <EditOutlined style={{ color: 'var(--primary)' }} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="Are you sure you want to delete this domain?"
            onConfirm={() => handleDelete(record)}
            okText="Yes"
            okButtonProps={{ type: 'primary', danger: true }}>
            <DeleteOutlined style={{ color: 'var(--primary)' }} />
          </Popconfirm>
        </Space>
      ),
      width: '10%',
    },
  ];

  return (
    <>
      <Table columns={columns} dataSource={domainData} size="small" rowKey={record => record.id} />
    </>
  );
};

export default DomainsTab;

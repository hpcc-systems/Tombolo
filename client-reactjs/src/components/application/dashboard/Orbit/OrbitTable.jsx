/* eslint-disable unused-imports/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { message, Table, Modal, Button, Descriptions, Tabs } from 'antd';
import { useLocation } from 'react-router-dom';

import { authHeader, handleError } from '../../../common/AuthHeader.js';
import { camelToTitleCase, formatDateTime } from '../../../common/CommonUtil.js';

function buildsTable({ applicationId, setSelectedbuildForBulkAction, updatedbuildInDb }) {
  const [builds, setbuilds] = useState([]);
  const [viewbuildDetails, setViewbuildDetails] = useState(false);
  const [selectedbuild, setSelectedbuild] = useState(null);
  const [filters, setFilters] = useState({
    statusFilters: [],
    monitoringTypeFilters: [],
    buildReasonFilters: [],
    buildChannelFilters: [],
  });
  const location = useLocation();

  // Selected build - complete details
  const selectedbuildDetails = [
    {
      key: 'Monitoring Type',
      value: camelToTitleCase(selectedbuild?.monitoring_type),
    },
    {
      key: 'Monitoring Name',
      value: `${
        selectedbuild?.['fileMonitoring.name'] ||
        selectedbuild?.['clusterMonitoring.name'] ||
        selectedbuild?.['jobMonitoring.name']
      }`,
    },
    { key: 'Notified at', value: formatDateTime(selectedbuild?.createdAt) },
    { key: 'Updated at', value: formatDateTime(selectedbuild?.updatedAt) },
    { key: 'build reason', value: selectedbuild?.build_reason },
    { key: 'Status', value: camelToTitleCase(selectedbuild?.status) },
    {
      key: 'Comment',
      value: selectedbuild?.comment,
    },
  ];

  // Update filters when builds change
  useEffect(() => {
    if (builds.length > 0) {
      const uniqueStatuses = new Set(builds.map((build) => build.status));
      const newStatusFilters = Array.from(uniqueStatuses).map((status) => ({
        text: camelToTitleCase(status),
        value: status,
      }));
      setFilters((prev) => ({ ...prev, statusFilters: newStatusFilters }));

      const uniqueMonitoringTypes = new Set(builds.map((build) => build.monitoring_type));
      const newMonitoringTypeFilters = Array.from(uniqueMonitoringTypes).map((type) => ({
        text: camelToTitleCase(type),
        value: type,
      }));
      setFilters((prev) => ({ ...prev, monitoringTypeFilters: newMonitoringTypeFilters }));

      const uniquebuildReasons = new Set(builds.map((build) => build.build_reason));
      const newbuildReasonFilters = Array.from(uniquebuildReasons).map((reason) => ({
        text: camelToTitleCase(reason),
        value: reason,
      }));
      setFilters((prev) => ({ ...prev, buildReasonFilters: newbuildReasonFilters }));

      const uniquebuildChannels = new Set(
        builds.map((build) => build.build_channel)
      );
      const newbuildChannelFilters = Array.from(uniquebuildChannels).map((channel) => ({
        text: camelToTitleCase(channel),
        value: channel,
      }));
      setFilters((prev) => ({ ...prev, buildChannelFilters: newbuildChannelFilters }));
    }
  }, [builds]);

  //When the component loads - get all builds
  useEffect(() => {
    const monitoringId = new URLSearchParams(location.search).get('monitoringId');
    getbuilds(monitoringId);
  }, [applicationId, location, updatedbuildInDb]);

  //Get list of all file monitoring
  const getbuilds = async (monitoringId) => {
    try {
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      const response = await fetch(`/api/builds/read/${applicationId}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();

      if (!monitoringId) {
        setbuilds(data);
      } else {
        const filtered = data.filter((item) => item.monitoring_id === monitoringId);
        setbuilds(filtered);
      }
    } catch (error) {
      message.error('Failed to fetch builds');
    }
  };

  //Table columns and data
  const columns = [
    {
      title: '',
      render: (_text, _record, index) => {
        return index + 1;
      },
    },
    {
      title: 'Notified at',
      render: (record) => {
        return <a>{formatDateTime(record.createdAt)}</a>;
      },
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      onCell: (record) => {
        return {
          onClick: () => {
            setSelectedbuild(record);
            setViewbuildDetails(true);
          },
        };
      },
    },
    {
      title: 'Monitoring Type',
      render: (record) => {
        return camelToTitleCase(record.monitoring_type);
      },
      sorter: (a, b) => a.monitoring_type.localeCompare(b.monitoring_type),
      filters: filters.monitoringTypeFilters,
      onFilter: (value, record) => record.monitoring_type === value,
    },
    {
      title: 'Monitoring name',
      render: (record) => {
        return record?.['fileMonitoring.name'] || record?.['clusterMonitoring.name'] || record?.['jobMonitoring.name'];
      },
    },
    {
      title: 'build reason',
      render: (record) => {
        return camelToTitleCase(record.build_reason);
      },
      sorter: (a, b) => a.build_reason.localeCompare(b.build_reason),
      filters: filters.buildReasonFilters,
      onFilter: (value, record) => record.build_reason === value,
    },
    {
      title: 'build channel',
      render: (record) => {
        return camelToTitleCase(record.build_channel);
      },
      filters: filters.buildChannelFilters,
      onFilter: (value, record) => record.build_channel === value,
    },
    {
      title: 'status',
      render: (record) => {
        return camelToTitleCase(record.status);
      },
      filters: filters.statusFilters,
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Updated on',
      render: (record) => {
        return formatDateTime(record.updatedAt);
      },
      sorter: (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
      defaultSortOrder: 'descend',
    },
    {
      title: 'comment',
      dataIndex: 'comment',
      width: '20%',
      render: (text) => {
        const comment = text ? text : '';
        return (
          <span>
            {comment.slice(0, 65)}
            {comment.length > 65 ? (
              <span style={{ fontSize: '14px', fontWeight: 700, marginLeft: 'px' }}>...</span>
            ) : (
              ''
            )}
            {/* {`${comment.slice(0, 80)}${comment.length > 80 ? ' ...' : ''}`} */}
          </span>
        );
      },
      onClick: () => alert('Howdy'),
    },
  ];

  // Row selection
  const rowSelection = {
    onChange: (_selectedRowKeys, selectedRows) => {
      setSelectedbuildForBulkAction(selectedRows);
    },
  };

  //JSX
  return (
    <>
      <Table
        align="right"
        pagination={{ pageSize: 14 }}
        size="small"
        columns={columns}
        dataSource={builds}
        rowKey={(record) => record.id}
        verticalAlign="top"
        rowSelection={rowSelection}
        onRow={(record) => {
          return {
            onClick: () => {
              console.log(record);
              setSelectedbuild(record);
              setViewbuildDetails(true);
            },
          };
        }}
      />
      <Modal
        title={selectedbuild?.['fileMonitoring.name'] || selectedbuild?.['clusterMonitoring.name'] || ''}
        width={850}
        visible={viewbuildDetails}
        onCancel={() => setViewbuildDetails(false)}
        maskClosable={false}
        footer={
          <Button type="primary" onClick={() => setViewbuildDetails(false)}>
            Close
          </Button>
        }>
        <Tabs>
          <Tabs.TabPane tab="Metadata" key="1">
            <Descriptions bordered column={1} size="small">
              {selectedbuildDetails.map((item) => (
                <Descriptions.Item label={item.key} key={item.key}>
                  {item.value}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </Tabs.TabPane>
          <Tabs.TabPane tab="build" key="2">
            <div
              dangerouslySetInnerHTML={{ __html: selectedbuild?.metaData?.buildBody || '' }}
              className="sentbuildBody"
            />
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    </>
  );
}

export default buildsTable;

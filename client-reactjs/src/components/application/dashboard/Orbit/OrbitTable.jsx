/* eslint-disable unused-imports/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { message, Table, Modal, Button, Descriptions, Tabs } from 'antd';
import { useLocation } from 'react-router-dom';

import { authHeader, handleError } from '../../../common/AuthHeader.js';
import { camelToTitleCase, formatDateTime } from '../../../common/CommonUtil.js';
import moment from 'moment';

function OrbitTable({
  applicationId,
  setSelectedbuildForBulkAction,
  updatedbuildInDb,
  dashboardFilters,
  builds,
  setBuilds,
  workUnits,
  setWorkUnits,
  filteredWorkUnits,
  setFilteredWorkUnits,
}) {
  const [viewbuildDetails, setViewbuildDetails] = useState(false);
  const [selectedbuild, setSelectedbuild] = useState(null);

  const [loading, setLoading] = useState(false);
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

  //when filters change, set filtered WorkUnits list
  useEffect(() => {
    if (Object.keys(workUnits).length === 0 || Object.keys(dashboardFilters).length === 0) return;

    let filtered = workUnits.filter((workUnit) => {
      let wuDate = moment(workUnit.Date);

      if (
        wuDate > moment(dashboardFilters.dateRange[0]) &&
        wuDate < moment(dashboardFilters.dateRange[1]) &&
        dashboardFilters.status &&
        dashboardFilters.status.includes(workUnit.Status)
      ) {
        return true;
      } else {
        return false;
      }
    });

    setFilteredWorkUnits(filtered);
    setLoading(false);
  }, [dashboardFilters, workUnits]);

  //When the component loads - get all builds
  useEffect(() => {
    const monitoringId = new URLSearchParams(location.search).get('monitoringId');
    getbuilds(monitoringId);
  }, [applicationId, location, updatedbuildInDb]);

  //Get list of all monitoring
  const getbuilds = async (monitoringId) => {
    try {
      setLoading(true);
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      if (applicationId === undefined) return;

      const response = await fetch(`/api/orbit/allMonitoring/${applicationId}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();

      if (!monitoringId) {
        setBuilds(data);
      } else {
        const filtered = data.filter((item) => item.monitoring_id === monitoringId);
        setBuilds(filtered);
      }

      //get work unit information and put it in builds information

      const response2 = await fetch(`/api/orbit/getWorkUnits/${applicationId}`, payload);
      if (!response2.ok) handleError(response2);

      const data2 = await response2.json();

      //add workunits to builds
      const builds2 = data.map((build) => {
        const wu = data2.filter((workUnit) => workUnit.build === build.build);

        return { ...build, workUnits: wu[0].WorkUnits };
      });

      setBuilds(builds2);

      //combine and set work units
      let totalWuList = [];
      data2.map(async (build) => {
        const buildWUs = build.WorkUnits;
        totalWuList = [...totalWuList, ...buildWUs];
      });

      totalWuList.sort((a, b) => {
        return new Date(b.Date) - new Date(a.Date);
      });

      setWorkUnits(totalWuList);

      setFilteredWorkUnits(totalWuList);
    } catch (error) {
      message.error('Failed to fetch builds');
    }
  };

  //Table columns and data
  const columns = [
    { title: 'Build', dataIndex: 'build' },
    {
      title: 'Notification Emails',
      render: (record) => {
        let emailChannel = record.metaData?.notifications[0];
        if (emailChannel.channel === 'eMail') {
          let emails = '';
          emailChannel.recipients.forEach((recipient) => {
            emails += recipient + '; ';
          });
          return emails;
        } else {
          return '';
        }
      },
    },
    {
      title: 'WUs',
      render: (record) => {
        let count = 0;

        if (record.workUnits?.length > 0) {
          record.workUnits.forEach((workUnit) => {
            let wuDate = moment(workUnit.Date);

            if (
              wuDate > moment(dashboardFilters.dateRange[0]) &&
              wuDate < moment(dashboardFilters.dateRange[1]) &&
              dashboardFilters.status &&
              dashboardFilters.status.includes(workUnit.Status)
            ) {
              count++;
            }
          });
        }

        return count;
      },
    },
  ];

  const wuColumns = [
    { title: 'Build WUID', dataIndex: 'WorkUnit' },
    { title: 'Related Build', dataIndex: 'Build' },
    {
      title: 'Date',
      render: (record) => {
        return moment.utc(record.Date).local().format('MM/DD/YYYY h:mm A');
      },
    },
    { title: 'Current Status', dataIndex: 'Status' },
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
      <div style={{ width: '35%', float: 'left', marginTop: '1rem' }}>
        <Table
          align="right"
          pagination={{ pageSize: 10 }}
          size="small"
          columns={columns}
          dataSource={builds}
          rowKey={(record) => record.id}
          verticalAlign="top"
          rowSelection={rowSelection}
          loading={loading}
          // onRow={(record) => {
          //   return {
          //     onClick: () => {
          //       setSelectedbuild(record);
          //       setViewbuildDetails(true);
          //     },
          //   };
          // }}
        />
        <br />
        <Table
          align="right"
          pagination={{ pageSize: 10 }}
          size="small"
          columns={wuColumns}
          dataSource={filteredWorkUnits}
          rowKey={(record) => record.id}
          verticalAlign="top"
          rowSelection={rowSelection}
          loading={loading}
          // onRow={(record) => {
          //   return {
          //     onClick: () => {
          //       setSelectedbuild(record);
          //       setViewbuildDetails(true);
          //     },
          //   };
          // }}
        />
      </div>
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

export default OrbitTable;

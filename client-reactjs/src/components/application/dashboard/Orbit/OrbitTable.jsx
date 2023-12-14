/* eslint-disable unused-imports/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { message, Table } from 'antd';
import { useLocation } from 'react-router-dom';
import { authHeader, handleError } from '../../../common/AuthHeader.js';
import moment from 'moment';

function OrbitTable({
  applicationId,
  updatedbuildInDb,
  dashboardFilters,
  builds,
  setBuilds,
  workUnits,
  setWorkUnits,
  filteredWorkUnits,
  setFilteredWorkUnits,
  selectedBuilds,
  setSelectedBuilds,
}) {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  //when filters change or Builds Selected, set filtered WorkUnits list
  useEffect(() => {
    if (Object.keys(workUnits).length === 0 || Object.keys(dashboardFilters).length === 0) return;

    let selectedBuildsList;

    //if there are selected Builds, use those, otherwise use all builds
    if (selectedBuilds.length > 0) {
      selectedBuildsList = selectedBuilds.map((build) => build.build);
    } else {
      selectedBuildsList = builds.map((build) => build.build);
    }

    let filtered = workUnits.filter((workUnit) => {
      let wuDate = moment(workUnit.metaData.lastRun);

      if (
        wuDate > moment(dashboardFilters.dateRange[0]) &&
        wuDate < moment(dashboardFilters.dateRange[1]) &&
        dashboardFilters.status &&
        dashboardFilters.status.includes(workUnit.metaData.status.toUpperCase()) &&
        selectedBuildsList.includes(workUnit.name)
      ) {
        return true;
      } else {
        return false;
      }
    });

    setFilteredWorkUnits(filtered);
    setLoading(false);
  }, [dashboardFilters, workUnits, selectedBuilds]);

  //When the component loads - get all builds
  useEffect(() => {
    const monitoringId = new URLSearchParams(location.search).get('monitoringId');
    getbuilds(monitoringId);
  }, [applicationId, location]);

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

      console.log(data);

      //get work unit information and put it in builds information

      const response2 = await fetch(`/api/orbit/getWorkUnits/${applicationId}`, payload);
      if (!response2.ok) handleError(response2);

      const data2 = await response2.json();

      console.log(data2);

      //add data2 workunits to matching builds

      const builds2 = data.map((build) => {
        const wu = data2.filter((workUnit) => workUnit.name === build.build);
        return { ...build, workUnits: wu };
      });

      //add count to the builds for reporting later
      builds2.forEach((build) => {
        build.count = wuCounter(build);
      });

      setBuilds(builds2);

      //combine and set work units
      let totalWuList = data2;

      totalWuList.sort((a, b) => {
        return new Date(b.metaData.lastRun) - new Date(a.metaData.lastRun);
      });

      //move initial status, final status, and version to top level of object

      totalWuList.forEach((workUnit) => {
        workUnit.initialStatus = workUnit.metaData.initialStatus;
        workUnit.finalStatus = workUnit.metaData.status;
        workUnit.version = workUnit.metaData.version;
        workUnit.status = workUnit.metaData.status;
      });

      await setWorkUnits(totalWuList);

      await setFilteredWorkUnits(totalWuList);
    } catch (error) {
      message.error('Failed to fetch builds' + error);
      console.log(error);
    }
  };

  const wuCounter = (record) => {
    let count = 0;

    if (record.workUnits?.length > 0) {
      record.workUnits.forEach((workUnit) => {
        let wuDate = moment(workUnit.metaData.lastRun);

        if (
          dashboardFilters?.dateRange &&
          wuDate > moment(dashboardFilters?.dateRange[0]) &&
          wuDate < moment(dashboardFilters?.dateRange[1]) &&
          dashboardFilters.status &&
          dashboardFilters.status.includes(workUnit.metaData.status)
        ) {
          count++;
        }
      });
    }

    return count;
  };

  //Table columns and data
  const columns = [
    {
      title: 'Product',
      render: (record) => {
        return record.product.toUpperCase();
      },
      width: 225,
    },
    { title: 'Orbit Build Name', dataIndex: 'build' },
    {
      title: 'WUs',
      render: (record) => {
        return record?.count ? record.count : 0;
      },
      sorter: (a, b) => a.count - b.count,

      sortDirections: ['ascend', 'descend'],
      defaultSortOrder: 'descend',
      width: 75,
    },
  ];

  const wuColumns = [
    { title: 'Build WUID', dataIndex: 'wuid', width: 75 },
    { title: 'Version', dataIndex: 'version', width: 75 },
    { title: 'Initial Status', dataIndex: 'initialStatus', width: 100 },
    { title: 'Final Status', dataIndex: 'finalStatus', width: 150 },
    { title: 'Build Owner', dataIndex: 'primaryContact', width: 150 },
  ];

  // Row selection
  const rowSelection = {
    onChange: (_selectedRowKeys, selectedRows) => {
      setSelectedBuilds(selectedRows);
    },
  };

  //JSX
  return (
    <>
      <div style={{ width: '45%', float: 'left' }} className="OrbitTable">
        <div style={{ border: '1px solid #d9d9d9', padding: '.25rem' }}>
          <Table
            align="right"
            size="small"
            columns={columns}
            dataSource={builds}
            rowKey={(record) => record.name}
            verticalAlign="top"
            rowSelection={rowSelection}
            loading={loading}
            pagination={false}
            headerColor="white"
            headerBg="#001529"
            scroll={{ y: 400 }}
          />
        </div>
        <br />
        <div style={{ border: '1px solid #d9d9d9', padding: '.25rem' }}>
          <Table
            align="right"
            size="small"
            columns={wuColumns}
            dataSource={filteredWorkUnits}
            rowKey={(record) => record.key}
            verticalAlign="top"
            loading={loading}
            headerColor="white"
            headerBg="#001529"
            scroll={{ x: 1300, y: 400 }}
            pagination={false}
          />
        </div>
      </div>
    </>
  );
}

export default OrbitTable;

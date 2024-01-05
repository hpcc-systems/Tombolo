/* eslint-disable unused-imports/no-unused-vars */
import React, { useEffect, useState } from 'react';
import { message, Table } from 'antd';
import { useLocation } from 'react-router-dom';
import { authHeader, handleError } from '../../../common/AuthHeader.js';
import moment from 'moment';

function OrbitTable({
  applicationId,
  dashboardFilters,
  builds,
  setBuilds,
  workUnits,
  setWorkUnits,
  filteredWorkUnits,
  setFilteredWorkUnits,
  filteredBuilds,
  setFilteredBuilds,
  filterValues,
  setFilterValues,
}) {
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  //when filters change or Builds Selected, set filtered WorkUnits list
  useEffect(() => {
    if (Object.keys(workUnits).length === 0 || Object.keys(dashboardFilters).length === 0) return;

    let filteredBuildsList = [];

    //apply filters to build list
    builds.forEach((build) => {
      if (dashboardFilters.severity.includes(build.severityCode)) {
        filteredBuildsList.push(build);
      } else {
        return;
      }
    });

    setFilteredBuilds(filteredBuildsList);

    //get a list of just the names to filter work units
    let filteredBuildNameList = filteredBuildsList.map((build) => build.build);

    //apply filters to work units once the build list is filtered
    let filtered = workUnits.filter((workUnit) => {
      let wuDate = moment(workUnit.metaData.lastRun);

      if (
        wuDate > moment(dashboardFilters.dateRange[0]) &&
        wuDate < moment(dashboardFilters.dateRange[1]) &&
        dashboardFilters.initialStatus?.includes(workUnit.initialStatus.toUpperCase()) &&
        dashboardFilters.finalStatus?.includes(workUnit.finalStatus.toUpperCase()) &&
        dashboardFilters.version.includes(workUnit.version) &&
        filteredBuildNameList.includes(workUnit.name)
      ) {
        return true;
      } else {
        return false;
      }
    });

    console.log(filtered);

    setFilteredWorkUnits(filtered);
    setLoading(false);
  }, [dashboardFilters, workUnits, builds]);

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

      //get work unit information and put it in builds information

      const response2 = await fetch(`/api/orbit/getWorkUnits/${applicationId}`, payload);
      if (!response2.ok) handleError(response2);

      const data2 = await response2.json();

      let builds2 = [];

      await Promise.all(
        //add data2 workunits to matching builds
        (builds2 = data.map((build) => {
          const wu = data2.filter((workUnit) => workUnit.name === build.build);

          console.log(wu, build);
          return { ...build, workUnits: wu };
        }))
      );

      //combine and set work units
      let totalWuList = data2;

      totalWuList.sort((a, b) => {
        return new Date(b.metaData.lastRun) - new Date(a.metaData.lastRun);
      });

      //move initial status, final status, and version to top level of object

      totalWuList.forEach((workUnit) => {
        workUnit.initialStatus = workUnit.metaData.initialStatus;
        workUnit.finalStatus = workUnit.metaData.finalStatus;
        workUnit.version = workUnit.metaData.version;
        workUnit.status = workUnit.metaData.status;
      });

      //get all the unique values for the filters and dropdowns

      //get unique values
      const uniqueInitialStatus = [...new Set(totalWuList.map((item) => item.initialStatus.toUpperCase()))];
      const uniqueFinalStatus = [...new Set(totalWuList.map((item) => item.finalStatus.toUpperCase()))];
      const uniqueVersion = [...new Set(totalWuList.map((item) => item.version))];
      const uniqueSeverity = [...new Set(builds2.map((item) => item.severityCode))];

      //create options for dropdowns
      const uniqueInitialStatusOptions = [];
      uniqueInitialStatus.forEach((item) => uniqueInitialStatusOptions.push({ label: item, value: item }));
      const uniqueFinalStatusOptions = [];
      uniqueFinalStatus.forEach((item) => uniqueFinalStatusOptions.push({ label: item, value: item }));
      const uniqueVersionOptions = [];
      uniqueVersion.forEach((item) => uniqueVersionOptions.push({ label: item, value: item }));
      const uniqueSeverityOptions = [];
      uniqueSeverity.forEach((item) => uniqueSeverityOptions.push({ label: item, value: item }));

      //set them in state
      await setFilterValues((filterValues) => ({
        ...filterValues,
        initialStatus: uniqueInitialStatus,
        initialStatusOptions: uniqueInitialStatusOptions,
        finalStatus: uniqueFinalStatus,
        finalStatusOptions: uniqueFinalStatusOptions,
        version: uniqueVersion,
        versionOptions: uniqueVersionOptions,
        severity: uniqueSeverity,
        severityOptions: uniqueSeverityOptions,
        dateRange: [moment().subtract(15, 'days'), moment()],
        groupDataBy: 'day',
      }));

      await setWorkUnits(totalWuList);

      await setFilteredWorkUnits(totalWuList);

      await setBuilds(builds2);
    } catch (error) {
      message.error('Failed to fetch builds' + error);
      console.log(error);
    }
  };

  //when builds are loaded/changed, if there is not a count, get counts
  useEffect(() => {
    if (!filteredBuilds.length) return;
    if (filteredBuilds.length > 0 && filteredBuilds[0].count !== undefined) {
      return;
    } else {
      getCounts();
    }
  }, [filteredBuilds, dashboardFilters]);

  const getCounts = () => {
    let builds2 = [];
    filteredBuilds.forEach((build) => {
      let count = 0;

      if (build.workUnits?.length > 0) {
        build.workUnits.forEach((workUnit) => {
          let wuDate = moment(workUnit.metaData.lastRun);

          if (
            dashboardFilters?.dateRange &&
            wuDate > moment(dashboardFilters?.dateRange[0]) &&
            wuDate < moment(dashboardFilters?.dateRange[1]) &&
            dashboardFilters.initialStatus?.includes(workUnit.initialStatus.toUpperCase()) &&
            dashboardFilters.finalStatus?.includes(workUnit.finalStatus.toUpperCase()) &&
            dashboardFilters.version?.includes(workUnit.version)
          ) {
            count++;
          }
        });
      }

      builds2.push({ ...build, count: count });
    });

    setFilteredBuilds(builds2);
  };

  //Table columns and data
  const columns = [
    {
      title: 'Product',
      render: (record) => {
        return record.product?.toUpperCase();
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

  // // Row selection
  // const rowSelection = {
  //   onChange: (_selectedRowKeys, selectedRows) => {
  //     setFilteredBuilds(selectedRows);
  //   },
  // };

  //JSX
  return (
    <>
      <div style={{ width: '45%', float: 'left' }} className="OrbitTable">
        <div style={{ border: '1px solid #d9d9d9', padding: '.25rem' }}>
          <Table
            align="right"
            size="small"
            columns={columns}
            dataSource={filteredBuilds}
            rowKey={(record) => record.name}
            verticalAlign="top"
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

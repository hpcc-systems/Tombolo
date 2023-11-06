import React, { useEffect, useState } from 'react';
import { Tabs, Empty, Spin, Space } from 'antd';
import { useSelector } from 'react-redux';
import { message } from 'antd';
import moment from 'moment';

import OrbitTable from './OrbitTable';
import NotificationCharts from '../common/charts/NotificationCharts';
import Filters from './Filters';
import MetricBoxes from '../common/charts/MetricBoxes';
import '../common/css/index.css';
import { authHeader, handleError } from '../../../common/AuthHeader.js';
import ExportMenu from '../ExportMenu/ExportMenu';
// import BulkActions from './BulkActions';

function Orbit() {
  const [builds, setBuilds] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [metrics, setMetrics] = useState([]);
  const [stackBarData, setStackBarData] = useState([]);
  const [donutData, setDonutData] = useState([]);
  const [groupDataBy, setGroupDataBy] = useState('day');
  // const [selectedbuildsForBulkAction, setSelectedbuildForBulkAction] = useState([]);
  // const [bulkActionModalVisible, setBulkActionModalVisibility] = useState(false);
  // const [updatedbuildInDb, setUpdatedbuildInDb] = useState(null);

  const {
    application: { applicationId },
  } = useSelector((item) => item.applicationReducer);

  // Default filters to fetch builds
  const [defaultFilters, setDefaultFilters] = useState({
    status: [
      'BUILD_AVAILABLE_FOR_USE',
      'DATA_QA_APPROVED',
      'DATA_QA_REJECT',
      'DISCARDED',
      'FAILED_QA_QAHELD',
      'GRAVEYARD',
      'ON_HOLD',
      'PASSED_QA',
      'PASSED_QA_NO_RELEASE',
      'PRODUCTION',
      'SKIPPED',
    ],
    dateRange: [moment().subtract(15, 'days'), moment()],
    EnvironmentName: ['Insurance'],
    applicationId,
  });

  useEffect(() => {
    console.log(builds);
    const groupedData = builds.map((build) => {
      const weekStart = moment(build.metaData.lastRun).startOf('week').format('MM/DD/YY');
      const weekEnd = moment(build.metaData.lastRun).endOf('week').format('MM/DD/YY');
      const updatedItem = { ...build };
      updatedItem.createdAt = `${weekStart} - ${weekEnd}`;
      return updatedItem;
    });

    setStackBarData(groupedData);
  }, [groupDataBy]);

  // When component loads create filter to load initial data
  useEffect(() => {
    if (applicationId) {
      filterAndFetchBuilds(defaultFilters);
    }
  }, [applicationId]);

  // When build changes run
  useEffect(() => {
    if (builds.length > 0) {
      const newMetrics = []; // Pie and card data
      const newStackBarData = []; // Stack bar Data
      const newDonutData = []; // Donut data

      newMetrics.push({ title: 'Total', description: builds.length });

      const buildCountByStatus = {};
      const buildCountByEnvironmentName = {};

      //---------------------------------------
      let data;
      switch (groupDataBy) {
        case 'week':
          data = builds.map((build) => {
            const weekStart = moment(build.metaData.lastRun).startOf('week').format('MM/DD/YY');
            const weekEnd = moment(build.metaData.lastRun).endOf('week').format('MM/DD/YY');
            const updatedItem = { ...build };
            updatedItem.createdAt = `${weekStart} - ${weekEnd}`;
            return updatedItem;
          });
          break;

        case 'month':
          data = builds.map((build) => {
            const updatedItem = { ...build };
            updatedItem.createdAt = moment(moment(build.metaData.lastRun).utc(), 'MM/DD/YYYY').format('MMMM YYYY');
            return updatedItem;
          });
          break;

        case 'quarter':
          data = builds.map((build) => {
            const updatedItem = { ...build };
            const date = moment.utc(build.metaData.lastRun);
            const year = date.year();
            const quarter = Math.ceil((date.month() + 1) / 3);
            updatedItem.createdAt = `${year} - Q${quarter}`;
            return updatedItem;
          });
          break;

        case 'year':
          data = builds.map((build) => {
            const updatedItem = { ...build };
            const date = moment.utc(build.metaData.lastRun);
            const year = date.year();
            updatedItem.createdAt = year;
            return updatedItem;
          });
          break;

        default:
          data = builds;
      }
      //---------------------------------------
      data.forEach((build) => {
        if (buildCountByStatus[build?.metaData.status]) {
          const newCount = buildCountByStatus[build.metaData.status] + 1;
          buildCountByStatus[build.metaData.status] = newCount;
        } else {
          buildCountByStatus[build?.metaData.status] = 1;
        }

        if (groupDataBy == 'day') {
          newStackBarData.push({
            x: build.metaData.lastRun.split('T')[0],
            y: 1,
            z: build.metaData.status,
          });
        } else {
          newStackBarData.push({ x: build.metaData.lastRun, y: 1, z: build?.metaData.status });
        }

        // buildCountByEnvironmentName;
        const {
          metaData: { EnvironmentName },
        } = build;
        if (buildCountByEnvironmentName[EnvironmentName]) {
          buildCountByEnvironmentName[EnvironmentName] = buildCountByEnvironmentName[EnvironmentName] + 1;
        } else {
          buildCountByEnvironmentName[EnvironmentName] = 1;
        }
      });

      //---------------------------------------
      for (let key in buildCountByStatus) {
        newMetrics.push({ title: key, description: buildCountByStatus[key] });
      }
      //---------------------------------------
      for (let key in buildCountByEnvironmentName) {
        newDonutData.push({ type: key, value: buildCountByEnvironmentName?.[key] });
      }
      //---------------------------------------

      setMetrics(newMetrics);
      setStackBarData(newStackBarData);
      setDonutData(newDonutData);
    }
  }, [builds, groupDataBy]);

  //Get list of file monitorings that matches a filter
  const filterAndFetchBuilds = async (filters) => {
    try {
      setLoadingData(true);
      const payload = {
        method: 'GET',
        header: authHeader(),
      };
      const queryData = JSON.stringify({ ...filters, applicationId });

      const response = await fetch(`/api/orbit/filteredbuilds?queryData=${queryData}`, payload);
      if (!response.ok) handleError(response);
      const data = await response.json();
      setBuilds(data);
    } catch (error) {
      message.error('Failed to fetch builds');
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div>
      <Tabs
        tabBarExtraContent={
          <Space>
            {/* <Button
              type="primary"
              ghost
              disabled={selectedbuildsForBulkAction.length > 0 ? false : true}
              onClick={() => {
                setBulkActionModalVisibility(true);
              }}>
              Actions
            </Button> */}
            <ExportMenu />
          </Space>
        }>
        <Tabs.TabPane key="1" tab="Orbit Monitoring">
          <OrbitTable applicationId={applicationId} />
          {/* {bulkActionModalVisible ? (
            <BulkActions
              setBulkActionModalVisibility={setBulkActionModalVisibility}
              selectedbuildsForBulkAction={selectedbuildsForBulkAction}
              setUpdatedbuildInDb={setUpdatedbuildInDb}
            />
          ) : null} */}
        </Tabs.TabPane>
        <Tabs.TabPane key="2" tab="Dashboard">
          <Filters
            applicationId={applicationId}
            setBuilds={setBuilds}
            setLoadingData={setLoadingData}
            groupDataBy={groupDataBy}
            setGroupDataBy={setGroupDataBy}
            setDefaultFilters={setDefaultFilters}
            isOrbit={true}
          />

          {builds.length > 0 ? (
            <div className="builds__charts">
              <MetricBoxes metrics={metrics} builds={builds} />
              <NotificationCharts
                metrics={metrics}
                stackBarData={stackBarData}
                setGroupDataBy={setGroupDataBy}
                groupDataBy={groupDataBy}
                donutData={donutData}
              />
            </div>
          ) : loadingData ? (
            <div style={{ width: '82%', textAlign: 'center', marginTop: '50px' }}>
              <Spin />
            </div>
          ) : (
            <Empty style={{ marginTop: '150px', width: '82%' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default Orbit;

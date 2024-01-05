import React, { useEffect, useState } from 'react';
import { Tabs, Empty, Spin, Space } from 'antd';
import { useSelector } from 'react-redux';
import moment from 'moment';
import OrbitTable from './OrbitTable';
import WorkUnitCharts from '../common/charts/WorkUnitCharts';
import Filters from './Filters';
import MetricBoxes from '../common/charts/MetricBoxes';
import '../common/css/index.css';
import ExportMenu from '../ExportMenu/ExportMenu';
// import { withTheme } from 'styled-components';

function Orbit() {
  const [builds, setBuilds] = useState([]);
  const [workUnits, setWorkUnits] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [titleMetrics, setTitleMetrics] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [stackBarData, setStackBarData] = useState([]);
  const [donutData, setDonutData] = useState([]);
  const [severity, setSeverity] = useState(['0', '1', '2', '3']);
  const [groupDataBy, setGroupDataBy] = useState('day');
  const [dashboardFilters, setDashboardFilters] = useState({});
  const [filteredWorkUnits, setFilteredWorkUnits] = useState([]);
  const [selectedBuilds, setSelectedBuilds] = useState([]);
  const [filterValues, setFilterValues] = useState({
    initialStatus: [],
    initialStatusOptions: [],
    finalStatus: [],
    finalStatusOptions: [],
    version: [],
    versionOptions: [],
    severity: [],
    severityOptions: [],
    groupDataBy: 'day',
    dateRange: [],
    groupByOptions: [
      { value: 'day', label: 'Day' },
      { value: 'week', label: 'Week' },
      { value: 'month', label: 'Month' },
      { value: 'quarter', label: 'Quarter' },
      { value: 'year', label: 'Year' },
    ],
  });

  const {
    application: { applicationId },
  } = useSelector((item) => item.applicationReducer);

  useEffect(() => {
    const groupedData = builds.map((build) => {
      const weekStart = moment(build.Date).startOf('week').format('MM/DD/YY');
      const weekEnd = moment(build.Date).endOf('week').format('MM/DD/YY');
      const updatedItem = { ...build };
      updatedItem.Date = `${weekStart} - ${weekEnd}`;
      return updatedItem;
    });

    setStackBarData(groupedData);
  }, [groupDataBy]);

  // When build changes run
  useEffect(() => {
    if (filteredWorkUnits) {
      const newMetrics = []; // Pie data
      const newStackBarData = []; // Stack bar Data
      const newDonutData = []; // Donut data
      const newTitleMetrics = []; //title metrics

      newTitleMetrics.push({ title: 'Work Units', description: filteredWorkUnits.length });
      newTitleMetrics.push({
        title: 'Builds',
        description: selectedBuilds.length > 0 ? selectedBuilds.length : builds.length,
      });
      //get date range from filters
      if (dashboardFilters?.dateRange) {
        newTitleMetrics.push({
          title: 'Date Range Selected',
          description:
            moment(dashboardFilters?.dateRange[0]).format('MM/DD/YY') +
            ' - ' +
            moment(dashboardFilters?.dateRange[1]).format('MM/DD/YY'),
        });
      }

      const workUnitCountByInitialStatus = {};
      const workUnitCountByFinalStatus = {};
      const workUnitCountByBuild = {};

      let data;
      switch (groupDataBy) {
        case 'week':
          data = filteredWorkUnits.map((workUnit) => {
            const weekStart = moment(workUnit.metaData.lastRun).startOf('week').format('MM/DD/YY');
            const weekEnd = moment(workUnit.metaData.lastRun).endOf('week').format('MM/DD/YY');
            const updatedItem = { ...workUnit };
            updatedItem.metaData.lastRun = `${weekStart} - ${weekEnd}`;
            return updatedItem;
          });
          break;

        case 'month':
          data = filteredWorkUnits.map((workUnit) => {
            const updatedItem = { ...workUnit };
            updatedItem.metaData.lastRun = moment(moment(workUnit.metaData.lastRun).utc(), 'MM/DD/YYYY').format(
              'MMMM YYYY'
            );
            return updatedItem;
          });
          break;

        case 'quarter':
          data = filteredWorkUnits.map((workUnit) => {
            const updatedItem = { ...workUnit };
            const date = moment.utc(workUnit.metaData.lastRun);
            const year = date.year();
            const quarter = Math.ceil((date.month() + 1) / 3);
            updatedItem.metaData.lastRun = `${year} - Q${quarter}`;
            return updatedItem;
          });
          break;

        case 'year':
          data = filteredWorkUnits.map((workUnit) => {
            const updatedItem = { ...workUnit };
            const date = moment.utc(workUnit.metaData.lastRun);
            const year = date.year();
            updatedItem.metaData.lastRun = year;
            return updatedItem;
          });
          break;

        default:
          data = filteredWorkUnits;
      }
      //---------------------------------------
      data.forEach((workUnit) => {
        if (workUnitCountByInitialStatus[workUnit?.initialStatus]) {
          const newCountInitial = workUnitCountByInitialStatus[workUnit.initialStatus] + 1;
          workUnitCountByInitialStatus[workUnit.initialStatus] = newCountInitial;
        } else {
          workUnitCountByInitialStatus[workUnit?.initialStatus] = 1;
        }

        if (workUnitCountByFinalStatus[workUnit?.finalStatus]) {
          const newCountFinal = workUnitCountByFinalStatus[workUnit.finalStatus] + 1;
          workUnitCountByFinalStatus[workUnit.finalStatus] = newCountFinal;
        } else {
          workUnitCountByFinalStatus[workUnit?.finalStatus] = 1;
        }

        if (groupDataBy == 'day') {
          newStackBarData.push({
            x: workUnit.metaData.lastRun.split('T')[0],
            y: 1,
            z: workUnit.finalStatus,
          });
        } else {
          newStackBarData.push({ x: workUnit.metaData.lastRun, y: 1, z: workUnit?.finalStatus });
        }

        // workUnitCountByBuild;
        const { Build } = workUnit;
        if (workUnitCountByBuild[Build]) {
          workUnitCountByBuild[Build] = workUnitCountByBuild[Build] + 1;
        } else {
          workUnitCountByBuild[Build] = 1;
        }
      });

      //---------------------------------------
      for (let key in workUnitCountByFinalStatus) {
        newMetrics.push({ type: key, value: workUnitCountByFinalStatus[key] });
      }
      //---------------------------------------
      for (let key in workUnitCountByInitialStatus) {
        newDonutData.push({ type: key, value: workUnitCountByInitialStatus?.[key] });
      }
      //---------------------------------------

      //add titles
      newStackBarData.push({ title: 'Count of Workunits by Date and Final Build Status' });
      newDonutData.push({ title: 'Count of Workunits by Initial Build Status' });
      newMetrics.push({ title: 'Count of Workunits by Final Build Status' });

      setTitleMetrics(newTitleMetrics);
      setMetrics(newMetrics);
      setStackBarData(newStackBarData);
      setDonutData(newDonutData);
    }
  }, [builds, selectedBuilds, filteredWorkUnits, groupDataBy]);

  return (
    <div>
      <Tabs
        tabBarExtraContent={
          <>
            <Space style={{ marginRight: '1rem' }}>
              <Filters
                applicationId={applicationId}
                setBuilds={setBuilds}
                setLoadingData={setLoadingData}
                groupDataBy={groupDataBy}
                setGroupDataBy={setGroupDataBy}
                isOrbit={true}
                dashboardFilters={dashboardFilters}
                setDashboardFilters={setDashboardFilters}
                severity={severity}
                setSeverity={setSeverity}
                filterValues={filterValues}
              />
            </Space>
            <Space>
              <ExportMenu />
            </Space>
          </>
        }>
        <Tabs.TabPane key="1" tab="Dashboard">
          <div style={{ width: '100%', marginBottom: '2rem' }}></div>
          <div style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            <MetricBoxes
              metrics={titleMetrics}
              builds={builds}
              bordered={false}
              headStyle={{ color: 'white', background: '#002140', padding: '0rem 3rem 0rem 3rem', fontSize: '1.25rem' }}
            />
          </div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <OrbitTable
              applicationId={applicationId}
              dashboardFilters={dashboardFilters}
              builds={builds}
              setBuilds={setBuilds}
              workUnits={workUnits}
              setWorkUnits={setWorkUnits}
              filteredWorkUnits={filteredWorkUnits}
              setFilteredWorkUnits={setFilteredWorkUnits}
              selectedBuilds={selectedBuilds}
              setSelectedBuilds={setSelectedBuilds}
              filterValues={filterValues}
              setFilterValues={setFilterValues}
            />

            {builds.length > 0 ? (
              <div className="builds__charts">
                <WorkUnitCharts
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
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default Orbit;

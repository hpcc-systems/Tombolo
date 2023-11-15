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

function Orbit() {
  const [builds, setBuilds] = useState([]);
  const [workUnits, setWorkUnits] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [titleMetrics, setTitleMetrics] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [stackBarData, setStackBarData] = useState([]);
  const [donutData, setDonutData] = useState([]);
  const [groupDataBy, setGroupDataBy] = useState('day');
  const [dashboardFilters, setDashboardFilters] = useState({});
  const [filteredWorkUnits, setFilteredWorkUnits] = useState([]);
  const [selectedBuilds, setSelectedBuilds] = useState([]);

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

      const workUnitCountByStatus = {};
      const workUnitCountByBuild = {};

      let data;
      switch (groupDataBy) {
        case 'week':
          data = filteredWorkUnits.map((workUnit) => {
            const weekStart = moment(workUnit.Date).startOf('week').format('MM/DD/YY');
            const weekEnd = moment(workUnit.Date).endOf('week').format('MM/DD/YY');
            const updatedItem = { ...workUnit };
            updatedItem.Date = `${weekStart} - ${weekEnd}`;
            return updatedItem;
          });
          break;

        case 'month':
          data = filteredWorkUnits.map((workUnit) => {
            const updatedItem = { ...workUnit };
            updatedItem.Date = moment(moment(workUnit.Date).utc(), 'MM/DD/YYYY').format('MMMM YYYY');
            return updatedItem;
          });
          break;

        case 'quarter':
          data = filteredWorkUnits.map((workUnit) => {
            const updatedItem = { ...workUnit };
            const date = moment.utc(workUnit.Date);
            const year = date.year();
            const quarter = Math.ceil((date.month() + 1) / 3);
            updatedItem.Date = `${year} - Q${quarter}`;
            return updatedItem;
          });
          break;

        case 'year':
          data = filteredWorkUnits.map((workUnit) => {
            const updatedItem = { ...workUnit };
            const date = moment.utc(workUnit.Date);
            const year = date.year();
            updatedItem.Date = year;
            return updatedItem;
          });
          break;

        default:
          data = filteredWorkUnits;
      }
      //---------------------------------------
      data.forEach((workUnit) => {
        if (workUnitCountByStatus[workUnit?.Status]) {
          const newCount = workUnitCountByStatus[workUnit.Status] + 1;
          workUnitCountByStatus[workUnit.Status] = newCount;
        } else {
          workUnitCountByStatus[workUnit?.Status] = 1;
        }

        if (groupDataBy == 'day') {
          newStackBarData.push({
            x: workUnit.Date.split('T')[0],
            y: 1,
            z: workUnit.Status,
          });
        } else {
          newStackBarData.push({ x: workUnit.Date, y: 1, z: workUnit?.Status });
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
      for (let key in workUnitCountByStatus) {
        newMetrics.push({ title: key, description: workUnitCountByStatus[key] });
      }
      //---------------------------------------
      for (let key in workUnitCountByStatus) {
        newDonutData.push({ type: key, value: workUnitCountByStatus?.[key] });
      }
      //---------------------------------------

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
          <Space>
            <ExportMenu />
          </Space>
        }>
        <Tabs.TabPane key="1" tab="Dashboard">
          <div style={{ width: '100%', marginBottom: '1rem' }}>
            <Filters
              applicationId={applicationId}
              setBuilds={setBuilds}
              setLoadingData={setLoadingData}
              groupDataBy={groupDataBy}
              setGroupDataBy={setGroupDataBy}
              isOrbit={true}
              dashboardFilters={dashboardFilters}
              setDashboardFilters={setDashboardFilters}
            />
          </div>
          <div style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'space-around' }}>
            <MetricBoxes metrics={titleMetrics} builds={builds} />
          </div>
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
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}

export default Orbit;

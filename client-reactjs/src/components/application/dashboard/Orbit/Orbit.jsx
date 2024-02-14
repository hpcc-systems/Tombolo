import React, { useEffect, useState } from 'react';
import { Empty, Spin, Space } from 'antd';
import BreadCrumbs from '../../../common/BreadCrumbs';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import OrbitTable from './OrbitTable';
import WorkUnitCharts from '../common/charts/WorkUnitCharts';
import Filters from './Filters';
import MetricBoxes from '../common/charts/MetricBoxes';
import '../common/css/index.css';
import ExportMenu from '../ExportMenu/ExportMenu';
import { authHeader, handleError } from '../../../common/AuthHeader.js';
import { message } from 'antd';

function Orbit() {
  //all states needed to manage data
  const [builds, setBuilds] = useState([]);
  const [workUnits, setWorkUnits] = useState([]);
  const [filteredWorkUnits, setFilteredWorkUnits] = useState(null);
  const [filteredBuilds, setFilteredBuilds] = useState(null);

  //states for charts and titles
  const [titleMetrics, setTitleMetrics] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [titles, setTitles] = useState({});
  const [stackBarData, setStackBarData] = useState([]);
  const [donutData, setDonutData] = useState([]);
  const [groupDataBy, setGroupDataBy] = useState('day');

  //states for filters -- place values initially to avoid load errors
  const [dashboardFilters, setDashboardFilters] = useState({
    initialStatus: [],
    initialStatusOptions: [],
    finalStatus: [],
    finalStatusOptions: [],
    version: [],
    versionOptions: [],
    severity: [],
    severityOptions: [],
    builds: [],
    buildsOptions: [],
    products: [],
    productsOptions: [],
    businessUnits: [],
    businessUnitsOptions: [],
    wuid: [],
    wuidOptions: [],
    dateRange: [dayjs().subtract(15, 'days'), dayjs()],
    groupDataBy: 'day',
  });

  //states for spinners
  const [loading, setLoading] = useState(false);

  //grab the application ID from redux
  const {
    application: { applicationId },
  } = useSelector((item) => item.applicationReducer);

  // Step 1 - first we are loading the initial builds and workunits into state
  useEffect(() => {
    getbuilds();
  }, [applicationId]);

  //Get list of all builds, workunits, and set initial values and filters
  const getbuilds = async () => {
    try {
      setLoading(true);
      const payload = {
        method: 'GET',
        header: authHeader(),
      };

      if (applicationId === undefined) return;

      const response = await fetch(`/api/orbit/allMonitoring/${applicationId}`, payload);
      if (!response.ok) {
        setLoading(false);
        handleError(response);
      }
      const data = await response.json();

      //get work unit information and put it in builds information
      const response2 = await fetch(`/api/orbit/getWorkUnits/${applicationId}`, payload);
      if (!response2.ok) {
        setLoading(false);
        handleError(response2);
      }
      const data2 = await response2.json();

      let builds2 = [];

      await Promise.all(
        //add data2 workunits to matching builds
        (builds2 = data.map((build) => {
          const wu = data2.filter((workUnit) => workUnit.name === build.build);
          return { ...build, workUnits: wu };
        }))
      );

      //combine and set work units
      let totalWuList = data2;

      totalWuList.sort((a, b) => {
        return new Date(b.metaData.lastRun) - new Date(a.metaData.lastRun);
      });

      //move stuff out of metaData to top level to make it easier to work with
      totalWuList.forEach((workUnit) => {
        workUnit.key = workUnit.id;
        workUnit.initialStatus = workUnit.metaData.initialStatus;
        workUnit.finalStatus = workUnit.metaData.finalStatus;
        workUnit.version = workUnit.metaData.version;
        workUnit.status = workUnit.metaData.status;
        workUnit.lastRun = workUnit.metaData.lastRun;
      });

      //get unique values from workunit list
      const uniqueInitialStatus = [...new Set(totalWuList.map((item) => item.initialStatus.toUpperCase()))];
      const uniqueFinalStatus = [...new Set(totalWuList.map((item) => item.finalStatus.toUpperCase()))];
      const uniqueVersion = [...new Set(totalWuList.map((item) => item.version))];
      const uniqueWorkUnits = [...new Set(totalWuList.map((item) => item.wuid))];

      //get unique values from builds list
      const uniqueSeverity = [...new Set(builds2.map((item) => item.severityCode))];
      const uniqueBuilds = [...new Set(builds2.map((item) => item.build))];
      const uniqueProducts = [...new Set(builds2.map((item) => item.product))];
      const uniqueBusinessUnits = [...new Set(builds2.map((item) => item.businessUnit))];

      //create options for dropdowns
      const uniqueInitialStatusOptions = [];
      uniqueInitialStatus.forEach((item) => uniqueInitialStatusOptions.push({ label: item, value: item }));
      const uniqueFinalStatusOptions = [];
      uniqueFinalStatus.forEach((item) => uniqueFinalStatusOptions.push({ label: item, value: item }));
      const uniqueVersionOptions = [];
      uniqueVersion.forEach((item) => uniqueVersionOptions.push({ label: item, value: item }));
      const uniqueSeverityOptions = [];
      uniqueSeverity.forEach((item) => uniqueSeverityOptions.push({ label: item, value: item }));
      const uniqueBuildsOptions = [];
      uniqueBuilds.forEach((item) => uniqueBuildsOptions.push({ label: item, value: item }));
      const uniqueProductsOptions = [];
      uniqueProducts.forEach((item) => uniqueProductsOptions.push({ label: item, value: item }));
      const uniqueBusinessUnitsOptions = [];
      uniqueBusinessUnits.forEach((item) => uniqueBusinessUnitsOptions.push({ label: item, value: item }));
      const uniqueWorkUnitsOptions = [];
      uniqueWorkUnits.forEach((item) => uniqueWorkUnitsOptions.push({ label: item, value: item }));

      //check URL params for filters
      const params = new URLSearchParams(location.search);
      const filters = {};
      if (params.get('initialStatus')) {
        filters.initialStatus = params.get('initialStatus')?.split(',');
      }
      if (params.get('finalStatus')) {
        filters.finalStatus = params.get('finalStatus')?.split(',');
      }
      if (params.get('dateRange')) {
        const dateString = params.get('dateRange');
        const dates = dateString.split(',');
        const range = [dayjs(dates[0]), dayjs(dates[1])];
        filters.dateRange = range;
      }
      if (params.get('groupDataBy')) {
        filters.groupDataBy = params.get('groupDataBy');
        setGroupDataBy(params.get('groupDataBy'));
        // setGroupDataBy('day');
      }

      setWorkUnits(totalWuList);

      setBuilds(builds2);

      //set them in state for the initial load
      setDashboardFilters((dashboardFilters) => ({
        ...dashboardFilters,
        initialStatus: filters.initialStatus?.length ? filters.initialStatus : uniqueInitialStatus,
        initialStatusOptions: uniqueInitialStatusOptions,
        finalStatus: filters.finalStatus?.length ? filters.finalStatus : uniqueFinalStatus,
        finalStatusOptions: uniqueFinalStatusOptions,
        version: uniqueVersion,
        versionOptions: uniqueVersionOptions,
        severity: uniqueSeverity,
        severityOptions: uniqueSeverityOptions,
        builds: uniqueBuilds,
        buildsOptions: uniqueBuildsOptions,
        products: uniqueProducts,
        productsOptions: uniqueProductsOptions,
        businessUnits: uniqueBusinessUnits,
        businessUnitsOptions: uniqueBusinessUnitsOptions,
        wuid: uniqueWorkUnits,
        wuidOptions: uniqueWorkUnitsOptions,
        dateRange: filters.dateRange?.length ? filters.dateRange : [dayjs().subtract(15, 'days'), dayjs()],
        groupDataBy: filters.groupDataBy ? filters.groupDataBy : 'day',
      }));

      setLoading(false);
    } catch (error) {
      message.error('Failed to fetch builds' + error);
      console.log(error);
    }
  };

  // Step 2 - now we need to apply the initial filters to the initial data
  useEffect(() => {
    //if filtered builds and workunits are empty and the initial data and filters are set, filter data
    if (
      filteredBuilds === null &&
      filteredWorkUnits === null &&
      builds.length > 0 &&
      workUnits.length > 0 &&
      dashboardFilters?.initialStatus?.length > 0
    ) {
      filterData();
    }
  }, [builds, workUnits, dashboardFilters]);

  const filterData = () => {
    let filteredBuildsList = [];

    if (builds.length === 0 || workUnits.length === 0) return;
    //apply filters to build list
    builds.forEach((build) => {
      if (
        dashboardFilters.severity.includes(build.severityCode) &&
        dashboardFilters.builds.includes(build.build) &&
        dashboardFilters.products.includes(build.product) &&
        dashboardFilters.businessUnits.includes(build.businessUnit)
      ) {
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
      let wuDate = dayjs(workUnit.lastRun);

      if (
        wuDate > dayjs(dashboardFilters.dateRange[0]) &&
        wuDate < dayjs(dashboardFilters.dateRange[1]) &&
        dashboardFilters.initialStatus?.includes(workUnit.initialStatus.toUpperCase()) &&
        dashboardFilters.finalStatus?.includes(workUnit.finalStatus.toUpperCase()) &&
        dashboardFilters.version?.includes(workUnit.version) &&
        filteredBuildNameList.includes(workUnit.name)
      ) {
        return true;
      } else {
        return false;
      }
    });

    setFilteredWorkUnits(filtered);
  };

  //Step 3 - now that the filtered builds and workunits are set, we can get the counts and chart data
  useEffect(() => {
    if (filteredBuilds !== null && filteredWorkUnits !== null && filteredBuilds[0].count === undefined) {
      getCounts();
      setChartData();
    }
  }, [filteredBuilds, filteredWorkUnits]);

  const getCounts = () => {
    let builds2 = [];
    let wus = [];

    filteredBuilds.forEach((build) => {
      let count = 0;

      if (build.workUnits?.length > 0) {
        build.workUnits.forEach((workUnit) => {
          let wuDate = dayjs(workUnit.lastRun);

          if (
            wuDate > dayjs(dashboardFilters.dateRange[0]) &&
            wuDate < dayjs(dashboardFilters?.dateRange[1]) &&
            dashboardFilters.initialStatus?.includes(workUnit.initialStatus.toUpperCase()) &&
            dashboardFilters.finalStatus?.includes(workUnit.finalStatus.toUpperCase()) &&
            dashboardFilters.version?.includes(workUnit.version) &&
            dashboardFilters.builds?.includes(workUnit.name)
          ) {
            //check if workunit already exists in wus list to avoid duplicates
            let wuExists = wus.find((item) => item.id === workUnit.id);
            if (!wuExists) {
              wus.push(workUnit);
              count++;
            }
          }
        });
      }

      builds2.push({ ...build, count: count });
    });

    setFilteredBuilds(builds2);
    setLoading(false);
  };

  const setChartData = () => {
    if (filteredWorkUnits) {
      const newMetrics = []; // Pie data
      const newStackBarData = []; // Stack bar Data
      const newDonutData = []; // Donut data
      const newTitleMetrics = []; //title metrics
      const newTitles = [];

      newTitleMetrics.push({ title: 'Work Units', description: filteredWorkUnits.length });
      newTitleMetrics.push({
        title: 'Builds',
        description: filteredBuilds.length > 0 ? filteredBuilds.length : builds.length,
      });
      //get date range from filters
      if (dashboardFilters?.dateRange) {
        newTitleMetrics.push({
          title: 'Date Range Selected',
          description:
            dayjs(dashboardFilters?.dateRange[0]).format('MM/DD/YY') +
            ' - ' +
            dayjs(dashboardFilters?.dateRange[1]).format('MM/DD/YY'),
        });
      }

      const workUnitCountByInitialStatus = {};
      const workUnitCountByFinalStatus = {};
      const workUnitCountByBuild = {};

      let data;
      switch (groupDataBy) {
        case 'week':
          data = filteredWorkUnits.map((workUnit) => {
            const weekStart = dayjs(workUnit.lastRun).startOf('week').format('MM/DD/YY');
            const weekEnd = dayjs(workUnit.lastRun).endOf('week').format('MM/DD/YY');
            const updatedItem = { ...workUnit };
            updatedItem.metaData.lastRun = `${weekStart} - ${weekEnd}`;
            return updatedItem;
          });
          break;

        case 'month':
          data = filteredWorkUnits.map((workUnit) => {
            const updatedItem = { ...workUnit };
            updatedItem.metaData.lastRun = dayjs(dayjs(workUnit.lastRun).utc(), 'MM/DD/YYYY').format('MMMM YYYY');
            return updatedItem;
          });
          break;

        case 'quarter':
          data = filteredWorkUnits.map((workUnit) => {
            const updatedItem = { ...workUnit };
            const date = dayjs.utc(workUnit.lastRun);
            const year = date.year();
            const quarter = Math.ceil((date.month() + 1) / 3);
            updatedItem.metaData.lastRun = `${year} - Q${quarter}`;
            return updatedItem;
          });
          break;

        case 'year':
          data = filteredWorkUnits.map((workUnit) => {
            const updatedItem = { ...workUnit };
            const date = dayjs.utc(workUnit.lastRun);
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
            y: 20,
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
      newTitles.initial = 'Count of Workunits by Initial Build Status';
      newTitles.initialInner = filteredWorkUnits.length.toString();
      newTitles.final = 'Count of Workunits by Final Build Status';
      newTitles.finalInner = filteredWorkUnits.length.toString();
      newTitles.stack = 'Count of Workunits by Date and Final Build Status';

      setTitleMetrics(newTitleMetrics);
      setMetrics(newMetrics);
      setStackBarData(newStackBarData);
      setDonutData(newDonutData);
      setTitles(newTitles);
    }
  };

  //Step 4 (repeatable) - now we need to re-render the data when it filters change
  useEffect(() => {
    //if dashboard filters are set and filtered builds and workunits
    if (Object.keys(dashboardFilters).length && filteredBuilds !== null && filteredWorkUnits !== null) {
      filterData();
    }
  }, [dashboardFilters]);

  return (
    <div>
      <BreadCrumbs
        extraContent={
          <>
            <div>
              <Space style={{ marginRight: '1rem' }}>
                <Filters
                  groupDataBy={groupDataBy}
                  setGroupDataBy={setGroupDataBy}
                  dashboardFilters={dashboardFilters}
                  setDashboardFilters={setDashboardFilters}
                />
              </Space>
              <Space>
                <ExportMenu />
              </Space>
            </div>
          </>
        }
      />

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
        <OrbitTable filteredWorkUnits={filteredWorkUnits} filteredBuilds={filteredBuilds} loading={loading} />

        {builds.length > 0 ? (
          <div className="builds__charts">
            <WorkUnitCharts
              metrics={metrics}
              stackBarData={stackBarData}
              setGroupDataBy={setGroupDataBy}
              groupDataBy={groupDataBy}
              titles={titles}
              donutData={donutData}
            />
          </div>
        ) : loading ? (
          <div style={{ width: '82%', textAlign: 'center', marginTop: '50px' }}>
            <Spin />
          </div>
        ) : (
          <Empty style={{ marginTop: '150px', width: '82%' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </div>
  );
}

export default Orbit;

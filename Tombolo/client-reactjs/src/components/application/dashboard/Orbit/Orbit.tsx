import React, { useEffect, useState } from 'react';
import { Tabs, Empty, Spin, Space } from 'antd';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
import OrbitTable from './OrbitTable';
import WorkUnitCharts from '../common/charts/WorkUnitCharts';
import Filters from './Filters';
import MetricBoxes from '../common/charts/MetricBoxes';
import ExportMenu from '../ExportMenu/ExportMenu';
import { handleError as handleResponseError } from '@/components/common/handleResponse';
import orbitService from '@/services/orbit.service';

const Orbit: React.FC = () => {
  const [builds, setBuilds] = useState<any[]>([]);
  const [workUnits, setWorkUnits] = useState<any[]>([]);
  const [filteredWorkUnits, setFilteredWorkUnits] = useState<any[] | null>(null);
  const [filteredBuilds, setFilteredBuilds] = useState<any[] | null>(null);

  const [titleMetrics, setTitleMetrics] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [stackBarData, setStackBarData] = useState<any[]>([]);
  const [donutData, setDonutData] = useState<any[]>([]);
  const [groupDataBy, setGroupDataBy] = useState<string>('day');

  const [dashboardFilters, setDashboardFilters] = useState<any>({
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

  const [loading, setLoading] = useState(false);
  const applicationId = useSelector((state: any) => state.application.application.applicationId);

  useEffect(() => {
    getbuilds();
  }, [applicationId]);

  const getbuilds = async () => {
    try {
      setLoading(true);
      if (applicationId === undefined) return;

      const data = await orbitService.getAllMonitoring({ applicationId });
      const data2 = await orbitService.getWorkUnits({ applicationId });

      let builds2: any[] = [];

      await Promise.all(
        (builds2 = data.map((build: any) => {
          const wu = data2.filter((workUnit: any) => workUnit.name === build.build);
          return { ...build, workUnits: wu };
        }))
      );

      let totalWuList = data2;

      totalWuList.sort(
        (a: any, b: any) => new Date(b.metaData.lastRun).getTime() - new Date(a.metaData.lastRun).getTime()
      );

      totalWuList.forEach((workUnit: any) => {
        workUnit.key = workUnit.id;
        workUnit.initialStatus = workUnit.metaData.initialStatus;
        workUnit.finalStatus = workUnit.metaData.finalStatus;
        workUnit.version = workUnit.metaData.version;
        workUnit.status = workUnit.metaData.status;
        workUnit.lastRun = workUnit.metaData.lastRun;
      });

      const uniqueInitialStatus = [...new Set(totalWuList.map((item: any) => item.initialStatus?.toUpperCase()))];
      const uniqueFinalStatus = [...new Set(totalWuList.map((item: any) => item.finalStatus?.toUpperCase()))];
      const uniqueVersion = [...new Set(totalWuList.map((item: any) => item.version))];
      const uniqueWorkUnits = [...new Set(totalWuList.map((item: any) => item.wuid))];

      const uniqueSeverity = [...new Set(builds2.map((item: any) => item.severityCode))];
      const uniqueBuilds = [...new Set(builds2.map((item: any) => item.build))];
      const uniqueProducts = [...new Set(builds2.map((item: any) => item.product))];
      const uniqueBusinessUnits = [...new Set(builds2.map((item: any) => item.businessUnit))];

      const makeOptions = (arr: any[]) => arr.map(item => ({ label: item, value: item }));

      const uniqueInitialStatusOptions = makeOptions(uniqueInitialStatus);
      const uniqueFinalStatusOptions = makeOptions(uniqueFinalStatus);
      const uniqueVersionOptions = makeOptions(uniqueVersion);
      const uniqueSeverityOptions = makeOptions(uniqueSeverity);
      const uniqueBuildsOptions = makeOptions(uniqueBuilds);
      const uniqueProductsOptions = makeOptions(uniqueProducts);
      const uniqueBusinessUnitsOptions = makeOptions(uniqueBusinessUnits);
      const uniqueWorkUnitsOptions = makeOptions(uniqueWorkUnits);

      const params = new URLSearchParams(location.search);
      const filters: any = {};
      if (params.get('initialStatus')) filters.initialStatus = params.get('initialStatus')?.split(',');
      if (params.get('finalStatus')) filters.finalStatus = params.get('finalStatus')?.split(',');
      if (params.get('dateRange')) {
        const dateString = params.get('dateRange')!;
        const dates = dateString.split(',');
        const range = [dayjs(dates[0]), dayjs(dates[1])];
        filters.dateRange = range;
      }
      if (params.get('groupDataBy')) {
        filters.groupDataBy = params.get('groupDataBy');
        setGroupDataBy(params.get('groupDataBy') as string);
      }

      setWorkUnits(totalWuList);
      setBuilds(builds2);

      setDashboardFilters((dashboardFilters: any) => ({
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
      handleResponseError('Failed to fetch builds' + error);
    }
  };

  useEffect(() => {
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
    let filteredBuildsList: any[] = [];
    if (builds.length === 0 || workUnits.length === 0) return;

    builds.forEach(build => {
      if (
        dashboardFilters.severity.includes(build.severityCode) &&
        dashboardFilters.builds.includes(build.build) &&
        dashboardFilters.products.includes(build.product) &&
        dashboardFilters.businessUnits.includes(build.businessUnit)
      ) {
        filteredBuildsList.push(build);
      } else return;
    });

    setFilteredBuilds(filteredBuildsList);

    let filteredBuildNameList = filteredBuildsList.map(build => build.build);

    let filtered = workUnits.filter(workUnit => {
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
      }
      return false;
    });

    setFilteredWorkUnits(filtered);
  };

  useEffect(() => {
    if (
      filteredBuilds !== null &&
      filteredWorkUnits !== null &&
      filteredBuilds[0] &&
      filteredBuilds[0].count === undefined
    ) {
      getCounts();
      setChartData();
    }
  }, [filteredBuilds, filteredWorkUnits]);

  const getCounts = () => {
    let builds2: any[] = [];
    let wus: any[] = [];

    filteredBuilds.forEach(build => {
      let count = 0;
      if (build.workUnits?.length > 0) {
        build.workUnits.forEach((workUnit: any) => {
          let wuDate = dayjs(workUnit.lastRun);
          if (
            wuDate > dayjs(dashboardFilters.dateRange[0]) &&
            wuDate < dayjs(dashboardFilters?.dateRange[1]) &&
            dashboardFilters.initialStatus?.includes(workUnit.initialStatus.toUpperCase()) &&
            dashboardFilters.finalStatus?.includes(workUnit.finalStatus.toUpperCase()) &&
            dashboardFilters.version?.includes(workUnit.version) &&
            dashboardFilters.builds?.includes(workUnit.name)
          ) {
            let wuExists = wus.find(item => item.id === workUnit.id);
            if (!wuExists) {
              wus.push(workUnit);
              count++;
            }
          }
        });
      }
      builds2.push({ ...build, count });
    });

    setFilteredBuilds(builds2);
    setLoading(false);
  };

  const setChartData = () => {
    if (filteredWorkUnits) {
      const newMetrics: any[] = [];
      const newStackBarData: any[] = [];
      const newDonutData: any[] = [];
      const newTitleMetrics: any[] = [];

      newTitleMetrics.push({ title: 'Work Units', description: filteredWorkUnits.length });
      newTitleMetrics.push({
        title: 'Builds',
        description: filteredBuilds && filteredBuilds.length > 0 ? filteredBuilds.length : builds.length,
      });

      if (dashboardFilters?.dateRange) {
        newTitleMetrics.push({
          title: 'Date Range Selected',
          description:
            dayjs(dashboardFilters?.dateRange[0]).format('MM/DD/YY') +
            ' - ' +
            dayjs(dashboardFilters?.dateRange[1]).format('MM/DD/YY'),
        });
      }

      const workUnitCountByInitialStatus: any = {};
      const workUnitCountByFinalStatus: any = {};
      const workUnitCountByBuild: any = {};

      let data: any[];
      switch (groupDataBy) {
        case 'week':
          data = filteredWorkUnits.map(workUnit => {
            const weekStart = dayjs(workUnit.lastRun).startOf('week').format('MM/DD/YY');
            const weekEnd = dayjs(workUnit.lastRun).endOf('week').format('MM/DD/YY');
            const updatedItem = { ...workUnit };
            updatedItem.metaData.lastRun = `${weekStart} - ${weekEnd}`;
            return updatedItem;
          });
          break;
        case 'month':
          data = filteredWorkUnits.map(workUnit => {
            const updatedItem = { ...workUnit };
            updatedItem.metaData.lastRun = dayjs(dayjs(workUnit.lastRun).utc(), 'MM/DD/YYYY').format('MMMM YYYY');
            return updatedItem;
          });
          break;
        case 'quarter':
          data = filteredWorkUnits.map(workUnit => {
            const updatedItem = { ...workUnit };
            const date = dayjs.utc(workUnit.lastRun);
            const year = date.year();
            const quarter = Math.ceil((date.month() + 1) / 3);
            updatedItem.metaData.lastRun = `${year} - Q${quarter}`;
            return updatedItem;
          });
          break;
        case 'year':
          data = filteredWorkUnits.map(workUnit => {
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

      data.forEach(workUnit => {
        if (workUnitCountByInitialStatus[workUnit?.initialStatus])
          workUnitCountByInitialStatus[workUnit.initialStatus] += 1;
        else workUnitCountByInitialStatus[workUnit?.initialStatus] = 1;

        if (workUnitCountByFinalStatus[workUnit?.finalStatus]) workUnitCountByFinalStatus[workUnit.finalStatus] += 1;
        else workUnitCountByFinalStatus[workUnit?.finalStatus] = 1;

        if (groupDataBy === 'day')
          newStackBarData.push({ x: workUnit.metaData.lastRun.split('T')[0], y: 1, z: workUnit.finalStatus });
        else newStackBarData.push({ x: workUnit.metaData.lastRun, y: 1, z: workUnit?.finalStatus });

        const { Build } = workUnit;
        if (workUnitCountByBuild[Build]) workUnitCountByBuild[Build] += 1;
        else workUnitCountByBuild[Build] = 1;
      });

      for (let key in workUnitCountByFinalStatus)
        newMetrics.push({ type: key, value: workUnitCountByFinalStatus[key] });
      for (let key in workUnitCountByInitialStatus)
        newDonutData.push({ type: key, value: workUnitCountByInitialStatus?.[key] });

      newStackBarData.push({ title: 'Count of Workunits by Date and Final Build Status' });
      newDonutData.push({ title: 'Count of Workunits by Initial Build Status' });
      newMetrics.push({ title: 'Count of Workunits by Final Build Status' });

      setTitleMetrics(newTitleMetrics);
      setMetrics(newMetrics);
      setStackBarData(newStackBarData);
      setDonutData(newDonutData);
    }
  };

  useEffect(() => {
    if (Object.keys(dashboardFilters).length && filteredBuilds !== null && filteredWorkUnits !== null) filterData();
  }, [dashboardFilters]);

  return (
    <div>
      <Tabs
        type="card"
        tabBarExtraContent={
          <>
            <Space style={{ marginRight: '1rem' }}>
              <Filters
                applicationId={applicationId}
                setBuilds={setBuilds}
                groupDataBy={groupDataBy}
                setGroupDataBy={setGroupDataBy}
                isOrbit={true}
                dashboardFilters={dashboardFilters}
                setDashboardFilters={setDashboardFilters}
              />
            </Space>
            <Space>
              <ExportMenu />
            </Space>
          </>
        }>
        <Tabs.TabPane key="1" tab="Dashboard">
          <div style={{ width: '100%', marginBottom: '2rem' }} />
          <div style={{ width: '100%', marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
            {React.createElement(MetricBoxes as any, {
              metrics: titleMetrics,
              builds,
              bordered: false,
              headStyle: { color: 'white', background: '#002140', padding: '0rem 3rem 0rem 3rem', fontSize: '1.25rem' },
            })}
          </div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <OrbitTable filteredWorkUnits={filteredWorkUnits} filteredBuilds={filteredBuilds} loading={loading} />

            {builds.length > 0 ? (
              <div className="builds__charts">
                {React.createElement(WorkUnitCharts as any, {
                  metrics,
                  stackBarData,
                  setGroupDataBy,
                  groupDataBy,
                  donutData,
                })}
              </div>
            ) : loading ? (
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
};

export default Orbit;

import React, { useEffect, useState } from 'react';
import { Button, Tabs, Spin, Space, message } from 'antd/lib';
import JobExecutionDetails from './JobExecutionDetails';
import ManualJobsStatus from './ManualJobsStatus';
import { authHeader, handleError } from '../../common/AuthHeader.js';
import { Resizable } from 're-resizable';
import GraphX6 from '../Graph/GraphX6';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';
import useSelectDataflow from '../../../hooks/useSelectDataflow';
const { TabPane } = Tabs;


export const DataflowInstanceDetails = () => {
  const [applicationReducer, dataflowReducer] = useSelector((state) => [ state.applicationReducer, state.dataflowReducer, ]);

  const [graphSize, setGraphSize] = useState({ width: '100%', height: 200 });
  const [jobExecutions, setJobExecutions] = useState({ loading: false, error:'', data:[], statuses: [], JETableFilters: {}, selectedJEGroup: '', });
  const {isDataflowReady} = useSelectDataflow(); // this hook will check if dataflow is present in redux, if not it will request data from DB and update redux

  const params = useParams();

  const getJobExecutionDetails = async () => {
    try {
      const applicationId = applicationReducer.application.applicationId || params.applicationId;
      const dataflowId = dataflowReducer.dataflowId || params.dataflowId;

      setJobExecutions((prev) => ({ ...prev, loading: true, error:'' }));

      const response = await fetch( '/api/job/jobExecutionDetails?dataflowId=' + dataflowId + '&applicationId=' + applicationId, { headers: authHeader() } );
      if (!response.ok) handleError(response);

      const data = await response.json();

      setJobExecutions((prev) => ({ ...prev, loading: false, data }));
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
      message.error(error.message);
      setJobExecutions((prev) => ({ ...prev, loading: false, error: error.message }));
    }
  };

  //Manage job execution table filters
  const handleJEFilters = (data) => {
    setJobExecutions((prev) => ({ ...prev, JETableFilters: data }));
  };
  
  //Set selected Job Execution group
  const onGroupSelect = (id) => {
    const dataflowId = dataflowReducer.dataflowId || params.dataflowId;
    const statuses = jobExecutions.data.reduce((acc, el) => {
      if (el.jobExecutionGroupId === id) {
        const subProcessId = el.subProcess?.id || '';
        acc.push({ status: el.status, assetId: el.task, subProcessId: dataflowId === subProcessId ? '' : subProcessId});
      }
      return acc;
    }, []);
    setJobExecutions((prev) => ({ ...prev, selectedJEGroup: id, statuses }));
  };

  useEffect(() => {
    (async () => {
      await getJobExecutionDetails();
      const LSGraphHeight = JSON.parse(localStorage.getItem('graphSize'));
      if (LSGraphHeight) {
        setGraphSize( prev => ({...prev, height: LSGraphHeight }));
      }
    })();
  }, []);

  if (!applicationReducer.application || !applicationReducer.application.applicationId) return null;
 
   if (!isDataflowReady) return <Spin size='large' spinning={true} />;
 
  return (
    <React.Fragment>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, left: 0 }}>
          <GraphX6 readOnly={true} statuses={jobExecutions.statuses} />
        </div>

        <Resizable
          style={{
            overflow: 'auto',
            borderRadius: '5px',
            border: '2px solid #ddd',
            backgroundColor: 'white',
          }}
          enable={{ top: true }}
          size={{ width: graphSize.width, height: graphSize.height }}
          onResizeStop={(e, direction, ref, d) => {
            const newHeight = graphSize.height + d.height;
            setGraphSize({ height: newHeight });
            localStorage.setItem('graphSize', JSON.stringify(newHeight));
          }}
        >
          <Tabs
            type="card"
            tabBarExtraContent={
              <Space size={'small'} style={{ marginBottom: '10px' }}>
                <Button
                  type="primary"
                  disabled={Object.keys(jobExecutions.JETableFilters).length < 1}
                  onClick={() => handleJEFilters({})}
                  ghost
                >
                  Clear all Filters
                </Button>
                <Button type="primary" onClick={getJobExecutionDetails}>
                  Refresh Records
                </Button>
              </Space>
            }
            style={{ padding: '10px' }}
          >
            <TabPane tab="Workunits" key="1">
              <Spin spinning={jobExecutions.loading}>
                <JobExecutionDetails
                  refreshData={getJobExecutionDetails}
                  jobExecutions={jobExecutions.data}
                  setFilters={handleJEFilters}
                  selectJEGroup={onGroupSelect}
                  JEGroup={jobExecutions.selectedJEGroup}
                  JEGroupFilters={jobExecutions.JETableFilters}
                />
              </Spin>
            </TabPane>
            <TabPane tab="Manual Jobs" key="2">
              <Spin spinning={jobExecutions.loading}>
                <ManualJobsStatus
                  refreshData={getJobExecutionDetails}
                  jobExecutions={jobExecutions.data}
                  graphSize={graphSize}
                  handleJEFilters={handleJEFilters}
                  JETableFilters={jobExecutions.JETableFilters}
                />
              </Spin>
            </TabPane>
          </Tabs>
        </Resizable>
      </div>
    </React.Fragment>
  );
};


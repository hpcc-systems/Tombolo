import React, { useEffect, useState } from 'react';
import { Button, Tabs, Spin, Space } from 'antd/lib';
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
  const [jobExecDetails, setJobExecDetails] = useState({ loading: false, statuses: [], jobExecutionDetails: {}, jobExecutionTableFilters: {}, selectedJobExecutionGroup: '', });
  const {isDataflowReady} = useSelectDataflow(); // this hook will check if dataflow is present in redux, if not it will request data from DB and update redux

  const params = useParams();

  const getJobExecutionDetails = async () => {
    try {
      const applicationId = applicationReducer.application.applicationId || params.applicationId;
      const dataflowId = dataflowReducer.dataflowId || params.dataflowId;

      setJobExecDetails((prev) => ({ ...prev, loading: true }));

      const response = await fetch( '/api/job/jobExecutionDetails?dataflowId=' + dataflowId + '&applicationId=' + applicationId, { headers: authHeader() } );
      if (!response.ok) handleError(response);

      const data = await response.json();
      const jobExecutionDetails = { wuDetails: data };

      setJobExecDetails((prev) => ({ ...prev, loading: false, jobExecutionDetails }));
    } catch (error) {
      console.log('-error-----------------------------------------');
      console.dir({ error }, { depth: null });
      console.log('------------------------------------------');
    }
  };

  //Manage job execution table filters
  const manageJobExecutionFilters = (data) => {
    setJobExecDetails((prev) => ({ ...prev, jobExecutionTableFilters: data }));
  };

  //Set selected Job Execution group
  const setSelectedJobExecutionGroup = (id) => {
    const statuses = jobExecDetails.jobExecutionDetails?.wuDetails.reduce((acc, el) => {
      if (el.jobExecutionGroupId === id) {
        acc.push({ status: el.status, assetId: el.task });
      }
      return acc;
    }, []);
    setJobExecDetails((prev) => ({ ...prev, selectedJobExecutionGroup: id, statuses }));
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
          <GraphX6 readOnly={true} statuses={jobExecDetails.statuses} />
        </div>

        <Resizable
          style={{
            overflow: 'hidden',
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
                  disabled={Object.keys(jobExecDetails.jobExecutionTableFilters).length < 1}
                  onClick={() => manageJobExecutionFilters({})}
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
              <Spin spinning={jobExecDetails.loading}>
                <JobExecutionDetails
                  refreshData={getJobExecutionDetails}
                  workflowDetails={jobExecDetails.jobExecutionDetails}
                  graphSize={graphSize}
                  manageJobExecutionFilters={manageJobExecutionFilters}
                  setSelectedJobExecutionGroup={setSelectedJobExecutionGroup}
                  jobExecutionTableFilters={jobExecDetails.jobExecutionTableFilters}
                  selectedJobExecutionGroup={jobExecDetails.selectedJobExecutionGroup}
                />
              </Spin>
            </TabPane>
            <TabPane tab="Manual Jobs" key="2">
              <Spin spinning={jobExecDetails.loading}>
                <ManualJobsStatus
                  refreshData={getJobExecutionDetails}
                  workflowDetails={jobExecDetails.jobExecutionDetails}
                  graphSize={graphSize}
                  manageJobExecutionFilters={manageJobExecutionFilters}
                  jobExecutionTableFilters={jobExecDetails.jobExecutionTableFilters}
                />
              </Spin>
            </TabPane>
          </Tabs>
        </Resizable>
      </div>
    </React.Fragment>
  );
};


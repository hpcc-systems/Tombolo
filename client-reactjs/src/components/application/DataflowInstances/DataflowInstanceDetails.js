import React, {Component} from 'react';
import {Button, Tabs, Spin, Space} from 'antd/lib';
import {withRouter} from 'react-router-dom';
import {Graph} from '../Dataflow/Graph';
import JobExecutionDetails from './JobExecutionDetails';
import ManualJobsStatus from './ManualJobsStatus';
import {connect} from 'react-redux';
import {authHeader, handleError} from '../../common/AuthHeader.js';
import {Resizable} from 're-resizable';
const {TabPane} = Tabs;

class DataflowInstanceDetails extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    jobExecutionDetails: {},
    loading: false,
    graphSize: {
      width: '100%',
      height: 400,
    },
    jobExecutionTableFilters: {},
  };

  componentDidMount() {
    this.getJobExecutionDetails();
    const LSGraphHeight = JSON.parse(localStorage.getItem('graphSize'));
    console.log(`typeof LSGraphHeight`, typeof LSGraphHeight);
    if (LSGraphHeight) {
      this.setState({graphSize: {height: LSGraphHeight}});
    }
  }

  getJobExecutionDetails = () => {
    this.setState({
      loading: true,
    });
    fetch('/api/job/jobExecutionDetails?dataflowId=' + this.props.dataflowId + '&applicationId=' + this.props.application.applicationId, {
      headers: authHeader(),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then((data) => {
        let jobExecutionDetails = {wuDetails: data};
        this.setState({
          jobExecutionDetails: jobExecutionDetails,
          loading: false,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  //Manage job execution table filters
  manageJobExecutionFilters = (data) => {
    this.setState({jobExecutionTableFilters: data});
  };

  //Tab pane control btns
  controls = (
    <Space size={'small'} style={{marginBottom: '10px'}}>
      <Button
        type="primary"
        // disabled={!Object.keys(filters).length}
        onClick={() => this.manageJobExecutionFilters({})}
        ghost>
        Clear all Filters
      </Button>
      <Button type="primary" onClick={this.getJobExecutionDetails}>
        Refresh Records
      </Button>
    </Space>
  );

  render() {
    //if(this.props.dataflowId == undefined || this.props.applicationId == undefined)
    if (!this.props.application || !this.props.application.applicationId) return null;
    return (
      <React.Fragment>
        <Resizable
          style={{border: '2px solid #ddd', borderRadius: '5px', overflow: 'hidden'}}
          enable={{bottom: true}}
          size={{width: this.state.graphSize.width, height: this.state.graphSize.height}}
          onResizeStop={(e, direction, ref, d) => {
            const newHeight = this.state.graphSize.height + d.height;
            this.setState({graphSize: {height: newHeight}});
            localStorage.setItem('graphSize', JSON.stringify(newHeight));
          }}>
          <Graph
            applicationId={this.props.applicationId}
            viewMode={true}
            selectedDataflow={{id: this.props.dataflowId}}
            workflowDetails={this.state.jobExecutionDetails}
            graphContainer="graph"
            sidebarContainer="sidebar"
          />
        </Resizable>

        <Tabs type="card" tabBarExtraContent={this.controls} style={{padding: '10px'}}>
          <TabPane tab="Workunits" key="1">
            <Spin spinning={this.state.loading}>
              <JobExecutionDetails
                refreshData={this.getJobExecutionDetails}
                workflowDetails={this.state.jobExecutionDetails}
                graphSize={this.state.graphSize}
                jobExecution={{
                  manageJobExecutionFilters: this.manageJobExecutionFilters,
                  jobExecutionTableFilters: this.state.jobExecutionTableFilters,
                }}
              />
            </Spin>
          </TabPane>
          <TabPane tab="Manual Jobs" key="2">
            <Spin spinning={this.state.loading}>
              <ManualJobsStatus
                refreshData={this.getJobExecutionDetails}
                workflowDetails={this.state.jobExecutionDetails}
                manageJobExecutionFilters={this.manageJobExecutionFilters}
                graphSize={this.state.graphSize}
                jobExecution={{
                  manageJobExecutionFilters: this.manageJobExecutionFilters,
                  jobExecutionTableFilters: this.state.jobExecutionTableFilters,
                }}
              />
            </Spin>
          </TabPane>
        </Tabs>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const {user} = state.authenticationReducer;
  const {application, selectedTopNav} = state.applicationReducer;
  const {applicationId, dataflowId} = state.dataflowReducer;
  return {
    user,
    application,
    selectedTopNav,
    applicationId,
    dataflowId,
  };
}

const connectedDataflowInstances = connect(mapStateToProps)(withRouter(DataflowInstanceDetails));
export {connectedDataflowInstances as DataflowInstanceDetails};

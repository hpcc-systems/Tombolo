import React, {Component} from 'react';
import {Button, Tabs, Spin, Space} from 'antd/lib';
import {withRouter} from 'react-router-dom';
import {Graph} from '../Dataflow/Graph';
import JobExecutionDetails from './JobExecutionDetails';
import ManualJobsStatus from './ManualJobsStatus';
import {connect} from 'react-redux';
import {authHeader, handleError} from '../../common/AuthHeader.js';
import {Resizable} from 're-resizable';
import GraphX6 from '../Graph/GraphX6';
const {TabPane} = Tabs;

class DataflowInstanceDetails extends Component {

  state = {
    loading: false,
    graphSize: {
      width: '100%',
      height: 600,
    },
    statuses:[],
    jobExecutionDetails: {},
    jobExecutionTableFilters: {},
    selectedJobExecutionGroup : ''
  };

  componentDidMount() {
    this.getJobExecutionDetails();
    const LSGraphHeight = JSON.parse(localStorage.getItem('graphSize'));
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

  //Set selected Job Execution group
  setSelectedJobExecutionGroup = (id) => {
    const statuses = this.state.jobExecutionDetails?.wuDetails.reduce((acc,el)=>{
      if (el.jobExecutionGroupId === id){
        acc.push({status:el.status, assetId: el.task})
      }
      return acc;
    },[])
    this.setState({selectedJobExecutionGroup : id, statuses})
  }


  render() {
    // console.log(this.state)
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
            <GraphX6 readOnly={true} statuses={this.state.statuses} />
        </Resizable>

        <Tabs
          type="card"
          tabBarExtraContent={
            <Space size={'small'} style={{ marginBottom: '10px' }}>
              <Button type="primary" disabled={Object.keys(this.state.jobExecutionTableFilters).length < 1} onClick={() => this.manageJobExecutionFilters({})} ghost>
                Clear all Filters
              </Button>
              <Button type="primary" onClick={this.getJobExecutionDetails}>
                Refresh Records
              </Button>
            </Space>
          }
          style={{ padding: '10px' }}
        >
          <TabPane tab="Workunits" key="1">
            <Spin spinning={this.state.loading}>
              <JobExecutionDetails
                refreshData={this.getJobExecutionDetails}
                workflowDetails={this.state.jobExecutionDetails}
                graphSize={this.state.graphSize}
                manageJobExecutionFilters = {this.manageJobExecutionFilters}
                setSelectedJobExecutionGroup = { this.setSelectedJobExecutionGroup}
                jobExecutionTableFilters = { this.state.jobExecutionTableFilters}
                selectedJobExecutionGroup = { this.state.selectedJobExecutionGroup}
              />
            </Spin>
          </TabPane>
          <TabPane tab="Manual Jobs" key="2">
            <Spin spinning={this.state.loading}>
              <ManualJobsStatus
                refreshData={this.getJobExecutionDetails}
                workflowDetails={this.state.jobExecutionDetails}
                graphSize={this.state.graphSize}
                manageJobExecutionFilters={this.manageJobExecutionFilters}
                jobExecutionTableFilters = { this.state.jobExecutionTableFilters}
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

const connectedDataflowInstances = connect(mapStateToProps)(DataflowInstanceDetails);
export {connectedDataflowInstances as DataflowInstanceDetails};

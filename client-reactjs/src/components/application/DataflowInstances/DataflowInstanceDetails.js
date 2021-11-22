import React, { Component } from "react";
import { Button, Table, Divider, message, Icon, Tooltip, Row, Col, Tabs, Spin } from 'antd/lib';
import { NavLink, Switch, Route, withRouter } from 'react-router-dom';
import {Graph} from "../Dataflow/Graph";
import {FileTable} from "../FileTable";
import QueryTable from "../QueryTable";
import DataflowInstanceWorkUnits from "./DataflowInstanceWorkUnits";
import JobExecutionDetails from "./JobExecutionDetails";
import ManualJobsStatus from "./ManualJobsStatus";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { Constants } from '../../common/Constants';
const { TabPane } = Tabs;

class DataflowInstanceDetails extends Component {

  constructor(props) {
    super(props);
  }

  state = {
    jobExecutionDetails: {},
    loading: false
  }

  componentDidMount() {
    this.getJobExecutionDetails();
  }

  getJobExecutionDetails = () => {
    this.setState({
      loading: true
    })
    fetch("/api/job/jobExecutionDetails?dataflowId="+this.props.dataflowId+"&applicationId="+this.props.application.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      let jobExecutionDetails = {wuDetails: data} ;
      this.setState({
        jobExecutionDetails: jobExecutionDetails,
        loading: false
      });
    })
    .catch(error => {
      console.log(error);
    });
  }

  render() {
    //if(this.props.dataflowId == undefined || this.props.applicationId == undefined)
    if(!this.props.application || !this.props.application.applicationId)
      return null;
    return (
      <React.Fragment>
        <div>
          <div style={{border:'1px solid #f0f0f0', borderBottomColor: "#fff", borderRadius:'5px'}}> 
            <Graph
              applicationId={this.props.applicationId}
              viewMode={true}
              selectedDataflow={{'id':this.props.dataflowId}}
              workflowDetails={this.state.jobExecutionDetails}
              graphContainer="graph"
              sidebarContainer="sidebar"
              />
          </div>

          <div>
            <Tabs type="card">
             <TabPane tab="Workunits" key="1">
               <Spin spinning={this.state.loading}>
                  <JobExecutionDetails workflowDetails={this.state.jobExecutionDetails}/>
               </Spin>
              </TabPane>
              <TabPane tab="Manual Jobs" key="2">
               <Spin spinning={this.state.loading}>
                  <ManualJobsStatus workflowDetails={this.state.jobExecutionDetails}/>
               </Spin>
              </TabPane>
            </Tabs>
          </div>
        </div>
      </React.Fragment>
    )
  }
}

function mapStateToProps(state) {
  const { user } = state.authenticationReducer;
  const { application, selectedTopNav } = state.applicationReducer;
  //const { applicationId, dataflowId, workflowId, instanceId, workflowDetails } = state.dataflowInstancesReducer;
  const { applicationId, dataflowId } = state.dataflowReducer;
  return {
      user,
      application,
      selectedTopNav,
      applicationId, dataflowId
  };
}

const connectedDataflowInstances = connect(mapStateToProps)(withRouter(DataflowInstanceDetails));
export { connectedDataflowInstances as DataflowInstanceDetails };
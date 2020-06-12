import React, { Component } from "react";
import { Button, Table, Divider, message, Icon, Tooltip, Row, Col, Tabs } from 'antd/lib';
import { NavLink, Switch, Route, withRouter } from 'react-router-dom';
import {Graph} from "../Dataflow/Graph";
import FileTable from "../FileTable";
import QueryTable from "../QueryTable";
import DataflowInstanceWorkUnits from "./DataflowInstanceWorkUnits";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { Constants } from '../../common/Constants';
const { TabPane } = Tabs;

class DataflowInstanceDetails extends Component {

  constructor(props) {
    super(props);
  }  

  componentDidMount() {
    console.log('componentDidMount - DataflowInstanceDetails: '+this.props.dataflowId+', '+this.props.applicationId)
  } 

  render() {    
    //if(this.props.dataflowId == undefined || this.props.applicationId == undefined) 
    if(!this.props.application || !this.props.application.applicationId)
      return null;
    return (
      <React.Fragment>
        <div>
          <Graph 
            applicationId={this.props.applicationId} 
            viewMode={true} 
            selectedDataflow={this.props.workflowId} 
            workflowDetails={this.props.workflowDetails}
            />
        </div>
        <div>
          <Tabs type="card">
            <TabPane tab="Work Units" key="1">
              <DataflowInstanceWorkUnits
                applicationId={this.props.applicationId} 
                viewMode={true} 
                selectedWorkflow={this.props.dataflowId} 
                instanceId={this.props.instanceId} 
              />
            </TabPane>
            <TabPane tab="Files" key="2">
              <FileTable applicationId={this.props.applicationId} user={this.props.user}/> 
            </TabPane>
            <TabPane tab="Queries" key="3">
              <QueryTable applicationId={this.props.applicationId} user={this.props.user}/>
            </TabPane>
          </Tabs>
        </div>   
      </React.Fragment>  
    )
  }
}

function mapStateToProps(state) {
  const { user } = state.authenticationReducer;
  const { application, selectedTopNav } = state.applicationReducer;
  const { applicationId, dataflowId, workflowId, instanceId, workflowDetails } = state.dataflowInstancesReducer;
  console.log('dataflowId redux: '+dataflowId+', '+JSON.stringify(workflowId)+', '+instanceId)
  return {
      user,
      application,
      selectedTopNav,
      applicationId, dataflowId, workflowId, instanceId, workflowDetails
  };
}

const connectedDataflowInstances = connect(mapStateToProps)(withRouter(DataflowInstanceDetails));
export { connectedDataflowInstances as DataflowInstanceDetails };
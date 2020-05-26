import React, { Component } from "react";
import { Button, Table, Divider, message,  Icon, Tooltip, Row, Col } from 'antd/lib';
import {Graph} from "./Dataflow/Graph";
import BreadCrumbs from "../common/BreadCrumbs";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js"
import {handleFileDelete, handleJobDelete, handleIndexDelete, handleQueryDelete, updateGraph} from "../common/WorkflowUtil";
import { Constants } from '../common/Constants';

class DataflowInstances extends Component {

  constructor(props) {
    super(props);
  }

  state = {
    applicationId: this.props.application ? this.props.application.applicationId : '',
    applicationTitle: this.props.application ? this.props.application.applicationTitle : '',
    dataflowId: {},
    workflows: [],
    workflowDetails: [],
    workflowDetailsVisible: false
  }

  componentWillReceiveProps(props) {
    if(props.application) {
      if(this.state.applicationId != props.application.applicationId) {
        this.setState({
          applicationId: props.application.applicationId,
          applicationTitle: props.application.applicationTitle
        }, function() {
          this.handleRefresh();
        });
      }
    }
  }

  componentDidMount() {
    this.fetchWorkflows();
  }

  fetchWorkflows = () => {
    fetch("/api/workflows?application_id="+this.state.applicationId, {
       headers: authHeader()
    })
    .then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
    })
    .then(data => {
      console.log(data);
      this.setState({
        workflows : data
      })

    }).catch(error => {
      console.log(error);
    });
  }

  handleViewDetails = (id, dataflowId, instanceId) => {
    console.log("handleViewDetails: "+id)
    this.showWorkflowDetails(id, dataflowId, instanceId);
  }

  showWorkflowDetails = (id, dataflowId, instanceId) => {
    this.getWorkflowDetails(id, instanceId).then((data) => {
      this.setState({
        workflowDetailsVisible: true,
        dataflowId: {"id": dataflowId},
        workflowDetails: data
      });
    })
  };

  closeWorkflowDetails = () => {
    console.log("closeWorkflowDetails");
    this.setState({
      workflowDetailsVisible: false,
    });
  };

  getWorkflowDetails = (id, instanceId) => {
    return new Promise((resolve, reject) => {
      fetch("/api/workflows/details?application_id="+this.state.applicationId+"&workflow_id="+id+"&instance_id="+instanceId, {
         headers: authHeader()
      })
      .then((response) => {
          if(response.ok) {
            resolve(response.json());
          }
      }).catch(error => {
        console.log(error);
        reject(error);
      });
    });

  }

  render() {
    if(!this.props.application || !this.props.application.applicationId)
      return null;
      const workflowTblColumns = [{
        title: 'Created',
        dataIndex: 'createdAt',
        width: '30%',
        render: (text, record) => {
          let createdAt = new Date(text);
          return createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ createdAt.toLocaleTimeString('en-US') 
        }
      },
      {
        title: 'Name',
        dataIndex: 'name',
        width: '30%',
        render: (text, record) => <a href='#' onClick={(row) => this.handleViewDetails(record.id, record.dataflowId, record.instance_id)}>{text}</a>
      },
      {
        title: 'Instance',
        dataIndex: 'instance_id',
        width: '30%'
      },      
      {
        width: '30%',
        title: 'Action',
        dataJob: '',
        render: (text, record) =>
          <span>
            <a href="#" onClick={(row) => this.handleViewDetails(record.id, record.dataflowId, record.instance_id)}><Tooltip placement="right" title={"View Details"}><Icon type="eye" theme="filled" /></Tooltip></a>
          </span>
      }];
    return (
        <div>
            <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle}/>
            <div>
            <Table
              columns={workflowTblColumns}
              rowKey={record => record.instance_id}
              dataSource={this.state.workflows}
              pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
            />
            </div>
            {this.state.workflowDetailsVisible ?
            <div className="workflow-details" style={{height:"750px"}}>
              <p><span id="close" onClick={this.closeWorkflowDetails}><Icon type="close-circle" theme="filled" /></span></p>
              <Graph applicationId={this.state.applicationId} viewMode={true} selectedDataflow={this.state.dataflowId} workflowDetails={this.state.workflowDetails}/>
            </div>
            : null }
        </div>
  )
  }
}

function mapStateToProps(state) {
  const { user } = state.authenticationReducer;
  const { application, selectedTopNav } = state.applicationReducer;
  return {
      user,
      application,
      selectedTopNav
  };
}

const connectedWorkflows = connect(mapStateToProps)(DataflowInstances);
export { connectedWorkflows as DataflowInstances };

//export default FileList;
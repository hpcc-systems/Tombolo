import React, { Component } from "react";
import { Button, Table, Divider, message,  Icon, Tooltip, Row, Col } from 'antd/lib';
import { withRouter } from 'react-router-dom';
import BreadCrumbs from "../../common/BreadCrumbs";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import {DataflowInstanceDetails} from "./DataflowInstanceDetails"
import { dataflowAction } from '../../../redux/actions/Dataflow';
import { dataflowInstancesAction } from '../../../redux/actions/DataflowInstances';
import { Constants } from '../../common/Constants';
import showdown from "showdown";
import ReactMarkdown from 'react-markdown';

class DataflowInstances extends Component {

  constructor(props) {
    super(props);
  }

  state = {
    applicationId: this.props.application ? this.props.application.applicationId : '',
    applicationTitle: this.props.application ? this.props.application.applicationTitle : '',
    dataflowId: {},
    workflowId:'',
    workflows: [],
    workflowDetails: [],
    workflowDetailsVisible: false,
    instanceId:'',
    dataflows: []
  }

  componentWillReceiveProps(props) {
    if(props.application) {
      if(this.state.applicationId != props.application.applicationId) {
        this.setState({
          applicationId: props.application.applicationId,
          applicationTitle: props.application.applicationTitle
        }, function() {
          this.fetchWorkflows();
        });
      }
    }
  }

  componentDidMount() {
    //this.fetchWorkflows();
    this.fetchDataflows();
  }

  fetchWorkflows = () => {
    if(this.state.applicationId) {
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
  }

  fetchDataflows = () => {
    let _self=this;
    if(this.state.applicationId) {
      fetch('/api/dataflow?application_id='+this.state.applicationId, {
        headers: authHeader()
      }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      }).then(function(data) {
        _self.setState({
          dataflows: data
        })
      }).catch(error => {
        console.log(error);
      });
    }
  };

  handleViewDetails = (record) => {
    //this.showWorkflowDetails(id, dataflowId, instanceId);
    this.props.dispatch(dataflowAction.dataflowSelected(
      this.state.applicationId,
      this.props.application.applicationTitle,
      record.id,
      this.props.user
    ));
    this.props.history.push('/'+this.state.applicationId+'/dataflowinstances/dataflowInstanceDetails');

  }

  showWorkflowDetails = (id, dataflowId, instanceId) => {
    this.getWorkflowDetails(id, instanceId).then((data) => {
      this.setState({
        workflowDetails: data,
        workflowId: id,
        dataflowId: {"id": dataflowId},
        instanceId: instanceId
      }, () => {
        this.props.dispatch(dataflowInstancesAction.dataflowInstanceSelected(
          this.state.applicationId,
          this.state.workflowId,
          this.state.dataflowId,
          this.state.instanceId,
          this.state.workflowDetails
        ));
        this.props.history.push('/'+this.state.applicationId+'/dataflowinstances/dataflowInstanceDetails');
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
      const dataflowCols = [{
        title: 'Name',
        dataIndex: 'title',
        width: '30%',
        render: (text, record) => <a href='#' onClick={(row) => this.handleViewDetails(record)}>{text}</a>
      },
      {
        title: 'Description',
        dataIndex: 'description',
        className: 'overflow-hidden',
        ellipsis: true,
        width: '30%',
        // render: (text, record) => <ReactMarkdown children={text} />
        render: (text, record) =>  <span className="description-text"><ReactMarkdown children={text} /></span>

      },
      {
        title: 'Created',
        dataIndex: 'createdAt',
        width: '30%',
        render: (text, record) => {
          let createdAt = new Date(text);
          return createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ createdAt.toLocaleTimeString('en-US')
        }
      }
      ];
    return (
      <div>
        <div className="d-flex justify-content-end">
          <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle}/>
        </div>
        <div>
           <Table
              columns={dataflowCols}
              rowKey={record => record.id}
              dataSource={this.state.dataflows}
              pagination={this.state.dataflows > 10 ? {pageSize: 10}: false}
              scroll={{ y: 380 }}
           />
        </div>
        {this.state.workflowDetailsVisible ?
          <DataflowInstanceDetails
            applicationId={this.state.applicationId}
            selectedDataflow={this.state.dataflowId}
            selectedWorkflow={this.state.workflowId}
            workflowDetails={this.state.workflowDetails}
            instanceId={this.state.instanceId}
          />
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

const connectedWorkflows = connect(mapStateToProps)(withRouter(DataflowInstances));
export { connectedWorkflows as DataflowInstances };

//export default FileList;
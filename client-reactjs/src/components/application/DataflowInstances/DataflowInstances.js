import React, { Component } from "react";
import { Button, Table, Divider, message,  Icon, Tooltip, Row, Col } from 'antd/lib';
import { withRouter } from 'react-router-dom';
import BreadCrumbs from "../../common/BreadCrumbs";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import {DataflowInstanceDetails} from "./DataflowInstanceDetails"
import { dataflowInstancesAction } from '../../../redux/actions/DataflowInstances';
import { Constants } from '../../common/Constants';

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
    instanceId:''
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
    this.fetchWorkflows();
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

  handleViewDetails = (id, dataflowId, instanceId) => {
    this.showWorkflowDetails(id, dataflowId, instanceId);  
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
        this.props.history.push('/'+this.state.applicationId+'/dataflowInstanceDetails');
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
      const workflowTblColumns = [
      {
        title: 'Dataflow Name',
        dataIndex: 'name',
        width: '30%',
        render: (text, record) => <a href='#' onClick={(row) => this.handleViewDetails(record.id, record.dataflowId, record.instance_id)}>{text}</a>
      },  
      {
        title: 'Instance',
        dataIndex: 'instance_id',
        width: '15%'
      },  
      {
        title: 'Start Time',
        dataIndex: 'start',
        width: '20%',
        render: (text, record) => {
          let start = new Date(text);
          return start.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ start.toLocaleTimeString('en-US') 
        }
      },  
      {
        title: 'End Time',
        dataIndex: 'end',
        width: '20%',
        render: (text, record) => {
          let end = new Date(text);
          return end.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ end.toLocaleTimeString('en-US') 
        }
      },       
      {
        title: 'Status',
        dataIndex: 'status',
        width: '15%'
      },    
      {
        width: '10%',
        title: 'Action',
        dataJob: '',
        render: (text, record) =>
          <span>
            <a href="#" onClick={(row) => this.handleViewDetails(record.id, record.dataflowId, record.instance_id)}><Tooltip placement="right" title={"View Details"}>Details</Tooltip></a>
          </span>
      }];
    return (
        <div>
            <div className="d-flex justify-content-end" style={{paddingTop: "60px"}}>
              <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle}/>
            </div>  
            <div>
              <Table
                columns={workflowTblColumns}
                rowKey={record => record.instance_id}
                dataSource={this.state.workflows}
                pagination={{ pageSize: 50 }} scroll={{ y: 460 }}
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
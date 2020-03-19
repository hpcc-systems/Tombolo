import React, { Component } from "react";
import { Button, Table, Divider, message,  Icon, Tooltip, Row, Col } from 'antd/lib';
import {Graph} from "./Graph";
import BreadCrumbs from "../common/BreadCrumbs";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js"
import {handleFileDelete, handleJobDelete, handleIndexDelete, handleQueryDelete, updateGraph} from "../common/WorkflowUtil";

class Workflows extends Component {

  constructor(props) {
    super(props);
  }

  state = {
    applicationId: this.props.application ? this.props.application.applicationId : '',
    applicationTitle: this.props.application ? this.props.application.applicationTitle : '',
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

  handleViewDetails = (id) => {
    console.log("handleViewDetails: "+id)
    this.showWorkflowDetails(id);
  }

  showWorkflowDetails = (id) => {
    this.getWorkflowDetails(id).then((data) => {
      this.setState({
        workflowDetailsVisible: true,
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

  getWorkflowDetails = (id) => {
    return new Promise((resolve, reject) => {
      fetch("/api/workflows/details?application_id="+this.state.applicationId+"&workflow_id="+id, {
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
        title: 'Name',
        dataIndex: 'name',
        width: '30%',
      },
      {
        title: 'Description',
        dataIndex: 'description',
        width: '30%',
      },
      {
        title: 'Status',
        dataIndex: 'status',
        width: '30%',
      },
      {
        width: '30%',
        title: 'Action',
        dataJob: '',
        render: (text, record) =>
          <span>
            <a href="#" onClick={(row) => this.handleViewDetails(record.id)}><Tooltip placement="right" title={"View Details"}><Icon type="eye" theme="filled" /></Tooltip></a>
          </span>
      }];
    return (
        <div style={{paddingTop:"55px", margin: "5px"}}>
            <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle}/>
            <Table
              columns={workflowTblColumns}
              rowKey={record => record.id}
              dataSource={this.state.workflows}
              pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
            />
            {this.state.workflowDetailsVisible ?
            <div className="workflow-details">
              <p><span id="close" onClick={this.closeWorkflowDetails}><Icon type="close-circle" theme="filled" /></span></p>
              <Row gutter={24}>
                <Col span={10}>
                  <Graph applicationId={this.state.applicationId} viewMode={true} workflowDetails={this.state.workflowDetails}/>
                </Col>
              </Row>
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

const connectedWorkflows = connect(mapStateToProps)(Workflows);
export { connectedWorkflows as Workflows };

//export default FileList;
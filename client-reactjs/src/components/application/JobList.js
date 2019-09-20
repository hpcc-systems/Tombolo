import React, { Component } from "react";
import { Button, Table, Divider, message, Popconfirm, Icon, Tooltip } from 'antd/lib';
import JobDetailsForm from "./JobDetails";
import BreadCrumbs from "../common/BreadCrumbs";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js"

class JobList extends Component {

  constructor(props) {
    super(props);
  }

  state = {
    applicationId: this.props.application ? this.props.application.applicationId : '',
    applicationTitle: this.props.application ? this.props.application.applicationTitle : '',
    openJobDetailsDialog: false,
    jobs:[],
    selectedJob: ''
  }

  componentWillReceiveProps(props) {
    if(props.application) {
      if(this.state.applicationId != props.application.applicationId) {
        this.setState({
          applicationId: props.application.applicationId
        });
        //this.handleRefresh();
      }
    }
  }

  componentDidMount() {
    this.fetchDataAndRenderTable();
  }

  openAddJobDlg = () => {
      console.log("open");
    var _self = this;
    this.setState({
      openJobDetailsDialog: true,
      selectedJob: ''
    });
    setTimeout(() => {
      _self.child.showModal();
    }, 200);
  }

  closeJobDlg = () => {
    this.setState({
      openJobDetailsDialog: false
    });
  }

  fetchDataAndRenderTable() {
    var _self=this;
    fetch("/api/job/job_list?app_id="+this.state.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      this.setState({
        jobs: data
      });
    }).catch(error => {
      console.log(error);
    });
    //this._setupListeners();
  }

  handleEdit(fileId) {
    this.setState({
      openJobDetailsDialog: true,
      selectedJob: fileId
    });
    //this.child.showModal();
  }

  handleDelete(jobId) {
    console.log(jobId);
    var data = JSON.stringify({jobId: jobId, application_id: this.state.applicationId});
    fetch("/api/job/delete", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(result => {
      this.fetchDataAndRenderTable();
      message.success("Job deleted sucessfully");
    }).catch(error => {
      console.log(error);
      message.error("There was an error deleting the Job file");
    });
  }


  handleRefresh = () => {
    this.fetchDataAndRenderTable();
  }


  render() {
    if(!this.props.application || !this.props.application.applicationId)
      return null;

      const jobColumns = [{
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
        width: '30%',
        title: 'Action',
        dataJob: '',
        render: (text, record) =>
          <span>
            <a href="#" onClick={(row) => this.handleEdit(record.id)}><Tooltip placement="right" title={"Edit Job"}><Icon type="edit" /></Tooltip></a>
            <Divider type="vertical" />
            <Popconfirm title="Are you sure you want to delete this job?" onConfirm={() => this.handleDelete(record.id)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
              <a href="#"><Tooltip placement="right" title={"Delete Job"}><Icon type="delete" /></Tooltip></a>
            </Popconfirm>
          </span>
      }];
    return (
      <div>
        <div className="d-flex justify-content-end" style={{paddingTop:"55px", margin: "5px"}}>
          <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle}/>
          <span style={{ marginLeft: "auto"}}>
            <Tooltip placement="bottom" title={"Click to add a new job"}>
              <Button className="btn btn-secondary btn-sm" onClick={() => this.openAddJobDlg()}><i className="fa fa-plus"></i>Add Job</Button>
            </Tooltip>
          </span>
        </div>
        <div style={{padding:"15px"}}>
          <Table
            columns={jobColumns}
            rowKey={record => record.id}
            dataSource={this.state.jobs}
            pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
          />

          {this.state.openJobDetailsDialog ?
            <JobDetailsForm
              onRef={ref => (this.child = ref)}
              applicationId={this.state.applicationId}
              selectedJob={this.state.selectedJob}
              isNewJob={this.state.selectedJob != '' ? false : true}
              onRefresh={this.handleRefresh}
              onClose={this.closeJobDlg}
              /> : null}
        </div>
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

const connectedJobList = connect(mapStateToProps)(JobList);
export { connectedJobList as JobList };

//export default FileList;
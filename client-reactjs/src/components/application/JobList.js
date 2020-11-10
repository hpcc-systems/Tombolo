import React, { Component } from "react";
import { Button, Table, Divider, message, Popconfirm, Icon, Tooltip, Radio } from 'antd/lib';
import FileDetailsForm from "./FileDetails";
import JobDetailsForm from "./JobDetails";
import QueryDetailsForm from "./QueryDetails";
import IndexDetailsForm from "./IndexDetails";
import AddDataflow from "./Dataflow/AddDataflow";
import DataflowTable from "./Dataflow/DataflowTable";
import {Graph} from "./Dataflow/Graph";
import BreadCrumbs from "../common/BreadCrumbs";
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js"
import {handleJobDelete} from "../common/WorkflowUtil";
import { Constants } from '../common/Constants';

class JobList extends Component {

  constructor(props) {
    super(props);
  }

  state = {
    applicationId: this.props.application ? this.props.application.applicationId : '',
    applicationTitle: this.props.application ? this.props.application.applicationTitle : '',
    openFileDetailsDialog: false,
    openJobDetailsDialog: false,
    openQueryDetailsDialog: false,
    openIndexDetailsDialog: false,
    selectedJob: "",
    isNew: true,
    jobs:[],
    assets:[],
    tableView: false,
    selectedDataflow:{}
  }

  /*componentWillReceiveProps(props) {
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
  }*/

  componentDidMount() {
    if(this.state.applicationId != '') {
      this.fetchDataAndRenderTable();      
    }
  }

  openAddJobDlg = () => {
    var _self = this;
    this.setState({
      openJobDetailsDialog: true,
      selectedJob: '',
      isNew: true
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
    //fetch("/api/app/read/assets?app_id="+this.state.applicationId, {
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
        assets: data
      });
    }).catch(error => {
      console.log(error);
    });
    //this._setupListeners();
  }

  handleEdit(id, objType) {
    let _self=this;
    let openJobDetailsDialog = true, selectedJob = id;
    this.setState({
      openJobDetailsDialog: openJobDetailsDialog,
      selectedJob: selectedJob,
      isNew: false
    });
    setTimeout(() => {
      _self.child.showModal();
    }, 200);
  }

  handleDelete(id, objType) {    
    console.log(id)
    this.handleJobDelete(id);
  }
    

  handleJobDelete(jobId) {
    handleJobDelete(jobId, this.state.applicationId)
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

  handleToggleView = (evt) => {
    evt.target.value == 'chart' ? this.setState({tableView: false}) : this.setState({tableView: true})
    this.handleRefresh();
  }

  onSelectDataflow = (selectedDataflow) => {
    console.log(selectedDataflow);
    this.setState({
      selectedDataflow: selectedDataflow
    });
  }

  render() {
    if(this.state.applicationId == undefined || this.state.applicationId == '') {
      return null;
    }
      const jobColumns = [{
        title: 'Name',
        dataIndex: 'name',
        width: '20%',
        render: (text, record) => <a href='#' onClick={(row) => this.handleEdit(record.id)}>{text}</a>
      },
      {
        title: 'Description',
        dataIndex: 'description',
        width: '20%',
      },
      {
        title: 'Type',
        dataIndex: 'jobType',
        width: '10%',
      },
      {
        width: '10%',
        title: 'Dataflow',
        render: (text, record) => {
          return (record.dataflow && record.dataflow.title != '') ? record.dataflow.title : '';
        }
      },          
      {
        width: '25%',
        title: 'Created',
        dataIndex: 'createdAt',
        render: (text, record) => {
          let createdAt = new Date(text);
          return createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ createdAt.toLocaleTimeString('en-US') 
        }
      },
      {
        width: '15%',
        title: 'Action',
        dataJob: '',
        render: (text, record) =>
          <span>
            <a href="#" onClick={(row) => this.handleEdit(record.id, record.objType)}><Tooltip placement="right" title={"Edit Job"}><Icon type="edit" /></Tooltip></a>
            <Divider type="vertical" />
            <Popconfirm title="Are you sure you want to delete this job?" onConfirm={() => this.handleDelete(record.id, record.objType)} icon={<Icon type="question-circle-o" style={{ color: 'red' }} />}>
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
        <div id="jobs">
            <Table
              columns={jobColumns}
              rowKey={record => record.id}
              dataSource={this.state.assets}
              pagination={{ pageSize: 10 }} 
              scroll={{ y: '70vh' }}
            />

          
          {this.state.openJobDetailsDialog ?
            <JobDetailsForm
              onRef={ref => (this.child = ref)}
              applicationId={this.state.applicationId}
              selectedAsset={this.state.selectedJob}
              isNew={this.state.isNew}
              onRefresh={this.handleRefresh}
              onClose={this.closeJobDlg}
              user={this.props.user}/> : null}
          
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
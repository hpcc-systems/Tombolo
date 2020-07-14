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
import {handleFileDelete, handleJobDelete, handleIndexDelete, handleQueryDelete, updateGraph} from "../common/WorkflowUtil";

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
    selectedFile: '',
    selectedQuery: '',
    selectedIndex: '',
    jobs:[],
    assets:[],
    selectedJob: '',
    tableView: false,
    selectedDataflow:{}
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
    //this.fetchDataAndRenderTable();
  }

  openAddJobDlg = () => {
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

  handleClose = () => {
    this.setState({
      openFileDetailsDialog: false
    });  }

  closeQueryDlg = () => {
    this.setState({
      openQueryDetailsDialog: false
    });
  }

  closeIndexDlg = () => {
    this.setState({
      openIndexDetailsDialog: false
    });
  }

  fetchDataAndRenderTable() {
    var _self=this;
    //fetch("/api/job/job_list?app_id="+this.state.applicationId, {
    fetch("/api/app/read/assets?app_id="+this.state.applicationId, {
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
    let openFileDetailsDialog = false,
        openJobDetailsDialog = false,
        openQueryDetailsDialog = false,
        openIndexDetailsDialog = false;
    let selectedFile='', selectedJob='', selectedQuery='', selectedIndex='';
    switch (objType) {
      case 'file':
        openFileDetailsDialog = true;
        selectedFile = id;
        break;
      case 'job':
        openJobDetailsDialog = true;
        selectedJob = id;
        break;
      case 'query':
        openQueryDetailsDialog = true;
        selectedQuery = id
        break;
      case 'index':
        openIndexDetailsDialog = true;
        selectedIndex = id;
        break;
    }
    this.setState({
      openFileDetailsDialog: openFileDetailsDialog,
      openJobDetailsDialog: openJobDetailsDialog,
      openQueryDetailsDialog: openQueryDetailsDialog,
      openIndexDetailsDialog: openIndexDetailsDialog,
      selectedFile: selectedFile,
      selectedJob: selectedJob,
      selectedQuery: selectedQuery,
      selectedIndex: selectedIndex
    });
    //this.child.showModal();
  }
  handleDelete(id, objType) {
    switch (objType) {
      case 'file':
        this.handleFileDelete(id);
        break;
      case 'index':
        this.handleIndexDelete(id);
        break;
      case 'query':
        this.handleQueryDelete(id);
        break;
      case 'job':
        this.handleJobDelete(id);
        break;
    }
    updateGraph(id, this.state.applicationId);
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

  handleIndexDelete(indexId) {
    handleIndexDelete(indexId, this.state.applicationId)
    .then(result => {
      this.fetchDataAndRenderTable();
      message.success("Index deleted sucessfully");
    }).catch(error => {
      console.log(error);
      message.error("There was an error deleting the Index file");
    });
  }

  handleQueryDelete(queryId) {
    handleQueryDelete(queryId, this.state.applicationId)
    .then(result => {
      this.fetchDataAndRenderTable();
      message.success("Query deleted sucessfully");
    }).catch(error => {
      console.log(error);
      message.error("There was an error deleting the Query");
    });
  }

  handleFileDelete= (fileId) => {
    handleFileDelete(fileId, this.state.applicationId)
    .then(result => {
      this.fetchDataAndRenderTable();
      message.success("File deleted sucessfully");
    }).catch(error => {
      console.log(error);
      message.error("There was an error deleting the file");
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
        title: 'Type',
        dataIndex: 'objType',
        width: '30%',
      },
      {
        width: '30%',
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
            <Radio.Group defaultValue="chart" buttonStyle="solid" style={{padding: "10px"}} onChange={this.handleToggleView}>
              <Tooltip placement="bottom" title={"Tree View"}><Radio.Button value="chart"><Icon type="cluster" /></Radio.Button></Tooltip>
              <Tooltip placement="bottom" title={"Tabular View"}><Radio.Button value="grid"><Icon type="bars" /></Radio.Button></Tooltip>
            </Radio.Group>
            {<AddDataflow applicationId={this.state.applicationId} />}
          </span>
        </div>
        <div id="jobs">
          {this.state.tableView ?
            <Table
              columns={jobColumns}
              rowKey={record => record.id}
              dataSource={this.state.assets}
              pagination={{ pageSize: 10 }} scroll={{ y: 460 }}
            />
          : <Graph applicationId={this.state.applicationId} selectedDataflow={this.state.selectedDataflow} graphContainer="graph" sidebarContainer="sidebar"/>
          }

          {this.state.openFileDetailsDialog ?
            <FileDetailsForm
              onRef={ref => (this.fileDlg = ref)}
              isNewFile={false}
              selectedFile={this.state.selectedFile}
              applicationId={this.state.applicationId}
              onClose={this.handleClose}
              onRefresh={this.handleRefresh}
              user={this.props.user}/> : null}

          {this.state.openJobDetailsDialog ?
                <JobDetailsForm
                  onRef={ref => (this.jobDlg = ref)}
                  applicationId={this.state.applicationId}
                  selectedJob={this.state.selectedJob}
                  isNewJob={false}
                  onRefresh={this.handleRefresh}
                  onClose={this.closeJobDlg}
                  user={this.props.user}/> : null}

          {this.state.openIndexDetailsDialog ?
              <IndexDetailsForm
                onRef={ref => (this.idxDlg = ref)}
                applicationId={this.state.applicationId}
                isNewIndex={false}
                onRefresh={this.handleRefresh}
                selectedIndex={this.state.selectedIndex}
                onClose={this.closeIndexDlg}
                user={this.props.user}/> : null}

          {this.state.openQueryDetailsDialog ?
                <QueryDetailsForm
                  onRef={ref => (this.qryDlg = ref)}
                  applicationId={this.state.applicationId}
                  isNewFile={false}
                  selectedQuery={this.state.selectedQuery}
                  onRefresh={this.handleRefresh}
                  onClose={this.closeQueryDlg}/> : null}
        </div>

        <div id="dataflow-list">
          <DataflowTable applicationId={this.state.applicationId} onSelectDataflow={this.onSelectDataflow}/>
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
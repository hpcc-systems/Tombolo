import { Table,Row, Col} from 'antd/lib';
import React, { Component } from "react";
import { authHeader, handleError } from "../common/AuthHeader.js"

class JobReport extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    jobList:this.props.jobList,
    openJobDetails:false,
    jobFields:[],
    selectedJobTitle:""
  }

  componentDidMount() {    
    
  }

  componentWillReceiveProps(props) {
    this.setState({
        jobList: props.jobList
      });
      if(props.refresh){
        this.setState({
          openJobDetails:false
          });
      }
  }

  jobSelect = (id,title) => {
    this.setState({
      selectedJobTitle:title,
      openJobDetails: true
      });
      this.getJobDetails(id);
  }
  getJobDetails(id) {
      fetch("/api/report/read/jobParams?job_id="+id, {
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
            jobFields: data.jobparams,
            openJobDetails:true
          });
        })
      .catch(error => {
        console.log(error);
      });
  }
  render() {
    const jobColumns = [{
      title: 'Title',
      dataIndex: 'name',
      width: '20%',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.jobSelect(record.id,record.name)}>{text}</a>
        </span>
    },    
    {
      width: '20%',
      title: 'Application',
      dataIndex: 'application.title'
    },
    {
        width: '20%',
        title: 'author',
        dataIndex: 'author'
      },
      {
        width: '20%',
        title: 'Description',
        dataIndex: 'description'
      },
    {
        width: '20%',
        title: 'EntryBWR',
        dataIndex: 'entryBWR'
      },
    {
      width: '20%',
      title: 'gitRepo',
      dataIndex: 'gitRepo'
    },
    {
        width: '10%',
        title: 'Type',
        dataIndex: 'jobType'
    }];

   
    let table = null;    
      table = <Table 
      columns={jobColumns}
      rowKey={record => record.id}
      dataSource={this.state.jobList}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1000 }}
      size="middle"
    />
    const jobParamColumn = [
    {
      width: '20%',
      title: 'Name',
      dataIndex: 'name'
    },
    {
        width: '20%',
        title: 'Type',
        dataIndex: 'type'
      }];
      let jobParamTable = null;    
      jobParamTable = <Table 
      columns={jobParamColumn}
      rowKey={record => record.id}
      dataSource={this.state.jobFields}
      pagination={{ pageSize: 10 }}
      size="middle"
    />
    const title="Job ("+this.state.selectedJobTitle+") - Fields"
    return (
      <div>        
        {table}   
         
        {this.state.openJobDetails ?
        <div><h6>{title}</h6>         
          {jobParamTable}
         </div>:null}
      </div>
    )
  }
}
export default JobReport;
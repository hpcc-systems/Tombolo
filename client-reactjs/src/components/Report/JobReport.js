import { Table,Row, Col,Spin} from 'antd/lib';
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
    selectedJobTitle:"",
    selectedJobId:"",
    initialDataLoading: false
  }

  componentDidMount() {    
    if(this.props.jobList && this.props.jobList.length>0)
        this.getJobDetails(this.props.jobList[0]); 
      else{   
      this.setState({
        openJobDetails:false
        }); 
      }
  }

  componentWillReceiveProps(props) {
    this.setState({
        jobList: props.jobList
      });
      if(props.jobList && props.jobList.length>0)
        this.getJobDetails(props.jobList[0]); 
      else{   
      this.setState({
        openJobDetails:false
        }); 
      }
  }

  jobSelect = (id,title) => {
    
      this.getJobDetails(id);
  }
  getJobDetails(record) {
    this.setState({
      selectedJobTitle:record.name,
      selectedJobId:record.id,
      openJobDetails: true,
      initialDataLoading: true
      });
      fetch("/api/report/read/jobParams?job_id="+record.id, {
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
          setTimeout(() => {
            this.setState({
              initialDataLoading: false
            });
          }, 200);  
        })
      .catch(error => {
        console.log(error);
      });
  }
  onClickRow = (record) => {     
    this.getJobDetails(record);
  }
  setRowClassName = (record) => {
    return record.id === this.state.selectedJobId ? 'clickRowStyl' : '';
  }
  render() {
    const jobColumns = [{
      title: 'Title',
      dataIndex: 'name',
      width: '20%'
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
      onRowClick={this.onClickRow} 
      rowClassName={this.setRowClassName}
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
         <Spin spinning={this.state.initialDataLoading} size="large" >           
          {jobParamTable}
          </Spin>
         </div>:null}
      </div>
    )
  }
}
export default JobReport;
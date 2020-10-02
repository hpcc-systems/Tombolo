import { Spin} from 'antd/lib';
import React, { Component } from "react";
import { authHeader, handleError } from "../common/AuthHeader.js"
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';


class JobReport extends Component {
  

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
      openJobDetails: false,
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
            openJobDetails:false
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
  // onClickRow = (record) => {
  //   this.getJobDetails(record);
  // }
  setRowClassName = (record) => {
    return record.id === this.state.selectedJobId ? 'clickRowStyl' : '';
  }
  onJobsGridReady = (params) => {
    this.jobGridApi = params.api;
    this.jobGridApi.sizeColumnsToFit();
  }
  onJobParamGridReady = (params) => {
    this.indexkeyGridApi = params.api;
    this.indexkeyGridApi.sizeColumnsToFit();
  }
  onClickRow() {
    var selectedRows = this.jobGridApi.getSelectedRows();
    this.getJobDetails(selectedRows[0]);
  }
  render() {
    const jobColumns = [{
      headerName: 'Title',
      field: 'name'
    },
    {
      headerName: 'Application',
      field: 'application.title'
    },
    {
      headerName: 'author',
      field: 'author'
      },
      {
        headerName: 'Description',
        field: 'description'
      },
    {
      headerName: 'EntryBWR',
      field: 'entryBWR'
      },
    {
      headerName: 'gitRepo',
      field: 'gitRepo'
    },
    {
      headerName: 'Type',
      field: 'jobType'
    }];

    let table = null;
    table = <div className="ag-theme-balham" style={{height: '415px',width: '100%' }}>
      <AgGridReact
        columnDefs={jobColumns}
        rowData={this.state.jobList}
        onGridReady={this.onJobsGridReady}
        rowSelection="single"
        onSelectionChanged={this.onClickRow.bind(this)}
        defaultColDef={{resizable: true, sortable: true}}
        suppressFieldDotNotation={true} >

      </AgGridReact>
    </div>
    
    const jobParamColumn = [
    {
      headerName: 'Name',
      field: 'name'
    },
    {
      headerName: 'Type',
      field: 'type'
      }];
      let jobParamTable = null;
      jobParamTable = <div className="ag-theme-balham" style={{height: '415px',width: '100%' }}>
      <AgGridReact
        columnDefs={jobParamColumn}
        rowData={this.state.jobFields}
        onGridReady={this.onJobParamGridReady}
        defaultColDef={{resizable: true, sortable: true}}
        suppressFieldDotNotation={true} >

      </AgGridReact>
    </div>
      
    const title="Job ("+this.state.selectedJobTitle+") - Fields"
    return (
      <div style={{"paddingLeft":"5px"}}>
        {table}

        {this.state.openJobDetails ?
        <Spin spinning={this.state.initialDataLoading} size="large" >
        <div><h6></h6><h6>{title}</h6>              
          {jobParamTable}  
         </div></Spin>:null}
      </div>
    )
  }
}
export default JobReport;
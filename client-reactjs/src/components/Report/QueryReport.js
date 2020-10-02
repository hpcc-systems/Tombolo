import { Spin} from 'antd/lib';
import React, { Component } from "react";
import { authHeader, handleError } from "../common/AuthHeader.js"
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';


class QueryReport extends Component {


  state = {
    queryList:this.props.queryList,
    openQueryDetails:false,
    queryFields:[],
    selectedQueryTitle:"",
    selectedQueryId:"",
    initialDataLoading: false
  }

  componentDidMount() {
    if(this.props.queryList && this.props.queryList.length>0)
        this.getQueryDetails(this.props.queryList[0]);
      else{
      this.setState({
        openQueryDetails:false
        });
      }
  }

  componentWillReceiveProps(props) {
    this.setState({
        queryList: props.queryList
      });
      if(props.queryList && props.queryList.length>0)
        this.getQueryDetails(props.queryList[0]);
      else{
      this.setState({
        openQueryDetails:false
        });
      }
  }

  querySelect = (id,title) => {
    this.setState({
      selectedQueryTitle:title,
      openQueryDetails: false
      });
      this.getQueryDetails(id);
  }
  getQueryDetails(record) {
    this.setState({
      selectedQueryTitle:record.title,
      selectedQueryId:record.id,
      openQueryDetails: false,
      initialDataLoading: true
      });
      fetch("/api/report/read/query_Fields?query_id="+record.id, {
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
            queryFields: data.query_fields,
            openQueryDetails:false
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
  //   this.getQueryDetails(record);
  // }
  onQueryGridReady = (params) => {
    this.queryGridApi = params.api;
    this.queryGridApi.sizeColumnsToFit();
  }
  onQueryFieldGridReady = (params) => {
    this.queryFieldGridApi = params.api;
    this.queryFieldGridApi.sizeColumnsToFit();
  }
  onClickRow() {
    var selectedRows = this.queryGridApi.getSelectedRows();
    this.getQueryDetails(selectedRows[0]);
  }
  setRowClassName = (record) => {
    return record.id === this.state.selectedQueryId ? 'clickRowStyl' : '';
  }
  render() {
    const queryColumns = [{
      headerName: 'Title',
      field: 'title'      
    },
    {
      headerName: 'Application',
      field: 'application.title'      
    },
    {
      headerName: 'Description',
      field: 'description'
    },
    {
        headerName: 'gitRepo',
      field: 'gitRepo'
    },
    {
      headerName: 'Backup Service',
      field: 'backupService'
    },
    {
      headerName: 'Primary Service',
      field: 'primaryService'
    },
    {
      headerName: 'Type',
      field: 'type'
    }];
    let table = null;
    table = <div className="ag-theme-balham" style={{height: '415px',width: '100%' }}>
      <AgGridReact
        columnDefs={queryColumns}
        rowData={this.state.queryList}
        onGridReady={this.onQueryGridReady}
        rowSelection="single"
        onSelectionChanged={this.onClickRow.bind(this)}
        defaultColDef={{resizable: true, sortable: true}}
        suppressFieldDotNotation={true} >

      </AgGridReact>
    </div>

    const queryFieldsColumn = [{
      headerName: 'Field Type',
      field: 'field_type'
    },
    {
      headerName: 'Name',
      field: 'field'
    },
    {
      headerName: 'Type',
      field: 'type'
    }];

    let queryFieldTable = null;
    queryFieldTable = <div className="ag-theme-balham" style={{height: '415px',width: '100%' }}>
      <AgGridReact
        columnDefs={queryFieldsColumn}
        rowData={this.state.queryFields}
        onGridReady={this.onQueryFieldGridReady}
        defaultColDef={{resizable: true, sortable: true}}
        suppressFieldDotNotation={true} >

      </AgGridReact>
    </div>

      
    const title="Query ("+this.state.selectedQueryTitle+") - Fields"
    return (
      <div style={{"paddingLeft":"5px"}}>
        {table}

        {this.state.openQueryDetails ?
        <div>
        <Spin spinning={this.state.initialDataLoading} size="large" >
       <h6></h6>
       <h6>{title}</h6>
          {queryFieldTable}
          </Spin>
         </div>:null}
      </div>
    )
  }
}
export default QueryReport;
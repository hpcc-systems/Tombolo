import { Table,Row, Col,Spin} from 'antd/lib';
import React, { Component } from "react";
import { authHeader, handleError } from "../common/AuthHeader.js"
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';

class IndexReport extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    indexList:this.props.indexList,
    openIndexDetails:false,
    indexKey:[],
    indexPayload:[],
    selectedIndexTitle:"",
    selectedIndexId:"",
    initialDataLoading: false
  }

  componentDidMount() {
    if(this.props.indexList && this.props.indexList.length>0)
        this.getIndexDetails(this.props.indexList[0]);
      else{
      this.setState({
        openIndexDetails:false
        });
      }
  }

  componentWillReceiveProps(props) {
    this.setState({
        indexList: props.indexList
      });
      if(props.indexList && props.indexList.length>0)
        this.getIndexDetails(props.indexList[0]);
      else{
      this.setState({
        openIndexDetails:false
        });
      }
  }

  getIndexDetails(record) {
    this.setState({
      selectedIndexId:record.id,
      selectedIndexTitle:record.title,
      openIndexDetails: true,
      initialDataLoading: true
      });
      fetch("/api/report/read/indexKeyPayload?index_id="+record.id, {
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
            indexKey: data.basic.index_keys,
            indexPayload: data.basic.index_payloads,
            openIndexDetails:true
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
  //   this.getIndexDetails(record);
  // }
  setRowClassName = (record) => {
    return record.id === this.state.selectedIndexId ? 'clickRowStyl' : '';
  }
  onFilesGridReady = (params) => {
    this.indexGridApi = params.api;
    this.indexGridApi.sizeColumnsToFit();
  }
  onIndexKeyGridReady = (params) => {
    this.indexkeyGridApi = params.api;
    this.indexkeyGridApi.sizeColumnsToFit();
  }
  onIndexPayloadGridReady = (params) => {
    this.indexPayloadGridApi = params.api;
    this.indexPayloadGridApi.sizeColumnsToFit();
  }
  onClickRow() {
    var selectedRows = this.indexGridApi.getSelectedRows();
    this.getIndexDetails(selectedRows[0]);
  }
  render() {
    const indexColumns = [{
      headerName: 'Title',
      field: 'title'
    },
    {
      headerName: 'Application',
      field: 'application.title'
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
      headerName: 'Qualified Path',
      field: 'qualifiedPath'
    }];

    let table = null;
      table = <div className="ag-theme-balham" style={{height: '415px',width: '100%' }}>
        <AgGridReact
          columnDefs={indexColumns}
          rowData={this.state.indexList}
          onGridReady={this.onFilesGridReady}
          rowSelection="single"
          onSelectionChanged={this.onClickRow.bind(this)}
          defaultColDef={{resizable: true, sortable: true}}
          suppressFieldDotNotation={true} >

        </AgGridReact>
      </div>
    
    const indexKeyColumn = [{
      headerName: 'Name',
      field: 'ColumnLabel'
    },
    {
      headerName: 'Type',
      field: 'ColumnType'
    },
    {
      headerName: 'Ecl Type',
      field: 'ColumnEclType'
      }];
      let keyTable = null;
      keyTable = <div className="ag-theme-balham" style={{height: '300px',width: '100%' }}>
        <AgGridReact
          columnDefs={indexKeyColumn}
          rowData={this.state.indexKey}
          onGridReady={this.onIndexKeyGridReady}
          defaultColDef={{resizable: true, sortable: true}}
          suppressFieldDotNotation={true} >

        </AgGridReact>
      </div>
    const indexPayloadColumn = [{
      headerName: 'Name',
      field: 'ColumnLabel'
    },
    {
      headerName: 'Type',
      field: 'ColumnType'
    },
    {
      headerName: 'Ecl Type',
      field: 'ColumnEclType'
    }];
    let payloadTable = null;
    payloadTable = <div className="ag-theme-balham" style={{height: '300px',width: '100%' }}>
        <AgGridReact
          columnDefs={indexPayloadColumn}
          rowData={this.state.indexPayload}
          onGridReady={this.onIndexPayloadGridReady}
          defaultColDef={{resizable: true, sortable: true}}
          suppressFieldDotNotation={true} >

        </AgGridReact>
      </div>

    const title="Index ("+this.state.selectedIndexTitle+")"
    return (
      <div style={{"paddingLeft":"5px"}}>
        {table}

        {this.state.openIndexDetails ?
        <div><h6>{title}</h6>
        <div style={{"textAlign":"center"}}>
        <Spin spinning={this.state.initialDataLoading} size="large" />
        </div>
        <Row gutter={24}>
          <Col span={12}>
          <h6>Key</h6>
          {keyTable}
          </Col>
          <Col span={11}>
          <h6>Payload</h6>
          {payloadTable}
          </Col>
        </Row></div>:null}
      </div>
    )
  }
}
export default IndexReport;
import { Table,Spin,Tabs,Row, Col} from 'antd/lib';
import React, { Component } from "react";
import { authHeader, handleError } from "../common/AuthHeader.js";
import Plotly from 'plotly.js-basic-dist';
import createPlotlyComponent from 'react-plotly.js/factory';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
const Plot = createPlotlyComponent(Plotly);
const TabPane = Tabs.TabPane;

class FileReport extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    fileList:this.props.fileList,
    openFileLayout:false,
    selectedFileId:"",
    selectedFileTitle:"",
    fileLayout: [],
    initialDataLoading: false,
    nameList:[],
    pci:0,
    pii:0,
    nonPii:0,
    hipaa:0,
    others:0,
    barWidth:[],
    chartLabels:[],
    chartValues:[],
    showComplianceDetailsChart: false,
    layoutComplianceData: []
  }

  componentDidMount() {
  }

  componentWillReceiveProps(props) {
    this.setState({
      fileList: props.fileList,
    });
    if(props.fileList && props.fileList.length>0)
    {
      this.fetchFileLayoutAndChartDetails(props.fileList[0])
      //this.fetchDataAndRenderTable(props.fileList[0]);
    }
    else{
      this.setState({
        openFileLayout:false
      });
    }
  }

  fetchFileLayoutAndChartDetails(record){
    this.setState({
      selectedFileId:record.id,
      selectedFileTitle:(record.title)?record.title:record.name,
      openFileLayout: true,
      initialDataLoading: true,
      showComplianceDetailsChart: false
    });
    fetch("/api/report/read/fileLayoutAndComplianceChart?file_id="+record.id, {
      headers: authHeader()
    })
    .then((response) => {
    if(response.ok) {
      return response.json();
    }
    handleError(response);
  })
  .then(data => {
    var labels=[], values=[], pii=0, nonPii=0;


    for(var obj in data.chartData){
      labels.push(data.chartData[obj].compliance);
      values.push(data.chartData[obj].count)
      if(data.chartData[obj].compliance != 'others') {
        pii+=data.chartData[obj].count;
      } else {
        nonPii+=data.chartData[obj].count;
      }
    }
    window.scrollTo({ top: 400, behavior: 'smooth'})
    this.setState({
      fileLayout: data.fileLayout,
      chartLabels:labels,
      chartValues:values,
      pii: pii,
      nonPii: nonPii,
      layoutComplianceData: data.chartData
    });
    setTimeout(() => {
      this.setState({
        initialDataLoading: false
      });
    }, 200);
  }).catch(error => {
    console.log(error);
  });

  }

  showComplianceDetailsChart = (data) => {
    this.setState({
      showComplianceDetailsChart: true
    });
  }

  handleComplianceDetailsClick = (data) => {
    let filteredLayouts = this.state.layoutComplianceData.filter(function(layout) {
      return layout.compliance == data.points[0].label
    })

    this.setState({
      fileLayout: filteredLayouts[0].fileLayout
    });

  }
  // fetchDataAndRenderTable(record) {
  //   this.setState({
  //     selectedFileId:record.id,
  //     selectedFileTitle:(record.title)?record.title:record.name,
  //     openFileLayout: true,
  //     initialDataLoading: true
  //   });
  //   fetch("/api/report/read/fileLayout?file_id="+record.id, {
  //       headers: authHeader()
  //   })
  //   .then((response) => {
  //     if(response.ok) {
  //       return response.json();
  //     }
  //     handleError(response);
  //   })
  //   .then(data => {
  //     var name = [""];
  //     var pci=0, pii=0,hipaa=0, others=0;
  //     var width=[0];
  //     for (var obj in data) {
  //       name.push(data[obj].name);
  //       console.log('pci: '+data[obj].isPCI);
  //       if(data[obj].isPCI == "true") {
  //         pci++;
  //       }
  //       if(data[obj].isPII == "true") {
  //         pii++;
  //       }
  //       if(data[obj].isHIPAA == "true") {
  //         hipaa++;
  //       }
  //       if(data[obj].isPCI == "false" && data[obj].isPII == "false") {
  //         others++;
  //       }
  //       width.push(0.4);
  //     }
  //     window.scrollTo({ top: 400, behavior: 'smooth'})
  //     this.setState({
  //       fileLayout: data,
  //       // nameList:name,
  //       // pci:pci,
  //       // pii:pii,
  //       // hipaa:hipaa,
  //       // others:others,
  //       // barWidth:width
  //     });
  //     setTimeout(() => {
  //       this.setState({
  //         initialDataLoading: false
  //       });
  //     }, 200);
  //   }).catch(error => {
  //     console.log(error);
  //   });
  // }

  onClickRow() {
    var selectedRows = this.filesGridApi.getSelectedRows();
    this.fetchFileLayoutAndChartDetails(selectedRows[0]);
    //this.fetchDataAndRenderTable(record);
  }

  setRowClassName = (record) => {
    return record.id === this.state.selectedFileId ? 'clickRowStyl' : '';
  }

  onLicenseGridReady = (params) => {
    this.licenseGridApi = params.api;
    this.licenseGridApi.sizeColumnsToFit();
  }

  onFilesGridReady = (params) => {
    this.filesGridApi = params.api;
    this.filesGridApi.sizeColumnsToFit();
  }

  render() {
    const indexColumns = [{
      headerName: 'Title',
      field: 'title'
    },
    {
      headerName: 'Name',
      field: 'name'
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
      headerName: 'Type',
      field: 'fileType'
    },
    {
      headerName: 'Qualified Path',
      field: 'qualifiedPath'
    }];
    let table = null;
      table = <div className="ag-theme-balham" style={{height: '415px',width: '100%' }}>
        <AgGridReact
          columnDefs={indexColumns}
          rowData={this.state.fileList}
          onGridReady={this.onFilesGridReady}
          rowSelection="single"
          onSelectionChanged={this.onClickRow.bind(this)}
          defaultColDef={{resizable: true, sortable: true}}
          suppressFieldDotNotation={true} >

        </AgGridReact>
      </div>

    const layoutColumns = [{
      headerName: 'Name',
      field: 'name'
    },
    {
      headerName: 'Data Type',
      field: 'data_types'
    }
  ];

  const title="File ("+this.state.selectedFileTitle+") Layout"
    return (
      <div style={{"paddingLeft":"5px","backgroundColor":"#FFFFFF"}}>
        {table}
        {this.state.openFileLayout ? <div ref="divFileLayout">
          <Row gutter={24}>
          <Col span={10}>
          <div >
          <h6></h6>
          <h6>{title}</h6>
          </div>
          <Spin spinning={this.state.initialDataLoading} size="large" >
          <div
                className="ag-theme-balham"
                style={{
                height: '415px',
                width: '100%' }}
              >
            <AgGridReact
              columnDefs={layoutColumns}
              rowData={this.state.fileLayout}
              onGridReady={this.onLicenseGridReady}
              defaultColDef={{resizable: true, sortable: true}}>
            </AgGridReact>
          </div>

          {/*<Table
                className="rebortTable"
                columns={layoutColumns}
                rowKey={record => record.name}
                dataSource={this.state.fileLayout}
                pagination={{ pageSize: 10 }}
                size="middle"
                style={{paddingTop:"80px"}}
              />*/}
        </Spin>
          </Col>
          <Col span={6}>
          <Plot onClick={this.showComplianceDetailsChart}
            data={[
              {
                values:[this.state.pii, this.state.nonPii],
                labels: ["PII", "Non-PII"],
                type: 'pie',
              }
            ]}
            layout={ {width: 450, height: 500,title:'PII/Non-PII', plot_bgcolor: 'rgb(182, 215, 168)'

          } }
          />
          </Col>

          <Col span={6}>
          {this.state.showComplianceDetailsChart ?
          <Plot onClick={this.handleComplianceDetailsClick}
            data={[
              {
                values:this.state.chartValues,
                labels: this.state.chartLabels,
                type: 'pie',
              }
            ]}
            layout={ {width: 450, height: 500,title:'Compliance Details', plot_bgcolor: 'rgb(182, 215, 168)'
          } }
          /> : null}
          </Col>
      </Row>
      </div>:null}
      </div>

    )
  }
}
export default FileReport;
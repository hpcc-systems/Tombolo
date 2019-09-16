import { Table,Spin,Tabs,Row, Col} from 'antd/lib';
import React, { Component } from "react";
import { authHeader, handleError } from "../common/AuthHeader.js";
import Plotly from 'plotly.js-basic-dist';
import createPlotlyComponent from 'react-plotly.js/factory';
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
    isPCIList:[],
    isPIIList:[],
    barWidth:[]
  }

  componentDidMount() {        
  }

  componentWillReceiveProps(props) {
    this.setState({
      fileList: props.fileList
      });
      if(props.fileList && props.fileList.length>0)
        this.fetchDataAndRenderTable(props.fileList[0]); 
      else{   
      this.setState({
        openFileLayout:false
        });
      }  
  }
  
  fetchDataAndRenderTable(record) {
    this.setState({
      selectedFileId:record.id,
      selectedFileTitle:(record.title)?record.title:record.name,
      openFileLayout: true,
      initialDataLoading: true
    });
    fetch("/api/report/read/fileLayout?file_id="+record.id, {
        headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      var name = [""];
      var pci = [""];
      var pii=[""];
      var width=[0];
      for (var obj in data) {
        name.push(data[obj].name);
        pci.push(data[obj].isPCI);
        pii.push(data[obj].isPII);
        width.push(0.4);
      }  
      window.scrollTo({ top: 400, behavior: 'smooth'})       
      this.setState({
        fileLayout: data,
        nameList:name,
        isPCIList:pci,
        isPIIList:pii,
        barWidth:width
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

  onClickRow = (record) => {     
    this.fetchDataAndRenderTable(record);
  }
  setRowClassName = (record) => {
    return record.id === this.state.selectedFileId ? 'clickRowStyl' : '';
  }
 
  render() {  
    const indexColumns = [{
      title: 'Title',
      dataIndex: 'title',
      width: '20%'
    },
    {
      width: '20%',
      title: 'Name',
      dataIndex: 'name'
    },
    {
      width: '20%',
      title: 'Application',
      dataIndex: 'application.title'
    },
    {
      width: '20%',
      title: 'Description',
      dataIndex: 'description'
    },
    {
        width: '10%',
        title: 'Type',
        dataIndex: 'fileType'
    },
    {
        width: '15%',
        title: 'Qualified Path',
        dataIndex: 'qualifiedPath'
    }];
    let table = null;    
      table = <Table 
      className="rebortTable"
      columns={indexColumns}
      rowKey={record => record.id}
      dataSource={this.state.fileList}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 1000 }}
      size="middle"
      onRowClick={this.onClickRow} 
      rowClassName={this.setRowClassName}      
    />
    const layoutColumns = [{
      title: 'Name',
      dataIndex: 'name',
      width: '20%',
    },    
    {
      title: 'Format',
      dataIndex: 'format'
    },
    {
      title: 'PCI',
      dataIndex: 'isPCI'
    },
    {
      title: 'PII',
      dataIndex: 'isPII'
    }];

  const title="File ("+this.state.selectedFileTitle+") Layout"
    return (
      <div>        
        {table}     
        {this.state.openFileLayout ? <div ref="divFileLayout">    
      
      <Row gutter={24}>
          <Col span={10}>
          <div >
          <h6>{title}</h6>
          </div>
          <Spin spinning={this.state.initialDataLoading} size="large" >     
          <Table
                className="rebortTable"
                columns={layoutColumns}
                rowKey={record => record.name}
                dataSource={this.state.fileLayout}
                pagination={{ pageSize: 10 }} 
                size="middle"
                style={{paddingTop:"80px"}}
              />
        </Spin>
          </Col>
          <Col span={14}>
          <Plot
        data={[
          {
            x: this.state.nameList,
            y: this.state.isPCIList,
            width:this.state.barWidth,
            type: 'bar',
            marker: {color: 'blue'},
            name:"isPCI"
            
          },
          { x: this.state.nameList,
            y: this.state.isPIIList,
            width:this.state.barWidth,
            type: 'bar',
            marker: {color: 'red'},
            name:"isPII"
          },
        ]}
        layout={ {width: 450, height: 500,
        xaxis1: {
          "showline": true,
          side: 'bottom',
          title:"Fields Name"          
        },
        yaxis1: {
          "showline": true,
          side: 'left',
          title:"isPCI & isPII"
        },
        plot_bgcolor: 'rgb(182, 215, 168)'
      } }
      />
      </Col>
      </Row>
      
      </div>:null}
      </div>
    )
  }
}
export default FileReport;
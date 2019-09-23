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
    pci:0,
    pii:0,
    hipaa:0,
    others:0,
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
      var pci=0, pii=0,hipaa=0, others=0;
      var width=[0];
      for (var obj in data) {
        name.push(data[obj].name);
        console.log('pci: '+data[obj].isPCI);
        if(data[obj].isPCI == "true") {
          pci++;
        }
        if(data[obj].isPII == "true") {
          pii++;
        }
        if(data[obj].isHIPAA == "true") {
          hipaa++;
        }
        if(data[obj].isPCI == "false" && data[obj].isPII == "false") {
          others++;
        }
        width.push(0.4);
      }
      window.scrollTo({ top: 400, behavior: 'smooth'})
      this.setState({
        fileLayout: data,
        nameList:name,
        pci:pci,
        pii:pii,
        hipaa:hipaa,
        others:others,
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
    },
    {
      title: 'HIPAA',
      dataIndex: 'isHIPAA'
    }];

  const title="File ("+this.state.selectedFileTitle+") Layout"
    return (
      <div style={{"paddingLeft":"5px","backgroundColor":"#FFFFFF"}}>
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
            values:[this.state.pci, this.state.pii, this.state.hipaa, this.state.others],
            labels: ['PCI', 'PII','HIPAA', 'Others'],
            type: 'pie',
          }
        ]}
        layout={ {width: 450, height: 500,title:'Compliance Tracking', plot_bgcolor: 'rgb(182, 215, 168)'

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
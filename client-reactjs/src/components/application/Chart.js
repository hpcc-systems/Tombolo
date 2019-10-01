import React, { Component } from 'react';
import { Table,Modal } from 'antd/lib';
import Plotly from 'plotly.js-basic-dist';
import createPlotlyComponent from 'react-plotly.js/factory';
import { authHeader, handleError } from "../common/AuthHeader.js";
import { connect } from 'react-redux';
import BreadCrumbs from "../common/BreadCrumbs";
const Plot = createPlotlyComponent(Plotly);

class Chart extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    applicationId: this.props.application ? this.props.application.applicationId : '',
    applicationTitle: this.props.application ? this.props.application.applicationTitle : '',    
    fileLicense: [],
    licenseName:[],
    fileCount:[],
    barWidth:[],
    maxCount:0,
    Dependencies:[],
    depMaxCount:0,
    showFileList:false,
    files:[],
    popupTitle:"",
    chartLabels:[],
    chartValues:[],
    fileLayoutPopupTitle:"",
    showFileLayoutList:false,
    fileLayout:[],
    showDataTypeChart:false
  }
  componentDidMount() {
    this.fetchFileLicenseCount();  
    this.fetchDependenciesCount();   
    this.fetchFileLayoutDataType();    
  }

  fetchFileLicenseCount() {
    var self=this;   
    fetch("/api/file/read/fileLicenseCount?app_id="+this.state.applicationId, {
        headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {  
      var licenseName = [];
      var fileCount = [];
      var width=[];
      var maxCount=0;
      licenseName.push("No License");
      fileCount.push(data.nonLicensefileCount);
      maxCount=data.nonLicensefileCount;
      width.push(0.4);
      for (var obj in data.licenseFileCount) {
        licenseName.push(data.licenseFileCount[obj].name);
        fileCount.push(data.licenseFileCount[obj].fileCount);
        width.push(0.4);
        maxCount=(data.licenseFileCount[obj].fileCount>maxCount)?data.licenseFileCount[obj].fileCount:maxCount;
      }        
      self.setState({
        fileLicense: data,
        licenseName:licenseName,
        fileCount:fileCount,
        barWidth:width,
        maxCount:maxCount
      });         
    }).catch(error => {
      console.log(error);
    });
  }
  fetchDependenciesCount() {
    var self=this;  
    var maxCount=0; 
    fetch("/api/file/read/DependenciesCount?app_id="+this.state.applicationId, {
        headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      maxCount=data.fileCount>data.indexCount?data.fileCount:data.indexCount;
      maxCount=maxCount>data.queryCount?maxCount:data.queryCount;
      maxCount=maxCount>data.jobCount?maxCount:data.jobCount;    
      self.setState({
        Dependencies: data,
        depMaxCount:maxCount
      }); 
          
    }).catch(error => {
      console.log(error);
    });
  }
  fetchFileLayoutDataType(){    
    fetch("/api/file/read/fileLayoutDataType?app_id="+this.state.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
    if(response.ok) {
      return response.json();
    }
    handleError(response);
  })
  .then(data => {
    var labels=[];
    var values=[];
    var showChart=false;
    if(data.length>0){
      showChart=true;
      for(var obj in data){
        labels.push(data[obj].data_types);
        values.push(data[obj].count);
      }
    }
    this.setState({
      chartLabels:labels,
      chartValues:values,
      showDataTypeChart:showChart
    });
  }).catch(error => {
    console.log(error);
  });
  }
  onDependenciesClick = (data) => {
    var xaxisVal=data.points[0].x;
    if(xaxisVal=="File")
      this.props.history.push('/'+this.props.application.applicationId+'/files');    
    else if(xaxisVal=="Index")
    this.props.history.push('/'+this.props.application.applicationId+'/index');
    else if(xaxisVal=="Job")
    this.props.history.push('/'+this.props.application.applicationId+'/jobs');
    else if(xaxisVal=="Query")
    this.props.history.push('/'+this.props.application.applicationId+'/queries');
  }
  onComplianceClick = (data) => {  
    var popupTitle="";
    if(data.points[0].x=="No License")
      popupTitle="Non License Files";
    else 
      popupTitle="License - "+data.points[0].x;
    fetch("/api/file/read/LicenseFileList?app_id="+this.state.applicationId+"&name="+data.points[0].x, {
        headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      var results = [];
      data.forEach(function(doc, idx) {
        var fileObj = {};
        fileObj=doc;
        fileObj.fileTitle=(doc.title)?doc.title:doc.name;        
        results.push(fileObj);
      });
      this.setState({
        files: results,
        popupTitle:popupTitle
      });
      this.setState({
        showFileList: true
      });
          
    }).catch(error => {
      console.log(error);
    });
  }
  handleFileCancel=()=>{
    this.setState({
      showFileList: false
    });
  }
  onFileLayoutClick = (data) => {  
    var popupTitle="";
    popupTitle="Data Type - "+data.points[0].label;
    fetch("/api/file/read/getFileLayoutByDataType?app_id="+this.state.applicationId+"&data_types="+data.points[0].label, {
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
        fileLayout: data,
        fileLayoutPopupTitle:popupTitle
      });
      this.setState({
        showFileLayoutList: true
      });
          
    }).catch(error => {
      console.log(error);
    });
  }
  handleFileLayoutCancel=()=>{
    this.setState({
      showFileLayoutList: false
    });
  }
  render() {
    const fileColumns = [{
      title: 'Title',
      dataIndex: 'fileTitle',
      width: '30%',
    },
    {
        width: '30%',
        title: 'File Type',
        dataIndex: 'fileType'
    },
    {
        width: '40%',
        title: 'Qualified Path',
        dataIndex: 'qualifiedPath'
    }];
   const table = <Table
      columns={fileColumns}
      rowKey={record => record.id}
      dataSource={this.state.files}
      pagination={{ pageSize: 20 }}
      width="1000px"
    />
    const fileLayoutColumns = [{
      title: 'Layout Name',
      dataIndex: 'name',
      width: '30%',
    },
    {
      title: 'File',
      dataIndex: 'file.title',
      width: '30%',
    },
    {
      width: '30%',
      title: 'Type',
      dataIndex: 'type'
  },
    {
        width: '30%',
        title: 'Format',
        dataIndex: 'format'
    }];
   const fileLayoutTable = <Table
      columns={fileLayoutColumns}
      rowKey={record => record.id}
      dataSource={this.state.fileLayout}
      pagination={{ pageSize: 20 }}
      width="1000px"
    />
    const config = { displayModeBar: false }
    if(!this.props.application || !this.props.application.applicationId)
    return null;
    return (
      <div>
        <div className="d-flex justify-content-end" style={{paddingTop:"55px","backgroundColor":"#FFFFFF"}}>
          <BreadCrumbs applicationId={this.state.applicationId} applicationTitle={this.state.applicationTitle}/>  
          <span style={{ marginLeft: "auto"}}></span>        
      </div>
      <div style={{"backgroundColor":"#FFFFFF"}}>  
      <Plot onClick={this.onComplianceClick} config={config}  data={[{
            x: this.state.licenseName,
            y: this.state.fileCount,
            width:this.state.barWidth,
            type: 'bar',
            marker: {color: 'blue'},
            name:"PCI"
          }
        ]}
        layout={ {width: 400, height: 500, title: 'Compliance Data Point',
        xaxis1: {
          side: 'bottom',
          "showline": true,
          title:"Licenses"  
        },
        yaxis1: {
          side: 'left',
          autorange:false,
          range: [0,this.state.maxCount],
          tickformat: ',d',
          "showline": true,
          title:"File count"  
        },
        plot_bgcolor: 'rgb(182, 215, 168)'
      } }
      />
      <Plot  onClick={this.onDependenciesClick} config={config}       
        data={[
          {
            x: ['File','Index','Query','Job'],
            y: [this.state.Dependencies.fileCount,
            this.state.Dependencies.indexCount,
            this.state.Dependencies.queryCount,
            this.state.Dependencies.jobCount],
            width:[0.5,0.5,0.5,0.5],
            type: 'bar',
            marker: {color: 'rgb(128,0,0)'},
          }
        ]}
        layout={ {width: 400, height: 500, title: 'Dependencies',
        xaxis1: {
          side: 'bottom',
          "showline": true,
          title:"Dependencies"  
        },
        yaxis1: {
          side: 'left',
          autorange:false,
          range: [0,this.state.depMaxCount],
          tickformat: ',d',
          "showline": true,
          title:"Count"  
        },
        plot_bgcolor: 'rgb(182, 215, 168)'
      } }
      />
      {this.state.showDataTypeChart ?
      <Plot onClick={this.onFileLayoutClick} config={config} 
        data={[
          {
            values:this.state.chartValues,
            labels: this.state.chartLabels,
            type: 'pie',
          }
        ]}
        layout={ {width: 450, height: 500,title:'File layout data types', plot_bgcolor: 'rgb(182, 215, 168)'
      } }
      />:null}
      </div>
      <Modal
	          title={this.state.popupTitle}
	          visible={this.state.showFileList}
            onCancel={this.handleFileCancel}
            width="700px"
            footer={null}
	        >
          {table}
      </Modal>
      <Modal
	          title={this.state.fileLayoutPopupTitle}
	          visible={this.state.showFileLayoutList}
            onCancel={this.handleFileLayoutCancel}
            width="700px"
            footer={null}
	        >
          {fileLayoutTable}
      </Modal>
      </div>
    );
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

const connectedChart = connect(mapStateToProps)(Chart);
export { connectedChart as Chart };
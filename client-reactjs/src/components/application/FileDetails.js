import React, { Component } from "react";
import { Modal, Tabs, Form, Input, Icon,  Select, Button, Table, AutoComplete, Tag, message, Drawer, Row, Col } from 'antd/lib';
import TreantJSTree from "./TreantJSTree";
import ReactTable from "react-table";
import "react-table/react-table.css";
import FileRelations from "./FileRelations"
import DataProfileTable from "./DataProfileTable"
import DataProfileHTML from "./DataProfileHTML"
import { authHeader, handleError } from "../common/AuthHeader.js"
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';

const TabPane = Tabs.TabPane;
const Option = Select.Option;

class FileDetails extends Component {

  constructor(props) {
    super(props);
  }

  state = {
    visible: true,
    confirmLoading: false,
    pagination: {},
    loading: false,
    sourceFiles:[],
    selectedSourceFile:"",
    availableLicenses:[],
    selectedRowKeys:[],
    clusters:[],
    consumers:[],
    selectedCluster:"",
    fileSearchSuggestions:[],
    drawerVisible: false,
    fileDataColHeaders:[],
    fileDataContent: [],
    showFileProfile: false,
    fileProfile: [],
    profileHTMLAssets:[],
    dataTypes:[],
    complianceTags:[],
    file: {
      id:"",
      title:"",
      name:"",
      clusterId:"",
      description:"",
      primaryService:"",
      backupService:"",
      qualifiedPath:"",
      consumer:"",
      fileType:"",
      isSuperFile:"",
      layout:[],
      licenses:[],
      relations:[],
      fileFieldRelations:[],
      validations:[],
      inheritedLicensing:[]
    }
  }

  componentDidMount() {
    this.props.onRef(this);
    this.getFileDetails();
    this.fetchDataTypeDetails();
  }

  clearState() {
    this.setState({
      ...this.state,
      sourceFiles: [],
      file: {
        ...this.state.file,
        id: '',
        title: '',
        name:'',
        description: '',
        primaryService: '',
        backupService: '',
        qualifiedPath: '',
        consumer:'',
        fileType: '',
        isSuperFile: '',
        layout: [],
        licenses: [],
        relations: [],
        fileFieldRelations: [],
        validations: []
      }
    });

  }

  fetchDataTypeDetails() {
    var self=this;
    fetch("/api/file/read/dataTypes", {
        headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      self.setState({
        dataTypes: data
      });
    }).catch(error => {
      console.log(error);
    });
  }

  getFileDetails() {
    if(this.props.selectedFile && !this.props.isNewFile) {
      fetch("/api/file/read/file_details?file_id="+this.props.selectedFile+"&app_id="+this.props.applicationId, {
        headers: authHeader()
      }
      )
      .then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then(data => {
        this.setState({
          ...this.state,
          sourceFiles: data.sourceFiles,
          file: {
            ...this.state.file,
            id: data.basic.id,
            title: data.basic.title,
            name: data.basic.name,
            clusterId: data.basic.cluster_id,
            description: data.basic.description,
            primaryService: data.basic.primaryService,
            backupService: data.basic.backupService,
            qualifiedPath: data.basic.qualifiedPath,
            consumer: data.basic.consumer,
            fileType: data.basic.fileType,
            isSuperFile: data.basic.isSuperFile,
            layout: data.file_layouts,
            licenses: data.file_licenses,
            relations: data.file_relations,
            fileFieldRelations: data.file_field_relations,
            validations: data.file_validations
          }
        });
        return data;
      })
      .then(data => {
        this.getLicenses();
        return data;
      })
      .then(data => {
        this.getFileData(data.basic.name, data.basic.cluster_id);
        return data;
      })
      .then(data => {
        this.getConsumers();
        return data;
      })
      .then(data => {
        this.getInheritedLicenses(data.basic.id);
        return data;
      })
      .catch(error => {
        console.log(error);
      });
    }
  }

  showModal = () => {
    this.setState({
      visible: true,
    });
    this.clearState();
    this.getConsumers();
    this.getFileDetails();
    if(this.props.isNewFile) {
      this.getClusters();
    }
  }

  onDrawerClose = () => {
    this.setState({
      drawerVisible: false,
    });
  };

  onDrawerOpen = () => {
    this.setState({
      drawerVisible: true,
    });
  };

  handleOk = () => {
    this.setState({
      confirmLoading: true,
    });

    this.saveFileDetails();

    setTimeout(() => {
      this.setState({
        visible: false,
        confirmLoading: false,
      });
      this.props.onRefresh();
    }, 2000);
  }

  getLicenses() {
    fetch("/api/file/read/licenses", {
      headers: authHeader()
    }).then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then(data => {
        this.setState({
          ...this.state,
          availableLicenses: data
        });

        this.setState({
          ...this.state,
          selectedRowKeys: this.state.file.licenses.map(license => license.id)
        });
      }).catch(error => {
        console.log(error);
      });
  }

  getInheritedLicenses(fileId) {
    fetch("/api/file/read/inheritedLicenses?fileId="+fileId+"&app_id="+this.props.applicationId, {
      headers: authHeader()
    }).then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
    })
    .then(data => {
      this.setState({
        ...this.state,
        file: {
          ...this.state.file,
          inheritedLicensing: data
        }
      });
    }).catch(error => {
      console.log(error);
    });
  }

  getClusters() {
    fetch("/api/hpcc/read/getClusters", {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(clusters => {
      this.setState({
        ...this.state,
        clusters: clusters
      });
    }).catch(error => {
      console.log(error);
    });
  }

  async getConsumers() {
    fetch("/api/consumer/consumers", {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(consumers => {
      this.setState({
        ...this.state,
        consumers: consumers
      });
    }).catch(error => {
      console.log(error);
    });
  }

  searchFiles(searchString) {
    if(searchString.length <= 3)
      return;
    var data = JSON.stringify({clusterid: this.state.selectedCluster, keyword: searchString});
    fetch("/api/hpcc/read/filesearch", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(suggestions => {
      this.setState({
        ...this.state,
        fileSearchSuggestions: suggestions
      });
    }).catch(error => {
      console.log(error.text);
      message.error("There was error while searching files from the cluster");
    });
  }

  async onFileSelected(selectedSuggestion) {
    let fileExists = await this.fileAlreadyExists(selectedSuggestion);
    if(fileExists) {
      message.config({top:150})
      message.error("File "+selectedSuggestion+" already exists in this application. Please select another file.");
      return;
    }
    fetch("/api/hpcc/read/getFileInfo?fileName="+selectedSuggestion+"&clusterid="+this.state.selectedCluster, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);

    })
    .then(fileInfo => {
      this.setState({
        ...this.state,
        sourceFiles: [],
        file: {
          ...this.state.file,
          id: fileInfo.name,
          title: fileInfo.fileName,
          name: fileInfo.name,
          clusterId: this.state.selectedCluster,
          description: fileInfo.description,
          qualifiedPath: fileInfo.pathMask,
          consumer: fileInfo.consumer,
          fileType: fileInfo.fileType,
          isSuperFile: fileInfo.isSuperfile ? 'true' : 'false',
          layout: fileInfo.layout,
          fileFieldRelations: this.getFieldNames(fileInfo.layout),
          validations: fileInfo.validations
        }
      })
      return fileInfo;
    })
    .then(data => {
      return this.getLicenses();
    })
    .then(licenses => {
      return this.getFiles();
    })
    .then(files => {
      this.getFileData(selectedSuggestion,this.state.selectedCluster);
    })
    .then(files => {
      //this.getFileProfile(selectedSuggestion);
    })
    .catch(error => {
      console.log(JSON.stringify(error));
      message.error("There was an error getting file information from the cluster. Please try again")
    });
  }

  getFiles() {
    fetch("/api/file/read/file_ids?app_id="+this.props.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(files => {
      this.setState({
        ...this.state,
        sourceFiles: files
      });
    }).catch(error => {
      console.log(error);
    });
  }

  async fileAlreadyExists(selectedSuggestion) {
    var exists = false;
    await fetch("/api/file/read/file_ids?app_id="+this.props.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(files => {
      exists=files.filter(file => file.name == selectedSuggestion).length > 0;
    })
    .catch(error => {
      console.log(error);
    });
    return exists;
  }

  getFieldNames(layout) {
    var fields = [];
    layout.forEach(function (item, idx) {
      fields.push({"field":item.name, "source_field":"", "requirements": ""});
    });
    return fields;
  }

  saveFileDetails() {
    fetch('/api/file/read/savefile', {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({isNewFile : this.props.isNewFile, file : this.populateFileDetails()})
    }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
    }).then(function(data) {
      console.log('Saved..');
    });
  }

  getFileData = (fileName, clusterId) => {
    var _self = this;
    var cluster = this.state.selectedCluster ? this.state.selectedCluster : clusterId;
    fetch('/api/hpcc/read/getData?fileName='+fileName+'&clusterid='+cluster, {
      headers: authHeader()
    }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
    }).then(function(rows) {
      if(rows.length > 0) {
        _self.setState({
          fileDataColHeaders: Object.keys(rows[0]),
          fileDataContent: rows
        });
      }
    }).catch(error => {
      console.log(error);
    })
  }

  getFileProfile = (fileName) => {
    var _self = this;
    //fetch('/api/hpcc/read/getFileProfile?fileName='+fileName+'&clusterid='+this.state.selectedCluster, {
      fetch('/api/hpcc/read/getFileProfileHTML?fileName='+fileName+'&clusterid='+this.state.selectedCluster, {
      headers: authHeader()
    }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
    }).then(function(rows) {
      if(rows.length > 0) {
        _self.setState({
          showFileProfile: true,
          fileProfile: rows,
          profileHTMLAssets: rows
        });
      }
    }).then(function(data) {
    });
  }

  populateFileDetails() {
    console.log('Consujer: '+this.state.file.consumer);
    var applicationId = this.props.applicationId;
    var fileDetails = {"app_id":applicationId};
    var fileLayout={}, license = {};
    var file_basic = {
      //"id" : this.state.file.id,
      "title" : this.state.file.title,
      "name" : this.state.file.name,
      "cluster_id": this.state.file.clusterId,
      "description" : this.state.file.description,
      "primaryService" : this.state.file.primaryService,
      "backupService" : this.state.file.backupService,
      "qualifiedPath" : this.state.file.qualifiedPath,
      "consumer": this.state.file.consumer,
      "fileType" : this.state.file.fileType,
      "isSuperFile" : this.state.file.isSuperFile,
      "application_id" : applicationId
    };
    fileDetails.basic = file_basic;

    fileDetails.layout = this.state.file.layout;
    var selectedLicenses={};
    if(this.licenseGridApi && this.licenseGridApi.getSelectedNodes() != undefined) {
      selectedLicenses = this.licenseGridApi.getSelectedNodes().map(function(node) { return {"name" : node.data.name, "url": node.data.url} });
    }
    fileDetails.license = selectedLicenses;

    var fieldRelation = this.state.file.fileFieldRelations;
    var sourceFiles = fieldRelation.map(function(key,value){
      if(key["source_field"] != null && key["source_field"] != undefined) {
        return key["source_field"].split(".").shift();
      }
    });
    sourceFiles = this.state.file.relations;
    sourceFiles = sourceFiles.map(function(value){
        return JSON.parse("{\"id\":\""+value.id+"\"}");
    })
    //file relationship
    fileDetails.relation = sourceFiles;

    //field relationship
    fileDetails.fileFieldRelation = this.state.file.fileFieldRelations;

    //validations
    fileDetails.validation = this.state.file.validations;

    console.log(fileDetails);

    return fileDetails;
  }

  handleCancel = () => {
    this.setState({
      visible: false,
    });
    this.props.onClose();
  }

  onClusterSelection = (value) => {
    this.setState({
      selectedCluster: value,
    });
  }

  onConsumerSelection = (value) => {
    this.setState({...this.state, file: {...this.state.file, consumer: value }}, () => console.log(this.state.file.consumer));
  }

  onChange = (e) => {
    this.setState({...this.state, file: {...this.state.file, [e.target.name]: e.target.value }});
  }

  onFieldRelationsChange = (newValue) => {
    this.setState({...this.state, file: {...this.state.file, fileFieldRelations: JSON.parse(newValue) }});
  }

  handleFieldRelationsChange = (data) => {
    this.setState({
      ...this.state,
      file: {
        ...this.state.file,
        fileFieldRelations: data
      }
    });
  }

  onLayoutChange = (newValue) => {
    this.setState({...this.state, file: {...this.state.file, layout: JSON.parse(newValue) }});
  }

  onSourceFileSelection = (value) => {
    this.setState({
      selectedSourceFile: value,
    });
  }

  onAddSourceFile = (event) => {
    var relationsUpdated = this.state.file.relations;
    relationsUpdated.push({"id":this.state.selectedSourceFile});
    this.setState({
        ...this.state,
        file: {
          ...this.state.file,
          relations: relationsUpdated
        }
      });
    this.setState({
      selectedSourceFile: '',
    });

    setTimeout(() => {
    }, 200);
  }


  deleteSourceFile(index) {
    var relationsUpdated = this.state.file.relations.filter((x,i) => x.id != index)
    this.setState({
        ...this.state,
        file: {
          ...this.state.file,
          relations: relationsUpdated
        }
      }, function() {

      });
  }

  onValidationEdit = (cellInfo, value) => {
    const fileValidations = [this.state.file.validations];
    if(typeof value == 'string')
      fileValidations[0][cellInfo.index][cellInfo.column.id] = value;
    else if(typeof value == 'object')
       fileValidations[0][cellInfo.index][cellInfo.column.id] = value.target.value;
  }


  onLayoutGridReady = (params) => {
    let gridApi = params.api;
    gridApi.sizeColumnsToFit();
  }

  onLicenseGridReady = (params) => {
    this.licenseGridApi = params.api;
    this.licenseGridApi.sizeColumnsToFit();
    var _self=this;
    this.licenseGridApi.forEachNode(function(node, index) {
      if(_self.state.file.licenses.filter(license => license.name == node.data.name).length > 0) {
        _self.licenseGridApi.selectNode(node, true);
      }
    });

  }
  dataTypechange= (prop)=>{
    var _self=this;
    if(prop.column.colId=="data_types" && (prop.newValue)){
      var compliance=[];
      compliance=this.state.complianceTags;
      fetch('/api/controlsAndRegulations/getComplianceByDataType?dataType='+prop.newValue, {
        headers: authHeader()
      }).then(function(response) {
          if(response.ok) {
            return response.json();
          }
          handleError(response);
      }).then(function(data) {
        if(data && data.length > 0) {
          data.forEach((element) => {
            if(!compliance.includes(element)) {
              compliance.push(element);
            }
          })
          _self.setState({
            complianceTags:compliance
          });
        }
      }).catch(error => {
        console.log(error);
      });
    }
  }
  render() {
    const { visible, confirmLoading, sourceFiles, availableLicenses, selectedRowKeys, clusters, consumers, fileSearchSuggestions, fileDataContent, fileProfile, showFileProfile } = this.state;
    const modalTitle = "File Details" + (this.state.file.title ? " - " + this.state.file.title : " - " +this.state.file.name);
    const formItemLayout = {
      labelCol: {
        xs: { span: 2 },
        sm: { span: 5 },
      },
      wrapperCol: {
        xs: { span: 2 },
        sm: { span: 10 },
      },
    };

    const twoColformItemLayout = {
      labelCol: {
        xs: { span: 4 },
        sm: { span: 10 },
      },
      wrapperCol: {
        xs: { span: 2 },
        sm: { span: 10 },
      },
    };


    const layoutColumns = [{
      headerName: 'Name',
      field: 'name',
      sort: "asc"
    },
    {
      headerName: 'Type',
      field: 'type'
    },
    {
      headerName: 'Description',
      field: 'description',
      editable: true
    },
    {
      headerName: 'Required',
      editable: true,
      cellEditor: "agSelectCellEditor",
      cellEditorParams: {
        values: ["false", "true"]
      },
      valueGetter: function(params) {
        return (params.data.required && params.data.required != undefined) ? params.data.required : "false";
      },
      valueSetter: function(params) {
        var newVal = params.newValue;
        var data = params.data;
        if (data.required != newVal) {
          data.required = newVal
          return true;
        } else {
          return false;
        }
      }
    },
    {
      headerName: 'Display Size',
      field: 'displaySize',
      hide: true
    },
    {
      headerName: 'Display Type',
      field: 'displayType',
      hide: true
    },
    {
      headerName: 'Text Justification',
      field: 'textJustification',
      hide: true
    },
    {
      headerName: 'Format',
      field: 'format',
      hide: true
    },
    {
      headerName: 'Data Type',
      field: 'data_types',
      editable: true,
      cellEditor: "select",
      cellEditorParams: {
        values: this.state.dataTypes
      }
    },
    {
      headerName: 'PCI',
      field: 'isPCI',
      hide: true,
      editable: true,
      cellEditor: "select",
      cellEditorParams: {
        values: ["true", "false"]
      }
    },
    {
      headerName: 'PII',
      field: 'isPII',
      hide: true,
      editable: true,
      cellEditor: "select",
      cellEditorParams: {
        values: ["true", "false"]
      }
    },
    {
      headerName: 'HIPAA',
      field: 'isHIPAA',
      hide: true,
      editable: true,
      cellEditor: "select",
      cellEditorParams: {
        values: ["true", "false"]
      }
    }];
    const { complianceTags } = this.state;
    const licenseColumns = [{
      field: 'name',
      cellRenderer: function(params) {
         return '<a href='+params.data.url+' target="_blank">'+ params.value+'</a>'
      },
      headerCheckboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      checkboxSelection: true
    },
    {
      field: 'description',
      cellRenderer: function(params) {
         return params.value != null ? params.value : ''
      }
    }
    ];

    const validationTableColumns = [{
      headerName: 'Name',
      field: 'name',
      sort: "asc"
    },
    {
      headerName: 'Rule Type',
      field: 'ruleType',
      editable: true,
      cellEditor: "select",
      cellEditorParams: {
        values: ["", "field", "aggregate"]
      }
    },
    {
      headerName: 'Rule',
      field: 'rule',
      editable: true,
      cellEditor: "select",
      cellEditorParams: {
        values: ["", "not null", "in", "!=", ">"]
      }
    },
    {
      headerName: 'Action',
      field: 'action',
      editable: true,
      cellEditor: "select",
      cellEditorParams: {
        values: ["", "drop", "fix", "alert"]
      }
    },
    {
      headerName: 'Fix Script',
      field: 'fixScript',
      editable: true
    }];

    const fileDataColumns = () => {
      const columns = [];
      this.state.fileDataColHeaders.forEach(function(column) {
        columns.push({"title":column, "dataIndex": column});
      });
      return columns;
    }

    const InheritedLicenses = (licenses) => {
      console.log(licenses.relation);
      if(licenses.relation && licenses.relation.length > 0) {
        let uniqueLicenses=[];
        licenses.relation.forEach(function(item) {
          if(item.licenses && item.licenses.length > 0) {
            uniqueLicenses = uniqueLicenses.concat(item.licenses)
          }
        })
        const licenseItems = uniqueLicenses.map((license) =>
          <Tag color="red" key={license}>{license}</Tag>
        );
        return (
          <div style={{paddingBottom:"5px"}}><b>Inherited Licenses:</b> {licenseItems}</div>
        );
      } else {
        return null;
      }
    }

    const ComplianceInfo = (complianceTags) => {
      if(complianceTags.tags && complianceTags.tags.length > 0) {
        const tagElem = complianceTags.tags.map((tag, index) =>
            <Tag color="red" key={tag}>{tag}</Tag>
        );
        return (
          <div style={{paddingBottom:"5px"}}><b>Compliance:</b> {tagElem}</div>
        );
      } else {
        return null;
      }
    }


    const {title,name, description, primaryService, backupService, qualifiedPath, consumer, fileType, isSuperFile, layout, relations, fileFieldRelations, validations, inheritedLicensing} = this.state.file;
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectedRowKeysChange
    };

    //render only after fetching the data from the server
    if(!title && !this.props.selectedFile && !this.props.isNewFile) {
      return null;
    }

    return (
      <div>
        <Modal
          title={modalTitle}
          visible={visible}
          onOk={this.handleOk}
          confirmLoading={confirmLoading}
          onCancel={this.handleCancel}
          bodyStyle={{height:"500px"}}
          destroyOnClose={true}
          width="1200px"
        >
        <Tabs
          defaultActiveKey="1"
        >
          <TabPane tab="Basic" key="1">

           <Form layout="vertical">
            {this.props.isNewFile ?
            <div>
            <Form.Item {...formItemLayout} label="Cluster">
               <Select placeholder="Select a Cluster" onChange={this.onClusterSelection} style={{ width: 190 }}>
                {clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
              </Select>
            </Form.Item>

            <Form.Item {...formItemLayout} label="File">
              <AutoComplete
                className="certain-category-search"
                dropdownClassName="certain-category-search-dropdown"
                dropdownMatchSelectWidth={false}
                dropdownStyle={{ width: 300 }}
                size="large"
                style={{ width: '100%' }}
                dataSource={fileSearchSuggestions}
                onChange={(value) => this.searchFiles(value)}
                onSelect={(value) => this.onFileSelected(value)}
                placeholder="Search files"
                optionLabelProp="value"
              >
                <Input suffix={<Icon type="search" className="certain-category-icon" />} />
              </AutoComplete>
            </Form.Item>
            </div>
              : null
            }
            <Form.Item {...formItemLayout} label="Title">
                <Input id="file_title" name="title" onChange={this.onChange} defaultValue={title} value={title} placeholder="Title" />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Name">
                <Input id="file_name" name="name" onChange={this.onChange} defaultValue={name} value={name} placeholder="Name" disabled />
            </Form.Item>
            <Form.Item {...formItemLayout} label="Description">
                <Input id="file_desc" name="description" onChange={this.onChange} defaultValue={description} value={description} placeholder="Description" />
            </Form.Item>
            <Row type="flex">
              <Col span={12} order={1}>
                <Form.Item {...twoColformItemLayout} label="Primary Service">
                    <Input id="file_primary_svc" name="primaryService" onChange={this.onChange} defaultValue={primaryService} value={primaryService} placeholder="Primary Service" />
                </Form.Item>
              </Col>
              <Col span={12} order={1}>
                <Form.Item {...twoColformItemLayout} label="Backup Service">
                    <Input id="file_bkp_svc" name="backupService" onChange={this.onChange} defaultValue={backupService} value={backupService} placeholder="Backup Service" />
                </Form.Item>
              </Col>
            </Row>
            <Row type="flex">
              <Col span={12} order={1}>
                <Form.Item {...twoColformItemLayout} label="Path">
                    <Input id="file_path" name="qualifiedPath" onChange={this.onChange} defaultValue={qualifiedPath} value={qualifiedPath} placeholder="Path" />
                </Form.Item>
              </Col>
              <Col span={12} order={2}>
                <Form.Item {...twoColformItemLayout} label="File Type">
                    <Input id="file_type" name="fileType" onChange={this.onChange} defaultValue={fileType} value={fileType} placeholder="File Type" />
                </Form.Item>
              </Col>
            </Row>

            <Row type="flex">
              <Col span={12} order={1}>
                <Form.Item {...twoColformItemLayout} label="Is Super File">
                  <Input id="file_issuper_file" name="isSuperFile" onChange={this.onChange} defaultValue={isSuperFile} value={isSuperFile} placeholder="Is Super File" />
                </Form.Item>
              </Col>
              <Col span={12} order={2}>
                <Form.Item {...twoColformItemLayout} label="Consumer">
                   <Select value={(this.state.file.consumer != '') ? this.state.file.consumer : "Select a Consumer"} placeholder="Select a Consumer" onChange={this.onConsumerSelection} style={{ width: 190 }}>
                    {consumers.map(consumer => <Option key={consumer.id}>{consumer.name}</Option>)}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

          </Form>

          </TabPane>
          <TabPane tab="Layout" key="3">
              <ComplianceInfo tags={complianceTags}/>
              <div
                className="ag-theme-balham"
                style={{
                height: '415px',
                width: '100%' }}
              >
                <AgGridReact
                  onCellValueChanged={this.dataTypechange}
                  columnDefs={layoutColumns}
                  rowData={layout}
                  defaultColDef={{resizable: true, sortable: true}}
                  onGridReady={this.onLayoutGridReady}
                  singleClickEdit={true}>
                </AgGridReact>
              </div>
              {/*<Table
                columns={layoutColumns}
                rowKey={record => record.name}
                dataSource={layout}
                pagination={{ pageSize: 10 }} scroll={{ y: 380 }}
              />*/}
          </TabPane>
          <TabPane tab="Permissable Purpose" key="4">
            <InheritedLicenses relation={inheritedLicensing}/>
            <div
                className="ag-theme-balham"
                style={{
                height: '415px',
                width: '100%' }}
              >
                <AgGridReact
                  columnDefs={licenseColumns}
                  rowData={availableLicenses}
                  defaultColDef={{resizable: true, sortable: true}}
                  onGridReady={this.onLicenseGridReady}
                  rowSelection="multiple">
                </AgGridReact>
              </div>
          </TabPane>
          <TabPane tab="Scrubs" key="5">
            <div
                className="ag-theme-balham"
                style={{
                height: '415px',
                width: '100%' }}
              >
                <AgGridReact
                  columnDefs={validationTableColumns}
                  rowData={validations}
                  defaultColDef={{resizable: true}}
                  onGridReady={this.onLayoutGridReady}
                  singleClickEdit={true}>
                </AgGridReact>
              </div>
            {/*<div>
                <ReactTable
                  data={validations}
                  defaultSorted={[
                    {
                      id: "name",
                      desc: false
                    }
                  ]}
                  columns={validationTableColumns}
                  className="-striped -highlight"
                  defaultPageSize={10}
                  style={{height:"500px"}}
                />
              </div>*/}
          </TabPane>
          <TabPane tab="File Preview" key="6">
            <div>
                <Table
                  columns={fileDataColumns()}
                  dataSource={fileDataContent}
                  pagination={{ pageSize: 10 }} scroll={{ y: 380 }}
                />
              </div>
          </TabPane>
          {showFileProfile ?
            <TabPane tab="Data Profile" key="7" >
              <div>
                  {/*<DataProfileTable data={this.state.fileProfile}/>*/}
                  <DataProfileHTML htmlAssets={this.state.profileHTMLAssets}/>
                </div>
            </TabPane>
            : "" }
        </Tabs>
        </Modal>
      </div>
    );
  }
}

export class BooleanCellRenderer extends Component {
    constructor(props) {
        super(props)
    }

    render() {
        return (
            <span>
                {this.props.value}
            </span>
        );
    }
}

const FileDetailsForm = Form.create()(FileDetails);
export default FileDetailsForm;

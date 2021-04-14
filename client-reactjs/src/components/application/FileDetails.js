import React, { PureComponent, Component } from "react";
import {
  Modal, Tabs, Form, Input, Select, Button, Table, AutoComplete,
  Tag, message, Drawer, Row, Col, Spin, Radio, Checkbox
} from 'antd/lib';
import { debounce } from 'lodash';
import AssociatedDataflows from "./AssociatedDataflows"
import { authHeader, handleError } from "../common/AuthHeader.js"
import { fetchDataDictionary } from "../common/CommonUtil.js"
import {omitDeep} from '../common/CommonUtil.js';
import EditableTable from "../common/EditableTable.js"
import { MarkdownEditor } from "../common/MarkdownEditor.js"
import { AgGridReact } from 'ag-grid-react';
import { hasEditPermission, canViewPII } from "../common/AuthUtil.js";
import {eclTypes} from '../common/CommonUtil';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import { connect } from 'react-redux';
import BreadCrumbs from "../common/BreadCrumbs";
import { SearchOutlined  } from '@ant-design/icons';
import { assetsActions } from '../../redux/actions/Assets';

const TabPane = Tabs.TabPane;
const Option = Select.Option;
const { confirm } = Modal;
const layoutGrid=undefined;
const { TextArea } = Input;
message.config({top:130})
class FileDetails extends PureComponent {
  formRef = React.createRef();
  constructor(props) {
    super(props);
  }

  state = {
    visible: true,
    confirmLoading: false,
    loading: false,
    availableLicenses:[],
    rules:[],
    selectedRowKeys:[],
    clusters: [],
    consumers:[],
    selectedCluster: this.props.clusterId ? this.props.clusterId : "",
    drawerVisible: false,
    fileDataColHeaders:[],
    fileDataContent: [],
    complianceTags:[],
    complianceDetails:[],
    fileSearchErrorShown: false,
    disableReadOnlyFields: false,
    initialDataLoading: false,
    fileSearchSuggestions: [],
    file: {
      id:"",
      fileType:"thor_file",
      layout:[],
      licenses:[],
      relations:[],
      validations:[],
      inheritedLicensing:[],
      groupId: ''
    }
  }

  dataTypes = [];

  componentDidMount() {
    if(this.props.application && this.props.application.applicationId) {
      this.getFileDetails();
      this.fetchDataTypeDetails();
      //this.getConsumers();
      this.setClusters();
    }
  }

  clearState = () => {
    this.setState({
      ...this.state,
      complianceTags:[],
      fileDataContent:[],
      fileDataColHeaders:[],
      disableReadOnlyFields: false,
      file: {
        ...this.state.file,
        id: '',
        fileType: 'thor_file',
        layout: [],
        licenses: [],
        relations: [],
        validations: []
      }
    });
    this.formRef.current.resetFields();
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
      this.dataTypes = data;
    }).catch(error => {
      console.log(error);
    });
  }

  getFileDetails() {
    if(this.props.selectedAsset && this.props.selectedAsset.id != '' && !this.props.isNew) {
      this.setState({
        initialDataLoading: true
      });
      fetch("/api/file/read/file_details?file_id="+this.props.selectedAsset.id+"&app_id="+this.props.application.applicationId, {
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
          initialDataLoading: false,
        });
        if(data && data.basic) {
          this.setState({
            ...this.state,
            disableReadOnlyFields: true,
            file: {
              ...this.state.file,
              id: data.basic.id,
              clusterId: data.basic.cluster_id,
              groupId: data.basic.groupId,
              fileType: (data.basic.fileType == '' || data.basic.fileType == 'flat' ? 'thor_file' : data.basic.fileType),
              layout: data.file_layouts,
              licenses: data.file_licenses,
              relations: data.file_relations,
              validations: data.file_validations
            }
          });

          this.formRef.current.setFieldsValue({
            title: data.basic.title,
            name: data.basic.name,
            description: data.basic.description,
            scope: data.basic.scope,
            serviceURL: data.basic.serviceUrl,
            qualifiedPath: data.basic.qualifiedPath,
            owner: data.basic.owner,
            consumer: data.basic.consumer,
            supplier: data.basic.supplier,
            isSuperFile: data.basic.isSuperFile
          })
        } else {
          message.config({top:130})
          message.error("Could not retrieve data for this file. Please check if the file is valid")
        }
        return data;
      })
      .then(data => {
        this.getLicenses();
        return data;
      })
      .then(data => {
        if(data.basic) {
          this.getFileData(data.basic.name, data.basic.cluster_id);
        }
        return data;
      })
      .then(data => {
        if(data.basic && data.basic.id && this.props.selectedDataflow) {
          this.getInheritedLicenses(data.basic.id, this.props.selectedNodeId, this.props.selectedDataflow.id);
        }
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
    //this.getConsumers();
    this.getFileDetails();
    //this.getClusters();
    if(this.props.isNew) {
      this.getScope();
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

  handleOk = async (e) => {
    let _self = this;
    e.preventDefault();
    this.setState({
      confirmLoading: true,
    });

    try {
      const values = await this.formRef.current.validateFields();
      let saveResponse = await _self.saveFileDetails();
      setTimeout(() => {
        _self.setState({
          visible: false,
          confirmLoading: false,
        });
        if (this.props.history) {
          _self.props.history.push('/' + this.props.application.applicationId + '/assets')
        } else {
          document.querySelector('button.ant-modal-close').click();
        }
      }, 2000);
    } catch(e) {
      console.log(e)
      _self.setState({
        confirmLoading: false,
      });
    }
  };

  handleDelete = () => {
    let _self=this;
    confirm({
      title: 'Delete file?',
      content: 'Are you sure you want to delete this file?',
      onOk() {
        var data = JSON.stringify({fileId: _self.props.selectedAsset, application_id: _self.props.application.applicationId});
        fetch("/api/file/read/delete", {
          method: 'post',
          headers: authHeader(),
          body: data
        }).then((response) => {
          if(response.ok) {
            return response.json();
          }
          handleError(response);
        })
        .then(result => {
          //if called from Graph.js
          if(_self.props.onDelete) {
            _self.props.onDelete(_self.props.currentlyEditingNode)
          } else {
            _self.props.onRefresh();
          }
          message.success("File deleted sucessfully");
          _self.setState({
            visible: false,
            confirmLoading: false,
          });
        }).catch(error => {
          console.log(error);
          message.error("There was an error deleting the file");
        });
      },
      onCancel() {},
    });
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

  getInheritedLicenses(fileId, nodeId, dataflowId) {
    let licensesUrl = "/api/file/read/inheritedLicenses?fileId=" + fileId + "&app_id=" +
      this.props.applicationId + "&id=" + nodeId + '&dataflowId=' + dataflowId;
    fetch(licensesUrl, {
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

  setClusters() {
    let selectedCluster = this.props.clusters.filter(cluster => cluster.id == this.props.clusterId);
    if(selectedCluster.length > 0) {
      this.formRef.current.setFieldsValue({
        "clusters": selectedCluster[0].id
      })
    }
  }

  searchFiles = debounce((searchString) => {
    if(searchString.length <= 3)
      return;
    if(!searchString.match(/^[a-zA-Z0-9_-]*$/)) {
      message.error("Invalid search keyword. Please remove any special characters from the keyword.")
      return;
    }
    this.setState({
      ...this.state,
      fileSearchErrorShown: false
    });

    var data = JSON.stringify({clusterid: this.state.selectedCluster, keyword: searchString});
    fetch("/api/hpcc/read/filesearch", {
      method: 'post',
      headers: authHeader(),
      body: data
    }).then((response) => {
      if(response.ok) {
        return response.json();
      } else {
        throw response;
      }
    })
    .then(suggestions => {
      this.setState({
        ...this.state,
        fileSearchSuggestions: suggestions
      });
    }).catch(error => {
      if(!this.state.fileSearchErrorShown) {
        error.json().then((body) => {
          message.error("There was an error searching the files from cluster.");
        });
        this.setState({
          ...this.state,
          fileSearchErrorShown: true
        });
      }

    });
  }, 100);

  async onFileSelected(selectedSuggestion) {
    message.config({top:150})
    fetch("/api/hpcc/read/getFileInfo?fileName="+selectedSuggestion+"&clusterid="+this.state.selectedCluster+"&applicationId="+this.props.application.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);

    })
    .then(fileInfo => {
      if(fileInfo && fileInfo.basic.groups) {
        if(fileInfo.basic.groups.filter(group => group.id == this.props.groupId).length > 0) {
          message.error("There is already a file with the same name in this Group. Please select another file")
          return;
        }
      }

      this.setState({
        ...this.state,
        disableReadOnlyFields: true,
        file: {
          ...this.state.file,
          id: fileInfo.basic.id,
          layout: fileInfo.file_layouts,
          validations: fileInfo.file_validations
        }
      })

      this.formRef.current.setFieldsValue({
        title: fileInfo.basic.name.substring(fileInfo.basic.name.lastIndexOf("::") + 2),
        name: fileInfo.basic.name,
        description: fileInfo.basic.description,
        scope: fileInfo.basic.scope,
        serviceURL: fileInfo.basic.serviceUrl,
        qualifiedPath: fileInfo.basic.qualifiedPath,
        owner: fileInfo.basic.owner,
        consumer: fileInfo.basic.consumer,
        supplier: fileInfo.basic.supplier,
        isSuperFile: fileInfo.basic.isSuperFile
      })
      return fileInfo;
    })
    .then(data => {
      return this.getLicenses();
    })
    .then(licenses => {
      return this.getFileData(selectedSuggestion,this.state.selectedCluster);
    })
    .catch(error => {
      console.log(error);
      message.error("There was an error getting file information from the cluster. Please try again")
    });
  }

  saveFileDetails() {
    return new Promise((resolve, reject) => {
      fetch('/api/file/read/savefile', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({
          isNew : this.props.isNew,
          id: this.state.file.id,
          file : this.populateFileDetails()
        })
      }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
        reject();
      }).then(function(data) {
        resolve(data);
      }).catch(error => {
        message.error("Error occured while saving the data. Please check the form data")
      });
    })
  }

  getFileData = (fileName, clusterId) => {
    var _self = this;
    var cluster = this.state.selectedCluster ? this.state.selectedCluster : clusterId;
    if(cluster) {
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
  };

  setLayoutData = (data) => {
    this.setState({
      ...this.state,
      file: {
        ...this.state.file,
        layout: data,
      }
    })
  };

  setValidationData = (data) => {
    this.setState({
      ...this.state,
      file: {
        ...this.state.file,
        validations: data,
      }
    })
  };

  populateFileDetails() {
    var applicationId = this.props.application.applicationId;
    var fileDetails = {"app_id":applicationId};
    var fileLayout={}, license = {};
    console.log(this.formRef.current.getFieldsValue());

    var file_basic = {
      //"id" : this.state.file.id,
      ...this.formRef.current.getFieldsValue(),
      "isSuperFile": !this.formRef.current.getFieldValue("isSuperFile") ? false : this.formRef.current.getFieldValue("isSuperFile"),
      "cluster_id": this.props.clusterId,
      "fileType" : this.state.file.fileType,
      "application_id" : applicationId,
      "dataflowId" : this.props.selectedDataflow ? this.props.selectedDataflow.id : '',
    };
    let groupId = this.props.groupId ? this.props.groupId : this.state.file.groupId;
    if(groupId) {
      file_basic.groupId = groupId;
    }
    fileDetails.basic = file_basic;
    fileDetails.fields = this.state.file.layout;
    var selectedLicenses={};
    if(this.licenseGridApi && this.licenseGridApi.getSelectedNodes() != undefined) {
      selectedLicenses = this.licenseGridApi.getSelectedNodes().map(function(node) {
        return {"name" : node.data.name, "url": node.data.url}
      });
    }
    fileDetails.license = selectedLicenses;

    //validations
    fileDetails.validation = this.state.file.validations;

    console.log(fileDetails);

    return fileDetails;
  }

  handleCancel = () => {
    this.setState({
      visible: false,
    });
    //this.props.onClose();
    this.props.history.push('/' + this.props.application.applicationId + '/assets')
  }

  onClusterSelection = (value) => {
    this.props.dispatch(assetsActions.clusterSelected(value));
    this.setState({
      selectedCluster: value,
    });
  };

  onConsumerSelection = (value) => {
    this.setState({...this.state, file: {...this.state.file, consumer: value }});
  };

  onOwnerSelection = (value) => {
    this.setState({...this.state, file: {...this.state.file, owner: value }});
  };

  onSupplierSelection = (value) => {
    this.setState({...this.state, file: {...this.state.file, supplier: value }});
  };

  onChange = (e) => {
    this.setState({...this.state, file: {...this.state.file, [e.target.name]: e.target.value }});
  };

  onCheckbox = (e) => {
    this.setState({...this.state, file: {...this.state.file, [e.target.id]: e.target.checked }});
  };

  onLayoutGridReady = (params) => {
    var _self=this, selectedDataTypes=[], compliance=[];
    _self.layoutGrid = params.api;
    _self.layoutGrid.sizeColumnsToFit();

    //populate the compliance info
    _self.layoutGrid.forEachNode(function(node, index) {
      if(node.data.data_types && node.data.data_types != null) {
        selectedDataTypes.push(node.data.data_types);
      }
    });
    fetch('/api/controlsAndRegulations/getComplianceByDataType?dataType='+selectedDataTypes.join(","), {
      headers: authHeader()
    }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
    }).then(function(data) {
      if(data && data.length > 0) {
        data.forEach((element) => {
          compliance.push(element);
        })
        _self.setState({
          complianceTags:compliance,
        });

      }
    }).catch(error => {
      console.log(error);
    });
  };

  onGridReady = (params) => {
    let gridApi = params.api;
    gridApi.sizeColumnsToFit();
  };

  onLicenseGridReady = (params) => {
    this.licenseGridApi = params.api;
    this.licenseGridApi.sizeColumnsToFit();
    var _self=this;
    this.licenseGridApi.forEachNode(function(node, index) {
      if(_self.state.file.licenses.filter(license => license.name == node.data.name).length > 0) {
        _self.licenseGridApi.selectNode(node, true);
      }
    });
  };

  dataTypechange = (prop) => {
    var _self = this;
    if (prop.column.colId == "data_types" && (prop.oldValue)) {
      var compliance=[];
      var complianceDetails=[];
      compliance=_self.state.complianceTags;
      complianceDetails=_self.state.complianceDetails;
      var compToRemove = complianceDetails.filter((item) => item.id === prop.node.rowIndex);
      complianceDetails = complianceDetails.filter((item) => item.id !== prop.node.rowIndex);
      compToRemove.forEach((element)=>{
          var obj = complianceDetails.filter((item) => item.compliance === element.compliance);
          if(obj.length==0)
            compliance = compliance.filter((item) => item !== element.compliance);
      });
      _self.setState({
        complianceTags:compliance,
        complianceDetails:complianceDetails
      });
    }

    if(prop.column.colId=="data_types" && (prop.newValue)){
      var compliance=[];
      var complianceDetails=[];
      compliance=this.state.complianceTags;
      complianceDetails=this.state.complianceDetails;
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
            var obj={};
            obj.id=prop.node.rowIndex;
            obj.dataType=prop.newValue;
            obj.compliance=element;
            complianceDetails.push(obj);
          })
          _self.setState({
            complianceTags:compliance,
            complianceDetails:complianceDetails
          });
        }
      }).catch(error => {
        console.log(error);
      });
    }
  };

  getScope = () => {
    let scope = (
      this.props.user.organization + "::" + this.props.applicationTitle +
      (this.state.file.title != '' ? '::' + this.state.file.title : '')
    ).toLowerCase();

    this.setState({
      ...this.state,
      file: {
        ...this.state.file,
        scope: scope
      }
    });
  };

  scopeValidator = (rule, value, callback) => {
    try {
      if(this.state.file.scope == (this.props.user.organization + "::" + this.props.applicationTitle).toLowerCase()) {
        let errMsg = "Please enter a valid scope. The convention is <Organization Name>::<Application Name>::<File Type>";
        throw new Error(errMsg);
      }
      callback();
    } catch (err) {
      callback(err);
    }
  };

  fileTypeChange = (e) => {
    this.setState({
      ...this.state,
      file: {
        ...this.state.file,
        fileType: e.target.value
      }
    });
  };

  render() {
    const {
      visible, confirmLoading, availableLicenses,
      selectedRowKeys, consumers,
      fileDataContent, disableReadOnlyFields, clusters
    } = this.state;
    const modalTitle = "File Details" + (this.state.file.title ? " - " + this.state.file.title : " - " +this.state.file.name);
    const VIEW_DATA_PERMISSION=canViewPII(this.props.user);
    const editingAllowed = hasEditPermission(this.props.user) || !this.props.viewMode;
    const formItemLayout = {
      labelCol: { span: 2 },
      wrapperCol: { span: 8 }
    };

    const twoColformItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 12 }
    };

    const threeColformItemLayout = {
      labelCol: { span: 6 },
      wrapperCol: { span: 12 }
    };

    const layoutColumns = [{
      title: 'Field',
      dataIndex: 'name',
      sort: "asc",
      editable: editingAllowed,
      width: '25%'
    }, {
      title: 'Type',
      dataIndex: 'type',
      editable: editingAllowed,
      celleditor: "select",
      celleditorparams: {
        values: eclTypes.sort()
      },
      showdatadefinitioninfield: true,
      width: '18%'
    }, {
      title: 'ECL Type',
      dataIndex: 'eclType',
      editable: editingAllowed,
      showdatadefinitioninfield: true
    }, {
      title: 'Description',
      dataIndex: 'description',
      editable: editingAllowed,
      width: '15%'
    }, {
      title: 'Required',
      editable: editingAllowed,
      dataIndex: 'required',
      celleditor: "select",
      celleditorparams: {
        values: ["false", "true"]
      },
      width: '10%'
    }, {
      title: 'Information Type',
      dataIndex: 'data_types',
      editable: editingAllowed,
      celleditor: "select",
      width: '15%',
      celleditorparams: {
        values: this.dataTypes.sort()
      }
    }];

    const validationRuleColumns = [{
      title: 'Field',
      dataIndex: 'rule_field',
      celleditor: 'select',
      editable: editingAllowed,
      width: '15%',
      celleditorparams: {
        values: this.state.fileDataColHeaders
      }
    }, {
      title: 'Rule Name',
      dataIndex: 'rule_name',
      editable: editingAllowed,
      width: '15%'
    }, {
      title: 'Rule',
      dataIndex: 'rule_test',
      editable: editingAllowed,
      width: '15%'
    }, {
      title: 'Fix',
      dataIndex: 'rule_fix',
      editable: editingAllowed,
      width: '15%'
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
    }, {
      field: 'description',
      cellRenderer: function(params) {
         return params.value != null ? params.value : ''
      }
    }];

    const fileDataColumns = () => {
      const columns = [];
      var _self=this;
      this.state.fileDataColHeaders.forEach(function(column) {
        let colObj;
        //iterate through each Row[]
        if(_self.state.fileDataContent[0][column]["Row"] != undefined) {
          colObj = {"headerName":column};
          let children=[];
          Object.keys(_self.state.fileDataContent[0][column]["Row"][0]).forEach(function(key) {
            children.push({"headerName":key, "valueGetter": "data." + column + ".Row[0]."+ key})
          })
          colObj.children = children;
        } else if(_self.state.fileDataContent[0][column] instanceof Object) {
          colObj = {"headerName":column};
          let children=[];
          Object.keys(_self.state.fileDataContent[0][column]).forEach(function(key) {
            children.push({"headerName":key, "field": column + "."+ key})
          })
          colObj.children = children;
        } else {
          colObj = {"headerName":column, "field": column};
        }
        columns.push(colObj);
      });
      return columns;
    };

    const InheritedLicenses = (licenses) => {
      if(licenses.relation && licenses.relation.length > 0) {
        const licenseItems = licenses.relation.map((license) =>
          <Tag color="red" key={license}>{license}</Tag>
        );
        return (
          <div style={{paddingBottom:"5px"}}><b>Inherited Licenses:</b> {licenseItems}</div>
        );
      } else {
        return null;
      }
    };

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
    };

    const {
      title, name, description, scope, serviceUrl, qualifiedPath, consumer, owner, fileType,
      isSuperFile, layout, relations, fileFieldRelations, validations, inheritedLicensing
    } = this.state.file;
    const selectedCluster = this.state.clusters.filter(cluster => cluster.id == this.props.clusterId);
    const rowSelection = {
      selectedRowKeys,
      onChange: this.onSelectedRowKeysChange
    };
    //const modalHeight = !this.props.isNew ? "425px" : "550px";
    const modalHeight = "570px";

    const getNodeChildDetails = (rowItem) => {
      if (rowItem.children) {
        return {
          group: true,
          // open C be default
          expanded: false,
          // provide ag-Grid with the children of this group
          children: rowItem.children,
          // the key is used by the default group cellRenderer
          key: rowItem.type
        };
      } else {
        return null;
      }
    }
    //render only after fetching the data from the server
    if(!title && !this.props.selectedAsset && !this.props.isNew) {
      console.log("not rendering");
      return null;
    }

    return (
      <React.Fragment>
        <div>
          {/*<BreadCrumbs applicationId={this.props.application.applicationId} applicationTitle={this.props.application.applicationTitle}/>*/}
          {!this.props.isNew?
            <div className="loader">
              <Spin spinning={this.state.initialDataLoading} size="large" />
            </div> : null}
          <Tabs
            defaultActiveKey="1"
          >
            <TabPane tab="Basic" key="1">
               <Form {...formItemLayout} labelAlign="left" ref={this.formRef} onFinish={this.handleOk}>
                <div>
                <Form.Item label="Type">
                  <Radio.Group onChange={this.fileTypeChange} value={this.state.file.fileType}>
                    <Radio value={'thor_file'}>Thor File</Radio>
                    <Radio value={'csv'}>CSV</Radio>
                    <Radio value={'json'}>JSON</Radio>
                    <Radio value={'xml'}>XML</Radio>
                  </Radio.Group>
                </Form.Item>
                {this.state.file.fileType == 'thor_file' ?
                  <React.Fragment>
                    <Form.Item label="Cluster" name="clusters">
                      <Select placeholder="Select a Cluster" disabled={!editingAllowed} onChange={this.onClusterSelection} style={{ width: 190 }}>
                        {this.props.clusters.map(cluster => <Option key={cluster.id}>{cluster.name}</Option>)}
                      </Select>
                    </Form.Item>

                    <Form.Item label="File" name="fileSearchValue" >
                      <Row type="flex">
                        <Col span={21} order={1}>
                          <AutoComplete
                            className="certain-category-search"
                            dropdownClassName="certain-category-search-dropdown"
                            dropdownMatchSelectWidth={false}
                            dropdownStyle={{ width: 300 }}
                            style={{ width: '100%' }}
                            onSearch={(value) => this.searchFiles(value)}
                            onSelect={(value) => this.onFileSelected(value)}
                            placeholder="Search files"
                            disabled={!editingAllowed}
                            notFoundContent={this.state.fileSearchSuggestions.length > 0 ? 'Not Found' : <Spin />}
                          >
                            {this.state.fileSearchSuggestions.map((suggestion) => (
                              <Option key={suggestion.text} value={suggestion.value}>
                                {suggestion.text}
                              </Option>
                            ))}
                          </AutoComplete>
                        </Col>
                        <Col span={3} order={2} style={{"paddingLeft": "3px"}}>
                         <Button htmlType="button" onClick={this.clearState}>
                            Clear
                         </Button>
                        </Col>
                      </Row>
                    </Form.Item>
                  </React.Fragment>
                  :
                  null}

                </div>
                <Form.Item label="Title" name="title" rules={[{ required: true, message: 'Please enter a title!' }, {
                  pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
                  message: 'Please enter a valid title',
                }]}>
                  <Input id="file_title" name="title" onChange={this.onChange} placeholder="Title" disabled={!editingAllowed}/>
                </Form.Item>
                <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter a name!' }, {
                  pattern: new RegExp(/^[a-zA-Z0-9:._-]*$/),
                  message: 'Please enter a valid name',
                }]}>
                  <Input id="file_name" onChange={this.onChange} placeholder="Name" disabled={disableReadOnlyFields || !editingAllowed} />
                </Form.Item>
                <Form.Item label="Scope" name="scope" rules={[
                  {
                    required: true
                  }, {
                    validator: this.scopeValidator
                  }
                ]}>
                  <Input id="file_scope" onChange={this.onChange} placeholder="Scope" disabled={disableReadOnlyFields || !editingAllowed}/>
                </Form.Item>
                <Form.Item label="Description" name="description">
                  <MarkdownEditor id="file_desc" onChange={this.onChange} targetDomId="fileDescr" value={description} disabled={!editingAllowed}/>
                </Form.Item>
                <Form.Item label="Service URL" name="serviceURL" rules={[{
                  type: 'url',
                  message: 'Please enter a valid URL'
                }]}>
                    <Input id="file_primary_svc" onChange={this.onChange} placeholder="Service URL" disabled={!editingAllowed}/>
                </Form.Item>
                <Row type="flex">
                  <Col span={8} order={1}>
                    <Form.Item label="Path" name="qualifiedPath" {...threeColformItemLayout} rules={[{
                      pattern: new RegExp(/^[a-zA-Z0-9:$._-]*$/),
                      message: 'Please enter a valid path',
                    }]}>
                        <Input id="file_path" onChange={this.onChange} placeholder="Path" disabled={!editingAllowed}/>
                    </Form.Item>
                  </Col>
                  <Col span={8} order={1}>
                    <Form.Item {...threeColformItemLayout} label="Is Super File" name="isSuperFile" valuePropName="checked">
                      <Checkbox id="isSuperFile" onChange={this.onCheckbox} checked={isSuperFile===true} disabled={!editingAllowed}/>
                    </Form.Item>
                  </Col>
                </Row>

                <Row type="flex">
                  <Col span={8} order={1}>
                    <Form.Item {...threeColformItemLayout} label="Supplier" name="supplier">
                       <Select id="supplier" value={(this.state.file.supplier != '') ? this.state.file.supplier : "Select a supplier"} placeholder="Select a supplier" onChange={this.onSupplierSelection} style={{ width: 190 }} disabled={!editingAllowed}>
                        {this.props.consumers.map(consumer => consumer.assetType=="Supplier" ? <Option key={consumer.id}>{consumer.name}</Option> : null)}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8} order={2}>
                    <Form.Item {...threeColformItemLayout} label="Consumer" name="consumer">
                       <Select id="consumer" value={(this.state.file.consumer != '') ? this.state.file.consumer : "Select a consumer"} placeholder="Select a consumer" onChange={this.onConsumerSelection} style={{ width: 190 }} disabled={!editingAllowed}>
                        {this.props.consumers.map(consumer => consumer.assetType == 'Consumer' ? <Option key={consumer.id}>{consumer.name}</Option> : null)}
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col span={8} order={3}>
                    <Form.Item {...threeColformItemLayout} label="Owner" name="owner">
                       <Select id="owner" value={(this.state.file.owner != '') ? this.state.file.owner : "Select an Owner"} placeholder="Select an Owner" onChange={this.onOwnerSelection} style={{ width: 190 }} disabled={!editingAllowed}>
                        {this.props.consumers.map(consumer => consumer.assetType == 'Owner' ? <Option key={consumer.id}>{consumer.name}</Option> : null)}
                      </Select>
                    </Form.Item>
                  </Col>

                </Row>
              </Form>

            </TabPane>
            <TabPane tab="Layout" key="3">
                <ComplianceInfo tags={complianceTags}/>
                <div
                  className="layout_tbl"
                  style={{
                  width: '100%' }}
                >
                  <EditableTable
                    columns={layoutColumns}
                    dataSource={layout}
                    ref={node => (this.layoutTable = node)}
                    fileType={this.state.file.fileType}
                    editingAllowed={editingAllowed}
                    showDataDefinition={true}
                    dataDefinitions={[]}
                    setData={this.setLayoutData}/>
                </div>
            </TabPane>
            <TabPane tab="Permissable Purpose" key="4">
              <InheritedLicenses relation={inheritedLicensing}/>
              <div
                  className="ag-theme-balham"
                  style={{
                  height: '400px',
                  width: '100%' }}
                >
                  <AgGridReact
                    columnDefs={licenseColumns}
                    rowData={availableLicenses}
                    defaultColDef={{resizable: true, sortable: true}}
                    onGridReady={this.onLicenseGridReady}
                    rowSelection="multiple"
                    suppressRowClickSelection={editingAllowed}>
                  </AgGridReact>
                </div>
            </TabPane>
            <TabPane tab="Validation Rules" key="5">
              <div
                  className="ag-theme-balham"
                  style={{
                  height: '415px',
                  width: '100%' }}
                >
                  <EditableTable
                    columns={validationRuleColumns}
                    dataSource={validations}
                    ref={node => (this.validationTable = node)}
                    editingAllowed={editingAllowed}
                    showDataDefinition={true}
                    dataDefinitions={[]}
                    setData={this.setValidationData}/>
                </div>
            </TabPane>
            {VIEW_DATA_PERMISSION ?
              <TabPane tab="File Preview" key="6">
                <div
                    className="ag-theme-balham"
                    style={{
                    height: '415px',
                    width: '100%' }}>
                    {<AgGridReact
                      columnDefs={fileDataColumns()}
                      rowData={fileDataContent}
                      onGridReady={this.onGridReady}
                      defaultColDef={{resizable: true}}
                      >
                    </AgGridReact>}
                    {}
                  </div>
              </TabPane>
            : null}

            {!this.props.isNew ?
              <TabPane tab="Dataflows" key="7">
                <AssociatedDataflows assetName={name} assetType={'File'}/>
              </TabPane> : null}
              <TabPane>
Edit
              </TabPane>
           
          </Tabs>
        </div>
        <div className="button-container">
          <Button key="danger" disabled={!this.state.file.id || !editingAllowed} type="danger" onClick={this.handleDelete}>Delete</Button>
          <Button key="back" onClick={this.handleCancel}>
            Cancel
          </Button>
          <Button key="submit" disabled={!editingAllowed} type="primary" loading={confirmLoading} onClick={this.handleOk}>
            Save
          </Button>
        </div>
      </React.Fragment>
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

function mapStateToProps(state) {
    const { selectedAsset, newAsset={}, clusterId } = state.assetReducer;
    const { user } = state.authenticationReducer;
    const { application, clusters, consumers } = state.applicationReducer;

    const {isNew=false, groupId='' } = newAsset;
    return {
      user,
      selectedAsset,
      application,
      isNew,
      groupId,
      clusterId,
      clusters,
      consumers
    };
}

const FileDetailsForm = connect(mapStateToProps)(FileDetails);
export default FileDetailsForm;
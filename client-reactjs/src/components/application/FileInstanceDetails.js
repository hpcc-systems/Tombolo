import React, { Component } from "react";
import { Modal, Tabs, Form, Input, Icon,  Select, Button, Table, AutoComplete, Tag, message, Drawer, Row, Col, Spin} from 'antd/lib';
import { AgGridReact } from 'ag-grid-react';
import { authHeader, handleError } from "../common/AuthHeader.js"
import DataProfileHTML from "./DataProfileHTML"
const TabPane = Tabs.TabPane;

class FileInstanceDetails extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    visible:false,
    confirmLoading: false,
    fileInstanceSearchSuggestions:[],
    title:'',
    name: '',
    fileDefinition:'',
    autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />,
    fileInstanceSearchErrorShown: false,
    fileDefnLayout: []
  }

  componentDidMount() {
    this.props.onRef(this);
    this.getFileInstanceDetails();
  }

  clearState = () => {
    this.setState({
      title: '',
      name: '',
      fileDefinition:'',
      fileDefinitionId: '',
      fileDefnLayout: []
    });
  }

  getFileInstanceDetails() {
    if(this.props.selectedAsset && !this.props.isNew) {
      fetch("/api/fileinstance/instance_details?id="+this.props.selectedAsset, {
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
          title: data.title,
          name: data.item_name,
          fileDefinitionId:data.file_definition,
          applicationId:data.application_id
        });        
        this.props.form.setFieldsValue({
          name: data.item_name,
          title: data.title
        });
        return data;
      })
      .then(data => {
        this.getFileDefnDetails(data.application_id, data.file_definition).then(fileDefnInfo => {
          this.setState({
            fileDefnLayout: fileDefnInfo.file_layouts,
            fileDefinition: fileDefnInfo.basic.title,
            fileDefinitionId: fileDefnInfo.basic.id
          });
        })    
        return data;
      })     
      .catch(error => {
        console.log(error);
      });
    }
  }
  
  showModal = () => {
    this.setState({
      visible: true
    });
    
  }

  handleOk = (e) => {    
    e.preventDefault();
    this.props.form.validateFields(async (err, values) =>  {
      if(!err) {
        this.setState({
          confirmLoading: true,
        });

        try {
          let saveResponse = await this.saveFileInstanceDetails();
          setTimeout(() => {
            this.setState({
              visible: false,
              confirmLoading: false,
            });
            this.clearState();
            this.props.onRefresh(saveResponse);
          }, 2000);
        } catch(e) {
          this.setState({
            confirmLoading: false,
          });
        }
      }
    });
  }

  saveFileInstanceDetails = () => {
    return new Promise((resolve, reject) => {
      fetch('/api/fileinstance/create', {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({
          file_definition : this.state.fileDefinitionId, 
          item_name : this.state.name, 
          title: this.state.title,
          application_id: this.props.applicationId
        })
      }).then(function(response) {
          if(response.ok) {
            return response.json();
          }
          handleError(response);
          reject();
      }).then(function(data) {
        resolve(data);
      });
    })
  }

  handleCancel = () => {
    this.setState({
      visible: false,
    });
    this.clearState();
  }

  searchFileInstances = (searchString) => {
    if(searchString.length <= 3)
      return;    
    this.setState({
      autoCompleteSuffix : <Spin/>,
      fileSearchErrorShown: false
    });
    
    fetch("/api/file/read/all?userId="+this.props.user.id+"&keyword="+searchString, {
      method: 'post',
      headers: authHeader()
    }).then((response) => {
      console.log("response.ok: "+response.ok);
      if(response.ok) {
        return response.json();
      } else {
        throw response;
      }
    })
    .then(suggestions => {
      this.setState({
        fileInstanceSearchSuggestions: suggestions,
        autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />
      });
    }).catch(error => {
      if(!this.state.fileSearchErrorShown) {
        error.json().then((body) => {
          message.config({top:130})
          message.error(body.message);
        });
        this.setState({
          fileInstanceSearchErrorShown: true,
          autoCompleteSuffix: <Icon type="search" className="certain-category-icon" />
        });
      }

    });
  }

  onFileInstanceSelected = (selectedValue) => {
    let selected = this.state.fileInstanceSearchSuggestions.filter((item) => {
      return item.text == selectedValue
    })
    this.getFileDefnDetails(selected[0].app_id, selected[0].id).then(fileDefnInfo => {
      this.setState({
        fileDefnLayout: fileDefnInfo.file_layouts,
        fileDefinition: fileDefnInfo.basic.title,
        fileDefinitionId: fileDefnInfo.basic.id
      });
    })    
  }

  getFileDefnDetails = (app_id, file_id) => {
    return new Promise((resolve, reject) => {
      fetch("/api/file/read/file_details?app_id="+app_id+"&file_id="+file_id, {
        headers: authHeader()
      })
      .then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);

      })
      .then(fileDefnInfo => {        
        resolve(fileDefnInfo)
      })   
    });
  }

  onGridReady = (params) => {
    let gridApi = params.api;
    gridApi.sizeColumnsToFit();
  }

  onChange = (e) => {
    this.setState({[e.target.name]: e.target.value });    
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    const { visible, confirmLoading, name, title, fileInstanceSearchSuggestions, fileDefinition, selectedFileInstanceName, fileDefnLayout} = this.state;
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
      headerName: 'ECL Type',
      field: 'eclType'
    },
    {
      headerName: 'Description',
      field: 'description'
    },
    {
      headerName: 'Data Type',
      field: 'data_types'    
    }];

    return (
      <div>
        <Modal
          title="File Instance Details"
          visible={visible}
          onOk={this.handleOk}
          confirmLoading={confirmLoading}
          onCancel={this.handleCancel}
          bodyStyle={{height:"400px"}}
          destroyOnClose={true}
          width="750px"
        >
        <Tabs
          defaultActiveKey="1"
        >
          <TabPane tab="Basic" key="1">

           <Form layout="vertical">             
            <Form.Item {...formItemLayout} label="Title">
              {getFieldDecorator('title', {
                rules: [{ required: true, message: 'Please enter a title!' }],
              })(
              <Input id="file_title" name="title" onChange={this.onChange} placeholder="Title" />              
              )}
            </Form.Item> 
             <Form.Item {...formItemLayout} label="Name">
               {getFieldDecorator('name', {
                  rules: [{ required: true, message: 'Please enter a name!' }],
                })(
                  <Input id="fileinstance_name" name="name" onChange={this.onChange} placeholder="Name" />
                )}  
              </Form.Item>
             <Form.Item {...formItemLayout} label="File Defn">
              <AutoComplete
                className="certain-category-search"
                dropdownClassName="certain-category-search-dropdown"
                dropdownMatchSelectWidth={false}
                dropdownStyle={{ width: 300 }}
                size="large"
                style={{ width: '100%' }}
                dataSource={fileInstanceSearchSuggestions}
                onChange={(value) => this.searchFileInstances(value)}
                onSelect={(value) => this.onFileInstanceSelected(value)}
                placeholder="Search file instances"
                optionLabelProp="value"
              >
                <Input id="autocomplete_field" suffix={this.state.autoCompleteSuffix} autoComplete="off"/>
              </AutoComplete>
              </Form.Item> 
              <Form.Item {...formItemLayout} label="File Definition">
                  <Input id="file_defn" name="fileDefinition" value={fileDefinition} defaultValue={fileDefinition} placeholder="File Definition" />
              </Form.Item>
            </Form>
          </TabPane>        

          <TabPane tab="Layout" key="3">
              <div
                className="ag-theme-balham"
                style={{
                height: '320px',
                width: '100%' }}
              >
                <AgGridReact
                  columnDefs={layoutColumns}
                  rowData={fileDefnLayout}
                  defaultColDef={{resizable: true, sortable: true, filter: true}}
                  onGridReady={this.onGridReady}>
                </AgGridReact>
              </div>              
          </TabPane>
        </Tabs>
        </Modal>
      </div>
    );
  }
}
const FileInstanceDetailsForm = Form.create()(FileInstanceDetails);
export default FileInstanceDetailsForm;


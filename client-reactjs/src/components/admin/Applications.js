import React, { Component } from "react";
import { Table, Button, Modal, Form, Input, notification, Tooltip, Popconfirm, Divider, message, Radio } from 'antd/lib';
import BreadCrumbs from "../common/BreadCrumbs";
import { authHeader, handleError } from "../common/AuthHeader.js";
import { hasAdminRole } from "../common/AuthUtil.js";
import { connect } from 'react-redux';
import { Constants } from '../common/Constants';
import { MarkdownEditor } from "../common/MarkdownEditor.js";
import ShareApp from "./ShareApp";
import ReactMarkdown from 'react-markdown';
import { applicationActions } from '../../redux/actions/Application';
import { DeleteOutlined, EyeOutlined, QuestionCircleOutlined, ShareAltOutlined, ExportOutlined  } from '@ant-design/icons';
import ImportApplication from "./ImportApplication"
import download from "downloadjs"

class Applications extends Component {
  constructor(props) {
    super(props);
  }
  state = {
  	applications:[],
  	selectedApplication:'',
  	removeDisabled: true,
  	showAddApp: false,
  	confirmLoading: false,
  	newApp : {
	  	id: '',
	  	title: '',
      description:'',
      visibility: 'Private'
  },
  openShareAppDialog:false,
  appId:"",
  appTitle:"",
  submitted: false,
  action : "read"
  }

  //When the compononts first mounts
  componentDidMount() {
  	this.getApplications();
  }

  onSelectedRowKeysChange = (selectedRowKeys, selectedRows) => {
    var appsSelected = this.state.selectedApplications, removeDisabled = true;
    appsSelected = selectedRows;
    this.setState({
      selectedApplications: appsSelected,
    });
    removeDisabled = (selectedRows.length > 0) ? false : true;
	this.setState({
	  removeDisabled: removeDisabled
	});

  }

  //Get all apps from the DB
  getApplications() {
  	var url="/api/app/read/appListByUserId?user_id="+this.props.user.id+"&user_name="+this.props.user.username;
    if(hasAdminRole(this.props.user))
      url="/api/app/read/app_list";

  	fetch(url, {
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
  	    	applications: data
  	    });
    	})
    	.catch(error => {
      	console.log(error);
    	});
  }

  //Handle Edit application
  handleEditApplication(app_id) {
    fetch("/api/app/read/app?app_id="+app_id, {
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
        ...this.state,
        newApp: {
          ...this.state.newApp,
          id : data.id,
          title: data.title,
          description: data.description,
          visibility: data.visibility ? data.visibility : 'Private'
        }
      });
      this.setState({
        showAddApp: true
      });
    })
  	.catch(error => {
    	console.log(error);
  	});
  }

  //Handle share application
  handleShareApplication(app_id,app_tittle){
    this.setState({
      appId: app_id,
      appTitle:app_tittle,
      openShareAppDialog: true
    });
  }

  //Handle Application deletion
  handleRemove = (app_id) => {
  	var data = JSON.stringify({appIdsToDelete:app_id});
    fetch("/api/app/read/removeapp", {
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
      notification.open({
        message: 'Application Removed',
        description: 'The application has been removed.',
        onClick: () => {
          console.log('Closed!');
        },
      });
      this.getApplications();
      this.props.dispatch(applicationActions.applicationDeleted(app_id));
    }).catch(error => {
      console.log(error);
    });
  }

  //When add application button is clicked
  handleAdd = (event) => {
    this.resetFields();
    this.setState({
      showAddApp: true,
      action: "write"
    });
  }

  //Function to reset the form fields
  resetFields = () => {
    this.setState({
      ...this.state,
      confirmLoading: false,
      submitted: false,
      action : "read",
      newApp: {
        ...this.state.newApp,
        id : '',
        title: '',
        description:'',
        visibility: 'Private'
      },
      showAddApp: false
    });
  }

  // When the modal close is triggered by the cancel button or the X on the modal
  handleAddAppCancel= (event) => {
  	this.resetFields();
  }

  //On form field change
  onChange = (e) => {
    this.setState({...this.state,confirmLoading:false, newApp: {...this.state.newApp, [e.target.name]: e.target.value }});
  }

  //When save button is clicked
  handleAddAppOk = (values) => { 
    this.formRef.current.validateFields();
    if(this.state.applications.filter(application => {
      if (application.id != this.state.newApp.id && application.title == this.state.newApp.title) {
        return application;
      }
    }).length > 0) {
      message.config({top:150})
      message.error("There is already an application with the same name. Please select a different name.")
      return;
    }
    this.setState({
      confirmLoading: true,
      submitted: true
    });
    if(this.state.newApp.title) {
      var userId = (this.props.user) ? this.props.user.username : "";
      let data = JSON.stringify({
        "id": this.state.newApp.id,
        "title" : this.state.newApp.title,
        "description" : this.state.newApp.description,
        "user_id":userId,
        "creator":this.props.user.username,
        "visibility": this.state.newApp.visibility
      });

    	fetch("/api/app/read/newapp", {
        method: 'post',
        headers: authHeader(),
        body: data
      }).then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then(response => {
        if(this.state.newApp.id == '') {
          this.props.dispatch(applicationActions.applicationSelected(response.id, response.title, response.title));
          localStorage.setItem("activeProjectId", response.id);
          this.formRef.current.resetFields();
        } else {
          //updating an application
          this.props.dispatch(applicationActions.applicationUpdated(this.state.newApp.id, this.state.newApp.title));
        }

  	  	this.setState({
        ...this.state,
          newApp: {
            ...this.state.newApp,
            id : '',
            title: '',
            description:'',
            visibility: 'Private'
          },
          showAddApp: false,
          confirmLoading: false,
          submitted:false
        });

  	    this.getApplications();
      }).catch(error => {
        console.log(error);
      });
    }
  }

  //When edit btn is clicked
   handleEdit = () =>{
    this.setState({action : "write"})
  }

  //When export icon is clicked
  handleExportApplication = (id, title) => {
    fetch("/api/app/read/export", {
      method: 'post',
      headers: authHeader(),
      body: JSON.stringify({id: id})
    }).then((response) => {
      if(response.ok) {
        return response.blob();
      }
      handleError(response);
    }).then(blob => {
      download(blob, title+'-schema.json');
    }).catch(error => {
      console.log(error);
    });
  }

  //When close btn on share app modal is clicked
  handleClose = () => {
    this.setState({
      openShareAppDialog: false
    });
  }

  // Reference to the form inside app modal
  formRef = React.createRef();

  //JSX
  render() {
  	const { confirmLoading} = this.state;
  	const applicationColumns = [
    {
      width: '10%',
      title: 'Title',
      dataIndex: 'title'
    }, {
      width: '30%',
      title: 'Description',
      dataIndex: 'description',
      className: 'overflow-hidden',
      ellipsis: true,
      render: (text, record) =>  <span className="description-text"><ReactMarkdown children={text} /></span>
  }, {
      width: '10%',
      title: 'Created By',
      dataIndex: 'creator'
    }, {
      width: '20%',
      title: 'Created',
      dataIndex: 'createdAt',
      render: (text, record) => {
        let createdAt = new Date(text);
        return createdAt.toLocaleDateString('en-US', Constants.DATE_FORMAT_OPTIONS) +' @ '+ createdAt.toLocaleTimeString('en-US')
      }
    }, {
      width: '15%',
      title: 'Action',
      dataIndex: '',
      render: (text, record) =>
        <span>
          <a href="#" onClick={(row) => this.handleShareApplication(record.id,record.title)}><Tooltip placement="left" title={"Share Application"}><ShareAltOutlined /></Tooltip></a>
          { (record.creator && record.creator == this.props.user.username) ?
            <React.Fragment>
              <Divider type="vertical" />
              <a href="#" onClick={(row) => {this.handleEditApplication(record.id); this.setState({action : "read"})}}><Tooltip placement="right" title={"Edit Application"}><EyeOutlined /></Tooltip></a>
              <Divider type="vertical" />
              <a href="#" onClick={(row) => this.handleExportApplication(record.id, record.title)}><Tooltip placement="right" title={"Export Application"}><ExportOutlined /></Tooltip></a>
              <Divider type="vertical" />
              <Popconfirm title="Are you sure you want to delete this Application?" onConfirm={() => this.handleRemove(record.id)} icon={<QuestionCircleOutlined />}>
                <a href="#"><Tooltip placement="right" title={"Delete Application"}><DeleteOutlined /></Tooltip></a>
              </Popconfirm>
            </React.Fragment>
          : null }
        </span>
    }];
    const formItemLayout = 
    this.state.action !== "read" ? {
    labelCol: {
      xs: { span: 2 },
      sm: { span: 8 },
    },
    wrapperCol: {
      xs: { span: 4 },
      sm: { span: 24 },
    }
  } : 
  {
    labelCol: {
      xs: { span: 3 },
      sm: { span: 5 },
    },
    wrapperCol: {
      xs: { span: 4 },
      sm: { span: 24 },
    }
  }


    return (
    <React.Fragment>
      <div className="d-flex justify-content-end" style={{display: "flex", placeItems: "center"}}>
        <BreadCrumbs applicationId={this.state.applicationId}/>
        < ImportApplication user={this.props.user}/>
        <span style={{ marginLeft: "auto" }}>
            <Tooltip placement="bottom" title={"Click to add a new Application"}>
              <Button className="btn btn-secondary btn-sm" onClick={() => this.handleAdd()}><i className="fa fa-plus"></i> Add Application</Button>
            </Tooltip>
          </span>  
      </div>
      <div style={{padding:"15px"}}>
      	<Table
          columns={applicationColumns}
          rowKey={record => record.id}
          dataSource={this.state.applications}
          pagination={this.state.applications?.length > 10 ? {pageSize: 10}: false}
          />

      </div>

      <div>
	      <Modal
          title="Application"
          visible={this.state.showAddApp}
          onCancel={this.handleAddAppCancel}
          confirmLoading={confirmLoading}
          footer={[
            <Button  type="primary" onClick={this.state.action ==="read" ? this.handleEdit.bind(this) : this.handleAddAppOk.bind(this) }> {this.state.action === "read" ? "Edit" : "Save"} </Button>,
            <Button onClick={this.handleAddAppCancel}> Cancel </Button>,
          ]}>

	        <Form layout={this.state.action === "read" ? "horizontal" : "vertical"} className="formInModal" ref={this.formRef}>
            <Form.Item {...formItemLayout} 
            label="Title" 
            name="title"
              rules={[
                { required: true, 
                message: "Please enter a title!" },
                {
                  pattern: new RegExp(/^[a-zA-Z]{1}[a-zA-Z0-9_: .\-]*$/),
                  message: "Please enter a valid title. Title can have  a-zA-Z0-9:._- and space",
                },
              
            ]}>
            <Input autoFocus={true} id="app_title" name="title" onChange={this.onChange} placeholder="Title" 
              value={this.state.newApp.title}
              className={this.state.action === "read" ? "read-only-input" : ""}/></Form.Item>

            {this.state.action === "read" ?
            <Form.Item {...formItemLayout} label="Description" >
                <ReactMarkdown className="read-only-markdown" children={this.state.newApp.description} />
            </Form.Item>
              :
            <Form.Item {...formItemLayout} label="Description">
                 <MarkdownEditor 
                  id="app_description" 
                  name="description" 
                  targetDomId="AppDescr" 
                  onChange={this.onChange}
                  value={this.state.newApp.description}
                  />
            </Form.Item>
          }

            <Form.Item {...formItemLayout} label="Visibility">
              {this.state.action === "read" ? 
              <Input value={this.state.newApp.visibility} className="read-only-input" /> : 
              <Radio.Group onChange={this.onChange} name="visibility" value={this.state.newApp.visibility}>
                <Radio value={'Private'}>Private</Radio>
                <Radio value={'Public'}>Public</Radio>
              </Radio.Group>
              }
            </Form.Item>  

          </Form>
        </Modal>
      </div>
      <div>
      {this.state.openShareAppDialog ?
        <ShareApp
          appId={this.state.appId}
          appTitle={this.state.appTitle}
          user={this.props.user}
          onClose={this.handleClose}/> : null}
      </div>
    </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  const { user } = state.authenticationReducer;
  return {
      user
  };
}
const connectedApp = connect(mapStateToProps)(Applications);
const AppForm = connectedApp;
export { AppForm as AdminApplications };
//export default Applications;

import React, { Component } from "react";
import { Table, Button, Modal, Form, Input, notification, Tooltip, Popconfirm, Divider, message, Radio } from 'antd/lib';
import BreadCrumbs from "../../common/BreadCrumbs";
import { authHeader, handleError } from "../../common/AuthHeader.js";
import { hasAdminRole } from "../../common/AuthUtil.js";
import { connect } from 'react-redux';
import { Constants } from '../../common/Constants';
import ShareApp from "./ShareApp";
import { applicationActions } from '../../../redux/actions/Application';
import { DeleteOutlined, EyeOutlined, QuestionCircleOutlined, ShareAltOutlined, ExportOutlined,GlobalOutlined,UserOutlined} from '@ant-design/icons';
import ImportApplication from "./ImportApplication"
import download from "downloadjs"
import AddApplication from "./AddApplication";

class Applications extends Component {
  // REFERENCE TO THE FORM INSIDE MODAL
  formRef = React.createRef();
  
  constructor(props) {
    super(props);
  }
  state = {
  	applications:[],
  	selectedApplication: null,
  	removeDisabled: true,
    showAddApplicationModal : false,
    isCreatingNewApp : false,
    openShareAppDialog:false,
    submitted: false,
  }

  componentDidMount() {
    this.getApplications();
  }

  componentDidUpdate(prevProps, prevState) {
      if (prevProps.user !== this.props.user || this.state.showAddApplicationModal !== prevState.showAddApplicationModal) this.getApplications();
    }

  // GET ALL APPLICATIONS
  getApplications() {
  	var url=`/api/app/read/appListByUsername?user_name=${this.props.user.username}`;
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

  // HANDLE SHARE APPLICATION 
  handleShareApplication(record){
    this.setState({selectedApplication : record, openShareAppDialog : true})
  }

  // REMOVE OR DELETE APPLICATION
  handleRemove = (app_id) => {
  	var data = JSON.stringify({appIdToDelete:app_id, user : this.props.user.username});
    fetch("/api/app/read/deleteApplication", {
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

  // ADD OR CREATE NEW APPLICATION
  handleAddApplication = () => {
    this.setState({showAddApplicationModal : true, 
                  selectedApplication : null,
                  isCreatingNewApp : true})
  }

  // CLOSE ADD APPLICATION MODAL
  closeAddApplicationModal = () => this.setState({showAddApplicationModal : false})

 // EDIT OR VIEW APPLICATION
  handleApplicationEdit = (record) =>{ 
    this.setState({isCreatingNewApp : false, selectedApplication : record, showAddApplicationModal : true})
    
  }

  // EXPORT APPLICATION
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

  // WHEN CLOSE ON APP SHARE MODAL IS CLICKED
  handleClose = () => {
    this.setState({
      openShareAppDialog: false
    });
  }

  // DISPLAY ICON THAT EXPLAINS - IF THE APP WAS SHARED , PUBLIC OR PRIVATE
  renderAppVisibilityIcon = (record) =>{
    if(record.visibility === 'Public'){
      return <Tooltip title='Public'><GlobalOutlined /></Tooltip>
    }else if(record.visibility === 'Private' && record.creator === this.props.user.username){
      return <Tooltip title='Your Application'><UserOutlined /></Tooltip>
    }else{
      return <Tooltip title='Shared to you'><ShareAltOutlined /></Tooltip>
    }
  }

  allowShare = (record) =>{
    if(record.visibility !== 'Public' && record.creator === this.props.user.username) return true;
  }

  //JSX
  render() {
  	const applicationColumns = [
      {
      width: '2%',
      title: '',
      render : (record) => this.renderAppVisibilityIcon(record)
    },
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
  }, {
      width: '8%',
      title: 'Created By',
      dataIndex: 'creator'
    }, {
      width: '10%',
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
            <React.Fragment>
              {record.visibility !== 'Public' && record.creator === this.props.user.username ?<>
              <a href="#" onClick={() => this.handleShareApplication(record)}><Tooltip placement="left" title={"Share Application"}><ShareAltOutlined /></Tooltip></a>
              <Divider type="vertical" /> </>: null}

              <a href="#" onClick={() => this.handleApplicationEdit(record)}><Tooltip placement="right" title={"Edit Application"}><EyeOutlined /></Tooltip></a>
              <Divider type="vertical" />

              <a href="#" onClick={() => this.handleExportApplication(record.id, record.title)}><Tooltip placement="right" title={"Export Application"}><ExportOutlined /></Tooltip></a>
              <Divider type="vertical" />

              {(record.creator === this.props.user.username) || (record.creator !== this.props.username && record.visibility !== 'Public') ? 
              <Popconfirm title="Are you sure you want to delete this Application?" onConfirm={() => this.handleRemove(record.id)} icon={<QuestionCircleOutlined />}>
                <a href="#"><Tooltip placement="right" title={"Delete Application"}><DeleteOutlined /></Tooltip></a>
              </Popconfirm> : null}
            </React.Fragment>
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
              <Button className="btn btn-secondary btn-sm" 
                onClick={() => this.handleAddApplication()}>
                <i className="fa fa-plus"></i> Add Application</Button>
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

      {this.state.showAddApplicationModal ?
      <AddApplication
        closeAddApplicationModal ={this.closeAddApplicationModal}
        showAddApplicationModal={this.state.showAddApplicationModal} 
        isCreatingNewApp={this.state.isCreatingNewApp}  
        selectedApplication={this.state.selectedApplication}
        user={this.props.user}
        applications = {this.state.applications}
      /> : null}

      <div>
      {this.state.openShareAppDialog ?
        <ShareApp
          appId={this.state.selectedApplication.id}
          appTitle={this.state.selectedApplication.title}
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

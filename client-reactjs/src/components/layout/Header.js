import React, { Component } from "react";
import {Layout, Menu, Icon, message, Tooltip, Input, Button, Dropdown, Modal, Alert, Form, notification} from 'antd/lib';
import { NavLink, Switch, Route, withRouter } from 'react-router-dom';
import { userActions } from '../../redux/actions/User';
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js"
import { hasAdminRole } from "../common/AuthUtil.js";  
import { applicationActions } from '../../redux/actions/Application';
import $ from 'jquery';

const { Header, Content } = Layout;
const { Search } = Input;

class AppHeader extends Component {
    constructor(props) {
      super(props);
      this.handleChange = this.handleChange.bind(this);
      this.handleTopNavClick = this.handleTopNavClick.bind(this);
      this.search = this.search.bind(this);
      this.onChangeSearch = this.onChangeSearch.bind(this);
      this.appDropDown = React.createRef();
    }

    state = {
      applications: [],
      selected:'Select an Application',
      pathName:'',
      searchText:'',
      visible: false,
      loading: false,
      oldpassword: '',
      newpassword: '',
      confirmnewpassword: ''
    }

    componentWillReceiveProps(props) {      
      if(props.application && props.application.applicationTitle!=''){
        this.setState({ selected: props.application.applicationTitle });
        $('[data-toggle="popover"]').popover('disable');
      }      
    }
    
    componentDidMount(){
      if(this.props.location.pathname.includes('report/')){
        const pathSnippets = this.props.location.pathname.split('/');
        this.setState({
          searchText: pathSnippets[2]
        });
      }
      if(this.state.applications.length == 0) {        
        var url="/api/app/read/appListByUserId?user_id="+this.props.user.id+'&user_name='+this.props.user.username;
        if(hasAdminRole(this.props.user)) {
          url="/api/app/read/app_list";
        }
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
          let applications = data.map(application => { return {value: application.id, display: application.title} })
          if(applications && applications.length > 0) {
            this.setState({ applications });
            this.handleRef();
          } else {
            this.openHelpNotification();
          }
        }).catch(error => {
          console.log(error);
        });
      }      
    }
    componentDidUpdate(prevProps, prevState) {
      if(this.props.newApplication) {        
        let applications = this.state.applications;
        let isNewApplicationInList = (applications.filter(application => application.value == this.props.newApplication.applicationId).length > 0);
        if(!isNewApplicationInList) {
          applications.push({
            value: this.props.newApplication.applicationId,
            display: this.props.newApplication.applicationTitle
          })
          this.setState({ applications });
        }
      }
      if(this.props.updatedApplication) {
        let applications = this.state.applications;
        let application = applications.filter(application => application.value == this.props.updatedApplication.applicationId && application.display != this.props.updatedApplication.applicationTitle);
        if(application.length > 0) {
          applications = applications.map((application) => {
            if(application.value == this.props.updatedApplication.applicationId) {
              application.display = this.props.updatedApplication.applicationTitle;
            }
            return application;
          })
          this.setState({ applications });
        }
      }

      if(this.props.deletedApplicationId) {
        let applications = this.state.applications;
        let application = applications.filter(application => application.value == this.props.deletedApplicationId);
        if(application.length > 0) {
          applications = applications.filter(application => application.value != this.props.deletedApplicationId);
          this.setState({ applications });          
        }

      }           
    }

    handleTopNavClick(event) {
      var nav = event.target.getAttribute("data-nav");
      if(nav == '/logout')
          return;
      nav = (nav == '/' ? ('/'+this.props.applicationId.applicationId+'/data-dictionary') : nav)
      this.setState({
          selectedTopNav: nav
      });
      this.props.dispatch(applicationActions.topNavChanged(nav));
      if(this.props.applicationId) {
          this.props.dispatch(applicationActions.applicationSelected(this.props.applicationId.applicationId));
      }
      this.props.history.push(nav);
    }

    handleLogOut = (e) => {
        localStorage.removeItem('user');
        this.setState({
            applicationId: '',
            selected: 'Select an Application'
        });
        this.props.dispatch(applicationActions.applicationSelected('', ''));

        this.props.dispatch(userActions.logout());

        this.props.history.push('/login');
        message.success('You have been successfully logged out. ');
    }

    handleChange(event) {
      this.props.dispatch(applicationActions.applicationSelected(event.target.getAttribute("data-value"), event.target.getAttribute("data-display")));
      localStorage.setItem("activeProjectId", event.target.getAttribute("data-value"));
      this.setState({ selected: event.target.getAttribute("data-display") });
      //if it is asset details url, dont redirect to default /dataflow page
      if(!this.props.history.location.pathname.startsWith('/details')) {
        this.props.history.push('/'+event.target.getAttribute("data-value")+'/data-dictionary');
      }
      $('[data-toggle="popover"]').popover('disable');
    }

    handleRef() {
      const appDropdownItem = this.appDropDown.current.querySelector('[data-value="'+localStorage.getItem("activeProjectId")+'"]');
      //if no activeProjectId select the first application by default.
      if(appDropdownItem == null && this.state.applications.length > 0) {
        this.setState({ selected: this.state.applications[0].display });
        this.props.dispatch(applicationActions.applicationSelected(this.state.applications[0].value, this.state.applications[0].display));
        localStorage.setItem("activeProjectId", this.state.applications[0].value);
        //if it is asset details url, dont redirect to default /dataflow page
        if(!this.props.history.location.pathname.startsWith('/details')) {
          this.props.history.push('/'+this.state.applications[0].value+'/data-dictionary');
        }
      } else {
        appDropdownItem.click();  
      }      
    }

    openHelpNotification = () => {
      const key = `open${Date.now()}`;
      notification.open({
        message: 'Hello',
        description:
          'Welcome '+this.props.user.firstName+' '+this.props.user.lastName+'. Please make sure you check out the User Guide under Help option.',
        key,
        onClose: this.close(),
        icon: <Icon type="question-circle" />,
        top: 70
      });
    };

    close = () => {
      console.log(
        'Notification was closed. Either the close button was clicked or duration time elapsed.',
      );
    };

    search(value){
      this.props.history.push('/report/'+value);
    }

    onChangeSearch=(e)=> {
      this.setState({searchText: e.target.value });
    }

    handleChangePassword = () => {
      this.setState({visible: true }); 
    }

    handleOk = () => {
      let _self=this;
      this.props.form.validateFields(async (err, values) => {
        if(!err) {
          this.setState({loading: true }); 
          fetch("/api/user/changePassword", {
            method: 'post',
            headers: authHeader(),
            body: JSON.stringify({"username": this.props.user.username, "oldpassword":this.state.oldpassword, "newpassword": this.state.newpassword, "confirmnewpassword": this.state.confirmnewpassword})
          }).then((response) => {
            if(response.ok) {
                return response.json();
            }
            handleError(response);
          }).then((response) => {
            _self.clearChangePasswordDlg()
            message.config({top:130})
            message.success('Password changed successfully.');
            _self.setState({loading: false, visible: false }); 
          }).catch(function(err) {
            _self.clearChangePasswordDlg()
            _self.setState({loading: false, visible: false }); 
            message.config({top:130})
            message.error('There was an error while changing the password.');
          });
        }
      });
    }

    handleCancel = () => {
      this.setState({visible: false }); 
    }

    handleUserActionMenuClick = (e) => {
      if(e.key == 1) {
        this.handleChangePassword();
      } else if(e.key == 2) {
        this.handleLogOut();
      }
    }

    handleChangePasswordFieldChange = (e) => {
      this.setState({...this.state, [e.target.name]: e.target.value });
    }

    clearChangePasswordDlg = () => {
      this.setState({
        oldpassword: '',
        newpassword: '',
        confirmnewpassword: '' 
      }); 
    }

  render() {
    const {getFieldDecorator} = this.props.form;
    const applicationId = this.props.application ? this.props.application.applicationId : '';
    const selectedTopNav = (window.location.pathname.indexOf("/admin") != -1) ? "/admin/applications" : (applicationId != '' ? "/" + applicationId + "/dataflow" : "/dataflow")
    const appNav = (applicationId != '' ? "/" + applicationId + "/dataflow" : "/dataflow");
    const userActionMenu = (
      <Menu onClick={this.handleUserActionMenuClick}>
        <Menu.Item key="1">Change Password</Menu.Item>
        <Menu.Item key="2">Logout</Menu.Item>
      </Menu>
    );
    const helpMenu = (
      <Menu>
        <Menu.Item key="1"><a href="" type="link" target={"_blank"} href={process.env.PUBLIC_URL + "/Tombolo-User-Guide.pdf"}>User Guide</a></Menu.Item>
      </Menu>
    );

    const formItemLayout = {
      labelCol: {
        xs: { span: 2 },
        sm: { span: 9 },
      },
      wrapperCol: {
        xs: { span: 2 },
        sm: { span: 12 },
      },
    };

    if(!this.props.user || !this.props.user.token) {
      return null;
    }
    return (
        <React.Fragment>
        <nav className="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
          <a className="home-logo navbar-brand" href="/">Tombolo</a>
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault" aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarsExampleDefault">
            <ul className="navbar-nav mr-auto">
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" id="applicationSelect" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">{this.state.selected}</a>
                <div className="dropdown-menu" aria-labelledby="dropdown01" ref={this.appDropDown}>
                    {this.state.applications.map((application, index) => (
                        <a className="dropdown-item" key={application.value} onClick={this.handleChange} data-value={application.value} data-display={application.display}>{application.display}</a>
                    ))}
                </div>
              </li>
              {/*<li className="nav-item">
                <a className="nav-link" href="#"><i className="fa fa-lg fa-plus-circle"></i></a>
              </li>*/}

            </ul>
            <ul className="ml-md-auto navbar-nav">            
            <li className="nav-item">
              <Search
                value={this.state.searchText}
                name="searchText"
                placeholder="Search"
                onSearch={this.search}
                onChange={this.onChangeSearch}
                style={{ width: 200, paddingRight:"5px" }} />
            </li>
            <li style={{ paddingRight:"5px" }}>
              <Dropdown overlay={helpMenu} trigger={['click']}>
                <Button shape="round">
                  <i className="fa fa-lg fa-question-circle"></i><span style={{paddingLeft:"5px"}}>Help <Icon type="down" /></span>
                </Button>
              </Dropdown>
            </li>
            <li>  
              <Dropdown overlay={userActionMenu} style={{paddingLeft:"5px"}} trigger={['click']}>
                <Button shape="round">
                  <i className="fa fa-lg fa-user-circle"></i><span style={{paddingLeft:"5px"}}>{this.props.user.firstName + " " + this.props.user.lastName} <Icon type="down" /></span>
                </Button>
              </Dropdown>
            </li>  
            </ul>
          </div>
        </nav>

        <Modal
          title="Change Password"
          visible={this.state.visible}
          width="520px"
          footer={[
            <Button key="cancel" onClick={this.handleCancel}>
              Cancel
            </Button>,
            <Button key="submit" onClick={this.handleOk} type="primary" loading={this.state.loading}>
              Change Password
            </Button>            
          ]}
        >          
          <Form.Item {...formItemLayout} label="Password">
            {getFieldDecorator('name', {
              rules: [{ required: true, message: 'Please enter the current password!' }],
            })(
            <Input type="password" name="oldpassword" placeholder="Password" onChange={this.handleChangePasswordFieldChange}/> )}
          </Form.Item>

          <Form.Item {...formItemLayout} label="New Password">
            {getFieldDecorator('newpassword', {
              rules: [{ required: true, message: 'Please enter the new password!' }],
            })(
            <Input type="password" name="newpassword" placeholder="New Password" onChange={this.handleChangePasswordFieldChange}/>  )}
          </Form.Item>

          <Form.Item {...formItemLayout} label="Confirm Password">
            {getFieldDecorator('confirmnewpassword', {
              rules: [{ required: true, message: 'Please confirm the new password!' }],
            })(
            <Input type="password" name="confirmnewpassword" placeholder="Confirm Password" onChange={this.handleChangePasswordFieldChange}/>   )}
          </Form.Item>

        </Modal>
       </React.Fragment> 
    )
  }
}

function mapStateToProps(state) {
    const { loggingIn, user } = state.authenticationReducer;
    const { application, selectedTopNav, newApplication, updatedApplication, deletedApplicationId } = state.applicationReducer;
    return {
        loggingIn,
        user,
        application,
        selectedTopNav,
        newApplication,
        updatedApplication,
        deletedApplicationId
    };
}

//export default withRouter(AppHeader);
const connectedAppHeader = connect(mapStateToProps)(withRouter(Form.create()(AppHeader)));
export { connectedAppHeader as AppHeader };




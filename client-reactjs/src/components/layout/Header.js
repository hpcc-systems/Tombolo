import React, { Component } from "react";
import {Layout, Menu, message, Tooltip, Input, Button, Dropdown, Modal, Alert, Form, notification} from 'antd/lib';
import { NavLink, Switch, Route, withRouter } from 'react-router-dom';
import { userActions } from '../../redux/actions/User';
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js"
import { hasAdminRole } from "../common/AuthUtil.js";
import { applicationActions } from '../../redux/actions/Application';
import {dataflowAction} from "../../redux/actions/Dataflow"
import { groupsActions } from '../../redux/actions/Groups';
import { assetsActions } from '../../redux/actions/Assets';
import { QuestionCircleOutlined, DownOutlined  } from '@ant-design/icons';
import $ from 'jquery';
import {Constants} from "../common/Constants"
import {store} from "../../redux/store/Store"
import { debounce } from "lodash";
import logo from  "../../images/logo.png"

const { Header, Content } = Layout;
const { Search } = Input;

class AppHeader extends Component {
    pwdformRef = React.createRef();
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
      confirmnewpassword: '',
      isAboutModalVisible: false
    }

    handleRef() {      
      const appDropdownItem = this.appDropDown.current.querySelector('[data-value="'+localStorage.getItem("activeProjectId")+'"]');
      //if no activeProjectId select the first application by default.
      if(appDropdownItem == null && this.state.applications.length > 0) {
        this.setState({ selected: this.state.applications[0].display });
        this.props.dispatch(applicationActions.applicationSelected(this.state.applications[0].value, this.state.applications[0].display));
        localStorage.setItem("activeProjectId", this.state.applications[0].value);
      } else {
        appDropdownItem.click();
      }
    }    

    debouncedHandleRef = debounce(() => {
      this.handleRef();
    }, 100)

    componentWillReceiveProps(props) {
      if(props.application && props.application.applicationTitle!=''){
        this.setState({ selected: props.application.applicationTitle });
        $('[data-toggle="popover"]').popover('disable');
      }
    }

    componentDidMount(){
      if(this.props.location.pathname.includes('manualJobDetails')){
        return; 
      }
      if(this.props.location.pathname.includes('report/')){
        const pathSnippets = this.props.location.pathname.split('/');
        this.setState({
          searchText: pathSnippets[2]
        });
      }

      if(this.state.applications.length === 0) {
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
            //this.handleRef();
            this.debouncedHandleRef();
            this.props.dispatch(applicationActions.getClusters());
            this.props.dispatch(applicationActions.getConsumers())
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
      nav = (nav == '/' ? ('/'+this.props.applicationId.applicationId+'/assets') : nav)
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
      //reset the group heiracrhy selection
      this.props.dispatch(groupsActions.groupExpanded({'id':'', 'key':'0-0'}, ['0-0']));
      //reset cluster selectiong
      this.props.dispatch(assetsActions.clusterSelected(''));
      this.props.dispatch(userActions.logout());

      this.props.history.push('/login');
      message.success('You have been successfully logged out. ');
    }

    handleChange(event) {
      this.props.dispatch(applicationActions.applicationSelected(event.target.getAttribute("data-value"), event.target.getAttribute("data-display")));
      localStorage.setItem("activeProjectId", event.target.getAttribute("data-value"));
      this.setState({ selected: event.target.getAttribute("data-display") });
      $('[data-toggle="popover"]').popover('disable');
    }    

    openHelpNotification = () => {
      const key = `open${Date.now()}`;
      notification.open({
        message: 'Hello',
        description:
          'Welcome '+this.props.user.firstName+' '+this.props.user.lastName+'. Please make sure you check out the User Guide under Help option.',
        key,
        onClose: this.close(),
        icon: <QuestionCircleOutlined />,
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

    handleOk = async () => {
      let _self=this;
      const values = await this.pwdformRef.current.validateFields();

      this.setState({loading: true });
      fetch("/api/user/changePassword", {
        method: 'post',
        headers: authHeader(),
        body: JSON.stringify({"username": this.props.user.username, "oldpassword":this.state.oldpassword, "newpassword": this.state.newpassword, "confirmnewpassword": this.state.confirmnewpassword})
      }).then((response) => {
        if(response.ok) {
          return response.json();
        }        
        else {
          throw response;
        }
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
      this.pwdformRef.current.setFieldsValue({
        oldpassword: '',
        newpassword: '',
        confirmnewpassword: ''
      })
    }

    handleAboutClose = () => {
      this.setState({
        isAboutModalVisible: false
      });
    }

    openAboutModal = () => {
      this.setState({
        isAboutModalVisible: true
      });
    }

  render() {
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
        <Menu.Item key="1"><a href="" type="link" target={"_blank"} rel="noopener noreferrer" href={process.env.PUBLIC_URL + "/Tombolo-User-Guide.pdf"}>User Guide</a></Menu.Item>
        <Menu.Item key="2"><a href="#" onClick={this.openAboutModal}>About</a></Menu.Item>
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
            <a href="/" className="navbar-left" style={{marginRight: "40px"}}><img src={logo} /></a>
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
              </ul>
              <ul className="ml-md-auto navbar-nav">
                {/*<li className="nav-item">
                  <Search
                    name="searchText"
                    placeholder="Search"
                    onSearch={this.search}
                    onChange={this.onChangeSearch}
                    style={{ width: 200, paddingRight:"5px" }} />
                </li>*/}
                <li style={{ paddingRight:"5px" }}>
                  <Dropdown overlay={helpMenu} trigger={['click']}>
                    <Button shape="round">
                      <i className="fa fa-lg fa-question-circle"></i><span style={{paddingLeft:"5px"}}>Help <DownOutlined /></span>
                    </Button>
                  </Dropdown>
                </li>
                <li>
                  <Dropdown overlay={userActionMenu} style={{paddingLeft:"5px"}} trigger={['click']}>
                    <Button shape="round">
                      <i className="fa fa-lg fa-user-circle"></i><span style={{paddingLeft:"5px"}}>{this.props.user.firstName + " " + this.props.user.lastName} <DownOutlined /></span>
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
          <Form ref={this.pwdformRef}>
            <Form.Item {...formItemLayout} name="oldpassword" label="Password" rules={[{ required: true, message: 'Please enter the current password!' }]}>
              <Input type="password" name="oldpassword" placeholder="Password" onChange={this.handleChangePasswordFieldChange}/>
            </Form.Item>

            <Form.Item {...formItemLayout} name="newpassword" label="New Password" rules={[{ required: true, message: 'Please enter the new password!' }]}>
              <Input type="password" name="newpassword" placeholder="New Password" onChange={this.handleChangePasswordFieldChange}/>
            </Form.Item>

            <Form.Item {...formItemLayout} name="confirmnewpassword" label="Confirm Password" rules={[{ required: true, message: 'Please confirm the new password!' }]}>
              <Input type="password" name="confirmnewpassword" placeholder="Confirm Password" onChange={this.handleChangePasswordFieldChange}/>
          </Form.Item>
          </Form>
        </Modal>
        <Modal title="Tombolo" visible={this.state.isAboutModalVisible}
          footer={[
            <Button key="close" onClick={this.handleAboutClose}>
              Close
            </Button>
            ]}>
          <p className="float-left font-weight-bold">Tombolo v{process.env.REACT_APP_VERSION}</p>

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
const connectedAppHeader = connect(mapStateToProps)(withRouter(AppHeader));
export { connectedAppHeader as AppHeader };
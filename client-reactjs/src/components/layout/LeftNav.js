import React, { Component } from "react";
import {
  Layout, Menu, Icon, Breadcrumb
} from 'antd/lib';
import $ from 'jquery';
import {
  Link,
  NavLink,
  withRouter,
} from "react-router-dom";
import { connect } from 'react-redux';
import { hasAdminRole, hasEditPermission } from "../common/AuthUtil.js";
import { dataflowReducer } from "../../redux/reducers/DataflowReducer.js";

const { Sider, Content } = Layout;
const { SubMenu } = Menu;

class LeftNav extends Component {
  state = {
    current: '/files',
    collapsed: true,
    selectedTopNav: this.props.selectedTopNav,
  };

  
  componentDidUpdate() {
    $('[data-toggle="popover"]').popover({placement : 'right', trigger: 'focus',
     title: 'Application', html:true, 
     content:'Please select an application from the dropdown or create a new application using Applications option under Settings'});
    var _self=this;
    $('[data-toggle="popover"]').click(function(event) {
      if(!_self.props.application || _self.props.application.applicationId == '') {
        event.preventDefault();
      }
    })
  }

  handleClick = (e) => {
    this.setState({
      current: e.key,
    });
  }

  onCollapse = (collapsed) => {
    this.setState({ collapsed });

  }

  render() {
    const selectedTopNav = window.location.pathname;
    const applicationId = this.props.application ? this.props.application.applicationId : '';
    if(!this.props.loggedIn || !this.props.user || Object.getOwnPropertyNames(this.props.user).length ==0) {
      //this.props.history.push("/login");
      return false;
    }
    const isAdmin = hasAdminRole(this.props.user);
    const canEdit = hasEditPermission(this.props.user);
    //render the LeftNav only if an application is selected
    /*if((!this.props.isApplicationSet && (selectedTopNav == "/files")) || selectedTopNav == '/login')
      return false;*/
    if(selectedTopNav == '/login')
        return false;
    return (
      <React.Fragment>
      <Sider style={{ background: '#343a40', height: '100vh', paddingTop:"60px"}}
            collapsible
            collapsed={this.state.collapsed}
            onCollapse={this.onCollapse}
            width={150}
            collapsedWidth={55}
      >
          <nav className="d-md-block bg-dark sidebar">
          <div className="sidebar-sticky"  >
            <ul className="nav flex-column" >
              {/*<li className="nav-item">
                <NavLink to={"/"+applicationId+"/data-dictionary"} className="nav-link" data-toggle="popover" tabIndex="1"><i className="fa fa-lg fa-table"></i> <span className={this.state.collapsed ? "d-none" : ""}>Data Dictionary</span></NavLink>
              </li>*/}
              <li className="nav-item">
                <NavLink to={"/"+applicationId+"/assets"} className="nav-link" data-toggle="popover" tabIndex="2"><i className="fa fa-lg fa-cubes"></i> <span className={this.state.collapsed ? "d-none" : ""}>Assets</span></NavLink>
              </li>
              {/*<li className="nav-item">
                <NavLink to={"/"+applicationId+"/api"} className="nav-link" data-toggle="popover" tabIndex="4"><i className="fa fa-lg fa-rocket"></i> <span className={this.state.collapsed ? "d-none" : ""}>API</span></NavLink>
              </li>
              <li className="nav-item">
                <NavLink to={"/"+applicationId+"/queries"} className="nav-link" data-toggle="popover" tabIndex="5"><i className="fa fa-lg fa-search"></i> <span className={this.state.collapsed ? "d-none" : ""}>Queries</span></NavLink>
              </li>*/}
              {/* <li className="nav-item dropdown"> */}
                {/* <a className="nav-link dropdown-toggle" href="#"><i className="fa fa-lg fa-random"></i> <span className={this.state.collapsed ? "d-none" : ""}>Workflow</span></a> */}
                  <ul className="list-unstyled bg-dark text-light submenu level-1">
                  <li className="nav-item" >
                    <NavLink to={this.props.dataflowId.id ?  "/"+applicationId+"/dataflow/details" : "/"+applicationId+"/dataflow"} className="nav-link" data-toggle="popover" tabIndex="3">
                    {/* <i className="fa fa-lg fa-clock-o"></i> */}
                    <i className="fa fa-lg fa-random"></i>
                      <span className={this.state.collapsed ? "d-none" : ""}>Definitions</span>
                    </NavLink>
                  </li>
                  <li className="nav-item" >
                    <NavLink to={"/"+applicationId+"/dataflowinstances"} className="nav-link" data-toggle="popover" tabIndex="4">
                      <i className="fa fa-lg fa-microchip"></i> <span className={this.state.collapsed ? "d-none" : ""}>Job Execution</span>
                    </NavLink>
                  </li>
                </ul>
              {/* </li>  */}


              {/*<li className="nav-item" >
                <NavLink to={"/"+applicationId+"/chart"} className="nav-link" data-toggle="popover" tabIndex="5"><i className="fa fa-lg fa-bar-chart"></i> <span className={this.state.collapsed ? "d-none" : ""}>Report</span></NavLink>
              </li>*/}
            </ul>
            { canEdit ?
            <React.Fragment>
            <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
              <span className={this.state.collapsed ? "d-none" : ""}>Settings</span>
              <a className="d-flex align-items-center text-muted" href="#">
                <span data-feather="plus-circle"></span>
              </a>
            </h6>
            <ul className="nav flex-column mb-2">
              <li className="nav-item">
                <NavLink to={"/admin/clusters"} className="nav-link"><i className="fa fa-lg fa-server"></i><span className={this.state.collapsed ? "d-none" : ""}> Clusters</span></NavLink>
              </li>
              <li className="nav-item">
                <NavLink to={"/admin/consumers"} className="nav-link"><i className='fa fa-lg fa-user-circle'></i><span className={this.state.collapsed ? "d-none" : ""}> Collaborator</span></NavLink>
              </li>
            </ul>


            </React.Fragment>
            : null}

            { isAdmin ?
              <React.Fragment>
            <h6 className="sidebar-heading d-flex justify-content-between align-items-center px-3 mt-4 mb-1 text-muted">
              <span className={this.state.collapsed ? "d-none" : ""}>Admin</span>
              <a className="d-flex align-items-center text-muted" href="#">
                <span data-feather="plus-circle"></span>
              </a>
            </h6>

            <ul className="nav flex-column mb-2">
              {/*<li className="nav-item">
                <NavLink to={"/admin/users"} className="nav-link"><i className="fa fa-lg fa-desktop"></i><span className={this.state.collapsed ? "d-none" : ""}> Users</span></NavLink>
              </li>*/}
              <li className="nav-item">
                <NavLink to={"/admin/applications"} className="nav-link"><i className="fa fa-lg fa-desktop"></i><span className={this.state.collapsed ? "d-none" : ""}> Applications</span></NavLink>
              </li>
              <li className="nav-item">
                <NavLink to={"/admin/fileUpload"} className="nav-link"><i className="fa fa-lg fa-upload"></i><span className={this.state.collapsed ? "d-none" : ""}> Applications</span></NavLink>
              </li>
              {/*}
              <li className="nav-item">
                <NavLink to={"/admin/controlsAndRegulations"} className="nav-link"><i className='fa fa-lg fa-address-card-o'></i><span className={this.state.collapsed ? "d-none" : ""}> Compliance</span></NavLink>
              </li>*/}
            </ul>
            </React.Fragment>
            : null}
          </div>
        </nav>
      </Sider>
    </React.Fragment>
    );
  }

}

function mapStateToProps(state) {
  const { application, selectedTopNav } = state.applicationReducer;
  const { loggedIn, user} = state.authenticationReducer;
  const {dataflowId} = state.dataflowReducer;
  return {
      application,
      selectedTopNav,
      loggedIn,
      user,
      dataflowId
  };
}

const connectedLeftNav = connect(mapStateToProps)(withRouter(LeftNav));
export { connectedLeftNav as LeftNav };

//export default withRouter(LeftNav);
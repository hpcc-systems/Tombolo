import React, { Component } from "react";
import { Link } from "react-router-dom";
import { connect } from 'react-redux';
import { hasAdminRole, hasEditPermission } from "../common/AuthUtil.js";
import Title from "antd/lib/typography/Title";
import { Layout, Menu } from 'antd/lib';

const { Sider } = Layout;

class LeftNav extends Component {
  state = {
    current: '/files',
    collapsed: true,
    selectedTopNav: this.props.selectedTopNav,
  };

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
        <Sider
          collapsible 
          collapsed={this.state.collapsed}
          onCollapse={this.onCollapse} 
          collapsedWidth={55}
          style={{backgroundColor:'#343a40'}} 
         >
          <Menu theme="dark"  mode="inline" defaultSelectedKeys={['1']}  style={{backgroundColor:'#343a40', maxWidth:'100%', paddingTop:"80px"}} >

              <Menu.Item key="1" icon={<i className="fa fa-fw fa-cubes"></i>}>         
                <Link to={"/"+applicationId+"/assets"}>
                    Assets
                </Link>
              </Menu.Item>

              <Menu.Item key="2" icon={<i className="fa fa-fw fa-random"/>}>         
                <Link to={this.props.dataflowId.id ?  "/"+applicationId+"/dataflow/details" : "/"+applicationId+"/dataflow"}>
                    Definitions
                </Link>
              </Menu.Item>

              <Menu.Item key="3" icon={<i className="fa fa-fw fa-microchip"/>}>         
                <Link to={"/"+applicationId+"/dataflowinstances"}>
                  Job Execution
                </Link>
              </Menu.Item> 

            
              {canEdit ? 
                <>
                  {this.state.collapsed ? null : <Title style={{fontSize:'24px'}} ellipsis={true} className="px-3 mt-4 mb-1 text-muted" >Settings</Title>}
                  <Menu.Item key="4" icon={<i className="fa fa-fw fa-telegram"/>}>         
                    <Link to={"/"+applicationId+"/actions"}>
                      Actions
                    </Link>
                  </Menu.Item>
                  <Menu.Item key="5" icon={<i className="fa fa-fw fa-server"/>}>         
                    <Link to={"/admin/clusters"}>
                      Clusters
                    </Link>
                  </Menu.Item>

                  <Menu.Item key="6" icon={<i className="fa fa-fw fa-github"/>}>         
                    <Link to={"/admin/github"}>
                      Github projects
                    </Link>
                  </Menu.Item>
                      
                  <Menu.Item key="7" icon={<i className="fa fa-fw fa-user-circle"/>}>         
                    <Link to={"/admin/consumers"}>
                      Collaborator
                    </Link>
                  </Menu.Item>
                  {this.state.collapsed ? null : <Title style={{fontSize:'24px'}} ellipsis={true} className="px-3 mt-4 mb-1 text-muted" >Admin</Title>}
                  <Menu.Item key="8" icon={<i className="fa fa-fw fa-desktop"/>}>         
                    <Link to={"/admin/applications"}>
                      Applications
                    </Link>
                  </Menu.Item>
                </>
                : null } 
          </Menu>
        </Sider>
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

const connectedLeftNav = connect(mapStateToProps)(LeftNav);
export { connectedLeftNav as LeftNav };

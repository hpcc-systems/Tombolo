import React, { Component } from "react";
import { Link, withRouter } from "react-router-dom";
import { connect } from 'react-redux';
import { hasAdminRole, hasEditPermission } from "../common/AuthUtil.js";
import { Layout, Menu, Typography} from 'antd';

const { Sider } = Layout;

class LeftNav extends Component {
  state = {
    current: '1',
    selectedTopNav: this.props.selectedTopNav,
  };

  componentDidUpdate(prevProps) {
    const applicationId= this.props.application?.applicationId;
    const prevApplicationId = prevProps?.application?.applicationId;
    if (applicationId && prevApplicationId) {
      if (applicationId !== prevApplicationId ){
        // if current app and prev app is not same we are redirected to /appid/asset page, so we will reset menu highlight
        this.setState({ current: "1" });
      }
    }
  }

  componentDidMount() {
    const options = {
      dataflow:'2',
      dataflowinstances: '3',
      actions:'4',
      clusters:'5',
      github:'6',
      consumers:'7',
      applications:'8',
    };
    
    // on init we check pathname if it contains options key in name, if it does => highlight that menu item
    for (const key in options) {
      let path = this.props.history.location.pathname;
      if (path.includes(key)){
        this.setState({ current: options[key] })
      }
    }
  }

  handleClick = ({ item, key, keyPath, domEvent}) => {
    this.setState({ current: key, });
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
          collapsed={this.props.collapsed}
          onCollapse={this.props.onCollapse} 
          collapsedWidth={55}
          style={{
            backgroundColor:this.props.BG_COLOR,
            marginTop:'46px',
            overflow: 'auto',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100
          }}
         >
          <Menu
           theme="dark"  
           mode="inline" 
           onClick={this.handleClick}  
           defaultSelectedKeys={['1']} 
           selectedKeys={[this.state.current]}
           style={{backgroundColor:this.props.BG_COLOR, maxWidth:'100%',height:'100%'}} >

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
                  {this.props.collapsed ? null : <Typography.Title ellipsis={true} className="left-nav-title" >Settings</Typography.Title>}
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
                  {this.props.collapsed ? null : <Typography.Title ellipsis={true} className="left-nav-title" >Admin</Typography.Title>}
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

const connectedLeftNav = connect(mapStateToProps,null,null,{forwardRef:true})(withRouter(LeftNav));
export { connectedLeftNav as LeftNav };
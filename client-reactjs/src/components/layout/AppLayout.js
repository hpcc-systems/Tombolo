import React, { Component } from "react";
import {
  Layout, Menu, Breadcrumb,
} from 'antd/lib';
import {
  Route,
  NavLink,
  BrowserRouter as Router,
  withRouter,
  Switch
} from "react-router-dom";
import { SettingOutlined, AppstoreOutlined } from '@ant-design/icons';

import ApplicationsList from "../application/ApplicationsList";
import LeftNav from "./LeftNav";
import FileList from "../application/FileList";
import IndexList from "../application/IndexList";
import Dashboard from "../application/Dashboard";
import Queries from "../application/Queries";

import AdminApplications from "../admin/Applications";
import AdminClusters from "../admin/Clusters";
import {PrivateRoute} from "../common/PrivateRoute";

const { Header, Content, Sider } = Layout;

class AppLayout extends Component {
  constructor(props) {
    super(props);
    this.onAppicationSelect = this.onAppicationSelect.bind(this);
  }

  state = {
    applicationId: '',
    selectedTopNav: '/'
  }

  onAppicationSelect(value) {
    this.setState({
      applicationId: value
    });
  }

  handleTopNavClick(topNav, event) {
    this.setState({
      selectedTopNav: topNav.key
    });

  }

  render() {
    const isApplicationSet = (this.state.applicationId != '') ? true : false;
    const selectedTopNav = (window.location.pathname.indexOf("/admin") != -1) ? "/admin/applications" : "/"
    return (
          <Layout>
            <Header className="header" style={{ padding: "0 20px" }}>
              <div className="logo"><span>Tombolo</span></div>
                <ApplicationsList style={{ padding: "20px 0" }} onAppicationSelect={this.onAppicationSelect}/>
                <Menu
                  theme="dark"
                  mode="horizontal"
                  selectedKeys={[selectedTopNav]}
                  style={{ lineHeight: '64px', width: '200px', float:"right" }}
                  onClick={(key, event) => {this.handleTopNavClick(key, event)}}
                >
                  <Menu.Item key="/"><NavLink exact to="/"><span><AppstoreOutlined /></span></NavLink></Menu.Item>
                  <Menu.Item key="/admin/applications"><NavLink to="/admin/applications"><span><SettingOutlined /></span></NavLink></Menu.Item>
                </Menu>
            </Header>
            {isApplicationSet ?
            <Layout>
              <LeftNav applicationId={this.state.applicationId} selectedTopNav={selectedTopNav}/>
              <Layout style={{ padding: '0 24px 24px'}}>
                <Content style={{
                  background: '#fff', padding: 24, margin: 0, height: "100vh"
                }}
                >

                </Content>
              </Layout>
            </Layout> : null }
          </Layout>

    );
  }
}

export default AppLayout;
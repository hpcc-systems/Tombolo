import React from "react";
import { connect } from "react-redux";
import { Layout } from "antd/lib";
import "font-awesome/css/font-awesome.min.css";
import { Router, Route, Switch } from "react-router-dom";
import { Redirect } from 'react-router'
import history from "./components/common/History";
import { LoginPage } from "./components/login/LoginPage";
import ForgotPassword from "./components/login/ForgotPassword";
import ResetPassword from "./components/login/ResetPassword";
import { PrivateRoute } from "./components/common/PrivateRoute";
import Assets from "./components/application/Assets";
import { LeftNav } from "./components/layout/LeftNav";
import DataDictionary from "./components/application/DataDictionary";
import Dataflow from "./components/application/Dataflow";
import DataflowDetails from "./components/application/Dataflow/DataflowDetails";
import { DataflowInstances } from "./components/application/DataflowInstances/DataflowInstances";
import { DataflowInstanceDetails } from "./components/application/DataflowInstances/DataflowInstanceDetails";
import Users from "./components/admin/Users";
import FileDetailsForm from "./components/application/FileDetails";
import FileTemplate from "./components/application/templates/FileTemplate"
import JobDetailsForm from "./components/application/Jobs/JobDetails";
import IndexDetailsForm from "./components/application/IndexDetails";
import QueryDetailsForm from "./components/application/QueryDetails";
import VisualizationDetailsForm from "./components/application/VisualizationDetails";

import ManualJobDetail from "./components/application/Jobs/ManualJobDetail"

import Actions from "./components/application/actions/actions";
import { AdminApplications } from "./components/admin/apps/Applications";
import AdminClusters from "./components/admin/Clusters";
import { AdminConsumers } from "./components/admin/Consumers";
import { AppHeader } from "./components/layout/Header";
import { userActions } from "./redux/actions/User";
import { store } from "./redux/store/Store";

import { Report } from "./components/Report/Report";
import Regulations from "./components/admin/ControlsAndRegulations";
import GitHubSettings from "./components/admin/GitHubSettings/GitHubSettings";
const { Content } = Layout;

class App extends React.Component {  
  componentDidMount() {
    store.dispatch(userActions.validateToken());
  }

  render() {
    const isApplicationSet =
      this.props.application && this.props.application.applicationId != ""
        ? true
        : false;
    const selectedTopNav =
      this.props.selectedTopNav &&
      this.props.selectedTopNav.indexOf("/admin") != -1
        ? "/admin/applications"
        : "/files";
    const dataFlowComp = () => {
      let applicationId = this.props.application
        ? this.props.application.applicationId
        : "";
      let applicationTitle = this.props.application
        ? this.props.application.applicationTitle
        : "";
      return (
        <Dataflow
          applicationId={applicationId}
          applicationTitle={applicationTitle}
          user={this.props.user}
        />
      );
    };
    const dataDictionaryComp = () => {
      let applicationId = this.props.application
        ? this.props.application.applicationId
        : "";
      let applicationTitle = this.props.application
        ? this.props.application.applicationTitle
        : "";
      return (
        <DataDictionary
          applicationId={applicationId}
          applicationTitle={applicationTitle}
          user={this.props.user}
        />
      );
    };
    
    const getAssets = () => {
      const applicationId = this.props.application?.applicationId;
      if (applicationId) {
        return <Redirect to={`/${applicationId}/assets`} />;
      } else {
        return <Assets />;
      }
    };
    

    return (
      <Router history={history}>
        <Route exact path="/login" component={LoginPage} />
        <Route exact path="/forgot-password" component={ForgotPassword} />
        <Route exact path="/reset-password/:id" component={ResetPassword} />
        <Layout>
          {this.props.user && this.props.user.token ? <AppHeader /> : null}
          <Layout className="site-layout">
            <LeftNav
              isApplicationSet={isApplicationSet}
              selectedTopNav={selectedTopNav}
            />
            <Layout
              style={{ height: "100vh", overflow: "auto", paddingTop: "60px" }}
            >
              <Content style={{ background: "#fff", margin: "0 16px" }}>
                <Switch>
                  <PrivateRoute exact path="/" component={getAssets} />
                  <PrivateRoute
                    path="/:applicationId/assets/file/:fileId?"
                    component={FileDetailsForm}
                  />
                  <PrivateRoute
                    path="/:applicationId/assets/fileTemplate/:fileId?"
                    component={FileTemplate}
                  />
                  <PrivateRoute
                    path="/:applicationId/assets/job/:jobId?"
                    component={JobDetailsForm}
                  />
                  <PrivateRoute
                    path="/:applicationId/assets/index/:indexId?"
                    component={IndexDetailsForm}
                  />
                  <PrivateRoute
                    path="/:applicationId/assets/query/:queryId?"
                    component={QueryDetailsForm}
                  />
                  <PrivateRoute
                    path="/:applicationId/assets/visualizations/:visualizationId?"
                    component={VisualizationDetailsForm}
                  />
                 
                  <PrivateRoute
                    path="/:applicationId/assets"
                    component={Assets}
                  />
                  <PrivateRoute
                    path="/:applicationId/data-dictionary"
                    component={dataDictionaryComp}
                  />
                  <PrivateRoute
                    path="/:applicationId/dataflow/details/:dataflowId?"
                    component={DataflowDetails}
                  />
                  <PrivateRoute
                    path="/:applicationId/dataflow"
                    component={dataFlowComp}
                  />
                  <PrivateRoute
                    path="/admin/applications"
                    component={AdminApplications}
                  />
                  <PrivateRoute
                    path="/admin/clusters"
                    component={AdminClusters}
                  />

                  <PrivateRoute path="/admin/github" component={GitHubSettings} />
                  <PrivateRoute path="/admin/users" component={Users} />
                  <PrivateRoute path="/report/:searchText" component={Report} />
                  <PrivateRoute
                    path="/admin/consumers"
                    component={AdminConsumers}
                  />
                  <PrivateRoute
                    path="/admin/controlsAndRegulations"
                    component={Regulations}
                  />
                  <PrivateRoute
                    path="/:applicationId/dataflowinstances/dataflowInstanceDetails/:dataflowId?/:executionGroupId?"
                    component={DataflowInstanceDetails}
                  />
                  <PrivateRoute
                    path="/:applicationId/dataflowinstances"
                    component={DataflowInstances}
                  />
                    <PrivateRoute
                    path="/:applicationId/actions"
                    component={Actions}
                  />
                  <PrivateRoute
                    path="/:applicationId/manualJobDetails/:jobId/:jobExecutionId"
                    component={ManualJobDetail}
                  /> 
                </Switch>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </Router>
    );
  }
}

function mapStateToProps(state) {
  const { application, selectedTopNav } = state.applicationReducer;
  const { user } = state.authenticationReducer;
  return {
    application,
    selectedTopNav,
    user,
  };
}

const connectedApp = connect(mapStateToProps)(App);
export { connectedApp as App };
//export default App;

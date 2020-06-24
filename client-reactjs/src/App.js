import React from 'react';
import { connect } from 'react-redux';
import {
    Layout
  } from 'antd/lib';
import 'font-awesome/css/font-awesome.min.css';
import { Router, Route, Switch } from 'react-router-dom';
import history from './components/common/History';
import {LoginPage} from "./components/login/LoginPage";
import {PrivateRoute} from "./components/common/PrivateRoute";

import {LeftNav} from "./components/layout/LeftNav";
import AssetDetails from "./components/application/AssetDetails";
import {FileList} from "./components/application/FileList";
import {IndexList} from "./components/application/IndexList";
import Dashboard from "./components/application/Dashboard";
import {QueriesList} from "./components/application/QueriesList";
import Dataflow from "./components/application/Dataflow";
import {DataflowInstances} from "./components/application/DataflowInstances/DataflowInstances";
import {DataflowInstanceDetails} from "./components/application/DataflowInstances/DataflowInstanceDetails";
import Users from "./components/admin/Users";

import {AdminApplications} from "./components/admin/Applications";
import AdminClusters from "./components/admin/Clusters";
import {AdminConsumers} from "./components/admin/Consumers";
import {AppHeader} from './components/layout/Header';
import { userActions } from './redux/actions/User';
import { store } from './redux/store/Store';

import {Report} from "./components/Report/Report";
import {Chart} from "./components/application/Chart";
import Regulations from "./components/admin/ControlsAndRegulations";
const { Content } = Layout;

class App extends React.Component {
    constructor(props) {
        super(props);
    }
    componentDidMount() {
      store.dispatch(userActions.validateToken());
    }  

    render() {
      const isApplicationSet = (this.props.application && this.props.application.applicationId != '') ? true : false;
      const selectedTopNav = (this.props.selectedTopNav && this.props.selectedTopNav.indexOf("/admin") != -1) ? "/admin/applications" : "/files"
      const dataFlowComp = () => {
        let applicationId = this.props.application ? this.props.application.applicationId : '';
        let applicationTitle = this.props.application ? this.props.application.applicationTitle : '';
        return <Dataflow applicationId={applicationId} applicationTitle={applicationTitle} user={this.props.user}/>;
      }      

      return (
          <Router history={history}>
          <div>
              <Route exact path="/login" component={LoginPage} />
                <Layout>
                    {this.props.user && this.props.user.token ? <AppHeader/> : null}
                    <Layout className="site-layout">
                        <LeftNav isApplicationSet={isApplicationSet} selectedTopNav={selectedTopNav} />
                        <Layout style={{height: '100vh'}}>
                            <Content style={{background: '#fff', margin: '0 16px'}}>                                    
                                <Switch>
                                  <PrivateRoute exact path="/" component={dataFlowComp}/>
                                  <PrivateRoute path="/details/:assetType/:applicationId/:fileId" component={AssetDetails} />
                                  <PrivateRoute exact path="/:applicationId/files" component={FileList} />
                                  <PrivateRoute path="/files" component={FileList} />
                                  <PrivateRoute exact path="/:applicationId/index" component={IndexList}/>
                                  <PrivateRoute path="/index" component={IndexList}/>
                                  <PrivateRoute path="/:applicationId/queries" component={QueriesList}/>
                                  <PrivateRoute path="/:applicationId/dataflow" component={dataFlowComp}/>
                                  <PrivateRoute path="/:applicationId/dataflowinstances" component={DataflowInstances}/>
                                  <PrivateRoute path="/admin/applications" component={AdminApplications}/>
                                  <PrivateRoute path="/admin/clusters" component={AdminClusters}/>
                                  <PrivateRoute path="/admin/users" component={Users}/>
                                  <PrivateRoute path="/report/:searchText" component={Report}/>
                                  <PrivateRoute path="/:applicationId/Chart" component={Chart}/>
                                  <PrivateRoute path="/admin/consumers" component={AdminConsumers}/>
                                  <PrivateRoute path="/admin/controlsAndRegulations" component={Regulations}/>
                                  <PrivateRoute path="/:applicationId/dataflowInstanceDetails" component={DataflowInstanceDetails}/>
                                </Switch>

                            </Content>
                        </Layout>

                    </Layout>
                </Layout>
          </div>
      </Router>
      );
  }
}

function mapStateToProps(state) {
    const { application,selectedTopNav } = state.applicationReducer;
    const { user } = state.authenticationReducer;
    return {
        application,
        selectedTopNav,
        user
    };
}

const connectedApp = connect(mapStateToProps)(App);
export { connectedApp as App };
//export default App;

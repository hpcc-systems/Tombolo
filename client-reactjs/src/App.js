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
import {SelectedFilePopup} from "./components/application/SelectedFilePopup";
import {FileList} from "./components/application/FileList";
import {IndexList} from "./components/application/IndexList";
import Dashboard from "./components/application/Dashboard";
import {QueriesList} from "./components/application/QueriesList";
import {JobList} from "./components/application/JobList";
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
        return (
            <Router history={history}>
            <div>
                <Route exact path="/login" component={LoginPage} />
                    <Layout>
                        {this.props.user ? <AppHeader/> : null}
                        <Layout>
                            <LeftNav isApplicationSet={isApplicationSet} selectedTopNav={selectedTopNav} />
                            <Layout style={{height: '100vh'}}>
                                <Content style={{background: '#fff', paddingLeft: '200px'}}>
                                    <Route exact path="/" component={FileList}/>
                                    <Switch>
                                        <PrivateRoute exact path="/file/:applicationId/:fileId" component={SelectedFilePopup} />
                                        <PrivateRoute exact path="/:applicationId/files" component={FileList} />
                                        <PrivateRoute path="/files" component={FileList} />
                                        <PrivateRoute exact path="/:applicationId/index" component={IndexList}/>
                                        <PrivateRoute path="/index" component={IndexList}/>
                                        <PrivateRoute path="/:applicationId/queries" component={QueriesList}/>
                                        <PrivateRoute path="/:applicationId/jobs" component={JobList}/>
                                        <PrivateRoute path="/admin/applications" component={AdminApplications}/>
                                        <PrivateRoute path="/admin/clusters" component={AdminClusters}/>
                                        <PrivateRoute path="/admin/users" component={Users}/>
                                        <PrivateRoute path="/report/:searchText" component={Report}/>
                                        <PrivateRoute path="/:applicationId/Chart" component={Chart}/>
                                        <PrivateRoute path="/admin/consumers" component={AdminConsumers}/>
                                        <PrivateRoute path="/admin/controlsAndRegulations" component={Regulations}/>
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

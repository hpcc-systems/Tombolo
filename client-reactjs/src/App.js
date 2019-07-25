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
import {FileList} from "./components/application/FileList";
import {IndexList} from "./components/application/IndexList";
import Dashboard from "./components/application/Dashboard";
import {QueriesList} from "./components/application/QueriesList";
import {JobList} from "./components/application/JobList";
import Users from "./components/admin/Users";

import AdminApplications from "./components/admin/Applications";
import AdminClusters from "./components/admin/Clusters";
import {AppHeader} from './components/layout/Header';
import { userActions } from './redux/actions/User';
import { store } from './redux/store/Store';

const { Content } = Layout;

class App extends React.Component {
    constructor(props) {
        super(props);
    }
    componentWillMount(){
        var path= window.location.pathname;
        if(path.includes('/file/')){          
          var appValues=(path.replace('/file/','')).split('/');            
          var selectedFile=new Object();
          selectedFile.applicationId=appValues[0];
          selectedFile.fileId=appValues[1];
          localStorage.setItem('selectedFile', JSON.stringify(selectedFile));                
        }
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
                            <Layout>
                                <Content style={{background: '#fff', padding: '5px'}}>
                                    <Route exact path="/" component={FileList}/>
                                    <Switch>
                                    <PrivateRoute exact path="/file/:applicationId/:fileId" component={FileList} />
                                        <PrivateRoute exact path="/:applicationId/files" component={FileList} />
                                        <PrivateRoute path="/files" component={FileList} />
                                        <PrivateRoute exact path="/:applicationId/index" component={IndexList}/>
                                        <PrivateRoute path="/index" component={IndexList}/>
                                        <PrivateRoute path="/:applicationId/queries" component={QueriesList}/>
                                        <PrivateRoute path="/:applicationId/jobs" component={JobList}/>
                                        <PrivateRoute path="/admin/applications" component={AdminApplications}/>
                                        <PrivateRoute path="/admin/clusters" component={AdminClusters}/>
                                        <PrivateRoute path="/admin/users" component={Users}/>
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

import React, { Component } from "react";
import { Tabs,Spin, Button, Tooltip, Radio, Icon, Menu, Dropdown } from 'antd/lib';
import { connect } from 'react-redux';
import { authHeader, handleError } from "../common/AuthHeader.js";
import FileReport from "./FileReport.js";
import IndexReport from "./IndexReport.js";
import QueryReport from "./QueryReport.js";
import JobReport from "./JobReport.js";
const TabPane = Tabs.TabPane;
class Report extends Component {

  constructor(props) {
    super(props);
  }

  state = {
    searchText:this.props.match.params.searchText,
    fileList:[],
    indexList:[],
    queryList:[],
    jobList:[],
    refresh:true,
    defaultTab:"1",
    initialDataLoading:false
  }
  componentDidMount(){
    this.fetchData((this.props.match.params.searchText));
  }
  componentWillReceiveProps(props) {
    if(this.state.searchText!=props.match.params.searchText)
    {
       this.setState({
         searchText:props.match.params.searchText,
         refresh:true
       });
       this.fetchData((props.match.params.searchText));
    }
    else
    this.setState({
      refresh:false
    });
  }

  fetchData(val) {
    var user=this.props.user;
    var userId='';
    if(user.role=="user")
      userId=user.id;
      this.setState({
        initialDataLoading:true
      });
    fetch("/api/report/read/getReport?searchText="+val+"&userId="+userId, {
        headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      var defaultTab="";
      if(data){
        if(data.file.length>0)
          defaultTab="1";
        else if(data.index.length>0)
          defaultTab="2";
        else if(data.query.length>0)
          defaultTab="3";
        else if(data.job.length>0)
          defaultTab="4";
        else
          defaultTab="1";
      this.setState({
        fileList: data.file,
        indexList:data.index,
        queryList:data.query,
        jobList:data.job,
        defaultTab:defaultTab
      });
      setTimeout(() => {
      this.setState({
        initialDataLoading:false
      });
    }, 200);
    }
    }).catch(error => {
      console.log(error);
    });
  }
   setKey= (selectedkey) => {
    this.setState({defaultTab:selectedkey}); // <- set key sent by the handler to the state

   };
  render() {
    const fileTitle="Files ("+this.state.fileList.length+")"
    const indexTitle="Index ("+this.state.indexList.length+")"
    const queryTitle="Queries ("+this.state.queryList.length+")"
    const jobTitle="Jobs ("+this.state.jobList.length+")"
    const defTab=this.state.defaultTab;
    return (
      <div>
        <div className="loader">
        <Spin spinning={this.state.initialDataLoading} size="large" />
        </div>
        <div style={{paddingTop:"50px"}}>
        <Tabs activeKey={defTab} onTabClick={this.setKey}>
          <TabPane tab={fileTitle} key="1">
            <FileReport refresh={this.state.refresh}  fileList={this.state.fileList}/>
          </TabPane>
          <TabPane tab={indexTitle} key="2">
          <IndexReport refresh={this.state.refresh}  indexList={this.state.indexList}/>
          </TabPane>
          <TabPane tab={queryTitle} key="3">
          <QueryReport refresh={this.state.refresh}  queryList={this.state.queryList}/>
          </TabPane>
          <TabPane tab={jobTitle} key="4">
          <JobReport refresh={this.state.refresh}  jobList={this.state.jobList}/>
          </TabPane>
        </Tabs>
        </div>
      </div>)
  }
}

function mapStateToProps(state) {
  const { user } = state.authenticationReducer;
  const { application, selectedTopNav } = state.applicationReducer;
  return {
      user,
      application,
      selectedTopNav
  };
}

const connectedReport = connect(mapStateToProps)(Report);
export { connectedReport as Report };

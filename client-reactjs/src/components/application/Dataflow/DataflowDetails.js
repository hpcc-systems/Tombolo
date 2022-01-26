import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router';
import { Tabs, Button, Tooltip, notification } from 'antd/lib';
import { InfoCircleOutlined, StepBackwardOutlined  } from '@ant-design/icons';
import { useSelector } from "react-redux";
import DataflowAssetsTable from "./DataflowAssetsTable";
import {Graph} from "./Graph";
import BreadCrumbs from "../../common/BreadCrumbs";
import {Constants} from "../../common/Constants"
import {store} from "../../../redux/store/Store"
const TabPane = Tabs.TabPane;

function DataflowDetails({props}) {  
  const history = useHistory();
  // const dispatch = useDispatch();
  const [currentTab, setCurrentTab] = useState("1")
  const dataflowReducer = useSelector(state => state.dataflowReducer);
  const applicationReducer = useSelector(state => state.applicationReducer);
  const applicationId = useSelector(state => state.applicationReducer.application.applicationId);
  const [refreshGraph, setGraphRefresh] = useState(false)

  const handleBackToAllJobs = () => {
    history.push("/"+applicationReducer.application.applicationId+"/dataflow")
    store.dispatch({
      type: Constants.DATAFLOW_SELECTED,
      selectedDataflow: {dataflowId: ""}
    })
  }

  //Show how to connect node instruction
  useEffect(() =>{
    if(currentTab === "1"){
      notification.open({
        message: <span style={{display: "flex", placeItems : "center"}}>
          <InfoCircleOutlined style={{paddingRight: "10px"}}/>  <span>To connect nodes, hold down <b>SHIFT</b>  key and drag</span></span>,
        duration: 0,
        className: 'graphNotice',
        placement: 'bottomRight'
      })
    }else{
      notification.destroy()
    }
  
    //Clean up
    return() =>{
      notification.destroy()
    }
  }, [currentTab])

	return (
	  <React.Fragment>
       <div style={{display: "flex", justifyContent: "space-between"}}>
         <div className="d-flex justify-content-end">
          <BreadCrumbs
            applicationId={dataflowReducer.applicationId}
            applicationTitle={dataflowReducer.applicationTitle}
          />
        </div>
        </div>
        <div>
          <Tabs defaultActiveKey="1"
          onChange={(activeKey) => { setCurrentTab(activeKey)}}
          tabBarExtraContent = {currentTab === "1" ? <span> 
            <Tooltip placement="topRight" title={"Refresh will validate the file/job relationship and update graph accordingly"}>
                <Button style={{marginRight: "5px"}} type="primary" onClick={() =>  setGraphRefresh(!refreshGraph)}>Refresh</Button> 
            </Tooltip>
                <Button type="link" onClick={(handleBackToAllJobs)} type="primary" ghost> Cancel</Button> </span> : null}
          >
            <TabPane tab="Designer" key="1">
              <Graph
                viewMode={false}
                applicationId={dataflowReducer.applicationId}
                applicationTitle={dataflowReducer.applicationTitle}
                selectedDataflow={{id: dataflowReducer.dataflowId}}
                graphContainer="graph"
                sidebarContainer="sidebar"
                refreshGraph= {refreshGraph}
              />
            </TabPane>
            <TabPane tab="Assets" key="2" >
            <span style={{display: "flex", placeItems: "center", justifyContent: "center", paddingBottom: "5px"}}>
              <DataflowAssetsTable
                applicationId={dataflowReducer.applicationId}
                selectedDataflow={{id: dataflowReducer.dataflowId}}
                user={dataflowReducer.user}
                application={applicationReducer.application}
              />
              </span>
            </TabPane>
          </Tabs>
        </div>
     </React.Fragment>
	  )

}

export default DataflowDetails

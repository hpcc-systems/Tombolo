import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router';
import ReactDOM from 'react-dom';
import { Tabs, Button } from 'antd/lib';
import { InfoCircleOutlined, StepBackwardOutlined  } from '@ant-design/icons';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { useSelector, useDispatch } from "react-redux";
import DataflowAssetsTable from "./DataflowAssetsTable";
import {Graph} from "./Graph";
import BreadCrumbs from "../../common/BreadCrumbs";
import {Constants} from "../../common/Constants"
import {store} from "../../../redux/store/Store"
const TabPane = Tabs.TabPane;





function DataflowDetails({props}) {
  const history = useHistory();
  const dispatch = useDispatch();
  const dataflowReducer = useSelector(state => state.dataflowReducer);
  const applicationReducer = useSelector(state => state.applicationReducer);
  const applicationId = useSelector(state => state.applicationReducer.application.applicationId);

  const handleBackToAllJobs = () => {
    history.push("/"+applicationId+"/dataflow")
    store.dispatch({
      type: Constants.DATAFLOW_SELECTED,
      selectedDataflow: {dataflowId: ""}
    })
  }

	return (
	  <React.Fragment>
       <div style={{display: "flex", justifyContent: "space-between"}}>
         <div className="d-flex justify-content-end">
          <BreadCrumbs
            applicationId={dataflowReducer.applicationId}
            applicationTitle={dataflowReducer.applicationTitle}
          />
        </div>
        <Button type="link" onClick={handleBackToAllJobs} style={{display: "flex", placeItems:"center", paddingRight: "10px"}}> <StepBackwardOutlined />Definitions</Button>
        </div>
        <div>

          <Tabs defaultActiveKey="1">
            <TabPane tab="Designer" key="1">
              <span style={{display: "flex", placeItems: "center", justifyContent: "center", paddingBottom: "5px" }}>
              <InfoCircleOutlined style={{paddingRight: "8px", fontWeight: "800"}} />
            To connect nodes, hold <span style={{fontWeight: "700", paddingRight: "8px", paddingLeft: "8px"}}>  SHIFT </span> key and drag
              </span>

              <Graph
                applicationId={dataflowReducer.applicationId}
                applicationTitle={dataflowReducer.applicationTitle}
                selectedDataflow={dataflowReducer.dataflowId}
                graphContainer="graph"
                sidebarContainer="sidebar"
              />
            </TabPane>
            <TabPane tab="Assets" key="2">
              <DataflowAssetsTable
                applicationId={dataflowReducer.applicationId}
                selectedDataflow={dataflowReducer.dataflowId}
                user={dataflowReducer.user}
                application={applicationReducer.application}
              />
            </TabPane>
   
          </Tabs>
        </div>
     </React.Fragment>
	  )

}

export default DataflowDetails

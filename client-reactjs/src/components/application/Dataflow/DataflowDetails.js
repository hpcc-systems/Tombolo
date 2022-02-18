import React, { useState } from 'react'
import { useHistory } from 'react-router';
import { Tabs, Button, } from 'antd/lib';
import { useSelector } from "react-redux";
import DataflowAssetsTable from "./DataflowAssetsTable";
import BreadCrumbs from "../../common/BreadCrumbs";
import {Constants} from "../../common/Constants"
import {store} from "../../../redux/store/Store"
import GraphX6 from '../Graph/GraphX6';
const TabPane = Tabs.TabPane;

function DataflowDetails({props}) {  
  const history = useHistory();
  // const dispatch = useDispatch();
  const [currentTab, setCurrentTab] = useState("1")
  const dataflowReducer = useSelector(state => state.dataflowReducer);
  const applicationReducer = useSelector(state => state.applicationReducer);

  const handleBackToAllJobs = () => {
    history.push("/"+applicationReducer.application.applicationId+"/dataflow")
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
        </div>
        <div>
          <Tabs defaultActiveKey="1"
          onChange={(activeKey) => { setCurrentTab(activeKey)}}
          tabBarExtraContent = {currentTab === "1" ? <span> 
                <Button type='primary' onClick={(handleBackToAllJobs)}  ghost> Cancel</Button> </span> : null}
          >
            <TabPane tab="Designer" key="1" forceRender={true}>
              <GraphX6 readOnly={false} />
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

import React from 'react';
import { useSelector } from 'react-redux';
import { Tabs } from 'antd/lib';
import LandingZoneUpload from "./LandingZoneUpload";
import BreadCrumbs from "../../common/BreadCrumbs";


function Actions() {
    const applicationReducer = useSelector(state => state.applicationReducer);
    const TabPane = Tabs.TabPane;
    return (
        <div>
         <div style={{display: "flex", justifyContent: "space-between"}}>
         <div className="d-flex justify-content-end">
          <BreadCrumbs
            applicationId={applicationReducer.application.applicationId}
            applicationTitle={applicationReducer.application.applicationTitle}
          />
        </div>
        </div>
            <Tabs defaultActiveKey="1">
                <TabPane tab="File Upload" key="1">
                    <LandingZoneUpload/>
                </TabPane>
          </Tabs>
        </div>
    )
}

export default Actions

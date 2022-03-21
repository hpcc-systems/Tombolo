import React from 'react';
import { useHistory, useParams } from 'react-router';
import { Tabs, Button, Spin } from 'antd/lib';
import DataflowAssetsTable from './DataflowAssetsTable';
import BreadCrumbs from '../../common/BreadCrumbs';
import GraphX6 from '../Graph/GraphX6';
import useSelectDataflow from '../../../hooks/useSelectDataflow';
const TabPane = Tabs.TabPane;

function DataflowDetails() {
  const history = useHistory();
  const params = useParams();

  const {isDataflowReady, applicationId, applicationTitle} = useSelectDataflow(); // this hook will check if dataflow is present in redux, if not it will request data from DB and update redux

  const handleBackToAllJobs = () => {
    history.push(`/${params.applicationId}/dataflow`);
  };

  if (!isDataflowReady)
  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop:'50px' }}>
      <Spin size="large" spinning={true} />;
    </div>
  );


  return (
    <React.Fragment>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="d-flex justify-content-end">
          <BreadCrumbs applicationId={applicationId} applicationTitle={applicationTitle} />
        </div>
      </div>
      <div>
        <Tabs
          defaultActiveKey="1"
          tabBarExtraContent={ <span> <Button type="primary" onClick={handleBackToAllJobs} ghost> Cancel </Button> </span> }
        >
          <TabPane tab="Designer" key="1" forceRender={true}>
            <GraphX6 readOnly={false} />
          </TabPane>
          <TabPane tab="Assets" key="2">
            <DataflowAssetsTable />
          </TabPane>
        </Tabs>
      </div>
    </React.Fragment>
  );
}

export default DataflowDetails;

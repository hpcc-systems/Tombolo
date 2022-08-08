import React from 'react';
import { useHistory, useParams } from 'react-router';
import { Tabs, Button, Spin } from 'antd';
import DataflowAssetsTable from './DataflowAssetsTable';
import BreadCrumbs from '../../common/BreadCrumbs';
import GraphX6 from '../Graph/GraphX6';
import useSelectDataflow from '../../../hooks/useSelectDataflow';
const TabPane = Tabs.TabPane;

function DataflowDetails() {
  const history = useHistory();
  const params = useParams();

  const { isDataflowReady, canEdit } = useSelectDataflow(); // this hook will check if dataflow is present in redux, if not it will request data from DB and update redux

  const handleBackToAllJobs = () => {
    history.push(`/${params.applicationId}/dataflow`);
  };

  if (!isDataflowReady)
    return (
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <Spin size="large" spinning={true} />
      </div>
    );

  return (
    <React.Fragment>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <BreadCrumbs />
      </div>
      <div>
        <Tabs
          defaultActiveKey="1"
          destroyInactiveTabPane={true}
          tabBarExtraContent={
            <span>
              <Button type="primary" onClick={handleBackToAllJobs} ghost>
                Cancel
              </Button>
            </span>
          }>
          <TabPane tab="Designer" key="1">
            <div style={{ height: '80vh' }}>
              <GraphX6 readOnly={canEdit ? false : true} />
            </div>
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

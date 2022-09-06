import React from 'react';
import { useHistory, useParams } from 'react-router';
import { Tabs, Button, Spin } from 'antd';
import { useTranslation } from 'react-i18next';

import DataflowAssetsTable from './DataflowAssetsTable';
import BreadCrumbs from '../../common/BreadCrumbs';
import GraphX6 from '../Graph/GraphX6';
import useSelectDataflow from '../../../hooks/useSelectDataflow';
const TabPane = Tabs.TabPane;

function DataflowDetails() {
  const history = useHistory();
  const params = useParams();
  const { t } = useTranslation(['common']); // t for translate -> getting namespaces relevant to this file

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
                {t('Cancel', { ns: 'common' })}
              </Button>
            </span>
          }>
          <TabPane tab={t('Designer', { ns: 'common' })} key="1">
            <div style={{ height: '80vh' }}>
              <GraphX6 readOnly={canEdit ? false : true} />
            </div>
          </TabPane>
          <TabPane tab={t('Assets', { ns: 'common' })} key="2">
            <DataflowAssetsTable />
          </TabPane>
        </Tabs>
      </div>
    </React.Fragment>
  );
}

export default DataflowDetails;

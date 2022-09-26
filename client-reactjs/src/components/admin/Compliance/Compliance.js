import { LoadingOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';

import BreadCrumbs from '../../common/BreadCrumbs';
import Text from '../../common/Text';
import Constraints from './Constraints/Constraints';
import CurrentReport from './CurrentReport/CurrentReport';
import Propagation from './Propagation/Propagation';

const Compliance = () => {
  const [isChangeLoading, isCurrentLoading] = useSelector(({ propagation }) => [
    propagation.changes.loading,
    propagation.current.loading,
  ]);
  const params = useParams();

  const getKey = () => {
    const options = {
      changes: '2',
      current: '3',
    };
    return options[params.tabName] || '1';
  };

  return (
    <>
      <BreadCrumbs />
      <Tabs defaultActiveKey={getKey()}>
        <Tabs.TabPane tab={<Text>Constraints</Text>} key="1">
          <Constraints />
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={
            <>
              {isChangeLoading ? <LoadingOutlined /> : null} <Text>Propagation</Text>
            </>
          }
          key="2">
          <Propagation />
        </Tabs.TabPane>
        <Tabs.TabPane
          tab={
            <>
              {isCurrentLoading ? <LoadingOutlined /> : null}
              <Text>Current State Report</Text>
            </>
          }
          key="3">
          <CurrentReport />
        </Tabs.TabPane>
      </Tabs>
    </>
  );
};

export default Compliance;

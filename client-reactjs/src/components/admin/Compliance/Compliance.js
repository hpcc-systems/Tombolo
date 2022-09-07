import { LoadingOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router';

import Constraints from './Constraints/Constraints';
import Propagation from './Propagation/Propagation';

const Compliance = () => {
  const isPropagationLoading = useSelector((state) => state.propagation.loading);
  const params = useParams();

  return (
    <Tabs defaultActiveKey={params.tabName === 'report' ? '2' : '1'}>
      <Tabs.TabPane tab="Constraints" key="1">
        <Constraints />
      </Tabs.TabPane>
      <Tabs.TabPane tab={<>{isPropagationLoading ? <LoadingOutlined /> : null}Propagation </>} key="2">
        <Propagation />
      </Tabs.TabPane>
    </Tabs>
  );
};

export default Compliance;

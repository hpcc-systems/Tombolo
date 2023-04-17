import React from 'react';
import { Tabs } from 'antd';
import ExportMenu from '../ExportMenu/ExportMenu';

const main = () => {
  return (
    <>
      <Tabs tabBarExtraContent={<ExportMenu />}></Tabs>
    </>
  );
};

export default main;

import React from 'react';
import { Card } from 'antd';
import logo from '../../images/logo.png';

const BasicLayout = ({ content }) => {
  return (
    <div className="basicLayout">
      <Card
        title={
          <>
            <img src={logo} />
          </>
        }
        className="basicLayoutCard">
        <h2>{content}</h2>
      </Card>
    </div>
  );
};

export default BasicLayout;

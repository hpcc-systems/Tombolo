import React from 'react';
import { Button } from 'antd';
import Text from '../../../common/Text';

const AddBtn = ({ handleAddEmailsGroupBtnClick }) => {
  return (
    <Button
      onClick={handleAddEmailsGroupBtnClick}
      type="primary"
      style={{ margin: '5px', display: 'block', marginLeft: 'auto' }}>
      <Text text="Add New Email Group" />
    </Button>
  );
};

export default AddBtn;

import React from 'react';
import { Button } from 'antd';
import Text from '../../../common/Text';

const AddBtn = ({ handleAddTeamsHookBtnClick }) => {
  return (
    <Button
      onClick={handleAddTeamsHookBtnClick}
      type="primary"
      style={{ margin: '5px', display: 'block', marginLeft: 'auto' }}>
      <Text text="Add New Teams Hook" />
    </Button>
  );
};

export default AddBtn;

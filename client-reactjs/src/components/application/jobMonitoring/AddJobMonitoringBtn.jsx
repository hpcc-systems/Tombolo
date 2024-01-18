import React from 'react';
import { Button } from 'antd';
import Text from '../../common/Text';

// Add new job monitoring button
function AddJobMonitoringBtn({ handleAddJobMonitoringButtonClick }) {
  return (
    <Button
      onClick={handleAddJobMonitoringButtonClick}
      type="primary"
      style={{ margin: '5px', display: 'block', marginLeft: 'auto' }}>
      <Text text="Add New Job Monitoring" />
    </Button>
  );
}

export default AddJobMonitoringBtn;

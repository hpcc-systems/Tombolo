import { Alert, Button } from 'antd';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import Text from '../../../common/Text';

import ReportTable from '../ReportTable/ReportTable';
import { generateCurrentReport, getReports } from '@/redux/slices/PropagationSlice';

const CurrentReport = () => {
  const dispatch = useDispatch();
  const { reports, current } = useSelector((state) => state.propagation);

  const history = useHistory();

  const generateReport = () => dispatch(generateCurrentReport({ history }));

  useEffect(() => {
    if (reports.length === 0) {
      dispatch(getReports({ callFrom: 'current' }));
    }
  }, []);

  return (
    <>
      <div style={{ maxWidth: '500px', marginBottom: '15px' }}>
        {current.error ? (
          <Alert style={{ margin: '10px 0' }} closable type="error" showIcon message={current.error} />
        ) : null}

        <Alert
          message={<Text>Current State Report</Text>}
          description={<Text>Generate report of currently active constraints attached to fields of the files</Text>}
          showIcon
          action={
            <Button key="propagate" loading={current.loading} type="primary" block onClick={generateReport}>
              <Text>Generate report</Text>
            </Button>
          }
        />
      </div>

      <ReportTable type="current" />
    </>
  );
};

export default CurrentReport;

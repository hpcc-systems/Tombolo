import { Alert, Button } from 'antd';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { propagationActions } from '../../../../redux/actions/Propagation';

import ReportTable from '../ReportTable/ReportTable';

const CurrentReport = () => {
  const dispatch = useDispatch();
  const propagation = useSelector((state) => state.propagation);

  const history = useHistory();

  const generateReport = () => dispatch(propagationActions.generateReport({ history, type: 'current' }));

  useEffect(() => {
    if (propagation.reports.length === 0) {
      dispatch(propagationActions.getReports({ callFrom: 'current' }));
    }
  }, []);

  return (
    <>
      <div style={{ maxWidth: '500px', marginBottom: '15px' }}>
        {propagation.current.error ? (
          <Alert style={{ margin: '10px 0' }} closable type="error" showIcon message={propagation.current.error} />
        ) : null}

        <Alert
          message="Current State Report"
          description="Generate report of currently active constraints attached to fields of the files"
          showIcon
          action={
            <Button key="propagate" loading={propagation.current.loading} type="primary" block onClick={generateReport}>
              Generate report
            </Button>
          }
        />
      </div>

      <ReportTable type="current" />
    </>
  );
};

export default CurrentReport;

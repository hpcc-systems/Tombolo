import { Alert, Button } from 'antd';
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { propagationActions } from '../../../../redux/actions/Propagation';
import ReportTable from '../ReportTable/ReportTable';

const Propagation = () => {
  const dispatch = useDispatch();
  const propagation = useSelector((state) => state.propagation);

  const history = useHistory();

  const handlePropagate = () => dispatch(propagationActions.generateReport({ history, type: 'changes' }));

  useEffect(() => {
    if (propagation.reports.length === 0) {
      dispatch(propagationActions.getReports({ callFrom: 'changes' }));
    }
  }, []);

  return (
    <>
      <div style={{ maxWidth: '500px', marginBottom: '15px' }}>
        {propagation.changes.error ? (
          <Alert style={{ margin: '10px 0' }} closable type="error" showIcon message={propagation.changes.error} />
        ) : null}

        <Alert
          message="Fields constraints propagation"
          description="Constraints added to the input files fields will be passed to the output files fields. This process will take some time!"
          showIcon
          action={
            <Button
              block
              key="propagate"
              type="primary"
              loading={propagation.changes.loading}
              onClick={handlePropagate}>
              Propagate
            </Button>
          }
        />
      </div>

      <ReportTable type="changes" />
    </>
  );
};

export default Propagation;

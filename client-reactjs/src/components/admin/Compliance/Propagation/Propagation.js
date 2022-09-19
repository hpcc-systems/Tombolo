import { Alert, Button, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { propagationActions } from '../../../../redux/actions/Propagation';
import ReportTable from '../ReportTable/ReportTable';

const Propagation = () => {
  const dispatch = useDispatch();
  const propagation = useSelector((state) => state.propagation);

  const baseLineReport = propagation.reports.find((report) => report.isBaseLine);

  const [modal, setModal] = useState({ isOpen: false });

  const history = useHistory();

  const handlePropagate = () => {
    if (baseLineReport) {
      setModal({ isOpen: true });
    } else {
      dispatch(propagationActions.generateReport({ history, type: 'changes' }));
    }
  };

  const handleUseBaseLine = () => {
    dispatch(propagationActions.generateReport({ history, type: 'changes', baseLineId: baseLineReport.id }));
    setModal({ isOpen: false });
  };

  const handleUseCurrentState = () => {
    dispatch(propagationActions.generateReport({ history, type: 'changes' }));
    setModal({ isOpen: false });
  };

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
            <Button block type="primary" loading={propagation.changes.loading} onClick={handlePropagate}>
              Propagate
            </Button>
          }
        />
      </div>

      <ReportTable type="changes" />

      {!modal.isOpen ? null : (
        <Modal
          destroyOnClose
          width={1000}
          title="Would you like to compare against base line?"
          onCancel={() => setModal({ isOpen: false })}
          visible={modal.isOpen}
          footer={[
            <Button key="current" type="secondary" onClick={handleUseCurrentState}>
              Use Current State
            </Button>,
            <Button key="baseline" type="primary" onClick={handleUseBaseLine}>
              Use Base Line
            </Button>,
          ]}>
          <ReportTable data={[baseLineReport]} />
        </Modal>
      )}
    </>
  );
};

export default Propagation;

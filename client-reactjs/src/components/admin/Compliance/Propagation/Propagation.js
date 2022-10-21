import { Alert, Button, Modal } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router';
import { propagationActions } from '../../../../redux/actions/Propagation';
import Text from '../../../common/Text';
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
          message={<Text>Fields constraints propagation</Text>}
          description={
            <Text>
              Constraints added to the input files fields will be passed to the output files fields. This process will
              take some time.
            </Text>
          }
          showIcon
          action={
            <Button block type="primary" loading={propagation.changes.loading} onClick={handlePropagate}>
              <Text>Propagate</Text>
            </Button>
          }
        />
      </div>

      <ReportTable type="changes" />

      {!modal.isOpen ? null : (
        <Modal
          destroyOnClose
          width={1000}
          title={<Text>Would you like to compare against base line?</Text>}
          onCancel={() => setModal({ isOpen: false })}
          visible={modal.isOpen}
          footer={[
            <Button key="current" type="secondary" onClick={handleUseCurrentState}>
              <Text> Use Current State</Text>
            </Button>,
            <Button key="baseline" type="primary" onClick={handleUseBaseLine}>
              <Text> Use Base Line</Text>
            </Button>,
          ]}>
          <ReportTable data={[baseLineReport]} />
        </Modal>
      )}
    </>
  );
};

export default Propagation;

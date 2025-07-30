import React from 'react';
import { CloseCircleOutlined, TagOutlined } from '@ant-design/icons';
import { authHeader } from '../../../common/AuthHeader';
import ConfirmAction from '../../../common/ConfirmAction';
import { useDispatch, useSelector } from 'react-redux';
import { propagationActions } from '../../../../redux/actions/Propagation';
import Text from '../../../common/Text';

const BaseLine = ({ record }) => {
  const [applicationId, propagation] = useSelector((state) => [
    state.applicationReducer.application.applicationId,
    state.propagation,
  ]);

  const dispatch = useDispatch();

  const baseLineActions = async ({ id, action }) => {
    const config = {
      method: 'PUT',
      headers: authHeader(),
      body: JSON.stringify({ id, action }),
    };

    const response = await fetch(`/api/report/read/baseline/${applicationId}`, config);
    if (!response.ok) throw new Error(response.statusText);

    const data = await response.json();
    if (!data.id) throw new Error('Failed to update');

    if (action === 'assign') {
      const newReports = propagation.reports.map((report) => ({
        ...report,
        isBaseLine: data.id === report.id ? true : false,
      }));
      dispatch(propagationActions.updateReports(newReports));
    }

    if (action === 'remove') {
      const newReports = propagation.reports.map((report) => ({ ...report, isBaseLine: false }));
      dispatch(propagationActions.updateReports(newReports));
    }
  };

  return (
    <>
      {record.isBaseLine ? (
        <ConfirmAction
          icon={<CloseCircleOutlined />}
          onConfirm={async () => await baseLineActions({ action: 'remove', id: record.id })}
          tooltip={<Text>Remove base Line</Text>}
          confirm={{
            title: 'Would you like to remove base line from this report?',
          }}
        />
      ) : (
        <ConfirmAction
          icon={<TagOutlined />}
          tooltip={<Text>Mark report as a Base Line</Text>}
          onConfirm={async () => await baseLineActions({ action: 'assign', id: record.id })}
          confirm={{
            title: 'Base line will be overwritten, would you like to make this report a new base line?',
          }}
        />
      )}
    </>
  );
};

export default BaseLine;

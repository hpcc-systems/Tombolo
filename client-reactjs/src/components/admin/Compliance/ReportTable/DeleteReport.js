import { DeleteOutlined } from '@ant-design/icons';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { propagationActions } from '../../../../redux/actions/Propagation';
import { authHeader } from '../../../common/AuthHeader';
import ConfirmAction from '../../../common/ConfirmAction';

const DeleteReport = ({ record }) => {
  const dispatch = useDispatch();
  const propagation = useSelector((state) => state.propagation);

  const removeReport = async () => {
    const config = {
      method: 'DELETE',
      headers: authHeader(),
    };

    const response = await fetch(`/api/report/read/${record.id}`, config);
    if (!response.ok) throw new Error('Failed to fetch');

    const data = await response.json();
    if (!data.id) throw new Error('Failed to remove report!');

    const newReports = propagation.reports.filter((el) => el.id !== data.id);
    dispatch(propagationActions.updateReports(newReports));
  };

  return (
    <ConfirmAction
      icon={<DeleteOutlined />}
      tooltip="Delete Report"
      onConfirm={removeReport}
      confirm={{ title: 'Are you sure you want to delete this report?' }}
      notification={{ success: 'Report deleted!', error: 'Reports has not been deleted!' }}
    />
  );
};

export default DeleteReport;

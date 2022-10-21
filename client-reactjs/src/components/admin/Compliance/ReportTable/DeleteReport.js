import { DeleteOutlined } from '@ant-design/icons';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { propagationActions } from '../../../../redux/actions/Propagation';
import { authHeader } from '../../../common/AuthHeader';
import ConfirmAction from '../../../common/ConfirmAction';
import Text, { i18n } from '../../../common/Text';

const DeleteReport = ({ record }) => {
  const dispatch = useDispatch();
  const propagation = useSelector((state) => state.propagation);

  const removeReport = async () => {
    const config = {
      method: 'DELETE',
      headers: authHeader(),
    };

    const response = await fetch(`/api/report/read/${record.id}`, config);
    if (!response.ok) throw new Error(i18n('Failed to fetch'));

    const data = await response.json();
    if (!data.id) throw new Error(i18n('Failed to remove report'));

    const newReports = propagation.reports.filter((el) => el.id !== data.id);
    dispatch(propagationActions.updateReports(newReports));
  };

  return (
    <ConfirmAction
      icon={<DeleteOutlined />}
      tooltip={<Text>Delete Report</Text>}
      onConfirm={removeReport}
      confirm={{ title: <Text>Are you sure you want to delete this report?</Text> }}
      notification={{ success: i18n('Report deleted!'), error: i18n('Reports has not been deleted!') }}
    />
  );
};

export default DeleteReport;

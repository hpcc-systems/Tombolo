import { DeleteOutlined } from '@ant-design/icons';
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { applicationActions } from '../../../../redux/actions/Application';
import { authHeader, handleError } from '../../../common/AuthHeader';
import ConfirmAction from '../../../common/ConfirmAction';

const RemoveContraint = ({ record }) => {
  const constraints = useSelector((state) => state.applicationReducer.constraints);
  const dispatch = useDispatch();

  const remove = async () => {
    const config = { method: 'DELETE', headers: authHeader() };
    const response = await fetch(`/api/constraint/${record.id}`, config);
    if (!response.ok) handleError(response);
    const data = await response.json();

    if (!data.success || !data.id) throw new Error('Failed to remove constarint');

    const newConstraints = constraints.filter((el) => el.id !== data.id);
    dispatch(applicationActions.updateConstraints(newConstraints));
  };

  return (
    <ConfirmAction
      onConfirm={remove}
      icon={<DeleteOutlined />}
      tooltip="Remove constarint"
      notification={{ success: 'Constraint removed successfully' }}
      confirm={{ title: 'Are you sure you want to delete contraint permanently?' }}
    />
  );
};

export default RemoveContraint;

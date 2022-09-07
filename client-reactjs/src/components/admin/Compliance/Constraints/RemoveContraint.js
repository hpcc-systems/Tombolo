import React, { useState } from 'react';
import { DeleteOutlined } from '@ant-design/icons';
import { message, Popconfirm } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { authHeader, handleError } from '../../../common/AuthHeader';
import { applicationActions } from '../../../../redux/actions/Application';

const RemoveContraint = ({ record }) => {
  const [visible, setVisible] = useState(false);
  const [recordRemoved, setRecordRemove] = useState({ loading: false, success: false, error: '' });

  const constraints = useSelector((state) => state.applicationReducer.constraints);
  const dispatch = useDispatch();

  const remove = async () => {
    try {
      const config = { method: 'DELETE', headers: authHeader() };
      setRecordRemove(() => ({ loading: true, success: false, error: '' }));
      const response = await fetch(`/api/constraint/${record.id}`, config);
      if (!response.ok) handleError(response);
      const data = await response.json();

      if (!data.success || !data.id) throw new Error('Failed to remove constarint');

      setRecordRemove(() => ({ loading: false, success: true }));
      const newConstraints = constraints.filter((el) => el.id !== data.id);
      dispatch(applicationActions.updateConstraints(newConstraints));

      message.success('Constraint removed successfully');
    } catch (error) {
      console.log('Error fetch', error);
      message.error(error.message);
      setRecordRemove(() => ({ loading: false, error: error.message }));
    }
  };

  return (
    <Popconfirm
      title="Are you sure you want to delete contraint permanently?"
      visible={visible}
      onConfirm={remove}
      onCancel={() => setVisible(false)}
      okButtonProps={{ loading: recordRemoved.loading }}>
      <DeleteOutlined onClick={setVisible} />
    </Popconfirm>
  );
};

export default RemoveContraint;

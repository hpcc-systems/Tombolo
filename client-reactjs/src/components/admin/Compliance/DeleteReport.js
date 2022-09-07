import { DeleteOutlined } from '@ant-design/icons';
import { message, Popconfirm } from 'antd';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { propagationActions } from '../../../redux/actions/Propagation';
import { authHeader } from '../../common/AuthHeader';

const DeleteReport = ({ report }) => {
  const dispatch = useDispatch();
  const propagation = useSelector((state) => state.propagation);
  const [prompt, setPrompt] = useState({ visible: false, loading: false });

  const removeReport = async () => {
    try {
      const config = {
        method: 'DELETE',
        headers: authHeader(),
      };

      setPrompt(() => ({ visible: true, loading: true }));

      const response = await fetch(`/api/report/read/${report.id}`, config);
      if (!response.ok) throw new Error('Failed to fetch');

      const data = await response.json();
      if (!data.id) throw new Error('Failed to remove report!');

      const newReports = propagation.reports.filter((el) => el.id !== data.id);
      dispatch(propagationActions.updateReports(newReports));

      setPrompt(() => ({ visible: false, loading: false }));
      message.success('Success, report has been deleted!');
    } catch (error) {
      console.log('Error fetch', error);
      message.error(error.message);
      setPrompt({ visible: false, loading: false });
    }
  };

  return (
    <Popconfirm
      placement="top"
      title={'Are you sure you want to delete this report?'}
      visible={prompt.visible}
      okText="Yes"
      cancelText="No"
      onConfirm={removeReport}
      onCancel={() => setPrompt({ visible: false, loading: false })}
      okButtonProps={{ loading: prompt.loading }}
      cancelButtonProps={{ disabled: prompt.loading }}>
      <DeleteOutlined onClick={() => setPrompt({ visible: true, loading: false })} />
    </Popconfirm>
  );
};

export default DeleteReport;

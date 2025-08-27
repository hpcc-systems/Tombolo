import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import { authHeader, handleError } from '@/components/common/AuthHeader';
import { getRoleNameArray } from '@/components/common/AuthUtil';
import { dataflowReset, dataflowSelected } from '@/redux/slices/DataflowSlice';

const useSelectDataflow = () => {
  const dataflowReducer = useSelector((state) => state.dataflow);
  const [isDataflowReady, setIsDataflowReady] = useState(false);

  const dispatch = useDispatch();
  const history = useHistory();
  const params = useParams();

  const roleArray = getRoleNameArray();
  const editingAllowed = !(roleArray.includes('reader') && roleArray.length === 1);

  useEffect(() => {
    (async () => {
      const { dataflowId, applicationId } = params;
      if (dataflowId && applicationId && !dataflowReducer.id) {
        try {
          const response = await fetch(`/api/dataflow?application_id=${applicationId}&dataflow_id=${dataflowId}`, {
            headers: authHeader(),
          });
          if (!response.ok) handleError(response);

          const data = await response.json();
          const dataflow = data[0];

          if (!dataflow) throw new Error('No Dataflow found');
          const { title, id, clusterId } = dataflow;
          dispatch(dataflowSelected({ title, id, clusterId }));
        } catch (error) {
          return history.push('/');
        }
      }
      setIsDataflowReady(true);
    })();

    return () => {
      // when the component is unmounted, reset the selected dataflow
      dispatch(dataflowReset());
    };
  }, []);

  return {
    isDataflowReady,
    canEdit: editingAllowed,
  };
};

export default useSelectDataflow;

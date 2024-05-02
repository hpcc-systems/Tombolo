import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router';
import { authHeader, handleError } from '../components/common/AuthHeader';
import { hasEditPermission } from '../components/common/AuthUtil';
import { dataflowAction } from '../redux/actions/Dataflow';

const useSelectDataflow = () => {
  const [dataflowReducer, user] = useSelector((state) => [state.dataflowReducer, state.authenticationReducer?.user]);
  const [isDataflowReady, setIsDataflowReady] = useState(false);

  const dispatch = useDispatch();
  const history = useHistory();
  const params = useParams();

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
          dispatch(dataflowAction.dataflowSelected({ title, id, clusterId }));
        } catch (error) {
          return history.push('/');
        }
      }
      setIsDataflowReady(true);
    })();

    return () => {
      // when component unmounted, reset selected dataflow
      dispatch(dataflowAction.dataflowReset());
    };
  }, []);

  return {
    isDataflowReady,
    canEdit: hasEditPermission(user),
  };
};

export default useSelectDataflow;

import React, { useState, useEffect } from 'react';
import { message, Spin } from 'antd';
import { withRouter } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { InfoCircleOutlined } from '@ant-design/icons';

import { authHeader, handleError } from '../../common/AuthHeader.js';
import DataflowTable from './DataflowTable';
import AddDataflow from './AddDataflows';
import { dataflowAction } from '../../../redux/actions/Dataflow';
import InfoDrawer from '../../common/InfoDrawer';

function Dataflow({ applicationId, history }) {
  let componentMounted = true;

  const [dataFlows, setDataFlows] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [modalVisible, setModalVisibility] = useState(false);
  const [dataflowToEdit, setDataflowToEdit] = useState(null);
  const [enableEdit, setEnableEdit] = useState(false);
  const [openHelp, setOpenHelp] = useState(false);

  const dispatch = useDispatch();

  const showHelpDrawer = () => {
    setOpenHelp(true);
  };
  const onHelpDrawerClose = () => {
    setOpenHelp(false);
  };

  // Fetch all data flows when component mounts
  useEffect(() => {
    getData();

    //Clean up
    return () => (componentMounted = false);
  }, []);

  //Get Data
  const getData = async () => {
    setLoadingData(true);
    if (applicationId) {
      fetch('/api/dataflow?application_id=' + applicationId, {
        headers: authHeader(),
      })
        .then(function (response) {
          if (response.ok) {
            return response.json();
          }
          handleError(response);
        })
        .then(function (data) {
          if (componentMounted) {
            setDataFlows(data);
          }
        })
        .catch((error) => {
          message.error(error.message);
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  };

  //When dataflow is updated/deleted/Added
  const onDataFlowUpdated = () => {
    getData();
  };

  // When DF is selected
  const onSelectDataflow = (selectedDataflow) => {
    const { title, id, clusterId } = selectedDataflow;
    dispatch(dataflowAction.dataflowSelected({ title, id, clusterId }));
    history.push(`/${applicationId}/dataflow/details/${id}`);
  };

  // When edit icon/view is clicked
  const editDataFlow = (dataflow) => {
    setDataflowToEdit(dataflow);
    setModalVisibility(true);
    setEnableEdit(false);
  };

  return (
    <div>
      <Spin spinning={loadingData}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', placeItems: 'center' }}>
          <InfoCircleOutlined style={{ marginRight: '10px', fontSize: '18px' }} onClick={() => showHelpDrawer()} />

          <AddDataflow
            modalVisible={modalVisible}
            setModalVisibility={setModalVisibility}
            setDataflowToEdit={setDataflowToEdit}
            dataflowToEdit={dataflowToEdit}
            onDataFlowUpdated={onDataFlowUpdated}
            data={dataFlows}
            enableEdit={enableEdit}
            setEnableEdit={setEnableEdit}
          />
        </div>

        <DataflowTable
          data={dataFlows}
          onSelectDataflow={onSelectDataflow}
          onEditDataFlow={editDataFlow}
          applicationId={applicationId}
          onDataFlowUpdated={onDataFlowUpdated}
        />
      </Spin>
      <InfoDrawer open={openHelp} onClose={onHelpDrawerClose} content="dataFlow"></InfoDrawer>
    </div>
  );
}

export default withRouter(Dataflow);

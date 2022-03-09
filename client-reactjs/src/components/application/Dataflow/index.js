import React, { useState, useEffect } from 'react';
import { message, Spin } from 'antd';
import { withRouter } from 'react-router-dom';

import { authHeader, handleError } from "../../common/AuthHeader.js";
import DataflowTable from "./DataflowTable";
import AddDataflow from "./AddDataflows";
import { dataflowAction } from '../../../redux/actions/Dataflow'; 
import {  useDispatch } from "react-redux";

function Dataflow(props) {
  let componentMounted = true;
  const {applicationId, applicationTitle, user} = props;

  const [dataFlows, setDataFlows] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [modalVisible, setModalVisibility] = useState(false);
  const [dataflowToEdit, setDataflowToEdit] = useState(null);
  const [enableEdit, setEnableEdit] = useState(false)

  const dispatch = useDispatch();


  // Fetch all data flows when component mounts
  useEffect(() =>{
    getData();

    //Clean up
    return () => (componentMounted = false)
  }, []);

  //Get Data 
  const getData = async() =>{
        setLoadingData(true);
      if(applicationId){
      fetch('/api/dataflow?application_id='+ applicationId, {
        headers: authHeader()
      }).then(function(response) {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      }).then(function(data) {
        if(componentMounted){
          setDataFlows(data);
        }
      }).catch(error => {
        message.error(error.message)
      }).finally(() =>{
        setLoadingData(false);
      })
    }
  }

  //When dataflow is updated/deleted/Added
  const onDataFlowUpdated = () =>{
    getData();
  }
  
  // When DF is selected
   const onSelectDataflow = (selectedDataflow) => { // This block should be moved to DF table component
    dispatch(dataflowAction.dataflowSelected(
      applicationId,
      applicationTitle,
      selectedDataflow.id,
      selectedDataflow.clusterId,
      user
    ));
    props.history.push('/'+ applicationId +'/dataflow/details');
  }

  // When edit icon/view is clicked 
  const editDataFlow = (dataflow) =>{
      setDataflowToEdit(dataflow);
      setModalVisibility(true)
      setEnableEdit(false)
  }

 
	
  return (
  	  <div >
        <Spin spinning={loadingData}>
          <div className="d-flex justify-content-end" style={{margin: "5px"}}>
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
     </div>
	  )
}

export default withRouter(Dataflow)
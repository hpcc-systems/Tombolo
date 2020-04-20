import React, { useState, useEffect } from 'react'
import { Button, Table, Divider, message, Popconfirm, Icon, Tooltip, Radio } from 'antd/lib';
import BreadCrumbs from "../../common/BreadCrumbs";
import AddDataflow from "./AddDataflow";
import DataflowTable from "./DataflowTable";
import DataflowAssetsTable from "./DataflowAssetsTable";
import {Graph} from "./Graph";
import useModal from '../../../hooks/useModal';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { connect } from 'react-redux';

function Dataflow(props) {
	const [dataFlows, setDataFlows] = useState([]);

	const {isShowing, toggle} = useModal();

  const [tableDisplay, setTableDisplay] = useState(
    {graphHeight: 60, display:'block'}
  );
	
	const [form, setForm] = useState({
    selectedDataflow: '',
    tableView: false
  }); 

  const [application, setApplication] = useState({...props})

  useEffect(() => {
    setApplication({...props});
   }, [props])

  useEffect(() => {	  
	  if(application.applicationId) {
	  	getData();  
	  }
	}, []);

	const getData = async () => {  
    fetch('/api/dataflow?application_id='+application.applicationId, {
      headers: authHeader()
    }).then(function(response) {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    }).then(function(data) {
      setDataFlows(data);       
    }).catch(error => {
      console.log(error);
    });
  };  

  const onSelectDataflow = (selectedDataflow) => {
    setForm({
      selectedDataflow: selectedDataflow
    });
  }

  const handleToggleView = (evt) => {    
    evt.target.value == 'chart' ? setForm({selectedDataflow: form.selectedDataflow, tableView: false}) : setForm({selectedDataflow: form.selectedDataflow, tableView: true})
  }

  const onDataFlowUpdated = () => {
		getData();  		
  }

  const onDataFlowEdit = (selectedDataflow) => {
  	setForm({
      selectedDataflow: selectedDataflow
    });
    toggle() 	
  }

  const minimize = () => {
    setTableDisplay({graphHeight: 83, display: 'none'});
  }

  const maximize = () => {
    setTableDisplay({graphHeight: 60, display: 'block'})
  }

  if(application.applicationId == '' ) return null;
  return (  	
  	  <div style={{"height": "100%"}}>
	      <div className="d-flex justify-content-end" style={{paddingTop:"55px", margin: "5px"}}>
          <BreadCrumbs applicationId={application.applicationId} applicationTitle={application.applicationTitle}/>
	        <div className="ml-auto">
  	        <span>
  	          {<Radio.Group defaultValue="chart" buttonStyle="solid" style={{padding: "10px"}} onChange={handleToggleView}>
  	            <Tooltip placement="bottom" title={"Tree View"}><Radio.Button value="chart"><Icon type="cluster" /></Radio.Button></Tooltip>
  	            <Tooltip placement="bottom" title={"Tabular View"}><Radio.Button value="grid"><Icon type="bars" /></Radio.Button></Tooltip>
  	          </Radio.Group>}
  	        
  	          <AddDataflow 
  	          	isShowing={isShowing} 
  	          	toggle={toggle}
  	          	applicationId={application.applicationId} 
  	          	onDataFlowUpdated={onDataFlowUpdated}
  	          	selectedDataflow={form.selectedDataflow} 
  	          	/>
  	        </span>
          </div>
	      </div>

	      <div id="data_flow_content" style={{"height": tableDisplay.graphHeight+"%"}}>
					{form.tableView ? 
            <DataflowAssetsTable applicationId={application.applicationId} selectedDataflow={form.selectedDataflow} user={application.user}/> 
            : 
            <Graph applicationId={application.applicationId} selectedDataflow={form.selectedDataflow}/>
          }
          <div className="dataflow-tbl-wrapper bg-light">
            <div className="dataflow-tbl-controls float-right">
              <div className="my-1 mx-2 flex-shrink-0"><i className="fa fa-window-minimize js-minimize" title="Minimize Script" onClick={() => minimize()}></i><i className="fa js-restore fa-window-restore" title="Restore Script" onClick={() => maximize()}></i></div>
            </div>
            
            <div id="dataflow-list" style={{padding: "5px", "display":tableDisplay.display}}>
              <DataflowTable              
                data={dataFlows}
                applicationId={application.applicationId}  
                onSelectDataflow={onSelectDataflow} 
                onDataFlowUpdated={onDataFlowUpdated}
                onDataFlowEdit={onDataFlowEdit} />        
            </div>
          </div>    	        
	      </div>
          
	    </div>  
	  )  

}

export default Dataflow
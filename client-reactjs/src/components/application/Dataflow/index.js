import React, { useState, useEffect } from 'react'
import { Button, Table, Divider, message, Popconfirm, Icon, Tooltip, Radio, Collapse } from 'antd/lib';
import BreadCrumbs from "../../common/BreadCrumbs";
import AddDataflow from "./AddDataflow";
import DataflowTable from "./DataflowTable";
import DataflowAssetsTable from "./DataflowAssetsTable";
import {Graph} from "./Graph";
import useModal from '../../../hooks/useModal';
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { hasEditPermission } from "../../common/AuthUtil.js";
import { connect } from 'react-redux';
import { useSelector } from "react-redux";
const { Panel } = Collapse;

function Dataflow(props) {
	const [dataFlows, setDataFlows] = useState([]);

	const {isShowing, toggle} = useModal();

  const [tableDisplay, setTableDisplay] = useState(
    {graphHeight: 700, display:'block'}
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

  const authReducer = useSelector(state => state.authenticationReducer);

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
      if(data.length == 0) {
        toggle();
      }
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

  const onChange = (key) => {
    console.log(key)
    if(key.length > 0 && key[0] == 1) {
      setTableDisplay({graphHeight: 700});
    } else {
      setTableDisplay({graphHeight: 900});
    }
  }

  
  const editingAllowed = hasEditPermission(authReducer.user);

  if(application.applicationId == '' ) return null;
  return (  	
  	  <div>
	      <div className="d-flex justify-content-end" style={{paddingTop:"55px", margin: "5px"}}>
          <BreadCrumbs applicationId={application.applicationId} applicationTitle={application.applicationTitle}/>
	        <div className="ml-auto">
  	        <span>
  	          {<Radio.Group defaultValue="chart" buttonStyle="solid" style={{padding: "10px"}} onChange={handleToggleView}>
  	            <Tooltip placement="bottom" title={"Tree View"}><Radio.Button value="chart"><Icon type="cluster" /></Radio.Button></Tooltip>
  	            <Tooltip placement="bottom" title={"Tabular View"}><Radio.Button value="grid"><Icon type="bars" /></Radio.Button></Tooltip>
  	          </Radio.Group>}
  	          {editingAllowed ?  
    	          <AddDataflow 
    	          	isShowing={isShowing} 
    	          	toggle={toggle}
    	          	applicationId={application.applicationId} 
    	          	onDataFlowUpdated={onDataFlowUpdated}
    	          	selectedDataflow={form.selectedDataflow} 
    	          	/>
               : null}   
  	        </span>
          </div>
	      </div>
        <div className="row">
  	      <div id="data_flow_content" className="col-12" style={{"height": tableDisplay.graphHeight+"px"}}>
  					{form.tableView ? 
              <DataflowAssetsTable applicationId={application.applicationId} selectedDataflow={form.selectedDataflow} user={application.user}/> 
              : 
              <Graph applicationId={application.applicationId} applicationTitle={application.applicationTitle} selectedDataflow={form.selectedDataflow}/>
            }            	        
  	      </div>

          <div className="col-12">
            <Collapse
              defaultActiveKey={['1']}
              expandIconPosition={"right"}
              onChange={onChange}
            >
              <Panel header="Dataflows" key="1">
                <DataflowTable              
                    data={dataFlows}
                    applicationId={application.applicationId}  
                    onSelectDataflow={onSelectDataflow} 
                    onDataFlowUpdated={onDataFlowUpdated}
                    onDataFlowEdit={onDataFlowEdit} />     
              </Panel>
              
            </Collapse>
          </div>
        </div>

	    </div>  
	  )  

}

export default Dataflow
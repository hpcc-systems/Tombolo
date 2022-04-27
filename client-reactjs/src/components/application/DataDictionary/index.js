import React, { useState, useEffect } from 'react'
import { Table, message, Popconfirm, Icon, Tooltip, Divider, Button} from 'antd/lib';
import BreadCrumbs from "../../common/BreadCrumbs";
import { authHeader, handleError } from "../../common/AuthHeader.js"
import { hasEditPermission } from "../../common/AuthUtil.js";
import { Constants } from '../../common/Constants';
import { useSelector } from "react-redux";
import DataDictionaryTable from './DataDictionaryTable';
import DataDefinitionDetailsDialog from './DataDefinitionDetailsDialog';

function DataDictionary(props) {
  const [application, setApplication] = useState({...props})
  const [dataDefinitions, setDataDefinitions] = useState([]);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {    
    if(application.applicationId) {
      fetchDataDictionary();  
    }
  }, [application]);

  const fetchDataDictionary = () => {
    fetch("/api/data-dictionary?application_id="+application.applicationId, {
      headers: authHeader()
    })
    .then((response) => {
      if(response.ok) {
        return response.json();
      }
      handleError(response);
    })
    .then(data => {
      fetchFiles().then((files) => {        
        files.forEach((file) => {
          data.push({
            "id": file.id,
            "data_defn": [],
            "name": file.title,
            "title": file.title,
            "description": file.description,
            "createdAt": file.createdAt,
            "type": "file"
          })
        })
        setDataDefinitions(data)  
      })
      
    }).catch(error => {
      console.log(error);
    });
  }  

  const fetchFiles = () => {
    return new Promise((resolve, reject) => {
      fetch("/api/file/read/file_list?application_id="+application.applicationId, {
          headers: authHeader()
      })
      .then((response) => {
        if(response.ok) {
          return response.json();
        }
        handleError(response);
      })
      .then(data => {
        resolve(data);
      }).catch(error => {
        console.log(error);
        reject(error)
      });
    })
  }

  const onDataUpdated = () => {
    fetchDataDictionary();
  }

  const openAddDlg = () => {
    setShowDetailsDialog(true);
  }

  const closeAddDlg = () => {
   setShowDetailsDialog(false); 
  }

  const authReducer = useSelector(state => state.authenticationReducer);

  const editingAllowed = hasEditPermission(authReducer.user);
  if(application.applicationId == '' ||  application.applicationTitle == '') return null;
  return (    
      <div>
        <div className="d-flex justify-content-end" style={{paddingTop:"55px", margin: "5px"}}>
          <BreadCrumbs applicationId={application.applicationId} applicationTitle={application.applicationTitle}/>
          <div className="ml-auto">
            {editingAllowed ? 
              <span style={{ marginLeft: "auto" }}>
              <Tooltip placement="bottom" title={"Click to add a new index"}>
                <Button className="btn btn-secondary btn-sm" onClick={() => openAddDlg()}><i className="fa fa-plus"></i>Add</Button>
              </Tooltip>
              </span>
              : null }
          </div>
        </div>
        <div className="row">
          <div className="col-12">
              <DataDictionaryTable       
                props={props}       
                dataDefinitions={dataDefinitions}
                applicationId={application.applicationId} 
                onDataUpdated={onDataUpdated} 
                setShowDetailsDialog={setShowDetailsDialog}
                closeAddDlg={closeAddDlg}
              />     
          </div>
        </div>
        {showDetailsDialog ? <DataDefinitionDetailsDialog selectedDataDefinition={''} applicationId={application.applicationId} onDataUpdated={onDataUpdated} closeDialog={closeAddDlg}/> : null}
      </div>  
    )  
};

export default DataDictionary
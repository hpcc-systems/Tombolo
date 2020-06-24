import React, { useState, useEffect } from 'react'
import { authHeader, handleError } from "../common/AuthHeader.js"
import useFileDetailsForm from '../../hooks/useFileDetailsForm';
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

function AssetDetails(props) {
	const [application, setApplication] = useState({...props})

	const { isShowing, toggle, OpenDetailsForm } = useFileDetailsForm();	

  let {assetType, applicationId, fileId} = useParams();

  useEffect(() => {
  	setApplication({...props});
  }, [props])
  
  const authReducer = useSelector(state => state.authenticationReducer);

  const handleClose = () => {
    toggle();
  }

  return (
	  
	  (authReducer.user && authReducer.user.token != undefined) ? 		  
	  <React.Fragment>
	    <div style={{"height": "85%"}}>		  
				{
					OpenDetailsForm({
						"type": assetType,
						"isNew":false,
		        "selectedAsset": fileId,
		        "applicationId": applicationId,
		        "user": authReducer.user,
		        "onClose": handleClose
		        }) 
				}
			</div>
	  </React.Fragment>
	  : null		    
	  
	)
}
export default AssetDetails
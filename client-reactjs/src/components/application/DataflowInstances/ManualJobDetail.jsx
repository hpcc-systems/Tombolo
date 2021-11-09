import React, {useEffect, useState} from 'react';
import { Button, message, Tabs, Row, Col } from 'antd';
import { withRouter } from "react-router-dom";
import { authHeader, handleError } from '../../common/AuthHeader';

function ManualJobDetail() {
    const [ jobId, setJobID]= useState('');
    const [jobDetails, setJobDetails] = useState({});
    const [userResponseRecorded, setUserResponseRecorded] = useState(false);

    //antd message config
    message.config({
        top: 100,
        duration: 2,
        maxCount: 1,
      });
    const { TabPane } = Tabs;

    useEffect(() =>{
        //1. When the component loads pull  app id, job id and other necessary details from url
        const data = window.location.href.split("/");
        console.log(data, "Data from url <<<<", `/api/job/job_details?app_id=${data[3]}&job_id=${data[5]}`);

        //2. Once the appid and job id is obtained make call to get job details 
        fetch(`/api/job/job_details?app_id=${data[3]}&job_id=${data[5]}`, {
            headers : authHeader(),
        }).then(response =>{
            if(response.ok){
                return response.json();
            }
            handleError(response)
        }).then(data =>{
            //3. set job details, app id and job id in local state
            setJobDetails(data)
            setJobID(data.id)
        }).catch(err => {
            console.log(err)
        })

    }, []);

    //When user clicks approve or reject btn 
    const handleResponse = (e) => {
        const response = e.currentTarget.value;
        fetch("/api/job/jobExecution", {
            headers: authHeader(),
            method : 'POST',
            body : JSON.stringify({jobId: jobId, newManaulJob_meta :{response, respondedOn :  Date.now()}})
          })
          .then((response) => {
            if(response.ok) {
              return response.json();
            }
            handleError(response);
          })
          .then(data => {
            setUserResponseRecorded(true)
            message.success('Your response has been recorded')
          })
          .catch(error => {
            console.log(error);
          });
    }

    //Once user response is registered, if any dependent jobs - add to job execution queue
    useEffect(() =>{
        if(userResponseRecorded){
            fetch("/api/job/dependOnManualJob", {
                headers: authHeader(),
                method : 'POST',
                body : JSON.stringify({name: jobDetails?.name})
              })
              .then((response) => {
                if(response.ok) {
                  return response.json();
                }
                handleError(response);
              })
              .then(data => {
                setTimeout(() =>{
                    window.location.href = "/"
                }, 2000)
              })
              .catch(error => {
                console.log(error);
              });
        }
    }, [userResponseRecorded])

    //When user clicks cancel button
    const handleCancel = () => {
        window.location.href = "/"
    }

    //styles
    const actionBtnsStyle ={ marginLeft : "10px"}

    //Buttons on tab pane
    const actions =
         <div> 
            <Button style={actionBtnsStyle} type="primary" value="approved" onClick={handleResponse}> Approve </Button>
            <Button style={actionBtnsStyle} danger type="default" value="rejected" onClick={handleResponse}> Reject </Button> 
            <Button style={actionBtnsStyle} type="primary" ghost  value="rejected" onClick={handleCancel}> Cancel </Button>
        </div>

    return (
        <div>
            <div className="assetTitle">{jobDetails?.name}</div>
                <Tabs  tabBarExtraContent={actions} >
                    <TabPane tab="Basic" key="1">
                    {jobDetails ? Object.keys(jobDetails).map((key, index) =>
                            (<Row key={index} gutter={{ xs: 8, sm: 8, md: 8, lg: 8 }}>
                                            <Col className="gutter-row" span={6}>
                                                <div >{key}</div>
                                            </Col>
                                            <Col className="gutter-row" span={18}>
                                                <div >{jobDetails[key]}</div>
                                            </Col>  
                                </Row> 
                            )) : null }    
                    </TabPane>
                </Tabs>
        </div>
    )
}

export default withRouter(ManualJobDetail);

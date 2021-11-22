import React, {useEffect, useState} from 'react';
import { Button, message, Tabs, Row, Col } from 'antd';
import { withRouter } from "react-router-dom";
import { authHeader, handleError } from '../../common/AuthHeader';

function ManualJobDetail(props) {
    const [ jobId, setJobID]= useState('');
    const [jobDetails, setJobDetails] = useState({});
    const [savingData, setSavingData] = useState({save : false, response : ''})

    //antd message config
    message.config({
        top: 100,
        duration: 2,
        maxCount: 1,
      });
    const { TabPane } = Tabs;

    useEffect(() =>{
        //1. When the component loads pull  app id, job id and other necessary details from url
        const data = props.location.pathname.split("/");

        //2. Once the appid and job id is obtained make call to get job details 
        fetch(`/api/job/job_details?app_id=${data[1]}&job_id=${data[3]}`, {
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
        setSavingData({saving : response ? true : false, response : response})
        fetch("/api/job/manualJobResponse", {
            headers: authHeader(),
            method : 'POST',
            body : JSON.stringify({
              jobId: jobId,  
              status: response === 'approved' ? 'completed' : 'failed',
              newManaulJob_meta :{jobName: jobDetails.name, response, respondedOn :  Date.now()}})
          })
          .then((response) => {
            if(response.ok) {
              return response.json();
            }
            handleError(response);
          })
          .then(data => {
            setSavingData({saving : false, response : ''});
            message.success('Your response has been recorded')
          })
          .catch(error => {
            console.log(error);
          }).finally(setTimeout(() =>{
            window.location.href = "/"
        }, 2000))
    }

    //When user clicks cancel button
    const handleCancel = () => {
      window.location.href = "/"
    }

    //styles
    const actionBtnsStyle ={ marginLeft : "10px"}

    //Buttons on tab pane
    const actions =
         <div> 
            <Button style={actionBtnsStyle} type="primary" value="approved" onClick={handleResponse} loading={savingData.saving && savingData.response === 'approved'}> Approve </Button>
            <Button style={actionBtnsStyle} danger type="default" value="rejected" onClick={handleResponse} loading={savingData.saving && savingData.response === 'rejected'}> Reject </Button> 
            <Button style={actionBtnsStyle} type="primary" ghost  value="rejected" onClick={handleCancel}> Cancel </Button>
        </div>
    //Job details
    const jobData = [{label : 'Title', value: jobDetails.title}, 
                      {label : 'Name', value : jobDetails.name},
                      {label : 'Job Type', value : jobDetails.jobType},
                      {label : 'Contact', value : jobDetails.contact},
                      {label : 'Created on', value : jobDetails.createdAt},
                    ]

    return (
        <div>
            <div className="assetTitle">Job : {jobDetails.name}</div>
               <Tabs  tabBarExtraContent={actions} >
                    <TabPane tab="Basic" key="1">
                      {
                      jobData.map((item, i) => 
                        (<Row  id={i}gutter={{ xs: 8, sm: 8, md: 8, lg: 8 }}>
                              <Col className="gutter-row" span={6}>
                                  <div >{item.label}</div>
                              </Col>
                              <Col className="gutter-row" span={18}>
                                  <div >{item.value}</div>
                              </Col>  
                            </Row> )
                      )
                    }
                    </TabPane>
                </Tabs> 
        </div>
    )
}

export default withRouter(ManualJobDetail);

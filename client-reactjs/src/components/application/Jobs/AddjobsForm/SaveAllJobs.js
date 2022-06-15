import { Button } from 'antd'
import React, { useState } from 'react'

const SaveAllJobsButton = ({jobDetailsList}) => {
  const [saveJobs, setSaveJobs] = useState({error:'', loading:false, result:{}});

  const handleSaveAllJobs = async () =>{
    setSaveJobs(prev =>({...prev, loading:true, error:""}));

    const promises = [];

    for (const key in jobDetailsList.current) {
      const jobDetails = jobDetailsList.current[key];
      promises.push(jobDetails.handleOk());
    }

    const result = await Promise.all(promises);
    console.log('-result-----------------------------------------');
    console.dir({result}, { depth: null });
    console.log('------------------------------------------');
    
    setSaveJobs(prev =>({...prev, loading: false, error:""}));
  }

  return (
    <Button type="primary" loading={saveJobs.loading} onClick={handleSaveAllJobs}>Save All Jobs</Button>
  )
}

export default SaveAllJobsButton
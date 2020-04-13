import React, { useState } from 'react'
import FileDetailsForm from '../components/application/FileDetails';
import JobDetailsForm from '../components/application/JobDetails';
import IndexDetailsForm from '../components/application/IndexDetails';

const useFileDetailsForm = () => {
  const [isShowing, setIsShowing] = useState(false);

  const toggle = () => {
    setIsShowing(!isShowing);
  }

  let dialogRef;

  function OpenDetailsForm ({...props}) {
  	console.log(props);
  	if(props.type == 'file')
  		return	<FileDetailsForm	onRef={ref => (dialogRef = ref)} {...props} />
  	else if(props.type == 'job')
  		return	<JobDetailsForm	onRef={ref => (dialogRef = ref)} {...props}/>
  	else if(props.type == 'index')
  		return	<IndexDetailsForm	onRef={ref => (dialogRef = ref)} {...props}/>
  }

  return {
    isShowing,
    toggle,
    OpenDetailsForm
  }
};

export default useFileDetailsForm;
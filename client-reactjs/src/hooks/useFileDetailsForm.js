import React, { useState } from 'react'
import FileDetailsForm from '../components/application/FileDetails';
import JobDetailsForm from '../components/application/JobDetails';
import IndexDetailsForm from '../components/application/IndexDetails';
import QueryDetailsForm from '../components/application/QueryDetails';


const useFileDetailsForm = () => {
  const [isShowing, setIsShowing] = useState(false);

  const toggle = () => {
    setIsShowing(!isShowing);
  }

  function OpenDetailsForm ({...props}) {
    let dialogRef;
  	if(props.type.toLowerCase() === 'file'.toLowerCase())
  		return	<FileDetailsForm	onRef={ref => (dialogRef = ref)} {...props} />
  	else if(props.type.toLowerCase() === 'job'.toLowerCase())
  		return	<JobDetailsForm	onRef={ref => (dialogRef = ref)} {...props}/>
  	else if(props.type.toLowerCase() === 'index'.toLowerCase())
  		return	<IndexDetailsForm	onRef={ref => (dialogRef = ref)} {...props}/>
    else if(props.type.toLowerCase() === 'query'.toLowerCase())
      return  <QueryDetailsForm onRef={ref => (dialogRef = ref)} {...props}/>
  }

  return {
    isShowing,
    toggle,
    OpenDetailsForm
  }
};

export default useFileDetailsForm;
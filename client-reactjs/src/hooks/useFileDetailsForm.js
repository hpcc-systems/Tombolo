import React, { useState } from 'react'
import FileDetailsForm from '../components/application/FileDetails';
import JobDetailsForm from '../components/application/Jobs/JobDetails';
import IndexDetailsForm from '../components/application/IndexDetails';
import QueryDetailsForm from '../components/application/QueryDetails';


const useFileDetailsForm = () => {
  const [isShowing, setIsShowing] = useState(false);

  const toggle = () => {
    setIsShowing(!isShowing);
  }

  function OpenDetailsForm (props) {
    const detailsForm  ={
      file:<FileDetailsForm {...props} />,
      job: <JobDetailsForm {...props}/>,
      index : <IndexDetailsForm {...props}/>,
      query: <QueryDetailsForm {...props}/>
    }

    const type= props.type.toLowerCase();

    return detailsForm[type];
  }

  return { isShowing, toggle, OpenDetailsForm }
};

export default useFileDetailsForm;
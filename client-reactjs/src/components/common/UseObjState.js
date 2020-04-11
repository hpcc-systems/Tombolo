import { useState } from 'react';
import { useMemo } from 'react';
const useObjState = initialObj => {
  const [obj, setObj] = useState(initialObj);
  const setObjHelper = useMemo( () => { 
    const helper = {}
    Object.keys(initialObj).forEach(key => {
      helper[key] = newVal => setObj({ ...obj, [key]: newVal });
    });
    return helper
  }, [])
  return [obj, setObjHelper];
};

export default useObjState;
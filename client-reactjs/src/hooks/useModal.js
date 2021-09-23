import { useState } from 'react';

const useModal = () => {
  const [isShowing, setIsShowing] = useState(false);
  const [action, setAction] = useState(null)

  function toggle() {
    setIsShowing(!isShowing);
  }

  function actionType(task){
    setAction(task)
  }

  return {
    isShowing,
    toggle,
    actionType,
    action
  }
};

export default useModal;
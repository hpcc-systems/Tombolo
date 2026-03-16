import { useState } from 'react';

interface UseModalReturn {
  isShowing: boolean;
  toggle: () => void;
  actionType: (task: string | null) => void;
  action: string | null;
}

const useModal = (): UseModalReturn => {
  const [isShowing, setIsShowing] = useState(false);
  const [action, setAction] = useState<string | null>(null);

  function toggle(): void {
    setIsShowing(!isShowing);
  }

  function actionType(task: string | null): void {
    setAction(task);
  }

  return {
    isShowing,
    toggle,
    actionType,
    action,
  };
};

export default useModal;

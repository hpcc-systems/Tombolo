import { useState, useEffect } from 'react';

interface WindowDimensions {
  height: number;
  width: number;
}

interface WindowSize {
  inner: WindowDimensions;
  outer: WindowDimensions;
}

function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    inner: { height: window.innerHeight, width: window.innerWidth },
    outer: { height: window.outerHeight, width: window.outerWidth },
  });

  //handle window resizing
  const handleWindowResize = (): void => {
    setWindowSize({
      inner: { height: window.innerHeight, width: window.innerWidth },
      outer: { height: window.outerHeight, width: window.outerWidth },
    });
  };

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize);
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleWindowResize);
  }, []);

  return windowSize;
}

export default useWindowSize;

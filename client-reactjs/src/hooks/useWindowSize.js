import {useState,  useEffect} from 'react'

function useWindowSize() {
    const [windowSize, setWindowSize] = useState({inner : {height : window.innerHeight, width: window.innerWidth},
                                                outer : {height : window.outerHeight, width: window.outerWidth}
                                                })

    //handle window resizing
    const handleWindowResize = () =>{
        setWindowSize({inner : {height : window.innerHeight, width: window.innerWidth},
                                outer : {height : window.outerHeight, width: window.outerWidth}
                                })}

    useEffect(() => {
        window.addEventListener('resize', handleWindowResize);
        // Remove event listener on cleanup
        return () => window.removeEventListener("resize", handleWindowResize);
    }, []);

    return windowSize;
}

export default useWindowSize;

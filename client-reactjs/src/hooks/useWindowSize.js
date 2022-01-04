import React, {useState,  useEffect} from 'react'

function useWindowSize() {
    const [size, setSize] = useState([window.innerHeight, window.innerWidth]);

    //handle window resizing
    const handleResize = () =>{
        setSize([window.innerHeight, window.innerWidth]);
    }

    useEffect(() => {
        window.addEventListener("resize", handleResize);
    }, []);

    return  size;
}

export default useWindowSize;

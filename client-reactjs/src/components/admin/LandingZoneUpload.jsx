import React, {useState, useEffect} from 'react';
import {useSelector} from "react-redux"
import { Upload } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import {Button} from "antd"
import { io } from "socket.io-client";

function LandingZoneUpload() {
  //Local States and variables
  const [files, setFiles] = useState([]);
  const [socket, setSocket] = useState(null);
  const authReducer = useSelector(state => state.authReducer)
  const devURL = 'http://localhost:3000/landingZoneFileUpload';
  const prodURL  = '/landingZoneFileUpload'

  // Socket io
  useEffect(() => {
    if(process.env.NODE_ENV === "development"){
      const socket = io(devURL, {
        transports: ["websocket"],
        auth : {
          token : authReducer?.user.token
        }
        });
        setSocket(socket);
    }else{
      const socket = io(prodURL, {
        transports: ["websocket"],
        auth : {
          token : authReducer.user.token
        }
        });
        setSocket(socket);
    }
  }, [])

  // Listining to msgs from socket
  useEffect(() =>{
    //When message is received from back end
    if(socket){
      socket.on("message", (message) =>{
        console.log("<<<< Message ", message)
      })
     }
  
     //Clean up socket connection when component unmounts
     return function cleanup(){
       if(socket){
         console.log("<<<< Killing socket connection to landing zone")
         socket.close()
       }
     }
  }, [socket])

  // <<<< Test
  useEffect(() =>{
    console.log("<<<< Files ", files)
  }, [files])

 

  //State and vars
  const { Dragger } = Upload;

  //Handle File Upload
  const handleFileUpload = () =>{
    //Test
    socket.emit('upload-files', {data : files[0].data})
    
    // Start by sending some file details to server
    socket.emit('start-upload', {fileName: files[0].name, fileSize: files[0].size});

    //when asked to supply the whole file
    socket.on('supply-file', (message) =>{
        let reader = new FileReader();
        reader.readAsArrayBuffer(files[0]);
        reader.onload = function(e){
          let arrayBuffer = e.target.result;
          socket.emit('upload-file', {
            fileName : files[0].name,
            data: arrayBuffer
          })
        }
      })
    
      //When server asks for a slice of a file
      socket.on('supply-slice', (message) =>{
        console.log(message, "<<<< Message")
        let slice = files[0].slice(message.sliceStart, message.sliceEnd);
        let reader = new FileReader();
        reader.readAsArrayBuffer(slice);
        reader.onload = function(e){
          let arrayBuffer = e.target.result;
          socket.emit('upload-slice', {
            fileName : files[0].name,
            data: arrayBuffer,
            sliceStartsAt : message.sliceEnd
          })
        }
      })

    }

  
   
  //Draggeer's props
  const props = {
    name: 'file',
    multiple: true,
    onChange(info) {
      const { status } = info.file;
      if (status !== 'uploading') {
      }
      if (status === 'done') {
        setFiles(info.file.originFileObj);
        let newFilesArray  = ([...files, info.file.originFileObj]);
        setFiles(newFilesArray);
      } else if (status === 'error') {
      }
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  
  };

  //customRequest
  const customRequest = ({ onSuccess }) => {
      onSuccess("ok");
  };
  


    return (
    <div>
        <Dragger 
        {...props}
        customRequest={customRequest}
        showUploadList={true}
        multiple={false}
        >
            <p className="ant-upload-drag-icon">
            <InboxOutlined />
            </p>
            <p className="ant-upload-text"><b>Click or drag file to this area to upload</b></p>
            <p className="ant-upload-hint">
            Support for a single or bulk upload. 
            </p>
        </Dragger>
        <Button onClick={handleFileUpload}> Upload</Button>
    </div>
    )
}

export default LandingZoneUpload



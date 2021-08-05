import React, {useState, useEffect} from 'react';
import {useSelector} from "react-redux"
import { Upload, Table, Select, message, Input  } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import {Button} from "antd"
import { io } from "socket.io-client";
import{LandingZoneUploadContainer,LandingZoneUploadContainer__table, columns } from "./landingZoneUploadStyles";
import {v4 as uuidv4} from 'uuid';
const { Option,  } = Select;

function LandingZoneUpload() {
  //Local States and variables
  const [files, setFiles] = useState([]);
  const [socket, setSocket] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [destinationFolder, setDestinationFolder] = useState(null)
  const [cluster, setCluster] = useState(null)
  const authReducer = useSelector(state => state.authReducer);
  const clusters = useSelector(state => state.applicationReducer.clusters);
  const devURL = 'http://localhost:3000/landingZoneFileUpload';
  const prodURL  = '/landingZoneFileUpload'

  useEffect(() => {
    // Socket io connection
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

  //Setting table data
  useEffect(() =>{
    console.log("<<<< Files ", files, files.length);
    console.log(typeof files)
    if(files.length > 0){
      files.map(item => {
        setTableData([...tableData, {key : uuidv4(), sno : tableData.length + 1, 
                                    type : item.type, fileName : item.name, fileSize : item.size, }]);
      })
    }
  }, [files])

 

  //State and vars
  const { Dragger } = Upload;

  //Handle File Upload
  const handleFileUpload = () =>{
    message.config({top:150,   maxCount: 2})

    if(!cluster){
      message.error("Select a cluster")
    }else if(!destinationFolder){
      message.error("Select upload destination folder")
    }
      else{
    // Start by sending some file details to server
    socket.emit('start-upload', {fileName: files[0].name, fileSize: files[0].size, cluster});

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

  // Select drop down
  function handleChange(value) {
    setCluster(value);
  }

    return (
        <LandingZoneUploadContainer>
          <Select defaultValue = ""  onChange={handleChange}  size="large"
         style={{width: "100%"}}>
            <Option value="" disabled>Select Cluster</Option>
            {clusters.map(item => {
                return <Option  value={JSON.stringify(item)}>{item.name}</Option>
            })}
        </Select>
        <Input placeholder="Folder"  size="large"/>

        
        
        <Dragger 
        {...props}
        customRequest={({ onSuccess }) => {
          onSuccess("ok");
      }}
        showUploadList={false}
        multiple={true}
        >
            <p className="ant-upload-drag-icon">
            <InboxOutlined />
            </p>
            <p className="ant-upload-text"><b>Click or drag file to this area to upload</b></p>
            <p className="ant-upload-hint">
            Support for a single or bulk upload. 
            </p>
        </Dragger>
        <span  style={{display : files.length > 0 ? "block" : "none"}}>
          <Table   columns={columns} dataSource={tableData} size="small" pagination={false} style={{width: "100%", maxHeight : "70vh", overflow: "auto"}}/>
        </span>

        <Button size="large" onClick={handleFileUpload} type="primary" block > Upload</Button>
        </LandingZoneUploadContainer>
    )
}

export default LandingZoneUpload;

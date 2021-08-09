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
  const [destinationFolder, setDestinationFolder] = useState("test_despray");
  const [cluster, setCluster] = useState(null);
  const [clusterIp, setClusterIp] = useState("10.173.147.1");
  const authReducer = useSelector(state => state.authReducer);
  const clusters = useSelector(state => state.applicationReducer.clusters);
  const devURL = 'http://localhost:3000/landingZoneFileUpload';
  const prodURL  = '/landingZoneFileUpload'
  const { Dragger } = Upload;

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
    if(files.length > 0){
      files.map(item => {
        console.log("<<<<<<<<<<<<<<<<<<<<< >>>>>>>>>>>>>> File", item.success)
        setTableData([ {key : uuidv4(), sno : tableData.length + 1, 
                                    // type : item.type,
                                     fileName : item.name, fileSize : item.size, uploadSuccess : item.success}]);
      })
      console.log("Table data <<<<<", tableData)
    }
  }, [files])


  //Handle File Upload
  const handleFileUpload = () =>{
    message.config({top:150,   maxCount: 2})
    if(!cluster){
      message.error("Select a cluster")
    }else if(!destinationFolder){
      message.error("Select  destination folder")
    }
    else if(!clusterIp){
      message.error("Select Cluster Ip")
    }  else if(files.length < 1){
      message.error("Add files")
    }
      else{
    // Start by sending some file details to server
    socket.emit('start-upload', {destinationFolder, cluster, clusterIp});
    files.map(item => {
      // data.push({id : item.uid, fileName : item.name, fileSize : item.size})
      if(item.size <= 10000000){
         let reader = new FileReader();
         reader.readAsArrayBuffer(item);
          reader.onload = function(e){
            let arrayBuffer = e.target.result;
            socket.emit('upload-file', {
              id : item.uid,
              fileName : item.name,
              data: arrayBuffer
            })
          }
      }else{
        console.log("<<<< Big files send in chunks")
      }
    })

    //Response
    socket.on('file-upload-response', (response => {
      console.log("<<<< Response ", response)
      let newFilesArray = files.map(item => {
        console.log("<<<< Current item ",  item.uid)
        if(item.uid === response.id){
          item.success = true;
          return item;
        }
        return item;
      })
      console.log("<<<< New files array:", newFilesArray)
      console.log("<<<<", files)
      setFiles(newFilesArray);
    }))


    // console.log("<<<< Data redy to be sent to server ", {data, clusters})
    // socket.emit('start-upload', {data, cluster});

    //when asked to supply the whole file
    // socket.on('supply-file', (item) =>{
    //   console.log("<<<<< file upload message ", item.item.id)
      // files.map(item  => {
      //   if(item === message){
      //     console.log("Small files <<<< Send now")
      //   }
      // })
        // let reader = new FileReader();
        // reader.readAsArrayBuffer(files[0]);
        // reader.onload = function(e){
        //   let arrayBuffer = e.target.result;
        //   socket.emit('upload-file', {
        //     fileName : files[0].name,
        //     data: arrayBuffer
        //   })
        // }
      // })


    
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
        // setFiles(info.file.originFileObj);
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

  useEffect(() =>{
    console.log(clusterIp, " <<<< Cluster IP")
  }, [clusterIp])
    return (
        <LandingZoneUploadContainer>
          <span>
            <small>Cluster</small>
            <Select defaultValue = "" style={{color: "red"}}  onChange={handleChange}  size="large"
              style={{width: "100%"}}>
                  {clusters.map((item, index) => {
                      return <Option key={index} value={JSON.stringify(item)}>{item.name}</Option>
                  })}
            </Select>
          </span>

          <span>
            <small>Cluster IP</small>
            <Input value= {clusterIp} onChange ={(e) => {setClusterIp(e.target.value)}} size="large"/>
          </span>

          <span>
            <small> Destination Folder</small>
            <Input  value= {destinationFolder} onChange ={(e) => {setDestinationFolder(e.target.value)}} size="large"/>
          </span>

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
        <span  style={{display : files.length > 0 ? "block" : "none", margin : "20px 0px 20px 0px"}}>
          <Table   columns={columns} dataSource={tableData} size="small" pagination={false} style={{width: "100%", maxHeight : "300px", overflow: "auto"}}/>
        </span>

        <Button size="large" onClick={handleFileUpload} type="primary" block > Upload</Button>
        </LandingZoneUploadContainer>
    )
}

export default LandingZoneUpload;
